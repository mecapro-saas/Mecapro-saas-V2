// src/routes/messaging.routes.ts
import { Router } from "express";
import { MessagingService } from "../services/messaging.service";
import { authMiddleware, AuthRequest } from "../middlewares/auth.middleware";

const router = Router();

// Send message
router.post("/send", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const { recipientId, content } = req.body;
    const message = await MessagingService.sendMessage(req.user!.id, recipientId, content);
    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
});

// Get conversation with another user
router.get("/conversation/:otherId", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const messages = await MessagingService.getConversation(req.user!.id, req.params.otherId);
    res.json(messages);
  } catch (error) {
    next(error);
  }
});

// Get all conversations
router.get("/conversations", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const conversations = await MessagingService.getConversations(req.user!.id);
    res.json(conversations);
  } catch (error) {
    next(error);
  }
});

// Mark message as read
router.put("/:messageId/read", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const message = await MessagingService.markAsRead(req.params.messageId);
    res.json(message);
  } catch (error) {
    next(error);
  }
});

export default router;
