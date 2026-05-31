// src/middlewares/errorHandler.ts
import { Request, Response, NextFunction } from "express";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);

  if (err.message.includes("Invalid SIRET")) {
    return res.status(400).json({ error: "SIRET invalide ou non conforme au transport de poids lourds" });
  }

  if (err.message.includes("Email already registered")) {
    return res.status(409).json({ error: "Email déjà utilisé" });
  }

  if (err.message.includes("Contact quota exceeded")) {
    return res.status(429).json({ error: "Quota de contacts dépassé. Mettez à niveau votre plan." });
  }

  res.status(500).json({
    error: err.message || "Internal server error",
  });
};
