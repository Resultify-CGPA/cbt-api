const router = require("express").Router();
const UserModel = require("../models/UsersModel");
const ExamModel = require("../models/ExamsModel");
const auth = require("../utils/Common");
const _ = require("lodash");

router.use(auth.getFreshUser(UserModel));

router.get("/", async (req, res) => {
  res.status(200).json(req.user.toJson());
});

router.get("/exams", async (req, res, next) => {
  try {
    const user = await (await UserModel.findById(req.user._id))
      .populated({ path: exams })
      .exec();
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
