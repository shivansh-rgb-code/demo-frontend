export function Banner({
  kind,
  children,
}: {
  kind: "error" | "info" | "success";
  children: string;
}) {
  return <div className={`banner banner-${kind}`}>{children}</div>;
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return <p className="muted">{label}</p>;
}

export function Empty({ children }: { children: string }) {
  return <p className="muted">{children}</p>;
}
