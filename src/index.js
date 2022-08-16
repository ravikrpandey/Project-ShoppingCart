const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const aws = require("aws-sdk");
const multer = require("multer");
const route = require("./routes/route");
const app = express();

app.use(bodyParser.json());
app.use(multer().any());

mongoose
  .connect(
    "mongodb+srv://KajalGajjar:jEQowT3kZFYLZVNT@cluster0.sr2eao7.mongodb.net/group47Database?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
    }
  )
  .then(() => console.log("MongoDb is connected"))
  .catch((err) => console.log(err));

aws.config.update({
  accessKeyId: "AKIAY3L35MCRVFM24Q7U",
  secretAccessKey: "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",
  region: "ap-south-1",
});

app.use("/", route);

app.listen(process.env.PORT || 3000, function () {
  console.log("Express app running on port " + (process.env.PORT || 3000));
});
