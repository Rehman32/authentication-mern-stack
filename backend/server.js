import express from "express";
import dotenv from "dotenv";
import passport from "passport";
import session from "express-session";
import './config/passport.js';
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import cookieParser from "cookie-parser";

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET, // use env in prod
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV , // true in production with HTTPS
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    }
  }));
  
app.use(passport.initialize());
app.use(passport.session());
app.use('/api/auth',authRoutes);

app.get("/", (req, res) => res.send("API is running..."));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
