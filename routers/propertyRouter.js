// const { Router } = require("express");
// const PropertyModel = require("../models/PropertyModel.js");
const { Router } = require("express");
const PropertyModel = require("../models/PropertyModel.js");
const { ObjectId } = require("mongodb");

const propertyRouter = Router();

propertyRouter.get("/", async (req, res) => {
  try {
    const query = req.query;

    // Controlling filter
    const filter = {};
    if (query.agent_ref) {
      filter.AGENT_REF = new RegExp(query.agent_ref, "i");
    }
    if (query.badrooms && query.badrooms !== "0") {
      filter.BEDROOMS = query.badrooms;
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
    // Controlling pagination
    const itemsPerPage = 10;
    let skipCount = 0;
    if (query.selectedPage) {
      skipCount = (query.selectedPage - 1) * itemsPerPage;
    }
    const properties = await PropertyModel.find(filter)
      .skip(skipCount)
      .limit(itemsPerPage);

    return res.send(properties);
  } catch (error) {
    res.status(403).json({ message: "Something went wrong" });
  }
});

propertyRouter.get("/page-count", async (req, res) => {
  try {
    const properties = await PropertyModel.countDocuments();
    res.send({ count: Math.ceil(properties / 10) });
  } catch (error) {
    console.log(error);
    res.status(403).send({ message: "Something went wrong" });
  }
});

propertyRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const properties = await PropertyModel.findById(new ObjectId(id));
    return res.send(properties);
  } catch (error) {
    console.log(error);
    return res.status(403).json({ message: "Something went wrong" });
  }
});

module.exports = propertyRouter;
// export default propertyRouter;
