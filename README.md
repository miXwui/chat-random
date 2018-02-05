# Random Chat

This app allows two random users to chat with each other via text from their browser. When a user visits the webpage, if there are no other users available, let them know they're in line to talk to the very next person who joins the site. Otherwise, pair them up and let them chat! No need for accounts, a user can use a nickname of their choosing when they load the webpage and doesn't need to be remembered between visits.

## Commands

Send '!commands' in the message box without the quotes to see a list of commands.

* 'setnick' : '"setnick John Doe" without quotes will set your nickname. <- Provides the ability to set a nickname other than the provided default.
* 'delay' : '"delay 1000 hello" without quotes sends hello to partner after 1000ms.
* 'hop' : '"hop" without the quotes will attempt to repair with another user or wait until another is available.

### Installing

'npm i' to install

## Deployment

'npm run watch' to run it in watch mode with nodemon or 'npm start' without and go to [http://localhost:3000](http://localhost:3000)

## Built With

* Node.js
* [Node.js](https://nodejs.org/)
* [Express](https://expressjs.com/)
* [Pug](https://pugjs.org/)
* [Socket.IO](https://socket.io/)

## Features to add

* User is typing alert
* Press up/down arrow key to view sent message history
* Login page
* [Load balancing](https://socket.io/docs/using-multiple-nodes/)
* https