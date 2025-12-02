# PLAN MAESTRO: Gestor Integral (Personal + Vivienda)

## 1. Arquitectura del Sistema: El Concepto "Híbrido"

La arquitectura se basa en un **Núcleo Unificado con Vistas Contextuales**. No construiremos dos aplicaciones separadas (una personal y una para la casa), sino una sola plataforma que filtra la información según el "sombrero" que lleves puesto (Usuario Individual vs. Miembro de la Casa).

### Diagrama Lógico
* **La Cáscara (Shell):** Es la interfaz principal. Contiene la navegación y el selector de contexto.
* **El Contexto (Scope):** Define qué datos fluyen hacia la pantalla.
    * *Modo Personal:* Solo carga datos etiquetados con tu ID.
    * *Modo Vivienda:* Carga datos etiquetados con el ID de la "Organización" (Casa).
* **Los Módulos:** Son bloques funcionales (Calendario, Finanzas, Tareas) que no saben quién los está usando, solo reciben datos y los muestran.

## 2. Infraestructura y Stack (Simplificado)

Eliminando la pasarela de pagos, la infraestructura se vuelve ligera y de coste cero para mantenimiento.

* **Hosting & Frontend (Vercel + Next.js):** El cerebro que renderiza la interfaz.
* **Identidad & Grupos (Clerk):**
    * Maneja el registro de usuarios.
    * **Función Crítica:** "Organizaciones". Clerk gestionará la creación de la "Casa" y quiénes son los "Compañeros". Esto nos ahorra programar sistemas de invitaciones y roles desde cero.
* **Base de Datos (Turso):** Un único almacén de datos. Al ser SQLite distribuido, es rapidísimo para lecturas frecuentes (abrir la app para ver la lista de la compra).

## 3. Gestión de Datos: El "Libro Mayor" (Ledger)

En lugar de procesar pagos reales, el sistema funcionará como un notario digital.

* **Para Finanzas:**
    * No mueve dinero real.
    * Simplemente registra: *"Usuario A pagó 50€ de Luz"*.
    * El sistema calcula balances: *"Usuario B debe 25€ a Usuario A"*.
    * La "liquidación" es manual (Bizum/Efectivo) y se marca un botón en la app: "Deuda Saldada".
* **Para Sincronización:**
    * Todo cambio (añadir leche a la lista) se refleja instantáneamente.
    * Si un compañero añade algo a la agenda común, tu calendario personal debe mostrarlo (quizás en otro color) para evitar conflictos, pero sin mezclar datos.

## 4. Estrategia de Desarrollo Modular (Roadmap)

Para evitar el bloqueo mental de "por dónde empiezo", el desarrollo se divide en **Fases Funcionales**. No necesitas terminar la Fase 1 para empezar la 2, pero la Fase 0 es obligatoria.

### Fase 0: Los Cimientos (Semana 1-2)
* **Objetivo:** Tener una app vacía donde puedas entrar, salir y cambiar entre "Mi Perfil" y "Mi Casa".
* **Entregable:**
    * Login funcionando.
    * Barra lateral de navegación.
    * Selector arriba a la izquierda: [ Tu Nombre ] <-> [ Casa ]
    * Base de datos conectada.

### Fase 1: Módulo de Gestión de Tiempo (Agenda)
* **Objetivo:** Sustituir Google Calendar/Agenda física.
* **Lógica:**
    * Crear eventos.
    * Visualizar mes/semana.
    * *Reto de arquitectura:* Superponer eventos de casa sobre tu agenda personal para ver disponibilidad real.

### Fase 2: Módulo de Recursos (Finanzas & Compras)
* **Objetivo:** Eliminar el Excel compartido o los post-its en la nevera.
* **Sub-módulo Lista de Compra:**
    * Lista simple con check-boxes. Sincronización en tiempo real es vital aquí (dos personas en el súper a la vez).
* **Sub-módulo Gastos:**
    * Formulario simple: Quién pagó, Cuánto, Qué, Para quién (Personal o Todos).
    * Visualización: Gráfico de gastos mensuales.

### Fase 3: Módulo de Operaciones (Tareas/Chores)
* **Objetivo:** Organización de limpieza y mantenimiento.
* **Lógica:** Asignación rotativa automática (Semana 1: Baño -> Usuario A).

