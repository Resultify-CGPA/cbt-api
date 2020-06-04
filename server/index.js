var config = require("./config/config");
var app = require("./server");

app.listen(config.port, function () {
  console.log(`Listening on http://localhost:${config.port}`);
});
