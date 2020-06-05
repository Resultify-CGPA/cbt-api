const UsersModel = require("../models/UsersModel");
const config = require("../config/config");

(async (models) => {
  if (!config.seed) return;

  console.log(`
  ***********************
  *Cleaning the database
  ***********************`);

  try {
    await models.map(async (model) => {
      return (await model.find({})).map(async (elem) => {
        return await elem.delete();
      });
    });

    console.log(`
  ***********************
  *Seeding DB with users
  ***********************`);
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

    console.log(`
  *************************************
  *DB Seeded with ${users.length} user(s)
  *************************************`);
  } catch (err) {
    console.log(`
    *******************************
    *${err.message}
    *******************************`);
  }
})([UsersModel]);
