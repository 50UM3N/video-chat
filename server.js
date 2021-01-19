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
app.get("/user/:id", (req, res) => {
  console.log(users[req.params.id]);
  res.json({
    name: users[req.params.id],
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
app.use("/", videoRoom);

io.on("connection", (socket) => {
  socket.to("join-room-screen", (roomId, userId, name) => {
    users[userId] = name;
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected-screen", userId);

    socket.on("disconnect", () => {
      delete users.userId;
      socket.to(roomId).broadcast.emit("user-disconnected", userId);
    });
  });
  socket.on("join-room", (roomId, userId, name) => {
    users[userId] = name;
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", userId);

    socket.on("disconnect", () => {
      delete users.userId;
      socket.to(roomId).broadcast.emit("user-disconnected", userId);
    });
  });
});
server.listen(process.env.PORT || 8080);
