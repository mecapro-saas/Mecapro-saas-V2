# 🚀 MECAPRO - Déploiement Étape par Étape

## 📋 Résumé (30 minutes)

| Étape | Durée | Description |
|-------|-------|-------------|
| 1 | 5 min | Préparer AWS (CLI, credentials) |
| 2 | 5 min | Lancer instance EC2 + configure sécurité |
| 3 | 5 min | Déployer le code |
| 4 | 5 min | Configurer variables d'environnement |
| 5 | 5 min | Lancer les services Docker |
| **Total** | **30 min** | **SaaS en production !** |

---

## ✅ AVANT DE DÉMARRER

Assurez-vous d'avoir :

- [ ] **Compte AWS** (créé sur https://aws.amazon.com/)
- [ ] **Clés d'accès AWS** (créées dans IAM → Users)
- [ ] **Supabase database** (URL connection string prête)
- [ ] **Clés Stripe production** (sk_live_... et pk_live_...)
- [ ] **Domaine** (optionnel mais recommandé)
- [ ] **Git installé** sur votre machine
- [ ] **AWS CLI installé** sur votre machine

---

## 🎯 ÉTAPE 1 : Configurer AWS (5 min)

### 1️⃣ Installer AWS CLI

**macOS :**
```bash
brew install awscli
```

**Ubuntu/Debian :**
```bash
sudo apt-get update
sudo apt-get install awscli -y
```

**Windows :**
- Télécharger depuis : https://aws.amazon.com/cli/
- Installer l'exécutable

### 2️⃣ Vérifier l'installation

```bash
aws --version
# Doit afficher : aws-cli/2.x.x
```

### 3️⃣ Configurer les credentials

**Créer les credentials dans AWS :**
1. Aller sur https://console.aws.amazon.com/
2. IAM → Users → Add User
3. Nom : `mecapro-deployer`
4. Permissions : `AdministratorAccess`
5. Créer Access Key → Télécharger le CSV

**Configurer localement :**
```bash
aws configure

# Entrer les informations :
# AWS Access Key ID: AKIAIOSFODNN7EXAMPLE
# AWS Secret Access Key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
# Default region: eu-west-1
# Default output format: json
```

### 4️⃣ Vérifier la configuration

```bash
aws sts get-caller-identity

# Doit afficher :
# {
#     "UserId": "AIDAI...",
#     "Account": "123456789012",
#     "Arn": "arn:aws:iam::123456789012:user/mecapro-deployer"
# }
```

✅ **Étape 1 complétée !**

---

## 🎯 ÉTAPE 2 : Lancer l'infrastructure AWS (5 min)

### Option A : Automatique (Recommandé)

```bash
# Dans le dossier mecapro-saas
chmod +x deploy-aws-auto.sh
./deploy-aws-auto.sh

# ✅ L'instance EC2 est créée et prête !
# Vous aurez des infos comme :
# Instance ID : i-0123456789abcdef
# IP : 54.123.45.67
```

### Option B : Manuel (Détaillé)

Si vous préférez voir chaque étape :

```bash
# 1. Créer paire de clés
aws ec2 create-key-pair \
  --key-name mecapro-prod \
  --region eu-west-1 \
  --query 'KeyMaterial' \
  --output text > ~/mecapro-prod.pem

chmod 400 ~/mecapro-prod.pem

# 2. Créer Security Group
SG_ID=$(aws ec2 create-security-group \
  --group-name mecapro-sg \
  --description "MECAPRO Security Group" \
  --region eu-west-1 \
  --query 'GroupId' \
  --output text)

# 3. Ajouter règles de sécurité
for PORT in 22 80 443 3001; do
  aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp --port $PORT \
    --cidr 0.0.0.0/0 \
    --region eu-west-1 || true
done

# 4. Lancer instance EC2
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id ami-0d71ea30463e0ff8d \
  --instance-type t3.small \
  --key-name mecapro-prod \
  --security-group-ids $SG_ID \
  --region eu-west-1 \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=mecapro-prod}]' \
  --query 'Instances[0].InstanceId' \
  --output text)

echo "Instance créée : $INSTANCE_ID"

# 5. Attendre et récupérer l'IP
sleep 30
EC2_IP=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --region eu-west-1 \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

echo "IP : $EC2_IP"
```

✅ **Étape 2 complétée !**

---

## 🎯 ÉTAPE 3 : Préparer l'instance (5 min)

### 1️⃣ Se connecter à l'instance

```bash
# Attendre 60 secondes (le temps que l'instance démarre)
sleep 60

# Se connecter via SSH
ssh -i ~/mecapro-prod.pem ec2-user@$EC2_IP

# Vous êtes maintenant sur l'instance EC2 !
```

### 2️⃣ Installer Docker et dépendances

```bash
# Sur l'instance EC2 :

# Mettre à jour le système
sudo yum update -y

# Installer Docker et Git
sudo yum install docker git -y

# Ajouter utilisateur au groupe docker
sudo usermod -aG docker ec2-user

# Installer Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose

sudo chmod +x /usr/local/bin/docker-compose

# Démarrer Docker
sudo systemctl start docker
sudo systemctl enable docker

# Vérifier
docker --version
docker-compose --version

# ✅ Dépendances prêtes !
```

✅ **Étape 3 complétée !**

---

## 🎯 ÉTAPE 4 : Déployer le code (5 min)

### 1️⃣ Cloner le code

```bash
# Sur l'instance EC2 :

# Créer dossier app
mkdir -p ~/mecapro
cd ~/mecapro

# Cloner le code
git clone https://github.com/VOTRE_USERNAME/mecapro-saas.git .

# Vérifier
ls -la
# Doit afficher : backend/, frontend/, docker-compose.yml, etc.
```

### 2️⃣ Créer les fichiers .env

#### Backend

```bash
# Sur l'instance EC2 :

# Créer backend/.env
nano backend/.env
```

**Coller ce contenu (adapter vos clés) :**

```ini
NODE_ENV=production
PORT=3000

# DATABASE_URL - Récupérer depuis Supabase
DATABASE_URL=postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DB]

# JWT - Générer avec: openssl rand -hex 32
JWT_SECRET=your_very_long_secret_key_minimum_32_characters

# Stripe - Clés PRODUCTION
STRIPE_SECRET_KEY=sk_live_XXXXXXXXXXXX
STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXX

# Price IDs créés dans Stripe Dashboard
STRIPE_PRICE_STARTER=price_XXXXXXXXXXXX
STRIPE_PRICE_PRO=price_XXXXXXXXXXXX
STRIPE_PRICE_PREMIUM=price_XXXXXXXXXXXX

# Domaine
FRONTEND_URL=https://app.mecapro.fr
CORS_ORIGIN=https://app.mecapro.fr
```

**Sauvegarder :** Ctrl+X, puis Y, puis Entrée

#### Frontend

```bash
# Sur l'instance EC2 :

# Créer frontend/.env
nano frontend/.env
```

**Coller ce contenu :**

```ini
VITE_API_URL=https://app.mecapro.fr/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXXXXX
```

**Sauvegarder :** Ctrl+X, puis Y, puis Entrée

✅ **Étape 4 complétée !**

---

## 🎯 ÉTAPE 5 : Lancer les services (5 min)

### 1️⃣ Lancer Docker

```bash
# Sur l'instance EC2, dans ~/mecapro :

# Démarrer tous les services
docker-compose up -d

# Attendre le démarrage (30-60 secondes)
sleep 60

# Vérifier que tout fonctionne
docker-compose logs -f

# Vous devez voir les logs du démarrage
# Appuyez sur Ctrl+C pour sortir des logs
```

### 2️⃣ Initialiser la base de données

```bash
# Sur l'instance EC2 :

# Appliquer les migrations Prisma
docker-compose exec backend npm run prisma:migrate

# Répondre "y" (yes) aux questions
```

### 3️⃣ Vérifier que tout fonctionne

```bash
# Vérifier la santé du backend
curl http://localhost:3001/api/health

# Doit retourner :
# {"status":"ok","timestamp":"2024-03-24T20:15:00.000Z"}
```

✅ **Étape 5 complétée !**

---

## 🌐 Accès temporaire (avant domaine)

### Accéder via l'IP

```bash
# Frontend
http://54.123.45.67:3000

# Backend
http://54.123.45.67:3001/api
```

**⚠️ IMPORTANT :** Vous devrez mettre à jour `backend/.env` avec l'IP pour que le CORS fonctionne :

```bash
# Sur l'instance EC2 :

nano backend/.env

# Changer :
FRONTEND_URL=http://54.123.45.67:3000
CORS_ORIGIN=http://54.123.45.67:3000

# Sauvegarder et redémarrer :
docker-compose restart backend
```

---

## 🌐 Configurer un domaine (5 min - Optionnel)

### Option 1 : Avec Route53 (AWS)

```bash
# Depuis votre machine locale :

# Créer une zone Route53
ZONE_ID=$(aws route53 create-hosted-zone \
  --name app.mecapro.fr \
  --caller-reference $(date +%s) \
  --query 'HostedZone.Id' \
  --output text)

# Créer un record A
aws route53 change-resource-record-sets \
  --hosted-zone-id $ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "app.mecapro.fr",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "'$EC2_IP'"}]
      }
    }]
  }'

echo "✅ DNS configuré (attendre 5-10 min la propagation)"
```

### Option 2 : Avec un registrar externe (GoDaddy, OVH, etc.)

1. Aller sur votre registrar (GoDaddy, OVH, etc.)
2. Ajouter un record A :
   - Name: `app`
   - Type: `A`
   - Value: `54.123.45.67` (votre IP EC2)
3. Sauvegarder

**Attendre 5-10 minutes pour la propagation DNS**

### Mettre à jour backend/.env

```bash
# Sur l'instance EC2 :

nano backend/.env

# Vérifier que FRONTEND_URL et CORS_ORIGIN utilisent votre domaine :
FRONTEND_URL=https://app.mecapro.fr
CORS_ORIGIN=https://app.mecapro.fr

docker-compose restart backend
```

---

## 🔒 Configurer HTTPS (Optionnel mais Recommandé)

### Installer Certbot

```bash
# Sur l'instance EC2 :

# Installer Nginx et Certbot
sudo yum install nginx certbot python3-certbot-nginx -y

# Générer certificat (remplacer le domaine)
sudo certbot certonly --nginx -d app.mecapro.fr \
  --non-interactive \
  --agree-tos \
  -m votre@email.com

# Certificat généré !
```

### Configurer Nginx

```bash
# Sur l'instance EC2 :

# Créer config Nginx
sudo tee /etc/nginx/conf.d/mecapro.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name app.mecapro.fr;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.mecapro.fr;

    ssl_certificate /etc/letsencrypt/live/app.mecapro.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.mecapro.fr/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:3001/api;
        proxy_set_header Host $host;
    }
}
EOF

# Redémarrer Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# ✅ HTTPS configuré !
```

---

## ✅ Vérifications finales

```bash
# Depuis votre machine locale :

# 1. Vérifier l'API
curl https://app.mecapro.fr/api/health

# 2. Ouvrir dans le navigateur
# Frontend : https://app.mecapro.fr
# Backend API : https://app.mecapro.fr/api/health

# 3. Tester l'inscription
# Créer un compte entreprise/mécanicien

# 4. Tester Stripe
# Aller dans l'app → Abonnement
# Utiliser carte de test : 4242 4242 4242 4242
```

---

## 🎉 Vous êtes en production !

Votre SaaS est maintenant :
- ✅ Accessible publiquement
- ✅ Sécurisé (HTTPS)
- ✅ Fonctionnel
- ✅ Prêt pour les utilisateurs

**Vous pouvez maintenant inviter vos utilisateurs ! 🚀**

---

## 📞 Dépannage rapide

### "Cannot connect to database"
```bash
# Vérifier DATABASE_URL
docker-compose exec backend printenv | grep DATABASE

# Tester la connexion
psql $DATABASE_URL -c "SELECT 1"
```

### "CORS error"
```bash
# Vérifier CORS_ORIGIN
docker-compose exec backend printenv | grep CORS

# Doit correspondre exactement à votre domaine
```

### "Stripe not working"
```bash
# Vérifier les clés
docker-compose exec backend printenv | grep STRIPE

# Doivent être vos clés PRODUCTION (pas test)
```

### "Application ne démarre pas"
```bash
# Voir les logs
docker-compose logs -f

# Redémarrer tous les services
docker-compose down
docker-compose up -d
```

---

## 💡 Astuces

### Mettre à jour le code

```bash
# Sur l'instance EC2 :
cd ~/mecapro
git pull origin main
docker-compose restart backend frontend
```

### Voir les logs en direct

```bash
# Sur l'instance EC2 :
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Accéder à la base de données

```bash
# Sur l'instance EC2 :
docker-compose exec backend npx prisma studio
# Ouvre une interface web sur http://localhost:5555
```

---

## 📊 Coûts AWS

| Service | Coût mensuel |
|---------|-------------|
| EC2 t3.small | ~15€ |
| Data transfer | ~5€ |
| Route53 (optionnel) | ~0.50€ |
| **TOTAL** | **~20€** |

*Avec free tier AWS, c'est gratuit la première année !*

---

## 🎓 Prochaines étapes

1. ✅ **Inviter utilisateurs** - Partager le lien https://app.mecapro.fr
2. ⬜ Ajouter plus de fonctionnalités
3. ⬜ Mettre en place analytics
4. ⬜ Optimiser performance
5. ⬜ Ajouter support/documentation

---

**🎉 Bravo ! Vous êtes en production ! 🚀**

Pour plus d'aide, voir AWS_DEPLOYMENT.md

*MECAPRO © 2026*
