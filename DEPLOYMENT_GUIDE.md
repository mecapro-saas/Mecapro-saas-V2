# 🚀 MECAPRO - Guide Complet de Déploiement

## 📋 Table des matières
1. [Prérequis](#prérequis)
2. [Setup Local](#setup-local)
3. [Configuration Supabase](#configuration-supabase)
4. [Configuration Stripe](#configuration-stripe)
5. [Déploiement AWS](#déploiement-aws)
6. [Points d'accès](#points-daccès)

---

## 🔧 Prérequis

### Avant de commencer, vous devez avoir:

- **Node.js 18+** : https://nodejs.org/
- **Docker & Docker Compose** : https://www.docker.com/
- **Git** : https://git-scm.com/
- **Compte Supabase** : https://supabase.com/ (gratuit)
- **Compte Stripe** : https://stripe.com/ (mode test + production)
- **Compte AWS** : https://aws.amazon.com/
- **Domaine** (optionnel pour production)

---

## 🏠 Setup Local

### 1. Cloner le projet

```bash
git clone https://github.com/votre-username/mecapro-saas.git
cd mecapro-saas
```

### 2. Variables d'environnement

**Backend** - Créer `backend/.env` depuis `backend/.env.example`:

```bash
cp backend/.env.example backend/.env
```

Remplir les valeurs :
- `DATABASE_URL` : Supabase PostgreSQL
- `JWT_SECRET` : Générer avec `openssl rand -hex 32`
- Clés Stripe (mode test)

**Frontend** - Créer `frontend/.env`:

```bash
cp frontend/.env.example frontend/.env
```

### 3. Démarrer en local avec Docker

```bash
# Lancer tous les services
docker-compose up -d

# Attendre que tout soit prêt (~30s)
sleep 30

# Initialiser la BD
docker-compose exec backend npm run prisma:migrate

# Vérifier les logs
docker-compose logs -f
```

### 4. Accès local

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:3001/api
- **Health check** : http://localhost:3001/api/health

---

## 🗄️ Configuration Supabase

### 1. Créer un projet Supabase

1. Aller sur https://supabase.com/
2. Cliquer "New project"
3. Remplir les infos (nom: "mecapro")
4. Attendre création (~2 min)

### 2. Récupérer les credentials

1. Aller dans Settings → Database
2. Copier la connection string (format: `postgresql://...`)
3. Remplacer `DATABASE_URL` dans le `.env`

### 3. Initialiser la BD

```bash
# Le script docker-compose le fait automatiquement
# Mais si besoin manuel :

docker-compose exec backend npm run prisma:migrate
```

### 4. Vérifier la connexion

```bash
curl http://localhost:3001/api/health
# Doit retourner : {"status":"ok","timestamp":"2024-03-24T..."}
```

---

## 💳 Configuration Stripe

### 1. Créer un compte Stripe

1. Aller sur https://stripe.com/
2. Se connecter / créer compte
3. Accepter les conditions

### 2. Obtenir les clés (Mode Test)

1. Dashboard → Développement → Clés API
2. Copier :
   - `Secret Key` (sk_test_...)
   - `Publishable Key` (pk_test_...)
3. Ajouter dans `.env`

### 3. Créer les produits/prix

1. Dashboard → Produits → Créer un produit
2. Pour chaque plan (STARTER, PRO, PREMIUM) :
   - Nom : "MECAPRO - Plan Starter" (par exemple)
   - Type de tarification : Facturé mensuellement
   - Prix : 79€, 149€, 299€
3. Copier les price IDs (price_...) dans `.env`

Exemple :
```
STRIPE_PRICE_STARTER=price_1234567890
STRIPE_PRICE_PRO=price_0987654321
STRIPE_PRICE_PREMIUM=price_1122334455
```

### 4. Configurer les webhooks

1. Dashboard → Développement → Webhooks
2. Cliquer "Ajouter un endpoint"
3. URL : `https://votre-domaine.com/api/payment/webhook`
4. Événements à écouter :
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
5. Copier le "Signing secret" dans `.env` : `STRIPE_WEBHOOK_SECRET`

### 5. Tester les paiements

Carte de test Stripe :
- Numéro : `4242 4242 4242 4242`
- Date : `12/25` (future)
- CVC : `123`

---

## 🚀 Déploiement AWS

### 1. Préparer les credentials AWS

```bash
# Installer AWS CLI
brew install awscli  # macOS
# ou windows/linux depuis : https://aws.amazon.com/cli/

# Configurer credentials
aws configure
# Entrer :
# - Access Key ID : ...
# - Secret Access Key : ...
# - Region : eu-west-1
# - Format : json
```

### 2. Créer la sécurité groupe (Security Group)

```bash
aws ec2 create-security-group \
  --group-name mecapro-sg \
  --description "MECAPRO Security Group" \
  --region eu-west-1

# Ajouter règles :
aws ec2 authorize-security-group-ingress \
  --group-name mecapro-sg \
  --protocol tcp --port 22 --cidr 0.0.0.0/0 \
  --region eu-west-1

aws ec2 authorize-security-group-ingress \
  --group-name mecapro-sg \
  --protocol tcp --port 80 --cidr 0.0.0.0/0 \
  --region eu-west-1

aws ec2 authorize-security-group-ingress \
  --group-name mecapro-sg \
  --protocol tcp --port 443 --cidr 0.0.0.0/0 \
  --region eu-west-1

aws ec2 authorize-security-group-ingress \
  --group-name mecapro-sg \
  --protocol tcp --port 3000 --cidr 0.0.0.0/0 \
  --region eu-west-1
```

### 3. Lancer une instance EC2

```bash
# Créer une paire de clés
aws ec2 create-key-pair \
  --key-name mecapro-key \
  --region eu-west-1 \
  --query 'KeyMaterial' \
  --output text > mecapro-key.pem

chmod 400 mecapro-key.pem

# Lancer l'instance
aws ec2 run-instances \
  --image-id ami-0d71ea30463e0ff8d \
  --instance-type t3.small \
  --key-name mecapro-key \
  --security-groups mecapro-sg \
  --region eu-west-1 \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=mecapro-backend}]'
```

### 4. Se connecter à l'instance

```bash
# Récupérer l'IP
INSTANCE_IP=$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=mecapro-backend" \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --region eu-west-1 \
  --output text)

# SSH
ssh -i mecapro-key.pem ec2-user@$INSTANCE_IP
```

### 5. Setup l'instance

```bash
# Sur la machine EC2 :
sudo yum update -y
sudo yum install docker git -y
sudo usermod -aG docker ec2-user

# Installer Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Cloner le repo
git clone https://github.com/votre-username/mecapro-saas.git
cd mecapro-saas

# Créer .env avec les credentials (production)
nano .env
# (Coller les valeurs production)

# Lancer Docker
docker-compose up -d

# Vérifier
docker-compose logs -f
```

### 6. Setup Reverse Proxy Nginx (optionnel mais recommandé)

```bash
# Installer Nginx
sudo yum install nginx -y

# Créer config
sudo tee /etc/nginx/conf.d/mecapro.conf > /dev/null <<EOF
server {
    listen 80;
    server_name app.mecapro.fr;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Redémarrer Nginx
sudo systemctl restart nginx
```

### 7. Setup SSL avec Let's Encrypt (Certbot)

```bash
# Installer Certbot
sudo yum install certbot python3-certbot-nginx -y

# Créer certificat
sudo certbot certonly --nginx \
  -d app.mecapro.fr \
  --non-interactive \
  --agree-tos \
  -m votre@email.com
```

---

## 🌐 Points d'accès

### Environnement de développement
- Frontend : http://localhost:3000
- Backend : http://localhost:3001/api
- Swagger/Docs : (à implémenter)

### Environnement de production (AWS)
- Frontend : https://app.mecapro.fr
- Backend : https://app.mecapro.fr/api
- Health : https://app.mecapro.fr/api/health

---

## 📊 Monitoring & Logs

### Logs locaux
```bash
# Backend
docker-compose logs -f backend

# Frontend
docker-compose logs -f frontend

# Database
docker-compose logs -f postgres
```

### Logs AWS
```bash
# Accéder à l'instance
ssh -i mecapro-key.pem ec2-user@$INSTANCE_IP

# Logs Docker
docker-compose logs -f

# Logs système
sudo tail -f /var/log/messages
```

---

## ✅ Checklist de lancement

- [ ] Supabase configuré et connecté
- [ ] Stripe production clés obtenues
- [ ] Domaine acheté (optionnel)
- [ ] Certificat SSL généré
- [ ] EC2 créée et configurée
- [ ] Base de données migrée
- [ ] Webhooks Stripe configurés
- [ ] Variables d'environnement production
- [ ] CORS configuré correctement
- [ ] Backup database configuré

---

## 🆘 Troubleshooting

### "Cannot connect to database"
```bash
# Vérifier DATABASE_URL
docker-compose exec backend npx prisma studio

# Tester connexion
docker-compose exec postgres psql -U mecapro -d mecapro_db -c "SELECT 1"
```

### "CORS error"
```bash
# Vérifier FRONTEND_URL et CORS_ORIGIN dans .env backend
# Doit correspondre exactement à l'URL du frontend (protocole + domaine)
```

### "Stripe webhook not working"
```bash
# Vérifier STRIPE_WEBHOOK_SECRET
# Tester avec Stripe CLI :
stripe listen --forward-to localhost:3001/api/payment/webhook
```

---

## 📞 Support

Pour les problèmes :
1. Consulter les logs
2. Vérifier les variables d'environnement
3. Vérifier la connexion réseau
4. Contacter support@mecapro.fr

---

**Créé le : 24 Mars 2026**
**Version : 1.0.0**
