import { eq, sql } from 'drizzle-orm'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'

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

  return { token: generateToken(user), user }
}
