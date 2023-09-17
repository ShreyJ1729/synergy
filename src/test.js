const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const folderPath = path.join(__dirname, "policies");

if (!fs.existsSync(folderPath)) {
  fs.mkdirSync(folderPath);
}

const connectionString =
  "mongodb+srv://prakulSynergyDB:SynergyDBPassword@cluster0.a1krduw.mongodb.net/HMReturnPolicy";

mongoose
  .connect(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to db!");
  })
  .catch((err) => {
    console.log("Connection error:", err);
  });

const DeliverySchema = new mongoose.Schema({
  DeliveryPolicy: String,
});
const MemberSchema = new mongoose.Schema({
  MembershipPolicy: String,
});
const ReturnSchema = new mongoose.Schema({
  ReturnPolicy: String,
});

const HMDelivery = mongoose.model("HMDelivery", DeliverySchema, "HMDelivery");
const HMMembership = mongoose.model(
  "HMMembership",
  MemberSchema,
  "HMMembership"
);
const HMPolicies = mongoose.model("HMPolicies", ReturnSchema, "HMPolicies");

HMDelivery.find({})
  .then((docs) => {
    if (docs.length > 0) {
      fs.writeFileSync(
        path.join(folderPath, "HMDelivery.json"),
        JSON.stringify(docs)
      );
    } else {
      console.log("No documents found in HMDelivery.");
    }
  })
  .catch((err) => {
    console.log("Error fetching HMDelivery:", err);
  });

HMMembership.find({})
  .then((docs) => {
    if (docs.length > 0) {
      fs.writeFileSync(
        path.join(folderPath, "HMMembership.json"),
        JSON.stringify(docs)
      );
    } else {
      console.log("No documents found in HMMembership.");
    }
  })
  .catch((err) => {
    console.log("Error fetching HMMembership:", err);
  });

HMPolicies.find({})
  .then((docs) => {
    if (docs.length > 0) {
      fs.writeFileSync(
        path.join(folderPath, "HMPolicies.json"),
        JSON.stringify(docs)
      );
    } else {
      console.log("No documents found in HMPolicies.");
    }
  })
  .catch((err) => {
    console.log("Error fetching HMPolicies:", err);
  });
