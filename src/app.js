import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();
// Configure Middlewares
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials : true
}));
app.use(cookieParser());
app.use(express.json({limit:"50kb"}));
app.use(express.urlencoded({ extended: true, limit:"50kb"}));
app.use(express.static("public"));
export{app}