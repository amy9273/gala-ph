import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";

export interface JwtUserPayload {
  userId: string;
  email: string;
  name: string;
}

export function signJwtToken(
  payload: JwtUserPayload,
  expiresIn: string | number = "7d",
): string {
  const options: SignOptions = {
    expiresIn: expiresIn as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyJwtToken(token: string): JwtUserPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtUserPayload;
}
