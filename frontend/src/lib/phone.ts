export const PHONE_REGEX = /^03\d{8}$/;

export function normalizePhone(phone: string): string {
  return phone.replace(/\s/g, "");
}

export function isValidPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  return PHONE_REGEX.test(normalizePhone(phone));
}

export const PHONE_INVALID_MESSAGE =
  "Numéro de téléphone invalide (format : 03XXXXXXXX)";
