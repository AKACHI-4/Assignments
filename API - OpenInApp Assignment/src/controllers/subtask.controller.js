import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

import { Subtask } from "../models/subtask.model.js";
import { Task } from "../models/task.model.js";

// to check if subtask belongs to given task or not
const isSubtaskBelongsToTask = async (task_id, subtask_id) => {
  const task = await Task.findById(task_id).populate("subtaskHistory");
  if (!task) {
    return false; // Task not found
  }

  return task.subtaskHistory.some(
    (subtask) => subtask._id.toString() === subtask_id
  );
};

// change status of task
const changeTaskStatus = async (task_id) => {
  const task = await Task.findById(task_id).populate("subtaskHistory");

  if (!task) throw new apiError(400, "Task Not Found !!");

  const incomplete_tasks = task.subtaskHistory.reduce((count, subtask) => {
    if (!subtask.status) count++;

    return count;
  }, 0);

  if (task.status === "TODO" && incomplete_tasks > 0) {
    task.status = "IN-PROGRESS";
  } else if (incomplete_tasks === 0) {
    task.status = "DONE";
  }

  await task.save();
};

const createSubTask = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const { task_id } = req.params;

  console.log(req.body);
  console.log(task_id);

  if (!task_id) {
    throw new apiError(400, "Task id is Required!!");
  }

  if (text.trim() === "") {
    throw new apiError(400, "All fields are Required!!");
  }

  const subtask = await Subtask.create({
    text,
  });

  console.log(subtask);

  const theSubTask = await Subtask.findById(subtask._id);

  if (!theSubTask) {
    throw new apiError(
      500,
      "Something went wrong while registering the subtask."
    );
  }

  const task = await Task.findByIdAndUpdate(
    task_id,
    {
      $push: {
        subtaskHistory: subtask._id,
      },
    },
    { new: true }
  );

  console.log(task);

  return res
    .status(201)
    .json(
      new apiResponse(200, theSubTask, "Subtask successfully registered!!")
    );
});

const updateSubTask = asyncHandler(async (req, res) => {
  const { text, status } = req.body;
  const { task_id, subtask_id } = req.params;

  if (!subtask_id) {
    throw new apiError(500, "Subtask Id is required !!");
  }

  if (!status || !text) throw new apiError(400, "All fields are required !!");

  const subtaskExist = await isSubtaskBelongsToTask(task_id, subtask_id);
  if (!subtaskExist) {
    throw new apiError(
      400,
      "Invalid Task, Subtask does not belong to this task !!"
    );
  }

  const subtask = await Subtask.findByIdAndUpdate(
    subtask_id,
    {
      $set: {
        text,
        status,
      },
    },
    { new: true }
  );

  if (!subtask) {
    throw new apiError(404, "Subtask not found !!");
  }

  console.log(subtask);

  if (status) await changeTaskStatus(task_id);

  return res
    .status(200)
    .json(
      new apiResponse(200, subtask, "SubTask details successfully updated !!")
    );
});

const deleteSubTask = asyncHandler(async (req, res) => {
  const { task_id, subtask_id } = req.params;

  console.log(task_id, subtask_id);

  const subtaskExist = await isSubtaskBelongsToTask(task_id, subtask_id);
  if (!subtaskExist) {
    throw new apiError(
      400,
      "Invalid Task, Subtask does not belong to this task !!"
    );
  }

  const subtask = await Subtask.findByIdAndDelete(subtask_id);

  if (!subtask) {
    return res.status(404).json({ message: "Subtask not registered !!" });
  }

  console.log(subtask);

  await Task.findByIdAndUpdate(task_id, {
    $pull: { subtaskHistory: subtask_id },
  });

  return res
    .status(200)
    .json(new apiResponse(200, subtask, "Task deleted successfully"));
});

export { createSubTask, updateSubTask, deleteSubTask };
