import { Card } from "@/components/ui";

export function ComingSoon({ title, body }: { title: string; body: string }) {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <Card>
        <p className="leading-relaxed text-muted">{body}</p>
      </Card>
    </>
  );
}
