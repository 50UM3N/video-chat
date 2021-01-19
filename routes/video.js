const express = require("express");
const route = express.Router();
const { authorize } = require("../functions/authFunc");
route.get("/:room", authorize, (req, res) => {
  res.render("room", {
    tabName: "S-Meet",
    layout: "layouts/videoLayout",
    roomId: req.params.room,
    screen: req.query.screen,
    user: req.user,
  });
});

module.exports = route;
