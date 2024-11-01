const mongoose = require("mongoose");

const CalculatedPropertySchema = new mongoose.Schema({
  AGENT_REF: String,
  PREV_PRICE: String,
  CURR_PRICE: String,
  STATUS: String,
});

const CalculatedPropertyModel = mongoose.model(
  "calculatedProperties",
  CalculatedPropertySchema
);

module.exports = CalculatedPropertyModel;
// export default PropertyModel;
