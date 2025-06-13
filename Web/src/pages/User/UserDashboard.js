import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Nav, Spinner} from "react-bootstrap";
import { useParams } from "react-router-dom";
import { Line } from "react-chartjs-2"; // 그래프를 위한 라이브러리
import {
  FaLightbulb,
  FaFan,
  FaShower,
} from "react-icons/fa";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

// 센서 타입별 설정
const SENSOR_CONFIGS = {
  '온도': {
    icon: '🌡️',
    label: '온도',
    unit: '°C',
    color: {
      border: 'rgba(255, 99, 132, 0.8)',
      background: 'rgba(255, 99, 132, 0.2)',
      text: 'text-danger'
    }
  },
  '습도': {
    icon: '💧',
    label: '습도',
    unit: '%',
    color: {
      border: 'rgba(54, 162, 235, 0.8)',
      background: 'rgba(54, 162, 235, 0.2)',
      text: 'text-primary'
    }
  },
  '조도': {
    icon: '☀️',
    label: '조도',
    unit: 'lux',
    color: {
      border: 'rgba(255, 193, 7, 0.8)',
      background: 'rgba(255, 193, 7, 0.2)',
      text: 'text-warning'
    }
  }
};

// 기본 센서 설정 (알 수 없는 센서 타입용)
const DEFAULT_SENSOR_CONFIG = {
  icon: '📟',
  label: '센서',
  unit: '',
  color: {
    border: 'rgba(128, 128, 128, 0.8)',
    background: 'rgba(128, 128, 128, 0.2)',
    text: 'text-secondary'
  }
};

