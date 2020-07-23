/* eslint-disable operator-linebreak */
/* eslint-disable no-underscore-dangle */
// import _ from 'lodash';

import Users from '../models/UsersModel';
import Exams from '../models/ExamsModel';
import Admins from '../models/AdministratorModel';
import Departments from '../models/Departments';
import Faculties from '../models/Faculties';
import Pins from '../models/pins';

const admin = {
  name: 'John Doe',
  username: 'admin',
  password: 'password',
  email: 'admin@mail.com',
  isRootAdmin: true
};

const pins = [
  {
    pin: 'password'
  },
  {
    pin: 'password'
  },
  {
    pin: 'password'
  },
  {
    pin: 'password'
  },
  {
    pin: 'password'
  },
  {
    pin: 'password'
  },
  {
    pin: 'password'
  },
  {
    pin: 'password'
  },
  {
    pin: 'password'
  }
];

export default async (
  runClean = true,
  Models = [Users, Exams, Admins, Departments, Faculties, Pins]
) => {
  if (!runClean) {
    return;
  }
  try {
    await Promise.all(
      Models.map(async (model) => {
        try {
          const count = await model.deleteMany({});
          console.log(
            `cleaned ${count.deletedCount} ${model.collection.collectionName} from ${model.collection.collectionName}`
          );
          return count;
        } catch (error) {
          console.log(error);
        }
      })
    );

    await Admins.create(admin);
    await Pins.create(pins);
  } catch (error) {
    console.log(error);
  }
};
