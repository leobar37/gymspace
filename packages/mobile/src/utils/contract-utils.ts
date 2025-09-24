export function calculateDaysRemaining(endDate: string | Date): number {
  const end = new Date(endDate);
  const now = new Date();

  const timeDiff = end.getTime() - now.getTime();

  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
}