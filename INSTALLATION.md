# 📦 Guide d'Installation MECAPRO

## ⚡ Installation Rapide (5 min)

### 1️⃣ Vérifier les prérequis

```bash
# Docker
docker --version
docker-compose --version

# Git
git --version

# Node (optionnel si Docker)
node --version
```

### 2️⃣ Cloner le projet

```bash
git clone https://github.com/votre-username/mecapro-saas.git
cd mecapro-saas
```

### 3️⃣ Lancer le setup automatique

```bash
chmod +x setup.sh
./setup.sh
```

C'est tout ! Le script va :
- ✅ Créer les fichiers `.env`
- ✅ Lancer Docker
- ✅ Initialiser la BD
- ✅ Vérifier que tout fonctionne

---

## 📋 Installation Manuelle (Détaillée)

### Étape 1 : Télécharger les sources

```bash
# Via Git
git clone https://github.com/votre-username/mecapro-saas.git
cd mecapro-saas

# Ou télécharger le ZIP et dézipper
```

### Étape 2 : Configurer les variables d'environnement

#### Backend

```bash
# Créer le fichier
cp backend/.env.example backend/.env

# Éditer avec votre éditeur
nano backend/.env
# ou :
code backend/.env
```

**Remplir au minimum :**

```ini
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mecapro_db

# JWT (générer avec: openssl rand -hex 32)
JWT_SECRET=your_very_long_secret_key_minimum_32_characters

# Stripe (clés de test d'abord)
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_test_your_key_here

# Stripe Price IDs (créer dans Stripe Dashboard)
STRIPE_PRICE_STARTER=price_test_starter
STRIPE_PRICE_PRO=price_test_pro
STRIPE_PRICE_PREMIUM=price_test_premium

# Frontend
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

#### Frontend

```bash
# Créer le fichier
cp frontend/.env.example frontend/.env

# Éditer
nano frontend/.env
```

**Contenu :**

```ini
VITE_API_URL=http://localhost:3001/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

### Étape 3 : Lancer avec Docker

```bash
# Démarrer tous les services en arrière-plan
docker-compose up -d

# Vérifier que tout démarre
docker-compose logs -f

# Quand prêt, stopper les logs avec Ctrl+C
```

### Étape 4 : Initialiser la base de données

```bash
# Appliquer les migrations Prisma
docker-compose exec backend npm run prisma:migrate

# Ou si vous voulez réinitialiser complètement :
docker-compose exec backend npx prisma migrate reset --force
```

### Étape 5 : Vérifier l'installation

```bash
# Test health check
curl http://localhost:3001/api/health

# Doit retourner :
# {"status":"ok","timestamp":"2024-03-24T20:15:00.000Z"}
```

### Étape 6 : Accéder à l'app

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:3001/api

---

## 🔌 Intégration Supabase (Production)

### 1. Créer un projet Supabase

1. Aller sur https://supabase.com/ (s'inscrire gratuit)
2. Cliquer **New Project**
3. Remplir :
   - Nom : `mecapro`
   - Région : `Paris` (ou proche de vos utilisateurs)
   - DB password : générer une password forte
4. Cliquer **Create new project** (attendre 2-3 min)

### 2. Récupérer la connection string

1. Dans Supabase dashboard → **Settings** → **Database**
2. Chercher **Connection String** → **URI**
3. Copier la chaîne (format : `postgresql://...`)
4. **IMPORTANT** : Remplacer `[YOUR-PASSWORD]` par votre password BD

### 3. Ajouter à backend/.env

```ini
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.supabase.co:5432/postgres
```

### 4. Tester la connexion

```bash
# Lancer les migrations
docker-compose exec backend npm run prisma:migrate

# Ou vérifier directement :
docker-compose exec backend npm run prisma:generate
```

---

## 💳 Configuration Stripe (Production)

### 1. Créer un compte Stripe

1. Aller sur https://stripe.com/
2. Cliquer **Sign up** (email + password)
3. Confirmer email

### 2. Activer mode Production

1. Dashboard → **Mode développement** (toggle en haut à droite)
2. Laisser en **Mode développement** d'abord pour tester

### 3. Obtenir les clés API

En mode **développement** :

1. Aller à **Developers** → **API keys**
2. Onglet **Standard keys**
3. Copier :
   - **Secret key** (commence par `sk_test_`) → `STRIPE_SECRET_KEY`
   - **Publishable key** (commence par `pk_test_`) → `STRIPE_PUBLISHABLE_KEY`

### 4. Créer les produits et prix

Pour chaque plan (STARTER, PRO, PREMIUM) :

1. Aller à **Products** → **Add product**
2. Remplir :
   - Name : `MECAPRO - Plan Starter` (par exemple)
   - Type de facturation : **Recurring**
   - Price : 79€ (pour STARTER)
   - Billing interval : **Monthly**
