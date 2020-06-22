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
              faculty: Joi.string().required(),
              avatar: Joi.string()
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
        bioData: Joi.array().items(
          Joi.object().keys({
            matric: Joi.string().required(),
            name: Joi.string(),
            department: Joi.string(),
            ca: Joi.number().default(0)
          })
        ),
        title: Joi.string().required(),
        timeAllowed: Joi.number().required(),
        instructions: Joi.string().required(),
        questionsPerStudent: Joi.number().required(),
        examType: Joi.boolean(),
        questions: Joi.array().items(
          Joi.object().keys({
            questionFor: Joi.array().items(
              Joi.object().keys({
                faculty: Joi.string().required(),
                department: Joi.string().required()
              })
            ),
            marks: Joi.number().required(),
            images: Joi.array(),
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
        status: Joi.number(),
        course: Joi.string(),
        title: Joi.string(),
        timeAllowed: Joi.number(),
        instructions: Joi.string(),
        questionsPerStudent: Joi.number(),
        examType: Joi.boolean()
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

  /**
   * validates biodata creation
   * @returns {function} middleware function
   */
  static validateBiodataCreationData() {
    return (req, res, next) => {
      const schema = Joi.object().keys({
        matric: Joi.string().required(),
        name: Joi.string(),
        department: Joi.string(),
        ca: Joi.number().default(0)
      });
      return validator(schema, req.body, res, next);
    };
  }

  /**
   * validates biodata update data
   * @returns {function} middleware
   */
  static validateBiodataUpdateData() {
    return async (req, res, next) => {
      const schema = Joi.object().keys({
        ca: Joi.number(),
        status: Joi.number().max(2).min(0)
      });
      return validator(schema, req.body, res, next);
    };
  }

  /**
   * validates question creation data
   * @return {function} middlewar function
   */
  static validateQuestionCreationData() {
    return async (req, res, next) => {
      const schema = Joi.object().keys({
        questionFor: Joi.array().items(
          Joi.object().keys({
            faculty: Joi.string().required(),
            department: Joi.string().required()
          })
        ),
        type: Joi.boolean(),
        marks: Joi.number().required(),
        images: Joi.array().items(),
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
      });
      return validator(schema, req.body, res, next);
    };
  }

  /**
   * validates question update data
   * @return {function} middlewar function
   */
  static validateQuestionUpdateData() {
    return async (req, res, next) => {
      const schema = Joi.object().keys({
        questionFor: Joi.array().items(
          Joi.object().keys({
            faculty: Joi.string().required(),
            department: Joi.string().required()
          })
        ),
        type: Joi.boolean(),
        images: Joi.array().items(),
        marks: Joi.number(),
        correct: Joi.string(),
        question: Joi.string(),
        options: Joi.object().keys({
          a: Joi.string().required(),
          b: Joi.string().required(),
          c: Joi.string().required(),
          d: Joi.string().required()
        })
      });
      return validator(schema, req.body, res, next);
    };
  }

  /**
   * validates user update data
   * @returns {function} middleware function
   */
  static validateUserUpdateData() {
    return (req, res, next) => {
      const schema = Joi.object().keys({
        name: Joi.string(),
        faculty: Joi.string(),
        department: Joi.string(),
        matric: Joi.string(),
        avatar: Joi.string()
      });
      validator(schema, req.body, res, next);
    };
  }

  /**
   * validates time increament data
   * @returns {function} middleware function
   */
  static validateTimeIncrementData() {
    return (req, res, next) => {
      const schema = Joi.object().keys({
        timeIncrease: Joi.number().required()
      });
      validator(schema, req.body, res, next);
    };
  }

  /**
   * validates admin creation data
   * @returns {function} middleware function
   */
  static validateAdminCreationData() {
    return (req, res, next) => {
      const schema = Joi.object().keys({
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
      validator(schema, req.body, res, next);
    };
  }

  /**
   * validates base64 string
   * @returns {function} middleware function
   */
  static validateBase64() {
    return (req, res, next) => {
      validator(
        Joi.object().keys({ base64: Joi.string().required() }),
        req.body,
        res,
        next
      );
    };
  }
}

export default AdminValidation;
