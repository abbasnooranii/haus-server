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
const authRouter = require("./routers/authRouter.js");
const cookieParser = require("cookie-parser");
const verifyToken = require("./utiles/middleware.js");
const userRouter = require("./routers/userRouter.js");
const searchRouter = require("./routers/searchRouter.js");
const retriveDataFromFile = require("./utiles/retriveData.js");

const alertRouter = require("./routers/alertRouter.js");
const priceReductionCheck = require("./utiles/priceReductionCheck.js");
const transporter = require("./utiles/emailTransportar.js");

const app = express();
const port = process.env.PORT || 5000;
const blmPath = "./up/115_111_01.BLM";

// Middlewares
app.use(express.json());
app.use(cors());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Server is running here...");
});

// Serving the images
app.use("/api/images", express.static(path.join(__dirname, "up")));

app.use("/property", propertyRouter);
app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/save-search", searchRouter);
app.use("/alert", alertRouter);

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
      to: process.env.ADMIN_REVEIVER_EMAIL, // list of receivers
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

    // console.log(process.env.ADMIN_REVEIVER_EMAIL);
    const info = await transporter.sendMail({
      from: "haus@property.email", // sender address
      to: process.env.ADMIN_REVEIVER_EMAIL, // list of receivers
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
      to: process.env.ADMIN_REVEIVER_EMAIL, // list of receivers
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

app.get("/restore-data", async (req, res) => {
  // -------------- Saving the new  raw data ----------
  // let rawData = await retriveDataFromFile();
  // await PropertyModel.deleteMany();
  // await PropertyModel.insertMany(rawData);
  // TODO: Uncoment  this taks

  //--------------- Calculating the price up down and saving it to database --------------------
  await priceReductionCheck();

  return res.json({ message: "Data restored" });
});

// Automatically data will be restored in 12:00 AM everyday
cron.schedule("55 23 * * *", async () => {
  // -------------- Saving the new  raw data ----------
  let rawData = await retriveDataFromFile();
  await PropertyModel.deleteMany();
  await PropertyModel.insertMany(rawData);

  //--------------- Calculating the price up down and saving it to database --------------------
  await priceReductionCheck();
  console.log("Data restored and Emails were sent...!");
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
