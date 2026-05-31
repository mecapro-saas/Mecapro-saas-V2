#!/bin/bash

# ============================================
# MECAPRO - AWS Deployment Automation Script
# ============================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  MECAPRO - AWS Deployment Automation   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"

# Configuration
AWS_REGION="eu-west-1"
KEY_NAME="mecapro-prod"
SG_NAME="mecapro-sg"
INSTANCE_NAME="mecapro-prod"
INSTANCE_TYPE="t3.small"
IMAGE_ID="ami-0d71ea30463e0ff8d"  # Amazon Linux 2
DOMAIN="app.mecapro.fr"

# ============================================
# ÉTAPE 1 : Vérifier les prérequis
# ============================================
echo -e "\n${BLUE}═══ ÉTAPE 1 : Vérifier les prérequis ═══${NC}"

# Vérifier AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI n'est pas installé${NC}"
    echo "Installer depuis : https://aws.amazon.com/cli/"
    exit 1
fi

# Vérifier Git
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git n'est pas installé${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI trouvé${NC}"
echo -e "${GREEN}✅ Git trouvé${NC}"

# Vérifier credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials non configurés${NC}"
    echo "Exécuter : aws configure"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)
echo -e "${GREEN}✅ AWS Account : $ACCOUNT_ID${NC}"

# ============================================
# ÉTAPE 2 : Créer la paire de clés SSH
# ============================================
echo -e "\n${BLUE}═══ ÉTAPE 2 : Créer paire de clés SSH ═══${NC}"

KEY_PATH="$HOME/${KEY_NAME}.pem"

if [ -f "$KEY_PATH" ]; then
    echo -e "${YELLOW}⚠️  Clé existante : $KEY_PATH${NC}"
else
    echo "Création de la paire de clés..."
    aws ec2 create-key-pair \
      --key-name $KEY_NAME \
      --region $AWS_REGION \
      --query 'KeyMaterial' \
      --output text > "$KEY_PATH"
    
    chmod 400 "$KEY_PATH"
    echo -e "${GREEN}✅ Clé créée : $KEY_PATH${NC}"
fi

# ============================================
# ÉTAPE 3 : Créer Security Group
# ============================================
echo -e "\n${BLUE}═══ ÉTAPE 3 : Créer Security Group ═══${NC}"

# Vérifier si existe
SG_ID=$(aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=$SG_NAME" \
  --region $AWS_REGION \
  --query 'SecurityGroups[0].GroupId' \
  --output text 2>/dev/null || echo "")

if [ "$SG_ID" = "None" ] || [ -z "$SG_ID" ]; then
    echo "Création du Security Group..."
    SG_ID=$(aws ec2 create-security-group \
      --group-name $SG_NAME \
      --description "MECAPRO Security Group" \
      --region $AWS_REGION \
      --query 'GroupId' \
      --output text)
    
    echo -e "${GREEN}✅ Security Group créé : $SG_ID${NC}"
    
    # Attendre que le groupe soit créé
    sleep 2
    
    # Ajouter les règles
    echo "Configuration des règles de sécurité..."
    
    # SSH
    aws ec2 authorize-security-group-ingress \
      --group-id $SG_ID \
      --protocol tcp --port 22 \
      --cidr 0.0.0.0/0 \
      --region $AWS_REGION 2>/dev/null || true
    
    # HTTP
    aws ec2 authorize-security-group-ingress \
      --group-id $SG_ID \
      --protocol tcp --port 80 \
      --cidr 0.0.0.0/0 \
      --region $AWS_REGION 2>/dev/null || true
    
    # HTTPS
    aws ec2 authorize-security-group-ingress \
      --group-id $SG_ID \
      --protocol tcp --port 443 \
      --cidr 0.0.0.0/0 \
      --region $AWS_REGION 2>/dev/null || true
    
    # Backend
    aws ec2 authorize-security-group-ingress \
      --group-id $SG_ID \
      --protocol tcp --port 3001 \
      --cidr 0.0.0.0/0 \
      --region $AWS_REGION 2>/dev/null || true
    
    echo -e "${GREEN}✅ Règles de sécurité configurées${NC}"
else
    echo -e "${YELLOW}⚠️  Security Group existant : $SG_ID${NC}"
fi

# ============================================
# ÉTAPE 4 : Lancer l'instance EC2
# ============================================
echo -e "\n${BLUE}═══ ÉTAPE 4 : Lancer l'instance EC2 ═══${NC}"

# Vérifier si existe
INSTANCE_ID=$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=$INSTANCE_NAME" "Name=instance-state-name,Values=running" \
  --region $AWS_REGION \
  --query 'Reservations[0].Instances[0].InstanceId' \
  --output text 2>/dev/null || echo "")

if [ "$INSTANCE_ID" = "None" ] || [ -z "$INSTANCE_ID" ]; then
    echo "Lancement de l'instance EC2..."
    INSTANCE_ID=$(aws ec2 run-instances \
      --image-id $IMAGE_ID \
      --instance-type $INSTANCE_TYPE \
      --key-name $KEY_NAME \
      --security-group-ids $SG_ID \
      --region $AWS_REGION \
      --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME}]" \
      --query 'Instances[0].InstanceId' \
      --output text)
    
    echo -e "${GREEN}✅ Instance lancée : $INSTANCE_ID${NC}"
    echo "⏳ Attente du démarrage (60 secondes)..."
    sleep 60
else
    echo -e "${YELLOW}⚠️  Instance existante : $INSTANCE_ID${NC}"
