import { z } from 'zod'

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Enter your email or username'),
  password: z.string().min(1, 'Enter your password'),
})

export type LoginInput = z.infer<typeof loginSchema>

// Mirrors coloc.api's RegisterDto / CreateUserDto rules.
export const registerSchema = z.object({
  firstname: z.string().trim().min(1, 'Enter your first name').max(50),
  lastname: z.string().trim().min(1, 'Enter your last name').max(50),
  username: z
    .string()
    .trim()
    .min(3, 'At least 3 characters')
    .max(30, 'At most 30 characters')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Letters, numbers, dots, underscores and hyphens only'),
  email: z.email('Enter a valid email').max(254),
  password: z.string().min(8, 'At least 8 characters').max(72, 'At most 72 characters'),
  countryId: z.coerce.number<string>().int().positive('Choose your country'),
  birthDate: z.iso
    .date('Enter your birth date')
    .refine((d) => new Date(d) < new Date(), 'Your birth date must be in the past'),
})

export type RegisterValues = z.infer<typeof registerSchema>
export type RegisterFormInput = z.input<typeof registerSchema>
