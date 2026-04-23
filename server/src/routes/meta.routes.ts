import { Router } from "express";
import { metaController } from "../controllers/meta.controller";
import { asyncHandler } from "../utils/async-handler";

export const metaRouter = Router();

metaRouter.get("/bootstrap", asyncHandler(metaController.bootstrap));
