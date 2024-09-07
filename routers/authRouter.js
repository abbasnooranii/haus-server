const { Router } = require("express");
const User = require("../models/UserModel");
const bcrypt = require("bcrypt");

const authRouter = Router();

authRouter.post("/signup", async (req, res) => {
  const reqBody = req.body;
  const exists = await User.findOne({ email: reqBody.email });
  if (exists) {
    return res.json({ message: "User Already exists" }, { status: 403 });
  }
  const salt = bcrypt.genSaltSync(parseInt(process.env.BCRYPT_SALT));
  const hashedPassword = bcrypt.hashSync(reqBody.password, salt);

  const user = new User({
    ...reqBody,
    password: hashedPassword,
  });
  await user.save();
  return res.json({ message: "User Created successfully" });
});

module.exports = authRouter;
