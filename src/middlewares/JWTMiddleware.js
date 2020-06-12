import expressJWT from 'express-jwt';

/** JWT Middleware class */
class JWT {
  /**
   * Decodes token with app secret
   * @returns {object} next with request
   */
  static decodeToken() {
    return (req, res, next) => {
      const checkToken = expressJWT({
        secret: process.env.JWTSecret || 'SomeJuicySecretSetOnEnv'
      });
      //  Checks if token was passed on url
      const query = { req };
      // eslint-disable-next-line no-prototype-builtins
      if (query && query.hasOwnProperty('bearerToken')) {
        req.headers.authorization = `Bearer ${query.bearerToken}`;
      }
      checkToken(req, res, next);
    };
  }
}

export default JWT;
