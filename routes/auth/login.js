const express = require("express");
const route = express.Router();
const { notAuthorize } = require("../../functions/authFunc");
const passport = require("passport");
route.get("/", notAuthorize, (req, res) => {
  res.render("auth/login.ejs", { tabName: "Login S-Meet" });
});
route.post(
  "/",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);
module.exports = route;
