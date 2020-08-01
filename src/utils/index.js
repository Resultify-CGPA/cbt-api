import ejs from 'ejs';
import path from 'path';
import pdf from 'html-pdf';
import excel from 'excel4node';

export const randStringGen = (len, res = '') => {
  const chars = '1234567890';
  if (res.length >= len) {
    return res;
  }
  const charc = chars[Math.floor(Math.random() * chars.length)];
  res += charc;
  return randStringGen(len, res);
};

export const pins = (count, len = 10, res = []) => {
  if (res.length >= count) {
    return res;
  }
  res.push({ pin: randStringGen(len) });
  return pins(count, len, res);
};

export const htmlToPdf = async (
  pathToTemplate,
  results,
  metaData = { examTitle: '' }
) => {
  const data = await ejs.renderFile(pathToTemplate, { results, metaData });
  const name = 'school-result.pdf';
  await pdf
    .create(data, {
      height: '11.25in',
      width: '8.5in',
      header: {
        height: '20mm'
      },
      footer: {
        height: '20mm'
      }
    })
    .toFile(path.join(__dirname, '../routes/static/', name), (err) => {
      if (err) {
        throw err;
      }
    });
  return name;
};

export const writeExcel = (results, examType) =>
  // eslint-disable-next-line implicit-arrow-linebreak
  new Promise((resolve, reject) => {
    try {
      const name = 'school-result.xlsx';
      const workbook = new excel.Workbook();

      const worksheet = workbook.addWorksheet('Sheet 1');
      results = [
        {
          sn: 'S/N',
          name: 'Name',
          faculty: 'Faculty',
          department: 'Department',
          level: 'Level',
          ca: examType ? 'CA' : 'JAMB Ratio',
          exam: examType ? 'Exam' : 'PUME Ratio',
          grade: examType ? 'Grade' : 'Total Ratio'
        },
        ...results
      ];
      results.forEach((elem, i) => {
        const row = i + 1;
        if (typeof elem.sn === 'string') {
          worksheet.cell(row, 1).string(elem.sn);
        } else {
          worksheet.cell(row, 1).number(row - 1);
        }
        worksheet.cell(row, 2).string(elem.name);
        worksheet.cell(row, 3).string(elem.faculty);
        worksheet.cell(row, 4).string(elem.department);
        if (typeof elem.level === 'string') {
          worksheet.cell(row, 5).string(elem.level);
        } else {
          worksheet.cell(row, 5).number(elem.level);
        }
        if (typeof elem.ca === 'string') {
          worksheet.cell(row, 6).string(elem.ca);
        } else {
          worksheet.cell(row, 6).number(elem.ca);
        }
        if (typeof elem.exam === 'string') {
          worksheet.cell(row, 7).string(elem.exam);
        } else {
          worksheet.cell(row, 7).number(elem.exam);
        }
        if (elem.grade) {
          worksheet.cell(row, 8).string(elem.grade);
        } else {
          worksheet.cell(row, 8).number(elem.ca + elem.exam);
        }
      });
      workbook.write(path.join(__dirname, '../routes/static/', name));
      resolve(name);
    } catch (error) {
      reject(error);
    }
  });
