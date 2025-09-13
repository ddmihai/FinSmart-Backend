export function generateUKSortCode(): string {
  const n = () => Math.floor(Math.random() * 10);
  return `${n()}${n()}-${n()}${n()}-${n()}${n()}`;
}

export function generateUKAccountNumber(): string {
  let s = '';
  for (let i = 0; i < 8; i++) s += Math.floor(Math.random() * 10).toString();
  return s;
}

export function generateCardNumber(): string {
  // Simple Luhn-valid 16-digit number starting with 4 (Visa-like)
  const base = ['4'];
  while (base.length < 15) base.push(Math.floor(Math.random() * 10).toString());
  const check = luhnCheckDigit(base.join(''));
  return base.join('') + check;
}

function luhnCheckDigit(num: string): string {
  const arr = num.split('').reverse().map(Number);
  const sum = arr.reduce((acc, d, i) => {
    if (i % 2 === 0) return acc + d;
    const dd = d * 2;
    return acc + (dd > 9 ? dd - 9 : dd);
  }, 0);
  return ((10 - (sum % 10)) % 10).toString();
}

export function generateCVV(): string {
  return String(Math.floor(100 + Math.random() * 900));
}

export function generateExpiry(): { month: number; year: number } {
  const now = new Date();
  const year = now.getFullYear() + 4;
  const month = Math.floor(1 + Math.random() * 12);
  return { month, year };
}

