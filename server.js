const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});
const { v4: uuidV4 } = require("uuid");
var users = {};
app.use(express.json());
app.use("/peerjs", peerServer);
app.set("view engine", "ejs");

app.use(
  express.urlencoded({
    extended: false,
  })
);
app.use(express.static("public"));
app.use(require("express-ejs-layouts"));
app.set("layout", "layouts/layout");
app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.get("/:room", (req, res) => {
  res.render("room", {
    layout: "layouts/videoLayout",
    roomId: req.params.room,
    screen: req.query.screen,
    NAME: "soumen",
  });
});

app.get("/user/:id", (req, res) => {
  console.log(users[req.params.id]);
  res.json({
    name: users[req.params.id],
  });
});

app.post("/join-room", (req, res) => {
  res.redirect(`/${req.body.room_id}`);
});

app.post("/create-room", (req, res) => {
  res.redirect(`/${uuidV4()}`);
});

io.on("connection", (socket) => {
  socket.to("join-room-screen", (roomId, userId, name) => {
    console.log(name);
    users[userId] = name;
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected-screen", userId);

    socket.on("disconnect", () => {
      delete users.userId;
      socket.to(roomId).broadcast.emit("user-disconnected", userId);
    });
  });
  socket.on("join-room", (roomId, userId, name) => {
    console.log(name);
    users[userId] = name;
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", userId);

    socket.on("disconnect", () => {
      delete users.userId;
      socket.to(roomId).broadcast.emit("user-disconnected", userId);
    });
  });
});
console.log(process.env.PORT);
server.listen(process.env.PORT || 8080);
