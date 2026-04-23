import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const SALT_ROUNDS = 12;

export const hashPassword = (value: string) => bcrypt.hash(value, SALT_ROUNDS);

export const comparePassword = (value: string, hash: string) => bcrypt.compare(value, hash);

export const hashToken = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

export const createOpaqueToken = () => crypto.randomBytes(32).toString("hex");
