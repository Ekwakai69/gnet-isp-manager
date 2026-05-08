import { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  rows,
  isLoading,
  empty = "No records.",
  onRowClick,
}: {
  columns: Column<T>[];
  rows: T[];
  isLoading?: boolean;
  empty?: string;
  onRowClick?: (row: T) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-md border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={"px-3 py-2 " + (c.className || "")}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr><td colSpan={columns.length} className="px-3 py-6 text-center text-muted-foreground">Loading...</td></tr>
          )}
          {!isLoading && rows.length === 0 && (
            <tr><td colSpan={columns.length} className="px-3 py-6 text-center text-muted-foreground">{empty}</td></tr>
          )}
          {!isLoading && rows.map((row, i) => (
            <tr
              key={row.id ?? i}
              onClick={() => onRowClick?.(row)}
              className={"border-t " + (onRowClick ? "cursor-pointer hover:bg-accent/50" : "")}
            >
              {columns.map((c) => (
                <td key={c.key} className={"px-3 py-2 " + (c.className || "")}>
                  {c.render ? c.render(row) : (row as any)[c.key] ?? "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StatusBadge({ status }: { status?: string }) {
  const s = (status || "").toLowerCase();
  const cls =
    s.includes("active") || s === "paid" || s === "online" || s === "resolved"
      ? "bg-secondary text-secondary-foreground"
      : s.includes("pending") || s.includes("open")
      ? "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400"
      : s.includes("disabled") || s.includes("closed") || s.includes("offline") || s.includes("failed")
      ? "bg-destructive/15 text-destructive"
      : "bg-muted text-muted-foreground";
  return <span className={"inline-flex rounded-full px-2 py-0.5 text-xs font-medium " + cls}>{status || "-"}</span>;
}
