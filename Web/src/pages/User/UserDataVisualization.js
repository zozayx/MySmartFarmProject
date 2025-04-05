import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import Container from "react-bootstrap/Container";
import Card from "react-bootstrap/Card";
import Chart from "chart.js/auto";
import { CategoryScale } from "chart.js";

Chart.register(CategoryScale);

function DataVisualization() {
  const [temperatureData, setTemperatureData] = useState([]);
  const [humidityData, setHumidityData] = useState([]);
  const [soilMoistureData, setSoilMoistureData] = useState([]);
  const [labels, setLabels] = useState([]);

  useEffect(() => {
    // 샘플 데이터 초기화
    setLabels(["12PM", "1PM", "2PM", "3PM", "4PM", "5PM", "6PM"]);
    setTemperatureData([21.2, 22.5, 24.0, 23.3, 25.1, 24.8, 23.5]);
    setHumidityData([60, 58, 55, 53, 56, 59, 61]);
    setSoilMoistureData([30, 32, 35, 34, 36, 38, 37]);
  }, []);

  return (
    <Container className="py-5">
      <h2 className="text-center text-success fw-bold mb-4">📊 데이터 시각화</h2>

      <Card className="shadow-lg border-0 p-4 mb-4">
        <h5 className="fw-bold text-primary mb-3">🌡️ 온도 변화</h5>
        <div style={{ height: "300px" }}>
          <Line
            data={{
              labels,
              datasets: [
                {
                  label: "온도 (°C)",
                  data: temperatureData,
                  borderColor: "#FF6384",
                  backgroundColor: "rgba(255, 99, 132, 0.2)",
                  fill: true,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
            }}
          />
        </div>
      </Card>

      <Card className="shadow-lg border-0 p-4 mb-4">
        <h5 className="fw-bold text-primary mb-3">💧 습도 변화</h5>
        <div style={{ height: "300px" }}>
          <Line
            data={{
              labels,
              datasets: [
                {
                  label: "습도 (%)",
                  data: humidityData,
                  borderColor: "#36A2EB",
                  backgroundColor: "rgba(54, 162, 235, 0.2)",
                  fill: true,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
            }}
          />
        </div>
      </Card>

      <Card className="shadow-lg border-0 p-4 mb-4">
        <h5 className="fw-bold text-primary mb-3">🌱 토양 수분 변화</h5>
        <div style={{ height: "300px" }}>
          <Line
            data={{
              labels,
              datasets: [
                {
                  label: "토양 수분 (%)",
                  data: soilMoistureData,
                  borderColor: "#4BC0C0",
                  backgroundColor: "rgba(75, 192, 192, 0.2)",
                  fill: true,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
            }}
          />
        </div>
      </Card>
    </Container>
  );
}

export default DataVisualization;
