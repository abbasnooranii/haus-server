const { Router } = require("express");
const verifyToken = require("../utiles/middleware");
const User = require("../models/UserModel");

const alertRouter = Router();

alertRouter.post("/", verifyToken, async (req, res) => {
  try {
    const { email } = req.user;
    const { alert } = req.body;
    if (!email || !alert) {
      return res.status(404).json({ message: "Email or alert type not found" });
    }
    const user = await User.findOne({ email });
    user.alert_type = alert;

    await user.save();

    if (alert === "never") {
      return res.json({ message: "You will never get any alert." });
    }

    return res.json({ message: `You will get alert ${alert}` });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong", error });
  }
});

module.exports = alertRouter;
