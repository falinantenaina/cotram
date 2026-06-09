import express from "express";
import { sendContactMessage } from "../controllers/contact.controller.js";
import { limiter } from "../middleware/security.middleware.js";

const router = express.Router();

router.post("/", limiter, sendContactMessage);

export default router;
