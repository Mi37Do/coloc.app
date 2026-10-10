# coloc.app

React + TypeScript + Vite, scaffolded with mkreact.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` | Type-check and build for production |
| `pnpm preview` | Preview the production build |
| `pnpm typecheck` | Type-check only |
| `pnpm test` | Run the tests in watch mode |

## Structure

```
src/
├── app/providers/            # app-wide providers (= app.use(...))
├── router/
│   ├── index.tsx             # createBrowserRouter (= createRouter)
│   ├── routes.tsx            # the routes array, handle = meta
│   └── guards.ts             # requireAuth / guestOnly (= beforeEach)
├── stores/                   # Pinia-style stores
│   ├── counter.store.ts      # setup store: defineStore + signals
│   └── auth.store.ts         # Zustand store, persisted
├── assets/main.css           # Tailwind entry
├── components/ui/            # Button, ConfirmDialog (Headless UI)
├── layouts/AppLayout.tsx     # header + <Outlet /> (= <RouterView />)
├── pages/                    # route components (= views/)
├── features/                 # auth/LoginForm + UserMenu, counter/CounterCard
├── schemas/auth.schema.ts    # Zod schemas
├── services/api.ts           # Axios instance + interceptors
├── hooks/                    # custom hooks (= composables/)
├── lib/                      # define-store, signals, query client
├── utils/cn.ts               # class merging helper (= :class)
├── types/
├── App.tsx                   # = App.vue
└── main.tsx                  # = main.ts
```

Imports use the `@` alias for `src`, e.g. `import { api } from '@/services/api'`.

## Vue to React cheat sheet

| Vue 3 | Here |
| --- | --- |
| `ref()` / `computed()` | `signal()` / `computed()` from `@/lib/signals`, or `useState` / `useMemo` |
| `watch` / `watchEffect` | `effect()` / `useSignalEffect()`, or `useEffect` |
| Pinia setup store | `defineStore('id', () => { ... })` from `@/lib/define-store` |
| Pinia option store / persisted state | Zustand `create()` + `persist` |
| `storeToRefs(store)` | select fields: `useAuthStore((s) => s.user)` |
| store in a guard / outside setup | `useAuthStore.getState()` |
| composables/ | hooks/ (`useSomething`) |
| `<script setup>` | the function component body |
| `defineProps` / `defineEmits` | function props / callback props (`onSuccess`) |
| `onMounted` / `onUnmounted` | `useEffect(() => { ...; return cleanup }, [])` |
| `routes` array | `router/routes.tsx` |
| `meta` | `handle`, read with `useMatches()` |
| `router.beforeEach` / `beforeEnter` | `loader` that throws `redirect()` (`router/guards.ts`) |
| `component: () => import(...)` | `lazy: async () => ({ Component: ... })` |
| `<RouterView />` | `<Outlet />` |
| `<RouterLink>` | `<Link>` / `<NavLink>` |
| `useRoute().params` / `.query` | `useParams()` / `useSearchParams()` |
| `useRouter().push()` | `useNavigate()` |
| `:class="{ active: isActive }"` | `className={cn('base', isActive && 'active')}` from `@/utils/cn` |
| `v-if` / `v-for` | `{cond && <X />}` / `{items.map(...)}` |
| `v-model` | `value` + `onChange`, or React Hook Form's `register()` |
| `app.use(plugin)` | wrap in a provider in `app/providers` |
