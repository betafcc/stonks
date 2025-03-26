import { createTRPCClient, httpBatchLink } from '@trpc/client'
import type { Router } from '../../backend/router'

export const api = createTRPCClient<Router>({
  links: [
    httpBatchLink({
      url: 'https://stonks-2usr.onrender.com',
      async headers() {
        const token = window?.localStorage.getItem('token')
        if (token)
          return {
            authorization: `Bearer ${token}`,
          }
        return {}
      },
    }),
  ],
})
