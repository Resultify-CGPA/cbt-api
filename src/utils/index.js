/* eslint-disable operator-linebreak */
import ejs from 'ejs';
import path from 'path';
import puppeteer from 'puppeteer';
import fs from 'fs';
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
  datas,
  metaData = { examTitle: '' },
  name = 'school-result.pdf',
  reset = false
) => {
  if (
    fs.existsSync(path.join(__dirname, '../routes/static/', name)) &&
    !reset
  ) {
    return name;
  }
  const data = await ejs.renderFile(pathToTemplate, {
    datas,
    metaData,
    logo: `${process.env.SERVER_URL}/api/static/ksu-logo.png`
  });
  await fs.writeFile(
    path.join(__dirname, '../routes/static/topdf.html'),
    data,
    { encoding: 'utf-8' },
    (err) => {
      if (err) throw err;
      return true;
    }
  );
  const { SERVER_URL: url } = process.env;
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`${url}/api/static/topdf.html`, {
    waitUntil: 'networkidle0'
  });
  await page.pdf({
    format: 'A4',
    path: path.join(__dirname, '../routes/static/', name)
  });
  await browser.close();
  return name;
};

export const writeExcel = (
  results,
  examType,
  name = 'school-result.xlsx',
  reset = false
) =>
  // eslint-disable-next-line implicit-arrow-linebreak
  new Promise((resolve, reject) => {
    try {
      if (
        fs.existsSync(path.join(__dirname, '../routes/static/', name)) &&
        !reset
      ) {
        return resolve(name);
      }
      const workbook = new excel.Workbook();

      Object.values(results).forEach((result) => {
        const worksheet = workbook.addWorksheet(result.faculty.toUpperCase());
        result.results = [
          {
            sn: 'S/N',
            name: 'Name',
            matric: examType ? 'Matric No.' : 'JAMB Reg.',
            faculty: 'Faculty',
            department: 'Department',
            level: 'Level',
            ca: examType ? 'CA' : 'JAMB Ratio',
            exam: examType ? 'Exam' : 'PUME Ratio',
            grade: examType ? 'Grade' : 'Total Ratio'
          },
          ...result.results
        ];
        result.results.forEach((elem, i) => {
          const row = i + 1;
          if (typeof elem.sn === 'string') {
            worksheet.cell(row, 1).string(elem.sn);
          } else {
            worksheet.cell(row, 1).number(row - 1);
          }
          worksheet.cell(row, 2).string(elem.name.toUpperCase());
          worksheet.cell(row, 3).string(elem.matric.toUpperCase());
          worksheet
            .cell(row, 4)
            .string(i === 0 ? elem.faculty : result.faculty.toUpperCase());
          worksheet.cell(row, 5).string(elem.department.toUpperCase());
          if (typeof elem.level === 'string') {
            worksheet.cell(row, 6).string(elem.level);
          } else {
            worksheet.cell(row, 6).number(elem.level);
          }
          if (typeof elem.ca === 'string') {
            worksheet.cell(row, 7).string(elem.ca);
          } else {
            worksheet.cell(row, 7).number(elem.ca);
          }
          if (typeof elem.exam === 'string') {
            worksheet.cell(row, 8).string(elem.exam);
          } else {
            worksheet.cell(row, 8).number(elem.exam);
          }
          if (elem.grade) {
            worksheet.cell(row, 9).string(elem.grade);
          } else {
            worksheet.cell(row, 9).number(elem.ca + elem.exam);
          }
        });
      });
      workbook.write(path.join(__dirname, '../routes/static/', name));
      resolve(name);
    } catch (error) {
      reject(new Error(error));
    }
  });
