// src/services/matching.service.ts
import prisma from "../config/database";

export class MatchingService {
  // Formule Haversine pour distance entre deux points GPS
  static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  static async searchMechanics(
    companyId: string,
    filters: {
      maxDistance?: number;
      specialities?: string[];
      minRating?: number;
      city?: string;
    }
  ) {
    // Récupérer la localisation de l'entreprise
    const company = await prisma.user.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new Error("Company not found");
    }

    // Récupérer tous les mécaniciens avec subscriptions actives
    const mechanics = await prisma.user.findMany({
      where: {
        userType: "MECHANIC",
        subscription: {
          status: "ACTIVE",
        },
      },
      include: {
        subscription: true,
        ratingsReceived: true,
      },
    });

    // Filtrer et scorer
    let results = mechanics
      .map((mechanic) => {
        // Vérifier les filtres
        if (filters.specialities && filters.specialities.length > 0) {
          const hasSpeciality = filters.specialities.some((s) =>
            mechanic.specialities.includes(s)
          );
          if (!hasSpeciality) return null;
        }

        if (filters.minRating && mechanic.averageRating < filters.minRating) {
          return null;
        }

        // Calculer distance
        const distance = this.calculateDistance(
          company.latitude,
          company.longitude,
          mechanic.latitude,
          mechanic.longitude
        );

        if (filters.maxDistance && distance > filters.maxDistance) {
          return null;
        }

        return {
          ...mechanic,
          distance,
          score:
            mechanic.averageRating * 0.5 + // 50% note
            Math.max(0, 100 - distance * 2), // 50% proximité
        };
      })
      .filter((m) => m !== null)
      .sort((a, b) => (b?.score || 0) - (a?.score || 0))
      .slice(0, 20); // Top 20

    return results;
  }

  static async contactMechanic(companyId: string, mechanicId: string, message?: string) {
    // Vérifier que l'entreprise n'a pas dépassé son quota
    const subscription = await prisma.subscription.findUnique({
      where: { userId: companyId },
    });

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    // Réinitialiser le quota mensuel si nécessaire
    const now = new Date();
    const lastReset = subscription.contactsResetDate;
    if (now.getTime() - lastReset.getTime() > 30 * 24 * 60 * 60 * 1000) {
      await prisma.subscription.update({
        where: { userId: companyId },
        data: {
          contactsUsed: 0,
          contactsResetDate: now,
        },
      });
    }

    // Vérifier le quota
    if (
      subscription.contactQuota !== -1 &&
      subscription.contactsUsed >= subscription.contactQuota
    ) {
      throw new Error("Contact quota exceeded. Please upgrade your plan.");
    }

    // Créer ou mettre à jour le matching
    const matching = await prisma.matching.upsert({
      where: {
        companyId_mechanicId: { companyId, mechanicId },
      },
      update: {
        status: "INITIATED",
        message: message || undefined,
      },
      create: {
        companyId,
        mechanicId,
        message: message || undefined,
        status: "INITIATED",
      },
    });

    // Incrémenter le compteur de contacts
    await prisma.subscription.update({
      where: { userId: companyId },
      data: {
        contactsUsed: subscription.contactsUsed + 1,
      },
    });

    return matching;
  }

  static async getMyMatching(userId: string) {
    return await prisma.matching.findMany({
      where: {
        OR: [{ companyId: userId }, { mechanicId: userId }],
      },
      include: {
        company: { select: { id: true, firstName: true, lastName: true, profileImage: true, city: true } },
        mechanic: { select: { id: true, firstName: true, lastName: true, profileImage: true, specialities: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async updateMatchingStatus(matchingId: string, status: "ACCEPTED" | "REJECTED" | "COMPLETED") {
    return await prisma.matching.update({
      where: { id: matchingId },
      data: { status },
    });
  }
}
