import { createTRPCClient, httpBatchLink } from '@trpc/client'
import type { Router } from '../../backend/router'

export const api = createTRPCClient<Router>({
  links: [
    httpBatchLink({
      url: process.env.NEXT_PUBLIC_API_URL!,
      // fetch(url, options) {
      //   return fetch(url, {
      //     ...options,
      //     credentials: 'include',
      //   })
      // },
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
