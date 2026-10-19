"use client";

/**
 * Offline-first check-ins. Every change is written to an IndexedDB outbox
 * keyed by habit+day (so repeated taps collapse into the latest state), then
 * flushed to /api/logs whenever we're online.
 */
export type OutboxEntry = {
  habitId: string;
  logDate: string;
  completed: boolean;
  value: number | null;
};

const DB_NAME = "istiqamah";
const STORE = "outbox";
const key = (e: Pick<OutboxEntry, "habitId" | "logDate">) => `${e.habitId}:${e.logDate}`;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T> | void): Promise<T | void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => {
      db.close();
      resolve(req ? req.result : undefined);
    };
    t.onerror = () => reject(t.error);
  });
}

export async function enqueue(entry: OutboxEntry) {
  await tx("readwrite", (s) => s.put(entry, key(entry)));
  notify();
}

export async function pending(): Promise<OutboxEntry[]> {
  return ((await tx("readonly", (s) => s.getAll())) as OutboxEntry[] | undefined) ?? [];
}

async function removeIfUnchanged(sent: OutboxEntry[]) {
  // Only delete entries that weren't changed again while the request was in flight.
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction(STORE, "readwrite");
    const store = t.objectStore(STORE);
    for (const e of sent) {
      const get = store.get(key(e));
      get.onsuccess = () => {
        const cur = get.result as OutboxEntry | undefined;
        if (cur && cur.completed === e.completed && cur.value === e.value) store.delete(key(e));
      };
    }
    t.oncomplete = () => {
      db.close();
      resolve();
    };
    t.onerror = () => reject(t.error);
  });
}

export type FlushResult = "synced" | "offline" | "unauthorized" | "idle";

let inFlight: Promise<FlushResult> | null = null;

export function flush(): Promise<FlushResult> {
  inFlight ??= doFlush().finally(() => {
    inFlight = null;
    notify();
  });
  return inFlight;
}

async function doFlush(): Promise<FlushResult> {
  const entries = await pending();
  if (!entries.length) return "idle";
  if (!navigator.onLine) return "offline";
  let res: Response;
  try {
    res = await fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries }),
    });
  } catch {
    return "offline";
  }
  if (res.status === 401) return "unauthorized";
  // 2xx = saved. Other 4xx = the server will never accept these (e.g. a deleted
  // habit or a day outside the edit window), so drop them rather than retry forever.
  if (res.ok || (res.status >= 400 && res.status < 500)) {
    await removeIfUnchanged(entries);
    return "synced";
  }
  return "offline";
}

const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}
export function onOutboxChange(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
