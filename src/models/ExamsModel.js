import { model, Schema } from 'mongoose';

const ExamsModel = new Schema(
  {
    course: {
      type: String,
      required: true
    },
    status: {
      type: Boolean,
      default: true
    },
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
    questions: [
      {
        type: {
          type: Boolean,
          default: true
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
