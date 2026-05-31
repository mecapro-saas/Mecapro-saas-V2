// src/routes/auth.routes.ts
import { Router } from "express";
import { AuthService } from "../services/auth.service";
import { authMiddleware, AuthRequest } from "../middlewares/auth.middleware";

const router = Router();

// Register
router.post("/register", async (req, res, next) => {
  try {
    const { user, token } = await AuthService.register(req.body);
    res.status(201).json({ user, token });
  } catch (error) {
    next(error);
  }
});

// Login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await AuthService.login(email, password);
    res.json({ user, token });
  } catch (error) {
    next(error);
  }
});

// Get Profile
router.get("/profile", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const user = await AuthService.getUserProfile(req.user!.id);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Update Profile
router.put("/profile", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const user = await AuthService.updateProfile(req.user!.id, req.body);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Get user by ID (public)
router.get("/user/:id", async (req, res, next) => {
  try {
    const user = await AuthService.getUserProfile(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // Ne pas retourner le password
    const { password: _, ...safeUser } = user as any;
    res.json(safeUser);
  } catch (error) {
    next(error);
  }
});

export default router;
