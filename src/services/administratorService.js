/* eslint-disable no-prototype-builtins */
/* eslint-disable no-underscore-dangle */
import _ from 'lodash';

import CommonMethods from './commonMethods';
import AdministratorModel from '../models/AdministratorModel';
import Faculties from '../models/Faculties';
import Departments from '../models/Departments';

const getFaculties = async () => {
  try {
    let faculties = await Faculties.find();
    faculties = await Promise.all(
      faculties.map(async (faculty) => {
        const { _id: facultyId } = faculty;
        let departments = await Departments.find({ faculty: facultyId });
        departments = departments.map((department) => {
          const o = department.toObject();
          delete o.faculty;
          return o;
        });
        return { ...faculty.toObject(), departments };
      })
    );
    return faculties;
  } catch (error) {
    throw error;
  }
};

/** Class that manages administrator services */
class AdministratorService {
  /**
   * Signs in administrator
   * @param {object} param - object to find admin by
   * @returns {object} - signed admin
   */
  static async signInAdmin(param) {
    try {
      return await CommonMethods.SignInUser(param, AdministratorModel);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gets admin
   * @param {object} param - param to get admin by
   * @returns {object} - user object
   */
  static async getOneUser(param) {
    try {
      const user = await AdministratorModel.findOne(param);
      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validates user
   * @param {object} user user object to be updated,
   * @param {object} data update data,
   * @returns {object} updated user
   */
  static async updateOneUser(user, data) {
    _.merge(user, data);
    try {
      return (await user.save()).toJson();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gets all faculties
   * @returns {array} array of faculties
   */
  static async getAllFaculties() {
    try {
      return await getFaculties();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gets all departments
   * @param {object} query faculty query
   * @returns {array} array of departments
   */
  static async getAllDepartments(query) {
    try {
      return await Departments.find(query);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gets a faculty
   * @param {object} param params to find faculty by
   * @returns {object} faculty object
   */
  static async getOneFaculty(param) {
    try {
      const faculty = await Faculties.findOne(param);
      if (!faculty) {
        return null;
      }
      const departments = await Departments.find({ faculty: faculty._id });
      return { ...faculty.toObject(), departments };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gets a department
   * @param {object} param params to find department by
   * @returns {object} department object
   */
  static async getOneDepartment(param) {
    try {
      const department = await Departments.findOne(param);
      if (!department) {
        return null;
      }
      return department;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Creates a faculty
   * @param {object} data object to create faculty from
   * @returns {object} created faculty
   */
  static async createFaculty(data) {
    try {
      let faculty = await Faculties.create(data);
      faculty = faculty.toObject();
      return { ...faculty, departments: [] };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Creates a department
   * @param {object} data object to create department from
   * @returns {object} created department
   */
  static async createDepartment(data) {
    try {
      const department = await Departments.create(data);
      return department;
    } catch (error) {
      throw error;
    }
  }

  /**
   * updates a faculty
   * @param {object} query - data to get faculty from
   * @param {object} update - update data
   * @returns {object} updated faculty
   */
  static async updateOneFaculty(query, update) {
    try {
      const faculty = await Faculties.findOne(query);
      if (!faculty) {
        return null;
      }
      _.merge(faculty, update);
      const saved = await faculty.save();
      const departments = await Departments.find({ faculty: saved._id });
      return { ...saved.toObject(), departments };
    } catch (error) {
      throw error;
    }
  }

  /**
   * updates a department
   * @param {object} query - data to get department from
   * @param {object} update - update data
   * @returns {object} updated department
   */
  static async updateOneDepartment(query, update) {
    try {
      const department = await Departments.findOne(query);
      if (!department) {
        return null;
      }
      _.merge(department, update);
      const saved = await department.save();
      return saved;
    } catch (error) {
      throw error;
    }
  }
}

export default AdministratorService;
