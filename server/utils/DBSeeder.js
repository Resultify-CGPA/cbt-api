const UsersModel = require("../models/UsersModel");
const ExamsModel = require("../models/ExamsModel");
const config = require("../config/config");
const _ = require("lodash");
const chalk = require("chalk");

(async (models) => {
  if (!config.seed) return;

  console.log(chalk.yellow(`
  ***********************
  *Cleaning the database
  ***********************`));

  try {
    await models.map(async (model) => {
      return (await model.find({})).map(async (elem) => {
        return await elem.delete();
      });
    });

    console.log(chalk.blue(`
  ***********************
  *Seeding DB with users
  ***********************`));
    const users = await Promise.all(
      [
        {
          matric: "13MS1023",
          password: "password",
          department: "mathematical sciences",
          faculty: "natural sciences",
        },
      ].map(async (user) => {
        return await UsersModel.create(user);
      })
    );

    console.log(chalk.green(`
  *************************************
  *DB Seeded with ${users.length} user(s)
  *************************************`));

    console.log(chalk.yellow(`
  ***********************
  *Seeding DB with Exams
  ***********************`));
    const exams = await Promise.all(
      [
        {
          course: "GST 103",
          title: "NIGERIAN PEOPLE AND CULTURE",
          time_allowed: 45,
          created_at: Date.now(),
          updated_at: Date.now(),
          questions_per_student: 29,
          questions: [
            {
              type: true, //true: multichoice, false: freeanswer
              correct: "a",
              question:
                "Since mongo park discovered the confluence, who discovered mongo park?",
              options: {
                a: "David Mark",
                b: "Johna Lukas",
                c: "Stephen Hawkins",
                d: "James Stew",
              },
            },
          ],
        },
      ].map(async (user) => {
        return await ExamsModel.create(user);
      })
    );

    console.log(chalk.green(`
  *************************************
  *DB Seeded with ${exams.length} exam(s)
  *************************************`));

    await Promise.all(
      users.map(async (user) => {
        return await Promise.all(
          exams.map(async (exam) => {
            return await user.updateOne(
              _.merge(user, {
                exams: [{ exam_id: exam._id, sheduledfor: Date.now() }],
              })
            );
          })
        );
      })
    );
  } catch (err) {
    console.log(chalk.red(`
    *******************************
    *${err.message}
    *******************************`));
  }
})([UsersModel, ExamsModel]);
