import { model, Schema } from 'mongoose';

const PinsSchema = new Schema(
  {
    pin: {
      type: String,
      required: true
    },
    user: {
      type: Schema.Types.ObjectId,
      default: null
    }
  },
  { timestamps: true }
);

export default model('pre-cbt-app-pin', PinsSchema);
