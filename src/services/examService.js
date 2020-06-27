/* eslint-disable no-underscore-dangle */
import _ from 'lodash';

import ExamsModel from '../models/ExamsModel';
import UserService from './userService';

/** Classs for exam services */
class ExamService {
  /**
   * Gets all exams
   * @returns {array} array of exams
   */
  static async getAllExams() {
    try {
      const exams = await ExamsModel.find({ docStatus: true })
        .populate({
          path: 'bioData.user',
          populate: { path: 'department faculty' }
        })
        .populate({ path: 'questions.questionFor.faculty', select: 'faculty' })
        .exec();
      return _.orderBy(exams, 'status', 'desc');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Creates an exam
   * @param {object} data exam data
   * @returns {object} created exam
   */
  static async CreateExam(data) {
    try {
      let exam = await ExamsModel.create(data);
      exam = await ExamService.getOneExam({ _id: exam._id });
      return exam;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gets a single exam
   * @param {object} param -query param
   * @returns {object} exam object
   */
  static async getOneExam(param) {
    try {
      const exam = await ExamsModel.findOne(param)
        .populate({
          path: 'bioData.user',
          select: 'name matric faculty department level',
          populate: { path: 'department faculty' }
        })
        .populate({ path: 'questions.questionFor.faculty', select: 'faculty' })
        .exec();
      return exam;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Updates one exam
   * @param {object} param -query param
   * @param {object} data -update data
   * @returns {object} updated exam
   */
  static async updateOneExam(param, data) {
    try {
      const exam = await ExamsModel.findOne(param);
      if (!exam) {
        return exam;
      }
      _.merge(exam, data);
      const saved = await exam.save();
      return saved;
    } catch (error) {
      throw error;
    }
  }

  /**
   * returns the questions of an exam
   * @param {string} examId exam id
   * @returns {array} array of questions
   */
  static async getOneExamQuestions(examId) {
    const exam = await ExamService.getOneExam({ _id: examId });
    if (!exam) {
      return exam;
    }
    return exam.questions;
  }

  /**
   * creates a new exam question
   * @param {string} examId exam id
   * @param {object} data data to create question from
   * @returns {object} created question
   */
  static async createOneExamQuestion(examId, data) {
    let exam = await ExamService.getOneExam({ _id: examId });
    if (!exam) {
      return exam;
    }
    exam.questions.push(data);
    exam = await exam.save();
    exam = await ExamService.getOneExam({ _id: examId });
    const res = exam.questions.find((elem) => elem.question === data.question);
    return res;
  }

  /**
   * gets one exam question
   * @param {string} examID exam id
   * @param {string} questionID question id
   * @returns {null} nothing because doc was destroyed
   */
  static async getOneExamQuestion(examID, questionID) {
    const exam = await ExamService.getOneExam({ _id: examID });
    if (!exam) {
      return 0;
    }
    let ind;
    exam.questions.forEach((elem, i) => {
      if (elem._id.toString() === questionID) {
        ind = i;
      }
    });
    if (typeof ind === 'undefined') {
      return 1;
    }
    return exam.questions[ind];
  }

  /**
   * update one exam question
   * @param {object} param param to find question with
   * @param {object} update update data
   * @returns {object} updated question
   */
  static async updateOneExamQuestion(param, update) {
    const { examID, questionID } = param;
    let exam = await ExamsModel.findOne({ _id: examID });
    if (!exam) {
      return null;
    }
    let ind;
    exam.questions.forEach((elem, i) => {
      if (elem._id.toString() === questionID) {
        ind = i;
      }
    });
    if (typeof ind === 'undefined') {
      return false;
    }
    _.merge(exam.questions[ind], update);
    exam = await exam.save();
    exam = await ExamService.getOneExam({ _id: examID });
    exam.questions.forEach((elem, i) => {
      if (elem._id.toString() === questionID) {
        ind = i;
      }
    });
    return exam.questions[ind];
  }

  /**
   * deletes one exam question
   * @param {string} examID exam id
   * @param {string} questionID question id
   * @returns {null} nothing because doc was destroyed
   */
  static async deleteOneExamQuestion(examID, questionID) {
    const exam = await ExamService.getOneExam({ _id: examID });
    if (!exam) {
      return 0;
    }
    let ind;
    exam.questions.forEach((elem, i) => {
      if (elem._id.toString() === questionID) {
        ind = i;
      }
    });
    if (typeof ind === 'undefined') {
      return 1;
    }
    exam.questions.splice(ind, 1);
    await exam.save();
    return null;
  }

  /**
   * Middleware that submits for students
   * whose time got finished before they
   * could submit.
   * @returns {function} middleware function
   */
  static ExamSubmitMiddleware() {
    return async (req, res, next) => {
      try {
        const exams = await ExamsModel.find({
          docStatus: true,
          status: 1,
          bioData: { $elemMatch: { status: 1 } }
        });
        exams.forEach(async (doc) => {
          const newBiodata = await doc.bioData.reduce(async (acc, cur) => {
            acc = await acc;
            if (cur.status === 2) {
              return [...acc, cur];
            }
            const user = await UserService.getOneUser({ _id: cur.user });
            if (
              // eslint-disable-next-line operator-linebreak
              user.exam.timeStart + doc.timeAllowed * 1000 * 60 <
              Date.now() + 1000 * 60
            ) {
              cur.status = 2;
            }
            return [...acc, cur];
          }, []);
          doc.bioData = newBiodata;
          await doc.save();
        });
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * gets all results for an exam
   * @param {string} examId exam's id to get result for
   * @returns {object} array of results
   */
  static async getAllResults(examId) {
    const exams = (await ExamService.getOneExam({ _id: examId })).toObject();
    if (!exams) {
      return null;
    }
    const result = exams.bioData.map((cur) => ({
      ...cur.user,
      department: cur.user.department.department,
      faculty: cur.user.faculty.faculty,
      ca: cur.ca,
      exam: cur.exam,
      status: cur.status
    }));
    return result;
  }
}

export default ExamService;
