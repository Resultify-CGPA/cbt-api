import { model, Schema } from 'mongoose';

const BiodataSchema = new Schema(
  {
    examId: {
      type: Schema.Types.ObjectId,
      ref: 'exams'
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users'
    },
    questions: [
      {
        questionId: {
          type: Schema.Types.ObjectId,
          ref: 'question',
          required: true
        }
      }
    ],
    answered: [
      {
        questionId: {
          type: Schema.Types.ObjectId,
          ref: 'question',
          required: true,
          unique: true
        },
        answer: {
          type: String,
          required: true
        }
      }
    ],
    ca: {
      type: Number,
      default: 0
    },
    timeStart: {
      type: Date
    },
    exam: {
      type: Number,
      default: 0
    },
    status: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

export default model('biodata', BiodataSchema);
