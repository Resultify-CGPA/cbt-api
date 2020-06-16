import { model, Schema } from 'mongoose';

const UsersSchema = new Schema(
  {
    matric: {
      type: String,
      unique: true,
      required: true
    },
    status: {
      type: Boolean,
      required: true,
      default: true
    },
    department: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'department'
    },
    faculty: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'faculty'
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
  if (!this.isModified('matric')) return next();
  try {
    this.matric = this.matric.toLowerCase();
    return next();
  } catch (err) {
    return next(err);
  }
});

UsersSchema.methods = {
  toJson: function toJson() {
    const userObject = this.toObject();
    delete userObject.exam;
    delete userObject.exams;
    return userObject;
  }
};

module.exports = model('users', UsersSchema);
