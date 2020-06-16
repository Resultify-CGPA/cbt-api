/* eslint-disable operator-linebreak */
/* eslint-disable no-underscore-dangle */
import _ from 'lodash';

import User from '../models/UsersModel';
import pinsService from './pinsService';
import { __signToken } from './commonMethods';
import ExamsModel from '../models/ExamsModel';
// import ExamService from './examService';

const examObject = (obj) => {
  const { exam: objExam } = obj;
  return {
    answered: objExam.answered,
    timeStart: objExam.timeStart,
    timeLeft: Math.floor(
      objExam.timeAllowed - (Date.now() - objExam.timeStart) / (1000 * 60)
    ),
    questions: objExam.questions
  };
};
const saveExam = async (user) => {
  try {
    const { examId, answered } = user.exam;
    const exam = await ExamsModel.findById(examId._id);
    const userBioData = _.find(exam.bioData, { user: user._id });
    userBioData.submitted = true;
    answered.forEach((elem) => {
      // eslint-disable-next-line no-shadow
      const { questionId: _id, answer } = elem;
      const question = _.find(exam.questions, { _id });
      if (question.correct.toLowerCase() === answer.toLowerCase()) {
        userBioData.exam += exam.markPerQuestion;
      }
    });
    await userBioData.save();
    _.merge(user.exam, {
      inProgress: false,
      answered: [],
      questions: []
    });
    return await user.save();
  } catch (error) {
    throw error;
  }
};

/** Class that handles user service */
class UserService {
  /**
   * Signs in user
   * @param {object} param - object to find user by
   * @returns {object} - signed user
   */
  static async signInUser(param) {
    try {
      const { matric, password: pin } = param;
      const user = await User.findOne({ matric }).populate({
        path: 'faculty department'
      });
      if (!user) {
        return user;
      }
      if (!user.status) {
        const e = new Error('this account has been blocked');
        e.status = 403;
        e.name = 'LOGIN_ERROR';
        throw e;
      }
      const verPassword = await pinsService.getOnePin({ pin });
      if (!verPassword) {
        return null;
      }
      const accessToken = __signToken({ _id: user._id });
      return { ...user.toObject(), accessToken };
    } catch (error) {
      throw error;
    }
  }

  /**
   *
   * @param {object} param - current user object
   * @returns {any} - object if exam is found null if not
   */
  static async currentExam(param) {
    const { _id } = param;
    try {
      const activeExam = (exam, inProgress = false) => ({
        course: exam.course,
        scheduledfor: exam.scheduledFor,
        instructions: exam.instructions,
        title: exam.title,
        timeAllowed: exam.timeAllowed,
        _id: exam._id,
        inProgress,
        submitted: false
      });
      const newExam = async () => {
        const exams = await ExamsModel.find({
          status: true,
          bioData: { $elemMatch: { user: _id, submitted: false } }
        });
        const exam = _.orderBy(exams, 'scheduledFor', 'asc')[0];
        if (!exam) {
          return exams;
        }
        return activeExam(exam);
      };
      if (param.exam.inProgress) {
        // eslint-disable-next-line object-curly-newline
        const { timeStart, examId, answered } = param.exam;
        const exam = await ExamsModel.findById(examId);
        if (timeStart + exam.timeAllowed * 1000 * 60 < Date.now()) {
          const userBioData = _.find(exam.bioData, { user: _id });
          userBioData.submitted = true;
          answered.forEach((elem) => {
            // eslint-disable-next-line no-shadow
            const { questionId: _id, answer } = elem;
            const question = _.find(exam.questions, { _id });
            if (question.correct.toLowerCase() === answer.toLowerCase()) {
              userBioData.exam += exam.markPerQuestion;
            }
          });
          await userBioData.save();
          _.merge(param.exam, {
            inProgress: false,
            answered: [],
            questions: []
          });
          await param.save();
          return newExam();
        }
        return activeExam(exam, true);
      }
      return newExam();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gets one user
   * @param {object} param - param to find user by
   * @returns {object} - user object
   */
  static async getOneUser(param) {
    try {
      const user = await User.findOne(param)
        .populate({ path: 'exam.examId faculty department' })
        .exec();
      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Starts exam
   * @param {object} user user object
   * @param {object} exam exam to start
   * @returns {object} started
   */
  static async startExam(user, exam) {
    try {
      const { exam: currentExam } = user;
      const fetchRandomQuestions = (main, res = [], count, examType = true) => {
        if (res.length === count || res.length >= main.length) {
          return res;
        }
        const index = Math.floor(Math.random() * main.length);
        const question = main[index];
        main.splice(index, 1);
        if (!examType && question.questionFor.length > 0) {
          const check = _.find(question.questionFor, {
            faculty: user.faculty._id,
            department: user.department._id
          });
          if (!check) {
            return fetchRandomQuestions(main, res, count, examType);
          }
        }
        const q = question.toObject();
        delete q.correct;
        res.push({ ...q, questionId: q._id });
        return fetchRandomQuestions(main, res, count, examType);
      };

      if (currentExam.inProgress) {
        return examObject({
          exam: {
            answered: user.exam.answered,
            timeStart: user.exam.timeStart,
            timeAllowed: user.exam.examId.timeAllowed,
            questions: user.exam.questions
          }
        });
      }
      const newExam = await ExamsModel.findById(exam._id);
      _.merge(user, {
        exam: {
          examId: exam._id,
          instructions: newExam.instructions,
          title: newExam.title,
          timeStart: Date.now(),
          answered: [],
          questions: fetchRandomQuestions(
            newExam.questions,
            [],
            newExam.questionPerStudent,
            newExam.examType
          ),
          inProgress: true
        }
      });
      await user.save();
      return examObject({
        exam: {
          answered: user.exam.answered,
          timeStart: user.exam.timeStart,
          timeAllowed: newExam.timeAllowed,
          questions: user.exam.questions
        }
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Answers active exams
   * @param {object} user user object
   * @param {array} answers array of answers
   * @returns {object} exam object
   */
  static async answerExam(user, answers) {
    try {
      const answered = user.exam.answered.reduce((acc, cur) => {
        delete cur._id;
        return { [cur.questionId]: cur };
      }, {});
      user.exam.answered = Object.values({
        ...answered,
        [answers.questionId]: answers
      });
      user = await user.save();
      if (
        user.exam.timeStart + user.exam.examId.timeAllowed * 1000 * 60 <
        Date.now()
      ) {
        saveExam(user);
        return null;
      }
      return examObject({
        exam: {
          answered: user.exam.answered,
          timeStart: user.exam.timeStart,
          timeAllowed: user.exam.examId.timeAllowed,
          questions: user.exam.questions
        }
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Saves an exam
   * @param {object} user user object
   * @returns {object} user object
   */
  static async submitExam(user) {
    try {
      user = await saveExam(user);
      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gets all users
   * @returns {array} array of users
   */
  static async getAllUsers() {
    try {
      const users = await User.find().populate({ path: 'exams.examId' }).exec();
      return _.orderBy(users, 'status', 'desc');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Creates users from array of data
   * @param {array} users array of users
   * @returns {array} array of created users
   */
  static async createUsers(users) {
    try {
      if (users.length < 1) {
        return [];
      }
      const created = await User.create(users);
      return created.map((user) => user.toJson());
    } catch (error) {
      throw error;
    }
  }
}

export default UserService;
