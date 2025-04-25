import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";
import GithubStrategy from "passport-github2";
import dotenv from 'dotenv';
import User from "../models/user.js";
dotenv.config();

passport.serializeUser((user, id) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id).then((user) => {
    done(null, user);
  });
});

//google strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, getUserProfile, done) => {
      const existingUser = await User.findOne({
        email: profile.emails[0].value,
      });
      if (existingUser) {
        return done(null, existingUser);
      }
      const user = await User.create({
        name: profile.displayName,
        email: profile.emails[0].value,
        password: "google_oauth_no_passowrd",
      });
      done(null, user);
    }
  )
);

//github strategy
passport.use(
  new GithubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "/api/auth/github/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      const existingUser = await User.findOne({
        email: profile.emails[0].value,
      });
      if (existingUser) {
        return done(null, existingUser);
      }
      const user = User.create({
        name: profile.displayName,
        email: profile.emails[0].value,
        password: "github_oauth_no_password",
      });
      done(null, user);
    }
  )
);
