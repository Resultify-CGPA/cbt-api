import Users from '../models/UsersModel';
import Exams from '../models/ExamsModel';
import Admins from '../models/AdministratorModel';

const users = [
  {
    matric: '13ms1023',
    password: 'password',
    department: 'mathematical sciences',
    faculty: 'natural sciences',
    name: 'Ojonugwa Alikali Justice'
  }
];

const exams = [
  {
    course: 'gst 103',
    title: 'Nigerian people and culture',
    timeAllowed: 45,
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
        }
      }
    ]
  }
];

const admin = {
  name: 'John Doe',
  username: 'admin',
  password: 'password',
  email: 'admin@mail.com'
};

export default async (runClean = true, Models = [Users, Exams, Admins]) => {
  if (!runClean) {
    return;
  }
  try {
    await Models.forEach(async (model) => {
      try {
        const count = await model.deleteMany({});
        console.log(
          `cleaned ${count.deletedCount} ${model.collection.collectionName} from ${model.collection.collectionName}`
        );
      } catch (error) {
        console.log(error);
      }
    });
    const examIds = await Promise.all(
      exams.map(async (exam) => Exams.create(exam))
    );
    await Promise.all(
      users.map(async (user) => {
        user = await Users.create(user);
        const e = examIds.reduce(
          (acc, cur) => [
            ...acc,
            {
              // eslint-disable-next-line no-underscore-dangle
              examId: cur._id,
              sheduledfor: Date.now(),
              answers: []
            }
          ],
          []
        );
        user.exams = e;
        return user.save();
      })
    );
    await Admins.create(admin);
  } catch (error) {
    console.log(error);
  }
};
