import cors from 'cors'
import express from 'express'

express()
  .use(cors())
  .get('/hello', (req, res) => {
    res.send(`Hello, World!`)
  })
  .listen(3001)
