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
const nodemailer = require("nodemailer");
const Handlebars = require("handlebars");
const cron = require("node-cron");

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

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

app.get("/", (req, res) => {
  res.send("Server is running here...");
});

// Serving the images
app.use("/api/images", express.static(path.join(__dirname, "up")));

app.use("/property", propertyRouter);

// Email Routes
app.post("/send-rafer-mail", async (req, res) => {
  try {
    const {
      which_area,
      landlord_or_seller,
      student_or_not,
      owner_name,
      owner_phone,
      owner_email,
      owner_address,
      user_name,
      user_phone,
      user_email,
      user_address,
    } = req.body;
    if (
      !which_area ||
      !landlord_or_seller ||
      !student_or_not ||
      !owner_name ||
      !owner_phone ||
      !owner_email ||
      !owner_address ||
      !user_name ||
      !user_phone ||
      !user_email ||
      !user_address
    ) {
      return res
        .status(400)
        .json({ message: "Please provide all the required fields" });
    }

    const source = fs
      .readFileSync("email-templates/template1.html", "utf-8")
      .toString();
    const template = Handlebars.compile(source);
    const replacements = {
      which_area,
      landlord_or_seller,
      student_or_not,
      owner_name,
      owner_phone,
      owner_email,
      owner_address,
      user_name,
      user_phone,
      user_email,
      user_address,
    };
    const htmlToSend = template(replacements);

    const info = await transporter.sendMail({
      from: '"Haus" <haus@property.email>', // sender address
      to: "mahidunnobi2019@gmail.com", // list of receivers
      subject: "Referral Form Submission", // Subject line
      html: htmlToSend, // html body
    });
    res.send({ message: "Message sent", info });
    // res.send({ message: "Message sent", reqBody });
  } catch (error) {
    console.log(error);
    res.send({ message: "Something went wrong", error });
  }
});
app.post("/send-touch-mail", async (req, res) => {
  try {
    const reqBody = req.body;

    const { name, email, phone_number, property_id, message } = req.body;
    if (!name || !email || !phone_number || !property_id || !message) {
      return res
        .status(400)
        .json({ message: "Please provide all the required fields" });
    }

    const source = fs
      .readFileSync("email-templates/template2.html", "utf-8")
      .toString();
    const template = Handlebars.compile(source);
    const replacements = {
      name,
      email,
      phone_number,
      property_id,
      message,
    };
    const htmlToSend = template(replacements);

    const info = await transporter.sendMail({
      from: '"Haus" <haus@property.email>', // sender address
      to: "mahidunnobi2019@gmail.com", // list of receivers
      subject: "Contact form", // Subject line
      html: htmlToSend, // html body
    });
    res.send({ message: "Message sent", info });
    // res.send({ message: "Message sent", reqBody });
  } catch (error) {
    console.log(error);
    res.send({ message: "Something went wrong", error });
  }
});
app.post("/send-ready-mail", async (req, res) => {
  try {
    const reqBody = req.body;
    const { name, email, phone_number, area, message } = req.body;
    if (!name || !email || !area || !area || !message) {
      return res
        .status(400)
        .json({ message: "Please provide all the required fields" });
    }

    const source = fs
      .readFileSync("email-templates/template3.html", "utf-8")
      .toString();
    const template = Handlebars.compile(source);
    const replacements = {
      name,
      email,
      phone_number,
      area,
      message,
    };
    const htmlToSend = template(replacements);

    const info = await transporter.sendMail({
      from: '"Haus" <haus@property.email>', // sender address
      to: "mahidunnobi2019@gmail.com", // list of receivers
      subject: "Contact form", // Subject line
      html: htmlToSend, // html body
    });
    res.send({ message: "Message sent", info });
    // res.send({ message: "Message sent", reqBody });
  } catch (error) {
    console.log(error);
    res.send({ message: "Something went wrong", error });
  }
});

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

    const deleteRes = await PropertyModel.deleteMany();
    const properties = await PropertyModel.insertMany(records);

    // return "Parsed Data:", records.slice(0, 5); // Display first 5 records
    return res.json({ message: "Data Restored" });
  });
});

// Automatically data will be restored in 12:00 AM everyday
cron.schedule("0 0 * * *", () => {
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

    const deleteRes = await PropertyModel.deleteMany();
    const properties = await PropertyModel.insertMany(records);

    // return "Parsed Data:", records.slice(0, 5); // Display first 5 records
    console.log("Data Restored");
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
