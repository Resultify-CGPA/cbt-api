const express = require("express");
const app = express();
const user_route = require("./user");
const config = require("./config/config");
const Common = require("./utils/Common");

require("mongoose").connect(config.db.url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to cbt app's api", data: {} });
});

//DB Seeding
require("./utils/DBSeeder");

//Middleware stack
require("./utils/Middleware")(app);

//Login routes
app.post(
  "/user/signin",
  Common.loginUser(require("./models/UsersModel")),
  (req, res) => {
    const jwt = Common.signToken(req.user._id);
    const user = { ...req.user.toJson(), jwt };
    res.status(200).json(user);
  }
);

app.use(Common.decodeToken());
// API Routes
// app.use("/administrator", administrator_route);
app.use("/user", user_route);

//Error Handling
app.use((err, req, res, next) => {
  if (err) {
    const status = err.status || 500;
    console.log(err.message);
    res.status(status).json({
      ...err,
      stack: err.stack,
    });
  }
});

module.exports = app;
