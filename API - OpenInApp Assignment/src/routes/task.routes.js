import { Router } from "express";
import {
  createTask,
  deleteTask,
  updateTask,
} from "../controllers/task.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

// all secured routes
router.route("/create-task").post(createTask);
router.route("/update-task/:task_id").patch(updateTask);
router.route("/delete-task/:task_id").delete(deleteTask);

export default router;