## 5. Gestión del Proyecto (Workflow)

Como es un proyecto personal que escala, usa un sistema **Kanban simple** (Trello, Notion o GitHub Projects) con estas columnas para no saturarte:

1.  **Backlog (El congelador):** Ideas geniales para el futuro (ej. "Enviar dinero real", "Gamificación"). No se tocan ahora.
2.  **To-Do (Esta semana):** Máximo 3 tareas grandes. Ej: "Diseñar tarjeta de evento".
3.  **In Progress:** Lo que estás programando hoy.
4.  **Done:** Funcionalidad desplegada y probada.

### Regla de Oro del Desarrollo
**"Primero Personal, luego Compartido".**
Cuando crees una funcionalidad (ej. Lista de tareas), haz que funcione primero para ti solo. Una vez estable, añade la lógica de "filtro por casa" para que funcione con los compañeros. Es más fácil escalar de 1 a N que diseñar para N desde el principio.




MASTER TODO LIST: Gestor Integral (SaaS Personal)
CICLO 0: INFRAESTRUCTURA & SHELL (The Foundation)
Objetivo: Entorno funcional, autenticación robusta y sistema de navegación por contextos.

0.1. Setup Inicial
[x] Inicializar Proyecto Next.js 14

bunx create-next-app@latest (TS, Tailwind, ESLint, App Router).

Limpieza de boilerplate (page.tsx, globals.css).

[x] Configuración de Herramientas de Calidad

Instalar y configurar Biome (linter/formatter).

Configurar clsx y tailwind-merge para gestión de clases.

[x] Instalación UI Kit (Shadcn)

Inicializar Shadcn/ui.

Instalar componentes base: button, input, dropdown-menu, avatar, card, separator, sheet (mobile sidebar).

0.2. Base de Datos (Turso)
[x] Setup Turso

Instalar CLI turso.

Crear base de datos: turso db create <project-name>.

Obtener URL y Auth Token.

[x] Conexión Cliente

Configurar @libsql/client en src/lib/db.ts.

Definir variables de entorno en .env.local.

0.3. Autenticación (Clerk)
[x] Setup Clerk

Crear aplicación en Clerk Dashboard.

Habilitar Organizations (Settings > Organizations).

Configurar roles: Admin (Creador), Member (Roommate).

[x] Integración Next.js

Instalar @clerk/nextjs.

Envolver app en <ClerkProvider>.

Crear middleware.ts para proteger rutas (publicRoutes: [] excepto login/signup).

[x] Páginas Auth

Crear rutas (auth)/sign-in y (auth)/sign-up con componentes de Clerk montados.

0.4. Layout & Context Switching
[x] Global Layout

Crear src/components/layout/Sidebar.tsx.

Implementar <UserButton /> (Perfil) y <OrganizationSwitcher /> (Contexto).

[x] Lógica de Navegación

El Sidebar debe ser responsivo (Sheet en móvil, Fixed en desktop).

Definir array de links de navegación (navItems) constante.

CICLO 1: MOTOR DE DATOS (The Kernel)
Objetivo: Esquema de base de datos polimórfico y utilidades de backend.

1.1. Schema Design
[x] Definición SQL

Diseñar tabla items o tablas separadas (events, expenses, chores, groceries) unificadas por lógica de scope.

Columnas obligatorias en todas: id, created_by (user_id), org_id (nullable), created_at.

[x] Migración Inicial

Ejecutar script SQL en Turso para crear tablas.

1.2. Tipado TypeScript
[x] Interfaces Globales

Definir type Scope = 'PERSONAL' | 'HOUSEHOLD'.

Definir interfaces para los modelos de BD en src/types/db.ts.

1.3. Server Actions Base
[x] Utilidad de Contexto

Crear función getSafeAuth() que devuelva userId y orgId desde Clerk, lanzando error si no hay sesión.

[ ] Mutaciones Genéricas

Crear estructura básica para Actions. Ejemplo: createItemAction que inyecte automáticamente el orgId si la sesión de Clerk indica que hay una organización activa.

CICLO 2: MÓDULO DESPENSA (First Feature)
Objetivo: Lista de compra sincronizada en tiempo real (CRUD simple).

2.1. Backend Despensa
[x] Schema Específico

Tabla groceries (id, name, is_checked, category, created_by, org_id).

[ ] Actions

