const ValidationErrorTemplate = ({ path, message, type, kind }) => ({
  [path]: {
    message,
    name: "ValidationError",
    properties: { message, type, path },
    kind: kind || type,
    path,
  },
});

const dummyFunc = () => true;

module.exports = (
  validate = { username: dummyFunc, password: dummyFunc, email: dummyFunc }
) => (req, res, next) => {
  let errors = {};

  ((paths) => {
    paths.forEach((path) => {
      if (
        req.body.hasOwnProperty(path) &&
        typeof validate[path](req.body[path]) !== typeof true
      )
        errors = {
          ...errors,
          ...ValidationErrorTemplate({
            path,
            message: validate[path](req.body[path]),
            type: "criteria",
          }),
        };
      return;
    });
  })(["username", "email", "password"]);

  req.validate = (fields) => {
    Object.keys(fields).forEach((field) => {
      const props = fields[field].split("|");
      let skipThrough = false;
      let msg;
      props.forEach((splitable) => {
        if (skipThrough) return;
        const splitted = splitable.split(":");
        if (splitted.length !== 2) return;
        if (splitted[0] === "message") {
          msg = splitted[1];
        }
        if (
          splitted[0] === "min" &&
          !isNaN(parseInt(req.body[field])) &&
          req.body[field] < parseInt(splitted[1])
        ) {
          errors = {
            ...errors,
            ...ValidationErrorTemplate({
              path: field,
              message:
                msg || `Path '${field}' must be greater than ${splitted[1]}`,
              type: "ValidationError",
              kind: "object",
            }),
          };
          skipThrough = true;
        }
        if (
          splitted[0] === "minlen" &&
          req.body.hasOwnProperty(field) &&
          req.body[field].toString().length < parseInt(splitted[1])
        ) {
          errors = {
            ...errors,
            ...ValidationErrorTemplate({
              path: field,
              message:
                msg ||
                `Path '${field}' must be at least ${splitted[1]} characters long`,
              type: "ValidationError",
              kind: "object",
            }),
          };
          skipThrough = true;
        }
        if (
          splitted[0] === "len" &&
          req.body.hasOwnProperty(field) &&
          req.body[field].toString().length !== parseInt(splitted[1])
        ) {
          errors = {
            ...errors,
            ...ValidationErrorTemplate({
              path: field,
              message:
                msg || `Path '${field}' must be ${splitted[1]} characters long`,
              type: "ValidationError",
              kind: "object",
            }),
          };
          skipThrough = true;
        }
        if (
          splitted[0] === "maxlen" &&
          req.body.hasOwnProperty(field) &&
          req.body[field].toString().length > parseInt(splitted[1])
        ) {
          errors = {
            ...errors,
            ...ValidationErrorTemplate({
              path: field,
              message:
                msg ||
                `Path '${field}' must be at most ${splitted[1]} characters long`,
              type: "ValidationError",
              kind: "object",
            }),
          };
          skipThrough = true;
        }
        if (
          splitted[0] === "max" &&
          !isNaN(parseInt(req.body[field])) &&
          req.body[field] > parseInt(splitted[1])
        ) {
          errors = {
            ...errors,
            ...ValidationErrorTemplate({
              path: field,
              message:
                msg || `Path '${field}' must be less than ${splitted[1]}`,
              type: "ValidationError",
              kind: "object",
            }),
          };
          skipThrough = true;
        }
        if (splitted[0] === "default" && !req.body.hasOwnProperty(field)) {
          req.body[field] = splitted[1];
          skipThrough = true;
        }
      });
      if (props.indexOf("required") !== -1 && !req.body.hasOwnProperty(field)) {
        errors = {
          ...errors,
          ...ValidationErrorTemplate({
            path: field,
            message: msg || `Path '${field}' is required`,
            type: "ValidationError",
            kind: "required",
          }),
        };
        return;
      }
      if (
        props.indexOf("number") !== -1 &&
        req.body.hasOwnProperty(field) &&
        isNaN(parseInt(req.body[field]))
      ) {
        errors = {
          ...errors,
          ...ValidationErrorTemplate({
            path: field,
            message: msg || `Path '${field}' must be a number`,
            type: "ValidationError",
            kind: "number",
          }),
        };
        return;
      }
      if (
        props.indexOf("boolean") !== -1 &&
        req.body.hasOwnProperty(field) &&
        typeof req.body[field] !== "boolean"
      ) {
        errors = {
          ...errors,
          ...ValidationErrorTemplate({
            path: field,
            message: msg || `Path '${field}' must be a boolean`,
            type: "ValidationError",
            kind: "boolean",
          }),
        };
        return;
      }
      if (
        props.indexOf("string") !== -1 &&
        req.body.hasOwnProperty(field) &&
        typeof req.body[field] !== "string"
      ) {
        errors = {
          ...errors,
          ...ValidationErrorTemplate({
            path: field,
            message: msg || `Path '${field}' must be a string`,
            type: "ValidationError",
            kind: "string",
          }),
        };
        return;
      }
      if (
        props.indexOf("object") !== -1 &&
        req.body.hasOwnProperty(field) &&
        typeof req.body[field] !== "object"
      ) {
        errors = {
          ...errors,
          ...ValidationErrorTemplate({
            path: field,
            message: msg || `Path '${field}' must be an object`,
            type: "ValidationError",
            kind: "object",
          }),
        };
        return;
      }
    });

    if (Object.values(errors).length > 0) {
      const e = new Error();
      e.errors = errors;
      e.name = "ValidationError";
      e._message = "Input validation failed";
      e.message = "Input validation failed";
      e.statusCode = 400;
      next(e);
      return false;
    }

    return true;
  };

  next();
};