function UserDashboard() {
  const { farm_id } = useParams(); // URL에서 farm_id를 추출합니다.
  const [farms, setFarms] = useState([]); // 농장 목록을 저장
  const [selectedFarmId, setSelectedFarmId] = useState(farm_id || null); // 선택된 farm_id
  const [data, setData] = useState(null); // 대시보드 데이터
  const [loading, setLoading] = useState(true); // 로딩 상태를 true로 초기화
  const [initialLoad, setInitialLoad] = useState(true);

  // 농장 목록을 가져오는 API 호출
  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const res = await fetch(`${BASE_URL}/user/farm-list`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
  
        if (!res.ok) {
          throw new Error("Failed to fetch farm list");
        }
  
        const result = await res.json();
        console.log("농장 목록:", result);
  
        if (result && result.length > 0) {
          setFarms(result);
        } else {
          setFarms([]);
        }
      } catch (err) {
        console.error("농장 목록 가져오기 실패:", err);
        setFarms([]);
      } finally {
        setInitialLoad(false);
      }
    };
  
    fetchFarms();
  }, []);

  // 농장 목록이 변경될 때마다 selectedFarmId 설정
  useEffect(() => {
    if (farms.length > 0 && !selectedFarmId) {
      setSelectedFarmId(farms[0].farmId);
      console.log("기본 선택 농장 ID:", farms[0].farmId);
    }
  }, [farms, selectedFarmId]);

  // 선택된 농장의 대시보드 데이터를 가져오는 API 호출
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedFarmId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${BASE_URL}/user/dashboard/${selectedFarmId}`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const result = await res.json();
        console.log('대시보드 데이터 수신:', result);
        setData(result);
      } catch (err) {
        console.error("대시보드 데이터 가져오기 실패:", err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedFarmId]);

  // 센서 타입 목록 가져오기
  const getSensorTypes = () => {
    if (!data?.sensors) return [];
    return [...new Set(data.sensors.map(sensor => sensor.type))];
  };

  // 센서 설정 가져오기
  const getSensorConfig = (type) => {
    return SENSOR_CONFIGS[type] || {
      ...DEFAULT_SENSOR_CONFIG,
      label: type,
      icon: '📟'
    };
  };

  // 센서 데이터 유효성 검사
  const isValidSensorData = (data) => {
    return Array.isArray(data) && 
           data.length > 0 && 
           data.some(value => value !== null && value !== undefined && !isNaN(value));
  };

  // 센서 데이터 존재 여부 확인
  const hasSensorData = (type) => {
    const sensorLogs = data?.sensorLogs || [];
    const dailySensorLogs = data?.dailySensorLogs || [];
    const hasSensor = data?.sensors?.some(sensor => sensor.type === type);
    const hasLogs = dailySensorLogs.some(log => {
      const value = log[type];
      return value !== null && value !== undefined && !isNaN(value);
    });
    
    console.log(`센서 타입 ${type} 데이터 확인:`, {
      hasSensor,
      hasLogs,
      sensorLogsCount: sensorLogs.length,
      dailySensorLogsCount: dailySensorLogs.length,
      sampleValue: dailySensorLogs[0]?.[type]
    });

    return hasSensor && hasLogs;
  };

  // 차트 데이터 생성
  const createChartData = (type) => {
    const config = getSensorConfig(type);
    const dailySensorLogs = data?.dailySensorLogs || [];
    const labels = dailySensorLogs.map(item =>
      new Date(item.time).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
    
    const sensorData = dailySensorLogs.map(item => {
      const value = item[type];
      return value !== null && value !== undefined && !isNaN(value) ? Number(value) : 0;
    });

    // 데이터의 최솟값과 최댓값 계산
    const validData = sensorData.filter(value => value !== 0);
    const minValue = Math.min(...validData);
    const maxValue = Math.max(...validData);
    
    // 여유 공간을 위해 최솟값과 최댓값에 약간의 여유 추가
    const padding = (maxValue - minValue) * 0.1;
    const suggestedMin = Math.max(0, minValue - padding);
    const suggestedMax = maxValue + padding;

    console.log(`차트 데이터 생성 (${type}):`, {
      labelsCount: labels.length,
      dataCount: sensorData.length,
      sampleData: sensorData.slice(0, 3),
      minValue,
      maxValue,
      suggestedMin,
      suggestedMax
    });

    return {
      labels,
      datasets: [{
        label: `${config.label}(${config.unit})`,
        data: sensorData,
        borderColor: config.color.border,
        backgroundColor: config.color.background,
        tension: 0.4,
        fill: true,
      }]
    };
  };

  if (initialLoad || loading) {
    return (
      <Container className="py-5 text-center">
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
      </Container>
    );
  }

  // 로딩이 완료된 후에만 농장 목록 체크
  if (!initialLoad && !loading && (!farms || farms.length === 0)) {
    return (
      <Container className="py-5 text-center">
        <h3 style={{ color: "#5a9a5a" }}>아직 생성된 농장이 없습니다 🌱</h3>
      </Container>
    );
  }

  return (
    <Container fluid className="px-3 py-4">
      {/* 알림을 제일 상단에 배치 */}
      <Row className="mb-3">
        <Col>
          <Card className="text-center shadow-sm border-warning">
            <Card.Body className="py-2">
              <h6 className="fw-bold text-warning mb-0">📣 알림</h6>
              <p className="mb-0" style={{ color: 'red', fontSize: '0.9rem' }}>⚠️ 급수 시스템에 문제가 발생했습니다!</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <h2 className="text-center fw-bold text-success mb-3" style={{ fontSize: '1.5rem' }}>내 스마트팜 상태</h2>
        
      {/* 농장 선택 탭 - 모바일에서 스크롤 가능하도록 수정 */}
      <div className="mb-3" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <Nav
          variant="tabs"
          activeKey={selectedFarmId}
          onSelect={(selectedKey) => setSelectedFarmId(selectedKey)}
          className="flex-nowrap"
          style={{ minWidth: 'max-content' }}
        >
          {farms.map((farm) => (
            <Nav.Item key={farm.farmId}>
              <Nav.Link
                eventKey={farm.farmId}
                className="px-3 py-2"
                style={{
                  color: 'black',
                  fontWeight: 'normal',
                  whiteSpace: 'nowrap'
                }}
              >
                {farm.farmName}
              </Nav.Link>
            </Nav.Item>
          ))}
        </Nav>
      </div>
  
      {/* 작물 정보 섹션 */}
      <Row className="mb-3">
        <Col>
          <Card className="text-center shadow-sm">
            <Card.Body className="py-3">
              <h6 className="fw-bold text-primary mb-2">키우는 작물 정보</h6>
              {data && data.crop ? (
                <div className="d-flex flex-column gap-1">
                  <p className="mb-1">품종: <strong>{data.crop}</strong></p>
                  {data.plantedAt && (
                    <p className="mb-0">
                      심은 날짜:{" "}
                      <strong>
                        {new Date(data.plantedAt).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </strong>
                    </p>
                  )}
                </div>
              ) : (
                <p className="mb-0" style={{ color: "#5a9a5a", fontSize: '0.9rem' }}>아직 키우는 식물이 없습니다 🌱</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
  
      {/* 현재 센서 값 */}
      <Row className="g-2 mb-3">
        {getSensorTypes().map(type => {
          const config = getSensorConfig(type);
          const latest = data?.sensorLogs?.[data.sensorLogs.length - 1] || {};
          return (
            <Col xs={6} sm={4} key={type}>
              <Card className="text-center shadow-sm h-100">
                <Card.Body className="py-2">
                  <h6 className="text-primary mb-1" style={{ fontSize: '0.9rem' }}>
                    {config.icon} 현재 {config.label}
                  </h6>
                  {hasSensorData(type) ? (
                    <h3 className={config.color.text + " mb-0"} style={{ fontSize: '1.5rem' }}>
                      {latest[type]} {config.unit}
                    </h3>
                  ) : (
                    <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>데이터 없음</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
  
      {/* 하루 평균 그래프 */}
      <Row className="mb-3">
        {getSensorTypes().map(type => {
          const config = getSensorConfig(type);
          return (
            <Col xs={12} key={type} className="mb-3">
              <Card className="shadow-sm">
                <Card.Body className="py-3">
                  <h6 className={config.color.text + " mb-2"} style={{ fontSize: '0.9rem' }}>
                    {config.icon} {config.label} 변화 (최근 24시간)
                  </h6>
                  {hasSensorData(type) ? (
                    <div style={{ height: '200px' }}>
                      <Line 
                        data={createChartData(type)} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            x: {
                              ticks: {
                                maxRotation: 45,
                                minRotation: 45,
                                font: {
                                  size: 10
                                }
                              }
                            },
                            y: {
                              ticks: {
                                font: {
                                  size: 10
                                }
                              }
                            }
                          },
                          plugins: {
                            legend: {
                              display: true,
                              labels: {
                                font: {
                                  size: 11
                                }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>데이터 없음</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
  
      {/* 센서 목록 */}
      <Row className="mb-3">
        <Col>
          <Card className="shadow-sm">
            <Card.Body className="py-3">
              <h6 className="text-dark fw-bold mb-2">🌡️ 센서 목록</h6>
              {data && data.crop ? (
                Array.isArray(data.sensors) && data.sensors.length > 0 ? (
                  <div className="d-flex flex-column gap-2">
                    {data.sensors.map((sensor) => {
                      const config = getSensorConfig(sensor.type);
                      return (
                        <div key={sensor.id} className="d-flex align-items-center justify-content-between border-bottom pb-2">
                          <div>
                            <span className="me-2">{config.icon}</span>
                            <span style={{ fontWeight: 500 }}>{sensor.name}</span>
                            <span className="text-muted ms-1" style={{ fontSize: '0.8rem' }}>({sensor.type})</span>
                          </div>
                          <span 
                            className="badge" 
                            style={{ 
                              backgroundColor: sensor.active ? '#28a745' : '#dc3545',
                              color: 'white',
                              fontSize: '0.8rem'
                            }}
                          >
                            {sensor.active ? "작동중" : "정지됨"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mb-0" style={{ color: "#5a9a5a", fontSize: '0.9rem' }}>등록된 센서가 없습니다 📟</p>
                )
              ) : (
                <p className="mb-0" style={{ color: "#5a9a5a", fontSize: '0.9rem' }}>작물을 먼저 추가해주세요 🌱</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
  
      {/* 제어 장치 */}
      <Row className="mb-3">
        <Col>
          <Card className="shadow-sm">
            <Card.Body className="py-3">
              <h6 className="text-dark fw-bold mb-2">⚙️ 제어 장치 상태</h6>
              {data && data.crop ? (
                Array.isArray(data.actuators) && data.actuators.length > 0 ? (
                  <div className="d-flex flex-column gap-2">
                    {data.actuators.map((device) => (
                      <div key={device.id} className="d-flex align-items-center justify-content-between border-bottom pb-2">
                        <div>
                          <span className="me-2">
                            {device.type === "LED" && <FaLightbulb className="text-warning" />}
                            {device.type === "급수" && <FaShower className="text-info" />}
                            {device.type === "팬" && <FaFan className="text-primary" />}
                            {!["LED", "급수", "팬"].includes(device.type) && "⚙️"}
                          </span>
                          <span style={{ fontWeight: 500 }}>{device.name}</span>
                          <span className="text-muted ms-1" style={{ fontSize: '0.8rem' }}>({device.type})</span>
                        </div>
                        <span 
                          className="badge" 
                          style={{ 
                            backgroundColor: device.active ? '#28a745' : '#dc3545',
                            color: 'white',
                            fontSize: '0.8rem'
                          }}
                        >
                          {device.active ? "작동중" : "정지됨"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mb-0" style={{ color: "#5a9a5a", fontSize: '0.9rem' }}>등록된 제어 장치가 없습니다 ⚙️</p>
                )
              ) : (
                <p className="mb-0" style={{ color: "#5a9a5a", fontSize: '0.9rem' }}>작물을 먼저 추가해주세요 🌱</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default UserDashboard;
