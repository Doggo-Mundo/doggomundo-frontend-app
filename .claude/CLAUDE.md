# Doggo Mundo — App de Cliente

## Proyecto

Aplicación web **de cara al cliente final** de Doggo Mundo. Aquí el usuario:

- Se registra, verifica su email y hace login
- Administra su perfil y sus mascotas
- Reserva servicios (autolavado, grooming, foto, experiencias)
- Compra productos de retail
- Gestiona su membresía y suscripciones
- Consulta su historial de órdenes, citas y recordatorios

**No es la landing page** — la landing vive en otro repo, la mantiene otro miembro
del equipo y su único punto de contacto con este proyecto son los links a `/login`,
`/register` y a flujos de compra/reserva.

**Stack:** React 19 · TypeScript · Vite 6 · TanStack Query · shadcn/ui (Radix Nova) · Tailwind CSS 4
**Backend:** Django REST Framework en `http://localhost:8000/api/`
**Docs API:** Swagger UI en `http://localhost:8000/api/docs/` · Schema en `http://localhost:8000/api/schema/`
**Copia local del schema:** `../comp_files/Doggo Mundo API.yaml`

**Relación con [../admin](../admin):** mismo stack y convenciones. Lo que aquí se
llama "customer-facing" allá se llama "admin-facing". Endpoints, layout y reglas
difieren — pero la capa técnica (Axios client, Zustand auth store, TanStack Query
hooks, estructura de feature modules) debe ser idéntica para facilitar el cross-dev.

---

## Recursos de Marca

Los assets de marca, brandbook y guía de identidad visual viven en
[../comp_files/](../comp_files/) — compartidos entre esta app y [../admin](../admin).
Consultarlos antes de tomar decisiones de color, tipografía, logo o estilo.
Los lineamientos del brandbook tienen prioridad sobre cualquier default de
shadcn/ui o Tailwind.

Colores primarios (ya tokenizados en `src/index.css`):

- Navy `#222D56` — color principal
- Sky Blue `#69B4F2` — acento / CTA secundario
- Red `#E21818` — destructivo / alertas
- Light Blue `#DFEEFB` — superficies suaves / fondos de sección

Fuentes: **Montserrat** (headings) · **Geist** (body). Importadas vía `@fontsource-variable`.

---

## Arquitectura

### Principios

1. **Feature-first**: código organizado por dominio de negocio (booking, pets, orders…), no por tipo de archivo
2. **Mobile-first**: el usuario suele venir desde el teléfono. Desktop es bonus, no default
3. **Server state > client state**: TanStack Query maneja lo que viene del API; Zustand solo para auth y UI local
4. **Type-safe end-to-end**: los tipos TS reflejan exactamente los shapes del backend
5. **Flujos guiados**: las operaciones multi-paso (reservar cita, comprar, suscribirse) se modelan como wizards con estado explícito
6. **No over-engineer**: solo construir lo que se necesita ahora

### Estructura de un Feature Module

```
features/booking/
├── pages/
│   ├── BookingLandingPage.tsx       # entry point del flujo
│   ├── BookingConfirmationPage.tsx
│   └── MyAppointmentsPage.tsx
├── components/
│   ├── BusinessUnitPicker.tsx
│   ├── ServicePicker.tsx
│   ├── LocationPicker.tsx
│   ├── SlotPicker.tsx
│   ├── PetPicker.tsx
│   └── AppointmentCard.tsx
├── hooks/
│   └── use-booking-flow.ts           # estado del wizard
├── types.ts
└── index.ts
```

Cada feature tiene `pages/` (rutas) y `components/` (internos del dominio).
Flujos multi-paso opcionalmente tienen un hook de wizard con su propio estado.

---

## Convenciones de Código

Idénticas al admin. Repaso corto:

- **Componentes y tipos**: `PascalCase` (`AppointmentCard.tsx`, `Appointment`)
- **Hooks**: `camelCase` con prefijo `use` (`useMyAppointments`)
- **Archivos de utilidad**: `kebab-case` (`format-date.ts`)
- **URLs del router**: `kebab-case` (`/my-appointments`)
- **Constantes**: `UPPER_SNAKE_CASE`
- **TypeScript**: `interface` para shapes, `type` para unions/utilities, nunca `any`
- **Componentes**: function declarations, named exports, un componente por archivo, props destructuradas
- **Imports**: React / externos → componentes `@/components/...` → hooks → tipos → utilidades
- **Path alias**: `@/` apunta a `src/`

