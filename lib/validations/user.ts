// apps/admin/lib/validations/user.ts

import * as z from "zod";

export const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  status: z.enum(["active", "suspended"]),
  is_platform_admin: z.boolean(), // Removed .default() here to keep types strict
  role_id: z.string().min(1, "Please select a role"),
  password: z.string().min(8).optional().or(z.literal("")),
});

// export const userSchema = z.object({
//   name: z.string().min(2, "Name must be at least 2 characters"),
//   email: z.string().email("Invalid email address"),
//   status: z.enum(["active", "suspended"]),
//   is_platform_admin: z.boolean().default(false),
//   role_id: z.string().uuid("Please select a valid role"), // Added role_id
//   password: z.string().min(8).optional().or(z.literal("")),
// });

export type UserFormValues = z.infer<typeof userSchema>;

/* import * as z from "zod";

export const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  status: z.enum(["active", "suspended"]).default("active"),
  is_platform_admin: z.boolean().default(false),
  // If creating a new user, you might want a password field
  password: z.string().min(8, "Password must be at least 8 characters").optional().or(z.literal("")),
});

export type UserFormData = z.infer<typeof userSchema>;

export type UserFormValues = z.infer<typeof userSchema>; */