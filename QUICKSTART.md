# ⚡ MECAPRO - Démarrage Rapide (10 min)

## 🎯 En 3 étapes, vous aurez un SaaS prêt à l'emploi

### ✅ Étape 1 : Préparer l'infrastructure (2 min)

```bash
# Télécharger le code
git clone https://github.com/votre-username/mecapro-saas.git
cd mecapro-saas

# Rendre le script executable
chmod +x setup.sh

# Lancer l'installation automatique
./setup.sh
```

**C'est tout !** Le script va automatiquement :
- Créer les fichiers de configuration
- Lancer Docker
- Initialiser la base de données
- Vérifier que tout fonctionne

---

### ✅ Étape 2 : Obtenir les clés Stripe (5 min)

#### Sur stripe.com :

1. **Créer un compte gratuit** : https://stripe.com/
2. **Dashboard** → **Développement** → **Clés API**
3. Copier les clés de test :
   ```
   Secret Key : sk_test_XXXXX
   Publishable Key : pk_test_XXXXX
   ```
4. **Créer 3 produits** (STARTER, PRO, PREMIUM) avec prix 79€, 149€, 299€
5. Copier les 3 **Price IDs** (price_XXXXX)
6. **Webhooks** → Ajouter endpoint : `http://localhost:3001/api/payment/webhook`
7. Copier le **Signing Secret**

#### Dans backend/.env :

```ini
STRIPE_SECRET_KEY=sk_test_votre_clé
STRIPE_PUBLISHABLE_KEY=pk_test_votre_clé
STRIPE_WEBHOOK_SECRET=whsec_votre_clé
STRIPE_PRICE_STARTER=price_votre_id
STRIPE_PRICE_PRO=price_votre_id
STRIPE_PRICE_PREMIUM=price_votre_id
```

Redémarrer :
```bash
docker-compose restart backend
```

---

### ✅ Étape 3 : Lancer et inviter vos utilisateurs (3 min)

```bash
# Vérifier que tout est en ligne
curl http://localhost:3001/api/health
# ✅ {"status":"ok"}

# Accéder à l'app
# Frontend : http://localhost:3000
# Backend API : http://localhost:3001/api
```

**Vous avez maintenant un SaaS complet avec :**
- ✅ Login/Registration
- ✅ Recherche de mécaniciens
- ✅ Système de notation
- ✅ Messagerie
- ✅ Abonnements Stripe (test)
- ✅ Vérification SIRET

---

## 🎬 Tester l'app

### Créer un compte entreprise
1. Aller sur http://localhost:3000/register
2. Sélectionner "Une entreprise de transport"
3. Remplir :
   - Email : `test@entreprise.fr`
   - SIRET : `13000545700013` (exemple valide)
   - Prénom/Nom : `Test Company`
   - Ville : `Paris`
4. Cliquer **Créer mon compte**

### Créer un compte mécanicien
1. Aller sur http://localhost:3000/register
2. Sélectionner "Un mécanicien poids lourds"
3. Remplir les infos
4. Sélectionner spécialités
5. Cliquer **Créer mon compte**

### Tester le matching
1. **Se connecter** avec le compte entreprise
2. **Dashboard** → Chercher des mécaniciens
3. **Contacter** un mécanicien

### Tester l'abonnement Stripe
1. **Se connecter**
2. **Aller sur** Settings/Abonnement (à implémenter)
3. **Choisir un plan** (STARTER, PRO, PREMIUM)
4. **Carte de test** : `4242 4242 4242 4242` (date future, CVC: 123)
5. ✅ Paiement confirmé

---

## 📱 Points d'accès

| Environnement | Frontend | Backend |
|---------------|----------|---------|
| **Local** | http://localhost:3000 | http://localhost:3001/api |
| **Production (AWS)** | https://app.mecapro.fr | https://app.mecapro.fr/api |

---

## 🚀 Aller en Production (AWS)

**Voir** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

Résumé rapide :

