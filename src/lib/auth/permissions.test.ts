import { describe, it, expect } from "vitest";

import {
  hasAnyRole,
  hasPermission,
  hasAllPermissions,
  requirePermission,
} from "./permissions";

describe("permissions", () => {
  it("hasAnyRole matches any allowed role", () => {
    expect(hasAnyRole(["cashier"], ["owner", "cashier"])).toBe(true);
    expect(hasAnyRole(["viewer"], ["owner", "manager"])).toBe(false);
  });

  it("hasPermission checks a single permission", () => {
    expect(hasPermission(["products:read"], "products:read")).toBe(true);
    expect(hasPermission(["products:read"], "products:delete")).toBe(false);
  });

  it("hasAllPermissions requires every permission", () => {
    expect(hasAllPermissions(["a", "b"], ["a", "b"])).toBe(true);
    expect(hasAllPermissions(["a"], ["a", "b"])).toBe(false);
  });

  it("requirePermission mirrors hasPermission", () => {
    expect(requirePermission(["users:read"], "users:read")).toBe(true);
    expect(requirePermission([], "users:read")).toBe(false);
  });
});
