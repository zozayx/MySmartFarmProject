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
    color: '#FF6B6B',  // 빨간색 계열
    actualStyle: {
      borderColor: '#FF6B6B',
      backgroundColor: 'rgba(255, 107, 107, 0.2)',
      borderWidth: 2,
      borderDash: []
    },
    optimalStyle: {
      borderColor: '#FF6B6B',
      backgroundColor: 'rgba(255, 107, 107, 0.1)',
      borderWidth: 1,
      borderDash: [5, 5]  // 점선 스타일
    },
    textColor: 'text-danger'
  },
  '습도': {
    icon: '💧',
    label: '습도(%)',
    color: '#4D96FF',  // 파란색 계열
    actualStyle: {
      borderColor: '#4D96FF',
      backgroundColor: 'rgba(77, 150, 255, 0.2)',
      borderWidth: 2,
      borderDash: []
    },
    optimalStyle: {
      borderColor: '#4D96FF',
      backgroundColor: 'rgba(77, 150, 255, 0.1)',
      borderWidth: 1,
      borderDash: [5, 5]  // 점선 스타일
    },
    textColor: 'text-info'
  },
  '조도': {
    icon: '☀️',
    label: '조도(lux)',
    color: '#FFB84C',  // 노란색 계열
    actualStyle: {
      borderColor: '#FFB84C',
      backgroundColor: 'rgba(255, 184, 76, 0.2)',
      borderWidth: 2,
      borderDash: []
    },
    optimalStyle: {
      borderColor: '#FFB84C',
      backgroundColor: 'rgba(255, 184, 76, 0.1)',
      borderWidth: 1,
      borderDash: [5, 5]  // 점선 스타일
    },
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
  const [showOptimal, setShowOptimal] = useState(false);

  // 화면 크기에 따른 차트 높이와 옵션 조정
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width <= 576) { // 모바일
        setChartHeight(250);
      } else if (width <= 768) { // 태블릿
        setChartHeight(200);
      } else { // 데스크톱
        setChartHeight(300);  // 데스크톱 차트 높이 증가
      }
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

  // 센서 데이터 차트 생성 함수
  const createChartData = (sensorType, data) => {
    const config = SENSOR_CONFIGS[sensorType] || {
      icon: '📊',
      label: sensorType,
      color: '#6C757D',
      actualStyle: {
        borderColor: '#6C757D',
        backgroundColor: 'rgba(108, 117, 125, 0.2)',
        borderWidth: 2,
        borderDash: []
      },
      optimalStyle: {
        borderColor: '#6C757D',
        backgroundColor: 'rgba(108, 117, 125, 0.1)',
        borderWidth: 1,
        borderDash: [5, 5]
      },
      textColor: 'text-secondary'
    };

    const datasets = [
      {
        label: `실제 ${config.label}`,
        data: data.map(entry => entry[sensorType]?.actual),
        ...config.actualStyle,
        tension: 0.3,
      }
    ];

    if (showOptimal) {
      datasets.push({
        label: `최적 ${config.label}`,
        data: data.map(entry => entry[sensorType]?.optimal),
        ...config.optimalStyle,
        tension: 0.3,
      });
    }

    return {
      labels: data.map(entry => entry.date),
      datasets: datasets
    };
  };

  // 데이터 유효성 검사 함수
  const hasValidData = (data) => {
    return data && data.length > 0 && (
      data.some(entry => (
        (entry.actual !== null && entry.actual !== undefined && !isNaN(entry.actual)) ||
        (entry.optimal !== null && entry.optimal !== undefined && !isNaN(entry.optimal))
      ))
    );
  };

  // 센서 타입 목록 가져오기
  const getSensorTypes = () => {
    if (sensorData.length === 0) return [];
    const allKeys = Object.keys(sensorData[0]).filter(key => key !== 'date');
    // 센서 타입 순서 정의
    const sensorOrder = ['온도', '습도', '조도'];
    // 정의된 순서대로 센서 타입 정렬
    return sensorOrder.filter(type => allKeys.includes(type));
  };

  // 최적값과 실제값 비교 분석 함수
  const analyzeSensorData = (sensorType, data) => {
    if (!data || data.length === 0) return null;

    // 가장 최근 데이터 가져오기
    const latestData = data[data.length - 1];
    const actual = latestData[sensorType]?.actual;
    const optimal = latestData[sensorType]?.optimal;

    if (actual === null || optimal === null) return null;

    const diff = actual - optimal;
    const absDiff = Math.abs(diff);

    // 차이가 0.5 이하면 "적정"으로 판단
    if (absDiff <= 0.5) {
      return {
        type: 'success',
        message: `${sensorType}가 최적 상태입니다.`
      };
    }

    let message = '';
    switch (sensorType) {
      case '온도':
        message = diff > 0 
          ? `최적 온도를 맞추기 위해 ${absDiff.toFixed(1)}°C 낮춰야 합니다.`
          : `최적 온도를 맞추기 위해 ${absDiff.toFixed(1)}°C 높여야 합니다.`;
        break;
      case '습도':
        message = diff > 0
          ? `최적 습도를 맞추기 위해 ${absDiff.toFixed(1)}% 낮춰야 합니다.`
          : `최적 습도를 맞추기 위해 ${absDiff.toFixed(1)}% 높여야 합니다.`;
        break;
      case '조도':
        message = diff > 0
          ? `최적 조도를 맞추기 위해 ${Math.round(absDiff)} lux 낮춰야 합니다.`
          : `최적 조도를 맞추기 위해 ${Math.round(absDiff)} lux 높여야 합니다.`;
        break;
      default:
        return null;
    }

    return {
      type: diff > 0 ? 'warning' : 'info',
      message: message
    };
  };

  // 차트 옵션 생성 함수
  const getChartOptions = (isMobile) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: isMobile ? 12 : 15,
          font: {
            size: isMobile ? 11 : 12
          },
          padding: isMobile ? 10 : 15
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        titleFont: {
          size: isMobile ? 12 : 13
        },
        bodyFont: {
          size: isMobile ? 11 : 12
        },
        padding: isMobile ? 10 : 12,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#000',
        bodyColor: '#666',
        borderColor: '#ddd',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        ticks: {
          maxRotation: isMobile ? 45 : 0,
          minRotation: isMobile ? 45 : 0,
          font: {
            size: isMobile ? 10 : 11
          },
          padding: isMobile ? 5 : 8
        },
        grid: {
          display: !isMobile
        }
      },
      y: {
        beginAtZero: false,
        ticks: {
          font: {
            size: isMobile ? 10 : 11
          },
          padding: isMobile ? 5 : 8
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  });

  return (
    <Container fluid className="py-3 px-2">
      <h2 className="text-center text-success fw-bold mb-3 fs-4">📊 환경 그래프</h2>

      {loading ? (
        <div className="text-center">
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Spinner
              animation="border"
              variant="success"
              style={{ width: "2rem", height: "2rem", borderWidth: "0.25rem" }}
            />
            <p style={{ marginLeft: "1rem", fontSize: "1.2rem", color: "#5a9a5a" }}>
              로딩 중... 기다려주세요
            </p>
          </div>
        </div>
      ) : !Array.isArray(farms) || farms.length === 0 ? (
        <div className="text-center">
          <h3 style={{ color: "#5a9a5a", fontSize: "1.2rem" }}>아직 생성된 농장이 없습니다 🌱</h3>
        </div>
      ) : (
        <>
          <Tabs
            id="farm-tabs"
            activeKey={selectedFarmId}
            onSelect={(farmId) => setSelectedFarmId(farmId)}
            className="mb-3"
            style={{ borderBottom: "2px solid #ddd" }}
          >
            {farms.map((farm) => (
              <Tab eventKey={farm.farmId} title={<span style={{ color: "black", fontSize: "0.9rem" }}>{farm.farmName}</span>} key={farm.farmId}>
                <Row className="mb-3">
                  <Col xs={12} className="text-center">
                    <div className="d-flex flex-wrap justify-content-center gap-2">
                      <Button
                        variant={timeFrame === "7days" ? "success" : "outline-success"}
                        onClick={() => setTimeFrame("7days")}
                        className="btn-sm"
                        style={{ fontSize: "0.9rem" }}
                      >
                        7일 데이터
                      </Button>
                      <Button
                        variant={timeFrame === "30days" ? "success" : "outline-success"}
                        onClick={() => setTimeFrame("30days")}
                        className="btn-sm"
                        style={{ fontSize: "0.9rem" }}
                      >
                        30일 데이터
                      </Button>
                      <Button
                        variant={showOptimal ? "success" : "outline-success"}
                        onClick={() => setShowOptimal(!showOptimal)}
                        className="btn-sm"
                        style={{ fontSize: "0.9rem" }}
                      >
                        {showOptimal ? "최적값 숨기기" : "최적값 보기"}
                      </Button>
                    </div>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col xs={12}>
                    {getSensorTypes().length > 0 ? (
                      getSensorTypes().map(sensorType => {
                        const config = SENSOR_CONFIGS[sensorType] || {
                          icon: '📊',
                          label: sensorType,
                          color: '#6C757D',
                          actualStyle: {
                            borderColor: '#6C757D',
                            backgroundColor: 'rgba(108, 117, 125, 0.2)',
                            borderWidth: 2,
                            borderDash: []
                          },
                          optimalStyle: {
                            borderColor: '#6C757D',
                            backgroundColor: 'rgba(108, 117, 125, 0.1)',
                            borderWidth: 1,
                            borderDash: [5, 5]
                          },
                          textColor: 'text-secondary'
                        };
                        
                        const analysis = showOptimal ? analyzeSensorData(sensorType, sensorData) : null;
                        const isMobile = window.innerWidth <= 768;
                        
                        return (
                          <Card className="shadow-sm mb-3" key={sensorType}>
                            <Card.Body className="p-2">
                              <h5 className={`${config.textColor} mb-2 fs-6`}>
                                {config.icon} {sensorType} 변화
                              </h5>
                              {analysis && (
                                <Alert variant={analysis.type} className="mb-2 py-2" style={{ fontSize: "0.9rem" }}>
                                  {analysis.message}
                                </Alert>
                              )}
                              {hasValidData(sensorData.map(entry => entry[sensorType])) ? (
                                <div style={{ position: 'relative', height: `${chartHeight}px` }}>
                                  <Line 
                                    data={createChartData(sensorType, sensorData)} 
                                    options={getChartOptions(isMobile)} 
                                  />
                                </div>
                              ) : (
                                <Alert variant="info" className="text-center mb-0 py-2" style={{ fontSize: "0.9rem" }}>
                                  데이터가 없습니다.
                                </Alert>
                              )}
                            </Card.Body>
                          </Card>
                        );
                      })
                    ) : (
                      <Alert variant="warning" className="text-center py-2" style={{ fontSize: "0.9rem" }}>
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
