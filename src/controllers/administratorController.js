/* eslint-disable implicit-arrow-linebreak */
/* eslint-disable no-prototype-builtins */
/* eslint-disable no-underscore-dangle */
import _ from 'lodash';

import Response from '../utils/response';
import AdminService from '../services/administratorService';
import UserService from '../services/userService';
import ExamService from '../services/examService';
import PinsService from '../services/pinsService';
import Departments from '../models/Departments';

const __validateBioData = (bioData) =>
  bioData.reduce(
    async (acc, cur) => {
      acc = await acc;
      let user = await UserService.getOneUser({ matric: cur.matric });
      if (!user) {
        const department = await Departments.findOne({
          department: cur.department
        });
        if (!department || !cur.name) {
          return {
            ...acc,
            errors: [
              ...acc.errors,
              `${cur.matric} is not registered and we need a valid name and department to create a student account`
            ]
          };
        }
        user = await UserService.createUsers({
          matric: cur.matric,
          faculty: department.faculty,
          department: department._id,
          name: cur.name
        });
      }
      return {
        ...acc,
        bioData: [...acc.bioData, { ca: cur.ca, user: user._id }]
      };
    },
    {
      bioData: [],
      errors: []
    }
  );

const __validateExamQuestions = (exam) =>
  exam.questions.reduce(
    async (accc, curr) => {
      curr.questionFor = curr.questionFor || [];
      const it = await curr.questionFor.reduce(
        async (acc, cur) => {
          cur = {
            ...cur,
            faculty: cur.faculty.toLowerCase(),
            department: cur.department.toLowerCase()
          };
          const { faculty, department } = cur;
          const facultyCheck = await AdminService.getOneFaculty({
            faculty
          });
          if (!facultyCheck) {
            return {
              ...acc,
              errors: [...(await acc.errors), `${faculty} is not a faculty`]
            };
          }
          const departmentCheck = await AdminService.getOneDepartment({
            department,
            faculty: facultyCheck._id
          });
          if (!departmentCheck) {
            return {
              ...acc,
              errors: [
                ...(await acc.errors),
                `${department} is not a department in ${faculty}`
              ]
            };
          }
          return {
            ...acc,
            questionFor: [
              ...(await acc.questionFor),
              {
                ...cur,
                faculty: facultyCheck._id,
                department: departmentCheck._id
              }
            ]
          };
        },
        { questionFor: [], errors: [] }
      );
      curr.questionFor = it.questionFor;
      return {
        questions: [...(await accc.questions), curr],
        errors: [...(await accc.errors), ...it.errors]
      };
    },
    { questions: [], errors: [] }
  );

/** Class for Administrator controller */
class AdminController {
  /**
   * Signin middleware
   * @returns {object} - custom response
   */
  static signInAdmin() {
    return async (req, res, next) => {
      try {
        const { username } = req.body;
        const $or = [{ username }, { email: username }];
        const user = await AdminService.signInAdmin({
          $or,
          password: req.body.password
        });
        if (!user) {
          return Response.authenticationError(res, 'invalid credentials');
        }
        return Response.customResponse(res, 200, 'Signin successful', user);
      } catch (error) {
        return next(error);
      }
    };
  }

  /**
   * Gets user from token
   * @returns {nothing} - calls next middleware
   */
  static getFreshUser() {
    return async (req, res, next) => {
      try {
        const { password, _id } = req.user.data;
        const user = await AdminService.getOneUser({ password, _id });
        if (!user) {
          return Response.authorizationError(res, 'unauthorized');
        }
        req.user = user;
        return next();
      } catch (error) {
        return next(error);
      }
    };
  }

  /**
   * Gets user
   * @returns {Response} custom response
   */
  static me() {
    return (req, res) =>
      // eslint-disable-next-line implicit-arrow-linebreak
      Response.customResponse(res, 200, 'Your account:', req.user.toJson());
  }

