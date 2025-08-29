const slugify = require("slugify");

const generatePropertySlug = (property) => {
  const slugParts = [
    "Student-professional-property-for-Rent",
    property.BEDROOMS,
    "Bedrooms",
    property.AGENT_REF,
    property.ADDRESS_1,
    property.ADDRESS_2,
    property.ADDRESS_3,
    property.TOWN,
    property.POSTCODE1,
    property.POSTCODE2,
  ];

  // Filter out any empty or null parts (e.g., if ADDRESS_3 is missing)
  // and join them with a hyphen.
  const rawSlug = slugParts.filter(Boolean).join("-");

  // Use slugify to make it URL-safe, lowercase, and clean
  return slugify(rawSlug, {
    lower: true, // Convert to lowercase
    strict: true, // Remove special characters
    remove: /[*+~.()'"!:@]/g,
  });
};

module.exports = generatePropertySlug;