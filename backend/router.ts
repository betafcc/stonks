import { z } from 'zod'
import { initTRPC, TRPCError, type inferRouterOutputs } from '@trpc/server'
import * as schema from './db/schema'
import * as service from './service'

export type Context = {
  user?: typeof schema.users.$inferSelect
}

export type Router = typeof router

export type RouterOutputs = inferRouterOutputs<Router>

const t = initTRPC.context<Context>().create()

export const router = t.router({
  helloWorld: t.procedure.query(() => 'hello world!'),
  login: t.procedure
    .input(z.object({ credential: z.string() }))
    .mutation(({ input }) => service.login(input)),
  getUser: t.procedure.query(({ ctx: { user } }) => {
    if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' })
    return user
  }),
  getUserById: t.procedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => service.getUserById(input.id)),
})
