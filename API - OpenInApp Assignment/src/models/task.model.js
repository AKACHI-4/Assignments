import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const taskSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    due_date: {
      type: Date,
      required: true,
    },
    priority: {
      type: Number,
      min: 0,
      max: 3,
    },
    subtaskHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Subtask",
      },
    ],
    status: {
      type: String,
      enum: ["TODO", "IN-PROGRESS", "DONE"],
      default: "TODO",
    },
  },
  {
    timestamps: true,
  }
);

taskSchema.pre("save", async function (next) {
  const today = new Date();

  const time_diff = this.due_date.getTime() - today.getTime();
  const day_diff = Math.floor(time_diff / (1000 * 3600 * 24));

  if (day_diff <= 0) {
    this.priority = 0;
  } else if (day_diff <= 2) {
    this.priority = 1;
  } else if (day_diff <= 4) {
    this.priority = 2;
  } else {
    this.priority = 3;
  }

  next();
});

taskSchema.plugin(mongooseAggregatePaginate);

export const Task = mongoose.model("Task", taskSchema);
