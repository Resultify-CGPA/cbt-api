import { model, Schema } from 'mongoose';

const FacultySchema = new Schema(
  {
    status: {
      type: Boolean,
      default: true
    },
    faculty: {
      type: String,
      required: true,
      unique: true
    }
  },
  { timestamps: true }
);

export default model('faculty', FacultySchema);
