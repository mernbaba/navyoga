import type { FormEvent } from "react";

/**
 * Shared phone-number rules for all single-field phone inputs (sadhakas,
 * tutors, frontline agents, employees, etc.). Phone numbers are digit-only
 * and must be between 8 and 15 digits.
 */
export const PHONE_MIN_LENGTH = 8;
export const PHONE_MAX_LENGTH = 15;
export const PHONE_PATTERN = `\\d{${PHONE_MIN_LENGTH},${PHONE_MAX_LENGTH}}`;
export const PHONE_TITLE = "Phone must be 8 to 15 digits";

/** Strip non-digit characters and cap at the maximum phone length. */
export function sanitizePhone(value: string): string {
  return value.replace(/\D/g, "").slice(0, PHONE_MAX_LENGTH);
}

/** Validate a fully-entered phone number (used before submitting). */
export function isValidPhone(value: string): boolean {
  return new RegExp(`^\\d{${PHONE_MIN_LENGTH},${PHONE_MAX_LENGTH}}$`).test(value);
}

/**
 * `onInput` handler for uncontrolled phone `<input>` fields. Sanitizes the
 * value while preserving the caret position, so editing in the middle of the
 * value no longer jumps the cursor to the end.
 */
export function handlePhoneInput(event: FormEvent<HTMLInputElement>): void {
  const el = event.currentTarget;
  const prev = el.value;
  const cleaned = sanitizePhone(prev);
  if (cleaned !== prev) {
    const caret = (el.selectionStart ?? prev.length) - (prev.length - cleaned.length);
    el.value = cleaned;
    el.setSelectionRange(caret, caret);
  }
}
