#!/bin/bash

# Script de configuración inicial para Gymspace API Infrastructure

echo "🚀 Configurando infraestructura para Gymspace API..."

# Verificar si gcloud está instalado
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI no está instalado. Por favor instálalo primero."
    echo "   Visita: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Verificar si pulumi está instalado
if ! command -v pulumi &> /dev/null; then
    echo "❌ Pulumi CLI no está instalado. Por favor instálalo primero."
    echo "   Ejecuta: brew install pulumi"
    exit 1
fi

# Verificar si docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Por favor instálalo primero."
    exit 1
fi

# Obtener el proyecto actual de GCP
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)

if [ -z "$CURRENT_PROJECT" ]; then
    echo "❌ No hay un proyecto de GCP configurado."
    echo "   Ejecuta: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "📋 Usando proyecto de GCP: $CURRENT_PROJECT"

# Preguntar por la región
read -p "🌍 Región de GCP (default: us-central1): " REGION
REGION=${REGION:-us-central1}

# Habilitar APIs necesarias
echo "🔧 Habilitando APIs de Google Cloud..."
gcloud services enable containerregistry.googleapis.com --project=$CURRENT_PROJECT
gcloud services enable run.googleapis.com --project=$CURRENT_PROJECT
gcloud services enable secretmanager.googleapis.com --project=$CURRENT_PROJECT

# Configurar Docker con GCR
echo "🐳 Configurando Docker con Google Container Registry..."
gcloud auth configure-docker

# Configurar Pulumi
echo "⚙️  Configurando Pulumi..."
pulumi config set gcp:project $CURRENT_PROJECT
pulumi config set gcp:region $REGION

# Solicitar el token de Doppler
echo ""
echo "🔐 Necesitas un token de Doppler para continuar."
echo "   Si no tienes uno, ejecuta:"
echo "   doppler configs tokens create dev-pulumi --plain"
echo ""
read -s -p "Ingresa tu token de Doppler: " DOPPLER_TOKEN
echo ""

if [ -n "$DOPPLER_TOKEN" ]; then
    pulumi config set --secret dopplerToken $DOPPLER_TOKEN
    echo "✅ Token de Doppler configurado"
else
    echo "⚠️  No se configuró el token de Doppler. Deberás configurarlo manualmente:"
    echo "   pulumi config set --secret dopplerToken YOUR_TOKEN"
fi

echo ""
echo "✅ Configuración completada!"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Revisa la configuración: pulumi config"
echo "   2. Previsualiza los cambios: npm run deploy:preview"
echo "   3. Despliega la infraestructura: npm run deploy"
echo ""
echo "🔍 Para ver los logs después del deploy:"
echo "   npm run logs"
