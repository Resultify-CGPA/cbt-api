import { model, Schema } from 'mongoose';

const UsersSchema = new Schema(
  {
    avatar: {
      type: String
    },
    matric: {
      type: String,
      unique: true,
      required: true
    },
    status: {
      type: Boolean,
      required: true,
      default: true
    },
    department: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'department'
    },
    faculty: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'faculty'
    },
    level: {
      type: Number,
      required: true
    },
    name: {
      required: true,
      type: String
    }
  },
  { timestamps: true }
);

UsersSchema.pre('save', async function preSave(next) {
  if (!this.isModified('matric')) return next();
  try {
    this.matric = this.matric.toLowerCase();
    return next();
  } catch (err) {
    return next(err);
  }
});

UsersSchema.methods = {
  toJson: function toJson() {
    return this;
  }
};

module.exports = model('users', UsersSchema);
