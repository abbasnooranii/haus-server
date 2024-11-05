const { Router } = require("express");
const verifyToken = require("../utiles/middleware");
const User = require("../models/UserModel");
const SaveSearch = require("../models/SaveSearchModel");
const mongodb = require("mongodb");
const jwt = require("jsonwebtoken");
const getFilterObj = require("../utiles/getFilterObj");
const PropertyModel = require("../models/PropertyModel");
const UserSavedPropertyModel = require("../models/UserSavedPropertiesModel");

const searchRouter = Router();

searchRouter.post("/", verifyToken, async (req, res) => {
  const reqBody = req.body;
  //   Fetching the user
  const { email } = req.user;
  const user = await User.findOne({ email });

  // ------- Saving the Search----------
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

  // ----------------Saving the Search Results-----------
  // const allSearches = await SaveSearch.find({ user_id: user._id });
  const query = {
    ...reqBody,
    agent_ref: reqBody.type === "to_let" ? "r" : "s",
    badrooms: reqBody.bedRooms.join(","),
    prop_sub_id: reqBody.property_type,
    max_price: reqBody.max_price.toString(),
    min_price: reqBody.min_price.toString(),
  };
  const filter = getFilterObj(query);

  const SearchedProperties = await PropertyModel.find(filter);

  for (let property of SearchedProperties) {
    const filter2 = {
      USER_EMAIL: email,
      AGENT_REF: property.AGENT_REF,
    };
    const savedProperty = await UserSavedPropertyModel.findOne(filter2);

    if (!savedProperty) {
      const newSavePro = new UserSavedPropertyModel({
        ...filter2,
        PRICE: property.PRICE,
      });
      await newSavePro.save();
    } else {
      // console.log(property.AGENT_REF);
    }
  }

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
  let tokenUser = {};

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      console.log(err);
      return res.status(401).send({ message: "Unauthorized access!" });
    }
    tokenUser = decoded;
  });

  const { email } = tokenUser;
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
