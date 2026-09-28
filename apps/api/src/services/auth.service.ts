import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { hashPassword, comparePassword } from "../lib/password.js";
import { signJwtToken } from "../lib/jwt.js";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../errors/AppError.js";
import { RegisterDto, LoginDto } from "../schemas/auth.schema.js";

export class AuthService {
  async register(dto: RegisterDto) {
    const existing = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictError("An account with this email already exists");
    }

    const passwordHash = await hashPassword(dto.password);

    const createData: Prisma.UserCreateInput = {
      email: dto.email.toLowerCase(),
      name: dto.name,
      passwordHash,
      phone: dto.phone,
      gcashNumber: dto.gcashNumber,
      mayaNumber: dto.mayaNumber,
      avatarUrl: dto.avatarUrl,
    };

    const user = await prisma.user.create({
      data: createData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        gcashNumber: true,
        mayaNumber: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    const token = signJwtToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    return { user, token };
  }

  async login(dto: LoginDto) {
    const user = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isMatch = await comparePassword(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const token = signJwtToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        gcashNumber: user.gcashNumber,
        mayaNumber: user.mayaNumber,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        gcashNumber: true,
        mayaNumber: true,
        avatarUrl: true,
        createdAt: true,
        memberships: {
          include: {
            trip: {
              select: {
                id: true,
                title: true,
                destination: true,
                startDate: true,
                endDate: true,
                travelMode: true,
                inviteCode: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return user;
  }
}

export const authService = new AuthService();
