import { hash, compare } from "bcryptjs";

export const PASSWORD_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, PASSWORD_ROUNDS);
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  return compare(password, hashed);
}
