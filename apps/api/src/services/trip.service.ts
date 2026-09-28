import crypto from "node:crypto";
import { Role, TravelMode } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../errors/AppError.js";
import { CreateTripDto, UpdateMemberDto } from "../schemas/trip.schema.js";

export class TripService {
  /**
   * Generates a unique, readable barkada invite code (e.g. "ELYU-A4B7" or "GALA-9X2Y").
   */
  private async generateUniqueInviteCode(title: string): Promise<string> {
    const prefix =
      title
        .replace(/[^a-zA-Z]/g, "")
        .substring(0, 4)
        .toUpperCase() || "GALA";

    for (let attempts = 0; attempts < 10; attempts++) {
      const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
      const code = `${prefix}-${suffix}`;

      const existing = await prisma.trip.findUnique({
        where: { inviteCode: code },
      });

      if (!existing) {
        return code;
      }
    }

    // Fallback to random 8-character token if collision persists
    return `GALA-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  }

  async createTrip(userId: string, dto: CreateTripDto) {
    let inviteCode = dto.inviteCode;

    if (inviteCode) {
      const existing = await prisma.trip.findUnique({
        where: { inviteCode },
      });
      if (existing) {
        throw new ConflictError(
          `Invite code "${inviteCode}" is already taken. Please choose another or let it auto-generate.`,
        );
      }
    } else {
      inviteCode = await this.generateUniqueInviteCode(dto.title);
    }

    return prisma.$transaction(async (tx) => {
      const trip = await tx.trip.create({
        data: {
          title: dto.title,
          destination: dto.destination,
          startDate: dto.startDate,
          endDate: dto.endDate,
          travelMode: dto.travelMode as TravelMode,
          inviteCode: inviteCode as string,
          createdById: userId,
          members: {
            create: {
              userId,
              role: Role.TRIP_LEAD,
            },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                  avatarUrl: true,
                },
              },
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return trip;
    });
  }

  async getUserTrips(userId: string) {
    const trips = await prisma.trip.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            expenses: true,
            packingItems: true,
            itineraryItems: true,
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });

    return trips;
  }

  async getTripById(userId: string, tripId: string) {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatarUrl: true,
                gcashNumber: true,
                mayaNumber: true,
              },
            },
          },
          orderBy: {
            joinedAt: "asc",
          },
        },
        packingItems: {
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        weatherAlerts: true,
        itineraryItems: {
          orderBy: {
            dayNumber: "asc",
          },
        },
      },
    });

    if (!trip) {
      throw new NotFoundError("Trip not found");
    }

    // Security check: Must be a member of this trip
    let isMember = false;
    for (const member of trip.members) {
      if (member.userId === userId) {
        isMember = true;
        break;
      }
    }

    if (!isMember) {
      throw new ForbiddenError("You are not a member of this trip");
    }

    return trip;
  }

  async joinTripByInviteCode(userId: string, inviteCode: string) {
    const trip = await prisma.trip.findUnique({
      where: { inviteCode: inviteCode.toUpperCase() },
      include: {
        members: true,
      },
    });

    if (!trip) {
      throw new NotFoundError(
        `Trip with invite code "${inviteCode}" does not exist`,
      );
    }

    for (const member of trip.members) {
      if (member.userId === userId) {
        throw new ConflictError("You are already a member of this trip");
      }
    }

    const newMember = await prisma.tripMember.create({
      data: {
        tripId: trip.id,
        userId,
        role: Role.MEMBER,
      },
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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
    });

    return newMember;
  }

  async updateMemberPreferences(
    requesterId: string,
    tripId: string,
    targetUserId: string,
    dto: UpdateMemberDto,
  ) {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { members: true },
    });

    if (!trip) {
      throw new NotFoundError("Trip not found");
    }

    let requesterMember = null;
    let targetMember = null;

    for (const member of trip.members) {
      if (member.userId === requesterId) {
        requesterMember = member;
      }
      if (member.userId === targetUserId) {
        targetMember = member;
      }
    }

    if (!requesterMember) {
      throw new ForbiddenError("You are not a member of this trip");
    }

    if (!targetMember) {
      throw new NotFoundError("Target user is not a member of this trip");
    }

    const isTripLead = requesterMember.role === Role.TRIP_LEAD;
    const isSelf = requesterId === targetUserId;

    if (!isTripLead && !isSelf) {
      throw new ForbiddenError(
        "You do not have permission to modify another member's preferences",
      );
    }

    // Role mutations are strictly restricted to TRIP_LEAD
    if (dto.role !== undefined && !isTripLead) {
      throw new ForbiddenError("Only trip leads can assign or change roles");
    }

    const updated = await prisma.tripMember.update({
      where: {
        tripId_userId: {
          tripId,
          userId: targetUserId,
        },
      },
      data: {
        ...(dto.role !== undefined && { role: dto.role as Role }),
        ...(dto.isDriver !== undefined && { isDriver: dto.isDriver }),
        ...(dto.vehicleId !== undefined && { vehicleId: dto.vehicleId }),
        ...(dto.isNonDrinker !== undefined && {
          isNonDrinker: dto.isNonDrinker,
        }),
        ...(dto.dietaryNotes !== undefined && {
          dietaryNotes: dto.dietaryNotes,
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
    });

    return updated;
  }

  async removeTripMember(
    requesterId: string,
    tripId: string,
    targetUserId: string,
  ) {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { members: true },
    });

    if (!trip) {
      throw new NotFoundError("Trip not found");
    }

    let requesterMember = null;
    let targetMember = null;

    for (const member of trip.members) {
      if (member.userId === requesterId) {
        requesterMember = member;
      }
      if (member.userId === targetUserId) {
        targetMember = member;
      }
    }

    if (!requesterMember) {
      throw new ForbiddenError("You are not a member of this trip");
    }

    if (!targetMember) {
      throw new NotFoundError("Target member not found in this trip");
    }

    const isTripLead = requesterMember.role === Role.TRIP_LEAD;
    const isSelf = requesterId === targetUserId;

    if (!isTripLead && !isSelf) {
      throw new ForbiddenError(
        "Only the trip lead or the member themselves can leave or remove members",
      );
    }

    // Cannot remove the trip lead if they are the only organizer
    if (targetMember.role === Role.TRIP_LEAD && trip.members.length > 1) {
      let leadCount = 0;
      for (const m of trip.members) {
        if (m.role === Role.TRIP_LEAD) leadCount++;
      }
      if (leadCount <= 1) {
        throw new BadRequestError(
          "Cannot remove the only trip lead. Please transfer trip leadership to another member first.",
        );
      }
    }

    await prisma.tripMember.delete({
      where: {
        tripId_userId: {
          tripId,
          userId: targetUserId,
        },
      },
    });

    return {
      message: "Member removed successfully",
      tripId,
      userId: targetUserId,
    };
  }
}

export const tripService = new TripService();
