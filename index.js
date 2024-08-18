import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import mongoose from "mongoose";
import PropertyModel from "./models/PropertyModel.js";
import propertyRouter from "./routers/propertyRouter.js";
const path = "./up/115_111_01.BLM";
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(express.json());
app.use(cors());

app.use("/property", propertyRouter);

app.get("/", (req, res) => {
  res.send("Haus server is running here....");
});

app.get("/restore-data", (req, res) => {
  const data = fs.readFile(path, "utf8", async (err, data) => {
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