Ver [../admin/.claude/CLAUDE.md](../admin/.claude/CLAUDE.md) para el detalle completo.

---

## Capa API

### Cliente HTTP

`src/api/client.ts` — mismo patrón que admin:

- `baseURL` desde `import.meta.env.VITE_API_BASE_URL`
- Interceptor de request: agrega `Authorization: Bearer <access>`
- Interceptor de response: en 401 intenta refresh con el refresh token; si falla, logout

### Hooks de TanStack Query

Un archivo por dominio en `src/api/hooks/`. Mismo patrón de `queryKeys` que admin:

```tsx
// src/api/hooks/use-my-appointments.ts
export const myAppointmentsKeys = {
  all: ["my-appointments"] as const,
  lists: () => [...myAppointmentsKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) => [...myAppointmentsKeys.lists(), params] as const,
  details: () => [...myAppointmentsKeys.all, "detail"] as const,
  detail: (id: string) => [...myAppointmentsKeys.details(), id] as const,
};

export function useMyAppointments(params: MyAppointmentsParams = {}) {
  return useQuery({
    queryKey: myAppointmentsKeys.list(params),
    queryFn: () =>
      api.get<PaginatedResponse<Appointment>>("/appointments/", { params }).then((r) => r.data),
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAppointmentPayload) =>
      api.post<Appointment>("/appointments/", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: myAppointmentsKeys.lists() });
    },
  });
}

export function useCancelMyAppointment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`/appointments/${id}/cancel/`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: myAppointmentsKeys.detail(id) });
      qc.invalidateQueries({ queryKey: myAppointmentsKeys.lists() });
    },
  });
}
```

### Tipos compartidos

```tsx
// src/types/api.ts
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ValidationErrors {
  [field: string]: string[];
}
```

Tipos por dominio en `src/types/<dominio>.ts`.
**Para schemas exactos, consultar Swagger UI** — no adivinar.

---

## Autenticación

### Flujo

1. **Registro** → `POST /api/auth/register/` → backend envía OTP al email
2. **Verificación** → `POST /api/auth/verify-email/` con el OTP → cuenta activa
3. **Login** → `POST /api/auth/login/` → `{ access, refresh, user }`
4. Access token en Zustand (memoria, **NO** localStorage)
5. Refresh token en `localStorage`
6. Axios interceptor agrega `Authorization: Bearer <access>`
7. En 401 → `POST /api/auth/token/refresh/`; si falla → logout + redirect a `/login`

### Recuperación de contraseña

1. `POST /api/auth/request-reset/` → backend envía OTP
2. `POST /api/auth/reset-password/` con el OTP + nuevo password

### Reenvío de OTP

- Verificación email: `POST /api/auth/resend-otp/`
- Reset password: `POST /api/auth/resend-password-reset-otp/`

### Guards de ruta

Dos guards, orden importante:

```tsx
<Route element={<AuthGuard />}>           {/* requiere estar autenticado */}
  <Route element={<CustomerGuard />}>     {/* requiere user_type === "CUSTOMER" */}
    <Route path="/" element={<HomePage />} />
    <Route path="/pets" element={<PetsPage />} />
    {/* ... */}
  </Route>
</Route>
```

`CustomerGuard` existe porque un admin o staff no debería usar esta app. Si un
usuario autenticado tiene `user_type !== "CUSTOMER"`, cerrar sesión, mostrar toast
("Esta cuenta es administrativa, usa el panel de admin") y redirigir a `/login`.

---

## Formularios

Mismo patrón que admin: **React Hook Form + Zod**.

```tsx
const registerSchema = z
  .object({
    first_name: z.string().min(1, "El nombre es requerido"),
    last_name: z.string().min(1, "El apellido es requerido"),
    email: z.string().email("Email inválido"),
    phone: z.string().regex(/^\+?\d{10,15}$/, "Teléfono inválido"),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    password_confirm: z.string(),
  })
  .refine((d) => d.password === d.password_confirm, {
    message: "Las contraseñas no coinciden",
    path: ["password_confirm"],
  });
```

Manejo de errores del backend (400): mapear `{ field: ["msg"] }` a
`form.setError(field, { message: msg[0] })` — ver patrón en admin CLAUDE.md.

---

## Routing

