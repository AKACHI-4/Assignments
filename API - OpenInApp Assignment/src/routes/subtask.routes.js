import { Router } from "express";
import {
  createSubTask,
  deleteSubTask,
  updateSubTask,
} from "../controllers/subtask.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router({ mergeParams: true });

router.use(verifyJWT);

// all secured routes
router.route("/create-subtask").post(createSubTask);
router.route("/update-subtask/:subtask_id").patch(updateSubTask);
router.route("/delete-subtask/:subtask_id").delete(deleteSubTask);

export default router;
