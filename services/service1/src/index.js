const e = require("cors");
const cors = require("cors");
const express = require("express");
const axios = require("axios");

const app = express();

app.use(cors());

app.get("/api/service1", (req, res, next) => {
  axios.get("http://service2-service/api/service2").then((response) => {
    res.status(200).json(`service2 response: ${response.data}`);
  });
});

app.get("/api/service1/test", (req, res, next) => {
  axios
    .get("http://service2-service/api/service2?time=3000")
    .then((response) => {
      res.status(200).json(`service2 with delay response: ${response.data}`);
    })
    .catch((err) => {
      res.status(200).json(err.message);
    });
});

app.listen(8080, () => {
  console.log("Server enabled with CORS");
});