```
# Públicas
/login
/register
/verify-email
/forgot-password
/reset-password

# Autenticadas (AuthGuard + CustomerGuard)
/                                  → Home (resumen personal: próxima cita, mascotas, accesos rápidos)

/profile                           → Mi perfil (GET/PATCH /api/auth/me/)

/pets                              → Mis mascotas
/pets/new                          → Alta de mascota (wizard)
/pets/:id                          → Detalle de mascota
/pets/:id/edit                     → Edición
/pets/:id/medical-records          → Historial médico
/pets/:id/vaccinations             → Vacunas
/pets/:id/documents                → Documentos

/book                              → Entry point del flujo de reserva
/book/business-unit                → Paso 1: elegir tipo de servicio
/book/service                      → Paso 2: elegir servicio del catálogo
/book/location                     → Paso 3: elegir sucursal
/book/slot                         → Paso 4: elegir fecha/hora
/book/pet                          → Paso 5: elegir mascota
/book/review                       → Paso 6: confirmar y crear

/my/appointments                   → Mis citas (próximas y pasadas)
/my/appointments/:id               → Detalle (reagendar, cancelar)

/my/orders                         → Historial de órdenes
/my/orders/:id                     → Detalle de orden

/memberships                       → Planes disponibles (público + autenticado)
/memberships/:id                   → Detalle de plan
/memberships/subscribe/:planId     → Suscribirse a un plan

/my/subscriptions                  → Mis suscripciones (activas/pausadas)
/my/subscriptions/:id              → Detalle + cancelar

/shop                              → Catálogo de productos
/shop/categories/:id               → Productos por categoría
/shop/products/:id                 → Detalle de producto
/cart                              → Carrito (estado local Zustand)
/checkout                          → Checkout

/locations                         → Ver sucursales (info)
/locations/:id                     → Detalle

/reminders                         → Mis recordatorios del CRM
```

> El prefijo `/my/` separa claramente "cosas mías" de catálogos navegables.
> `/book/*` es el wizard de reserva con estado en `useBookingFlow`.

---

## Estilos

- **Tailwind CSS 4** — única forma de estilar
- **shadcn/ui** (estilo Radix Nova, mismo `components.json` que admin)
- `cn()` de `@/lib/utils` para merge condicional
- **Mobile-first**: pensar en pantallas de 360–420 px primero
- Tema claro por default (usar tokens `bg-background`, `text-foreground`, etc.)
- Bottom nav en mobile (Home, Reservar, Mis citas, Shop, Perfil)
- Top bar simple en desktop

---

## Flujo de Reserva (detalle)

Estado del wizard en `useBookingFlow` (Zustand store con persist a `sessionStorage`):

```ts
interface BookingFlowState {
  businessUnit: BusinessUnitCode | null;
  serviceId: string | null;
  locationId: string | null;
  slot: { start: string; end: string; resourceId: string } | null;  // UTC
  petId: string | null;
  notes: string;
  reset: () => void;
  // setters por paso
}
```

Endpoints usados:

| Paso             | Endpoint                                                                 |
| ---------------- | ------------------------------------------------------------------------ |
| 1. Tipo servicio | Hardcoded (los 7 `BusinessUnit.code` del dominio)                        |
| 2. Servicios     | `GET /api/services/...` (público/customer scope — ver Swagger)           |
| 3. Sucursales    | `GET /api/locations/`                                                    |
| 4. Slots         | `GET /api/appointments/slots/?service=<id>&location=<id>&date=<YYYY-MM-DD>` |
| 5. Mascotas      | `GET /api/pets/`                                                         |
| 6. Crear         | `POST /api/appointments/` con `{ service, location, scheduled_start, pet, notes }` |

**Validación crítica**: antes del paso 4, si el usuario no tiene mascotas, forzar
`/pets/new` y volver al flujo. Sin mascota no hay reserva.

**Regla 24 h**: al crear la cita, el backend la rechaza si `scheduled_start - now < 24h`.
Mostrar el error claramente; en el admin esta regla se puede saltar, aquí **no**.

---

## Tablas / Listas

En mobile el usuario NO quiere tablas densas — quiere tarjetas.

- Listas de citas / órdenes / mascotas → **tarjetas** (cards), no `DataTable`
- Paginación infinita (`useInfiniteQuery`) preferida sobre paginación numérica
- Filtros como `Sheet` o `Drawer` de shadcn/ui, no sidebar fijo
- En desktop, las mismas tarjetas se acomodan en grid 2–3 columnas

Reservar `DataTable` solo si hay una vista tipo "historial largo" en desktop donde
tenga sentido (órdenes exportables, por ejemplo).

---

## Fechas y Timezone

Igual que admin:

