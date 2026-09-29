import { Request, Response, NextFunction } from "express";
import { packingService } from "../services/packing.service.js";

export class PackingController {
  async getPackingList(req: Request, res: Response, next: NextFunction) {
    try {
      const tripId = req.params.id as string;
      const userId = req.user!.id;
      const data = await packingService.getPackingItems(tripId, userId);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      return next(err);
    }
  }

  async createPackingItem(req: Request, res: Response, next: NextFunction) {
    try {
      const tripId = req.params.id as string;
      const userId = req.user!.id;
      const item = await packingService.createPackingItem(
        tripId,
        userId,
        req.body,
      );
      return res.status(201).json({ success: true, data: item });
    } catch (err) {
      return next(err);
    }
  }

  async updatePackingItem(req: Request, res: Response, next: NextFunction) {
    try {
      const tripId = req.params.id as string;
      const itemId = req.params.itemId as string;
      const userId = req.user!.id;
      const item = await packingService.updatePackingItem(
        tripId,
        userId,
        itemId,
        req.body,
      );
      return res.status(200).json({ success: true, data: item });
    } catch (err) {
      return next(err);
    }
  }

  async togglePackingItem(req: Request, res: Response, next: NextFunction) {
    try {
      const tripId = req.params.id as string;
      const itemId = req.params.itemId as string;
      const userId = req.user!.id;
      const item = await packingService.togglePackingItem(
        tripId,
        userId,
        itemId,
      );
      return res.status(200).json({ success: true, data: item });
    } catch (err) {
      return next(err);
    }
  }

  async deletePackingItem(req: Request, res: Response, next: NextFunction) {
    try {
      const tripId = req.params.id as string;
      const itemId = req.params.itemId as string;
      const userId = req.user!.id;
      const result = await packingService.deletePackingItem(
        tripId,
        userId,
        itemId,
      );
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return next(err);
    }
  }
}

export const packingController = new PackingController();
