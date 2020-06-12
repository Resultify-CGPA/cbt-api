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
}

export default UserController;
