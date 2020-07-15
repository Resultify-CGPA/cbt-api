import { model, Schema } from 'mongoose';

const QuestionSchema = new Schema(
  {
    examId: {
      type: Schema.Types.ObjectId,
      ref: 'exams'
    },
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
        type: String || Boolean || Number,
        required: true
      },
      b: {
        type: String || Boolean || Number,
        required: true
      },
      c: {
        type: String || Boolean || Number
      },
      d: {
        type: String || Boolean || Number
      },
      e: {
        type: String || Boolean || Number
      },
      f: {
        type: String || Boolean || Number
      }
    }
  },
  { timestamps: true }
);

export default model('question', QuestionSchema);
