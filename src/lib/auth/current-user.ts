import { cache } from "react";
import { getSessionUserId } from "./session";
import {
  getUserWithRoles,
  getUserPermissions,
} from "@/server/repositories/user-repository";

export interface CurrentUser {
  id: string;
  username: string;
  displayName: string;
  roles: string[];
  permissions: string[];
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const user = await getUserWithRoles(userId);
  if (!user) return null;

  const permissions = await getUserPermissions(userId);

  return {
    id: user.user.id,
    username: user.user.username,
    displayName: user.user.displayName,
    roles: user.roles,
    permissions,
  };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getCurrentUser()) !== null;
}
