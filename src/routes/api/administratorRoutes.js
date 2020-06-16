import { Router } from 'express';

import AdminController from '../../controllers/administratorController';
import UserValidation from '../../validation/userValidation';
import AdminValidation from '../../validation/administratorValidation';
import JWT from '../../middlewares/JWTMiddleware';

const router = Router();

router.post(
  '/signin',
  UserValidation.validateSigninData(),
  AdminController.signInAdmin()
);

router.use(JWT.decodeToken(), AdminController.getFreshUser());
router
  .route('/pins')
  .get(AdminController.getAlPins())
  .post(AdminController.createPins());
router
  .route('/me')
  .get(AdminController.me())
  .put(AdminValidation.validateUpdateData(), AdminController.updateMe());
router
  .route('/users')
  .get(AdminController.getAllUsers())
  .post(AdminValidation.validateCreationData(), AdminController.createUsers());
router
  .route('/faculty')
  .get(AdminController.getAllFaculty())
  .post(AdminValidation.validateFaculty(), AdminController.createFaculty());
router
  .route('/faculty/:faculty/departments/:department')
  .get(AdminController.getOneDepartment())
  .put(
    AdminValidation.validateDepartmentUpdate(),
    AdminController.updateOneDeparment()
  );
router
  .route('/faculty/:faculty/departments')
  .get(AdminController.getAllDepartment())
  .post(
    AdminValidation.validateDepartment(),
    AdminController.createDepartment()
  );
router
  .route('/faculty/:faculty')
  .get(AdminController.getOneFaculty())
  .put(
    AdminValidation.validateFacultyUpdate(),
    AdminController.updateOneFaculty()
  );
router
  .route('/exams')
  .get(AdminController.getAllExams())
  .post(AdminValidation.validateExamCreation(), AdminController.createExam());
router
  .route('/exams/:exam')
  .get(AdminController.getOneExam())
  .put(
    AdminValidation.validateExamUpdateData(),
    AdminController.updateOneExam()
  );

export default router;
