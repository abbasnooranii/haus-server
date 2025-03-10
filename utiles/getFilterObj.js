const getFilterObj = (query) => {
  // console.log(query)
  const filter = {};
  if(query.showLetAgreed != 'true')
    filter.STATUS_ID = { $nin: [5] }; // default filter
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

  if (query.PROPERTY_WEEK && query.PROPERTY_WEEK === 1) {
    filter.PROPERTY_WEEK = query.PROPERTY_WEEK;
  }

  if (query.LET_TYPE_ID && query.LET_TYPE_ID === 0) {
    filter.LET_TYPE_ID = { $ne: 1 }; // Exclude LET_TYPE_ID = 1
  }

  return filter;
};

module.exports = getFilterObj;
