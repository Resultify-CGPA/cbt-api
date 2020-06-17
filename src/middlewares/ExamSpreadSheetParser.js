import xlsxFile from 'read-excel-file/node';
import path from 'path';
import fs from 'fs';

import { randStringGen } from '../utils/index';

const saveExcel = (base64) => {
  try {
    const buff = Buffer.from(base64, 'base64');
    let fileName = randStringGen(20);
    fileName = path.resolve(`src/assets/excel/${fileName}.xlsx`);
    fs.writeFileSync(fileName, buff);
    return fileName;
  } catch (error) {
    throw error;
  }
};
/** Class that handles excel parsing */
class ExcelParser {
  /**
   * parses userdata and question data on exam route
   * @returns {function} middleware function
   */
  static parseExamRoute() {
    return async (req, res, next) => {
      //  Methods
      const optionsParser = (options) => {
        const arr = options.split(';');
        return arr.reduce((acc, cur) => {
          const opt = cur.split(':');
          if (opt.length < 2) {
            return acc;
          }
          return { ...acc, [opt[0]]: opt[1] };
        }, {});
      };
      const questionForParser = (q) => {
        q = q.split(';');
        return q.reduce((acc, cur) => {
          cur = cur.split(':');
          if (cur.length < 2) {
            return acc;
          }
          const [faculty, depts] = cur;
          const departments = depts.split(':');
          return [
            ...acc,
            ...departments.reduce(
              (g, d) => [...g, { faculty, department: d }],
              []
            )
          ];
        }, []);
      };

      try {
        if (req.body.questions && !Array.isArray(req.body.questions)) {
          const file = saveExcel(req.body.questions);

          // Decoding excel file to array
          const data = await xlsxFile(file);

          //  Parsing Decoded data
          const objectHead = data[0];
          data.splice(0, 1);
          req.body.questions = data.reduce(
            (questionsAccumulator, currentQuestion) => [
              ...questionsAccumulator,
              objectHead.reduce(
                (questionDataAccumulator, currentHead, index) => {
                  let val = currentQuestion[index];
                  if (currentHead === 'options') {
                    val = optionsParser(currentQuestion[index]);
                  } else if (currentHead === 'questionFor') {
                    val = questionForParser(currentQuestion[index]);
                  }
                  return { ...questionDataAccumulator, [currentHead]: val };
                },
                {}
              )
            ],
            []
          );
        }

        if (req.body.bioData && !Array.isArray(req.body.bioData)) {
          const file = saveExcel(req.body.bioData);

          //  Decoding excel file to array
          const data = await xlsxFile(file);

          // Parsing Decoded data
          const objectHead = data[0];
          data.splice(0, 1);
          req.body.bioData = data.reduce(
            (ac, cu) => [
              ...ac,
              objectHead.reduce(
                (acc, cur, i) => ({
                  ...acc,
                  [cur]: cu[i]
                }),
                {}
              )
            ],
            []
          );
        }
        return next();
      } catch (error) {
        next(error);
      }
    };
  }
}

export default ExcelParser;
