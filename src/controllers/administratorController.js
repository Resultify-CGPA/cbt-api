/* eslint-disable implicit-arrow-linebreak */
/* eslint-disable no-prototype-builtins */
/* eslint-disable no-underscore-dangle */
import Response from '../utils/response';
import AdminService from '../services/administratorService';
import UserService from '../services/userService';
import ExamService from '../services/examService';
import PinsService from '../services/pinsService';

const __validateBioData = (bioData) =>
  bioData.reduce(
    async (acc, cur) => {
      acc = await acc;
      const user = await UserService.getOneUser({ matric: cur.matric });
      if (!user) {
        return {
          ...acc,
          errors: [...acc.errors, `${cur.matric} is not registered`]
        };
      }
      return { ...acc, bioData: [...acc.bioData, { user: user._id }] };
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
        const { password } = req.user.data;
        const user = await AdminService.getOneUser({ password });
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
        let check = await __validateBioData(updateExam.bioData || []);
        if (check.errors.length > 0) {
          return Response.customResponse(
            res,
            400,
            'fix the following:',
            check.errors
          );
        }
        updateExam.bioData = check.bioData;
        if (updateExam.questions) {
          check = await __validateExamQuestions(updateExam.questions);
          if (check.errors.length > 0) {
            return Response.customResponse(
              res,
              400,
              'fix the following:',
              check.errors
            );
          }
          updateExam.questions = check.questions;
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
}

export default AdminController;
