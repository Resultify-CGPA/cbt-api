const { model, Schema } = require("mongoose");
const bcrypt = require("bcrypt");

const UsersSchema = new Schema({
  matric: {
    type: String,
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
});

UsersSchema.pre("save", async (next) => {
  if (!this.isModified("password")) return next();
  try {
    this.password = await this.encryptPassword(this.password);
    return next();
  } catch (err) {
    return next(err);
  }
});

UsersSchema.methods = {
  authenticate: async (plainTextPassword) => {
    return await new Promise((resolve, reject) => {
      bcrypt.compare(plainTextPassword, this.password, (err, hash) => {
        if (err) return reject(err);
        return resolve(hash);
      });
    });
  },
  encryptPassword: async (plainTextPassword) => {
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
  toJson: () => {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
  },
};

module.exports = model("users", UsersSchema);
