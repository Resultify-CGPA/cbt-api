var express = require("express");
var app = express();
// var api = require("./api/api");
var config = require("./config/config");

require("mongoose").connect(config.db.url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to cbt app's api", data: {} });
});

//DB Seeding
// if (config.seed) require("./utils/seed");

//Middleware stack
// require("./middleware/appMiddleware")(app);

// //API Routes
// app.use("/api", api);
// app.use("/auth", require("./auth/routes"));

//Error Handling
app.use((err, req, res, next) => {
  if (err) {
    var statusCode = err.status || 500;
    console.log(err.message);
    res.status(statusCode).json({
      ...err,
      stack: err.stack,
    });
  }
});

module.exports = app;
