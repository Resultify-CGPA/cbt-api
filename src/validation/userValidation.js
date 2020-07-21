import Joi from '@hapi/joi';

import validator from '../utils/validator';
import Format from './index';

/** Validates User related data */
class UserValidation {
  /**
   * Validates signin data
   * @returns {function} - middleware function
   */
  static validateSigninData() {
    return (req, res, next) => {
      const schema = Joi.object().keys({
        username: Format.username,
        password: Format.password
      });
      return validator(schema, req.body, res, next);
    };
  }

  /**
   * Validates answers
   * @returns {function} - middleware function
   */
  static validateAnswers() {
    return (req, res, next) => {
      const schema = Joi.object().keys({ answers: Joi.object().required() });
      return validator(schema, req.body, res, next);
    };
  }
}

export default UserValidation;
