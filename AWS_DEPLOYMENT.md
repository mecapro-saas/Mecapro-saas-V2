# 🚀 MECAPRO - Déploiement AWS Complet

## ⚡ Déploiement en 30 minutes

### 📋 Prérequis

Avant de commencer, vous devez avoir :

1. **Compte AWS** : https://aws.amazon.com/ (gratuit avec 12 mois)
2. **AWS CLI** installé
3. **Git** installé
4. **Domaine** (optionnel mais recommandé)
5. **Certificat SSL** via AWS ACM (gratuit)

---

## ✅ ÉTAPE 1 : Préparer AWS (5 min)

### 1.1 Installer AWS CLI

```bash
# macOS
brew install awscli

# Ubuntu/Linux
sudo apt-get install awscli

# Windows
# Télécharger depuis : https://aws.amazon.com/cli/
```

### 1.2 Configurer AWS Credentials

```bash
# Créer credentials via AWS Console
# 1. AWS Console → IAM → Users → Add User
# 2. Permissions : AdministratorAccess
# 3. Créer Access Key ID + Secret Access Key
# 4. Télécharger le CSV

# Configurer localement
aws configure

# Entrer :
# AWS Access Key ID: AKIAIOSFODNN7EXAMPLE
# AWS Secret Access Key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
# Default region: eu-west-1
# Default output format: json
```

### 1.3 Vérifier la configuration

```bash
aws sts get-caller-identity
# Doit retourner votre Account ID
```

---

## ✅ ÉTAPE 2 : Créer Infrastructure AWS (10 min)

### 2.1 Créer une paire de clés SSH

```bash
# Générer une clé pour EC2
aws ec2 create-key-pair \
  --key-name mecapro-prod \
  --region eu-west-1 \
  --query 'KeyMaterial' \
  --output text > ~/mecapro-prod.pem

# Sécuriser la clé
chmod 400 ~/mecapro-prod.pem

echo "✅ Clé créée : ~/mecapro-prod.pem"
```

### 2.2 Créer Security Group

```bash
# Créer le groupe
SG_ID=$(aws ec2 create-security-group \
  --group-name mecapro-sg \
  --description "MECAPRO Security Group" \
  --region eu-west-1 \
  --query 'GroupId' \
  --output text)

echo "✅ Security Group créé : $SG_ID"

# Ajouter règles d'accès
# SSH (port 22)
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 22 \
  --cidr 0.0.0.0/0 \
  --region eu-west-1

# HTTP (port 80)
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0 \
  --region eu-west-1

# HTTPS (port 443)
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0 \
  --region eu-west-1

# Backend (port 3001)
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 3001 \
  --cidr 0.0.0.0/0 \
  --region eu-west-1

echo "✅ Règles de sécurité configurées"
```

### 2.3 Lancer Instance EC2

```bash
# Lancer l'instance
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id ami-0d71ea30463e0ff8d \
  --instance-type t3.small \
  --key-name mecapro-prod \
  --security-group-ids $SG_ID \
  --region eu-west-1 \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=mecapro-prod}]' \
  --query 'Instances[0].InstanceId' \
  --output text)

echo "✅ Instance créée : $INSTANCE_ID"
echo "⏳ Attente du démarrage (30 secondes)..."
sleep 30

# Récupérer l'IP publique
EC2_IP=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --region eu-west-1 \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

echo "✅ IP EC2 : $EC2_IP"
```

---

## ✅ ÉTAPE 3 : Déployer le Code (10 min)

### 3.1 Se connecter à l'instance

```bash
# SSH vers l'instance
ssh -i ~/mecapro-prod.pem ec2-user@$EC2_IP

# Vous êtes maintenant sur l'instance EC2
```

### 3.2 Sur l'instance EC2 - Installer dépendances

```bash
# Mettre à jour système
sudo yum update -y

# Installer Docker
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

echo "✅ Dépendances installées"
```

### 3.3 Sur l'instance EC2 - Cloner le code

```bash
# Créer dossier app
mkdir -p ~/mecapro
cd ~/mecapro

# Cloner le code depuis GitHub
git clone https://github.com/votre-username/mecapro-saas.git .

echo "✅ Code cloné"
```

