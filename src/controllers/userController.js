import Response from '../utils/response';
import UserService from '../services/userService';

/** Class for user controller */
class UserController {
  /**
   * Signin middleware
   * @returns {object} - custom response
   */
  static signInUser() {
    return async (req, res, next) => {
      try {
        const { username: matric, password } = req.body;
        const user = await UserService.signInUser({
          matric,
          password
        });
        if (!user) {
          return Response.authenticationError(res, 'invalid credentials');
        }
        return Response.customResponse(res, 200, 'Signin successful', user);
      } catch (error) {
        return next(error);
      }
    };
  }

  /**
   * Gets user from token
   * @returns {nothing} - calls next middleware
   */
  static getFreshUser() {
    return async (req, res, next) => {
      try {
        const { _id } = req.user.data;
        const user = await UserService.getOneUser({ status: true, _id });
        if (!user) {
          return Response.authorizationError(res, 'unauthorized');
        }
        req.user = user;
        return next();
      } catch (error) {
        return next(error);
      }
    };
  }

  /**
   * Gets user exam
   * @returns {customResponse} - returns an exam
   */
  static getExams() {
    return async (req, res, next) => {
      try {
        const exam = await UserService.currentExam(req.user);
        if (!exam) {
          return Response.notFoundError(
            res,
            'You currently have no active exams'
          );
        }
        return Response.customResponse(res, 200, 'Your exam:', exam);
      } catch (error) {
        return next(error);
      }
    };
  }

  /**
   * Starts an Exam
   * @returns {customResponse} - returns started exam
   */
  static startExam() {
    return async (req, res, next) => {
      try {
        const exam = await UserService.currentExam(req.user);
        if (!exam) {
          return Response.notFoundError(
            res,
            'You currently have no active exams'
          );
        }
        const startedExam = await UserService.startExam(req.user, exam);
        return Response.customResponse(res, 200, 'Started exam:', startedExam);
      } catch (error) {
        return next(error);
      }
    };
  }

  /**
   * Submits an Exam
   * @returns {customResponse} - returns confirmation
   */
  static submitExam() {
    return async (req, res, next) => {
      try {
        const exam = await UserService.currentExam(req.user);
        if (!exam || !exam.inProgress) {
          return Response.notFoundError(
            res,
            'You currently have no active exams'
          );
        }
        return (
          // eslint-disable-next-line operator-linebreak
          ((await UserService.submitExam(req.user)) &&
            // eslint-disable-next-line operator-linebreak
            Response.customResponse(res, 200, 'Exam submitted', {})) ||
          Response.customResponse(
            res,
            500,
            'An unexpected error has occurred',
            {}
          )
        );
      } catch (error) {
        return next(error);
      }
    };
  }

  /**
   * Answers an Exam
   * @returns {customResponse} - returns confirmation
   */
  static answerExam() {
    return async (req, res, next) => {
      try {
        const exam = await UserService.currentExam(req.user);
        if (!exam || !exam.inProgress) {
          return Response.notFoundError(
            res,
            'You currently have no active exams'
          );
        }
        const answered = await UserService.answerExam(
          req.user,
          req.body.answers
        );
        if (!answered) {
          return Response.notFoundError(res, 'Exam submitted');
        }
        return Response.customResponse(res, 200, 'Answers added', answered);
      } catch (error) {
        return next(error);
      }
    };
  }
}

export default UserController;
