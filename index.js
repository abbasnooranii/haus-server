// const express = require("express");
// const cors = require("cors");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const mongoose = require("mongoose");
const fs = require("fs");
const PropertyModel = require("./models/PropertyModel.js");
const propertyRouter = require("./routers/propertyRouter.js");
const path = require("path");

const app = express();
const port = process.env.PORT || 5000;
const blmPath = "./up/115_111_01.BLM";

// Middlewares
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "https://haus-01.netlify.app"],
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.send("Server is running here...");
});

// Serving the images
app.use("/api/images", express.static(path.join(__dirname, "up")));

app.use("/property", propertyRouter);

app.get("/restore-data", (req, res) => {
  const data = fs.readFile(blmPath, "utf8", async (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return res.json({ message: "Something went wrong..!" });
    }

    // Split file content by lines
    const lines = data.split("\n");
    //   console.log("First 10 lines:", lines.slice(0, 10));

    // Assuming metadata is within the first few lines
    const metadata = lines.slice(0, 5);

    // Find the line starting with '#DEFINITION#' and extract columns
    const definitionIndex = lines.findIndex((line) =>
      line.includes("#DEFINITION#")
    );
    const columns = lines[definitionIndex + 1].trim().split("^");
    // //   console.log("Columns:", columns);

    // // ------Getting the actual data
    const dataStartIndex =
      lines.findIndex((line) => line.includes("#DATA#")) + 1;
    const dataLines = lines.slice(dataStartIndex);

    const records = dataLines
      .map((line) => {
        if (line.trim() === "") return null;
        const fields = line.trim().split("^");
        return fields.reduce((obj, field, index) => {
          obj[columns[index]] = field;
          return obj;
        }, {});
      })
      .filter((record) => record !== null);

    const properties = new PropertyModel(records);
    await properties.save();

    // return "Parsed Data:", records.slice(0, 5); // Display first 5 records
    return res.json(records);
  });
});

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

app.listen(port, () => {
  connect();
  console.log("Server started successfully");
});
