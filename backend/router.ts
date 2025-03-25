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
  login: t.procedure
    .input(z.object({ credential: z.string() }))
    .mutation(({ input, ctx: { user } }) => service.login(input)),

  getUser: t.procedure.query(({ ctx: { user } }) => {
    // TODO: create user procedure instead of handling on resolvers
    if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' })
    return user
  }),

  getActiveBet: t.procedure.query(({ ctx: { user } }) => {
    if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' })
    return service.getActiveBet(user.id)
  }),

  getUserById: t.procedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => service.getUserById(input.id)),

  // -- deletes own user account
  deleteUser: t.procedure.mutation(
    ({ ctx: { user } }) => user && service.deleteUser(user.id),
  ),

  // -- gets the leaderboard
  getRank: t.procedure.query(() => service.getRank()),

  getHistory: t.procedure.query(({ ctx: { user } }) => {
    if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' })
    return service.getHistory(user.id)
  }),

  createBet: t.procedure
    .input(
      z.object({
        symbol: z.string(),
        direction: z.union([z.literal('up'), z.literal('down')]),
        userTime: z.number(),
      }),
    )
    .mutation(({ input, ctx: { user } }) => {
      if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' })
      return service.createBet({ ...input, userId: user.id })
    }),

  retrieveBetResult: t.procedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .mutation(
      ({ input, ctx: { user } }) =>
        user && service.retrieveBetResult({ ...input, userId: user.id }),
    ),
})
