import { Router } from 'express';

import validator from '../../validation/userValidation';
import controller from '../../controllers/userController';
import JWT from '../../middlewares/JWTMiddleware';

const router = Router();

router.post('/signin', validator.validateSigninData(), controller.signInUser());
router.use(JWT.decodeToken(), controller.getFreshUser());
router
  .route('/exams')
  .get(controller.getExams())
  .post(controller.startExam())
  .delete(controller.submitExam())
  .put(validator.validateAnswers(), controller.answerExam());

export default router;
