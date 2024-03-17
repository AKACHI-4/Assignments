import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// from where we respond and request
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// json data limit
app.use(
  express.json({
    limit: "16kb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);
/* extended meant to be object inside object.. */

/* for publically store files and pdfs */
app.use(express.static("public"));

/* to securly use cookies of user ( crud operation on them basically ) */
app.use(cookieParser());

// routes import -- not weird man -- it's production setting suree.
import userRouter from "./routes/user.routes.js";
import taskRouter from "./routes/task.routes.js";
import subtaskRouter from "./routes/subtask.routes.js";

/*
router declaration -- controller and routes are not in same place now -- need of middleware arise 
we are using app.use() here though
*/

app.use("/api/v1/users", userRouter);
app.use("/api/v1/tasks", taskRouter);
app.use("/api/v1/tasks/:task_id/subtasks", subtaskRouter);

export { app };
