import { Request, Response, NextFunction } from "express";
import { tollService } from "../services/toll.service.js";

export class TollController {
  async calculateToll(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const calculation = await tollService.calculateRouteToll(req.body);
      res.status(200).json(calculation);
    } catch (err) {
      next(err);
    }
  }

  async fuelEstimate(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const estimate = tollService.calculateFuelEstimate(req.body);
      res.status(200).json(estimate);
    } catch (err) {
      next(err);
    }
  }

  async attachToTrip(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const tripId = req.params.id as string;
      const result = await tollService.attachTollEstimatesToTrip(
        req.user!.id,
        tripId,
        req.body,
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  getPresets(_req: Request, res: Response): void {
    const presets = tollService.getPresetRoutes();
    res.status(200).json({ presets });
  }
}

export const tollController = new TollController();
