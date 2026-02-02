import { z } from "zod";

// RFC-compliant email validation with plus addressing and subdomain support
const EMAIL_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?(\+[a-zA-Z0-9._-]+)?@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

// Auth-specific email schema with normalization
export const authEmailSchema = z
  .string()
  .trim() // Remove leading/trailing spaces
  .min(1, "Email is required")
  .email("Please enter a valid email address")
  .refine(
    (email) => {
      // Additional validation for edge cases
      if (email.includes('..')) return false; // No consecutive dots
      if (email.includes('@@')) return false; // No multiple @
      if (email.startsWith('.') || email.endsWith('.')) return false; // No leading/trailing dots
      if (email.includes('@.') || email.includes('.@')) return false; // No empty labels
      
      return EMAIL_REGEX.test(email);
    },
    "Please enter a valid email address"
  )
  .transform((email) => email.toLowerCase()); // Normalize to lowercase

// Helper for checking if a string looks like an email (for login identifier detection)
export function isEmailLike(identifier: string): boolean {
  return identifier.includes('@') && EMAIL_REGEX.test(identifier.trim().toLowerCase());
}

// Helper for manual email validation in forms
export function validateEmail(email: string): { isValid: boolean; normalized?: string; error?: string } {
  try {
    const normalized = authEmailSchema.parse(email);
    return { isValid: true, normalized };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0]?.message || "Invalid email" };
    }
    return { isValid: false, error: "Invalid email" };
  }
}

// Check if email is already registered (for async validation)
export async function checkEmailAvailability(email: string): Promise<{ available: boolean; error?: string }> {
  try {
    const { isValid, normalized } = validateEmail(email);
    if (!isValid) {
      return { available: false, error: "Invalid email format" };
    }
    
    const response = await fetch(`/api/check-email?email=${encodeURIComponent(normalized!)}`);
    const data = await response.json();
    
    if (response.ok) {
      return { available: data.available };
    } else {
      // Rate limited or other error - don't show specific error to user
      return { available: true }; // Assume available to avoid blocking
    }
  } catch (error) {
    // Network error - don't block user
    return { available: true };
  }
}