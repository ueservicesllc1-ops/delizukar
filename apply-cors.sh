#!/bin/bash

# Script para aplicar configuración CORS a Firebase Storage
# Uso: ./apply-cors.sh

echo "🔧 Aplicando configuración CORS a Firebase Storage..."
echo ""

# Verificar que gsutil esté instalado
if ! command -v gsutil &> /dev/null; then
    echo "❌ Error: gsutil no está instalado."
    echo "📦 Instala Google Cloud SDK desde: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Aplicar configuración CORS
gsutil cors set firebase-storage-cors.json gs://delizukar.firebasestorage.app

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Configuración CORS aplicada exitosamente!"
    echo ""
    echo "📋 Verificando configuración actual:"
    gsutil cors get gs://delizukar.firebasestorage.app
else
    echo ""
    echo "❌ Error al aplicar configuración CORS"
    echo "💡 Asegúrate de estar autenticado con: gcloud auth login"
    exit 1
fi

