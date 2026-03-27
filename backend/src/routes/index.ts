import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth.js";
import tasksRouter from "./tasks.js";
import usersRouter from "./users.js";
import activityRouter from "./activity.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/tasks", tasksRouter);
router.use("/users", usersRouter);
router.use("/activity", activityRouter);

export default router;
