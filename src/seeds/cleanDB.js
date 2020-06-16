/* eslint-disable operator-linebreak */
/* eslint-disable no-underscore-dangle */
import _ from 'lodash';

import Users from '../models/UsersModel';
import Exams from '../models/ExamsModel';
import Admins from '../models/AdministratorModel';
import Departments from '../models/Departments';
import Faculties from '../models/Faculties';

const admin = {
  name: 'John Doe',
  username: 'admin',
  password: 'password',
  email: 'admin@mail.com'
};

const exams = [
  {
    course: 'gst 103',
    title: 'Nigerian people and culture',
    scheduledFor: Date.now(),
    timeAllowed: 45,
    instructions: 'Keep your arms and feets in the vehicle at all times.',
    questionsPerStudent: 30,
    markPerQuestion: 2,
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
        }
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
        department: 'mathematical sciences'
      }
    ],
    exams
  }
];

export default async (
  runClean = true,
  Models = [Users, Exams, Admins, Departments, Faculties]
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
                    return [
                      ...accc,
                      { ...curr, faculty: f.faculty, department: f._id }
                    ];
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
  } catch (error) {
    console.log(error);
  }
};
