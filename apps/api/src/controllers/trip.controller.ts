import { Request, Response, NextFunction } from "express";
import { tripService } from "../services/trip.service.js";

export class TripController {
  async createTrip(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const trip = await tripService.createTrip(req.user!.id, req.body);
      res.status(201).json({
        message: "Trip created successfully",
        trip,
      });
    } catch (err) {
      next(err);
    }
  }

  async getUserTrips(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const page = req.query.page
        ? parseInt(req.query.page as string, 10)
        : undefined;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : undefined;
      const trips = await tripService.getUserTrips(req.user!.id, {
        page,
        limit,
      });
      res.status(200).json({ trips });
    } catch (err) {
      next(err);
    }
  }

  async getTripById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const tripId = req.params.id as string;
      const trip = await tripService.getTripById(req.user!.id, tripId);
      res.status(200).json({ trip });
    } catch (err) {
      next(err);
    }
  }

  async joinTrip(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const membership = await tripService.joinTripByInviteCode(
        req.user!.id,
        req.body.inviteCode,
      );
      res.status(200).json({
        message: "Joined trip successfully",
        membership,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateMember(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const tripId = req.params.id as string;
      const targetUserId = req.params.userId as string;
      const member = await tripService.updateMemberPreferences(
        req.user!.id,
        tripId,
        targetUserId,
        req.body,
      );
      res.status(200).json({
        message: "Member preferences updated successfully",
        member,
      });
    } catch (err) {
      next(err);
    }
  }

  async removeMember(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const tripId = req.params.id as string;
      const targetUserId = req.params.userId as string;
      const result = await tripService.removeTripMember(
        req.user!.id,
        tripId,
        targetUserId,
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const tripController = new TripController();
