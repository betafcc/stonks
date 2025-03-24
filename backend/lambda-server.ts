import {
  type CreateAWSLambdaContextOptions,
  awsLambdaRequestHandler,
} from '@trpc/server/adapters/aws-lambda'
import { router, type Context } from './router'
import type { APIGatewayProxyEvent } from 'aws-lambda'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import { getUserById } from './service'

export const handler = awsLambdaRequestHandler({
  router,
  createContext: async ({
    event,
    context,
  }: CreateAWSLambdaContextOptions<APIGatewayProxyEvent>): Promise<Context> => {
    const token = event.headers.authorization?.split(' ')[1]

    if (token) {
      const decoded = jwt.verify(token, 'secret') as JwtPayload
      return {
        user: await getUserById(decoded.id),
      }
    }

    return {}
  },
})
