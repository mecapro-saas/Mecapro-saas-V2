# 🎉 MECAPRO - Déploiement MAINTENANT (15 minutes)

## ⚡ Vous allez avoir un SaaS en ligne en 15 minutes !

---

## 🔥 RÉSUMÉ SUPER RAPIDE

| Étape | Durée | Action |
|-------|-------|--------|
| 1 | 3 min | Créer Supabase + copier connection |
| 2 | 2 min | Créer Stripe test keys + produits |
| 3 | 5 min | Push code sur GitHub |
| 4 | 5 min | Déployer sur Render |
| **TOTAL** | **15 min** | **LIVE !** ✅ |

---

## 📋 AVANT DE COMMENCER

Avoir ouvert dans des onglets :
- https://github.com/
- https://render.com/
- https://supabase.com/
- https://stripe.com/

---

## 🎯 ÉTAPE 1 : Supabase (3 min)

### 1️⃣ Créer projet Supabase

1. Aller https://supabase.com/ → **New Project**
2. Remplir :
   - Name : `mecapro`
   - Region : `Paris`
   - Password : générer
3. Cliquer **Create new project**
4. **ATTENDRE 2-3 MIN**

### 2️⃣ Copier la connection string

1. **Settings** → **Database**
2. Copier **Connection String → URI**
3. ⚠️ **Remplacer [YOUR-PASSWORD]** par votre password

**Vous avez maintenant :** `postgresql://...`

---

## 🎯 ÉTAPE 2 : Stripe (2 min)

### 1️⃣ Créer account Stripe

1. Aller https://stripe.com/ → **Sign up**
2. S'inscrire avec email
3. Confirmer email

### 2️⃣ Obtenir clés API

1. **Developers** → **API Keys**
2. **Mode Test** (toggle en haut)
3. Copier :
   - **Secret Key** : `sk_test_XXXXX` ← Copier
   - **Publishable Key** : `pk_test_XXXXX` ← Copier

### 3️⃣ Créer produits

1. **Products** → **Add product**
2. Créer 3 produits :

**STARTER :**
- Name : `MECAPRO - Plan Starter`
- Price : 79 EUR / Month
- Copier Price ID (price_XXXXX)

**PRO :**
- Name : `MECAPRO - Plan Pro`
- Price : 149 EUR / Month
- Copier Price ID

**PREMIUM :**
- Name : `MECAPRO - Plan Premium`
- Price : 299 EUR / Month
- Copier Price ID

### 4️⃣ Créer webhook

1. **Webhooks** → **Add endpoint**
2. URL : `https://mecapro-backend.onrender.com/api/payment/webhook`
   (Vous aurez cette URL après Render)
3. Events : Cocher ces 4 :
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
4. Cliquer **Add endpoint**
5. Copier **Signing Secret** : `whsec_XXXXX`

**Vous avez maintenant :**
- `sk_test_XXXXX`
- `pk_test_XXXXX`
- `whsec_XXXXX`
- `price_XXXXX` (3x)

---

## 🎯 ÉTAPE 3 : GitHub (5 min)

### 1️⃣ Créer un repo GitHub

1. Aller https://github.com/ → **New**
2. Remplir :
   - Name : `mecapro-saas`
   - Public : ✅ Cocher
3. Cliquer **Create repository**

### 2️⃣ Pousser le code

```bash
# Dans le dossier mecapro-saas

git init
git add .
git commit -m "Initial - MECAPRO SaaS"

# REMPLACER USERNAME par votre username GitHub
git remote add origin https://github.com/USERNAME/mecapro-saas.git
git branch -M main
git push -u origin main
```

**Code est maintenant sur GitHub ! ✅**

---

## 🎯 ÉTAPE 4 : Render (5 min)

### 1️⃣ Créer Web Service pour Backend

1. Aller https://render.com/ → Sign Up (gratuit)
2. Dashboard → **New +** → **Web Service**
3. Connecter GitHub (autoriser)
4. Sélectionner repo : `mecapro-saas`
5. Remplir :
   - **Name** : `mecapro-backend`
   - **Runtime** : `Node`
   - **Build Command** : `cd backend && npm install && npm run build`
   - **Start Command** : `cd backend && npm start`
   - **Plan** : Free ✅
6. Cliquer **Create Web Service**

### 2️⃣ Ajouter variables Backend

Dans l'onglet **Environment**, ajouter :

