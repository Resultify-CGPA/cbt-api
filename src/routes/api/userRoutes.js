import { Router } from 'express';

import validator from '../../validation/userValidation';
import controller from '../../controllers/userController';

const router = Router();

router.post('/signin', validator.validateSigninData(), controller.signInUser());

export default router;
