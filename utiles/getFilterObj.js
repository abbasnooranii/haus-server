const getFilterObj = (query) => {
  const filter = {};
  if (query.agent_ref) {
    filter.AGENT_REF = new RegExp(query.agent_ref, "i");
  }
  if (query.badrooms) {
    const bedroomsArray = query.badrooms.split(",").map(Number); // Convert the "4,5,7,8" string into an array of numbers
    filter.BEDROOMS = { $in: bedroomsArray };
  }
  if (query.max_price || query.min_price) {
    filter.$expr = {
      $and: [
        { $gte: [{ $toDouble: "$PRICE" }, Number(query.min_price)] },
        {
          $lte: [
            { $toDouble: "$PRICE" },
            query.max_price === "0" ? 2000 : Number(query.max_price),
          ],
        },
      ],
    };
  }
  if (query.prop_sub_id && query.prop_sub_id !== "") {
    filter.PROP_SUB_ID = query.prop_sub_id;
  }
  if (query.location && query.location !== "") {
    filter.$or = [
      { ADDRESS_2: new RegExp(query.location, "i") },
      { ADDRESS_3: new RegExp(query.location, "i") },
    ];
  }
  return filter;
};

module.exports = getFilterObj;
