"use client";

import { useCallback, useEffect, useState } from "react";
import { enqueue, flush, onOutboxChange, pending, type FlushResult } from "@/lib/offline/outbox";
import type { LogEntry, LogMap } from "@/lib/tracker/data";

export type SyncState = { pendingCount: number; online: boolean; last: FlushResult | null };

/**
 * Local source of truth for check-ins: server data merged with anything still
 * waiting in the offline outbox. Changes apply instantly and sync in the background.
 */
export function useLogs(initial: LogMap) {
  const [logs, setLogs] = useState<LogMap>(initial);
  const [sync, setSync] = useState<SyncState>({ pendingCount: 0, online: true, last: null });

  useEffect(() => {
    let cancelled = false;
    const loadPending = () => pending().catch(() => [] as Awaited<ReturnType<typeof pending>>);
    const refreshPending = () =>
      loadPending().then((items) => {
        if (!cancelled) setSync((s) => ({ ...s, pendingCount: items.length, online: navigator.onLine }));
      });
    // Overlay unsynced local changes on top of what the server (or the cached page) rendered.
    loadPending().then((items) => {
      if (cancelled) return;
      setSync((s) => ({ ...s, pendingCount: items.length, online: navigator.onLine }));
      if (!items.length) return;
      setLogs((prev) => {
        const next = { ...prev };
        for (const e of items) next[e.habitId] = { ...next[e.habitId], [e.logDate]: { completed: e.completed, value: e.value } };
        return next;
      });
    });
    const run = () => flush().then((last) => setSync((s) => ({ ...s, last })));
    run();
    const onOnline = () => {
      setSync((s) => ({ ...s, online: true }));
      run();
    };
    const onOffline = () => setSync((s) => ({ ...s, online: false }));
    const onVisible = () => document.visibilityState === "visible" && run();
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onVisible);
    const off = onOutboxChange(() => void refreshPending());
    return () => {
      cancelled = true;
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisible);
      off();
    };
  }, []);

  const setEntry = useCallback((habitId: string, logDate: string, entry: LogEntry) => {
    setLogs((prev) => ({ ...prev, [habitId]: { ...prev[habitId], [logDate]: entry } }));
    enqueue({ habitId, logDate, ...entry })
      .then(() => flush())
      .then((last) => setSync((s) => ({ ...s, last })))
      .catch(() => {});
  }, []);

  return { logs, setEntry, sync };
}
