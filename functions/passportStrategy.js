const localStrategy = require("passport-local").Strategy;

const passportAuthenticator = (passport, user) => {
  passport.use(
    new localStrategy(
      { usernameField: "username", passwordField: "password" },
      (username, password, done) => {
        user.findOne({ username: username }, (err, data) => {
          if (err) return done(err);
          if (data) {
            if ((data, password == password)) done(null, data);
            else return done(null, false, { message: "Password Incorrect" });
          } else return done(null, false, { message: "Username Not found" });
        });
      }
    )
  );
  passport.serializeUser((data, done) => {
    return done(null, data.id);
  });
  passport.deserializeUser((id, done) => {
    user.findById(id, (err, data) => {
      return done(null, data);
    });
  });
};

module.exports = passportAuthenticator;
