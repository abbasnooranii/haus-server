const PropertyModel = require("../models/PropertyModel");
const User = require("../models/UserModel");
const UserSavedPropertyModel = require("../models/UserSavedPropertiesModel");
const Handlebars = require("handlebars");
const transporter = require("./emailTransportar.js");
const fs = require("fs");

// ---- Registering a helper function to increament the index of each link----
Handlebars.registerHelper("increment", function (index) {
  return index + 1;
});

const priceReductionCheck = async () => {
  // Setting the email template

  const source = fs
    .readFileSync("email-templates/template4.html", "utf-8")
    .toString();
  const template = Handlebars.compile(source);

  const users = await User.find();
  if (users.length < 1) {
    return;
  }

  await Promise.all(
    users.map(async (user) => {
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

      // Only send email if there are price-reduced properties
      if (priceReducedPropertiesLinks.length > 0) {
        const replacements = { links: priceReducedPropertiesLinks };
        const htmlToSend = template(replacements);

        await transporter.sendMail({
          from: '"Haus" <haus@property.email>',
          to: "mdmahidunnobi@gmail.com", // use user's email directly
          subject: "Price Drop!",
          html: htmlToSend,
        });
      }
    })
  );
};

module.exports = priceReductionCheck;
