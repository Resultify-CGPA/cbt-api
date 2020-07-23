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
          required: true,
          unique: true,
          sparse: true
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
      default: 0,
      max: 30
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

BiodataSchema.pre('save', async function preSave(next) {
  this.ca = this.ca > 30 ? 30 : this.ca;
  this.exam = this.exam > 70 ? 70 : this.exam;
  return next();
});

export default model('biodata', BiodataSchema);