getGroceries(): Filtrar por orgId (si existe) o userId (si es personal).

addGrocery(name): Insert.

toggleGrocery(id): Update boolean.

clearChecked(): Delete completed items.

2.2. Frontend Despensa
[ ] Página Principal (/pantry)

Layout: Lista central.

Header: Input para añadir rápido + Botón "Limpiar".

[ ] Componente Item

Checkbox a la izquierda, Texto en medio, Botón borrar a la derecha.

Aplicar estilo "tachado" condicional.

[ ] Optimistic Updates

Implementar useOptimistic de React para que el check se sienta instantáneo antes de confirmar en servidor.

CICLO 3: MÓDULO AGENDA (Calendar)
Objetivo: Visualización compleja de datos y filtrado.

3.1. Backend Agenda
[ ] Schema Eventos

Tabla events (id, title, start_date, end_date, is_all_day, color, description, location).

[ ] Actions

getEvents(month, year): Query optimizada por rango de fechas.

createEvent(data): Validación de fechas (Start < End) con Zod.

3.2. Frontend Agenda
[ ] Integración Librería

Instalar react-day-picker o configurar grid CSS manual para mes/semana.

[ ] Visualización Mensual

Renderizar grid de días.

Poblar celdas con "píldoras" de eventos.

Diferenciar visualmente eventos Personales vs. Casa (ej. Borde vs. Relleno).

[ ] Interacción

Click en día -> Abre Modal/Sheet para crear evento.

Click en evento -> Abre detalles/edición.

CICLO 4: MÓDULO FINANZAS (Logic Heavy)
Objetivo: Gestión de gastos compartidos y personales.

4.1. Backend Finanzas
[ ] Schema Gastos

Tabla expenses (id, amount, description, category, payer_id, date).

[ ] Lógica de Balance

Action getBalance():

Obtener todos los gastos del mes de la ORG.

Agrupar por payer_id.

Calcular total global / N miembros.

Retornar quién debe a quién.

4.2. Frontend Finanzas
[ ] Dashboard Financiero (/finance)

Cards KPI: "Gasto Total Mes", "Mi Gasto", "Balance (Debo/Me deben)".

[ ] Lista de Transacciones

Historial cronológico con badges de usuario (Avatar del pagador).

[ ] Formulario Gasto

Input Amount (Numérico), Input Descripción, Select Categoría.

[ ] Vista Liquidación

Visualización simple: "Juan debe 20€ a Ana".

Botón "Saldar Deuda" (Simplemente crea un registro de compensación o resetea contadores).

CICLO 5: MÓDULO TAREAS (Chores)
Objetivo: Asignación y estados.

5.1. Backend Tareas
[ ] Schema Tareas

Tabla chores (id, title, frequency, assigned_to_user_id, status, due_date).

[ ] Actions

completeChore(id): Update status + Log completion date.

rotateChores() (Opcional/Futuro): Lógica para reasignar tareas semanalmente.

5.2. Frontend Tareas
[ ] Tablero Kanban/Lista

Columnas: "To Do", "Done".

[ ] Filtros

Toggle: "Ver Todas" vs "Solo Mías".

[ ] UI Feedback

Animación/Confetti al completar una tarea (Gamificación mínima).

CICLO 6: DASHBOARD & POLISH
Objetivo: Unificación y experiencia de usuario final.

6.1. Página Home (/dashboard)
[ ] Widgets Resumen

Componente UpcomingEvents: Próximos 3 eventos.

Componente MyTasks: Tareas asignadas para hoy.

Componente FinanceAlert: Si el balance es negativo (debes dinero).

[ ] Data Fetching Paralelo

Usar Promise.all en el Server Component para cargar datos de los 3 módulos simultáneamente.

6.2. UX/UI Final
[ ] Empty States

Diseñar componentes bonitos para cuando no hay datos (ej. "No hay eventos, ¡a descansar!").

[ ] Loading Skeletons

Crear versiones de carga para las tarjetas del dashboard.

[ ] Error Handling

Crear error.tsx global para capturar fallos de DB.

6.3. Deploy
[ ] Pre-Deploy Check

Correr bun run lint.

Correr bun run build localmente para verificar.

[ ] Vercel

Conectar Repo.

Configurar Variables de entorno (CLERK, TURSO).

Deploy Production.