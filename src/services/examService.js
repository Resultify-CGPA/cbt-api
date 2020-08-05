/* eslint-disable operator-linebreak */
/* eslint-disable no-underscore-dangle */
import _ from 'lodash';
import path from 'path';
import fs from 'fs';

import ExamsModel from '../models/ExamsModel';
import Users from '../models/UsersModel';
import { saveExam } from './userService';
import BioData from '../models/BioData';
import Questions from '../models/Questions';
import Faculties from '../models/Faculties';
import Departments from '../models/Departments';
import { htmlToPdf, writeExcel } from '../utils';

/** Classs for exam services */
class ExamService {
  /**
   * Gets all exams
   * @returns {array} array of exams
   */
  static async getAllExams({ page = 1, limit = 5, param = {} }) {
    const exams = await ExamsModel.find(param)
      .sort([['_id', -1]])
      .skip((page - 1) * limit)
      .limit(limit);
    return {
      exams,
      count: await ExamsModel.countDocuments({ docStatus: true, ...param })
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
    bioData = await BioData.find({ examId: exam._id })
      .populate({ path: 'user', populate: { path: 'faculty department' } })
      .exec();

    //  Create exam questions
    questions = questions.map((elem) => ({ ...elem, examId: exam._id }));
    questions = await Questions.create(questions);

    return {
      exam: exam.toObject(),
      questions,
      bioData,
      examCount: await ExamsModel.countDocuments({ docStatus: true })
    };
  }

  /**
   * Gets a single exam
   * @param {object} param -query param
   * @returns {object} exam object
   */
  static async getOneExam(param) {
    const exam = await ExamsModel.findOne(param);
    return {
      exam,
      count: await ExamsModel.countDocuments({ docStatus: true })
    };
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
   * deletes one exam
   * @param {object} param query param
   * @returns {boolean | null } null if successfull false if exam is not found
   */
  static async deleteOneExam(param) {
    const exam = await ExamsModel.findOne(param);
    if (!exam) {
      return false;
    }
    await BioData.deleteMany({ examId: exam._id });
    await Questions.deleteMany({ examId: exam._id });
    return exam.remove();
  }

  /**
   * returns the questions of an exam
   * @returns {array} array of questions
   */
  static async getOneExamQuestions({ examId, page = 1, limit = 1 }) {
    const questions = await Questions.find({ examId })
      .sort([['_id', -1]])
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
    let question = await Questions.findOne({ examId, question: data.question });
    if (question) {
      return question;
    }
    question = await Questions.create({ ...data, examId });

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
  static async getOneExamsBiodata({
    examId,
    page = 1,
    limit = 5,
    param = {},
    status = undefined
  }) {
    let query = { examId };
    if (Object.keys(param).length) {
      query = { examId, $or: [{ status }] };
      let userQuery = {};
      let $or = await Faculties.find(param.faculty);
      $or = $or.map((elem) => ({ faculty: elem._id }));
      userQuery = { $or };
      $or = await Departments.find(param.department);
      $or = $or.map((elem) => ({ department: elem._id }));
      userQuery = { $or: [...userQuery.$or, ...$or] };
      userQuery = { $or: [...userQuery.$or, ...param.student.$or] };
      $or = await Users.find(userQuery);
      $or = $or.map((elem) => ({ user: elem._id }));
      query = { ...query, $or: [...query.$or, ...$or] };
    }
    const biodata = await BioData.find(query)
      .populate({ path: 'user', populate: { path: 'faculty department' } })
      .sort([['_id', -1]])
      .skip((page - 1) * limit)
      .limit(5)
      .exec();
    return {
      biodata,
      count: await BioData.countDocuments(query),
      done: await BioData.countDocuments({ ...query, status: 2 }),
      pending: await BioData.countDocuments({ ...query, status: 0 }),
      running: await BioData.countDocuments({ ...query, status: 1 })
    };
  }

  /**
   * creates biodata for an exam
   * @returns {object} created biodata
   */
  static async createOneBiodata({ examId, data }) {
    let biodata = await ExamService.getOneSingleBiodata({
      examId,
      user: data.user
    });
    if (biodata) {
      return biodata;
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
   * @param {boolean} xlxs whether to return pdf or xlxs
   * @param {boolean} refresh whether to refresh the blob or send existing
   * @returns {object} array of results
   */
  static async getAllResults(examId, xlxs, refresh) {
    const exam = await ExamsModel.findOne({ _id: examId });
    if (!exam) return exam;
    const fileTitle = xlxs
      ? `${exam.title}-${exam.course}-${exam._id}.xlsx`
      : `${exam.title}-${exam.course}-${exam._id}.pdf`;
    if (
      fs.existsSync(path.join(__dirname, '../routes/static/', fileTitle)) &&
      !refresh
    ) {
      return fileTitle;
    }
    const biodata = await BioData.find({ examId })
      .populate({ path: 'user', populate: { path: 'faculty department' } })
      .exec();
    const results = biodata.reduce((acc, cur) => {
      cur = cur.toObject();
      const total = cur.ca + cur.exam;
      let grade = 'F';
      if (total >= 70) grade = 'A';
      if (total >= 60 && total < 70) grade = 'B';
      if (total >= 50 && total < 60) grade = 'C';
      if (total >= 40 && total < 50) grade = 'D';
      grade = exam.examType ? grade : undefined;
      if (acc[cur.user.faculty.faculty]) {
        return {
          ...acc,
          [cur.user.faculty.faculty]: {
            ...acc[cur.user.faculty.faculty],
            results: [
              ...acc[cur.user.faculty.faculty].results,
              {
                ...cur.user,
                department: cur.user.department.department,
                ca: cur.ca,
                exam: cur.exam,
                grade
              }
            ]
          }
        };
      }
      return {
        ...acc,
        [cur.user.faculty.faculty]: {
          faculty: cur.user.faculty.faculty,
          results: [
            {
              ...cur.user,
              department: cur.user.department.department,
              ca: cur.ca,
              exam: cur.exam,
              grade
            }
          ]
        }
      };
    }, {});
    const name = !xlxs
      ? await htmlToPdf(
          exam.examType
            ? path.join(__dirname, './result-pdf-templates/school-result.ejs')
            : path.join(__dirname, './result-pdf-templates/pume-result.ejs'),
          results,
          { examTitle: `${exam.title} - ${exam.course}` },
          fileTitle
        )
      : await writeExcel(results, exam.examType, fileTitle);
    return name;
  }

  /**
   * add mass score
   * @param {string} examId the exam
   * @param {number} scoreAddition score to add
   * @returns {boolean} true if successful, and throws an error if not
   */
  static async addMassScore(examId, scoreAddition) {
    const data = await BioData.find({ examId })
      .populate({ path: 'examId' })
      .exec();
    await Promise.all(
      data.map(async (biodata) => {
        if (biodata.examId.examType && biodata.exam + scoreAddition > 70) {
          biodata.exam = 70;
          return biodata.save();
        }
        if (!biodata.examId.examType && biodata.exam + scoreAddition > 50) {
          biodata.exam = 50;
          return biodata.save();
        }
        biodata.exam += scoreAddition;
        return biodata.save();
      })
    );
    return true;
  }

  /**
   * Middleware that submits for students
   * whose time got finished before they
   * could submit.
   * @returns {function} middleware function
   */
  static async ExamSubmitFunction() {
    try {
      const biodata = await BioData.find({
        status: 1
      })
        .populate({ path: 'examId' })
        .exec();
      biodata.forEach(async (doc) => {
        if (!doc.timeStart) return;
        const { timeStart } = doc;
        const { timeAllowed } = doc.examId;
        if (
          // eslint-disable-next-line operator-linebreak
          timeStart.getTime() + timeAllowed * 1000 * 60 <
          Date.now() + 1000 * 60 * 5
        ) {
          await saveExam(doc);
        }
      });
    } catch (error) {
      // could not submit an exam for some reason
      console.log('EXAM_AUTO_SUBMIT_FAILED: ', {
        message: error.message,
        stack: error.stack,
        ...error
      });
    }
    setTimeout(ExamService.ExamSubmitFunction, 1000 * 60 * 5);
  }
}

export default ExamService;
