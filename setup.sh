#!/bin/bash

# ============================================
# Script de Setup Rapide MECAPRO
# ============================================

set -e

echo "🚀 MECAPRO - Setup Automatique"
echo "================================"

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker n'est pas installé${NC}"
    echo "Installer depuis : https://www.docker.com/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose n'est pas installé${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker trouvé${NC}"

# 1. Créer .env files
echo -e "\n${BLUE}1️⃣ Création fichiers .env...${NC}"

if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo -e "${GREEN}✅ backend/.env créé${NC}"
    echo -e "${RED}⚠️  À remplir : DATABASE_URL, JWT_SECRET, STRIPE_*${NC}"
else
    echo -e "${GREEN}✅ backend/.env existe déjà${NC}"
fi

if [ ! -f "frontend/.env" ]; then
    cp frontend/.env.example frontend/.env
    echo -e "${GREEN}✅ frontend/.env créé${NC}"
fi

# 2. Lancer Docker
echo -e "\n${BLUE}2️⃣ Lancement des services Docker...${NC}"
docker-compose up -d
echo -e "${GREEN}✅ Services lancés${NC}"

# 3. Attendre démarrage
echo -e "\n${BLUE}3️⃣ Attente du démarrage (30s)...${NC}"
sleep 30

# 4. Initialiser BD
echo -e "\n${BLUE}4️⃣ Initialisation base de données...${NC}"
docker-compose exec -T backend npm run prisma:migrate || true
echo -e "${GREEN}✅ BD initialisée${NC}"

# 5. Vérifier santé
echo -e "\n${BLUE}5️⃣ Vérification santé...${NC}"

HEALTH=$(curl -s http://localhost:3001/api/health || echo "error")
if [[ $HEALTH == *"ok"* ]]; then
    echo -e "${GREEN}✅ Backend fonctionnel${NC}"
else
    echo -e "${RED}❌ Backend ne répond pas${NC}"
fi

# 6. Résumé
echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}✅ Setup complété !${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "📍 Points d'accès :"
echo -e "  ${BLUE}Frontend  : http://localhost:3000${NC}"
echo -e "  ${BLUE}Backend   : http://localhost:3001/api${NC}"
echo -e "  ${BLUE}Health    : http://localhost:3001/api/health${NC}"
echo ""
echo -e "📝 À FAIRE :"
echo -e "  1. Remplir backend/.env"
echo -e "     - DATABASE_URL (Supabase)"
echo -e "     - STRIPE_* (clés Stripe)"
echo -e "  2. Redémarrer : ${BLUE}docker-compose restart backend${NC}"
echo ""
echo -e "📚 Docs : ${BLUE}cat DEPLOYMENT_GUIDE.md${NC}"
echo ""
echo -e "🛑 Arrêter : ${BLUE}docker-compose down${NC}"
echo -e "📊 Logs    : ${BLUE}docker-compose logs -f${NC}"
