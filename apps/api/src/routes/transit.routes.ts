import { Router } from "express";
import { transitController } from "../controllers/transit.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  searchBusRoutesSchema,
  searchTodaTariffSchema,
  planTransitSchema,
} from "../schemas/transit.schema.js";

export const transitRouter = Router();

transitRouter.get("/hubs", transitController.getHubs.bind(transitController));

transitRouter.get(
  "/buses",
  validate({ query: searchBusRoutesSchema }),
  transitController.searchBuses.bind(transitController),
);

transitRouter.get(
  "/toda",
  validate({ query: searchTodaTariffSchema }),
  transitController.searchToda.bind(transitController),
);

transitRouter.post(
  "/plan",
  validate({ body: planTransitSchema }),
  transitController.planTransit.bind(transitController),
);
