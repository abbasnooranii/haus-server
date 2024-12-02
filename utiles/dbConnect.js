const mongoose = require("mongoose");

const connect = async () => {
  try {
    await mongoose.connect(
      `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@haus.61i55.mongodb.net/?retryWrites=true&w=majority&appName=haus`
    );
    console.log("Connected with the database successfully");
  } catch (error) {
    console.log(error);
  }
};

module.exports = connect;
