import { Router } from 'express';

import AdminController from '../../controllers/administratorController';
import UserValidation from '../../validation/userValidation';
import AdminValidation from '../../validation/administratorValidation';
import JWT from '../../middlewares/JWTMiddleware';
import Parser from '../../middlewares/BlobConverter';

const router = Router();

router.post(
  '/signin',
  UserValidation.validateSigninData(),
  AdminController.signInAdmin()
);

router.use(JWT.decodeToken(), AdminController.getFreshUser());
router.post(
  '/spreadsheet/examquestion',
  AdminValidation.validateBase64(),
  Parser.parseExamQuestion()
);
router.post(
  '/spreadsheet/biodata',
  AdminValidation.validateBase64(),
  Parser.parseBioData()
);
router.post(
  '/image/upload',
  AdminValidation.validateBase64(),
  Parser.parseImageFile()
);
router
  .route('/')
  .get(AdminController.getAllAdmins())
  .post(
    AdminValidation.validateAdminCreationData(),
    AdminController.createNewAdmin()
  );
router
  .route('/:administrator')
  .get(AdminController.getOneAdmin())
  .delete(AdminController.deleteOneAdmin());
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
  .route('/users/:user')
  .get(AdminController.getSingleUser())
  .put(
    AdminValidation.validateUserUpdateData(),
    AdminController.updateSingleUser()
  )
  .post(
    AdminValidation.validateTimeIncrementData(),
    AdminController.addStudentTime()
  );
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
  .route('/exams/:exam/biodatas/:bioDataID')
  .get(AdminController.getOneBioData())
  .delete(AdminController.deleteOneBiodata())
  .put(
    AdminValidation.validateBiodataUpdateData(),
    AdminController.updateOneBioData()
  );
router
  .route('/exams/:exam/biodatas')
  .get(AdminController.getOneExamsBiodata())
  .post(
    AdminValidation.validateBiodataCreationData(),
    AdminController.createBioData()
  );
router
  .route('/exams/:exam/questions/:question')
  .get(AdminController.getOneQuestion())
  .put(
    AdminValidation.validateQuestionUpdateData(),
    AdminController.updateOneQuestion()
  )
  .delete(AdminController.deleteOneQuestion());
router
  .route('/exams/:exam/questions')
  .get(AdminController.getOneExamsQuestions())
  .post(
    AdminValidation.validateQuestionCreationData(),
    AdminController.createsOneExamQuestion()
  );
router
  .route('/exams/:exam')
  .get(AdminController.getOneExam())
  .put(
    AdminValidation.validateExamUpdateData(),
    AdminController.updateOneExam()
  );

export default router;
