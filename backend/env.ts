import { config } from 'dotenv'
import { ZodError, z } from 'zod'

import path from 'node:path'

const stringBoolean = z.coerce
  .string()
  .transform(val => val === 'true')
  .default('false')

const EnvSchema = z.object({
  NODE_ENV: z.string().default('production'),
  DB_HOST: z.string(),
  DB_PORT: z.string().transform(val => parseInt(val, 10)),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
  DB_MIGRATING: stringBoolean,
  DB_SEEDING: stringBoolean,
})

export type Env = z.infer<typeof EnvSchema>

const file =
  process.env.NODE_ENV === 'production' || !process.env.NODE_ENV
    ? '.env'
    : '.env.' + process.env.NODE_ENV

config({ path: path.resolve(__dirname, file) })

export const env: Env = (() => {
  try {
    return EnvSchema.parse(process.env)
  } catch (error) {
    if (error instanceof ZodError) {
      const e = new Error(
        'Missing required values in .env:\n' +
          error.issues.map(issue => issue.path[0]).join('\n'),
      )
      e.stack = ''
      throw e
    } else {
      throw error
    }
  }
})()
