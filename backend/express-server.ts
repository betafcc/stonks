import jwt, { type JwtPayload } from 'jsonwebtoken'
import * as trpcExpress from '@trpc/server/adapters/express'
import cors from 'cors'
import morgan from 'morgan'
import express from 'express'

import { router, type Context } from './router'
import { getUserById } from './service'

express()
  .use(morgan('tiny'))
  .use(cors())
  .use(
    trpcExpress.createExpressMiddleware({
      router,
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
    }),
  )
  .listen(3001)
