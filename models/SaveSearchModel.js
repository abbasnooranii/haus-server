const { Schema, default: mongoose } = require("mongoose");

const SaveSearchSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "users" },
  type: String,
  bedRooms: Array,
  min_price: Number,
  max_price: Number,
  property_type: String,
  location: String,
});

const SaveSearch = new mongoose.model("saveSearches", SaveSearchSchema);

module.exports = SaveSearch;
