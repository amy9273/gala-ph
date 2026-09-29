import { Router } from "express";
import { tripController } from "../controllers/trip.controller.js";
import { tollController } from "../controllers/toll.controller.js";
import { transitController } from "../controllers/transit.controller.js";
import { ledgerController } from "../controllers/ledger.controller.js";
import { packingController } from "../controllers/packing.controller.js";
import { convoyController } from "../controllers/convoy.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createTripSchema,
  joinTripSchema,
  updateMemberSchema,
  tripIdParamSchema,
  tripMemberParamSchema,
} from "../schemas/trip.schema.js";
import { attachTollEstimateSchema } from "../schemas/toll.schema.js";
import { attachTransitLegsSchema } from "../schemas/transit.schema.js";
import {
  CreateExpenseSchema,
  SettleDebtSchema,
  ExpenseIdParamSchema,
} from "../schemas/ledger.schema.js";
import {
  CreatePackingItemSchema,
  UpdatePackingItemSchema,
  PackingItemIdParamSchema,
} from "../schemas/packing.schema.js";
import {
  ConvoyPingSchema,
  ConvoySosSchema,
  ConvoySosResolveSchema,
} from "../schemas/convoy.schema.js";

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

tripRouter.post(
  "/:id/toll-estimates",
  validate({
    params: tripIdParamSchema,
    body: attachTollEstimateSchema,
  }),
  tollController.attachToTrip.bind(tollController),
);

tripRouter.post(
  "/:id/transit-legs",
  validate({
    params: tripIdParamSchema,
    body: attachTransitLegsSchema,
  }),
  transitController.attachToTrip.bind(transitController),
);

// ==========================================
// KKB Consumption Ledger & Debt Engine Routes
// ==========================================
tripRouter.post(
  "/:id/expenses",
  validate({
    params: tripIdParamSchema,
    body: CreateExpenseSchema,
  }),
  ledgerController.createExpense.bind(ledgerController),
);

tripRouter.get(
  "/:id/expenses",
  validate({ params: tripIdParamSchema }),
  ledgerController.getTripExpenses.bind(ledgerController),
);

tripRouter.get(
  "/:id/expenses/:expenseId",
  validate({ params: ExpenseIdParamSchema }),
  ledgerController.getExpenseById.bind(ledgerController),
);

tripRouter.get(
  "/:id/ledger/balances",
  validate({ params: tripIdParamSchema }),
  ledgerController.getTripBalances.bind(ledgerController),
);

tripRouter.get(
  "/:id/ledger/settlements",
  validate({ params: tripIdParamSchema }),
  ledgerController.simplifyDebts.bind(ledgerController),
);

tripRouter.post(
  "/:id/ledger/settle",
  validate({
    params: tripIdParamSchema,
    body: SettleDebtSchema,
  }),
  ledgerController.settleDebt.bind(ledgerController),
);

// ==========================================
// Bayanihan Shared Packing Checklist Routes
// ==========================================
tripRouter.get(
  "/:id/packing",
  validate({ params: tripIdParamSchema }),
  packingController.getPackingList.bind(packingController),
);

tripRouter.post(
  "/:id/packing",
  validate({
    params: tripIdParamSchema,
    body: CreatePackingItemSchema,
  }),
  packingController.createPackingItem.bind(packingController),
);

tripRouter.patch(
  "/:id/packing/:itemId",
  validate({
    params: PackingItemIdParamSchema,
    body: UpdatePackingItemSchema,
  }),
  packingController.updatePackingItem.bind(packingController),
);

tripRouter.patch(
  "/:id/packing/:itemId/toggle",
  validate({
    params: PackingItemIdParamSchema,
  }),
  packingController.togglePackingItem.bind(packingController),
);

tripRouter.delete(
  "/:id/packing/:itemId",
  validate({
    params: PackingItemIdParamSchema,
  }),
  packingController.deletePackingItem.bind(packingController),
);

// ==========================================
// Live Convoy GPS Telemetry & SOS Beacon Routes
// ==========================================
tripRouter.get(
  "/:id/convoy/locations",
  validate({ params: tripIdParamSchema }),
  convoyController.getActiveLocations.bind(convoyController),
);

tripRouter.post(
  "/:id/convoy/ping",
  validate({
    params: tripIdParamSchema,
    body: ConvoyPingSchema,
  }),
  convoyController.sendPing.bind(convoyController),
);

tripRouter.post(
  "/:id/convoy/sos",
  validate({
    params: tripIdParamSchema,
    body: ConvoySosSchema,
  }),
  convoyController.triggerSos.bind(convoyController),
);

tripRouter.post(
  "/:id/convoy/sos/resolve",
  validate({
    params: tripIdParamSchema,
    body: ConvoySosResolveSchema,
  }),
  convoyController.resolveSos.bind(convoyController),
);

tripRouter.get(
  "/:id/convoy/sos",
  validate({ params: tripIdParamSchema }),
  convoyController.getSosAlerts.bind(convoyController),
);
