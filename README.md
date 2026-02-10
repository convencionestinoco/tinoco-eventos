# Centro de Convenciones TINOCO - Gestión de Eventos

Plataforma web de gestión de eventos con calendario mensual.

## 🚀 Guía de Despliegue Paso a Paso

---

### PASO 1: Crear la Base de Datos en Supabase

1. Ve a **https://supabase.com** y crea una cuenta (gratis)
2. Click en **"New Project"**
   - Nombre: `tinoco-eventos`
   - Password: elige una contraseña segura (guárdala)
   - Region: el más cercano (ej: South America - São Paulo)
   - Click **"Create new project"** y espera ~2 minutos
3. Una vez creado, ve al menú izquierdo → **SQL Editor**
4. Click **"New query"**
5. Copia y pega TODO el contenido del archivo `supabase-schema.sql` que está en este proyecto
6. Click **"Run"** (el botón verde)
7. Deberías ver: "Success. No rows returned" — eso está bien ✅

#### Obtén tus credenciales:
1. Ve al menú izquierdo → **Project Settings** (ícono de engranaje)
2. Click en **API** en el submenú
3. Copia estos dos valores (los necesitarás después):
   - **Project URL** → algo como `https://xyzabc.supabase.co`
   - **anon public key** → una cadena larga que empieza con `eyJ...`

---

### PASO 2: Subir a GitHub

1. Ve a **https://github.com** y crea una cuenta si no tienes
2. Click el botón **"+"** arriba a la derecha → **"New repository"**
   - Nombre: `tinoco-eventos`
   - Privacidad: Private (recomendado) o Public
   - NO marques ninguna casilla de inicialización
   - Click **"Create repository"**
3. Abre una terminal en tu computadora y ejecuta:

```bash
# Clona o descarga este proyecto, luego:
cd tinoco-eventos
git init
git add .
git commit -m "Initial commit - Centro de Convenciones Tinoco"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/tinoco-eventos.git
git push -u origin main
```

---

### PASO 3: Desplegar en Vercel

1. Ve a **https://vercel.com** y regístrate con tu cuenta de GitHub
2. Click **"Add New..."** → **"Project"**
3. Busca tu repositorio `tinoco-eventos` y click **"Import"**
4. En la configuración, agrega las **Environment Variables**:
   - Click **"Environment Variables"**
   - Agrega:
     - Key: `NEXT_PUBLIC_SUPABASE_URL` → Value: tu Project URL de Supabase
     - Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Value: tu anon key de Supabase
5. Click **"Deploy"**
6. Espera ~2 minutos. Cuando termine, Vercel te dará un link como:
   **`https://tinoco-eventos.vercel.app`** ← ¡esa es tu aplicación en vivo! 🎉

---

### PASO 4: Verificar

1. Abre el link de Vercel en tu navegador
2. Intenta crear un evento haciendo click en cualquier día/espacio
3. El evento se guardará en Supabase automáticamente
4. Puedes verificar en Supabase → Table Editor que los datos aparecen

---

## 📁 Estructura del Proyecto

```
tinoco-eventos/
├── src/
│   ├── app/
│   │   ├── globals.css      # Estilos globales
│   │   ├── layout.tsx        # Layout principal
│   │   └── page.tsx          # Página principal (calendario)
│   └── lib/
│       ├── supabase.ts       # Cliente Supabase
│       ├── db.ts             # Operaciones de base de datos
│       └── types.ts          # Tipos TypeScript
├── supabase-schema.sql       # SQL para crear las tablas
├── .env.local.example        # Plantilla de variables de entorno
└── package.json
```

## 🔑 Contraseña de Administrador

Para validar adelantos: `TINOCOadm@`
