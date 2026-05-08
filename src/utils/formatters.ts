export const fmtKES = (n: number | string | null | undefined) => {
  const v = Number(n ?? 0);
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(v);
};

export const fmtDate = (d: string | Date | null | undefined) => {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return String(d);
  }
};

export const fmtDateTime = (d: string | Date | null | undefined) => {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleString("en-KE");
  } catch {
    return String(d);
  }
};
