import JWT from 'jsonwebtoken';
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
}

export default UserService;
