import {
  type CreateAWSLambdaContextOptions,
  awsLambdaRequestHandler,
} from '@trpc/server/adapters/aws-lambda'
import { createContext, router, type Context } from './router'
import type { APIGatewayProxyEvent } from 'aws-lambda'

export const handler = awsLambdaRequestHandler({
  router,
  createContext: async ({
    event,
    context,
  }: CreateAWSLambdaContextOptions<APIGatewayProxyEvent>): Promise<Context> => {
    const token = event.headers.authorization?.split(' ')[1]

    return createContext({ token })
  },
})
