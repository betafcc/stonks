import {
  pgTable,
  uniqueIndex,
  varchar,
  serial,
  boolean,
  timestamp,
  integer,
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
