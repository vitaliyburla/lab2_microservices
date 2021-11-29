import logo from "./logo.svg";
import "./App.css";
import { React, useState } from "react";
import axios from "axios";

function App() {
  const [resp, setResp] = useState("");
  const [mes, setMes] = useState("");

  const reqToService = () => {
    setResp("");
    axios.get("http://192.168.64.11/api/service1").then((res) => {
      setResp(res.data);
    });
  };

  const reqToBrokenService = () => {
    setResp("");
    axios.get("http://192.168.64.11/api/service1/test").then((res) => {
      setResp(res.data);
    });
  };

  const req100ToBrokenService = () => {
    setResp("");
    let date1 = new Date();
    for (let i = 0; i < 100; i++) {
      axios.get("http://192.168.64.11/api/service1/test");
    }
    let date2 = new Date();
    let timeDifference = (date2.getTime() - date1.getTime()) / 1000;
    setResp(timeDifference);
  };

  const sendMessageWithKafka = () => {
    setResp("");
    axios
      .get(`http://192.168.64.11/api/service1/kafka-producer?message=${mes}`)
      .then((res) => {
        setResp(res.data);
      });
    setMes("");
  };

  const startKafkaConsumer1 = () => {
    setResp("");
    axios
      .get(`http://192.168.64.11/api/service2/kafka-consumer`)
      .then((res) => {
        setResp(res.data);
      });
  };

  const startKafkaConsumer2 = () => {
    setResp("");
    axios
      .get(`http://192.168.64.11/api/service3/kafka-consumer`)
      .then((res) => {
        setResp(res.data);
      });
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <button onClick={() => reqToService()}>Request to service</button>
        <br />
        <button onClick={() => reqToBrokenService()}>
          Request to broken service
        </button>
        <br />
        <button onClick={() => req100ToBrokenService()}>
          100 Requests to broken service
        </button>
        <br />
        <button onClick={() => startKafkaConsumer1()}>
          Start service 2 Kafka consumer
        </button>
        <button onClick={() => startKafkaConsumer2()}>
          Start service 3 Kafka consumer
        </button>
        <br />
        <input type="text" onChange={(e) => setMes(e.target.value)} />
        <button onClick={() => sendMessageWithKafka()}>Send Message</button>
        <p>Response: {resp}</p>
      </header>
    </div>
  );
}

export default App;