  /**
   * updates user
   * @returns {Response} custom response
   */
  static updateMe() {
    return async (req, res, next) => {
      try {
        const updatedUser = await AdminService.updateOneUser(
          req.user,
          req.body
        );
        Response.customResponse(res, 200, 'Account updated', updatedUser);
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Gets all users
   * @returns {Response} custom response
   */
  static getAllUsers() {
    return async (req, res, next) => {
      try {
        const users = await UserService.getAllUsers();
        return Response.customResponse(res, 200, 'All users:', users);
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Creates users
   * @returns {Response} custom response
   */
  static createUsers() {
    return async (req, res, next) => {
      try {
        const { users } = req.body;
        const checkMatric = await users.reduce(async (acc, cur) => {
          cur.matric = cur.matric.toLowerCase();
          const { matric } = cur;
          const user = await UserService.getOneUser({
            matric: matric.toLowerCase()
          });
          if (user) {
            return [...(await acc), matric];
          }
          return acc;
        }, []);
        if (checkMatric.length > 0) {
          return Response.customResponse(
            res,
            400,
            'a user already exists for the following number(s):',
            checkMatric
          );
        }
        const checkFaculties = await users.reduce(
          async (acc, cur) => {
            cur = {
              ...cur,
              faculty: cur.faculty.toLowerCase(),
              department: cur.department.toLowerCase()
            };
            const { faculty, department } = cur;
            const facultyCheck = await AdminService.getOneFaculty({ faculty });
            if (!facultyCheck) {
              return {
                ...acc,
                errors: [...(await acc.errors), `${faculty} is not a faculty`]
              };
            }
            const departmentCheck = await AdminService.getOneDepartment({
              department,
              faculty: facultyCheck._id
            });
            if (!departmentCheck) {
              return {
                ...acc,
                errors: [
                  ...(await acc.errors),
                  `${department} is not a department in ${faculty}`
                ]
              };
            }
            return {
              ...acc,
              users: [
                ...(await acc.users),
                {
                  ...cur,
                  faculty: facultyCheck._id,
                  department: departmentCheck._id
                }
              ]
            };
          },
          { users: [], errors: [] }
        );
        if (checkFaculties.errors.length > 0) {
          return Response.customResponse(
            res,
            400,
            'the following faculties and/or departments have issues:',
            checkFaculties.errors
          );
        }
        const created = await UserService.createUsers(checkFaculties.users);
        return Response.customResponse(res, 200, 'created users:', created);
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Creates a faculty
   * @returns {function} middleware function
   */
  static createFaculty() {
    return async (req, res, next) => {
      try {
        const { faculty } = req.body;
        const query = { faculty: faculty.toLowerCase() };

        //  Check if faculty exits
        const facultyCheck = await AdminService.getOneFaculty(query);
        if (facultyCheck) {
          return Response.customResponse(
            res,
            400,
            'duplicate faculty not allowed',
            null
          );
        }

        const data = await AdminService.createFaculty(query);
        return Response.customResponse(res, 200, 'faculty created:', data);
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Creates a department
   * @returns {function} middleware function
   */
  static createDepartment() {
    return async (req, res, next) => {
      try {
        const { faculty: _id } = req.params;

        //  Check if faculty exists
        const facultyCheck = await AdminService.getOneFaculty({ _id });
        if (!facultyCheck) {
          return Response.customResponse(
            res,
            404,
            'no faculty with that ID',
            null
          );
        }

        const { department } = req.body;
        const query = {
          department: department.toLowerCase(),
          faculty: { _id }
        };

        //  Check if department exists
        const departmentCheck = await AdminService.getOneDepartment(query);
        if (departmentCheck) {
          return Response.customResponse(
            res,
            400,
            'duplicate departments not allowed'
          );
        }

        const data = await AdminService.createDepartment({
          ...query,
          faculty: _id
        });
        return Response.customResponse(res, 200, 'department created:', data);
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Gets all faculties
   * @returns {function} middleware function
   */
  static getAllFaculty() {
    return async (req, res, next) => {
      try {
        const faculties = await AdminService.getAllFaculties();
        return Response.customResponse(res, 200, 'faculties:', faculties);
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Gets all departments
   * @returns {function} middleware function
   */
  static getAllDepartment() {
    return async (req, res, next) => {
      try {
        const { faculty } = req.params;
        const data = await AdminService.getAllDepartments({ faculty });
        return Response.customResponse(res, 200, 'departments:', data);
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Gets faculty from ID
   * @returns {fucntion} middleware function
   */
  static getOneFaculty() {
    return async (req, res, next) => {
      try {
        const { faculty: _id } = req.params;
        const data = await AdminService.getOneFaculty({ _id });
        if (!data) {
          return Response.notFoundError(res, 'faculty with ID not found');
        }
        return Response.customResponse(res, 200, 'faculty', data);
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Gets department from ID
   * @returns { fucntion } middleware function
   */
  static getOneDepartment() {
    return async (req, res, next) => {
      try {
        const { faculty, department } = req.params;
        const data = await AdminService.getOneDepartment({
          _id: department,
          faculty
        });
        if (!data) {
          return Response.notFoundError(
            res,
            'no department with ID on faculty'
          );
        }
        return Response.customResponse(res, 200, 'department:', data);
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Updates a faculty
   * @returns {function} middleware function
   */
  static updateOneFaculty() {
    return async (req, res, next) => {
      try {
        const { faculty: _id } = req.params;

        //  Check if another faculty exists with update data
        const check = await AdminService.getOneFaculty(req.body);
        if (check) {
          return Response.badRequestError(
            res,
            'a faculty exits with the update'
          );
        }
        const update = await AdminService.updateOneFaculty({ _id }, req.body);
        return Response.customResponse(res, 200, 'updated faculty', update);
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Updates a department
   * @returns {function}  middlewar function
   */
  static updateOneDeparment() {
    return async (req, res, next) => {
      try {
        const { faculty, department: _id } = req.params;

        //  Check duplicate data due to update
        const check = await AdminService.getOneDepartment({
          ...req.body,
          faculty
        });
        if (check) {
          return Response.badRequestError(
            res,
            'a department exists on faculty with thesame data'
          );
        }
        const update = await AdminService.updateOneDepartment(
          { _id },
          req.body
        );
        return Response.customResponse(res, 200, 'updated department', update);
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Gets all exams
   * @returns {function} middleware function
   */
  static getAllExams() {
    return async (req, res, next) => {
      try {
        const exams = await ExamService.getAllExams();
        return Response.customResponse(res, 200, 'exams:', exams);
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Creates a new exam
   * @returns {function} middleware function
   */
  static createExam() {
    return async (req, res, next) => {
      try {
        const exam = req.body;
        exam.questions = exam.questions || [];
        exam.bioData = exam.bioData || [];
        const { bioData } = exam;
        let check = await __validateExamQuestions(exam);
        if (check.errors.length > 0) {
          return Response.customResponse(
            res,
            400,
            'fix the following errors',
            check.errors
          );
        }
        check = await __validateBioData(bioData);
        if (check.errors.length > 0) {
          return Response.customResponse(
            res,
            400,
            'fix the following',
            check.errors
          );
        }

        exam.bioData = check.bioData;
        const created = await ExamService.CreateExam(exam);
        return Response.customResponse(res, 200, 'created exam:', created);
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Gets one exam
   * @returns {function} middleware function
   */
  static getOneExam() {
    return async (req, res, next) => {
      try {
        const { exam: _id } = req.params;
        const exam = await ExamService.getOneExam({ _id });
        if (!exam) {
          return Response.notFoundError(res, 'no exam exits with that ID');
        }
        return Response.customResponse(res, 200, 'exam:', exam);
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * update an exam
   * @returns {funciton} middleware function
   */
  static updateOneExam() {
    return async (req, res, next) => {
      try {
        const { exam: _id } = req.params;
        const updateExam = req.body;
        if (updateExam.status && updateExam.status === 1) {
          const validate = await ExamService.getOneExam({ status: 1 });
          if (validate) {
            return Response.badRequestError(
              res,
              'end active exam to make this one active'
            );
          }
        }
        const updated = await ExamService.updateOneExam({ _id }, req.body);
        return Response.customResponse(res, 200, 'updated exam:', updated);
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * generates pins
   * @returns {function} middlewar function
   */
  static createPins() {
    return async (req, res, next) => {
      try {
        const pins = await PinsService.generatePins(req.body.count || 50);
        return Response.customResponse(res, 200, 'the pins:', pins);
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * gets all pins
   * @returns {function} middleware function
   */
  static getAlPins() {
    return async (req, res, next) => {
      try {
        const pins = await PinsService.getAllPins();
        return Response.customResponse(res, 200, 'the pins:', pins);
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Gets one exam's biodata
   * @returns {function} middleware function
   */
  static getOneExamsBiodata() {
    return async (req, res, next) => {
      try {
        const { exam: _id } = req.params;
        const exam = await ExamService.getOneExam({ _id });
        if (!exam) {
          return Response.notFoundError(res, 'no exam exits with that ID');
        }
        return Response.customResponse(res, 200, 'biodata:', exam.bioData);
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * adds new biodata
   * @returns {function} middleware function
   */
  static createBioData() {
    return async (req, res, next) => {
      try {
        const { exam: _id } = req.params;
        let exam = await ExamService.getOneExam({ _id });
        if (!exam) {
          return Response.notFoundError(res, 'no exam exits with that ID');
        }
        const check = await __validateBioData([req.body]);
        if (check.errors.length > 0) {
          return Response.badRequestError(res, check.errors[0]);
        }
        const biodata = {
          ...exam.bioData.reduce(
            (acc, cur) => ({
              ...acc,
              [cur.user._id]: {
                user: cur.user._id,
                ca: cur.ca,
                exam: cur.exam,
                submitted: cur.submitted
              }
            }),
            {}
          ),
          ...{ [check.bioData[0].user]: check.bioData[0] }
        };
        exam.bioData = Object.values(biodata);
        exam = await exam.save();
        exam = await ExamService.getOneExam({ _id });
        return Response.customResponse(res, 200, 'biodata:', exam.bioData);
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * finds one biodata from array
   * @param {bioData} bioData array of biodatas
   * @param {bioDataID} bioDataID biodata ID
   * @returns {object} bioData found
   */
  static getOneBioDataPrivate(bioData, bioDataID) {
    return bioData.find((elem) => elem._id.toString() === bioDataID);
  }

  /**
   * Gets one user biodata
   * @returns {function} middleware
   */
  static getOneBioData() {
    return async (req, res, next) => {
      try {
        const { exam: _id, bioDataID } = req.params;
        const exam = await ExamService.getOneExam({ _id });
        if (!exam) {
          return Response.notFoundError(res, 'no exam exits with that ID');
        }

        return Response.customResponse(
          res,
          200,
          'biodata:',
          AdminController.getOneBioDataPrivate(exam.bioData, bioDataID)
        );
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * deletes on biodata
   * @returns {function} middleware
   */
  static deleteOneBiodata() {
    return async (req, res, next) => {
      try {
        const { exam: _id, bioDataID } = req.params;
        const exam = await ExamService.getOneExam({ _id });
        if (!exam) {
          return Response.notFoundError(res, 'no exam exits with that ID');
        }
        let ind;
        exam.bioData.forEach(async (elem, i) => {
          if (elem._id.toString() === bioDataID) {
            ind = i;
          }
        });
        if (typeof ind === 'undefined') {
          return Response.badRequestError(res, 'no biodata with that ID');
        }
        exam.bioData.splice(ind, 1);
        await exam.save();
        return Response.customResponse(res, 200, 'deleted:', null);
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * updates on user biodata
   * @returns {function} middleware
   */
  static updateOneBioData() {
    return async (req, res, next) => {
      try {
        const { exam: _id, bioDataID } = req.params;
        let exam = await ExamService.getOneExam({ _id });
        if (!exam) {
          return Response.notFoundError(res, 'no exam exits with that ID');
        }
        let ind;
        exam.bioData.forEach(async (elem, i) => {
          if (elem._id.toString() === bioDataID) {
            ind = i;
          }
        });
        if (typeof ind === 'undefined') {
          return Response.badRequestError(res, 'no biodata with that ID');
        }
        _.merge(exam.bioData[ind], req.body);
        exam = await exam.save();
        exam = await ExamService.getOneExam({ _id });
        return Response.customResponse(res, 200, 'updated', exam.bioData[ind]);
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * gets one sigle exam question
   * @returns {function} middleware function
   */
  static getOneExamsQuestions() {
    return async (req, res, next) => {
      try {
        const { exam: examID } = req.params;
        const questions = await ExamService.getOneExamQuestions(examID);
        if (!questions) {
          return Response.notFoundError(res, 'no exam with that ID');
        }
        return Response.customResponse(res, 200, 'questions', questions);
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * creates one exam question
   * @returns {function} middleware function
   */
  static createsOneExamQuestion() {
    return async (req, res, next) => {
      try {
        let question = req.body;
        const check = await __validateExamQuestions({ questions: [question] });
        if (check.errors.length > 0) {
          return Response.badRequestError(res, check.errors[0]);
        }
        [question] = check.questions;
        question = await ExamService.createOneExamQuestion(
          req.params.exam,
          question
        );
        if (!question) {
          return Response.notFoundError(res, 'no exam with that ID');
        }
        return Response.customResponse(res, 200, 'question', question);
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * gets one question
   * @returns {function} middleware function
   */
  static getOneQuestion() {
    return async (req, res, next) => {
      try {
        const { exam, question } = req.params;
        const quest = await ExamService.getOneExamQuestion(exam, question);
        if (quest === 0) {
          return Response.notFoundError(res, 'no exam with that ID here');
        }
        if (quest === 1) {
          return Response.notFoundError(res, 'no question with that ID');
        }
        return Response.customResponse(res, 200, 'question', quest);
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * updates one questionn
   * @returns {function} middleware function
   */
  static updateOneQuestion() {
    return async (req, res, next) => {
      try {
        const { exam: examID, question: questionID } = req.params;
        const check = await __validateExamQuestions({ questions: [req.body] });
        if (check.errors.length > 0) {
          return Response.badRequestError(res, check.errors[0]);
        }
        const question = await ExamService.updateOneExamQuestion(
          {
            examID,
            questionID
          },
          check.questions[0]
        );
        if (question === null) {
          return Response.notFoundError(res, 'no exam with that ID');
        }
        if (!question) {
          return Response.notFoundError(res, 'no question with that ID');
        }
        return Response.customResponse(res, 200, 'updated', question);
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * deletes one question
   * @returns {function} middleware function
   */
  static deleteOneQuestion() {
    return async (req, res, next) => {
      try {
        const { exam, question } = req.params;
        const deleted = await ExamService.deleteOneExamQuestion(exam, question);
        if (deleted === 0) {
          return Response.notFoundError(res, 'no exam with that ID');
        }
        if (deleted === 1) {
          return Response.notFoundError(res, 'no question with that ID');
        }
        return Response.customResponse(res, 200, 'deleted', null);
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * gets one user
   * @returns {function} middleware function
   */
  static getSingleUser() {
    return async (req, res, next) => {
      try {
        let { user } = req.param;
        user = await UserService.getOneUser({ _id: user });
        if (!user) {
          return Response.notFoundError(res, 'no student with that id');
        }
        return Response.customResponse(res, 200, 'student:', user);
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * update single user
   * @returns {function} middleware
   */
  static updateSingleUser() {
    return async (req, res, next) => {
      try {
        const { user } = req.param;
        const update = req.body;
        const updated = await UserService.updateOneUser({ _id: user }, update);
        if (updated === 0) {
          return Response.badRequestError(
            res,
            `${user.faculty} is not a valid faculty`
          );
        }
        if (updated === 1) {
          return Response.badRequestError(
            res,
            `${user.department} is not a valid department`
          );
        }
        if (updated === null) {
          return Response.notFoundError(res, 'no user with that ID');
        }
        return Response.customResponse(res, 200, 'updated', updated);
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * adds to student exam time
   * @returns {function} middleware function
   */
  static addStudentTime() {
    return async (req, res, next) => {
      try {
        const { user: _id } = req.params;
        const { timeIncrease } = req.body;
        const increase = await UserService.increaseStudentTime(
          { _id },
          timeIncrease
        );
        if (increase === null) {
          return Response.notFoundError(res, 'no user with that ID');
        }
        if (increase === 0) {
          return Response.notFoundError(
            res,
            'user has either finished or has not started exams'
          );
        }
        return Response.customResponse(res, 200, 'updated', increase);
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * gets all admins
   * @returns {function} middleware function
   */
  static getAllAdmins() {
    return async (req, res, next) => {
      if (!req.user.isRootUser) {
        return Response.customResponse(
          res,
          403,
          "you can't access this route",
          null
        );
      }
      try {
        const data = await AdminService.getAllAdmins();
        return Response.customResponse(res, 200, 'administrators', data);
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * creates new admin
   * @returns {function} middleware function
   */
  static createNewAdmin() {
    return async (req, res, next) => {
      if (!req.user.isRootUser) {
        return Response.customResponse(
          res,
          403,
          "you can't access this route",
          null
        );
      }
      try {
        const newUser = await AdminService.createNewAdmin(req.body);
        return Response.customResponse(res, 200, 'admin', newUser);
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * gets single admin
   * @returns {function} middleware function
   */
  static getOneAdmin() {
    return async (req, res, next) => {
      if (!req.user.isRootUser) {
        return Response.customResponse(
          res,
          403,
          "you can't access this route",
          null
        );
      }
      try {
        const { administrator: _id } = req.params;
        const data = await AdminService.getOneUser({ _id });
        if (!data) {
          return Response.notFoundError(res, 'no administrator with that ID');
        }
        return Response.customResponse(res, 200, 'admin', data);
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * deletes one user
   * @returns {function} middleware function
   */
  static deleteOneAdmin() {
    return async (req, res, next) => {
      if (!req.user.isRootUser) {
        return Response.customResponse(
          res,
          403,
          "you can't access this route",
          null
        );
      }
      try {
        const { administrator: _id } = req.params;
        const data = await AdminService.getOneUser({ _id });
        if (!data) {
          return Response.notFoundError(res, 'no administrator with that ID');
        }
        await data.remove();
        return Response.customResponse(res, 200, 'deleted', null);
      } catch (error) {
        next(error);
      }
    };
  }
}

export default AdminController;
