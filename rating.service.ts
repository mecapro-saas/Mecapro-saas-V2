// src/services/rating.service.ts
import prisma from "../config/database";

export class RatingService {
  static async createRating(
    ratedById: string,
    ratingOnId: string,
    score: number,
    comment?: string
  ) {
    if (score < 1 || score > 5) {
      throw new Error("Score must be between 1 and 5");
    }

    // Vérifier qu'il n'existe pas déjà une note
    const existing = await prisma.rating.findUnique({
      where: {
        ratedById_ratingOnId: { ratedById, ratingOnId },
      },
    });

    if (existing) {
      throw new Error("You already rated this user");
    }

    const rating = await prisma.rating.create({
      data: {
        ratedById,
        ratingOnId,
        score,
        comment,
      },
    });

    // Mettre à jour la moyenne de notation
    await this.updateAverageRating(ratingOnId);

    return rating;
  }

  static async updateAverageRating(userId: string) {
    const ratings = await prisma.rating.findMany({
      where: { ratingOnId: userId },
    });

    if (ratings.length === 0) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          averageRating: 0,
          totalRatings: 0,
        },
      });
      return;
    }

    const average = ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;

    await prisma.user.update({
      where: { id: userId },
      data: {
        averageRating: Math.round(average * 10) / 10,
        totalRatings: ratings.length,
      },
    });
  }

  static async getRatings(userId: string) {
    return await prisma.rating.findMany({
      where: { ratingOnId: userId },
      include: {
        ratedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
