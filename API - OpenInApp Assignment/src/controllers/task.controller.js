import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

import { Task } from "../models/task.model.js";
import { User } from "../models/user.model.js";

const createTask = asyncHandler(async (req, res) => {
  let { title, description, due_date } = req.body;

  due_date = new Date(due_date);

  console.log(req.body);

  if (!title || !description || !due_date) {
    throw new apiError(400, "All fields are Required!!");
  }

  const task = await Task.create({
    title,
    description,
    due_date,
  });

  console.log(task);

  const theTask = await Task.findById(task._id);

  if (!theTask) {
    throw new apiError(500, "Something went wrong while registering the task.");
  }

  console.log(theTask);

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $push: {
        taskHistory: task._id,
      },
    },
    { new: true }
  );

  console.log(user);

  return res
    .status(201)
    .json(new apiResponse(200, theTask, "Task successfully registered!!"));
});

const updateTask = asyncHandler(async (req, res) => {
  const { title, description, due_date } = req.body;
  const { task_id } = req.params;

  console.log(req.params);
  console.log(task_id);

  if (!task_id) {
    throw new apiError(500, "Task Id is required !!");
  }

  const task = await Task.findByIdAndUpdate(
    task_id,
    {
      $set: {
        title,
        description,
        due_date,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new apiResponse(200, task, "Task details successfully updated !!"));
});

const deleteTask = asyncHandler(async (req, res) => {
  const { task_id } = req.params;

  console.log(task_id);

  const task = await Task.findByIdAndDelete(task_id);

  if (!task) {
    return res.status(404).json({ message: "Task not registered !!" });
  }

  console.log(task);

  await User.findByIdAndUpdate(req.user?._id, {
    $pull: { taskHistory: task_id },
  });

  return res
    .status(200)
    .json(new apiResponse(200, task, "Task deleted successfully"));
});

export { createTask, updateTask, deleteTask };
