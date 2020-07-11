import { model, Schema } from 'mongoose';

const ExamsModel = new Schema(
  {
    course: {
      type: String,
      required: true
    },
    docStatus: {
      type: Boolean,
      default: true
    },
    status: {
      type: Number,
      default: 0
    },
    bioData: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: 'users'
        },
        ca: {
          type: Number,
          default: 0,
          max: 30
        },
        exam: {
          type: Number,
          default: 0,
          max: 70
        },
        status: {
          type: Number,
          default: 0
        }
      }
    ],
    title: {
      type: String,
      required: true
    },
    timeAllowed: {
      type: Number,
      required: true
    },
    displayTime: {
      type: Number,
      required: true
    },
    instructions: {
      type: String,
      required: true
    },
    questionsPerStudent: {
      required: true,
      type: Number
    },
    examType: {
      type: Boolean,
      default: true
    },
    questions: [
      {
        images: [{ type: String }],
        questionFor: [
          {
            faculty: {
              type: Schema.Types.ObjectId,
              ref: 'faculty'
            }
          }
        ],
        type: {
          type: Boolean,
          default: true
        },
        marks: {
          type: Number,
          required: true
        },
        correct: {
          type: String,
          required: true,
          default: 'a'
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
  {
    timestamps: true
  }
);

ExamsModel.pre('save', async function preSave(next) {
  if (!this.isModified('bioData')) return next();
  try {
    this.bioData = this.bioData.reduce(
      (acc, cur) => [
        ...acc,
        {
          ...cur,
          ca: cur.ca > 30 ? 30 : cur.ca,
          exam: cur.exam > 70 ? 70 : cur.exam
        }
      ],
      []
    );
    return next();
  } catch (err) {
    return next(err);
  }
});

export default model('exams', ExamsModel);
