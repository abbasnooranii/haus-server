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

const User = require("./models/UserModel");
const UserSavedPropertyModel = require("./models/UserSavedPropertiesModel");

// ---- Registering a helper function to increament the index of each link----
Handlebars.registerHelper("increment", function (index) {
  return index + 1;
});

const app = express();
const port = process.env.PORT || 5000;
const blmPath = "./up/115_111_01.BLM";

const corsConfig = {
  origin: ["*", "http://localhost:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
};

// Middlewares
app.use(express.json());
app.use(cors(corsConfig));
app.options("", cors(corsConfig));
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
  // await priceReductionCheck();
  const users = await User.find();
  if (users.length < 1) {
    return;
  }

  await Promise.all(
    users.map(async (user) => {
      // Checking if this is the time to send emails
      if (!user.alert_type || user.alert_type === "never") return;

      //Checking Monthly users
      if (user.alert_type === "monthly" && user.alert_send_date) {
        const lastEmailDate = new Date(user.alert_send_date);
        const oneMonthLater = new Date(
          lastEmailDate.setMonth(lastEmailDate.getMonth() + 1)
        );
        const currentDate = new Date();
        // Sending the email if one month has been passed or not
        if (currentDate >= oneMonthLater) {
          console.log("Sending the email");
          CheckPriceChangeAndSendEmail(user);
          return;
        }
      }
      //Checking Weekly users
      if (user.alert_type === "weekly" && user.alert_send_date) {
        const lastEmailDate = new Date(user.alert_send_date);
        const oneWeekLater = new Date(
          lastEmailDate.setMonth(lastEmailDate.getDate() + 7)
        );
        const currentDate = new Date();
        // Sending the email if one week has been passed or not
        if (currentDate >= oneWeekLater) {
          console.log("Sending the email");
          CheckPriceChangeAndSendEmail(user);
          return;
        }
      }
      // Sending email for Immediately and those users  who does not have any alert_send_date but do have alert_type
      CheckPriceChangeAndSendEmail(user);
    })
  );

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

const CheckPriceChangeAndSendEmail = async (user) => {
  // Setting the email template
  const source = fs
    .readFileSync("email-templates/template4.html", "utf-8")
    .toString();
  const template = Handlebars.compile(source);
  // Retrieve all saved properties for the user in one query
  const savedSearchProperties = await UserSavedPropertyModel.find({
    USER_EMAIL: user.email,
  });

  if (savedSearchProperties.length === 0) return;

  const priceReducedPropertiesLinks = [];

  // Process each saved property for price comparison
  await Promise.all(
    savedSearchProperties.map(async (property) => {
      const rawProperty = await PropertyModel.findOne({
        AGENT_REF: property.AGENT_REF,
      });

      if (!rawProperty) return; // Skip if property not found

      const oldPrice = parseInt(property.PRICE);
      const newPrice = parseInt(rawProperty.PRICE);

      // Add to links if the price has dropped
      if (newPrice < oldPrice) {
        priceReducedPropertiesLinks.push({
          url: `${process.env.CLIENT_URL}/hauses/${rawProperty._id}`,
        });
      }
    })
  );

  // Saving the date time to alert_send_date
  user.alert_send_date = Date.now();
  await user.save();

  // Only send email if there are price-reduced properties
  if (priceReducedPropertiesLinks.length > 0) {
    const replacements = { links: priceReducedPropertiesLinks };
    const htmlToSend = template(replacements);
    console.log("Mahidun..Email is being send");
    // await transporter.sendMail({
    //   from: '"Haus" <haus@property.email>',
    //   to: "mdmahidunnobi@gmail.com", // use user's email directly
    //   subject: "Price Drop!",
    //   html: htmlToSend,
    // });
  }
};

app.listen(port, async () => {
  await connect();
  console.log("Server started successfully");
});
