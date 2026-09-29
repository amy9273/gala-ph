import { prisma } from "../lib/prisma.js";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../errors/AppError.js";
import {
  CreatePackingItemDto,
  UpdatePackingItemDto,
} from "../schemas/packing.schema.js";
import { broadcastToTrip } from "../sockets/socket.server.js";

export class PackingService {
  /**
   * Asserts that a user is an active member of the given trip.
   */
  private async assertTripMember(tripId: string, userId: string) {
    const membership = await prisma.tripMember.findUnique({
      where: {
        tripId_userId: {
          tripId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenError(
        "You are not authorized to access or modify this trip's packing list",
      );
    }

    return membership;
  }

  /**
   * Retrieves all packing items for a trip with summary progress metrics.
   */
  async getPackingItems(tripId: string, userId: string) {
    await this.assertTripMember(tripId, userId);

    const items = await prisma.packingItem.findMany({
      where: { tripId },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [{ category: "asc" }, { createdAt: "asc" }],
    });

    const totalItems = items.length;
    let packedItems = 0;
    for (const item of items) {
      if (item.isPacked) {
        packedItems++;
      }
    }
    const unpackedItems = totalItems - packedItems;
    const completionPercentage =
      totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;

    return {
      tripId,
      summary: {
        totalItems,
        packedItems,
        unpackedItems,
        completionPercentage,
      },
      items,
    };
  }

  /**
   * Creates a new Bayanihan packing item and broadcasts the update in real-time.
   */
  async createPackingItem(
    tripId: string,
    userId: string,
    dto: CreatePackingItemDto,
  ) {
    await this.assertTripMember(tripId, userId);

    if (dto.assignedToId) {
      const assigneeMember = await prisma.tripMember.findUnique({
        where: {
          tripId_userId: {
            tripId,
            userId: dto.assignedToId,
          },
        },
      });

      if (!assigneeMember) {
        throw new BadRequestError(
          "Assigned user must be an active member of this trip",
        );
      }
    }

    const item = await prisma.packingItem.create({
      data: {
        tripId,
        itemName: dto.itemName.trim(),
        category: dto.category ?? "GEAR",
        quantity: dto.quantity ?? 1,
        assignedToId: dto.assignedToId ?? null,
        isPacked: false,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    broadcastToTrip(tripId, {
      type: "PACKING_ITEM_ADDED",
      item,
      actorId: userId,
    });

    return item;
  }

  /**
   * Updates an existing packing item (name, category, quantity, assignee).
   */
  async updatePackingItem(
    tripId: string,
    userId: string,
    itemId: string,
    dto: UpdatePackingItemDto,
  ) {
    await this.assertTripMember(tripId, userId);

    const existing = await prisma.packingItem.findFirst({
      where: { id: itemId, tripId },
    });

    if (!existing) {
      throw new NotFoundError(
        "Packing item not found in this trip's checklist",
      );
    }

    if (dto.assignedToId) {
      const assigneeMember = await prisma.tripMember.findUnique({
        where: {
          tripId_userId: {
            tripId,
            userId: dto.assignedToId,
          },
        },
      });

      if (!assigneeMember) {
        throw new BadRequestError(
          "Assigned user must be an active member of this trip",
        );
      }
    }

    let packedAt = existing.packedAt;
    if (dto.isPacked !== undefined) {
      packedAt = dto.isPacked ? new Date() : null;
    }

    const updated = await prisma.packingItem.update({
      where: { id: itemId },
      data: {
        ...(dto.itemName !== undefined && { itemName: dto.itemName.trim() }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.quantity !== undefined && { quantity: dto.quantity }),
        ...(dto.assignedToId !== undefined && {
          assignedToId: dto.assignedToId,
        }),
        ...(dto.isPacked !== undefined && {
          isPacked: dto.isPacked,
          packedAt,
        }),
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    broadcastToTrip(tripId, {
      type: "PACKING_ITEM_UPDATED",
      item: updated,
      actorId: userId,
    });

    return updated;
  }

  /**
   * Toggles the completion (packed / unpacked) status of an item with timestamp.
   */
  async togglePackingItem(tripId: string, userId: string, itemId: string) {
    await this.assertTripMember(tripId, userId);

    const existing = await prisma.packingItem.findFirst({
      where: { id: itemId, tripId },
    });

    if (!existing) {
      throw new NotFoundError(
        "Packing item not found in this trip's checklist",
      );
    }

    const nextPackedState = !existing.isPacked;
    const packedAt = nextPackedState ? new Date() : null;

    const updated = await prisma.packingItem.update({
      where: { id: itemId },
      data: {
        isPacked: nextPackedState,
        packedAt,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    broadcastToTrip(tripId, {
      type: "PACKING_ITEM_TOGGLED",
      item: updated,
      actorId: userId,
    });

    return updated;
  }

  /**
   * Removes a packing item from the checklist.
   */
  async deletePackingItem(tripId: string, userId: string, itemId: string) {
    await this.assertTripMember(tripId, userId);

    const existing = await prisma.packingItem.findFirst({
      where: { id: itemId, tripId },
    });

    if (!existing) {
      throw new NotFoundError(
        "Packing item not found in this trip's checklist",
      );
    }

    await prisma.packingItem.delete({
      where: { id: itemId },
    });

    broadcastToTrip(tripId, {
      type: "PACKING_ITEM_DELETED",
      itemId,
      actorId: userId,
    });

    return {
      message: "Packing item deleted successfully",
      itemId,
    };
  }
}

export const packingService = new PackingService();
