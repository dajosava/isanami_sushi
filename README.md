# Isanami Sushi — Sistema interno

Aplicacion a medida para la administracion del restaurante Isanami Sushi
(Hojancha, Guanacaste). Next.js 14 (App Router) + TypeScript + Supabase.

## Modulos
- **Pedidos** — mesas, toma de pedido
- **Cocina (KDS)** — comandas en tiempo real via Supabase Realtime
- **Facturacion** — comprobante interno de cobro (la factura electronica fiscal la maneja el cliente en otro sistema)
- **Inventario** — insumos, recetas, compras, mermas
- **Contabilidad** — cierres de caja por turno, reportes diarios
- **Administracion** — usuarios, menu, configuracion

## Primeros pasos

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Crear el proyecto en https://supabase.com y copiar `.env.example` a `.env.local`
   con las llaves del proyecto.

3. Correr las migraciones (ver carpeta `supabase/migrations`) contra tu proyecto
   de Supabase, ya sea con el SQL Editor del dashboard o con la CLI:
   ```bash
   npx supabase db push
   ```

4. Generar los tipos de TypeScript desde el esquema real:
   ```bash
   npm run types:generate
   ```

5. Levantar el proyecto:
   ```bash
   npm run dev
   ```

## Notas de arquitectura
- La seguridad por rol (admin/gerente/cajero/mesero/cocina/contador) vive
  principalmente en **RLS de Postgres**, no solo en el frontend.
- Las mutaciones pasan por **Server Actions** (`/actions`), nunca se escribe
  directo a Supabase desde un Client Component salvo lecturas simples.
- El descuento de inventario al vender, la generacion de comandas al enviar
  un pedido a cocina, y el consecutivo de comprobantes se resuelven con
  **funciones/triggers de Postgres** (ver migraciones) para que sean atomicos.
