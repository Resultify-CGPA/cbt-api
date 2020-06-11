import '@babel/polyfill';
import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import routes from './routes';

dotenv.config();

const app = express();
app.enable('trust proxy');
app.use(cors());

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose
  .connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
  })
  .then(() => {
    console.log('Successfully connected to MongoDB Atlas!');
  })
  .catch((err) => {
    console.log('Unable to connect');
    console.log(err);
  });

app.use(routes);
app.use((error, req, res, next) => {
  const status = error.status || error.statusCode || 500;
  const stack =
    process.env.NODE_ENV === 'production'
      ? {}
      : { ...error, stack: error.stack };
  res.status(status).json({
    message: error.message,
    ...stack
  });
});
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

export default { app };
