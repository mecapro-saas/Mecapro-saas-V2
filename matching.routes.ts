// src/routes/matching.routes.ts
import { Router } from "express";
import { MatchingService } from "../services/matching.service";
import { authMiddleware, AuthRequest } from "../middlewares/auth.middleware";

const router = Router();

// Search mechanics
router.post("/search", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const mechanics = await MatchingService.searchMechanics(req.user!.id, req.body);
    res.json(mechanics);
  } catch (error) {
    next(error);
  }
});

// Contact a mechanic
router.post("/contact", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const { mechanicId, message } = req.body;
    const matching = await MatchingService.contactMechanic(req.user!.id, mechanicId, message);
    res.status(201).json(matching);
  } catch (error) {
    next(error);
  }
});

// Get my matchings
router.get("/my-matchings", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const matchings = await MatchingService.getMyMatching(req.user!.id);
    res.json(matchings);
  } catch (error) {
    next(error);
  }
});

// Update matching status
router.put("/:matchingId/status", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const { status } = req.body;
    const matching = await MatchingService.updateMatchingStatus(req.params.matchingId, status);
    res.json(matching);
  } catch (error) {
    next(error);
  }
});

export default router;
