import { Router } from 'express';

import userRoutes from './userRoutes';
import administratorRoutes from './administratorRoutes';

const router = Router();

router.use('/user', userRoutes);
router.use('/administrator', administratorRoutes);

export default router;
