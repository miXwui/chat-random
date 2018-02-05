const express = require('express')
const routes = require('./routes')
const http = require('http')
const path = require('path')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io').listen(server)

app.set('port', 3000)
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

let queue = []
let rooms = {}
let names = {}
let partners = {}

app.get('/', routes.index(io, queue, rooms, partners, names))
app.use(express.static(path.join(__dirname, 'public')))

server.listen(app.get('port'), () => {
  console.log('Chat Random server listening on port ' + app.get('port'))
})