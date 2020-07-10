import { Router } from 'express';

import validator from '../../validation/userValidation';
import controller from '../../controllers/userController';
import JWT from '../../middlewares/JWTMiddleware';

const router = Router();

router.use((req, res, next) => {
  /**
   * trims and coverts to lower case
   * @param {any} param param to work with
   * @returns {any} the return depends on the input
   */
  function trimAndParam(param) {
    if (typeof param === 'string') {
      return param.toLowerCase().trim();
    }
    if (typeof param === 'object') {
      try {
        return Object.keys(param).reduce((acc, cur) => {
          return Array.isArray(param)
            ? [...acc, trimAndParam(param[cur])]
            : { ...acc, [cur]: trimAndParam(param[cur]) };
        }, (Array.isArray(param) && []) || {});
      } catch (error) {
        return param;
      }
    }
    return param;
  }
  req.body = trimAndParam(req.body);
  next();
});
router.post('/signin', validator.validateSigninData(), controller.signInUser());
router.use(JWT.decodeToken(), controller.getFreshUser());
router.get(
  '/me',
  (req, res) =>
    // eslint-disable-next-line implicit-arrow-linebreak
    res
      .status(200)
      .json({ message: 'user', status: 200, data: req.user.toJson() })
  // eslint-disable-next-line function-paren-newline
);
router
  .route('/exams')
  .get(controller.getExams())
  .post(controller.startExam())
  .delete(controller.submitExam())
  .put(validator.validateAnswers(), controller.answerExam());

export default router;
