import { createTRPCClient, httpBatchLink } from '@trpc/client'
import type { Router } from '../../backend/router'

export const api = createTRPCClient<Router>({
  links: [
    httpBatchLink({
      url: process.env.API_URL!,
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
