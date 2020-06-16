import _ from 'lodash';

import ExamsModel from '../models/ExamsModel';

/** Classs for exam services */
class ExamService {
  /**
   * Gets all exams
   * @returns {array} array of exams
   */
  static async getAllExams() {
    try {
      const exams = await ExamsModel.find()
        .populate({
          path:
            'bioData.user questions.questionFor.faculty questions.questionFor.department'
        })
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
      const exam = await ExamsModel.create(data);
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
          path:
            'bioData.user questions.questionFor.faculty questions.questionFor.department',
          select: 'name matric faculty department'
        })
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
}

export default ExamService;
