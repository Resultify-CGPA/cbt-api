/* eslint-disable class-methods-use-this */
import xlsxFile from 'read-excel-file/node';
import path from 'path';
import fs from 'fs';

const saveExcel = (base64) => {
  try {
    const buff = Buffer.from(base64, 'base64');
    const fileName = path.resolve(__dirname, 'excelFile.xlsx');
    fs.writeFileSync(fileName, buff);
    return fileName;
  } catch (error) {
    throw error;
  }
};

const saveImage = (base64) => {
  try {
    const buff = Buffer.from(base64, 'base64');
    const name = `image_${Date.now()}.png`;
    const fileName = path.resolve(__dirname, `../routes/static/${name}`);
    fs.writeFileSync(fileName, buff);
    return name;
  } catch (error) {
    throw error;
  }
};

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
      ...departments.reduce((g, d) => [...g, { faculty, department: d }], [])
    ];
  }, []);
};

/** Class that handles excel parsing */
class ExcelParser {
  /**
   * parses question
   * @returns {function} middleware function
   */
  static parseExamQuestion() {
    return async (req, res, next) => {
      try {
        const excelParser = new ExcelParser();
        const questions = (
          await excelParser.parseExcelFile(req.body.base64, [
            'type',
            'question',
            'correct',
            'options',
            'marks',
            'questionFor'
          ])
        ).map((question) => ({
          ...question,
          options: optionsParser(question.options),
          questionFor: question.questionFor
            ? questionForParser(question.questionFor)
            : []
        }));
        return res
          .status(200)
          .json({ message: 'question data:', status: 200, data: questions });
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * parses biodata
   * @returns {function} middleware function
   */
  static parseBioData() {
    return async (req, res, next) => {
      try {
        const excelParser = new ExcelParser();
        const bioData = await excelParser.parseExcelFile(req.body.base64, [
          'matric',
          'name',
          'department',
          'ca'
        ]);
        return res
          .status(200)
          .json({ message: 'bio data:', status: 200, data: bioData });
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * parses excel files
   * @param {string} base64 excel file base64 encoded
   * @param {array} doc keys of object
   * @returns {object} parsed excel object
   */
  async parseExcelFile(base64, doc) {
    const file = saveExcel(base64);
    // Decoding excel file to array
    const data = await xlsxFile(file);
    const resp = data.reduce(
      (acc, cur) => [
        ...acc,
        doc.reduce((a, c, i) => ({ ...a, [c]: cur[i] }), {})
      ],
      []
    );
    return resp;
  }

  /**
   * parse image file
   * @returns {function} middleware function
   */
  static parseImageFile() {
    return (req, res, next) => {
      try {
        const file = saveImage(req.body.base64);
        return res
          .status(200)
          .json({ message: 'uploaded', status: 200, data: file });
      } catch (error) {
        next(error);
      }
    };
  }
}

export default ExcelParser;
