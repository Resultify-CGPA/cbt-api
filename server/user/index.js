const router = require("express").Router();
const UserModel = require("../models/UsersModel");
const auth = require("../utils/Common");

router.use(auth.getFreshUser(UserModel));

router.get("/", async (req, res) => {
  res.status(200).json({
    data: await UserModel.find(),
  });
});

module.exports = router;
