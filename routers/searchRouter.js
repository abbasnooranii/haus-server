const { Router } = require("express");
const verifyToken = require("../utiles/middleware");
const User = require("../models/UserModel");
const SaveSearch = require("../models/SaveSearchModel");

const searchRouter = Router();

searchRouter.post("/", verifyToken, async (req, res) => {
  const reqBody = req.body;
  //   Fetching the user
  const { email } = req.user;
  const user = await User.findOne({ email });

  //   Creating the  Save Search document
  const saveSearch = new SaveSearch({
    user_id: user._id,
    ...reqBody,
  });
  await saveSearch.save();

  user.saved_searches.push(saveSearch._id);
  await user.save();

  return res.json({ message: "Search Saved", success: true });
});

searchRouter.get("/", verifyToken, async (req, res) => {
  const { email } = req.user;
  const user = await User.findOne({ email }).populate("saved_searches");
  console.log(user.saved_searches);
  return res.json({ message: "Successfull", success: true });
});

module.exports = searchRouter;
