// src/routes/rating.routes.ts
import { Router } from "express";
import { RatingService } from "../services/rating.service";
import { authMiddleware, AuthRequest } from "../middlewares/auth.middleware";

const router = Router();

// Create rating
router.post("/create", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const { ratingOnId, score, comment } = req.body;
    const rating = await RatingService.createRating(req.user!.id, ratingOnId, score, comment);
    res.status(201).json(rating);
  } catch (error) {
    next(error);
  }
});

// Get ratings for a user
router.get("/:userId", async (req, res, next) => {
  try {
    const ratings = await RatingService.getRatings(req.params.userId);
    res.json(ratings);
  } catch (error) {
    next(error);
  }
});

export default router;
