import { Router } from "express";
import { adminRouter } from "./admin.routes";
import { aiRouter } from "./ai.routes";
import { authRouter } from "./auth.routes";
import { ngoRouter } from "./ngo.routes";
import { metaRouter } from "./meta.routes";
import { notificationRouter } from "./notification.routes";
import { reportRouter } from "./report.routes";
import { surveyorRouter } from "./surveyor.routes";
import { volunteerRouter } from "./volunteer.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/meta", metaRouter);
apiRouter.use("/reports", reportRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/ngo", ngoRouter);
apiRouter.use("/surveyor", surveyorRouter);
apiRouter.use("/volunteer", volunteerRouter);
apiRouter.use("/ai", aiRouter);
apiRouter.use("/notifications", notificationRouter);
