#!/bin/bash

# DeliGourmet - Start Development Environment

echo "🚀 Iniciando entorno de desarrollo de DeliGourmet..."
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "⚠️  Docker no está corriendo. Por favor inicia Docker Desktop y ejecuta este script de nuevo."
    exit 1
fi

# Start database
echo "📦 Iniciando base de datos..."
docker-compose up -d

# Wait for database to be ready
echo "⏳ Esperando a que la base de datos esté lista..."
sleep 5

# Run migrations
echo "🔄 Ejecutando migraciones..."
cd "$SCRIPT_DIR/backend"
npx prisma migrate dev --name init 2>/dev/null || npx prisma migrate deploy

# Generate Prisma Client
echo "⚙️  Generando Prisma Client..."
npx prisma generate

# Seed database
echo "🌱 Creando usuario administrador..."
npm run seed

# Start backend
echo "🔧 Iniciando backend en puerto 3000..."
npm run start:dev &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend
echo "🎨 Iniciando frontend en puerto 5173..."
cd "$SCRIPT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Entorno de desarrollo iniciado!"
echo ""
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:3000"
echo "📚 API Docs: http://localhost:3000/api/docs"
echo "🗄️  Prisma Studio: cd backend && npx prisma studio"
echo ""
echo "🔐 Credenciales de prueba:"
echo "   Email: admin@deligourmet.com"
echo "   Password: Admin123!"
echo ""
echo "⚠️  Para detener el entorno, presiona Ctrl+C"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Deteniendo servidores..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Trap Ctrl+C
trap cleanup INT TERM

# Wait for processes
wait
