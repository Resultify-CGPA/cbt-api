const UsersModel = require("../models/UsersModel");
const config = require("../config/config");

(() => {
  if (!config.seed) return;
  console.log("Seeding the database");
})();
