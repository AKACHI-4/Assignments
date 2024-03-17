import mongoose, { Schema } from "mongoose";

const subtaskSchema = new Schema(
  {
    text: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: Number,
      enum: [0, 1],
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Subtask = mongoose.model("Subtask", subtaskSchema);
