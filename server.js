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
const peerUser = require("./schema/peerUser");
const room = require("./schema/rooms");

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
app.get("/user", async (req, res) => {
  const roomData = await room.findOne({ roomId: req.query.room }).exec();
  res.json({
    user: await peerUser.findOne({ peerId: req.query.peer }).exec(),
    admin: roomData.admin,
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
  socket.on("join-room", async (roomId, peerId, userId, name, audio, video) => {
    // add peer details
    await peerUser({
      peerId: peerId,
      name: name,
      audio: audio,
      video: video,
    }).save();
    // add room details
    var roomData = await room.findOne({ roomId: roomId }).exec();
    if (roomData == null) {
      await room({
        roomId: roomId,
        userId: userId,
        admin: peerId,
        count: 1,
      }).save();
      roomData = { count: 0 };
    } else if (roomData.userId == userId) {
      if (roomData.admin != peerId)
        await room.updateOne(
          { roomId: roomId },
          { admin: peerId, count: roomData.count + 1 }
        );
    } else
      await room.updateOne({ roomId: roomId }, { count: roomData.count + 1 });
    socket.join(roomId);
    socket
      .to(roomId)
      .broadcast.emit(
        "user-connected",
        peerId,
        name,
        audio,
        video,
        roomData.count + 1
      );
    socket.on("audio-toggle", async (type) => {
      await peerUser.updateOne({ peerId: peerId }, { audio: type });
      socket.to(roomId).broadcast.emit("user-audio-toggle", peerId, type);
    });
    socket.on("video-toggle", async (type) => {
      await peerUser.updateOne({ peerId: peerId }, { video: type });
      socket.to(roomId).broadcast.emit("user-video-toggle", peerId, type);
    });
    // chat
    socket.on("client-send", (data) => {
      socket.to(roomId).broadcast.emit("client-podcast", data, name);
    });
    socket.on("disconnect", async () => {
      roomData = await room.findOne({ roomId: roomId }).exec();
      await room.updateOne({ roomId: roomId }, { count: roomData.count - 1 });
      // remove peer details
      await peerUser.deleteOne({ peerId: peerId });
      socket
        .to(roomId)
        .broadcast.emit("user-disconnected", peerId, roomData.count - 1);
    });
  });
});
server.listen(process.env.PORT || 3000);
