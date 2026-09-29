import { Request, Response, NextFunction } from "express";
import { convoyService } from "../services/convoy.service.js";

export class ConvoyController {
  async getActiveLocations(req: Request, res: Response, next: NextFunction) {
    try {
      const tripId = req.params.id as string;
      const userId = req.user!.id;
      const data = await convoyService.getActiveBeacons(tripId, userId);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      return next(err);
    }
  }

  async sendPing(req: Request, res: Response, next: NextFunction) {
    try {
      const tripId = req.params.id as string;
      const userId = req.user!.id;
      const beacon = await convoyService.recordBeacon(tripId, userId, req.body);
      return res.status(200).json({ success: true, data: beacon });
    } catch (err) {
      return next(err);
    }
  }

  async triggerSos(req: Request, res: Response, next: NextFunction) {
    try {
      const tripId = req.params.id as string;
      const userId = req.user!.id;
      const alert = await convoyService.triggerSos(tripId, userId, req.body);
      return res.status(201).json({ success: true, data: alert });
    } catch (err) {
      return next(err);
    }
  }

  async resolveSos(req: Request, res: Response, next: NextFunction) {
    try {
      const tripId = req.params.id as string;
      const userId = req.user!.id;
      const alertId = (req.body.alertId || req.params.alertId) as string;
      const alert = await convoyService.resolveSos(tripId, userId, alertId);
      return res.status(200).json({ success: true, data: alert });
    } catch (err) {
      return next(err);
    }
  }

  async getSosAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const tripId = req.params.id as string;
      const userId = req.user!.id;
      const data = await convoyService.getSosAlerts(tripId, userId);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      return next(err);
    }
  }
}

export const convoyController = new ConvoyController();
