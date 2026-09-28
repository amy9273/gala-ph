import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { registerSchema, loginSchema } from "../schemas/auth.schema.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  validate({ body: registerSchema }),
  authController.register.bind(authController),
);

authRouter.post(
  "/login",
  validate({ body: loginSchema }),
  authController.login.bind(authController),
);

authRouter.get(
  "/me",
  authMiddleware,
  authController.getMe.bind(authController),
);
