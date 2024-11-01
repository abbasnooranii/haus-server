const CalculatedPropertyModel = require("../models/CalculatedPropertiesModel");
const PrevPropertyModel = require("../models/PrevPropertiesModel");
const PropertyModel = require("../models/PropertyModel");

const calculatePriceChange = async () => {
  let CalculatedProperties = [];

  const currentProperties = await PropertyModel.find().select(
    "AGENT_REF PRICE"
  );
  const prevProperties = await PrevPropertyModel.find().select(
    "AGENT_REF PRICE"
  );

  prevProperties.forEach((Pd) => {
    const { AGENT_REF: Pd_Ref, PRICE: Pd_Price } = Pd;
    const currentProp = currentProperties.find((cd) => cd.AGENT_REF === Pd_Ref);

    if (currentProp && Pd_Price !== currentProp.PRICE) {
      const calculatedData = {
        AGENT_REF: currentProp.AGENT_REF,
        PREV_PRICE: Pd_Price,
        CURR_PRICE: currentProp.PRICE,
        STATUS:
          Number(Pd_Price) > Number(currentProp.PRICE)
            ? `price_drop`
            : "price_increase",
      };
      CalculatedProperties.push(calculatedData);
    }
  });

  await CalculatedPropertyModel.deleteMany();
  await CalculatedPropertyModel.insertMany(CalculatedProperties);
};

module.exports = calculatePriceChange;