```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.supabase.co:5432/postgres
JWT_SECRET=your_secret_key_min_32_chars_change_this
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
4. **ATTENDRE 5-10 MIN**
5. Copier l'URL générée (ex: `https://mecapro-backend.onrender.com`)

### 3️⃣ Créer Static Site pour Frontend

1. Dashboard → **New +** → **Static Site**
2. Sélectionner repo : `mecapro-saas`
3. Remplir :
   - **Name** : `mecapro-frontend`
   - **Build Command** : `cd frontend && npm install && npm run build`
   - **Publish Directory** : `frontend/dist`
4. Cliquer **Create Static Site**

### 4️⃣ Ajouter variables Frontend

```
VITE_API_URL=https://mecapro-backend.onrender.com/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXX
```

5. Cliquer **Deploy**
6. **ATTENDRE 3-5 MIN**
7. Copier l'URL frontend (ex: `https://mecapro-frontend.onrender.com`)

### 5️⃣ Mettre à jour Stripe Webhook

1. Aller dans Stripe → **Webhooks**
2. Éditer l'endpoint créé plus tôt
3. Changer l'URL : `https://mecapro-backend.onrender.com/api/payment/webhook`
4. Sauvegarder

---

## ✅ C'EST FINI !

Votre SaaS est maintenant EN LIGNE ! 🎉

### 🌐 Points d'accès

```
Frontend  : https://mecapro-frontend.onrender.com
Backend   : https://mecapro-backend.onrender.com/api
Health    : https://mecapro-backend.onrender.com/api/health
```

### 🧪 Tester

1. Ouvrir https://mecapro-frontend.onrender.com
2. Créer un compte (Entreprise ou Mécanicien)
3. Chercher des mécaniciens
4. Tester l'abonnement
   - Carte test Stripe : `4242 4242 4242 4242`
   - Date future : `12/25`
   - CVC : `123`

---

## 📝 Note importante

**Renommer le domaine :**

Render génère des domaines style `mecapro-backend.onrender.com`

Pour avoir un vrai domaine :
1. Acheter un domaine (GoDaddy, OVH, etc.)
2. Dans Render → Settings → Custom Domain
3. Configurer les DNS

---

## 🚨 Si ça ne marche pas

### "Backend ne démarre pas"
```bash
# Aller dans Render → Web Service → Logs
# Voir l'erreur exacte
# Souvent : DATABASE_URL mal copiée
```

### "CORS error"
- Vérifier que FRONTEND_URL et CORS_ORIGIN dans Render
- Doivent être les URLs Render exactes

### "Database error"
- Vérifier DATABASE_URL (copier directement de Supabase)
- Vérifier [PASSWORD] remplacé

### "Stripe error"
- Vérifier clés Stripe (copier depuis dashboard)
- Vérifier webhook URL correcte

---

## 📞 Support rapide

| Problème | Solution |
|----------|----------|
| Backend erro | Vérifier logs Render |
| Frontend blanc | Attendre déploiement (5 min) |
| CORS error | Vérifier FRONTEND_URL |
| Stripe fail | Vérifier clés API |
| DB error | Vérifier DATABASE_URL |

---

## 🎯 Prochaines étapes (optionnel)

1. **Domaine custom** : Acheter + configurer
2. **Clés Stripe production** : Pour vraies transactions
3. **Plan payant Render** : Pour instance toujours active
4. **Email notifications** : SendGrid/Resend
5. **Analytics** : Google Analytics

---

## 🎉 BRAVO !

Vous avez un **SaaS COMPLET, SÉCURISÉ et EN LIGNE** !

Maintenant vous pouvez :
- ✅ Inviter entreprises et mécaniciens
- ✅ Tester la plateforme
- ✅ Recevoir des retours
- ✅ Itérer

---

## 📊 Coûts

| Service | Coût | Notes |
|---------|------|-------|
| Render | Gratuit | Dormant après 15 min |
| Supabase | Gratuit | Généreux free tier |
| Stripe | Gratuit | Test mode |
| Domaine | ~10€/an | Optionnel |
| **TOTAL** | **Gratuit** | Utilisez, testez ! |

---

## 🎉 Vous avez maintenant

✅ Frontend en ligne
✅ Backend en ligne
✅ Base de données en ligne
✅ Paiements intégrés
✅ Prêt pour les utilisateurs
✅ **GRATUIT !**

---

**Le SaaS est LIVE ! 🚀**

Accédez à : https://mecapro-frontend.onrender.com

---

*MECAPRO © 2026 - Instant Deployment Complete*
