import { pins } from '../utils';
import PinsModel from '../models/pins';

/** Class that manages pins */
class PinsService {
  /**
   * populates db with new pins
   * @param {number} count new pin count
   * @returns {array} array of pins
   */
  static async generatePins(count) {
    try {
      await PinsModel.deleteMany();
      const dbPins = await PinsModel.create(pins(count));
      return dbPins;
    } catch (error) {
      throw error;
    }
  }

  /**
   * gets all pins
   * @returns {array} array of pins
   */
  static async getAllPins() {
    try {
      const allPins = await PinsModel.find();
      return allPins;
    } catch (error) {
      throw error;
    }
  }

  /**
   * get single pin
   * @param {object} param param to find pin by
   * @returns {object} pin object
   */
  static async getOnePin(param) {
    const pin = await PinsModel.findOne(param);
    return pin;
  }

  /**
   * goes through pins and delete pins active for more than a day
   * @returns {function} middleware function
   */
  static pinsDeletionMiddleware() {
    return async (req, res, next) => {
      try {
        const usedPins = await PinsModel.find({ user: { $ne: null } });
        await Promise.all(
          usedPins.map(async (elem) => {
            let date = new Date(elem.createdAt);
            date = new Date(date.getTime() + 1000 * 60 * 60 * 24);
            if (date.getTime() < Date.now()) {
              return elem.remove();
            }
            return elem;
          })
        );
        next();
      } catch (error) {
        next(error);
      }
    };
  }
}

export default PinsService;
