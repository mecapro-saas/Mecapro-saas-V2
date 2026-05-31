// src/services/auth.service.ts
import prisma from "../config/database";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt";
import axios from "axios";

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: "MECHANIC" | "COMPANY";
  city: string;
  latitude: number;
  longitude: number;
  siret?: string;
  phoneNumber?: string;
  specialities?: string[];
}

export class AuthService {
  // Vérifier SIRET via API gouvernementale (Sirene)
  static async verifySiret(siret: string): Promise<boolean> {
    try {
      const cleanSiret = siret.replace(/\s/g, "");
      
      // API Sirene (gouvernement français)
      const response = await axios.get(
        `https://api.insee.fr/entreprises/sirene/v3/entreprises/${cleanSiret}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.SIRET_API_KEY}`,
          },
        }
      );

      if (response.status === 200) {
        // Vérifier que c'est un PL (poids lourds)
        const naf = response.data.entreprise?.periodesEtablissement?.[0]?.activitePrincipaleEtablissement;
        // NAF codes pour transport routier de marchandises
        const plNafCodes = ["4923Z", "4924Z", "4925Z", "4929Z", "4930Z"];
        
        return plNafCodes.some(code => naf?.includes(code));
      }
      return false;
    } catch (error) {
      console.error("SIRET verification error:", error);
      return false;
    }
  }

  static async register(input: RegisterInput) {
    // Vérifier si l'email existe
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new Error("Email already registered");
    }

    // Si SIRET fourni, vérifier
    if (input.siret) {
      const isValidSiret = await this.verifySiret(input.siret);
      if (!isValidSiret) {
        throw new Error("Invalid SIRET for heavy truck operations");
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(input.password, 10);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        userType: input.userType,
        city: input.city,
        latitude: input.latitude,
        longitude: input.longitude,
        siret: input.siret,
        phoneNumber: input.phoneNumber,
        specialities: input.specialities || [],
        siretVerified: input.siret ? await this.verifySiret(input.siret) : false,
      },
      include: {
        subscription: true,
      },
    });

    // Créer subscription par défaut (FREEMIUM)
    if (!user.subscription) {
      await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: "FREEMIUM",
          contactQuota: 5,
          status: "ACTIVE",
        },
      });
    }

    const { password: _, ...userWithoutPassword } = user;
    const token = generateToken({
      id: user.id,
      email: user.email,
      userType: user.userType,
    });

    return { user: userWithoutPassword, token };
  }

  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        subscription: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const isValidPassword = await bcrypt.compare(password, user.password || "");
    if (!isValidPassword) {
      throw new Error("Invalid password");
    }

    const { password: _, ...userWithoutPassword } = user;
    const token = generateToken({
      id: user.id,
      email: user.email,
      userType: user.userType,
    });

    return { user: userWithoutPassword, token };
  }

  static async getUserProfile(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
        ratingsReceived: {
          include: { ratedBy: { select: { id: true, firstName: true, lastName: true, profileImage: true } } },
        },
      },
    });
  }

  static async updateProfile(userId: string, data: any) {
    return await prisma.user.update({
      where: { id: userId },
      data,
      include: {
        subscription: true,
      },
    });
  }
}
