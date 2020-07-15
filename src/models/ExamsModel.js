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
    }
  },
  {
    timestamps: true
  }
);

export default model('exams', ExamsModel);
