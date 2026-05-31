# 🚀 MECAPRO - Déploiement Instant sur Render

## ⚡ 5 minutes pour avoir le SaaS en ligne !

---

## 📋 Prérequis

- ✅ Compte GitHub (pour cloner le repo)
- ✅ Compte Render (gratuit)
- ✅ Compte Supabase (gratuit)
- ✅ Clés Stripe (test ou production)

---

## 🎯 ÉTAPE 1 : Préparer les credentials (5 min)

### 1️⃣ Créer une base de données Supabase

1. Aller sur https://supabase.com/
2. Cliquer **New Project**
3. Remplir :
   - Project name : `mecapro`
   - Region : `Paris` (ou proche)
   - DB password : générer une forte password
4. Attendre création (~2 min)
5. **Copier la connection string** :
   - Settings → Database → Connection string
   - Format : `postgresql://postgres:[PASSWORD]@db.supabase.co:5432/postgres`

### 2️⃣ Obtenir clés Stripe (test)

1. Aller sur https://stripe.com/ (s'inscrire gratuit)
2. Dashboard → **Developers** → **API Keys**
3. **Mode Test** (toggle en haut)
4. Copier :
   - **Secret Key** : `sk_test_XXXXX`
   - **Publishable Key** : `pk_test_XXXXX`

5. **Créer produits Stripe** :
   - Aller à **Products** → **Add product**
   - Créer 3 produits :
     - STARTER (79€/mois)
     - PRO (149€/mois)
     - PREMIUM (299€/mois)
   - Pour chaque, copier le **Price ID** (price_XXXXX)

6. **Créer webhook** :
   - **Webhooks** → **Add endpoint**
   - URL : `https://mecapro-backend.onrender.com/api/payment/webhook` (vous aurez cette URL après)
   - Events : `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`, `customer.subscription.updated`
   - Copier le **Signing Secret** : `whsec_XXXXX`

---

## 🎯 ÉTAPE 2 : Pousser le code sur GitHub

### 1️⃣ Créer un repo GitHub

1. Aller sur https://github.com/
2. Cliquer **New Repository**
3. Nom : `mecapro-saas`
4. Public (pour Render)
5. Cliquer **Create repository**

### 2️⃣ Pousser le code

```bash
cd mecapro-saas

# Initialiser git
git init
git add .
git commit -m "Initial commit - MECAPRO SaaS"

# Ajouter le remote (remplacer USERNAME)
git remote add origin https://github.com/USERNAME/mecapro-saas.git

# Pousser
git branch -M main
git push -u origin main
```

---

## 🎯 ÉTAPE 3 : Déployer sur Render (5 min)

### 1️⃣ Créer une Web Service pour le Backend

1. Aller sur https://render.com/ (créer compte gratuit)
2. Dashboard → **New +** → **Web Service**
3. Connecter votre repo GitHub
4. Sélectionner : `mecapro-saas`
5. Remplir :
   - **Name** : `mecapro-backend`
   - **Environment** : `Node`
   - **Build Command** : `cd backend && npm install && npm run build`
   - **Start Command** : `cd backend && npm start`
   - **Plan** : Free (gratuit)
6. Cliquer **Create Web Service**

### 2️⃣ Ajouter les variables d'environnement

Dans la section **Environment** :

```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.supabase.co:5432/postgres
JWT_SECRET=your_very_long_secret_key_minimum_32_characters
STRIPE_SECRET_KEY=sk_test_XXXXX
STRIPE_PUBLISHABLE_KEY=pk_test_XXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXX
STRIPE_PRICE_STARTER=price_XXXXX
STRIPE_PRICE_PRO=price_XXXXX
STRIPE_PRICE_PREMIUM=price_XXXXX
FRONTEND_URL=https://mecapro-frontend.onrender.com
CORS_ORIGIN=https://mecapro-frontend.onrender.com
```

3. Cliquer **Deploy**
4. Attendre le déploiement (~5 min)
5. Copier l'URL générée (ex: `https://mecapro-backend.onrender.com`)

### 3️⃣ Créer une Static Site pour le Frontend

1. Dashboard Render → **New +** → **Static Site**
2. Connecter votre repo GitHub
3. Sélectionner : `mecapro-saas`
4. Remplir :
   - **Name** : `mecapro-frontend`
   - **Build Command** : `cd frontend && npm install && npm run build`
   - **Publish Directory** : `frontend/dist`
5. Cliquer **Create Static Site**

### 4️⃣ Ajouter variables d'environnement Frontend

```
VITE_API_URL=https://mecapro-backend.onrender.com/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXX
```

5. Attendre déploiement (~3 min)
6. Copier l'URL frontend (ex: `https://mecapro-frontend.onrender.com`)

---

## 🎯 ÉTAPE 4 : Mettre à jour Stripe Webhook

1. Retourner au **webhook Stripe** créé avant
2. Éditer l'endpoint
3. Changer l'URL par : `https://mecapro-backend.onrender.com/api/payment/webhook`
4. Sauvegarder

---

## ✅ C'est prêt !

Votre SaaS est maintenant en ligne ! 🎉

### Points d'accès

```
Frontend  : https://mecapro-frontend.onrender.com
Backend   : https://mecapro-backend.onrender.com/api
Health    : https://mecapro-backend.onrender.com/api/health
```

### Tester

1. Ouvrir https://mecapro-frontend.onrender.com
2. Créer un compte (entreprise ou mécanicien)
3. Tester le matching
4. Tester l'abonnement Stripe (carte de test : `4242 4242 4242 4242`)

---

## 🔧 Modifier le code après déploiement

```bash
# Faire vos modifications
git add .
git commit -m "Your changes"
git push origin main

# Render redéploiera automatiquement
# (attendre 5-10 min)
```

---

## 📊 Coûts

- **Render Free Tier** : Gratuit (avec limitations)
  - 750 heures de calcul/mois (suffisant pour le tester)
  - 1 instance dormante après 15 min d'inactivité
  
- **Supabase** : Gratuit (généreux)
  - 500 MB stockage
  - 2 MB/semaine upload
  
- **Stripe** : Gratuit en test
  - Passer en production quand prêt

---

## ⚠️ Limitations Render Free

- Instance se met en veille après 15 min (lent au démarrage)
- Limité à 750 heures/mois
- Pour production : passer à un plan payant (~10€/mois)

---

## 🚀 Passer en production (optionnel)

Quand prêt pour le vrai marché :

1. **Clés Stripe production** :
   - Obtenir les clés `sk_live_` et `pk_live_`
   - Les ajouter dans les variables Render

2. **Plan payant Render** :
   - Changer le plan à Standard (~10€/mois)
   - Instance toujours active

3. **Domaine custom** :
   - Acheter un domaine
   - Configurer le DNS dans Render

---

## 📞 Troubleshooting

### "Backend ne démarre pas"
```bash
# Vérifier les logs Render
# Dashboard → Web Service → Logs
```

### "CORS error"
- Vérifier FRONTEND_URL et CORS_ORIGIN dans les variables

### "Database connection error"
- Vérifier DATABASE_URL en copiant depuis Supabase
- Vérifier que Supabase est créé

### "Stripe error"
- Vérifier clés Stripe dans les variables
- Mode TEST vs PRODUCTION

---

## ✨ Vous avez maintenant

✅ SaaS en ligne (gratuit)
✅ Domaine Render (.onrender.com)
✅ Base de données Supabase
✅ Paiements Stripe test
✅ Accessible 24/7

**Prêt pour inviter utilisateurs ! 🚀**

---

*MECAPRO © 2026 - Instant Deployment Ready*
