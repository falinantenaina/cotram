import express from "express";
import * as routeController from "../controllers/route.controller.js";
import { authorize, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", routeController.getRoutes);
router.get("/:id", routeController.getRoute);
router.post("/", protect, authorize("admin"), routeController.createRoute);
router.put("/:id", protect, authorize("admin"), routeController.updateRoute);
router.delete("/:id", protect, authorize("admin"), routeController.deleteRoute);

export default router;
