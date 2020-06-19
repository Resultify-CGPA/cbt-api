import { model, Schema } from 'mongoose';

const ExamsModel = new Schema(
  {
    course: {
      type: String,
      required: true
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
        submitted: {
          type: Boolean,
          default: false
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
        questionFor: [
          {
            faculty: {
              type: Schema.Types.ObjectId,
              ref: 'faculty'
            },
            department: {
              type: Schema.Types.ObjectId,
              ref: 'department'
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

export default model('exams', ExamsModel);
