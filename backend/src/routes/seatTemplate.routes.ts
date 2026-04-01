import { Router } from "express";
import {
  createTemplate,
  deleteTemplate,
  getTemplates,
  updateTemplate,
} from "../controllers/seatTemplate.controller.js";
import { authorize, protect } from "../middleware/auth.middleware.js";

const router = Router();
router.get("/", getTemplates);
router.post("/", protect, authorize("admin"), createTemplate);
router.put("/:id", protect, authorize("admin"), updateTemplate);
router.delete("/:id", protect, authorize("admin"), deleteTemplate);
export default router;
