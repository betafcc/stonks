import { defineConfig } from 'drizzle-kit'
import { env } from './env'

export default defineConfig({
  dialect: 'postgresql',
  schema: './db/schema.ts',
  dbCredentials: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    ssl: env.NODE_ENV === 'production' ? 'allow' : false,
  },
  verbose: true,
  strict: false,
})
