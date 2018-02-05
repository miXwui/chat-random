'use strict'

exports.index = (io, queue, rooms, names, partners) => (req, res) => {

  const connectedSockets = io.nsps['/'].connected

  let findAndConnectToPartner = socket => {
    const userId = socket.id
    if (queue.length > 0) {
      // queue won't be large so it's performant, may use a ds library better than O(n)
      const partnerId = queue.shift()
      // get partner socket obj
      const partnerSocket = connectedSockets[partnerId]
      // join rooms
      const room = `${partnerId}+${userId}`
      socket.join(room);
      partnerSocket.join(room)
      // add ids to rooms with current room
      rooms[userId] = room
      rooms[partnerId] = room
      // add ids to partners with current partner
      partners[userId] = partnerId
      partners[partnerId] = userId
      // send users alert that they joined the room and now chatting with $user message
      setAlerts(socket, 'newPartner')
    } else {
      queue.push(userId)
      socket.emit('alert', 'Waiting for partner...')
    }
  }

  let createDateAndTime = () => {
    let dt = new Date
    return `${dt.getMonth() + 1}/${dt.getDate()}/${dt.getFullYear()} ${dt.getHours() + 1}:${dt.getHours()}:${dt.getMinutes()}`
  }

  let setAlerts = (socket, type) => {
    const userId = socket.id
    const partnerSocket = connectedSockets[partners[userId]]
    const partnerId = partnerSocket.id

    socket.emit('alert', `Joined room: <span class="bold">${names[userId]}</span> and <span class="bold">${names[partnerId]}</span>`)
    partnerSocket.emit('alert', `Joined room: <span class="bold">${names[partnerId]}</span> and <span class="bold">${names[userId]}</span>`)
    if (type === 'newPartner') {
      socket.emit('chat message alert', `[${createDateAndTime()}] Now chatting with user <span class="bold">${names[partnerId]}</span>`)
      partnerSocket.emit('chat message alert', `[${createDateAndTime()}] Now chatting with user <span class="bold">${names[userId]}</span>`)
    } else if (type === 'newNickname') {
      io.in(rooms[userId]).emit('chat message alert', `[${createDateAndTime()}] User <span class="bold">${userId}</span> has changed nickname to <span class="bold">${names[userId]}</bold>`)
    }
  }

  let cleanUpSelfAndPartner = userId => {
    const partnerId = partners[userId]
    const room = rooms[userId]
    
    // remove user and partner from rooms and partners array
    deletePropFromObj([rooms, partners], [userId, partnerId])

    // unjoin partner from room
    const partnerSocket = connectedSockets[partnerId]
    partnerSocket.leave(room)
    partnerSocket.emit('chat message alert', `[${createDateAndTime()}] ${userId} has left, finding new partner...`)
    // queue.push(partnerId)
  }

  async function cleanThenFind(userId) {
    // synchronous so id is removed from room, then finds new partner and adds to room.
    // otherwise partner can be added to room, then deleted, resulting in missing room
    await cleanUpSelfAndPartner(userId)
    const partnerSocket = connectedSockets[partners[userId]]
    findAndConnectToPartner(partnerSocket)
  }

  let deletePropFromObj = (obj, key) => {
    obj.forEach(o => {
      key.forEach(k => {
        delete o[k]
      })
    })
  }

  let handleNewUserMessage = (socket, chatMessage) => {
    const userId = socket.id

    let commands = new Map([
      ['<span class="bold">/setnick</span>', '"<span class="bold">/setnick John Doe"</span> without quotes will set your nickname.'],
      ['<span class="bold">/delay</span>', '"<span class="bold">/delay 1000 hello"</span> without quotes sends hello to partner after 1000ms.'],
      ['<span class="bold">/hop</span>', '"<span class="bold">/hop"</span> without the quotes will attempt to repair with another user or wait until another is available.']
    ])
    
    let commandString = (() => {
        let commandString = ''
        for(let [key, value] of commands) {
          commandString = `${commandString}${key} i.e. ${value}\n`
      }
      return commandString
    })()

    const splitChatMessage = chatMessage.split(' ', 2)

    if (chatMessage === '!commands') {
      socket.emit('chat message alert', commandString)
    // setnick
    } else if (splitChatMessage[0] === '/setnick' && splitChatMessage[1] !== undefined) {
      const nickname = chatMessage.substr(splitChatMessage[0].length + 1)
      names[userId] = nickname
      setAlerts(socket, 'newNickname')
    // hop
    } else if (chatMessage === '/hop') {
      if (queue[0] !== userId) {
        socket.emit('chat message alert', `[${createDateAndTime()}] Hippity hop hop! Finding new partner...`)
        queue.push(userId)
        cleanThenFind(userId)
      } else {
        socket.emit('chat message alert', `[${createDateAndTime()}] Still in queue, please be patient.`)
      }
    // delay
    } else if (splitChatMessage[0] === '/delay' && splitChatMessage[1] !== '' && !isNaN(splitChatMessage[1]) && chatMessage.substr(splitChatMessage[0].length + splitChatMessage[1].length + 1) !== undefined) {
        const chatMessageText = chatMessage.substr(splitChatMessage[0].length + splitChatMessage[1].length + 2)
        const timeout = ms => new Promise(res => setTimeout(res, ms))
        async function delay(delayMs) {
          socket.emit('chat message alert', `[${createDateAndTime()}] Sending message with <span class="bold">${delayMs}ms</span> delay: <span class="bold">${chatMessageText}</span>`)
          await timeout(delayMs)
          io.in(rooms[userId]).emit('chat message', `[${createDateAndTime()}] ${chatMessageText}`)
        }
        delay(parseInt(splitChatMessage[1]))
      // send chat message only to room user is in
      } else {
        if (queue[0] !== userId) {
          io.in(rooms[userId]).emit('chat message', `[${createDateAndTime()}] ${chatMessage}`)
        } else {
          socket.emit('chat message alert', `[${createDateAndTime()}] Still in queue...`)
        }
      }
  }

  io.sockets.once('connection', socket => {
      const userId = socket.id
      names[userId] = userId
      findAndConnectToPartner(socket)

      // on user disconnect
      socket.on('disconnect', () => {
        // remove userId from queue
        queue = queue.filter(id => id !== userId)
        // if user and partner exist, clean up
        if (partners.hasOwnProperty(userId)) {
          cleanThenFind(userId)
        }
      })

      socket.on('chat message', chatMessage => {
          handleNewUserMessage(socket, chatMessage)
      })
  })

  res.render('index', {
    title: 'Chat Random'
  })
}