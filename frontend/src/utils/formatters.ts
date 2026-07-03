export const money = (amount: number, currency = "PKR") =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount ?? 0));

export const formatDate = (value?: string) => (value ? new Date(value).toLocaleString() : "-");
