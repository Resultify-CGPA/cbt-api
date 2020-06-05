var morgan = require("morgan");
var bodyParser = require("body-parser");
var CORS = require("cors");
var RequestValidation = require("./RequestValidation");
// const validate = require("../utils/validator");

module.exports = (app) => {
  app.use(morgan("dev"));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(CORS());
  app.use(RequestValidation());
};
