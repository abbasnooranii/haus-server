const mongoose = require("mongoose");

const UserSavedPropertySchema = new mongoose.Schema({
  USER_EMAIL: String,
  AGENT_REF: String,
  PRICE: String,
});

const UserSavedPropertyModel = mongoose.model(
  "userSavedProperties",
  UserSavedPropertySchema
);

module.exports = UserSavedPropertyModel;
// export default PropertyModel;
