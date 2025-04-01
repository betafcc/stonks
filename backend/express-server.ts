import * as trpcExpress from '@trpc/server/adapters/express'
import cors from 'cors'
import morgan from 'morgan'
import express from 'express'

import { createContext, router, type Context } from './router'

express()
  .use(cors())
  .use(morgan('tiny'))
  .use(
    trpcExpress.createExpressMiddleware({
      router,
      createContext: async ({ req, res }): Promise<Context> => {
        const token = req.headers.authorization?.split(' ')[1]
        return createContext({ token })
      },
    }),
  )
  .listen(3001, () => console.log('listening on http://localhost:3001'))
