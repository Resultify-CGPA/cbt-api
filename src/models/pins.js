import { model, Schema } from 'mongoose';

const PinsSchema = new Schema(
  {
    pin: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

export default model('pin', PinsSchema);
