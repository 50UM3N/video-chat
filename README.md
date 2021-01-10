# WebRTC Video Chat

Simple Web Application that offer you to create video meeting room using WebRTC and Socket

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

You have to install [Node.js](https://nodejs.org/en/) in your machine.

### Installing

After installing node clone the repo by using git

```
git clone https://github.com/50UM3N/video-chat.git
                        or
git clone git@github.com:50UM3N/video-chat.git
```

Or you can download the zip file.

Then open cmd or git bash on the project folder to install some modules that I used to build this project

Install Once

```
npm install
```

[Nodemon](https://www.npmjs.com/package/nodemon) For automatically restart the server as a dev dependency (optional)

```
npm i --sav-dev nodemon
```

## Running the App

If you install nodemon the you can use. (devStart script is already added to the package.json)

```
npm run devStart
```

or

```
node server.js
```

## Preview

<img src="preview/preview.gif" alt="preview image">

## Live Demo

For deploy the project I use [heroku](https://heroku.com)

[Video Chat](https://soumen-video-calling-app.herokuapp.com/)

## Built With

- [Node Js](https://nodejs.org/en/) - The Backend
- [Peer JS](https://peerjs.com/) - PeerJS simplifies WebRTC peer-to-peer data, video, and audio calls.
- [SocketIo](https://socket.io/) - For realtime communication
- [NPM](https://www.npmjs.com/) - Dependency Management
- [GIT](https://git-scm.com/) - Used for version control
- [Heroku](https://heroku.com) - Used to Deploy Node.js applications

## License

Video Chat is released under the [MIT license](LICENSE.txt).
