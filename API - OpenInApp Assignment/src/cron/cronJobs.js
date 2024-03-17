import cron from "node-cron";

import { User } from "../models/user.model.js";
import { Task } from "../models/task.model.js";

import { makeTwilioCall } from "../utils/twilioService.js";

const getNewPriority = (dueDate) => {
  const today = new Date();

  const time_diff = dueDate.getTime() - today.getTime();
  const day_diff = Math.floor(time_diff / (1000 * 3600 * 24));

  if (day_diff <= 0) {
    return 0;
  } else if (day_diff <= 2) {
    return 1;
  } else if (day_diff <= 4) {
    return 2;
  } else {
    return 3;
  }
};

const updateTasksPriority = async () => {
  const tasks = await Task.find({});

  // console.log(tasks);

  if (!tasks) return;

  const bulkUpdate = tasks.map((task) => ({
    updateOne: {
      filter: { _id: task._id },
      update: { $set: { priority: getNewPriority(task.due_date) } },
    },
  }));

  if (bulkUpdate.length > 0) {
    await Task.bulkWrite(bulkUpdate);
  }

  // console.log(tasks);
};

const callUserOnPriority = async () => {
  const users = await User.find({}, { taskHistory: 1, phone: 1 });

  const today = new Date();

  const priorities = {};

  // console.log(users.taskHistory);
  // console.log(users);
  // console.log(today);

  for (const user of users) {
    for (const taskId of user.taskHistory) {
      // console.log(taskId);

      const task = await Task.findById(taskId);
      // console.log(task);

      if (!task) continue;

      const dueDate = task.due_date;

      const time_diff = dueDate.getTime() - today.getTime();
      const day_diff = Math.floor(time_diff / (1000 * 3600 * 24));

      if (day_diff < 0) {
        if (!priorities[user.priority]) {
          priorities[user.priority] = new Set();
        }

        // console.log(user.phone);
        priorities[user.priority].add(user.phone);
      }
    }
  }

  console.log(priorities);

  const calls = [];
  for (const userPriority of Object.values(priorities)) {
    for (const phone of userPriority) {
      // console.log(phone);

      calls.push(makeTwilioCall(phone));
    }
  }

  await Promise.all(calls);
};

const runCronJobs = async () => {
  cron.schedule("* * * * *", async () => {
    try {
      await updateTasksPriority();
    } catch (error) {
      console.error("Error updating task priorities: ", error);
    }
  });

  cron.schedule("* * * * *", async () => {
    try {
      await callUserOnPriority();
    } catch (error) {
      console.error("Error calling users based on priority: ", error);
    }
  });
};

export default runCronJobs;
