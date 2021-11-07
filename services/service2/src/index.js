const e = require("cors");
const cors = require("cors");
const express = require("express");

const app = express();

app.use(cors());

app.get("/api/service2", (req, res, next) => {
  let time = req.query.time || 0;
  setTimeout(() => {
    res
      .status(200)
      .json(`JSON message hello from service 2 with ${time} ms delay!`);
  }, parseInt(time));
});

app.listen(8080, () => {
  console.log("Server enabled with CORS");
});
