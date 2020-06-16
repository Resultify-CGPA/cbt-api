/* eslint-disable no-prototype-builtins */
/* eslint-disable operator-linebreak */
/* eslint-disable no-underscore-dangle */
import JWT from 'jsonwebtoken';
import { parseInt } from 'lodash';

export const __signToken = (data) =>
  // eslint-disable-next-line implicit-arrow-linebreak
  JWT.sign(
    {
      exp:
        // eslint-disable-next-line operator-linebreak
        Math.floor(Date.now() / 1000) +
        24 * 60 * 60 * parseInt(process.env.JWTExpireTime || 1),
      // eslint-disable-next-line no-underscore-dangle
      data
    },
    process.env.JWTSecret || 'SomeJuicySecretSetOnEnv'
  );

/** Class of methods that are common to services */
class CommonMethods {
  /**
   * Signs in user
   * @param {object} param - object to find user by
   * @param {object} Model - DB model to find user with
   * @returns {object} - signed user
   */
  static async SignInUser(param, Model) {
    try {
      const user = await Model.findOne({
        $or: param.$or
      });
      if (!user || !(await user.authenticate(param.password))) {
        return null;
      }
      if (user.hasOwnProperty('status') && !user.status) {
        const e = new Error('this account has been blocked');
        e.status = 403;
        e.name = 'LOGIN_ERROR';
        throw e;
      }
      const data =
        Model.collection.collectionName === 'administrators'
          ? { password: user.password }
          : { _id: user._id };
      const accessToken = __signToken(data);
      return { ...user.toJson(), accessToken };
    } catch (error) {
      throw error;
    }
  }
}

export default CommonMethods;
