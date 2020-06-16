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
}

export default PinsService;
