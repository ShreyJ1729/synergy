const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
const chatCompletion = await openai.chat.completions.create({
    messages: [{ role: "user", content: "Say this is a test" }],
    model: "gpt-3.5-turbo",
});
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const folderPath = path.join(__dirname, 'policies');

if (!fs.existsSync(folderPath)) {
  fs.mkdirSync(folderPath);
}

const connectionString = 'mongodb+srv://prakulSynergyDB:SynergyDBPassword@cluster0.a1krduw.mongodb.net/HMReturnPolicy';
//Disabled all network access

mongoose.connect(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('');
})
.catch((err) => {
  console.log('Connection error:', err);
});

const DeliverySchema = new mongoose.Schema({
  DeliveryPolicy: String
});
const MemberSchema = new mongoose.Schema({
  MembershipPolicy: String
});
const ReturnSchema = new mongoose.Schema({
  ReturnPolicy: String
});

const HMDelivery = mongoose.model('HMDelivery', DeliverySchema, 'HMDelivery');
const HMMembership = mongoose.model('HMMembership', MemberSchema, 'HMMembership');
const HMPolicies = mongoose.model('HMPolicies', ReturnSchema, 'HMPolicies');

HMDelivery.find({}).then((docs) => {
  if (docs.length > 0) {
    fs.writeFileSync(path.join(folderPath, 'HMDelivery.json'), JSON.stringify(docs));
  } else {
    console.log('No documents found in HMDelivery.');
  }
}).catch((err) => {
  console.log('Error fetching HMDelivery:', err);
});

HMMembership.find({}).then((docs) => {
  if (docs.length > 0) {
    fs.writeFileSync(path.join(folderPath, 'HMMembership.json'), JSON.stringify(docs));
  } else {
    console.log('No documents found in HMMembership.');
  }
}).catch((err) => {
  console.log('Error fetching HMMembership:', err);
});

HMPolicies.find({}).then((docs) => {
  if (docs.length > 0) {
    fs.writeFileSync(path.join(folderPath, 'HMPolicies.json'), JSON.stringify(docs));
  } else {
    console.log('No documents found in HMPolicies.');
  }
}).catch((err) => {
  console.log('Error fetching HMPolicies:', err);
});

const readAndParseJsonFile = (filePath) => {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
  };
  
  // Read each JSON file from the 'policies' folder and parse the content
  const hmDeliveryData = readAndParseJsonFile(path.join(folderPath, 'HMDelivery.json'));
  const hmMembershipData = readAndParseJsonFile(path.join(folderPath, 'HMMembership.json'));
  const hmPoliciesData = readAndParseJsonFile(path.join(folderPath, 'HMPolicies.json'));
  
  // Combine all data into one object
  const combinedData = {
    HMDelivery: hmDeliveryData,
    HMMembership: hmMembershipData,
    HMPolicies: hmPoliciesData
  };
  
  // Convert combined data to JSON string
  const combinedDataString = JSON.stringify(combinedData);
  
  // If you want to save this combined data to a new JSON file, you can do so
  fs.writeFileSync(path.join(folderPath, 'CombinedPolicies.json'), combinedDataString);
  
  // Now 'combinedDataString' contains all the combined JSON data as a single string
  console.log(combinedDataString);
  
