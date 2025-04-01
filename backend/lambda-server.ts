import type {
  APIGatewayProxyResult,
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
} from 'aws-lambda'
import {
  awsLambdaRequestHandler,
  type CreateAWSLambdaContextOptions,
} from '@trpc/server/adapters/aws-lambda'
import { createContext, router, type Context } from './router'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const trpcHandler = awsLambdaRequestHandler({
  router,
  createContext: async ({
    event,
    context,
  }: CreateAWSLambdaContextOptions<APIGatewayProxyEvent>): Promise<Context> => {
    const token = event.headers.authorization?.split(' ')[1]

    return createContext({ token })
  },
  responseMeta() {
    return {
      headers: corsHeaders,
    }
  },
})

export const handler: APIGatewayProxyHandler = async (
  event,
  context,
): Promise<APIGatewayProxyResult> => {
  // Handle OPTIONS preflight manually
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    }
  }

  // Handle regular requests with trpc
  return trpcHandler(event, context) as Promise<APIGatewayProxyResult>
}
