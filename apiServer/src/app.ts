import express from "express";
import cors from "cors";
import { envVariables } from "./config/envVariables";
import cookieParser from "cookie-parser";

const app = express();

app.use(
    cors({
        origin: envVariables.corsOrigin,
        credentials: true,
    })
);

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

app.use(express.static("public"));
app.use(cookieParser());


import { userRouter } from "./routes/routes.user";
app.use("/api/v1/user", userRouter);

import { publicKeyRouter } from "./routes/routes.publicKey";
app.use("/api/v1/account", publicKeyRouter);

export {
    app
}

