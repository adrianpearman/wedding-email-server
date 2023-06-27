//
const express = require("express");
//
const app = express();
const PORT = process.env.PORT || 9000;

app.get("/", (req, res) => {
  res.send({
    msg: "kjshkjh",
  });
});

app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});
