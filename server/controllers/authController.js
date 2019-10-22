const passport = require("passport");
const { check, validationResult } = require("express-validator");

exports.userValidationRules = () => {
  return [
    // username must be an email
    check("email").isEmail(),
    // password must be at least 5 chars long
    check("password").isLength({ min: 5 })
  ];
};

exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors = [];
  errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }));

  return res.status(422).json({
    errors: extractedErrors
  });
};

exports.signup = (req, res) => {
  passport.authenticate("local-signup", (err, newUser, message) => {
    if (message) {
      return res.status(500).send(message);
    }
    if (err) {
      return res.status(500).json(err.message);
    }
    res.json(newUser);
  })(req, res);
};

exports.signin = (req, res, next) => {
  passport.authenticate("local-signin", (err, userinfo, message) => {
    if (!userinfo) {
      return res.status(400).json(message);
    }
    if (err) {
      return res.status(500).json(err.message);
    }
    res.json(userinfo);
  })(req, res, next);
};

exports.signout = (req, res) => {
  res.clearCookie("next-connect.sid");
  req.logout();
  res.json({ message: "You are now signed out." });
};

exports.checkAuth = (req, res, next) => {
  if (req.isAuthenticated) {
    return next();
  }
  res.redirect("/signin");
};
