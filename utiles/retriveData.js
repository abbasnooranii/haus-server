const fs = require("fs");
const path = require("path");

const blmPath = "./up/151_151_01.BLM";

const retriveDataFromFile = async () => {
  try {
    const data = fs.readFileSync(blmPath, "utf8");

    const lines = data.split("\n");
    const metadata = lines.slice(0, 5);

    const definitionIndex = lines.findIndex((line) =>
      line.includes("#DEFINITION#")
    );
    const columns = lines[definitionIndex + 1].trim().split("^");

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
    // return "Parsed Data:", records.slice(0, 5); // Display first 5 records
    return records;
  } catch (err) {
    console.error("Error reading file:", err);
    return { message: "Something went wrong..!" };
  }
};

module.exports = retriveDataFromFile;
