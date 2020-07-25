/**
 * trims and coverts to lower case
 * @param {any} param param to work with
 * @param {string} curr property name
 * @returns {any} the return depends on the input
 */
export const trimAndParam = (param, curr) => {
  if (typeof param === 'string' && curr !== 'password' && curr !== 'question') {
    return param.toLowerCase().trim();
  }
  if (typeof param === 'object') {
    try {
      return Object.keys(param).reduce((acc, cur) => {
        const toReturn = Array.isArray(param)
          ? [...acc, trimAndParam(param[cur], cur)]
          : { ...acc, [cur]: trimAndParam(param[cur], cur) };
        return toReturn;
      }, (Array.isArray(param) && []) || {});
    } catch (error) {
      return param;
    }
  }
  return param;
};
const def = () => (req, res, next) => {
  req.body = trimAndParam(req.body);
  next();
};

export default def;
