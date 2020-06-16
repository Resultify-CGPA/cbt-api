import Joi from '@hapi/joi';

import validator from '../utils/validator';
// import Format from './index';

/** Validates Admin related data */
class AdminValidation {
  /**
   * Validates account update data
   * @returns {function} middlware function
   */
  static validateUpdateData() {
    return (req, res, next) => {
      const scheme = Joi.object().keys({
        username: Joi.string().min(4),
        password: Joi.string().min(8),
        email: Joi.string()
          .email({
            minDomainSegments: 2,
            tlds: { allow: true }
          })
          .trim(),
        name: Joi.string().min(4)
      });
      return validator(scheme, req.body, res, next);
    };
  }

  /**
   * Validates user creation data
   * @returns {function} middleware function
   */
  static validateCreationData() {
    return (req, res, next) => {
      const schema = Joi.object().keys({
        users: Joi.array()
          .items(
            Joi.object().keys({
              matric: Joi.string().required(),
              name: Joi.string().required(),
              department: Joi.string().required(),
              faculty: Joi.string().required()
            })
          )
          .required()
      });
      return validator(schema, req.body, res, next);
    };
  }

  /**
   * validates faculty creation data
   * @returns {function} middleware function
   */
  static validateFaculty() {
    return (req, res, next) => {
      const schema = Joi.object().keys({
        faculty: Joi.string().required()
      });
      return validator(schema, req.body, res, next);
    };
  }

  /**
   * validates faculty update data
   * @returns {function} middleware function
   */
  static validateFacultyUpdate() {
    return (req, res, next) => {
      const schema = Joi.object().keys({
        faculty: Joi.string()
      });
      return validator(schema, req.body, res, next);
    };
  }

  /**
   * validates deparment creation data
   * @returns {function} middleware function
   */
  static validateDepartment() {
    return (req, res, next) => {
      const schema = Joi.object().keys({
        department: Joi.string().required()
      });
      return validator(schema, req.body, res, next);
    };
  }

  /**
   * validates deparment update data
   * @returns {function} middleware function
   */
  static validateDepartmentUpdate() {
    return (req, res, next) => {
      const schema = Joi.object().keys({
        department: Joi.string()
      });
      return validator(schema, req.body, res, next);
    };
  }

  /**
   * Validates exam creation data
   * @returns {function} middleware funciton
   */
  static validateExamCreation() {
    return (req, res, next) => {
      const schema = Joi.object().keys({
        course: Joi.string().required(),
        scheduledFor: Joi.number().required(),
        bioData: Joi.array().items(
          Joi.object().keys({ matric: Joi.string().required() })
        ),
        title: Joi.string().required(),
        timeAllowed: Joi.number().required(),
        instructions: Joi.string().required(),
        questionsPerStudent: Joi.number().required(),
        examType: Joi.boolean(),
        markPerQuestion: Joi.number().required(),
        questions: Joi.array().items(
          Joi.object().keys({
            questionFor: Joi.array().items(
              Joi.object().keys({
                faculty: Joi.string().required(),
                department: Joi.string().required()
              })
            ),
            type: Joi.boolean(),
            correct: Joi.string().required(),
            question: Joi.string().required(),
            options: Joi.object()
              .keys({
                a: Joi.string().required(),
                b: Joi.string().required(),
                c: Joi.string().required(),
                d: Joi.string().required()
              })
              .required()
          })
        )
      });
      return validator(schema, req.body, res, next);
    };
  }

  /**
   * Validates update data
   * @returns {functoin} middlewar function
   */
  static validateExamUpdateData() {
    return (req, res, next) => {
      const schema = Joi.object().keys({
        course: Joi.string(),
        scheduledFor: Joi.number(),
        bioData: Joi.array().items(
          Joi.object().keys({ matric: Joi.string().required() })
        ),
        title: Joi.string(),
        timeAllowed: Joi.number(),
        instructions: Joi.string(),
        questionsPerStudent: Joi.number(),
        examType: Joi.boolean(),
        markPerQuestion: Joi.number(),
        questions: Joi.array().items(
          Joi.object().keys({
            questionFor: Joi.array().items(
              Joi.object().keys({
                faculty: Joi.string().required(),
                department: Joi.string().required()
              })
            ),
            type: Joi.boolean().required(),
            correct: Joi.string().required(),
            question: Joi.string().required(),
            options: Joi.object()
              .keys({
                a: Joi.string().required(),
                b: Joi.string().required(),
                c: Joi.string().required(),
                d: Joi.string().required()
              })
              .required()
          })
        )
      });
      return validator(schema, req.body, res, next);
    };
  }

  /**
   * Validates pin creation
   * @returns {function} middleware function
   */
  static validatePinCreationData() {
    return (req, res, next) => {
      const schema = Joi.object().keys({
        count: Joi.number().required()
      });
      return validator(schema, req.body, res, next);
    };
  }
}

export default AdminValidation;
