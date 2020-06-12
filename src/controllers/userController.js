import userService from '../services/userService';
import Response from '../utils/response';

/** Class for user controller */
class UserController {
  /**
   * Signin middleware
   * @returns {object} - custom response
   */
  static signInUser() {
    return async (req, res, next) => {
      try {
        const { username } = req.body;
        const $or = [{ username }, { email: username }, { matric: username }];
        const user = await userService.signInUser({
          $or,
          password: req.body.password
        });
        if (!user) {
          return Response.authenticationError(res, 'invalid credentials');
        }
        return Response.customResponse(res, 'Signin successful', user);
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
        const { _id: id } = req.user.data;
        const user = await userService.getOneUser(id);
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
        const exam = await userService.currentExam(req.user);
        if (!exam) {
          return Response.notFoundError(
            res,
            'You currently have no active exams'
          );
        }
        return Response.customResponse(res, 'Your exam:', exam);
      } catch (error) {
        return next(error);
      }
    };
  }
}

export default UserController;