- Backend envía/recibe **UTC**
- Frontend convierte a `America/Mexico_City` con `date-fns-tz`
- Formatos display: `dd/MM/yyyy` · `dd/MM/yyyy HH:mm` · `EEEE d 'de' MMMM` (para humanizar en flujo de reserva)
- Al mandar al backend, convertir a UTC antes
- `locale: es` de `date-fns/locale/es` para nombres de día/mes

---

## Backend API — Endpoints usados por esta app

Base URL: `http://localhost:8000/api/`
Auth: todos los endpoints "customer" requieren `Authorization: Bearer <access>`;
el backend filtra automáticamente por el usuario autenticado.

### Auth (público)

| Método | Endpoint                               | Descripción                    |
| ------ | -------------------------------------- | ------------------------------ |
| POST   | `/api/auth/register/`                  | Registro                       |
| POST   | `/api/auth/verify-email/`              | Verificación email con OTP     |
| POST   | `/api/auth/resend-otp/`                | Reenviar OTP                   |
| POST   | `/api/auth/login/`                     | Login                          |
| POST   | `/api/auth/token/refresh/`             | Refresh JWT                    |
| POST   | `/api/auth/request-reset/`             | Solicitar reset password       |
| POST   | `/api/auth/resend-password-reset-otp/` | Reenviar OTP reset             |
| POST   | `/api/auth/reset-password/`            | Reset password con OTP         |

### Perfil (autenticado)

| Método     | Endpoint            | Descripción                       |
| ---------- | ------------------- | --------------------------------- |
| GET        | `/api/auth/me/`     | Mi perfil                         |
| PATCH      | `/api/auth/me/`     | Actualizar mi perfil              |
| POST       | `/api/auth/logout/` | Logout (blacklist refresh token)  |

### Mis Mascotas (customer scope)

| Método | Endpoint                                     | Descripción                         |
| ------ | -------------------------------------------- | ----------------------------------- |
| GET    | `/api/pets/`                                 | Mis mascotas                        |
| POST   | `/api/pets/create/`                          | Crear mascota                       |
| GET    | `/api/pets/{id}/`                            | Detalle                             |
| PATCH  | `/api/pets/{id}/update-basic/`               | Update básico                       |
| PATCH  | `/api/pets/{id}/update-complete/`            | Update completo                     |
| DELETE | `/api/pets/{id}/delete/`                     | Eliminar                            |
| GET    | `/api/pets/{id}/onboarding-status/`          | Estado onboarding                   |
| GET    | `/api/pets/{pet_id}/medical-records/`        | Historial médico                    |
| GET    | `/api/pets/{pet_id}/vaccinations/`           | Vacunas                             |
| GET    | `/api/pets/{pet_id}/documents/`              | Documentos                          |

### Mis Citas (customer scope)

| Método | Endpoint                          | Descripción                                |
| ------ | --------------------------------- | ------------------------------------------ |
| GET    | `/api/appointments/`              | Mis citas                                  |
| POST   | `/api/appointments/`              | Crear cita                                 |
| GET    | `/api/appointments/{id}/`         | Detalle                                    |
| PATCH  | `/api/appointments/{id}/update/`  | Reagendar / editar notas                   |
| POST   | `/api/appointments/{id}/cancel/`  | Cancelar (sujeto a regla de 24 h)          |
| GET    | `/api/appointments/slots/`        | Slots disponibles (público)                |

### Mis Órdenes

| Método | Endpoint                 | Descripción         |
| ------ | ------------------------ | ------------------- |
| GET    | `/api/orders/`           | Mis órdenes         |
| GET    | `/api/orders/{id}/`      | Detalle             |

### Membresías

| Método | Endpoint                              | Descripción                       |
| ------ | ------------------------------------- | --------------------------------- |
| GET    | `/api/memberships/plans/`             | Catálogo de planes (público)      |
| POST   | `/api/memberships/subscribe/`         | Suscribirse a un plan             |
| GET    | `/api/memberships/`                   | Mis suscripciones                 |
| GET    | `/api/memberships/{id}/`              | Detalle                           |
| POST   | `/api/memberships/{id}/cancel/`       | Cancelar suscripción              |
| GET    | `/api/memberships/{id}/cycles/`       | Historial de ciclos               |

### Retail

| Método | Endpoint                         | Descripción                     |
| ------ | -------------------------------- | ------------------------------- |
| GET    | `/api/retail/categories/`        | Categorías (público)            |
| GET    | `/api/retail/products/`          | Productos (público)             |
| GET    | `/api/retail/products/{id}/`     | Detalle de producto             |

### CRM (customer scope)

