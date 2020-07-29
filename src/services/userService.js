/* eslint-disable implicit-arrow-linebreak */
/* eslint-disable operator-linebreak */
/* eslint-disable no-underscore-dangle */
import _ from 'lodash';

import User from '../models/UsersModel';
import pinsService from './pinsService';
import { __signToken } from './commonMethods';
import ExamsModel from '../models/ExamsModel';
import Faculties from '../models/Faculties';
import Departments from '../models/Departments';
import BioData from '../models/BioData';
import Questions from '../models/Questions';

const examObject = (obj) => {
  const { exam: objExam } = obj;
  return {
    title: objExam.title,
    course: objExam.course,
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
export const saveExam = async (biodata) => {
  biodata = await BioData.findById(biodata._id)
    .populate({
      path: 'answered.questionId examId'
    })
    .exec();
  const { answered } = biodata;
  biodata.status = 2;
  let marks = 0;
  answered.forEach((elem) => {
    // eslint-disable-next-line no-shadow
    const { questionId: question, answer } = elem;
    if (typeof question !== 'object') {
      return;
    }
    if (question.correct === answer) {
      marks += question.marks;
    }
  });
  if (biodata.examId.examType && marks > 70) {
    biodata.exam = 70;
  } else if (!biodata.examId.examType && marks > 50) {
    biodata.exam = 50;
  } else {
    biodata.exam = marks;
  }
  biodata.exam = marks > 70 && biodata.examId.examType ? 70 : marks;
  await biodata.save();
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
        status: 1
      });
      const biodata = await BioData.findOne({
        user: _id,
        status: 0,
        examId: exam._id
      });
      if (!exam || !biodata) {
        return null;
      }
      return activeExam(exam);
    };

    //  Check: exam in session
    const biodata = await BioData.findOne({ user: _id, status: 1 })
      .populate({
        path: 'examId answered.questionId'
      })
      .exec();

    if (biodata) {
      // eslint-disable-next-line object-curly-newline
      const { timeStart } = biodata;
      const { timeAllowed } = biodata.examId;

      //  Check: exam time elapsed
      if (timeStart.getTime() + timeAllowed * 1000 * 60 < Date.now()) {
        saveExam(biodata);
        return newExam();
      }
      return activeExam(biodata.examId, true);
    }
    return newExam();
  }

  /**
   * Gets one user
   * @param {object} param - param to find user by
   * @returns {object} - user object
   */
  static async getOneUser(param) {
    try {
      const user = await User.findOne(param)
        .populate({ path: 'faculty department' })
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
   * @param {object} _id id to find biodata with
   * @param {number} timeIncrease time to add to student
   * @returns {object} students exam object
   */
  static async increaseStudentTime(_id, timeIncrease) {
    let user = await BioData.findById(_id).populate({ path: 'examId' }).exec();
    if (!user) {
      return null;
    }
    if (!user.status !== 1) {
      return 0;
    }
    timeIncrease *= user.examId.timeAllowed / user.examId.displayTime;
    timeIncrease *= 1000 * 60;
    user.timeStart = new Date(user.timeStart.getTime() + timeIncrease);
    user = await user.save();
    return user;
  }

  /**
   * Starts exam
   * @param {object} user user object
   * @param {object} exam exam to start
   * @returns {object} started
   */
  static async startExam(user, exam) {
    let currentExam = await BioData.findOne({ user: user._id, status: 1 })
      .populate({ path: 'examId questions.questionId', select: '-correct' })
      .exec();
    const fetchRandomQuestions = (
      main,
      res = [],
      count,
      examType = true,
      marksCount = 0
    ) => {
      if (
        res.length === count ||
        main.length <= 0 ||
        (marksCount >= 70 && examType) ||
        (marksCount >= 50 && !examType)
      ) {
        return res;
      }
      const index = Math.floor(Math.random() * main.length);
      const question = main.splice(index, 1)[0];
      if (!examType && question.questionFor.length > 0) {
        const check =
          question.questionFor.find(
            (elem) =>
              (elem.faculty && elem.faculty.toString()) ===
              user.faculty._id.toString()
          ) ||
          question.questionFor.find(
            (elem) =>
              (elem.department && elem.department.toString()) ===
              user.department._id.toString()
          );
        if (!check) {
          return fetchRandomQuestions(main, res, count, examType, marksCount);
        }
      }
      if (
        (marksCount + question.marks > 70 && examType) ||
        (marksCount + question.marks > 50 && !examType)
      ) {
        return fetchRandomQuestions(main, res, count, examType, marksCount);
      }
      marksCount += question.marks;
      res.push({ questionId: question._id });
      return fetchRandomQuestions(main, res, count, examType, marksCount);
    };

    if (currentExam) {
      currentExam = currentExam.toObject();
      currentExam.questions = currentExam.questions.map(
        (elem) => elem.questionId
      );
      return examObject({
        exam: {
          title: currentExam.examId.title,
          course: currentExam.examId.course,
          answered: currentExam.answered,
          timeStart: currentExam.timeStart,
          timeAllowed: currentExam.examId.timeAllowed,
          displayTime: currentExam.examId.displayTime,
          questions: currentExam.questions
        }
      });
    }

    let biodata = await BioData.findOne({ examId: exam._id, user: user._id })
      .populate({ path: 'examId' })
      .exec();
    const {
      timeAllowed,
      displayTime,
      questionPerStudent,
      examType,
      title,
      course
    } = biodata.examId;
    const questions = await Questions.find({ examId: exam._id });
    biodata.questions = [];
    biodata.answered = [];
    _.merge(biodata, {
      timeStart: Date.now(),
      answered: [],
      status: 1,
      questions: fetchRandomQuestions(
        questions,
        [],
        questionPerStudent,
        examType
      )
    });
    biodata = await biodata.save();
    biodata = await BioData.findOne({ user: user._id, status: 1 })
      .populate({ path: 'examId questions.questionId', select: '-correct' })
      .exec();
    biodata = biodata.toObject();
    biodata.questions = biodata.questions.map((elem) => elem.questionId);
    return examObject({
      exam: {
        course,
        title,
        answered: biodata.answered,
        timeStart: biodata.timeStart,
        timeAllowed,
        displayTime,
        questions: biodata.questions
      }
    });
  }

  /**
   * Answers active exams
   * @param {object} user user object
   * @param {array} answers array of answers
   * @returns {object} exam object
   */
  static async answerExam(user, answers) {
    let biodata = await BioData.findOne({ user: user._id, status: 1 })
      .populate({ path: 'examId questions.questionId', select: '-correct' })
      .exec();
    if (!biodata) {
      return null;
    }
    // eslint-disable-next-line object-curly-newline
    const { timeAllowed, displayTime, title, course } = biodata.examId;
    // eslint-disable-next-line prefer-const
    let { questions, timeStart } = biodata;
    const answered = biodata.toObject().answered.reduce((acc, cur) => {
      delete cur._id;
      delete cur.__v;
      return { ...acc, [cur.questionId]: cur };
    }, {});
    biodata.answered = Object.values({
      ...answered,
      ...Object.values(answers).reduce(
        (acc, cur) => ({ ...acc, [cur.questionId]: cur }),
        {}
      )
    });
    biodata = await biodata.save();
    if (timeStart + timeAllowed * 60000 < Date.now()) {
      saveExam(biodata);
      return null;
    }
    questions = questions.map((elem) => elem.questionId);
    return examObject({
      exam: {
        title,
        course,
        answered: biodata.answered,
        timeStart,
        timeAllowed,
        displayTime,
        questions
      }
    });
  }

  /**
   * Saves an exam
   * @param {object} user user object
   * @returns {object} user object
   */
  static async submitExam(user) {
    const biodata = await BioData.findOne({ user: user._id, status: 1 });
    await saveExam(biodata);
    return user;
  }

  /**
   * Gets all users
   * @returns {array} array of users
   */
  static async getAllUsers() {
    try {
      const users = await User.find();
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
