import { Router } from "express";
import { tollController } from "../controllers/toll.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  calculateTollSchema,
  fuelEstimateSchema,
} from "../schemas/toll.schema.js";

export const tollRouter = Router();

tollRouter.get("/presets", tollController.getPresets.bind(tollController));

tollRouter.post(
  "/calculate",
  validate({ body: calculateTollSchema }),
  tollController.calculateToll.bind(tollController),
);

tollRouter.post(
  "/fuel-estimate",
  validate({ body: fuelEstimateSchema }),
  tollController.fuelEstimate.bind(tollController),
);
