import path from 'path';
import swagger from 'swagger-ui-express';
import express from 'express';
import swaggerDoc from '../swaggerDoc/swagger.json';
import index from './api';

const router = express.Router();

router.use((req, res, next) => {
  /**
   * trims and coverts to lower case
   * @param {any} param param to work with
   * @returns {any} the return depends on the input
   */
  function trimAndParam(param) {
    if (typeof param === 'string') {
      return param.toLowerCase().trim();
    }
    if (typeof param === 'object') {
      try {
        return Object.keys(param).reduce((acc, cur) => {
          return Array.isArray(param)
            ? [...acc, trimAndParam(param[cur])]
            : { ...acc, [cur]: trimAndParam(param[cur]) };
        }, (Array.isArray(param) && []) || {});
      } catch (error) {
        return param;
      }
    }
    return param;
  }
  req.body = trimAndParam(req.body);
  next();
});

router.use('/api/v1/', index);

router.use('/api/static', express.static(path.resolve(__dirname, 'static')));

router.use('/api/docs', swagger.serve, swagger.setup(swaggerDoc));

export default router;
