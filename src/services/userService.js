/* eslint-disable operator-linebreak */
/* eslint-disable no-underscore-dangle */
import _ from 'lodash';

import User from '../models/UsersModel';
import CommonMethods from './commonMethods';

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
    const { examId: _id, answered } = user.exam;
    const exam = _.find(user.exams, { _id });
    _.merge(exam, {
      inProgress: false,
      submitted: true,
      answered
    });
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
      return await CommonMethods.SignInUser(param, User);
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
    const { exam: currentExam, exams: allExams } = param;
    try {
      const newExam = () => {
        const exams = allExams.reduce((acc, cur) => {
          if (
            Date.now() >= cur.sheduledfor &&
            cur.examId.status &&
            !cur.submitted
          ) {
            return [
              ...acc,
              {
                course: cur.examId.course,
                sheduledfor: cur.sheduledfor,
                instructions: cur.examId.instructions,
                title: cur.examId.title,
                timeAllowed: cur.examId.timeAllowed,
                _id: cur._id,
                inProgress: cur.inProgress,
                submitted: cur.submitted
              }
            ];
          }
          return acc;
        }, []);
        return _.orderBy(exams, 'sheduledfor', 'asc')[0] || null;
      };
      const activeExam = () => {
        const exam = _.find(allExams, { _id: currentExam.examId });
        return {
          course: exam.examId.course,
          sheduledfor: exam.sheduledfor,
          instructions: exam.examId.instructions,
          title: exam.examId.title,
          timeAllowed: currentExam.timeAllowed,
          _id: exam._id,
          inProgress: currentExam.inProgress,
          submitted: false
        };
      };
      if (currentExam.inProgress) {
        const { timeStart, timeAllowed, examId } = currentExam;
        if (timeStart + timeAllowed * 1000 * 60 < Date.now()) {
          const exam = _.merge(_.find(allExams, { _id: examId }), {
            submitted: true,
            inProgress: true,
            answers: currentExam.answered
          });
          await exam.save();
          _.merge(param.exam, {
            inProgress: false,
            answered: [],
            questions: []
          });
          await param.save();
          return newExam();
        }
        return activeExam();
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
        .populate({ path: 'exams.examId' })
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
    const { exam: currentExam } = user;
    const fetchRandomQuestions = (main, res, count) => {
      if (res.length === count || res.length === main.length) return res;
      const question = main[Math.floor(Math.random() * main.length)];
      if (!_.find(res, question)) {
        const q = question.toObject();
        delete q.correct;
        res.push({ ...q, questionId: q._id });
        return fetchRandomQuestions(main, res, count);
      }
      return fetchRandomQuestions(main, res, count);
    };

    if (currentExam.inProgress) {
      return examObject(user);
    }
    _.merge(user.exam, {
      examId: exam._id,
      instructions: exam.examId.instructions,
      title: exam.examId.instructions,
      timeStart: Date.now(),
      timeAllowed: exam.examId.timeAllowed,
      answered: [],
      questions: fetchRandomQuestions(
        exam.examId.questions,
        [],
        exam.examId.questionPerStudent
      ),
      inProgress: true
    });
    _.merge(exam, { inProgress: true });
    await exam.save();
    await user.save();
    return examObject(user);
  }

  /**
   * Answers active exams
   * @param {object} user user object
   * @param {array} answers array of answers
   * @returns {object} exam object
   */
  static async answerExam(user, answers) {
    try {
      user.exam.answered = answers;
      user = await user.save();
      if (
        user.exam.timeStart + user.exam.timeAllowed * 1000 * 60 <
        Date.now()
      ) {
        saveExam(user);
        return null;
      }
      return examObject(user);
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
