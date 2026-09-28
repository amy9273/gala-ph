import { Request, Response, NextFunction } from "express";
import { verifyJwtToken } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";
import { UnauthorizedError } from "../errors/AppError.js";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  gcashNumber?: string | null;
  mayaNumber?: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next(new UnauthorizedError("Authentication token required"));
    return;
  }

  const token = authHeader.substring(7).trim();

  if (!token) {
    next(new UnauthorizedError("Authentication token required"));
    return;
  }

  try {
    const payload = verifyJwtToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        gcashNumber: true,
        mayaNumber: true,
      },
    });

    if (!user) {
      next(new UnauthorizedError("User account no longer exists"));
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    next(new UnauthorizedError("Invalid or expired authentication token"));
  }
}
