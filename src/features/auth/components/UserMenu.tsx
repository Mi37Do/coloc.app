import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { ChevronDown, LogOut, User } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useAuthStore } from '@/stores'

// Headless UI gives behaviour and accessibility (keyboard, focus, aria) with no styles.
// Style its states with data-* variants: data-focus:, data-open:, data-closed:
const itemClass =
  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm data-focus:bg-slate-100 dark:data-focus:bg-slate-800'

export function UserMenu() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate() // = const router = useRouter(); router.push(...)
  const [confirmOpen, setConfirmOpen] = useState(false) // = const confirmOpen = ref(false)

  if (!user) return null

  return (
    <>
      <Menu>
        <MenuButton className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 data-open:text-slate-900 dark:text-slate-400 dark:hover:text-white dark:data-open:text-white">
          {user.email}
          <ChevronDown size={16} />
        </MenuButton>
        <MenuItems
          anchor="bottom end"
          transition
          className="z-50 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1 text-slate-900 shadow-lg outline-none transition duration-100 data-closed:scale-95 data-closed:opacity-0 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
        >
          <MenuItem>
            <Link className={itemClass} to="/profile">
              <User size={16} /> Profile
            </Link>
          </MenuItem>
          <MenuItem>
            <button className={itemClass} onClick={() => setConfirmOpen(true)}>
              <LogOut size={16} /> Sign out
            </button>
          </MenuItem>
        </MenuItems>
      </Menu>

      <ConfirmDialog
        open={confirmOpen}
        title="Sign out?"
        description="You will need to sign in again to see your profile."
        confirmLabel="Sign out"
        onConfirm={() => {
          logout()
          navigate('/')
        }}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  )
}
