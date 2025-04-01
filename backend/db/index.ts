import { drizzle } from 'drizzle-orm/node-postgres'

import * as schema from './schema'
import { env } from '../env'

const db_url = `postgresql://${env.DB_USER}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`

export const db = drizzle(db_url, { schema })
