/* eslint-disable operator-linebreak */
/* eslint-disable no-underscore-dangle */
import _ from 'lodash';

import User from '../models/UsersModel';
import pinsService from './pinsService';
import { __signToken } from './commonMethods';
import ExamsModel from '../models/ExamsModel';
import Faculties from '../models/Faculties';
import Departments from '../models/Departments';

const examObject = (obj) => {
  const { exam: objExam } = obj;
  return {
    answered: objExam.answered,
    timeStart: objExam.timeStart,
    timeAllowed: objExam.timeAllowed,
    timeLeft: (
      objExam.timeAllowed +
      1 -
      (Date.now() - objExam.timeStart) / (1000 * 60)
    ).toFixed(2),
    displayTime: objExam.displayTime,
    questions: objExam.questions
  };
};
const saveExam = async (user) => {
  try {
    const { examId, answered } = user.exam;
    const exam = await ExamsModel.findById(examId._id);
    let ind;
    exam.bioData.forEach((elem, i) => {
      if (elem.user.toString() === user._id.toString()) {
        ind = i;
      }
    });
    exam.bioData[ind].status = 2;
    let marks = 0;
    answered.forEach((elem) => {
      // eslint-disable-next-line no-shadow
      const { questionId: _id, answer } = elem;
      const question = _.find(exam.questions, { _id });
      if (question.correct.toLowerCase() === answer.toLowerCase()) {
        marks += question.marks;
      }
    });
    exam.bioData[ind].exam = marks;
    await exam.save();
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
      const verPassword = await pinsService.getOnePin({
        pin,
        $or: [{ user: null }, { user: user._id }]
      });
      if (!verPassword) {
        return null;
      }
      verPassword.user = user._id;
      await verPassword.save();
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
        instructions: exam.instructions,
        title: exam.title,
        timeAllowed: exam.timeAllowed,
        displayTime: exam.displayTime,
        _id: exam._id,
        inProgress,
        submitted: false
      });
      const newExam = async () => {
        const exam = await ExamsModel.findOne({
          status: 1,
          bioData: {
            $elemMatch: { user: _id, $or: [{ status: 0 }, { status: 1 }] }
          }
        });
        if (!exam) {
          return exam;
        }
        return activeExam(exam);
      };
      if (param.exam.inProgress) {
        // eslint-disable-next-line object-curly-newline
        const { timeStart, examId, answered } = param.exam;
        let exam = await ExamsModel.findById(examId);
        if (timeStart + exam.timeAllowed * 1000 * 60 < Date.now()) {
          let ind;
          exam.bioData.forEach((elem, i) => {
            if (elem.user.toString() === param._id.toString()) {
              ind = i;
            }
          });
          exam.bioData[ind].status = 2;
          exam = await exam.save();
          answered.forEach((elem) => {
            // eslint-disable-next-line no-shadow
            const { questionId: _id, answer } = elem;
            const question = _.find(exam.questions, { _id });
            if (question.correct.toLowerCase() === answer.toLowerCase()) {
              exam.bioData[ind].exam += question.marks;
            }
          });
          exam = await exam.save();
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
   * updates a single user
   * @param {object} param params to find user by
   * @param {object} update params to update user with
   * @returns {object} updated user object
   */
  static async updateOneUser(param, update) {
    const user = await User.findOne(param);
    if (!user) {
      return null;
    }
    if (update.matric && update.matric !== user.matric) {
      const check = await UserService.getOneUser({ matric: user.matric });
      if (check) {
        return 0;
      }
    }
    if (update.faculty) {
      const faculty = await Faculties.findOne({ faculty: update.faculty });
      if (!faculty) {
        return 0;
      }
      update.faculty = faculty._id;
    }
    if (update.department) {
      const faculty = update.faculty ? update.faculty : user.faculty;
      const check = await Departments.findOne({
        department: update.department,
        faculty
      });
      if (!check) {
        return 1;
      }
      update.department = check._id;
    }
    _.merge(user, update);
    await user.save();
    const data = await UserService.getOneUser({ _id: user._id });
    return data;
  }

  /**
   * increases student exam in minutes
   * @param {object} param params to find user with
   * @param {number} timeIncrease time to add to student
   * @returns {object} students exam object
   */
  static async increaseStudentTime(param, timeIncrease) {
    let user = await User.findOne(param);
    if (!user) {
      return null;
    }
    if (!user.exam.inProgress) {
      return 0;
    }
    timeIncrease *= 1000 * 60 * 60;
    user.exam.timeStart += timeIncrease;
    user = await user.save();
    return user.exam;
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
      const fetchRandomQuestions = (
        main,
        res = [],
        count,
        examType = true,
        marksCount = 0
      ) => {
        if (res.length === count || main.length <= 0 || marksCount >= 70) {
          return res;
        }
        const index = Math.floor(Math.random() * main.length);
        const question = main[index];
        main.splice(index, 1);
        if (!examType && question.questionFor.length > 0) {
          const check = _.find(question.questionFor, {
            faculty: user.faculty.faculty
          });
          if (!check) {
            return fetchRandomQuestions(main, res, count, examType, marksCount);
          }
        }
        const q = question.toObject();
        delete q.correct;
        if (marksCount + q.marks > 70) {
          return fetchRandomQuestions(main, res, count, examType, marksCount);
        }
        marksCount += q.marks;
        res.push({ ...q, questionId: q._id });
        return fetchRandomQuestions(main, res, count, examType, marksCount);
      };

      if (
        currentExam.inProgress &&
        (await ExamsModel.findOne({ _id: currentExam.examId, status: 1 }))
      ) {
        return examObject({
          exam: {
            answered: user.exam.answered,
            timeStart: user.exam.timeStart,
            timeAllowed: user.exam.examId.timeAllowed,
            displayTime: user.exam.examId.displayTime,
            questions: user.exam.questions
          }
        });
      }
      let newExam = await ExamsModel.findById(exam._id);
      let ind;
      newExam.bioData.forEach((elem, i) => {
        if (elem.user.toString() === user._id.toString()) {
          ind = i;
        }
      });
      newExam.bioData[ind].status = 1;
      newExam = await newExam.save();
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
          displayTime: newExam.displayTime,
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
        ...answers
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
          displayTime: user.exam.examId.displayTime,
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
      if (Array.isArray(users) && users.length < 1) {
        return [];
      }
      const created = await User.create(users);
      return (
        (Array.isArray(created) && created.map((user) => user.toJson())) ||
        created.toJson()
      );
    } catch (error) {
      throw error;
    }
  }
}

export default UserService;
