const { Router } = require("express");
const verifyToken = require("../utiles/middleware");
const User = require("../models/UserModel");
const SaveSearch = require("../models/SaveSearchModel");
const mongodb = require("mongodb");

const searchRouter = Router();

searchRouter.post("/", verifyToken, async (req, res) => {
  const reqBody = req.body;
  //   Fetching the user
  const { email } = req.user;
  const user = await User.findOne({ email });

  //   Creating the  Save Search document
  const saveSearch = new SaveSearch({
    user_id: user._id,
    type: reqBody.type,
    bedRooms: reqBody.bedRooms,
    min_price: reqBody.min_price,
    max_price: reqBody.max_price,
    location: reqBody.location,
    property_type: reqBody.property_type,
  });
  await saveSearch.save();

  user.saved_searches.push(saveSearch._id);
  await user.save();

  return res.json({
    message: "Search Saved",
    success: true,
    id: saveSearch._id,
  });
});

searchRouter.get("/", verifyToken, async (req, res) => {
  const { email } = req.user;
  const user = await User.findOne({ email });
  const savedSearches = await SaveSearch.find({ user_id: user._id });
  return res.json(savedSearches);
});

searchRouter.delete("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  const { email } = req.user;
  const user = await User.findOne({ email });

  const saveSearch = await SaveSearch.findOne({
    _id: new mongodb.ObjectId(id),
  });
  // Removing the search id from user object document
  const newSaveSearch = user.saved_searches.filter((rid) => rid != id);

  user.saved_searches = newSaveSearch;
  await user.save();

  const deleteRes = await saveSearch.deleteOne();

  if (deleteRes.deletedCount > 0) {
    return res.json({ message: "Search removed successfully", success: true });
  }

  return res.json({
    message: "Something went wrong removing search",
    success: false,
  });
});

searchRouter.post("/check", async (req, res) => {
  const token = req.cookies.haus_token;
  if (!token) {
    return res.send({ message: "User not logged in yet." });
  }
  const reqBody = req.body;
  //   Fetching the user
  const { email } = req.user;
  const user = await User.findOne({ email });

  //   Creating the  Save Search document
  const saveSearch = await SaveSearch.findOne({
    user_id: user._id,
    type: reqBody.type,
    bedRooms: reqBody.bedRooms,
    min_price: reqBody.min_price,
    max_price: reqBody.max_price,
    location: reqBody.location,
    property_type: reqBody.property_type,
  });

  if (!saveSearch) {
    return res.json({ message: "Search not saved", success: false });
  }
  return res.json({
    message: "Search found",
    success: true,
    id: saveSearch._id,
  });
});

module.exports = searchRouter;
