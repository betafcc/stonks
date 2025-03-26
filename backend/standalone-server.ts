import { initTRPC } from '@trpc/server'
import { createHTTPServer } from '@trpc/server/adapters/standalone'
import cors from 'cors'
import { router } from './router'

createHTTPServer({
  middleware: cors(),
  router: router,
  createContext() {
    console.log('context 3')
    return {}
  },
}).listen(3001)
