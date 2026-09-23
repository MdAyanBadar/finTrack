import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { getPots, createPot, updatePot, deletePot, payoutPot, undoPayout, setClosed } from "../controllers/pot.controller.js";

const router = express.Router();

router.use(protect);

router.get("/", getPots);
router.post("/", createPot);
router.put("/:id", updatePot);
router.delete("/:id", deletePot);
router.post("/:id/payout", payoutPot);   // took money out
router.delete("/:id/payout", undoPayout); // undo the last withdrawal
router.post("/:id/close", setClosed);    // finished with this pot
router.delete("/:id/close", setClosed);  // reopen it

export default router;
