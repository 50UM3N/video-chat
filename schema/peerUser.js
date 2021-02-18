const mongoose = require("mongoose");
const peerUser = mongoose.Schema({
  peerId: {
    type: String,
    require: true,
  },
  name: {
    type: String,
    require: true,
  },
  audio: {
    type: Boolean,
    required: true,
  },
  video: {
    type: Boolean,
    required: true,
  },
});

module.exports = new mongoose.model("peerUser", peerUser);
