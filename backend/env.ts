import { ZodError, z } from 'zod'

// const stringBoolean = z.coerce
//   .string()
//   .transform(val => val === 'true')
//   .default('false')

const EnvSchema = z.object({
  NODE_ENV: z.string().default('development'),
  DATABASE_URL: z.string(),
  // POSTGRES_MIGRATING: stringBoolean,
  // POSTGRES_SEEDING: stringBoolean,
})

export type Env = z.infer<typeof EnvSchema>


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
