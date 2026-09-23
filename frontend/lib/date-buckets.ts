export function startOfBusinessWeek(businessDate: string): string {
  const d = new Date(businessDate + "T00:00:00");
  const day = d.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diffToMonday);
  return d.toISOString().slice(0, 10);
}

export function startOfBusinessMonth(businessDate: string): string {
  return businessDate.slice(0, 7) + "-01";
}