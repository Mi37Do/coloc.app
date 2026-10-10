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

## Native app (Capacitor)

The web app is wrapped as an Android app with [Capacitor](https://capacitorjs.com).

```bash
pnpm android        # build the web app, sync it, open Android Studio
pnpm android:run    # build, sync and run on a connected device or emulator
pnpm cap:sync       # only build + sync (after changing web code)
```

- The phone can't reach `localhost`. `.env.android` (not committed) sets `VITE_API_URL` to the address of the PC running the API:
  **its Tailscale address** (`tailscale ip -4`), e.g. `http://100.116.9.52:3000`, which works from a real phone and from the emulator,
  as long as the Tailscale app is signed in to the same tailnet and connected on the phone. (Emulator only: `http://10.0.2.2:3000`.)
- Tailscale traffic is already encrypted, so plain `http` to a `100.x` address is fine for development.
- Capacitor 8 needs **JDK 21**. If Gradle fails with "invalid source release: 21" (or a "class file major version" error), set `JAVA_HOME` to a JDK 21, e.g. `~/.jdks/jbr-21.0.11`
  and `ANDROID_HOME` to your SDK. `android/gradle/gradle-daemon-jvm.properties` already pins Gradle to Java 21 (Android Studio's bundled Java 25 is too new for Gradle 8.14).
  If Android Studio still says "Incompatible Gradle JVM", open Settings > Build Tools > Gradle and set **Gradle JDK** to a JDK 21 (e.g. `jbr-21`), then sync.
- Invite links open the app through `coloc://join/<token>`.
- `capacitor.config.ts` allows plain-http API calls for development. Remove `cleartext`, `allowMixedContent` and
  `usesCleartextTraffic` in `AndroidManifest.xml` when the API is served over https.
- iOS isn't added: it needs a Mac (`pnpm add @capacitor/ios && npx cap add ios`).

### Native plugins in use

`app` (back button, invite deep links), `splash-screen`, `keyboard`, `haptics` (chore done), `share` and `clipboard` (invite sheet),
`camera` (event photos from camera or gallery), `network` (offline banner). Safe areas use Capacitor's built-in `SystemBars`
(edge-to-edge, `--safe-area-inset-*` CSS variables). Not included: push notifications, which need a Firebase project.