### 3.4 Sur l'instance EC2 - Configurer les variables

```bash
# Créer le fichier .env backend
cat > backend/.env << 'EOF'
NODE_ENV=production
PORT=3000

# Supabase PostgreSQL
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[db]

# JWT
JWT_SECRET=your_long_secret_key_min_32_chars_CHANGE_THIS

# Stripe (Production Keys)
STRIPE_SECRET_KEY=sk_live_your_production_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_production_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Price IDs
STRIPE_PRICE_STARTER=price_1234567890
STRIPE_PRICE_PRO=price_0987654321
STRIPE_PRICE_PREMIUM=price_1122334455

# Frontend
FRONTEND_URL=https://app.mecapro.fr
CORS_ORIGIN=https://app.mecapro.fr
EOF

# Créer le fichier .env frontend
cat > frontend/.env << 'EOF'
VITE_API_URL=https://app.mecapro.fr/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_production_key
EOF

echo "✅ Variables configurées"
```

### 3.5 Sur l'instance EC2 - Lancer Docker

```bash
# Lancer les services
docker-compose up -d

# Attendre le démarrage
sleep 60

# Vérifier les logs
docker-compose logs -f

# Vérifier la santé
curl http://localhost:3001/api/health

echo "✅ Services lancés !"
```

---

## ✅ ÉTAPE 4 : Configurer Domain + HTTPS (5 min)

### 4.1 Créer un certificat SSL (AWS ACM)

```bash
# Depuis votre machine locale (pas l'instance EC2)

# Créer le certificat (remplacer par votre domaine)
aws acm request-certificate \
  --domain-name app.mecapro.fr \
  --subject-alternative-names app.mecapro.fr \
  --validation-method DNS \
  --region eu-west-1

# Récupérer l'ARN du certificat
CERT_ARN=$(aws acm list-certificates \
  --region eu-west-1 \
  --query "CertificateSummaryList[0].CertificateArn" \
  --output text)

echo "✅ Certificat créé : $CERT_ARN"
```

### 4.2 Ajouter Nginx comme Reverse Proxy (sur EC2)

```bash
# SSH vers l'instance
ssh -i ~/mecapro-prod.pem ec2-user@$EC2_IP

# Installer Nginx
sudo yum install nginx -y

# Créer config
sudo tee /etc/nginx/conf.d/mecapro.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name app.mecapro.fr;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.mecapro.fr;

    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Tester config
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "✅ Nginx configuré"
```

### 4.3 Configurer DNS (Route53)

```bash
# Depuis votre machine locale

# Créer une zone Route53 (si domaine géré par AWS)
ZONE_ID=$(aws route53 create-hosted-zone \
  --name app.mecapro.fr \
  --caller-reference $(date +%s) \
  --region eu-west-1 \
  --query 'HostedZone.Id' \
  --output text)

# Créer un record A pointant vers l'IP EC2
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

echo "✅ DNS configuré"
```

---

## ✅ ÉTAPE 5 : Monitoring & Logs (Optionnel mais Recommandé)

### 5.1 CloudWatch Logs

```bash
# Envoyer les logs Docker vers CloudWatch
aws logs create-log-group --log-group-name /mecapro/backend --region eu-west-1
aws logs create-log-group --log-group-name /mecapro/frontend --region eu-west-1

echo "✅ Log groups créés"
```

### 5.2 Alertes automatiques

```bash
# Créer une alarme si l'instance se coupe
aws cloudwatch put-metric-alarm \
  --alarm-name mecapro-instance-down \
  --alarm-description "Alert if EC2 instance is down" \
  --metric-name StatusCheckFailed \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 60 \
  --threshold 1 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --region eu-west-1

echo "✅ Alarmes configurées"
```

---

## 🔄 Redéployer après modifications

```bash
# SSH vers l'instance
ssh -i ~/mecapro-prod.pem ec2-user@$EC2_IP

# Aller dans le dossier app
cd ~/mecapro

# Pull les dernières modifications
git pull origin main

# Redémarrer les services
docker-compose down
docker-compose up -d

# Vérifier les logs
docker-compose logs -f

echo "✅ Application mise à jour"
```

