export const Roles = {
  TEACHER: "TEACHER",
  ADMIN: "ADMIN",
  USER: "USER",
} as const;

export type RoleType = keyof typeof Roles;