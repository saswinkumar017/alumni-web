const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX = /^https?:\/\/.+\..+/i;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PHONE_REGEX = /^\+?[\d\s\-().]{7,20}$/;
const HEX_COLOR_REGEX = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const ALPHANUMERIC_REGEX = /^[a-zA-Z0-9]+$/;
const NUMERIC_REGEX = /^-?\d+(\.\d+)?$/;

export function isEmail(value: string): boolean {
  return EMAIL_REGEX.test(value);
}

export function isUrl(value: string): boolean {
  return URL_REGEX.test(value);
}

export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

export function isPhone(value: string): boolean {
  return PHONE_REGEX.test(value);
}

export function isAlphanumeric(value: string): boolean {
  return ALPHANUMERIC_REGEX.test(value);
}

export function isNumeric(value: string): boolean {
  return NUMERIC_REGEX.test(value);
}

export function isHexColor(value: string): boolean {
  return HEX_COLOR_REGEX.test(value);
}

export function isInLength(value: string, min: number, max: number): boolean {
  return value.length >= min && value.length <= max;
}

export function matches(value: string, pattern: RegExp): boolean {
  return pattern.test(value);
}