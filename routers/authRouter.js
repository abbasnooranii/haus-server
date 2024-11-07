const { Router } = require("express");
const User = require("../models/UserModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const authRouter = Router();

const cookieOption = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};

authRouter.post("/signup", async (req, res) => {
  try {
    const reqBody = req.body;
    const exists = await User.findOne({ email: reqBody.email });
    if (exists) {
      return res.status(403).json({ message: "User Already exists" });
    }

    const user = new User({
      ...reqBody,
    });
    await user.save();
    return res.json({ message: "User Created successfully" });
  } catch (error) {
    console.log(error);
    return res.status(403).send({ message: "Something went wrong" });
  }
});

authRouter.post("/jwt", async (req, res) => {
  try {
    const user = req.body;
    const token = jwt.sign(user, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });
    res.cookie("haus_token", token, cookieOption).send({ succcess: true });
  } catch (error) {
    console.log(error);
    return res.status(403).send({ message: "Something went wrong" });
  }
});

authRouter.get("/logout", (req, res) => {
  res
    .clearCookie("haus_token", { ...cookieOption, maxAge: 0 })
    .send({ success: true });
});
module.exports = authRouter;