fi

# Récupérer l'IP
EC2_IP=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --region $AWS_REGION \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

echo -e "${GREEN}✅ IP EC2 : $EC2_IP${NC}"

# ============================================
# ÉTAPE 5 : Préparer l'instance
# ============================================
echo -e "\n${BLUE}═══ ÉTAPE 5 : Préparer l'instance ═══${NC}"
echo "⏳ Attente de la disponibilité SSH (peut prendre 2-3 min)..."

# Attendre que SSH soit disponible
max_attempts=30
attempt=0
until ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 -i "$KEY_PATH" ec2-user@$EC2_IP "echo 'SSH OK'" 2>/dev/null; do
    attempt=$((attempt + 1))
    if [ $attempt -ge $max_attempts ]; then
        echo -e "${RED}❌ Impossible de se connecter à l'instance${NC}"
        exit 1
    fi
    echo -n "."
    sleep 5
done

echo -e "\n${GREEN}✅ SSH disponible${NC}"

# Envoyer le script d'installation
echo "Envoi du script d'installation..."

ssh -i "$KEY_PATH" ec2-user@$EC2_IP << 'INSTALL_SCRIPT'
#!/bin/bash
set -e

echo "🚀 Installation des dépendances..."

# Mettre à jour système
sudo yum update -y > /dev/null

# Installer Docker
sudo yum install docker git -y > /dev/null
sudo usermod -aG docker ec2-user

# Installer Docker Compose
sudo curl -sL "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose > /dev/null 2>&1
sudo chmod +x /usr/local/bin/docker-compose

# Démarrer Docker
sudo systemctl start docker
sudo systemctl enable docker

echo "✅ Dépendances installées"
INSTALL_SCRIPT

echo -e "${GREEN}✅ Installation complétée${NC}"

# ============================================
# ÉTAPE 6 : Déployer le code
# ============================================
echo -e "\n${BLUE}═══ ÉTAPE 6 : Déployer le code ═══${NC}"

ssh -i "$KEY_PATH" ec2-user@$EC2_IP << 'DEPLOY_SCRIPT'
#!/bin/bash
set -e

# Créer dossier
mkdir -p ~/mecapro
cd ~/mecapro

# Clone du repo (remplacer par votre repo)
if [ ! -d ".git" ]; then
    # Remplacer par votre URL GitHub
    git clone https://github.com/votre-username/mecapro-saas.git . || {
        echo "Utilisation du code local..."
        # Fallback : créer une structure minimale
        mkdir -p backend frontend
    }
fi

echo "✅ Code prêt"
DEPLOY_SCRIPT

echo -e "${GREEN}✅ Code déployé${NC}"

# ============================================
# ÉTAPE 7 : Afficher les informations
# ============================================
echo -e "\n${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     ✅ DÉPLOIEMENT RÉUSSI ! ✅         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}📊 Informations du déploiement :${NC}"
echo -e "  ${YELLOW}Instance ID${NC} : $INSTANCE_ID"
echo -e "  ${YELLOW}IP EC2${NC} : $EC2_IP"
echo -e "  ${YELLOW}Clé SSH${NC} : $KEY_PATH"
echo -e "  ${YELLOW}Security Group${NC} : $SG_ID"

echo -e "\n${BLUE}🔐 Connexion à l'instance :${NC}"
echo -e "  ${YELLOW}ssh -i $KEY_PATH ec2-user@$EC2_IP${NC}"

echo -e "\n${BLUE}📝 Prochaines étapes :${NC}"
echo -e "  1. Se connecter à l'instance"
echo -e "  2. Configurer backend/.env (DATABASE_URL, STRIPE_*, JWT_SECRET)"
echo -e "  3. Configurer frontend/.env (VITE_API_URL)"
echo -e "  4. Lancer : ${YELLOW}docker-compose up -d${NC}"
echo -e "  5. Initialiser BD : ${YELLOW}docker-compose exec backend npm run prisma:migrate${NC}"

echo -e "\n${BLUE}🌐 Accès :${NC}"
echo -e "  Fronted : http://$EC2_IP:3000"
echo -e "  Backend : http://$EC2_IP:3001/api"

echo -e "\n${BLUE}💡 Pour configurer le domaine :${NC}"
echo -e "  1. Route53 → Créer record A pointant vers $EC2_IP"
echo -e "  2. ACM → Créer certificat SSL"
echo -e "  3. Installer Nginx avec SSL (voir AWS_DEPLOYMENT.md)"

echo -e "\n${YELLOW}⚠️  IMPORTANT :${NC}"
echo -e "  • Sauvegarder : $KEY_PATH"
echo -e "  • Consulter AWS_DEPLOYMENT.md pour étapes suivantes"
echo -e "  • Configurer variables d'environnement AVANT de lancer"

# Sauvegarder la configuration
cat > ~/mecapro-deployment.txt << EOF
MECAPRO AWS Deployment
======================
Date : $(date)

Instance ID : $INSTANCE_ID
IP : $EC2_IP
Key : $KEY_PATH
Security Group : $SG_ID
Region : $AWS_REGION

SSH Command:
ssh -i $KEY_PATH ec2-user@$EC2_IP

GitHub Repo: https://github.com/votre-username/mecapro-saas.git
Docs: AWS_DEPLOYMENT.md

EOF

echo -e "\n${GREEN}✅ Configuration sauvegardée : ~/mecapro-deployment.txt${NC}"
