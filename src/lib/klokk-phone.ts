// Phone numbers are typed in many ways ("0412 345 678", "(02) 6123 4567"). HighLevel only
// accepts international format (+61412345678), so numbers are tidied before they are sent.
// Numbers with a leading "+" or "00" keep their own country; a leading 0 is treated as Australian.

export function toInternationalPhone(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  let digits = raw.replace(/[^\d+]/g, "");
  if (!digits) return undefined;
  if (digits.startsWith("00")) digits = `+${digits.slice(2)}`;
  if (digits.startsWith("+")) {
    const rest = digits.slice(1).replace(/\D/g, "");
    return rest.length >= 7 ? `+${rest}` : undefined;
  }
  digits = digits.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits.length >= 8 ? `+61${digits}` : undefined;
}
