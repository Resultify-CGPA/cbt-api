import { Router } from 'express';

import userRoutes from './userRoutes';
import administratorRoutes from './administratorRoutes';
import ExamService from '../../services/examService';

const router = Router();

router.use(ExamService.ExamSubmitMiddleware());
router.use('/user', userRoutes);
router.use('/administrator', administratorRoutes);

export default router;
