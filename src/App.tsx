import { RouterProvider } from 'react-router'
import { AppProviders } from '@/app/providers/AppProviders'
import { router } from '@/router'

// App.vue: the root component. <RouterProvider> is the <RouterView /> of the whole app.
export default function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  )
}
