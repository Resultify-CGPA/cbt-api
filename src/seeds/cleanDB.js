/* eslint-disable operator-linebreak */
/* eslint-disable no-underscore-dangle */
import _ from 'lodash';

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

const exams = [
  {
    course: 'gst 103',
    title: 'Nigerian people and culture',
    timeAllowed: 25.999,
    displayTime: 30.999,
    status: 1,
    instructions: 'Keep your arms and feets in the vehicle at all times.',
    questionsPerStudent: 30,
    questions: [
      {
        type: true,
        correct: 'a',
        question:
          'Since mongo park discovered river Niger, who discovered mongo park?',
        options: {
          a: 'Jona Lukas',
          b: 'Henry Hart',
          c: 'Joseph Tulip',
          d: 'Abraham Lincoln'
        },
        marks: 2
      },
      {
        type: true,
        correct: 'a',
        question: 'Who is the President of Nigeria?',
        options: {
          a: 'General Muhamadu Buhari',
          b: 'Henry Hart',
          c: 'Goodluck Ebele Jonathan',
          d: 'Abraham Lincoln'
        },
        marks: 3
      },
      {
        type: true,
        correct: 'c',
        question: 'PAAU Stands for?',
        options: {
          a: 'Prince Atabo Audu University',
          b: 'Prince Abubakar Adeiza University',
          c: 'Prince Abubakar Audu University',
          d: 'Prince Ahmodu Adeiza University'
        },
        marks: 5
      }
    ]
  }
];
const deptNtSci = [
  {
    department: 'mathematical sciences'
  }
];

const hierarchy = [
  {
    faculty: 'natural sciences',
    departments: deptNtSci,
    users: [
      {
        name: 'Ojonugwa Alikali Justice',
        matric: '13ms1023',
        level: 400,
        ca: 30,
        department: 'mathematical sciences'
      }
    ],
    exams
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
    const cleard = await Promise.all(
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

    //  The seeding begins
    if (cleard.length > 0) {
      await hierarchy.forEach(async (elem) => {
        const faculty = await Faculties.create({ faculty: elem.faculty });
        if (!elem.departments) {
          return;
        }
        let departments = elem.departments.map((el) => ({
          ...el,
          faculty: faculty._id
        }));
        departments = await Departments.create(departments);
        if (!elem.users) {
          return;
        }
        let users = elem.users.map((u) => {
          const f =
            _.find(departments, { department: u.department }) ||
            departments[Math.floor(Math.random() * departments.length)];
          return { ...u, faculty: f.faculty, department: f._id };
        });
        users = await Users.create(users);
        const e = exams.map((ele) => {
          ele.bioData = users.reduce(
            (acc, cur) => [...acc, { user: cur._id }],
            []
          );
          if (ele.questions && ele.questions.questionFor) {
            ele.questions = ele.questions.reduce(
              (acc, cur) => [
                ...acc,
                {
                  ...cur,
                  questionFor: cur.question.reduce((accc, curr) => {
                    const f =
                      _.find(departments, { department: curr.department }) ||
                      departments[
                        Math.floor(Math.random() * departments.length)
                      ];
                    return [...accc, { ...curr, faculty: f.faculty }];
                  })
                }
              ],
              []
            );
          }
          return ele;
        });
        await Exams.create(e);
      });
    }
    //   The seeding ends

    await Admins.create(admin);
    await Pins.create(pins);
  } catch (error) {
    console.log(error);
  }
};
