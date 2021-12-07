const e = require('cors');
const cors = require('cors');
const express = require('express');
const axios = require('axios');
const { Kafka } = require('kafkajs');

const app = express();

app.use(cors());

app.get('/api/service1', (req, res, next) => {
    axios.get('http://service2-service/api/service2').then((response) => {
        res.status(200).json(`service2 response: ${response.data}`);
    });
});

app.get('/api/service1/test', (req, res, next) => {
    axios
        .get('http://service2-service/api/service2?time=3000')
        .then((response) => {
            res.status(200).json(
                `service2 with delay response: ${response.data}`
            );
        })
        .catch((err) => {
            res.status(200).json(err.message);
        });
});

app.get('/api/service1/kafka-producer', async (req, res, next) => {
    let qu = req.query.message || 'Empty message';

    const vaultResponse = await axios.get('http://webapp:8080');
    const params = JSON.parse(vaultResponse.data.replace(/=>/g, ':'));

    const clientId = 'service1';
    const kafka = new Kafka({
        clientId: clientId,
        brokers: [params.broker],
    });

    const producer = kafka.producer();
    const admin = kafka.admin();
    await admin.connect();
    await producer.connect();
    await admin.createTopics({
        waitForLeaders: true,
        topics: [{ topic: 'myRandomTopicString123' }],
    });
    await producer.send({
        topic: params.topic,
        messages: [{ value: qu }],
    });

    res.status(200).send(`Message "${qu}" sent`);
});

app.listen(8080, () => {
    console.log('Server enabled with CORS');
});
