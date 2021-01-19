const express = require("express");
const route = express.Router();
const { notAuthorize } = require("../../functions/authFunc");
const user = require("../../schema/user");

route.get("/", notAuthorize, (req, res) => {
  res.render("auth/signup.ejs", { tabName: "Register S-Meet" });
});

route.post("/", notAuthorize, (req, res) => {
  user.findOne({ username: req.body.username }, (err, data) => {
    if (err) console.log(err);
    if (data) {
      req.flash("err", "Username Already taken");
      res.redirect("/signup");
    } else {
      user({
        name: req.body.name,
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
      }).save((err, data) => {
        req.flash("success", "Signup Successful");
        res.redirect("/signup");
      });
    }
  });
});

module.exports = route;
