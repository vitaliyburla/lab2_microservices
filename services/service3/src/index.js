const e = require("cors");
const cors = require("cors");
const express = require("express");
const { Kafka } = require("kafkajs");

const app = express();

app.use(cors());

app.get("/api/service3", (req, res, next) => {
  let time = req.query.time || 0;
  setTimeout(() => {
    res
      .status(200)
      .json(`JSON message hello from service 3 with ${time} ms delay!`);
  }, parseInt(time));
});

app.get("/api/service3/kafka-consumer", async (req, res, next) => {
  const clientId = "service3";
  const kafka = new Kafka({
    clientId: clientId,
    brokers: ["kafka:9092"],
  });

  const consumer = kafka.consumer({ groupId: clientId });

  await consumer.connect();
  await consumer.subscribe({ topic: "test-topic", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const mesObj = {
        value: message.value.toString(),
      };
      console.log(mesObj);
    },
  });
  res.status(200).send("Consumer started!");
});

app.listen(8080, () => {
  console.log("Server enabled with CORS");
});
