import { desc, eq, sql, and, isNotNull, isNull } from 'drizzle-orm'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'

import { fetchLastTrade, fetchFirstPriceChange } from 'common/binance'
import { db } from './db'
import * as schema from './db/schema'

const GOOGLE_CLIENT_ID =
  '889997800293-fikcmtjenq3m21uvi2unsdsmd8pujgkn.apps.googleusercontent.com'

const oauth = new OAuth2Client(GOOGLE_CLIENT_ID)
const secret = 'secret'

const generateToken = (user: typeof schema.users.$inferSelect) =>
  jwt.sign({ id: user.id }, secret, { expiresIn: '1d' })

export const getUserByGoogleId = (googleId: string) =>
  db.query.users
    .findFirst({ where: user => eq(user.googleId, googleId) })
    .execute()

export const getUserById = (id: number) =>
  db.query.users.findFirst({ where: user => eq(user.id, id) }).execute()

export const createUser = (user: typeof schema.users.$inferInsert) =>
  db
    .insert(schema.users)
    .values(user)
    .returning()
    .then(r => r[0])

export const login = async (input: { credential: string }) => {
  const ticket = await oauth.verifyIdToken({
    idToken: input.credential,
    audience: GOOGLE_CLIENT_ID,
  })

  const payload = ticket.getPayload()!

  const user = await db.query.users
    .findFirst({ where: user => eq(user.googleId, payload.sub) })
    .execute()
    .then(u =>
      // create user if not there yet
      u
        ? u
        : createUser({
            email: payload.email!,
            googleId: payload.sub,
            name: payload.name,
            picture: payload.picture,
          }),
    )

  return {
    token: generateToken(user),
    user,
    activeBet: await getActiveBet(user.id),
  }
}

export const getActiveBet = (userId: number) =>
  db.query.bets
    .findFirst({
      where: bet => and(eq(bet.userId, userId), isNull(bet.final)),
    })
    .execute()
    .then(r => r ?? null)

// -- the leaderboard
export const getRank = () =>
  db.select().from(schema.users).orderBy(desc(schema.users.score))

export const deleteUser = (id: number) =>
  db.delete(schema.users).where(eq(schema.users.id, id)).execute()

export const getHistory = (userId: number) =>
  db
    .select()
    .from(schema.bets)
    .where(and(eq(schema.bets.userId, userId), isNotNull(schema.bets.final)))
    .orderBy(desc(schema.bets.initialTime))
    .execute()

export const getLastBet = (userId: number) =>
  db
    .select()
    .from(schema.bets)
    .where(eq(schema.bets.userId, userId))
    .orderBy(desc(schema.bets.initialTime))
    .limit(1)
    .execute()
    .then(r => r.at(0))

export const createBet = async (
  input: Pick<
    typeof schema.bets.$inferInsert,
    'symbol' | 'direction' | 'userId'
  > & {
    userTime: number
  },
) => {
  // fetch last trade asap to reduce latency
  const [trade, lastBet] = await Promise.all([
    fetchLastTrade(input.symbol),
    getLastBet(input.userId),
  ])

  if (lastBet?.final === null) throw Error('You have an open bet, sit down')

  // optionally reject if too much latency
  // if ((trade.T - input.userTime) > 1000)
  //   throw Error('Too much latency')

  return await db
    .insert(schema.bets)
    .values({
      userId: input.userId,
      symbol: input.symbol,
      direction: input.direction,
      initial: +trade.p,
      initialTime: new Date(trade.T),
    })
    .returning()
    .then(r => r[0])
}

export const retrieveBetResult = async (input: {
  id: number
  userId: number
}) => {
  // find the bet
  const bets = await db
    .select()
    .from(schema.bets)
    .where(
      and(eq(schema.bets.id, input.id), eq(schema.bets.userId, input.userId)),
    )

  // if no bet found, throw
  // TODO: trpc 404
  if (bets.length === 0) throw Error('Bet not found')

  const bet = bets[0]
  // check if bet is already finished, if so, just return it
  if (bet.final !== null) return bet

  // check if at least 60 seconds has passed
  const now = Date.now()
  const initialTime = +bet.initialTime
  const minFinalTime = initialTime + 60 * 1000

  if (now < minFinalTime) throw Error('Too early')

  const price = await fetchFirstPriceChange({
    symbol: bet.symbol,
    value: bet.initial,
    timestamp: +new Date(minFinalTime),
  })

  // TODO: wrap rest in transaction
  // update bet on db
  const finalBet = await db
    .update(schema.bets)
    .set({ final: price.value, finalTime: new Date(price.timestamp) })
    .where(eq(schema.bets.id, bet.id))
    .returning()
    .then(r => r[0])

  // update user score
  const isCorrect =
    (finalBet.final! > finalBet.initial && finalBet.direction === 'up') ||
    (finalBet.final! < finalBet.initial && finalBet.direction === 'down')

  await db
    .update(schema.users)
    .set({
      score: isCorrect
        ? sql`${schema.users.score} + 1`
        : sql`${schema.users.score} - 1`,
    })
    .where(eq(schema.users.id, input.userId))

  return finalBet
}
