import { useAuthStore } from '@/stores'

export function ProfilePage() {
  const user = useAuthStore((state) => state.user)

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
      <p>
        This route is guarded: <code>loader: requireAuth</code> in <code>router/routes.tsx</code>.
      </p>
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <strong>{user?.name}</strong>
        <div>{user?.email}</div>
      </div>
    </section>
  )
}
