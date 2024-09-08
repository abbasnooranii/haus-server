const { Router } = require("express");
const verifyToken = require("../utiles/middleware");
const User = require("../models/UserModel");
const PropertyModel = require("../models/PropertyModel");

const userRouter = Router();

userRouter.get("/", verifyToken, async (req, res) => {
  try {
    const { email } = req.user;
    const user = await User.findOne({ email });
    return res.send({ message: "User found", success: true, user });
  } catch (error) {
    console.log(error);
    return res.status(403).send({ message: "Something went wrong" });
  }
});

userRouter.get("/saved-properties", verifyToken, async (req, res) => {
  try {
    const { email } = req.user;
    const user = await User.findOne({ email });

    const properties = await Promise.all(
      user.saved_properties.map(async (pro) => {
        const property = await PropertyModel.findOne({ AGENT_REF: pro });
        return property;
      })
    );

    return res.send(properties);
  } catch (error) {
    console.log(error);
    return res.status(403).send({ message: "Something went wrong" });
  }
});
userRouter.post("/save-property", verifyToken, async (req, res) => {
  try {
    const { AGENT_REF } = req.body;
    const { email } = req.user;
    const user = await User.findOne({ email });
    const propertyExists = user.saved_properties.includes(AGENT_REF);
    if (!propertyExists) {
      user.saved_properties
        ? user.saved_properties.push(AGENT_REF)
        : (user.saved_properties = [AGENT_REF]);
      await user.save();
      return res.send({ message: "Property Added" });
    } else {
      return res.status(202).send({ message: "Property already exists" });
    }
  } catch (error) {
    console.log(error);
    return res.status(403).send({ message: "Something went wrong" });
  }
});
userRouter.post("/unsave-property", verifyToken, async (req, res) => {
  try {
    const { AGENT_REF } = req.body;
    const { email } = req.user;
    const user = await User.findOne({ email });
    const propertyExists = user.saved_properties.includes(AGENT_REF);
    if (propertyExists) {
      user.saved_properties
        ? (user.saved_properties = user.saved_properties.filter(
            (pro) => pro !== AGENT_REF
          ))
        : (user.saved_properties = []);

      await user.save();
      return res.send({ message: "Removed from saved" });
    } else {
      return res
        .status(202)
        .send({ message: "Property does not exists on save" });
    }
  } catch (error) {
    console.log(error);
    return res.status(403).send({ message: "Something went wrong" });
  }
});

module.exports = userRouter;
