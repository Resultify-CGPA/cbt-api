const { model, Schema } = require("mongoose");
const bcrypt = require("bcrypt");

const UsersSchema = new Schema({
  matric: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    required: true,
    default: true,
  },
  department: {
    type: String,
    required: true,
  },
  faculty: {
    type: String,
    required: true,
  },
  exams: [
    {
      exam_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "exams",
      },
      sheduledfor: {
        type: Number,
        required: true,
      },
      submitted: {
        type: Boolean,
        default: false,
        required: true,
      },
      time_start: {
        type: Number,
        default: Date.now(),
      },
      time_end: {
        type: Number,
        default: Date.now(),
      },
      in_progress: {
        type: Boolean,
        default: false,
      },
      answered: [{ type: Number }],
      passed: {
        type: Number,
        default: 0,
      },
    },
  ],
});

UsersSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    this.matric = this.matric.toLowerCase();
    this.password = await this.encryptPassword(this.password);
    return next();
  } catch (err) {
    return next(err);
  }
});

UsersSchema.methods = {
  authenticate: async function (plainTextPassword) {
    return await new Promise((resolve, reject) => {
      bcrypt.compare(plainTextPassword, this.password, (err, hash) => {
        if (err) return reject(err);
        return resolve(hash);
      });
    });
  },
  encryptPassword: async function (plainTextPassword) {
    if (!plainTextPassword) return "";
    try {
      const salt = await new Promise((resolve, reject) => {
        bcrypt.genSalt(10, (err, salt) => {
          if (err) return reject(err);
          return resolve(salt);
        });
      });
      return await new Promise((resolve, reject) => {
        bcrypt.hash(plainTextPassword, salt, (err, hash) => {
          if (err) return reject(err);
          return resolve(hash);
        });
      });
    } catch (err) {
      throw err;
    }
  },
  toJson: function () {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
  },
};

module.exports = model("users", UsersSchema);
