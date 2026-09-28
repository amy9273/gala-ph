import { Router } from "express";
import { tripController } from "../controllers/trip.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createTripSchema,
  joinTripSchema,
  updateMemberSchema,
  tripIdParamSchema,
  tripMemberParamSchema,
} from "../schemas/trip.schema.js";

export const tripRouter = Router();

// All trip routes require an authenticated user session
tripRouter.use(authMiddleware);

tripRouter.post(
  "/",
  validate({ body: createTripSchema }),
  tripController.createTrip.bind(tripController),
);

tripRouter.get("/", tripController.getUserTrips.bind(tripController));

tripRouter.post(
  "/join",
  validate({ body: joinTripSchema }),
  tripController.joinTrip.bind(tripController),
);

tripRouter.get(
  "/:id",
  validate({ params: tripIdParamSchema }),
  tripController.getTripById.bind(tripController),
);

tripRouter.patch(
  "/:id/members/:userId",
  validate({
    params: tripMemberParamSchema,
    body: updateMemberSchema,
  }),
  tripController.updateMember.bind(tripController),
);

tripRouter.delete(
  "/:id/members/:userId",
  validate({ params: tripMemberParamSchema }),
  tripController.removeMember.bind(tripController),
);
