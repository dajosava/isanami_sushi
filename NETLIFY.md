# Despliegue en Netlify

La app es Next.js 14 (App Router, SSR, Server Actions, middleware). Netlify usa el runtime OpenNext de forma automatica.

## 1. Repositorio

El codigo vive en `isanami-sushi/`. Inicializa git **dentro de esa carpeta** (no en el padre) para que Netlify tome la raiz correcta:

```powershell
cd C:\Web_Projects\IsanamiSushi\isanami-sushi
git init
git add .
git commit -m "Preparar despliegue en Netlify"
```

Sube el repo a GitHub/GitLab/Bitbucket. **No subas** `.env` (ya esta en `.gitignore`).

Si el repo es el padre `IsanamiSushi`, en Netlify pon **Base directory**: `isanami-sushi`.

## 2. Crear el sitio

1. [app.netlify.com](https://app.netlify.com) → Add new site → Import an existing project.
2. Elige el repo. Netlify lee `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node: `20`
3. **Antes del primer deploy**, configura las variables de entorno (paso 3). Si construyes sin ellas, el build puede pasar pero login y datos fallaran.

## 3. Variables de entorno

Site configuration → Environment variables. Aplica a **Production** y **Deploy previews**.

| Variable | Visible en cliente | Donde obtenerla |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Si | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Si | API → `anon` `public` |
| `NEXT_PUBLIC_RESTAURANTE_NOMBRE` | Si | `Isanami Sushi` |
| `SUPABASE_SERVICE_ROLE_KEY` | **No** (Secret) | API → `service_role`. Nunca en el cliente. |

Las `NEXT_PUBLIC_*` se inyectan en el **build**. Si las cambias, hay que **redeploy** (Clear cache and deploy site).

## 4. Supabase Auth (obligatorio)

En el proyecto de Supabase → Authentication → URL Configuration:

- **Site URL**: `https://TU-SITIO.netlify.app` (o el dominio propio).
- **Redirect URLs**: agrega
  - `https://TU-SITIO.netlify.app/**`
  - `https://TU-SITIO.netlify.app/login`
  - `http://localhost:3000/**` (desarrollo)

Sin esto, la sesion puede fallar en produccion.

## 5. Primer deploy

Tras guardar las variables: Deploys → Trigger deploy → Deploy site.

Prueba: `/login` → pedidos → cocina. Si ves pantalla blanca, revisa Functions logs y que las 4 variables existan.

## 6. Dominio propio (opcional)

Domain management → Add custom domain (p. ej. `app.isanamisushi.com`). Luego actualiza Site URL y Redirect URLs en Supabase.

## 7. Deploy local (opcional)

```powershell
npm install -g netlify-cli
netlify login
netlify init
netlify env:import .env
netlify deploy --build --prod
```

`netlify env:import` sube secretos del `.env` local. Confirma que no se marque `SUPABASE_SERVICE_ROLE_KEY` como publica.