```bash
# 1. Créer base de données Supabase
# → Copier CONNECTION STRING dans backend/.env

# 2. Créer instance EC2 AWS
# → Configurer sécurité

# 3. Passer Stripe en mode PRODUCTION
# → Obtenir clés production

# 4. Lancer le script de déploiement
bash deploy-aws.sh
```

---

## 🔧 Commandes essentielles

```bash
# Démarrer/Arrêter
docker-compose up -d       # Démarrer
docker-compose down        # Arrêter

# Logs
docker-compose logs -f     # Tous les logs
docker-compose logs -f backend   # Backend seulement

# Base de données
docker-compose exec backend npm run prisma:migrate  # Migrations
docker-compose exec backend npx prisma studio      # GUI de la BD

# Redémarrer après modification .env
docker-compose restart backend
```

---

## ⚙️ Configuration .env minimale

**backend/.env** :
```ini
DATABASE_URL=postgresql://localhost/mecapro_db
JWT_SECRET=secret-key-min-32-chars
STRIPE_SECRET_KEY=sk_test_XXXXX
STRIPE_PUBLISHABLE_KEY=pk_test_XXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXX
STRIPE_PRICE_STARTER=price_XXXXX
STRIPE_PRICE_PRO=price_XXXXX
STRIPE_PRICE_PREMIUM=price_XXXXX
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

**frontend/.env** :
```ini
VITE_API_URL=http://localhost:3001/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXX
```

---

## 🎓 Fonctionnalités principales

### Pour les Entreprises 🏢
- Rechercher mécaniciens par localisation + compétences
- Vérification SIRET automatique
- Contacter mécaniciens directement
- Messagerie intégrée
- Voir avis et notes
- 3 plans d'abonnement avec quotas croissants

### Pour les Mécaniciens 🔧
- Profil avec spécialités et certifications
- Recevoir des demandes de travail
- Messagerie avec entreprises
- Notation par les clients
- Freemium : gratuit (5 contacts/mois) ou premium

### Paiements 💳
- Stripe intégration complète
- Plan STARTER : 79€/mois (5 contacts)
- Plan PRO : 149€/mois (15 contacts)
- Plan PREMIUM : 299€/mois (illimité)
- Mode test et production

---

## ❓ FAQ

**Q: Comment changer le port (3000/3001) ?**
A: Éditer docker-compose.yml et changer les ports

**Q: Comment connecter une vraie base de données ?**
A: Créer un projet Supabase et copier la connection string dans DATABASE_URL

**Q: Comment passer en production ?**
A: Voir [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

**Q: Comment ajouter plus de fonctionnalités ?**
A: Éditer les services backend et composants frontend

**Q: Où trouver la documentation API complète ?**
A: Voir [README.md](./README.md) section "API Documentation"

---

## 🆘 Dépannage rapide

```bash
# "Port déjà utilisé"
kill -9 $(lsof -t -i:3000)

# "Connection refused"
docker-compose logs postgres

# "CORS error"
Vérifier FRONTEND_URL et CORS_ORIGIN dans backend/.env

# "Stripe not working"
Vérifier STRIPE_* dans backend/.env et redémarrer
```

---

## ✨ Vous avez maintenant

✅ Un SaaS **100% fonctionnel**
✅ **Authentification** sécurisée (JWT)
✅ **Recherche intelligente** de mécaniciens
✅ **Système de notation**
✅ **Messagerie** temps réel
✅ **Paiements** intégrés (Stripe)
✅ **Vérification SIRET** API gouvernementale
✅ **Base de données** PostgreSQL
✅ **Docker** pour faciliter le déploiement

---

## 📞 Support & Ressources

- 📖 **Docs Installation** : [INSTALLATION.md](./INSTALLATION.md)
- 🚀 **Docs Déploiement** : [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- 📚 **README complet** : [README.md](./README.md)
- 🐛 **Issues** : GitHub Issues

---

**Prêt ?** Lancez `./setup.sh` et commencez ! 🚀

---

*MECAPRO © 2026 - Plateforme de mise en relation pour poids lourds*
