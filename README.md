# 🚛 MECAPRO - SaaS de Mise en Relation

**Plateforme B2B de matching intelligent entre mécaniciens poids lourds indépendants et entreprises de transport**

## ✨ Caractéristiques

### Pour les Entreprises
✅ Rechercher des mécaniciens qualifiés par compétences, localisation et disponibilité  
✅ Vérification SIRET automatique  
✅ Système de notation pour confiance  
✅ 3 plans d'abonnement avec quotas de contacts croissants  
✅ Messagerie intégrée sécurisée  

### Pour les Mécaniciens
✅ Profil professionnel avec spécialités et certifications  
✅ Modèle freemium : gratuit avec 5 contacts/mois, premium pour plus  
✅ Géolocalisé pour proximité  
✅ Notation par les entreprises  
✅ Recevoir des demandes de travail

### Paiements
💳 Intégration Stripe production-ready  
💳 3 plans d'abonnement : STARTER (79€), PRO (149€), PREMIUM (299€)  
💳 Gestion automatique des renouvellements  
💳 Webhooks Stripe pour événements temps réel  

### Sécurité
🔒 JWT tokens sécurisés  
🔒 Hash bcrypt pour passwords  
🔒 CORS configuré  
🔒 Vérification SIRET API gouvernementale  
🔒 HTTPS en production  

---

## 🏗️ Stack Technique

| Couche | Tech |
|--------|------|
| **Frontend** | React 18 + TypeScript + Tailwind CSS |
| **Backend** | Node.js + Express + TypeScript |
| **Database** | PostgreSQL (Supabase managed) |
| **ORM** | Prisma |
| **Paiements** | Stripe API |
| **Infrastructure** | AWS EC2 + RDS (optionnel) |
| **Containerization** | Docker + Docker Compose |
| **Messages** | HTTP REST API |

---

## 📁 Structure du Projet

```
mecapro-saas/
├── backend/
│   ├── src/
│   │   ├── services/          # Logique métier
│   │   ├── routes/            # API endpoints
│   │   ├── middlewares/       # Auth, errorHandling
│   │   ├── utils/             # JWT, helpers
│   │   └── app.ts             # Express app
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── package.json
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── pages/             # Pages React
│   │   ├── store/             # Zustand stores
│   │   ├── api/               # API client
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml
├── DEPLOYMENT_GUIDE.md
└── README.md
```

---

## 🚀 Quickstart (5 minutes)

### Prérequis
- Docker & Docker Compose installés
- Node.js 18+ (optionnel, Docker suffit)

### 1. Cloner et configurer

```bash
git clone https://github.com/votre-username/mecapro-saas.git
cd mecapro-saas

# Créer fichiers .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Remplir les variables (backend/.env minimum)

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/mecapro_db
JWT_SECRET=your-secret-key-min-32-chars
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
FRONTEND_URL=http://localhost:3000
```

### 3. Lancer avec Docker

```bash
docker-compose up -d
```

### 4. Initialiser la BD

```bash
docker-compose exec backend npm run prisma:migrate
```

### 5. Accéder

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:3001/api

---

## 🔐 Configuration Production (AWS)

**Voir** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) pour :
- ✅ Setup Supabase PostgreSQL
- ✅ Configuration Stripe (clés production)
- ✅ Déploiement AWS EC2
- ✅ Setup domaine + SSL
- ✅ Monitoring et logs

---

## 📚 API Documentation

### Authentication
```
POST /api/auth/register       # Créer un compte
POST /api/auth/login          # Se connecter
GET  /api/auth/profile        # Mon profil
PUT  /api/auth/profile        # Mettre à jour profil
GET  /api/auth/user/:id       # Voir profil d'un utilisateur
```

### Matching (Recherche)
```
POST /api/matching/search     # Chercher des mécaniciens
POST /api/matching/contact    # Contacter un mécanicien
GET  /api/matching/my-matchings  # Mes contacts
PUT  /api/matching/:id/status # Changer statut (ACCEPTED/REJECTED)
```

### Messagerie
```
POST /api/messaging/send      # Envoyer message
GET  /api/messaging/conversations  # Mes conversations
GET  /api/messaging/conversation/:otherId  # Messages avec quelqu'un
PUT  /api/messaging/:messageId/read  # Marquer lu
```

### Paiements
```
POST /api/payment/subscribe   # Créer abonnement
POST /api/payment/webhook     # Webhook Stripe
GET  /api/payment/history     # Historique paiements
```

### Avis/Ratings
```
POST /api/rating/create       # Laisser un avis
GET  /api/rating/:userId      # Voir avis d'un utilisateur
```

---

## 🎯 Prochaines Étapes (V2)

- [ ] Mobile app (React Native)
- [ ] Notifications push
- [ ] Système de réputation avancé
- [ ] Facturation intégrée (commission)
- [ ] Annonces urgentes (upsell)
- [ ] Intégration Google/LinkedIn OAuth
- [ ] Analytics dashboard
- [ ] Support multilangue

---

## 🤝 Contribution

Les contributions sont bienvenues ! Pour développer :

```bash
# Mode développement
docker-compose up -d

# Backend (auto-reload)
docker-compose exec backend npm run dev

# Frontend (auto-reload)
docker-compose exec frontend npm run dev

# Tests
docker-compose exec backend npm test
```

---

## 📄 License

MIT - Voir LICENSE.txt

---

## 📞 Support

- **Email** : support@mecapro.fr
- **Docs** : [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Issues** : GitHub Issues

---

**MECAPRO** © 2026 - Tous droits réservés
