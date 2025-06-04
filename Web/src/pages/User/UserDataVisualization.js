import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Alert, Tabs, Tab, Spinner } from "react-bootstrap";
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

// 센서 타입별 설정
const SENSOR_CONFIGS = {
  '온도': {
    icon: '🌡️',
    label: '온도(°C)',
    color: 'rgba(255, 99, 132, 0.8)',
    bgColor: 'rgba(255, 99, 132, 0.2)',
    textColor: 'text-danger'
  },
  '습도': {
    icon: '💧',
    label: '습도(%)',
    color: 'rgba(54, 162, 235, 0.8)',
    bgColor: 'rgba(54, 162, 235, 0.2)',
    textColor: 'text-info'
  },
  '조도': {
    icon: '☀️',
    label: '조도(lux)',
    color: 'rgba(255, 193, 7, 0.8)',
    bgColor: 'rgba(255, 193, 7, 0.2)',
    textColor: 'text-warning'
  }
};

function UserDataVisualization() {
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState(null);
  const [sensorData, setSensorData] = useState([]);
  const [timeFrame, setTimeFrame] = useState("7days");
  const [chartHeight, setChartHeight] = useState(100);
  const [loading, setLoading] = useState(true);

  // 화면 크기에 따른 차트 높이 조정
  useEffect(() => {
    const handleResize = () => {
      setChartHeight(window.innerWidth <= 768 ? 200 : 100);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 농장 목록 가져오기
  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const response = await fetch(`${BASE_URL}/user/farm-list`, {
          method: "GET",
          credentials: "include",
        });
        const farmsData = await response.json();
        
        if (Array.isArray(farmsData)) {
          setFarms(farmsData);
          if (farmsData.length > 0) {
            setSelectedFarmId(farmsData[0].farmId);
          }
        } else {
          setFarms([]);
          setSelectedFarmId(null);
        }
      } catch (error) {
        console.error("Error fetching farms:", error);
        setFarms([]);
        setSelectedFarmId(null);
      } finally {
        setLoading(false);
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
            credentials: "include",
          });
          const data = await response.json();
          setSensorData(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error("Error fetching data:", error);
          setSensorData([]);
        }
      };

      fetchData();
    }
  }, [timeFrame, selectedFarmId]);

  // 데이터 유효성 검사 함수
  const hasValidData = (data) => {
    return data && data.length > 0 && data.some(value => value !== null && value !== undefined && !isNaN(value));
  };

  // 센서 데이터 차트 생성 함수
  const createChartData = (sensorType, data) => {
    const config = SENSOR_CONFIGS[sensorType] || {
      icon: '📊',
      label: sensorType,
      color: 'rgba(75, 192, 192, 0.8)',
      bgColor: 'rgba(75, 192, 192, 0.2)',
      textColor: 'text-secondary'
    };

    return {
      labels: data.map(entry => entry.date),
      datasets: [{
        label: config.label,
        data: data.map(entry => entry[sensorType]),
        borderColor: config.color,
        backgroundColor: config.bgColor,
        tension: 0.3,
      }]
    };
  };

  // 센서 타입 목록 가져오기
  const getSensorTypes = () => {
    if (sensorData.length === 0) return [];
    return Object.keys(sensorData[0]).filter(key => key !== 'date');
  };

  return (
    <Container className="py-5">
      <h2 className="text-center text-success fw-bold mb-4">📊 환경 그래프</h2>

      {loading ? (
        <div className="text-center">
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Spinner
              animation="border"
              variant="success"
              style={{ width: "3rem", height: "3rem", borderWidth: "0.25rem" }}
            />
            <p style={{ marginLeft: "1rem", fontSize: "1.5rem", color: "#5a9a5a" }}>
              로딩 중... 기다려주세요
            </p>
          </div>
        </div>
      ) : !Array.isArray(farms) || farms.length === 0 ? (
        <div className="text-center">
          <h3 style={{ color: "#5a9a5a" }}>아직 생성된 농장이 없습니다 🌱</h3>
        </div>
      ) : (
        <>
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

                <Row className="mb-4">
                  <Col md={12}>
                    {getSensorTypes().length > 0 ? (
                      getSensorTypes().map(sensorType => {
                        const config = SENSOR_CONFIGS[sensorType] || {
                          icon: '📊',
                          label: sensorType,
                          color: 'rgba(75, 192, 192, 0.8)',
                          bgColor: 'rgba(75, 192, 192, 0.2)',
                          textColor: 'text-secondary'
                        };
                        
                        return (
                          <Card className="shadow-sm mb-4" key={sensorType}>
                            <Card.Body>
                              <h5 className={`${config.textColor} mb-3`}>
                                {config.icon} {sensorType} 변화
                              </h5>
                              {hasValidData(sensorData.map(entry => entry[sensorType])) ? (
                                <Line 
                                  data={createChartData(sensorType, sensorData)} 
                                  height={chartHeight} 
                                  options={{ responsive: true }} 
                                />
                              ) : (
                                <Alert variant="info" className="text-center mb-0">
                                  데이터가 없습니다.
                                </Alert>
                              )}
                            </Card.Body>
                          </Card>
                        );
                      })
                    ) : (
                      <Alert variant="warning" className="text-center">
                        설치된 센서가 없습니다.
                      </Alert>
                    )}
                  </Col>
                </Row>
              </Tab>
            ))}
          </Tabs>
        </>
      )}
    </Container>
  );
}

export default UserDataVisualization;
