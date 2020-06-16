import { model, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

const AdminSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    username: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

AdminSchema.pre('save', async function preSave(next) {
  if (!this.isModified('password')) return next();
  try {
    this.username = this.username.toLowerCase();
    this.password = await this.encryptPassword(this.password);
    return next();
  } catch (err) {
    return next(err);
  }
});

AdminSchema.methods = {
  authenticate: async function authenticate(plainTextPassword) {
    return new Promise((resolve, reject) => {
      bcrypt.compare(plainTextPassword, this.password, (err, hash) => {
        if (err) return reject(err);
        return resolve(hash);
      });
    });
  },
  encryptPassword: async function encryptPassword(plainTextPassword) {
    if (!plainTextPassword) return '';
    try {
      const salt = await new Promise((resolve, reject) => {
        bcrypt.genSalt(10, (err, generatedSalt) => {
          if (err) return reject(err);
          return resolve(generatedSalt);
        });
      });
      return new Promise((resolve, reject) => {
        bcrypt.hash(plainTextPassword, salt, (err, hash) => {
          if (err) return reject(err);
          return resolve(hash);
        });
      });
    } catch (err) {
      throw err;
    }
  },
  toJson: function toJson() {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
  }
};

export default model('administrator', AdminSchema);
