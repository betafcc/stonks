import {
  pgTable,
  uniqueIndex,
  varchar,
  serial,
  boolean,
  timestamp,
  pgEnum,
  integer,
  numeric,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  googleId: varchar('google_id', { length: 256 }).unique().notNull(),
  email: varchar('email', { length: 256 }).unique().notNull(),
  name: varchar('name', { length: 256 }),
  picture: varchar('picture', { length: 512 }),
  score: integer('score').notNull().default(0),

  // // not really needed, but good practice
  // createdAt: timestamp('created_at').notNull().defaultNow(),
  // updatedAt: timestamp('updated_at')
  //   .notNull()
  //   .defaultNow()
  //   .$onUpdate(() => new Date()),
})

export const usersRelations = relations(users, ({ many }) => ({
  bets: many(bets),
}))

export const directionEnum = pgEnum('direction', ['up', 'down'])

export const bets = pgTable('bets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  symbol: varchar('symbol', { length: 64 }).notNull(),
  direction: directionEnum('direction'),
  initial: numeric('initial', { precision: 20, scale: 2 }).notNull(),
  initialTime: timestamp('initial_time').notNull(), // no default
  final: numeric('final', { precision: 20, scale: 2 }),
  finalTime: timestamp('final_time'),
})

export const betsRelations = relations(bets, ({ one, many }) => ({
  user: one(users, {
    fields: [bets.userId],
    references: [users.id],
  }),
}))
