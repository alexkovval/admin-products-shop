import { z } from "zod";

const NAME_RE = /^[^\d\W]+([\s'-][^\d\W]+)*$/u;
const PHONE_ALLOWED_RE = /^[0-9+\-().\s]+$/;

export const customerFormSchema = z.object({
  first_name: z
    .string()
    .min(1, "First name is required")
    .regex(NAME_RE, "First name may only contain letters, spaces, hyphens, and apostrophes."),
  last_name: z
    .string()
    .min(1, "Last name is required")
    .regex(NAME_RE, "Last name may only contain letters, spaces, hyphens, and apostrophes."),
  email: z.string().min(1, "Email is required").email("Enter a valid email address."),
  phone_number: z
    .string()
    .min(1, "Phone number is required")
    .regex(PHONE_ALLOWED_RE, "Phone number may only contain digits, spaces, and + - ( ) .")
    .refine((v) => v.replace(/\D/g, "").length >= 7, "Phone number looks too short."),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;
