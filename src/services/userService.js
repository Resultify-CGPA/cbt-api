/* eslint-disable operator-linebreak */
/* eslint-disable no-underscore-dangle */
import JWT from 'jsonwebtoken';
import _ from 'lodash';

import User from '../models/UsersModel';

/** Class that handles user service */
class UserService {
  /**
   * Signs in user
   * @param {object} param - object to find user by
   * @returns {object} - signed user
   */
  static async signInUser(param) {
    try {
      const user = await User.findOne({
        $or: param.$or
      });
      if (!user || !(await user.authenticate(param.password))) {
        return null;
      }
      if (!user.status) {
        const e = new Error('this account has been blocked');
        e.status = 403;
        e.name = 'LOGIN_ERROR';
        throw e;
      }
      const accessToken = JWT.sign(
        {
          exp:
            // eslint-disable-next-line operator-linebreak
            Math.floor(Date.now() / 1000) +
            24 * 60 * 60(process.env.JWTExpireTime || 1),
          // eslint-disable-next-line no-underscore-dangle
          data: { _id: user._id }
        },
        process.env.JWTSecret || 'SomeJuicySecret'
      );
      return { ...user.toJson(), accessToken };
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
            cur.exam_id.status &&
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
   * @param {string} _id - userId
   * @returns {object} - user object
   */
  static async getOneUser(_id) {
    try {
      const user = await User.findOne({
        _id,
        status: true
      });
      return user;
    } catch (error) {
      throw error;
    }
  }
}

export default UserService;
