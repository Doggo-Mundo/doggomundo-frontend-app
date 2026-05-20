# Doggo Mundo — App de Cliente

Aplicación web de cara al **cliente final** de Doggo Mundo.
Aquí el usuario se registra, inicia sesión, gestiona sus mascotas, reserva servicios
(autolavado, grooming, foto, experiencias), compra en retail, gestiona su membresía
y consulta su historial.

> **No es la landing page** — la landing la mantiene otro equipo en un repo aparte.
> Este proyecto empieza cuando el usuario quiere **hacer algo** (login, reservar, comprar).

---

## Stack

- **React 19** · **TypeScript 5.9** · **Vite 6**
- **TanStack Query** para server state · **Zustand** para auth / UI local
- **shadcn/ui** (estilo Radix Nova) · **Tailwind CSS 4** · **Lucide React**
- **React Router v7** · **React Hook Form** + **Zod**
- **Axios** (con interceptor JWT + refresh) · **date-fns-tz** (timezone `America/Mexico_City`)
- **Sonner** (toasts) · **Recharts** (si aplica en sección de membresía)

Mismo stack que [../admin](../admin) — intencional, para que un desarrollador pueda
moverse entre ambos proyectos sin fricción. Las convenciones, estructura y capa API
siguen el mismo patrón (ver [.claude/CLAUDE.md](./.claude/CLAUDE.md)).

---

## Primeros pasos

```bash
# 1. Instalar dependencias
pnpm install

# 2. Copiar variables de entorno
cp .env.example .env

# 3. Levantar backend (en otra terminal)
cd ../../backend && python manage.py runserver

# 4. Levantar app
pnpm dev
```

La app corre por default en `http://localhost:5174` (el admin ocupa el `5173`).
Peticiones a `/api/*` se proxean a `http://localhost:8000`.

---

## Variables de entorno

```
VITE_API_BASE_URL=/api
```

---

## Comandos

```bash
pnpm dev          # Dev server
pnpm build        # Build de producción (tsc + vite)
pnpm preview      # Preview del build
pnpm lint         # ESLint
pnpm type-check   # tsc --noEmit
pnpm test         # Vitest (watch)
pnpm test:run     # Vitest (single run)
```

---

## Credenciales de prueba

| Rol      | Email                              | Password     |
| -------- | ---------------------------------- | ------------ |
| Customer | `cliente1@doggomundo.com.mx` … `5` | `cliente123` |

El admin (`admin@doggomundo.com.mx` / `admin123`) **no debería** loguearse aquí —
el flujo de admin vive en [../admin](../admin). Si se recibe un usuario con
`user_type !== "CUSTOMER"`, se le cierra sesión con un mensaje.

---

## Diferencias vs. `admin/`

| Aspecto            | Admin                                  | App (este proyecto)                                  |
| ------------------ | -------------------------------------- | ---------------------------------------------------- |
| Usuario objetivo   | Staff / Admin                          | Cliente final (`user_type = CUSTOMER`)               |
| Endpoints base     | `/api/<app>/admin/...`                 | `/api/<app>/...` (customer-scoped por JWT)           |
| Layout             | Sidebar + tablas densas                | Mobile-first, tarjetas, flujos paso-a-paso           |
| Regla 24 h         | Admin ignora la regla                  | Cliente **sí** está sujeto a la regla de 24 h        |
| Foco               | Operar el negocio                      | Autoservicio: reservar, comprar, ver mi info         |
| Densidad de datos  | Alta (listas, filtros, exports)        | Baja (resumen personal, acciones claras)             |

---

## Recursos de marca

Brandbook, logos y guía visual están en [../comp_files/](../comp_files/) — compartidos con [../admin](../admin).
Los colores primarios ya están tokenizados en `src/index.css` (Navy, Sky Blue, Red).
**No redefinir** colores por fuera de estos tokens.

---

## Estructura

```
src/
├── api/              # client.ts + hooks por dominio
├── components/
│   ├── ui/           # shadcn/ui
│   ├── layout/       # AppShell, BottomNav, TopBar
│   └── shared/       # reusables (PetAvatar, ServiceCard, etc.)
├── features/         # módulos por dominio (auth, booking, pets, orders...)
├── hooks/
├── lib/              # utils.ts, format-date.ts, mx-phone.ts
├── stores/           # auth-store.ts (Zustand)
├── types/            # tipos compartidos del API
├── routes/           # AppRouter, AuthGuard, CustomerGuard
└── assets/
```

Ver [.claude/CLAUDE.md](./.claude/CLAUDE.md) para convenciones completas.

---

## Documentación del API

- Swagger UI: http://localhost:8000/api/docs/
- Schema (OpenAPI): http://localhost:8000/api/schema/
- Copia local: [../comp_files/Doggo Mundo API.yaml](../comp_files/)
