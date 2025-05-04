import { useEffect, useState } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

function RealTimeGraph() {
  const [humidityData, setHumidityData] = useState([]);
  const [temperatureData, setTemperatureData] = useState([]);
  const [cdsData, setCdsData] = useState([]);
  const [gasData, setGasData] = useState([]);
  
  const [labels, setLabels] = useState([]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [humidityRes, temperatureRes, cdsRes, gasRes] = await Promise.all([
          fetch(`${BASE_URL}/sensor/humidity/value`).then(res => res.json()),
          fetch(`${BASE_URL}/sensor/temperature/value`).then(res => res.json()),
          fetch(`${BASE_URL}/sensor/cds/value`).then(res => res.json()),
          fetch(`${BASE_URL}/sensor/gas/value`).then(res => res.json()),
        ]);

        const now = new Date();
        const time = now.toLocaleTimeString('ko-KR', { hour12: false });

        setHumidityData(prev => [...prev.slice(-19), humidityRes.value]);
        setTemperatureData(prev => [...prev.slice(-19), temperatureRes.value]);
        setCdsData(prev => [...prev.slice(-19), cdsRes.value]);
        setGasData(prev => [...prev.slice(-19), gasRes.value]);

        setLabels(prev => [...prev.slice(-19), time]);
      } catch (error) {
        console.error("데이터 가져오기 실패:", error);
      }
    }, 9000);

    return () => clearInterval(interval);
  }, []);

  // 공통 옵션
  const commonOptions = (color) => ({
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: color, // y축 숫자 색
        },
      },
      x: {
        ticks: {
          color: '#666', // x축 숫자 색 (회색 고정)
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: color, // 가운데 네모+글자 색깔
          font: {
            size: 14,
            weight: 'bold',
          },
          padding: 20,
          boxWidth: 20,
        },
        position: 'top',
        align: 'center',
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: color,
        borderWidth: 1,
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart',
    },
  });

  const createChartData = (data, label, borderColor, backgroundColor) => ({
    labels,
    datasets: [
      {
        label,
        data,
        borderColor,
        backgroundColor,
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 3,
      },
    ],
  });

  return (
    <Container className="py-5">
      <h2 className="text-center text-success fw-bold mb-5">📈 실시간 센서 데이터</h2>

      <Row className="mb-4">
        <Col md={12}>
          {/* 온도 */}
          <Card className="shadow rounded-4 mb-5">
            <Card.Body>
              <h5 className="text-danger fw-bold mb-4 fs-4">🌡️ 온도 (°C)</h5>
              <Line
                data={createChartData(
                  temperatureData,
                  "온도",
                  "rgba(255, 99, 132, 0.8)",  // border
                  "rgba(255, 99, 132, 0.2)"   // background
                )}
                options={commonOptions("rgba(255, 99, 132, 0.8)")}
                height={100}
              />
            </Card.Body>
          </Card>

          {/* 습도 */}
          <Card className="shadow rounded-4 mb-5">
            <Card.Body>
              <h5 className="text-primary fw-bold mb-4 fs-4">💧 습도 (%)</h5>
              <Line
                data={createChartData(
                  humidityData,
                  "습도",
                  "rgba(54, 162, 235, 0.8)",
                  "rgba(54, 162, 235, 0.2)"
                )}
                options={commonOptions("rgba(54, 162, 235, 0.8)")}
                height={100}
              />
            </Card.Body>
          </Card>

          {/* 조도 */}
          <Card className="shadow rounded-4 mb-5">
            <Card.Body>
              <h5 className="text-warning fw-bold mb-4 fs-4">🌞 조도 (lux)</h5>
              <Line
                data={createChartData(
                  cdsData,
                  "조도",
                  "rgba(255, 206, 86, 0.8)",
                  "rgba(255, 206, 86, 0.2)"
                )}
                options={commonOptions("rgba(255, 206, 86, 0.8)")}
                height={100}
              />
            </Card.Body>
          </Card>

          {/* 가스 */}
          <Card className="shadow rounded-4 mb-5">
            <Card.Body>
              <h5 className="text-success fw-bold mb-4 fs-4">🛢️ 가스 (ppm)</h5>
              <Line
                data={createChartData(
                  gasData,
                  "가스",
                  "rgba(75, 192, 192, 0.8)",
                  "rgba(75, 192, 192, 0.2)"
                )}
                options={commonOptions("rgba(75, 192, 192, 0.8)")}
                height={100}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default RealTimeGraph;
