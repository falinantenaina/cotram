import express from "express";
import * as cityController from "../controllers/city.controller.js";
import { authorize, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", cityController.getCities);
router.get("/all", protect, authorize("admin"), cityController.getAllCities);
router.get("/:id", cityController.getCity);
router.post("/", protect, authorize("admin"), cityController.createCity);
router.put("/:id", protect, authorize("admin"), cityController.updateCity);
router.delete("/:id", protect, authorize("admin"), cityController.deleteCity);

export default router;
