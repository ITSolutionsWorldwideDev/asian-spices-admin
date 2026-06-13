//  apps/admin/lib/validations/roles.ts

import * as z from "zod";

export const roleSchema = z.object({
  key: z.string().min(2, "Role key is required (e.g., manager)"),
  scope: z.enum(["platform", "store"]),
  permissions: z.array(z.string().uuid()).min(1, "Select at least one permission"),
});

export type RoleFormValues = z.infer<typeof roleSchema>;