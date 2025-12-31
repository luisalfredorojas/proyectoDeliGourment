# Guía de Deployment a Producción

## 🎯 Decisión: Cloud Deployment

**Plataforma elegida**: Railway.app  
**Razón**: Mejor balance entre facilidad, costo y escalabilidad

---

## 🏆 Comparativa de Opciones Cloud

### 1. Railway.app ⭐ RECOMENDADO

**Ventajas**:
- ✅ $5 gratis mensuales (prácticamente gratis para empezar)
- ✅ PostgreSQL incluido
- ✅ Deploy automático desde GitHub
- ✅ SSL/HTTPS gratis
- ✅ Escalable sin cambiar de plataforma
- ✅ Fácil de usar (no requiere experiencia DevOps)
- ✅ Backups automáticos
- ✅ Uptime 99.9%

**Costos estimados**:
- Mes 1-∞: $5 gratis mensuales
- Uso actual (15 usuarios): $3-7/mes
- Con facturación SRI: $8-12/mes
- Escalado (50+ usuarios): $15-25/mes

**Límites**:
- CPU: 8 vCPU compartidos
- RAM: 8GB
- Storage: 100GB
- Bandwidth: Ilimitado

---

### 2. Render.com (Alternativa)

**Ventajas**:
- ✅ Plan gratuito real
- ✅ PostgreSQL incluido (90 días gratis)
- ✅ Auto-deploy desde GitHub

**Desventajas**:
- ⚠️ Sleep mode en plan gratuito (se duerme tras 15 min sin uso)
- ⚠️ Arranque lento (30-60 seg al despertar)

**Costos**:
- Gratis con limitaciones
- Starter: $7/mes
- PostgreSQL: $7/mes
- **Total recomendado**: $14/mes

---

### 3. AWS Lightsail (Profesional)

**Ventajas**:
- ✅ Infraestructura Amazon
- ✅ Control total del servidor
- ✅ Escalabilidad máxima

**Desventajas**:
- ⚠️ Más técnico (requiere conocimientos Linux)
- ⚠️ Mantenimiento manual
- ⚠️ PostgreSQL no incluido

**Costos**:
- Plan $5/mes: 1GB RAM (básico)
- Plan $10/mes: 2GB RAM (recomendado)
- Backups: +$1/mes

---

## 🚀 Plan de Deployment con Railway.app

### Fase 1: Configuración Inicial

**Pasos**:
1. Crear cuenta en Railway.app
2. Conectar repositorio GitHub
3. Crear nuevo proyecto
4. Agregar servicio: Backend (NestJS)
5. Agregar servicio: Frontend (React + Vite)
6. Agregar base de datos: PostgreSQL

**Variables de entorno necesarias**:

Backend:
```env
DATABASE_URL=<automático desde Railway>
JWT_SECRET=<generar token seguro>
PORT=3000
NODE_ENV=production
```

Frontend:
```env
VITE_API_URL=https://tu-backend.railway.app
```

---

### Fase 2: Build Configuration

**backend/package.json** - Agregar scripts:
```json
{
  "scripts": {
    "build": "nest build",
    "start:prod": "node dist/main",
    "migrate:deploy": "npx prisma migrate deploy"
  }
}
```

**frontend/package.json** - Ya configurado:
```json
{
  "scripts": {
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

---

### Fase 3: Prisma Migrations

**Comando para producción**:
```bash
npx prisma migrate deploy
```

Railway ejecutará esto automáticamente si configuras:
- Build Command: `npm install && npx prisma generate && npm run build`
- Start Command: `npx prisma migrate deploy && npm run start:prod`

---

### Fase 4: Dominio Personalizado (Opcional)

**Sin dominio propio**:
- Backend: `https://deligourmet-backend-production.up.railway.app`
- Frontend: `https://deligourmet-frontend-production.up.railway.app`

**Con dominio propio** (ejemplo: deligourmet.com):
- Backend: `https://api.deligourmet.com`
- Frontend: `https://app.deligourmet.com`

