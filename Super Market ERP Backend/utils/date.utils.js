export function daysToExpiry(expiryDate) {
  const today = new Date();
  return Math.ceil((new Date(expiryDate) - today) / (1000 * 60 * 60 * 24));
}

export default { daysToExpiry };
