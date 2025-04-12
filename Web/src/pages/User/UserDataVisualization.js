import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

function UserDataVisualization() {
  const [sensorData, setSensorData] = useState([]);
  const [timeFrame, setTimeFrame] = useState("7days");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${BASE_URL}/user/sensor-data?timeFrame=${timeFrame}`);
        const data = await response.json();
        setSensorData(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [timeFrame]);

  const labels = sensorData.map((entry) => entry.date);
  const temperatures = sensorData.map((entry) => entry.temperature);
  const humidities = sensorData.map((entry) => entry.humidity);
  const moistures = sensorData.map((entry) => entry.moisture);

  const temperatureChart = {
    labels,
    datasets: [
      {
        label: "온도(°C)",
        data: temperatures,
        borderColor: "rgba(255, 99, 132, 0.8)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        tension: 0.3,
      },
    ],
  };

  const humidityChart = {
    labels,
    datasets: [
      {
        label: "습도(%)",
        data: humidities,
        borderColor: "rgba(54, 162, 235, 0.8)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        tension: 0.3,
      },
    ],
  };

  const moistureChart = {
    labels,
    datasets: [
      {
        label: "토양 수분(%)",
        data: moistures,
        borderColor: "rgba(75, 192, 192, 0.8)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.3,
      },
    ],
  };

  return (
    <Container className="py-5">
      <h2 className="text-center text-success fw-bold mb-4">📊 환경 그래프</h2>

      <Row className="mb-4">
        <Col md={12} className="text-center">
          <Button
            variant={timeFrame === "7days" ? "success" : "outline-success"}
            onClick={() => setTimeFrame("7days")}
            className="mx-2 btn-lg"
          >
            7일 데이터
          </Button>
          <Button
            variant={timeFrame === "30days" ? "success" : "outline-success"}
            onClick={() => setTimeFrame("30days")}
            className="mx-2 btn-lg"
          >
            30일 데이터
          </Button>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={12}>
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <h5 className="text-danger mb-3">🌡️ 온도 변화</h5>
              <Line data={temperatureChart} height={250} options={{ responsive: true }} />
            </Card.Body>
          </Card>

          <Card className="shadow-sm mb-4">
            <Card.Body>
              <h5 className="text-info mb-3">💧 습도 변화</h5>
              <Line data={humidityChart} height={250} options={{ responsive: true }} />
            </Card.Body>
          </Card>

          <Card className="shadow-sm mb-4">
            <Card.Body>
              <h5 className="text-teal mb-3">🌱 토양 수분 변화</h5>
              <Line data={moistureChart} height={250} options={{ responsive: true }} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default UserDataVisualization;
