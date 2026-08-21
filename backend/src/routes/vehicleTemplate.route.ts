// backend/src/routes/vehicleTemplate.route.ts
import { Router } from "express";
import {
  getTemplate,
  getTemplates,
  upsertTemplate,
} from "../controllers/vehicleTemplate.controller.js";
import { authorize, protect } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", getTemplates);
router.get("/:vehicleType", getTemplate);
router.put("/:vehicleType", protect, authorize("admin"), upsertTemplate);

export default router;
