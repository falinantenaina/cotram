import express from "express";
import * as userController from "../controllers/user.controller.js";
import { authorize, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protect, authorize("admin"), userController.getUsers);
router.get("/:id", protect, userController.getUser);
router.put("/:id", protect, userController.updateUser);
router.delete("/:id", protect, authorize("admin"), userController.deleteUser);

export default router;
