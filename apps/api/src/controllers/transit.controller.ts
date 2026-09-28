import { Request, Response, NextFunction } from "express";
import { transitService } from "../services/transit.service.js";

export class TransitController {
  async getHubs(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const hubs = await transitService.getTransitHubs();
      res.status(200).json({ hubs });
    } catch (err) {
      next(err);
    }
  }

  async searchBuses(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const routes = await transitService.searchBusRoutes(req.query);
      res.status(200).json({ routes });
    } catch (err) {
      next(err);
    }
  }

  async searchToda(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const tariffs = await transitService.searchTodaTariffs(req.query);
      res.status(200).json({ tariffs });
    } catch (err) {
      next(err);
    }
  }

  async planTransit(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const plan = await transitService.planMultiLegTransit(req.body);
      res.status(200).json(plan);
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
      const result = await transitService.attachTransitLegsToTrip(
        req.user!.id,
        tripId,
        req.body,
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const transitController = new TransitController();
