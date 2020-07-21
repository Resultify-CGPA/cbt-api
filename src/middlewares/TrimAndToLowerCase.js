const def = () => (req, res, next) => {
  /**
   * trims and coverts to lower case
   * @param {any} param param to work with
   * @param {string} curr property name
   * @returns {any} the return depends on the input
   */
  function trimAndParam(param, curr) {
    if (typeof param === 'string' && curr !== 'password') {
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
  }
  req.body = trimAndParam(req.body);
  next();
};

export default def;
