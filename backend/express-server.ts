import jwt, { type JwtPayload } from 'jsonwebtoken'
import * as trpcExpress from '@trpc/server/adapters/express'
import cors from 'cors'
import morgan from 'morgan'
import express from 'express'

import { router, type Context } from './router'
import { getUserById } from './service'

export const app = express()
  .use(cors())
  .use(morgan('tiny'))
  .get('/health-check', (_, res) => {
    res.send('ok')
  })
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
      responseMeta() {
        return {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE',
          },
        }
      },
    }),
  )
