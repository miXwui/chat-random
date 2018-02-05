'use strict'

const socket = io()

const handlers = {
    sendMessage() {
        const messageInput = document.getElementById('messageInput')
        // emits 'chat message', may want to broadcast
        socket.emit('chat message', messageInput.value)
        messageInput.value = ''
        return false
    }
}

const view = {
    scrollMessagesToBottom() {
        const messagesContainer = document.getElementById('messagesContainer');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },
    setupEventListeners() {
        // then does x 'chat message', may want to add li, then broadcast to everyone but self.
        // i.e. in the case of send failed message/server lag.
        socket.on('chat message', chatMessage => {
            let liWithMessage = document.createElement('li')
            liWithMessage.textContent = chatMessage
            document.getElementById('messages').appendChild(liWithMessage)
            this.scrollMessagesToBottom()
        })

        socket.on('chat message alert', chatMessage => {
            let liWithMessage = document.createElement('li')
            liWithMessage.className = 'alert'
            liWithMessage.innerHTML = chatMessage
            document.getElementById('messages').appendChild(liWithMessage)
            this.scrollMessagesToBottom()            
        })

        socket.on('alert', alert => {
            document.getElementById('alert').innerHTML = alert
        })
    }
}

view.setupEventListeners()