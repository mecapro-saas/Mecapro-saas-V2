// src/services/messaging.service.ts
import prisma from "../config/database";

export class MessagingService {
  static async sendMessage(senderId: string, recipientId: string, content: string) {
    if (!content || content.trim().length === 0) {
      throw new Error("Message content cannot be empty");
    }

    const message = await prisma.message.create({
      data: {
        senderId,
        recipientId,
        content: content.trim(),
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, profileImage: true } },
      },
    });

    return message;
  }

  static async getConversation(userId: string, otherId: string) {
    return await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, recipientId: otherId },
          { senderId: otherId, recipientId: userId },
        ],
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, profileImage: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  static async getConversations(userId: string) {
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { recipientId: userId }],
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, profileImage: true } },
        recipient: { select: { id: true, firstName: true, lastName: true, profileImage: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Grouper par conversation
    const conversations = new Map();
    messages.forEach((msg) => {
      const otherId = msg.senderId === userId ? msg.recipientId : msg.senderId;
      const otherUser = msg.senderId === userId ? msg.recipient : msg.sender;

      if (!conversations.has(otherId)) {
        conversations.set(otherId, {
          userId: otherId,
          userName: `${otherUser.firstName} ${otherUser.lastName}`,
          userImage: otherUser.profileImage,
          lastMessage: msg.content,
          lastMessageDate: msg.createdAt,
          unreadCount: msg.readAt && msg.recipientId === userId ? 0 : 1,
        });
      }
    });

    return Array.from(conversations.values()).sort(
      (a, b) => b.lastMessageDate.getTime() - a.lastMessageDate.getTime()
    );
  }

  static async markAsRead(messageId: string) {
    return await prisma.message.update({
      where: { id: messageId },
      data: { readAt: new Date() },
    });
  }
}
