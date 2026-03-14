export function daysToExpiry(expiryDate: any) {
  const today = new Date();
  return Math.ceil(((new Date(expiryDate) as any) - (today as any)) / (1000 * 60 * 60 * 24));
}

export default { daysToExpiry };
