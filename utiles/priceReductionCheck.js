const PropertyModel = require("../models/PropertyModel");
const User = require("../models/UserModel");
const UserSavedPropertyModel = require("../models/UserSavedPropertiesModel");
const Handlebars = require("handlebars");
const transporter = require("./emailTransportar.js");
const fs = require("fs");

const priceReductionCheck = async () => {
  // ---- Registering a helper function to increament the index of each link----
  Handlebars.registerHelper("increment", function (index) {
    return index + 1;
  });

  const users = await User.find();
  if (users.length < 1) {
    return;
  }

  //  ------------ Iterating through each user----------
  for (let user of users) {
    const priceReducedPropertiesLinks = [];
    // ----------- Getting all the saved searched properties of a user----------
    const savedSearchProperties = await UserSavedPropertyModel.find({
      USER_EMAIL: user.email,
    });
    // ---------- Iterating through  all  the properties and compearing the price--------
    for (let property of savedSearchProperties) {
      const rawProperty = await PropertyModel.findOne({
        AGENT_REF: property.AGENT_REF,
      });

      const oldPrice = parseInt(property.PRICE);
      const newPrice = parseInt(rawProperty.PRICE);
      if (newPrice < oldPrice) {
        priceReducedPropertiesLinks.push({
          url: `${process.env.CLIENT_URL}/hauses/${rawProperty._id}`,
        });
      }
    }
    if (priceReducedPropertiesLinks.length > 0) {
      const source = fs
        .readFileSync("email-templates/template4.html", "utf-8")
        .toString();
      const template = Handlebars.compile(source);
      const replacements = {
        links: priceReducedPropertiesLinks,
      };
      const htmlToSend = template(replacements);

      const info = await transporter.sendMail({
        from: '"Haus" <haus@property.email>', // sender address
        to: "mdmahidunnobi@gmail.com", // list of receivers
        subject: "Price Drop!", // Subject line
        html: htmlToSend, // html body
      });
      //   console.log("Email send");
    }
  }
};

module.exports = priceReductionCheck;
