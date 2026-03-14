const ROLES = {
  Admin: "Admin",
  Manager: "Manager",
  Staff: "Staff",
} as const;

export type RoleType = keyof typeof ROLES;

export default ROLES;
