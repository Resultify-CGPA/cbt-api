const UserModel = require("../models/UsersModel");
const _ = require("lodash");
const common = require("../utils/Common");

exports.get_exams = (pass = false) => async (req, res, next) => {
  try {
    let opt;
    if (req.user.exam.in_progress) {
      const { time_start, time_allowed, exam_id: _id } = req.user.exam;
      if (time_start + time_allowed * 1000 * 60 < Date.now()) {
        opt = true;
        const exam = _.find(req.user.exams, { _id });
        exam.submitted = true;
        exam.in_progress = false;
        exam.answers = req.user.exam.answered;
        await exam.save();
        req.user.exam.in_progress = false;
        req.user.exam.answered = [];
        req.user.exam.questions = [];
        req.user = await req.user.save();
      } else {
        opt = false;
      }
    } else {
      opt = true;
    }
    const user = await UserModel.findById(req.user._id)
      .populate({ path: "exams.exam_id" })
      .exec();

    const exams = user.exams.reduce((acc, cur) => {
      if (Date.now() >= cur.sheduledfor && cur.exam_id.status && !cur.submitted)
        if (pass) return [...acc, cur];
      return [
        ...acc,
        {
          course: cur.exam_id.course,
          sheduledfor: cur.sheduledfor,
          instructions: cur.exam_id.instructions,
          title: cur.exam_id.title,
          time_allowed: cur.exam_id.time_allowed,
          _id: cur._id,
          in_progress: cur.in_progress,
          submitted: cur.submitted,
        },
      ];
      return acc;
    }, []);
    if (exams.length < 1) {
      res
        .status(200)
        .json({ message: "You don't have any exams at this time" });
    }
    const exam = _.orderBy(exams, "sheduledfor", "asc");
    if (pass) {
      req.exams = { exam: user.exam, exams: exam[0] };
      req.opt = opt;
      return next();
    }

    if (!opt) {
      const exam = _.find(user.exams, { _id: user.exam.exam_id });
      const doc = {
        course: exam.exam_id.course,
        sheduledfor: exam.sheduledfor,
        instructions: exam.exam_id.instructions,
        title: exam.exam_id.title,
        time_allowed: user.exam.time_allowed,
        _id: exam._id,
        in_progress: user.exam.in_progress,
        submitted: false,
      };
      return res.status(200).json(doc);
    }
    res.status(200).json(exam[0]);
  } catch (err) {
    next(err);
  }
};
exports.start_exam = async (req, res, next) => {
  try {
    if (!req.opt) {
      return res.status(200).json({
        answered: req.exams.exam.answered,
        time_start: req.exams.exam.time_start,
        time_left: Math.floor(
          req.exams.exam.time_allowed -
            (Date.now() - req.exams.exam.time_start) / (1000 * 60)
        ),
        questions: req.exams.exam.questions,
      });
    }
    const exam = req.exams.exams;
    req.user.exam.exam_id = exam._id;
    req.user.exam.instructions = exam.exam_id.instructions;
    req.user.exam.title = exam.exam_id.title;
    req.user.exam.time_start = Date.now();
    req.user.exam.time_allowed = exam.exam_id.time_allowed;
    req.user.exam.answered = [];
    req.user.exam.in_progress = true;
    const fetchRandomQuestions = (main, res, count) => {
      if (res.length === count || res.length === main.length) return res;
      const question = main[Math.floor(Math.random() * main.length)];
      if (!require("lodash").find(res, question)) {
        res.push({ ...question, questionId: question._id });
        return fetchRandomQuestions(main, res, count);
      } else return fetchRandomQuestions(main, res, count);
    };
    req.user.exam.questions = fetchRandomQuestions(
      exam.exam_id.questions,
      [],
      exam.exam_id.questions_per_student || 30
    );
    exam.in_progress = true;
    await exam.save();
    req.user = await req.user.save();
    return res.status(200).json({
      answered: req.user.exam.answered,
      time_start: req.user.exam.time_start,
      time_left: Math.floor(
        req.user.exam.time_allowed -
          (Date.now() - req.user.exam.time_start) / (1000 * 60)
      ),
      questions: req.user.exam.questions,
    });
  } catch (err) {
    return next(err);
  }
};
exports.answer_exam = async (req, res, next) => {
  if (!req.validate({ answers: "required|object", submit: "boolean" })) {
    return;
  }
  if (!req.user.exam.in_progress) {
    return res.status(400).json({
      message: "You current don't have any exams in session.",
    });
  }
  try {
    const validate_answers = (answers) => {
      if (typeof answers !== "object") return false;
      const eval = Object.values(answers).reduce((acc, cur) => {
        if (!cur.question || !cur.answer) acc = false;
        if (typeof acc === "object") {
          acc = [...acc, cur];
        }
        return acc;
      }, []);
      return eval;
    };
    if (typeof validate_answers(req.body.answers) === "boolean") {
      return res.status(400).json({
        message:
          "invalid answers format: your answers should be an object if the form { [question_id]: { answer: [answer], question: [question_id]}}",
      });
    }
    req.user.exam.answered = [...validate_answers(req.body.answers)];
    req.user = await req.user.save();
    if (
      req.submit ||
      req.user.exam.time_start + req.user.exam.time_allowed * 1000 * 60 <
        Date.now()
    ) {
      const { time_start, time_allowed, exam_id: _id } = req.user.exam;
      const exam = _.find(req.user.exams, { _id });
      exam.submitted = true;
      exam.in_progress = false;
      exam.answers = req.user.exam.answered;
      await exam.save();
      return res.status(200).json({
        message: "Exam has been submitted",
        submitted: true,
      });
    }
    return res.status(200).json({
      answered: req.user.exam.answered,
      time_start: req.user.exam.time_start,
      time_left: Math.floor(
        req.user.exam.time_allowed -
          (Date.now() - req.user.exam.time_start) / (1000 * 60)
      ),
      questions: req.user.exam.questions,
    });
  } catch (err) {
    return next(err);
  }
};
