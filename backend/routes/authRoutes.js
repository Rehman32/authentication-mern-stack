import express from 'express';
import passport from 'passport';
import {registerUser,loginUser,getUserProfile,verifyOtp,refreshAccessToken,logoutUser} from "../controllers/authControllers.js";
import protect from "../middlewares/authmiddleware.js";

const router =express.Router();

router.post('/register',registerUser);
router.post('/login',loginUser);
router.post("/verify-otp", verifyOtp);
router.get('/profile',protect,getUserProfile); //protected Route
router.get("/refresh-token", refreshAccessToken);
router.post("/logout", logoutUser);

//Google 
router.get('/google',passport.authenticate('google',{scope: ["profile","email"]}));
router.get('/google/callback',passport.authenticate("google",{
    failureRedirect:"/login",
    successRedirect:'/dashboard'
}));

// GITHUB
router.get("/github", passport.authenticate("github", { scope: ["user:email"] }));
router.get("/github/callback", passport.authenticate("github", {
  failureRedirect: "/login",
  successRedirect: "/dashboard"
}));

//refresh token
router.get("/refresh-token", async (req, res) => {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: "No refresh token" });
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      const accessToken = generateAccessToken(decoded.id);
      res.status(200).json({ token: accessToken });
    } catch (err) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }
  });
  

export default router;