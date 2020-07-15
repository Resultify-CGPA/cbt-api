/* eslint-disable no-underscore-dangle */
import _ from 'lodash';

import ExamsModel from '../models/ExamsModel';
import UserService from './userService';
import BioData from '../models/BioData';
import Questions from '../models/Questions';

/** Classs for exam services */
class ExamService {
  /**
   * Gets all exams
   * @returns {array} array of exams
   */
  static async getAllExams({ page = 1, limit = 5 }) {
    const exams = await ExamsModel.find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    return {
      exams,
      count: await ExamsModel.countDocuments({ docStatus: true })
    };
  }

  /**
   * Creates an exam
   * @param {object} data exam data
   * @returns {object} created exam
   */
  static async CreateExam(data) {
    let { bioData, questions } = data;
    const exam = await ExamsModel.create(data);

    //  Create exam biodata
    bioData = bioData.map((elem) => ({ ...elem, examId: exam._id }));
    bioData = await BioData.create(bioData);

    //  Create exam questions
    questions = questions.map((elem) => ({ ...elem, examId: exam._id }));
    questions = await Questions.create(questions);

    return { ...exam.toObject(), questions, bioData };
  }

  /**
   * Gets a single exam
   * @param {object} param -query param
   * @returns {object} exam object
   */
  static async getOneExam(param) {
    const exam = await ExamsModel.findOne(param);
    return exam;
  }

  /**
   * Updates one exam
   * @param {object} param -query param
   * @param {object} data -update data
   * @returns {object} updated exam
   */
  static async updateOneExam(param, data) {
    const exam = await ExamsModel.findOne(param);
    if (!exam) {
      return exam;
    }
    _.merge(exam, data);
    const saved = await exam.save();
    return saved;
  }

  /**
   * returns the questions of an exam
   * @returns {array} array of questions
   */
  static async getOneExamQuestions({ examId, page = 1, limit = 1 }) {
    const questions = await Questions.find({ examId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(1);
    return { questions, count: await Questions.countDocuments({ examId }) };
  }

  /**
   * creates a new exam question
   * @param {string} examId exam id
   * @param {object} data data to create question from
   * @returns {object} created question
   */
  static async createOneExamQuestion(examId, data) {
    const exam = await ExamService.getOneExam({ _id: examId });
    if (!exam) {
      return exam;
    }
    const question = await Questions.create({ ...data, examId });

    return question;
  }

  /**
   * gets one exam question
   * @param {string} _id question id
   * @returns {null} nothing because doc was destroyed
   */
  static async getOneExamQuestion({ examId, _id }) {
    const question = await Questions.findOne({ examId, _id });
    return question;
  }

  /**
   * update one exam question
   * @param {object} param param to find question with
   * @param {object} update update data
   * @returns {object} updated question
   */
  static async updateOneExamQuestion(param, update) {
    const { examId, _id } = param;
    let question = await Questions.findOne({ examId, _id });
    if (!question) {
      return false;
    }
    question.questionFor = update.questionFor
      ? update.questionFor
      : question.questionFor;
    question.options = update.options ? update.options : question.options;
    _.merge(question, update);
    question = await question.save();

    return question;
  }

  /**
   * deletes one exam question
   * @returns {null} nothing because doc was destroyed
   */
  static async deleteOneExamQuestion({ examId, _id }) {
    const question = await Questions.findOne({ _id, examId });
    if (!question) {
      return false;
    }
    await question.remove();
    return null;
  }

  /**
   * Gets biodatas for an exam
   * @returns {array} an array of biodatas
   */
  static async getOneExamsBiodata({ examId, page = 1, limit = 5 }) {
    const biodata = await BioData.find({ examId })
      .populate({ path: 'user', populate: { path: 'faculty department' } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(5)
      .exec();
    return { biodata, count: await BioData.countDocuments({ examId }) };
  }

  /**
   * creates biodata for an exam
   * @returns {object} created biodata
   */
  static async createOneBiodata({ examId, data }) {
    let biodata = await BioData.findOne({ examId, user: data.user });
    if (biodata) {
      throw new Error('entry already exists. duplicates not allowed!');
    }
    biodata = await BioData.create({ ...data, examId });

    return ExamService.getOneSingleBiodata({ examId, _id: biodata._id });
  }

  /**
   * gets one biodata
   * @returns {object} biodata object
   */
  static async getOneSingleBiodata({ examId, _id }) {
    const biodata = await BioData.findOne({ examId, _id })
      .populate({ path: 'user', populate: { path: 'faculty department' } })
      .exec();
    return biodata;
  }

  /**
   * updates one single biodata
   * @returns {object} biodata object
   */
  static async updateOneSingleBiodata({ examId, _id, update }) {
    let biodata = await BioData.findOne({ examId, _id });
    if (!biodata) {
      return null;
    }
    _.merge(biodata, update);
    biodata = await biodata.save();
    return ExamService.getOneSingleBiodata({ examId, _id });
  }

  /**
   * deletes one single biodata
   * @returns {null} null because entry deleted
   */
  static async deleteOneSingleBiodata({ examId, _id }) {
    const biodata = await BioData.findOne({ examId, _id });
    if (!biodata) {
      return false;
    }
    await biodata.remove();
    return null;
  }

  /**
   * gets all results for an exam
   * @param {string} examId exam's id to get result for
   * @returns {object} array of results
   */
  static async getAllResults(examId) {
    const biodata = await BioData.find({ examId })
      .populate({ path: 'user' })
      .exec();
    const result = biodata.map((cur) => {
      cur = cur.toObject();
      const total = cur.ca + cur.exam;
      let grade = 'F';
      if (total >= 70) grade = 'A';
      if (total >= 60 && total < 70) grade = 'B';
      if (total >= 50 && total < 60) grade = 'C';
      if (total >= 40 && total < 50) grade = 'D';
      return {
        ...cur.user,
        department: cur.user.department.department,
        faculty: cur.user.faculty.faculty,
        ca: cur.ca,
        exam: cur.exam,
        status: cur.status,
        total,
        grade
      };
    });
    return result;
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
          status: 1
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
              Date.now() + 1000 * 60 * 0.5
            ) {
              const { answered } = user.exam;
              let marks = 0;
              answered.forEach((elem) => {
                // eslint-disable-next-line no-shadow
                const { questionId: _id, answer } = elem;
                const question = _.find(doc.questions, { _id });
                if (question.correct.toLowerCase() === answer.toLowerCase()) {
                  marks += question.marks;
                }
              });
              cur.exam = marks;
              user.exam.inProgress = false;
              user.exam.answered = [];
              user.exam.questions = [];
              await user.save();
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
}

export default ExamService;
