export const Roles = { 
  ADMIN: "ADMIN",
  USER: "USER",
} as const;

export type RoleType = keyof typeof Roles;