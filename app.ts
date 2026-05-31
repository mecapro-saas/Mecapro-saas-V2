// src/app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes";
import matchingRoutes from "./routes/matching.routes";
import messagingRoutes from "./routes/messaging.routes";
import paymentRoutes from "./routes/payment.routes";
import ratingRoutes from "./routes/rating.routes";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || "http://localhost:3000").split(","),
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/matching", matchingRoutes);
app.use("/api/messaging", messagingRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/rating", ratingRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 CORS origins: ${process.env.CORS_ORIGIN || "http://localhost:3000"}`);
});

export default app;
