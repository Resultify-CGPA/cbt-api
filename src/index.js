import '@babel/polyfill';
import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import routes from './routes';
import ExamService from './services/examService';
import PinsService from './services/pinsService';
import Admin from './models/AdministratorModel';

dotenv.config();

const app = express();
app.enable('trust proxy');
app.use(cors());

app.use(cookieParser());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(
  bodyParser.urlencoded({
    limit: '50mb',
    extended: true,
    parameterLimit: 50000
  })
);

mongoose
  .connect(process.env.DATABASE_URL || 'mongodb://localhost/cbt-api', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
  })
  .then(async () => {
    const check = await Admin.findOne({ isRootAdmin: true });
    if (!check) {
      await Admin.create({
        name: 'Root Administrator',
        username: 'root',
        password: 'password',
        email: 'root@mail.com',
        isRootAdmin: true
      });
    }
    ExamService.ExamSubmitFunction();
    PinsService.pinsDeletionFunction();
    console.log('Connection to DB successful!');
  })
  .catch((err) => {
    console.log('Unable to connect to DB');
    console.log(err);
  });
app.use(routes);
// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  const status = error.status || error.statusCode || 500;
  // eslint-disable-next-line operator-linebreak
  const stack =
    process.env.NODE_ENV === 'production'
      ? {}
      : { ...error, stack: error.stack };
  console.log({
    message: error.message,
    ...error,
    ...stack
  });
  res.status(status).json({
    message: error.message,
    ...stack
  });
});
const PORT = process.env.PORT || 4000;

app.listen(PORT, '0.0.0.0', () => {
  console.log('--------------------');
  console.log(
    `Server listening on port ${PORT}.\nGoto http://localhost:${PORT}/api/docs to see documetation`
  );

  console.log('--------------------');
});

export default { app };