**Configuración DNS**:
1. Comprar dominio (Namecheap, GoDaddy, etc.)
2. Agregar registros CNAME en Railway
3. Configurar DNS en tu proveedor

---

## 🔒 Seguridad en Producción

### Variables de Entorno Sensibles

**JWT_SECRET**: Generar con:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**DATABASE_URL**: Railway lo provee automáticamente

### CORS Configuration

Backend `main.ts`:
```typescript
app.enableCors({
  origin: ['https://tu-dominio.com', 'https://app.deligourmet.com'],
  credentials: true,
});
```

---

## 📊 Monitoreo y Mantenimiento

### Logs
- Acceso directo desde Railway Dashboard
- Logs en tiempo real
- Búsqueda y filtrado

### Métricas
- CPU usage
- Memory usage
- Request count
- Response times

### Backups
- Railway: Snapshots automáticos de PostgreSQL
- Frecuencia: Diaria
- Retención: 7 días (plan gratuito)

---

## 💰 Estimación de Costos

### Escenario 1: Inicio (15 usuarios)
- Railway: $5-8/mes
- Dominio (opcional): $12/año
- **Total**: ~$6-9/mes + $12/año

### Escenario 2: Crecimiento (50 usuarios)
- Railway: $15-20/mes
- Dominio: $12/año
- **Total**: ~$15-20/mes + $12/año

### Escenario 3: Expansión (100+ usuarios)
- Railway: $25-40/mes
- Dominio: $12/año
- CDN (opcional): $5-10/mes
- **Total**: ~$30-50/mes + $12/año

---

## 🔄 Plan de Migración Futura

### Si Railway se vuelve costoso:

**Opción A**: Migrar a servidor VPS
- DigitalOcean Droplet: $12/mes
- AWS Lightsail: $10/mes
- Requiere más mantenimiento

**Opción B**: Servidor local
- Inversión inicial: $400-800
- Costo mensual: ~$15 electricidad
- Sin costos cloud

---

## 📋 Checklist de Deployment

### Pre-deployment
- [ ] Código en GitHub actualizado
- [ ] Variables de entorno documentadas
- [ ] Scripts de build configurados
- [ ] Migrations probadas localmente
- [ ] CORS configurado correctamente

### Durante deployment
- [ ] Crear cuenta Railway
- [ ] Conectar repositorio
- [ ] Configurar variables de entorno
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Configurar PostgreSQL
- [ ] Ejecutar migrations

### Post-deployment
- [ ] Probar login
- [ ] Crear usuario admin
- [ ] Verificar CRUD de todos los módulos
- [ ] Probar dashboard
- [ ] Configurar dominio (opcional)
- [ ] Configurar monitoreo
- [ ] Documentar URLs de producción

---

## 🆘 Troubleshooting

### Error: "Cannot connect to database"
- Verificar DATABASE_URL en variables de entorno
- Confirmar que PostgreSQL está corriendo
- Revisar logs de Railway

### Error: "CORS policy blocked"
- Verificar origen en enableCors()
- Agregar dominio frontend a lista permitida

### Error: "Build failed"
- Revisar logs de build
- Verificar que dependencias están en package.json
- Confirmar versión de Node.js

### App muy lenta
- Verificar plan de Railway (puede necesitar upgrade)
- Revisar queries de base de datos
- Agregar índices si es necesario

---

## 📞 Contacto y Soporte

**Railway**:
- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway
- Twitter: @Railway

**Desarrollador**:
- Para soporte técnico contactar al equipo de desarrollo

---

## 🎯 Próximos Pasos

1. **Inmediato**: Deploy en Railway.app
2. **Semana 1**: Pruebas con usuarios reales
3. **Mes 1**: Monitorear uso y costos
4. **Mes 3**: Evaluar si necesita optimizaciones
5. **Futuro**: Integración con facturación SRI

---

**Última actualización**: Diciembre 2024  
**Versión**: 1.0  
**Estado**: Listo para deployment
