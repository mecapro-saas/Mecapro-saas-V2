#!/bin/bash

# ============================================
# Script de déploiement MECAPRO sur AWS EC2
# ============================================

set -e

echo "🚀 Déploiement MECAPRO..."

# Variables
AWS_REGION="eu-west-1"
EC2_INSTANCE_ID="i-xxxxxxxxxxxxx"  # À remplacer
DOMAIN="app.mecapro.fr"
CERT_ARN="arn:aws:acm:eu-west-1:xxxxx:certificate/xxxx"  # À remplacer

# 1. Créer instance EC2
echo "1️⃣ Création instance EC2..."
aws ec2 run-instances \
  --image-id ami-0d71ea30463e0ff8d \
  --instance-type t3.small \
  --key-name mecapro-key \
  --security-groups mecapro-sg \
  --region $AWS_REGION \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=mecapro-backend}]' \
  || echo "Instance déjà créée"

# 2. Obtenir IP instance
echo "2️⃣ Récupération IP..."
INSTANCE_IP=$(aws ec2 describe-instances \
  --instance-ids $EC2_INSTANCE_ID \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --region $AWS_REGION \
  --output text)

echo "Instance IP: $INSTANCE_IP"

# 3. Attendre que l'instance soit accessible
echo "3️⃣ Attente que l'instance soit prête..."
sleep 30

# 4. Connexion SSH et setup
echo "4️⃣ Configuration EC2..."
ssh -i ~/.aws/mecapro-key.pem ec2-user@$INSTANCE_IP << 'EOF'
  # Installer Docker
  sudo yum update -y
  sudo yum install docker git -y
  sudo usermod -aG docker ec2-user

  # Installer Docker Compose
  sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose

  # Cloner le repo
  git clone https://github.com/votre-username/mecapro-saas.git
  cd mecapro-saas

  # Créer .env
  cat > .env << 'ENVEOF'
  NODE_ENV=production
  PORT=3000

  # Supabase
  DATABASE_URL=postgresql://username:password@db.supabase.co:5432/postgres

  # JWT
  JWT_SECRET=your_very_long_secret_key_min_32_chars

  # Stripe Production
  STRIPE_SECRET_KEY=sk_live_your_key
  STRIPE_PUBLISHABLE_KEY=pk_live_your_key
  STRIPE_WEBHOOK_SECRET=whsec_your_key
  STRIPE_PRICE_STARTER=price_1234567890
  STRIPE_PRICE_PRO=price_0987654321
  STRIPE_PRICE_PREMIUM=price_1122334455

  # Frontend
  FRONTEND_URL=https://app.mecapro.fr
  CORS_ORIGIN=https://app.mecapro.fr
  ENVEOF

  # Lancer les services
  docker-compose up -d
EOF

# 5. Créer Load Balancer
echo "5️⃣ Création Load Balancer..."
aws elbv2 create-load-balancer \
  --name mecapro-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-xxxxx \
  --region $AWS_REGION \
  --tags Key=Name,Value=mecapro-alb \
  || echo "Load Balancer déjà créé"

# 6. Configuration SSL/HTTPS
echo "6️⃣ Configuration SSL (ACM)..."
# Certificat ACM doit être créé manuellement via AWS Console

# 7. Configurer Route 53
echo "7️⃣ Configuration DNS..."
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch file://route53-changes.json \
  || echo "DNS déjà configuré"

echo "✅ Déploiement complété !"
echo "🌐 Accédez à: https://$DOMAIN"
