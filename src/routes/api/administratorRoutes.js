import { Router } from 'express';

import AdminController from '../../controllers/administratorController';
import UserValidation from '../../validation/userValidation';
import AdminValidation from '../../validation/administratorValidation';
import JWT from '../../middlewares/JWTMiddleware';
import Parser from '../../middlewares/BlobConverter';

const router = Router();

router.post(
  '/image/upload',
  AdminValidation.validateBase64(),
  Parser.parseImageFile()
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
router.post(
  '/signin',
  UserValidation.validateSigninData(),
  AdminController.signInAdmin()
);

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
  )
  .delete(AdminController.deleteOneDepartment());
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
  )
  .delete(AdminController.deleteOneFaculty());
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
router.get('/exams/:exam/results', AdminController.getResults());
router
  .route('/exams/:exam')
  .get(AdminController.getOneExam())
  .put(
    AdminValidation.validateExamUpdateData(),
    AdminController.updateOneExam()
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

export default router;
