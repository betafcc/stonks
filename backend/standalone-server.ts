import jwt, { type JwtPayload } from 'jsonwebtoken'
import { initTRPC } from '@trpc/server'
import { createHTTPServer } from '@trpc/server/adapters/standalone'
import cors from 'cors'
import { router, type Context } from './router'
import { getUserById } from './service'

createHTTPServer({
  middleware: cors(),
  router: router,
  createContext: async ({ req, res }): Promise<Context> => {
    const token = req.headers.authorization?.split(' ')[1]
    if (token) {
      const decoded = jwt.verify(token, 'secret') as JwtPayload
      return {
        user: await getUserById(decoded.id),
      }
    }

    return {}
  },
}).listen(3001)
