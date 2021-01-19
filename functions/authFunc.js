const authorize = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.redirect("/login");
};

const notAuthorize = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return next();
  }
  return res.redirect("/");
};

module.exports = { authorize, notAuthorize };