| Método | Endpoint                              | Descripción                     |
| ------ | ------------------------------------- | ------------------------------- |
| GET    | `/api/crm/reminders/`                 | Mis recordatorios               |
| GET    | `/api/crm/reminders/{id}/`            | Detalle                         |
| GET    | `/api/crm/interaction-logs/`          | Mis interacciones               |
| GET    | `/api/crm/interaction-logs/{id}/`     | Detalle                         |

### Veterinaria (customer scope, solo lectura)

| Método | Endpoint                                      | Descripción                |
| ------ | --------------------------------------------- | -------------------------- |
| GET    | `/api/veterinary/vet-visits/`                 | Visitas veterinarias       |
| GET    | `/api/veterinary/vet-visits/{id}/`            | Detalle                    |
| GET    | `/api/veterinary/vaccination-records/`        | Registros de vacunación    |
| GET    | `/api/veterinary/vaccination-records/{id}/`   | Detalle                    |

### Sucursales

| Método | Endpoint                  | Descripción         |
| ------ | ------------------------- | ------------------- |
| GET    | `/api/locations/`         | Sucursales          |
| GET    | `/api/locations/{id}/`    | Detalle             |

> **Importante:** estos endpoints pueden cambiar. Consultar siempre Swagger
> (`http://localhost:8000/api/docs/`) para shape exacto de request/response.
> La copia local del schema está en `../comp_files/Doggo Mundo API.yaml`.

---

## Dominio del Negocio

### Unidades de Negocio (`BusinessUnit.code`)

Mismos 7 códigos que en admin. **Relevantes para el flujo de reserva**:

| Código        | El usuario lo verá como       |
| ------------- | ----------------------------- |
| `AUTOLAVADO`  | "Autolavado"                  |
| `GROOMING`    | "Grooming profesional"        |
| `FOTO`        | "Doggo Foto"                  |
| `CAFE`        | "Doggo Café"                  |
| `VET`         | "Veterinaria"                 |
| `RETAIL`      | "Tienda"                      |
| `EXPERIENCIA` | "Experiencias"                |

> `AUTOLAVADO` ≠ `GROOMING`. No fusionar jamás.

### Flujo de Citas

```
SCHEDULED ──→ CHECKED_IN ──→ COMPLETED
    │
    ├──→ CANCELLED
    └──→ NO_SHOW
```

El cliente solo dispara `SCHEDULED` (al reservar) y `CANCELLED` (al cancelar).
`CHECKED_IN`, `COMPLETED` y `NO_SHOW` los marca el staff desde el admin.

**Regla 24 h** (aplica al cliente, no al admin): no se puede cancelar ni
reagendar con menos de 24 h de anticipación. El backend lo enforza; el
frontend debe deshabilitar los botones y explicar por qué.

### Reglas clave

- Todos los IDs son UUID
- Soft delete con `is_active` — nada se borra realmente
- Datetimes del API en UTC; mostrar en `America/Mexico_City`
- Una mascota siempre tiene un owner (customer) — el autenticado
- Onboarding de mascota: puede estar incompleto (`/onboarding-status/`) —
  mostrar banner para completar si falta info antes de permitir reservar
- El historial clínico es **solo lectura** para el cliente

---

## Testing

- **Vitest** + **React Testing Library** + **MSW**
- Tests junto al componente: `AppointmentCard.test.tsx`
- Cubrir prioritariamente: guards de ruta, validaciones de formularios,
  flujo de reserva (cada paso + happy path completo), manejo de errores del backend

---

## Lo que NO hacer

- No usar `any`
- No guardar el access token en localStorage
- No hacer fetch directo con `fetch()` — usar hooks de TanStack Query
- No duplicar lógica de fetching
- No hardcodear URLs del API
- No crear componentes monolíticos
- No instalar librerías de UI adicionales (shadcn/ui + Tailwind basta)
- No CSS modules, ni styled-components, ni CSS-in-JS
- No `export default`
- No arrow functions para componentes exportados
- No commitear sin lint + type-check
- No ignorar el brandbook
- **No copiar endpoints `/admin/`** — si lo necesitas, algo está mal pensado
- **No asumir** que el customer puede saltarse la regla de 24 h — no puede
- **No meter aquí funcionalidad de staff** (check-in, completar cita, void de orden,
  gestión de inventario). Eso vive en [../admin](../admin)

---

## Comandos

```bash
pnpm dev          # http://localhost:5174
pnpm build
pnpm lint
pnpm type-check
pnpm test
pnpm test:run
```
