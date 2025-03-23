import { fib } from 'common'
import cors from 'cors'
import express from 'express'

express()
  .use(cors())
  .get('/hello', (req, res) => {
    res.send(`Hello, World! ${fib(10)}`)
  })
  .listen(3001)
