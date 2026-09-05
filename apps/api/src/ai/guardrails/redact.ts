const EMAIL = /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g;
const PHONE = /(?<!\w)\+?\d[\d\s().-]{7,}\d\b/g;

export function redactPII(text: string): string {
  return text.replace(EMAIL, "[email]").replace(PHONE, "[phone]");
}
