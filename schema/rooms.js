const mongoose = require("mongoose");
const rooms = mongoose.Schema({
  roomId: {
    type: String,
    require: true,
  },
  userId: {
    type: String,
    require: true,
  },
  admin: {
    type: String,
    required: true,
  },
  count: {
    type: Number,
    required: true,
  },
});

module.exports = new mongoose.model("rooms", rooms);
