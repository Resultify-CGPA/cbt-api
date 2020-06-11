const router = require("express").Router();
const UserModel = require("../models/UsersModel");
const auth = require("../utils/Common");
const controller = require("./controller");

router.use(auth.getFreshUser(UserModel));

router.get("/", async (req, res) => {
  res.status(200).json(req.user.toJson());
});

router
  .route("/exams")
  .get(controller.get_exams())
  .put(controller.get_exams(true), controller.answer_exam)
  .post(controller.get_exams(true), controller.start_exam);

module.exports = router;
