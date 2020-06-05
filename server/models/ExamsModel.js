const { model, Schema } = require("mongoose");

const ExamsModel = new Schema({
  course: {
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
  title: {
    type: String,
    required: true,
  },
  time_allowed: {
    type: Number,
    required: true,
  },
  created_at: {
    required: true,
    type: Number,
  },
  updated_at: {
    required: true,
    type: Number,
  },
  questions_per_student: {
    required: true,
    type: Number,
  },
  questions: [
    {
      type: {
        type: Boolean,
        default: true,
      },
      correct: {
        type: String,
        required: true,
        default: "a",
      },
      question: {
        type: String,
        required: true,
      },
      options: {
        a: {
          type: String,
          required: true,
        },
        b: {
          type: String,
          required: true,
        },
        c: {
          type: String,
          required: true,
        },
        d: {
          type: String,
          required: true,
        },
      },
    },
  ],
});

ExamsModel.pre("save", function (next) {
  delete this.updated_at;
  this.updated_at = Date.now();
  next();
});

module.exports = model("exams", ExamsModel);
