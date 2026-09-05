export function maskName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed.includes(" ")) {
    if (trimmed.length <= 2) return trimmed;
    return trimmed[0] + "*".repeat(trimmed.length - 1);
  }
  const parts = trimmed.split(/\s+/);
  return parts.map((p, i) => {
    if (i === 0) return p;
    if (p.length <= 1) return p;
    return p[0] + "*".repeat(p.length - 1);
  }).join(" ");
}

export function maskEmail(email: string): string {
  const parts = email.split("@");
  if (parts.length !== 2) return email;
  const local = parts[0];
  const domain = parts[1];
  if (!local || !domain) return email;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${"*".repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return "***";
  const visible = digits.length > 10 ? 4 : 3;
  return digits.slice(0, visible).padEnd(digits.length - visible, "*") + digits.slice(-visible);
}

export function maskString(value: string, visibleFirst = 1, visibleLast = 1): string {
  if (value.length <= visibleFirst + visibleLast) return value;
  return value.slice(0, visibleFirst) + "*".repeat(value.length - visibleFirst - visibleLast) + value.slice(-visibleLast);
}

export function isPiiField(field: string): boolean {
  const piiFields = [
    "email", "phone", "phoneNumber", "mobile", "mobileNumber",
    "address", "street", "city", "state", "zip", "postalCode",
    "dob", "birthDate", "dateOfBirth",
    "ssn", "pan", "aadhaar", "passport",
  ];
  return piiFields.includes(field);
}