var jwt = require("jsonwebtoken");
var expressJwt = require("express-jwt");
var config = require("../config/config");
var checkToken = expressJwt({ secret: config.secrets.jwt });

exports.error_out = ({ name, status, message }) => {
  const error = new Error();
  error.name = name || "ERROR";
  error.status = status || 500;
  error.message = message || "";
  throw error;
};

exports.decodeToken = () => {
  return (req, res, next) => {
    if (req.query && req.query.hasOwnProperty("access_token"))
      req.headers.authorization = "Bearer " + req.query.access_token;

    checkToken(req, res, next);
  };
};

exports.getFreshUser = (Model) => {
  return async (req, res, next) => {
    try {
      const user = await Model.findOne({
        status: true,
        // _id: req.user.data._id,
      });
      if (!user) {
        exports.error_out({
          message: "invalid jwt: unauthorized",
          status: 401,
          name: "INVALID_TOKEN",
        });
      }
      req.user = user;
      return next();
    } catch (e) {
      return next(e);
    }
  };
};

exports.loginUser = (Model) => {
  return async (req, res, next) => {
    if (
      !req.validate({
        username: "required|string",
        password: "required|string",
      })
    ) {
      return;
    }
    const { username, password } = req.body;
    try {
      const user = await Model.findOne({
        $or: [{ username }, { email: username }, { matric: username }],
      });
      if (!user || !(await user.authenticate(password))) {
        exports.error_out({
          message: "invalid credentials",
          status: 401,
          name: "LOGIN_ERROR",
        });
      } else if (!user.status) {
        exports.error_out({
          message: "this account has been blocked",
          status: 403,
          name: "LOGIN_ERROR",
        });
      }
      req.user = user;
      return next();
    } catch (err) {
      return next(err);
    }
  };
};

exports.signToken = function (id) {
  return jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + config.expireTime,
      data: { _id: id },
    },
    config.secrets.jwt
  );
};