3. Cliquer **Save**
4. Copier le **Price ID** (commence par `price_...`)
5. Ajouter dans backend/.env :
   ```ini
   STRIPE_PRICE_STARTER=price_1234567890
   STRIPE_PRICE_PRO=price_0987654321
   STRIPE_PRICE_PREMIUM=price_1122334455
   ```

### 5. Configurer les webhooks

1. Aller à **Developers** → **Webhooks**
2. Cliquer **Add an endpoint**
3. Remplir :
   - Endpoint URL : `http://localhost:3001/api/payment/webhook` (dev) ou `https://votre-domaine.com/api/payment/webhook` (prod)
   - Events to send : Cocher ces événements :
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `customer.subscription.deleted`
     - `customer.subscription.updated`
4. Cliquer **Add endpoint**
5. Cliquer sur l'endpoint créé
6. Copier **Signing secret** (commence par `whsec_...`)
7. Ajouter dans backend/.env :
   ```ini
   STRIPE_WEBHOOK_SECRET=whsec_1234567890
   ```

### 6. Tester avec carte test Stripe

Numéro test : `4242 4242 4242 4242`
- Date : n'importe quelle date future (ex: 12/25)
- CVC : n'importe quel nombre à 3 chiffres

Utiliser sur le frontend pour tester l'abonnement.

---

## 🌐 Déploiement sur AWS (Production)

### Voir [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) pour :

- ✅ Setup EC2 instance
- ✅ Configuration SSL/HTTPS
- ✅ Domain setup (Route53)
- ✅ Load Balancer
- ✅ Auto-scaling
- ✅ Monitoring

---

## ⚙️ Commandes Utiles

### Docker

```bash
# Démarrer
docker-compose up -d

# Arrêter
docker-compose down

# Logs
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f frontend

# Redémarrer un service
docker-compose restart backend

# Accéder à un conteneur
docker-compose exec backend bash
```

### Base de données

```bash
# Migrations
docker-compose exec backend npm run prisma:migrate

# Voir la BD (web UI)
docker-compose exec backend npx prisma studio

# Réinitialiser (⚠️ supprime tout)
docker-compose exec backend npx prisma migrate reset --force
```

### Frontend

```bash
# Dev (auto-reload)
docker-compose exec frontend npm run dev

# Build
docker-compose exec frontend npm run build

# Preview build
docker-compose exec frontend npm run preview
```

### Backend

```bash
# Dev (auto-reload)
docker-compose exec backend npm run dev

# Build
docker-compose exec backend npm run build

# Linter
docker-compose exec backend npm run lint

# Tests
docker-compose exec backend npm test
```

---

## 🆘 Dépannage

### "Cannot connect to database"

```bash
# Vérifier la connection string
echo $DATABASE_URL

# Tester directement
docker-compose exec postgres psql -U mecapro -d mecapro_db -c "SELECT 1"

# Voir les logs
docker-compose logs postgres
```

### "Port 3000 ou 3001 déjà utilisé"

```bash
# Trouver le processus qui utilise le port
lsof -i :3000
lsof -i :3001

# Arrêter le processus
kill -9 <PID>

# Ou changer le port dans docker-compose.yml
```

### "Stripe webhook not working"

```bash
# Tester localement avec Stripe CLI
stripe listen --forward-to localhost:3001/api/payment/webhook

# Vérifier STRIPE_WEBHOOK_SECRET dans .env
# Doit correspondre au signing secret du webhook
```

### "CORS error"

```bash
# Vérifier FRONTEND_URL et CORS_ORIGIN dans backend/.env
# Doit correspondre exactement à l'URL du frontend

# Exemple :
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# Ou pour production :
FRONTEND_URL=https://app.mecapro.fr
CORS_ORIGIN=https://app.mecapro.fr
```

### "Build fails"

```bash
# Nettoyer Docker
docker-compose down -v
docker system prune -a

# Relancer
docker-compose up -d --build
```

---

## 📚 Ressources

- **Docker** : https://docs.docker.com/
- **Supabase** : https://supabase.com/docs
- **Stripe** : https://stripe.com/docs
- **Prisma** : https://www.prisma.io/docs/
- **React** : https://react.dev/

---

## ✅ Checklist d'installation

- [ ] Docker installé
- [ ] Projet cloné
- [ ] Fichiers `.env` créés
- [ ] Variables d'environnement remplies
- [ ] Docker services lancés
- [ ] Base de données initialisée
- [ ] Health check OK
- [ ] Frontend accessible
- [ ] Inscription possible
- [ ] Stripe en test mode configuré
- [ ] Connexion Supabase OK

---

**Besoin d'aide ?** Consulter [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) ou ouvrir une issue GitHub.

**Prêt pour déployer ?** Voir [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