---

## 📊 Vérification Finale

### Checklist de déploiement

```bash
# ✅ Accéder à l'app
curl https://app.mecapro.fr/

# ✅ Vérifier santé
curl https://app.mecapro.fr/api/health

# ✅ Vérifier les logs
ssh -i ~/mecapro-prod.pem ec2-user@$EC2_IP
docker-compose logs -f

# ✅ Vérifier la base de données
# Aller dans Supabase Dashboard → SQL Editor
SELECT COUNT(*) FROM "User";

# ✅ Tester l'inscription
# Ouvrir https://app.mecapro.fr/register
# Créer un compte

# ✅ Tester les paiements
# Aller dans tableau de bord
# Cliquer sur "Upgrade Plan"
# Utiliser carte de test Stripe : 4242 4242 4242 4242
```

---

## 💰 Estimation des Coûts AWS

| Service | Estimation mensuelle |
|---------|----------------------|
| EC2 t3.small | ~15-20€ |
| RDS (optionnel) | ~25-50€ |
| Route53 | ~0.50€ |
| Data transfer | ~5-10€ |
| CloudWatch | Gratuit (inclus) |
| **TOTAL** | **~50-80€/mois** |

*Avec free tier AWS, c'est gratuit la première année !*

---

## 🚨 Sécurité - À Faire

- [ ] Changer `JWT_SECRET` par une vraie clé (générer avec `openssl rand -hex 32`)
- [ ] Utiliser Stripe clés **production** (pas test)
- [ ] Configurer HTTPS (certificat SSL)
- [ ] Activer backups RDS (snapshots quotidiens)
- [ ] Configurer monitoring CloudWatch
- [ ] Activer CloudTrail pour audit
- [ ] Ajouter WAF (Web Application Firewall)

---

## 📈 Scaling (si besoin)

### Auto-scaling quand ça grandit

```bash
# Créer un Auto Scaling Group
aws autoscaling create-launch-configuration \
  --launch-configuration-name mecapro-lc \
  --image-id ami-0d71ea30463e0ff8d \
  --instance-type t3.small \
  --key-name mecapro-prod \
  --security-groups $SG_ID \
  --region eu-west-1

# Créer Auto Scaling Group
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name mecapro-asg \
  --launch-configuration-name mecapro-lc \
  --min-size 2 \
  --max-size 10 \
  --desired-capacity 2 \
  --availability-zones eu-west-1a eu-west-1b \
  --region eu-west-1

echo "✅ Auto-scaling configuré"
```

---

## 🆘 Troubleshooting

### "Connection refused"
```bash
# Vérifier que les services tournent
docker-compose ps

# Redémarrer
docker-compose restart
```

### "CORS error"
```bash
# Vérifier FRONTEND_URL et CORS_ORIGIN
docker-compose exec backend printenv | grep CORS
docker-compose exec backend printenv | grep FRONTEND

# Doit matcher votre domaine exactement
```

### "Stripe webhook not working"
```bash
# Vérifier que le webhook est configuré
# Stripe Dashboard → Webhooks
# URL doit être : https://app.mecapro.fr/api/payment/webhook

# Tester avec Stripe CLI
stripe listen --forward-to app.mecapro.fr/api/payment/webhook
```

### "Base de données pleine"
```bash
# Vérifier l'utilisation Supabase
# Supabase Dashboard → Database → Storage

# Nettoyer si nécessaire
docker-compose exec backend npx prisma db seed
```

---

## 🎯 Vous êtes maintenant en PRODUCTION ! 🎉

Votre SaaS est :
- ✅ Accessible publiquement
- ✅ Sécurisé (HTTPS)
- ✅ Scalable (auto-scaling possible)
- ✅ Monitoré (CloudWatch)
- ✅ Sauvegardé (Supabase backups)

**Vous pouvez maintenant inviter vos utilisateurs ! 🚀**

---

## 📞 Support

Pour les problèmes :
1. Vérifier les logs : `docker-compose logs -f`
2. Consulter CloudWatch
3. Tester la connexion : `telnet app.mecapro.fr 443`
4. Vérifier les variables .env

---

*MECAPRO AWS Deployment © 2026*
