const mongoose = require("mongoose");

const connect = async () => {
  try {
    await mongoose.connect(
      `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.cxk7yn6.mongodb.net/haus?retryWrites=true&w=majority&appName=Cluster0`
    );
    console.log("Connected with the database successfully");
  } catch (error) {
    console.log(error);
  }
};

module.exports = connect;
