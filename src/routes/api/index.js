import { Router } from 'express';

import userRoutes from './userRoutes';
import administratorRoutes from './administratorRoutes';
// import ExamService from '../../services/examService';
// import PinsService from '../../services/pinsService';

const router = Router();

// router.use(ExamService.ExamSubmitMiddleware());
// router.use(PinsService.pinsDeletionMiddleware());
router.use('/user', userRoutes);
router.use('/administrator', administratorRoutes);

export default router;
