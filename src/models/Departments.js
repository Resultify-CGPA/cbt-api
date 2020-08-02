import { model, Schema } from 'mongoose';

const DepartmentSchema = new Schema(
  {
    status: {
      type: Boolean,
      default: true
    },
    department: {
      type: String,
      required: true
    },
    faculty: {
      type: Schema.Types.ObjectId,
      ref: 'pre-cbt-app-faculty'
    }
  },
  { timestamps: true }
);

export default model('pre-cbt-app-department', DepartmentSchema);
