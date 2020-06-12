import { model, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

const UsersSchema = new Schema(
  {
    matric: {
      type: String,
      unique: true,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    status: {
      type: Boolean,
      required: true,
      default: true
    },
    department: {
      type: String,
      required: true
    },
    faculty: {
      type: String,
      required: true
    },
    exam: {
      examId: {
        type: Schema.Types.ObjectId
      },
      instructions: {
        type: String
      },
      title: {
        type: String
      },
      timeStart: {
        type: Number,
        default: Date.now()
      },
      answered: [
        {
          questionId: { type: Schema.Types.ObjectId },
          answer: String
        }
      ],
      timeAllowed: Number,
      inProgress: {
        type: Boolean,
        default: false
      },
      questions: [
        {
          questionId: Schema.Types.ObjectId,
          type: {
            type: Boolean,
            default: true
          },
          question: {
            type: String,
            required: true
          },
          options: {
            a: {
              type: String,
              required: true
            },
            b: {
              type: String,
              required: true
            },
            c: {
              type: String,
              required: true
            },
            d: {
              type: String,
              required: true
            }
          }
        }
      ]
    },
    name: {
      required: true,
      type: String
    },
    exams: [
      {
        examId: {
          type: Schema.Types.ObjectId,
          required: true,
          ref: 'exams'
        },
        sheduledfor: {
          type: Number,
          required: true
        },
        submitted: {
          type: Boolean,
          default: false,
          required: true
        },
        inProgress: {
          type: Boolean,
          default: false
        },
        answers: [
          {
            question: { type: Schema.Types.ObjectId },
            answer: String
          }
        ]
      }
    ]
  },
  { timestamps: true }
);

UsersSchema.pre('save', async function preSave(next) {
  if (!this.isModified('password')) return next();
  try {
    this.matric = this.matric.toLowerCase();
    this.password = await this.encryptPassword(this.password);
    return next();
  } catch (err) {
    return next(err);
  }
});

UsersSchema.methods = {
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
    delete userObject.exam;
    delete userObject.exams;
    delete userObject.password;
    return userObject;
  }
};

module.exports = model('users', UsersSchema);
