const express = require('express')
require('dotenv').config()
const http = require('http')
const mongoose = require('mongoose')
const path = require('path')
const socketIo = require('socket.io')
const cors = require('cors')
const config = require('./config')

const hostname = process.env.HOST || '0.0.0.0'
const port = Number(process.env.PORT || 3000)
const router = require('./router')

const app = express()

const FRONTEND_URL = 'https://pwa-front-end-mu.vercel.app'

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
)

app.options(
  /.*/,
  cors({
    origin: FRONTEND_URL,
    credentials: true
  })
)

const server = http.createServer(app)

const io = socketIo(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
})

io.on('connection', socket => {
  console.log('Socket, new connection', socket.id)

  socket.on('disconnect', () => {
    console.log('👤: A user disconnected')
  })
})

app.use(router.init(io))
app.use('/images', express.static(path.join(__dirname, 'images')))

async function start () {
  if (!config.db) {
    throw new Error('MONGO_URI environment variable is required')
  }

  await mongoose.connect(config.db)
  console.log('Connection successful!')

  server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}`)
  })
}

start().catch(err => {
  console.error('Failed to start server:')
  console.error(err && err.stack ? err.stack : String(err))
  process.exit(1)
})
