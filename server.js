if (process.env.NODE_ENV !== "production") require("dotenv").config();
const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { ExpressPeerServer } = require("peer");
const cookie = require("cookie-session");
const passport = require("passport");
const flash = require("express-flash");
const mongoose = require("mongoose");
const passportAuthenticator = require("./functions/passportStrategy");
const user = require("./schema/user");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});
const { v4: uuidV4 } = require("uuid");
var users = {};
var rooms = {};

const videoRoom = require("./routes/video");
const signup = require("./routes/auth/signup");
const login = require("./routes/auth/login");
const logout = require("./routes/auth/logout");
const index = require("./routes/index");
const newMeeting = require("./routes/newMeeting");
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("database connected");
  });
passportAuthenticator(passport, user);
app.use(express.json());
app.use("/peerjs", peerServer);
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(cookie({ maxAge: 30 * 24 * 60 * 60 * 1000, keys: ["soumenkhara"] }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static("public"));
app.use(flash());
app.use(require("express-ejs-layouts"));
app.set("layout", "layouts/layout");

app.post("/join-room", (req, res) => {
  res.redirect(`/${req.body.room_id}`);
});

// index route
app.use("/", index);

// user id get
app.get("/user", (req, res) => {
  res.json({
    user: users[req.query.peer],
    admin: rooms[req.query.room].admin,
  });
});
// new meeting
app.use("/new-meeting", newMeeting);

// login
app.use("/login", login);

// signup
app.use("/signup", signup);

// logout
app.use("/logout", logout);

// video room
const { authorize } = require("./functions/authFunc");
app.get("/:room", authorize, (req, res) => {
  res.render("room", {
    tabName: "S-Meet",
    count:
      rooms[req.params.room] == undefined ? "0" : rooms[req.params.room].count,
    layout: "layouts/videoLayout",
    roomId: req.params.room,
    screen: req.query.screen,
    user: req.user,
  });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, name, audio, video) => {
    users[userId] = { name: name, audio: audio, video: video };
    if (rooms.hasOwnProperty(roomId) == false)
      rooms[roomId] = { admin: userId };
    rooms[roomId].count =
      rooms[roomId].count == undefined ? 1 : rooms[roomId].count + 1;
    socket.join(roomId);
    socket
      .to(roomId)
      .broadcast.emit(
        "user-connected",
        userId,
        name,
        audio,
        video,
        rooms[roomId].count
      );
    socket.on("audio-mute", (type) => {
      users[userId].audio = type;
      socket.to(roomId).broadcast.emit("user-audio-mute", userId, type);
    });
    socket.on("disconnect", () => {
      delete users.userId;
      rooms[roomId].count -= 1;
      socket
        .to(roomId)
        .broadcast.emit("user-disconnected", userId, rooms[roomId].count);
    });
  });
});
server.listen(process.env.PORT || 8080);
