import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Alert, Tabs, Tab } from "react-bootstrap";
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
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState(null);
  const [sensorData, setSensorData] = useState([]);
  const [timeFrame, setTimeFrame] = useState("7days");
  const [chartHeight, setChartHeight] = useState(100); // 기본 높이 설정

  // 화면 크기에 따른 차트 높이 조정
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) { // 모바일 화면 크기
        setChartHeight(200); // 모바일에서 차트 높이를 200으로 설정
      } else { // 데스크탑 화면 크기
        setChartHeight(100); // 데스크탑에서 차트 높이를 100으로 설정
      }
    };

    handleResize(); // 초기 화면 크기 설정
    window.addEventListener("resize", handleResize); // 화면 크기 변경 시 처리

    return () => window.removeEventListener("resize", handleResize); // 컴포넌트 언마운트 시 이벤트 제거
  }, []); // 빈 배열을 넣어 최초 한 번만 실행되도록 수정

  // 농장 목록과 데이터 가져오기
  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const response = await fetch(`${BASE_URL}/user/farm-list`, {
          method: "GET",
          credentials: "include",  // 쿠키 포함
        });
        const farmsData = await response.json();
        setFarms(farmsData);
        if (farmsData.length > 0) {
          setSelectedFarmId(farmsData[0].farmId); // 기본으로 첫 번째 농장 선택
        }
      } catch (error) {
        console.error("Error fetching farms:", error);
      }
    };

    fetchFarms();
  }, []);

  // 선택된 농장의 데이터 가져오기
  useEffect(() => {
    if (selectedFarmId) {
      const fetchData = async () => {
        try {
          const response = await fetch(`${BASE_URL}/user/sensor-data?farmId=${selectedFarmId}&timeFrame=${timeFrame}`, {
            method: "GET",
            credentials: "include",  // 쿠키 포함
          });
          const data = await response.json();

          // 데이터가 배열 형식인지 확인하고, 아닐 경우 빈 배열로 설정
          if (Array.isArray(data)) {
            setSensorData(data);
          } else {
            setSensorData([]); // 데이터를 배열로 변환할 수 없으면 빈 배열로 설정
          }
        } catch (error) {
          console.error("Error fetching data:", error);
          setSensorData([]); // 오류 발생 시 빈 배열로 설정
        }
      };

      fetchData();
    }
  }, [timeFrame, selectedFarmId]);

  const labels = sensorData.map((entry) => entry.date);
  const temperatures = sensorData.map((entry) => entry.temperature);
  const humidities = sensorData.map((entry) => entry.humidity);
  const soil_moistures = sensorData.map((entry) => entry.soil_moisture);

  // 데이터 유효성 검사 함수
  const hasValidData = (data) => {
    return data && data.length > 0 && data.some(value => value !== null && value !== undefined && !isNaN(value));
  };

  // 센서 존재 여부 확인
  const hasTemperatureSensor = temperatures.some(value => value !== null);
  const hasHumiditySensor = humidities.some(value => value !== null);
  const hasSoilMoistureSensor = soil_moistures.some(value => value !== null);

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
        data: soil_moistures,
        borderColor: "rgba(75, 192, 192, 0.8)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.3,
      },
    ],
  };

  return (
    <Container className="py-5">
      <h2 className="text-center text-success fw-bold mb-4">📊 환경 그래프</h2>

      {/* 농장 탭 */}
      <Tabs
        id="farm-tabs"
        activeKey={selectedFarmId}
        onSelect={(farmId) => setSelectedFarmId(farmId)}
        className="mb-4"
        style={{ borderBottom: "2px solid #ddd" }}
      >
        {farms.map((farm) => (
          <Tab eventKey={farm.farmId} title={<span style={{ color: "black" }}>{farm.farmName}</span>} key={farm.farmId}>
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

            {/* 차트 영역 */}
            <Row className="mb-4">
              <Col md={12}>
                {hasTemperatureSensor && (
                  <Card className="shadow-sm mb-4">
                    <Card.Body>
                      <h5 className="text-danger mb-3">🌡️ 온도 변화</h5>
                      {hasValidData(temperatures) ? (
                        <Line data={temperatureChart} height={chartHeight} options={{ responsive: true }} />
                      ) : (
                        <Alert variant="info" className="text-center mb-0">
                          데이터가 없습니다.
                        </Alert>
                      )}
                    </Card.Body>
                  </Card>
                )}

                {hasHumiditySensor && (
                  <Card className="shadow-sm mb-4">
                    <Card.Body>
                      <h5 className="text-info mb-3">💧 습도 변화</h5>
                      {hasValidData(humidities) ? (
                        <Line data={humidityChart} height={chartHeight} options={{ responsive: true }} />
                      ) : (
                        <Alert variant="info" className="text-center mb-0">
                          데이터가 없습니다.
                        </Alert>
                      )}
                    </Card.Body>
                  </Card>
                )}

                {hasSoilMoistureSensor && (
                  <Card className="shadow-sm mb-4">
                    <Card.Body>
                      <h5 className="text-teal mb-3">🌱 토양 수분 변화</h5>
                      {hasValidData(soil_moistures) ? (
                        <Line data={moistureChart} height={chartHeight} options={{ responsive: true }} />
                      ) : (
                        <Alert variant="info" className="text-center mb-0">
                          데이터가 없습니다.
                        </Alert>
                      )}
                    </Card.Body>
                  </Card>
                )}

                {!hasTemperatureSensor && !hasHumiditySensor && !hasSoilMoistureSensor && (
                  <Alert variant="warning" className="text-center">
                    설치된 센서가 없습니다.
                  </Alert>
                )}
              </Col>
            </Row>
          </Tab>
        ))}
      </Tabs>
    </Container>
  );
}

export default UserDataVisualization;
