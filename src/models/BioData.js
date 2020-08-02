import { model, Schema } from 'mongoose';

const BiodataSchema = new Schema(
  {
    examId: {
      type: Schema.Types.ObjectId,
      ref: 'pre-cbt-app-exams'
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'pre-cbt-app-users'
    },
    questions: [
      {
        questionId: {
          type: Schema.Types.ObjectId,
          ref: 'pre-cbt-app-question',
          required: true
        }
      }
    ],
    answered: [
      {
        questionId: {
          type: Schema.Types.ObjectId,
          ref: 'pre-cbt-app-question',
          required: true
        },
        answer: {
          type: String,
          required: true
        }
      }
    ],
    ca: {
      type: Number,
      default: 0,
      max: 50
    },
    timeStart: {
      type: Date
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
  },
  { timestamps: true }
);

export default model('pre-cbt-app-biodata', BiodataSchema);
