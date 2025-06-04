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
    <Container className="py-5">
      {/* 알림을 제일 상단에 배치 */}
    <Row className="mb-4">
      <Col>
        <Card className="text-center shadow-sm">
          <Card.Body>
            <h5 className="fw-bold text-warning">📣 알림</h5>
            <p style={{ color: 'red' }}>⚠️ 급수 시스템에 문제가 발생했습니다! 확인이 필요합니다.</p>
          </Card.Body>
        </Card>
      </Col>
    </Row>

      <h2 className="text-center fw-bold text-success mb-4">내 스마트팜 상태 보기</h2>
        
      <Nav
        variant="tabs"
        activeKey={selectedFarmId}
        onSelect={(selectedKey) => setSelectedFarmId(selectedKey)}
        style={{ display: 'flex' }}
      >
        {farms.map((farm) => (
          <Nav.Item key={farm.farmId}>
            <Nav.Link
              eventKey={farm.farmId}
              style={{
                color: 'black',
                fontWeight: 'normal',
              }}
            >
              {farm.farmName}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>
  
      {/* 작물 정보 섹션 */}
      <Row className="mb-4">
        <Col>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <h5 className="fw-bold text-primary">키우는 작물 정보</h5>
              {data && data.crop ? (
                <>
                  <p>품종: <strong>{data.crop}</strong></p>
                  {data.plantedAt && (
                    <p>
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
                </>
              ) : (
                <p style={{ color: "#5a9a5a" }}>아직 키우는 식물이 없습니다 🌱</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
  
      {/* 현재 센서 값 */}
      <Row className="g-4 mb-4">
        <Col>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <h5 className="fw-bold text-primary">현재 센서 값</h5>
              {data && data.crop ? (
                data.sensorLogs?.length > 0 ? (
                  <Row>
                    {getSensorTypes().map(type => {
                      const config = getSensorConfig(type);
                      const latest = data.sensorLogs[data.sensorLogs.length - 1] || {};
                      return (
                        <Col md={4} key={type}>
                          <h6 className="text-primary">{config.icon} 현재 {config.label}</h6>
                          {hasSensorData(type) ? (
                            <h2 className={config.color.text}>{latest[type]} {config.unit}</h2>
                          ) : (
                            <p className="text-muted">데이터 없음</p>
                          )}
                        </Col>
                      );
                    })}
                  </Row>
                ) : (
                  <p style={{ color: "#5a9a5a" }}>아직 센서 데이터가 없습니다 📊</p>
                )
              ) : (
                <p style={{ color: "#5a9a5a" }}>작물을 먼저 추가해주세요 🌱</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
  
      {/* 하루 평균 그래프 */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Body>
              <h5 className="fw-bold text-primary">환경 변화 그래프</h5>
              {data && data.crop ? (
                data.dailySensorLogs?.length > 0 ? (
                  <Row>
                    {getSensorTypes().map(type => {
                      const config = getSensorConfig(type);
                      const sensorData = data.dailySensorLogs.map(item => {
                        const value = item[type];
                        return value !== null && value !== undefined && !isNaN(value) ? Number(value) : 0;
                      });
                      const validData = sensorData.filter(value => value !== 0);
                      const minValue = Math.min(...validData);
                      const maxValue = Math.max(...validData);
                      const padding = (maxValue - minValue) * 0.1;
                      
                      return (
                        <Col md={4} key={type}>
                          <h6 className={config.color.text}>{config.icon} {config.label} 변화 (최근 24시간)</h6>
                          {hasSensorData(type) ? (
                            <Line 
                              data={createChartData(type)} 
                              height={150}
                              options={{
                                scales: {
                                  y: {
                                    suggestedMin: Math.max(0, minValue - padding),
                                    suggestedMax: maxValue + padding,
                                    ticks: {
                                      precision: 0,
                                      stepSize: 1
                                    }
                                  }
                                },
                                plugins: {
                                  legend: {
                                    display: true
                                  }
                                }
                              }}
                            />
                          ) : (
                            <div style={{ height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <p className="text-muted">데이터 없음</p>
                            </div>
                          )}
                        </Col>
                      );
                    })}
                  </Row>
                ) : (
                  <p style={{ color: "#5a9a5a" }}>아직 그래프 데이터가 없습니다 📊</p>
                )
              ) : (
                <p style={{ color: "#5a9a5a" }}>작물을 먼저 추가해주세요 🌱</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
  
      {/* 센서 목록 */}
      <Row className="mb-4">
        <Col>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <h5 className="text-dark fw-bold">🌡️ 센서 목록</h5>
              {data && data.crop ? (
                Array.isArray(data.sensors) && data.sensors.length > 0 ? (
                  data.sensors.map((sensor) => {
                    const config = getSensorConfig(sensor.type);
                    return (
                      <p key={sensor.id}>
                        {config.icon}{" "}
                        <span style={{ fontWeight: 500 }}>{sensor.name}</span>
                        {" "}
                        <span style={{ color: "#666" }}>({sensor.type})</span>
                        {" "}
                        <strong style={{ color: sensor.active ? 'green' : 'red' }}>
                          {sensor.active ? "작동중" : "정지됨"}
                        </strong>
                      </p>
                    );
                  })
                ) : (
                  <p style={{ color: "#5a9a5a" }}>등록된 센서가 없습니다 📟</p>
                )
              ) : (
                <p style={{ color: "#5a9a5a" }}>작물을 먼저 추가해주세요 🌱</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
  
      {/* 제어 장치 */}
      <Row className="mb-4">
        <Col>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <h5 className="text-dark fw-bold">⚙️ 제어 장치 상태</h5>
              {data && data.crop ? (
                Array.isArray(data.actuators) && data.actuators.length > 0 ? (
                  data.actuators.map((device) => (
                    <p key={device.id}>
                      {device.type === "LED" && <FaLightbulb className="text-warning" />}
                      {device.type === "급수" && <FaShower className="text-info" />}
                      {device.type === "팬" && <FaFan className="text-primary" />}
                      {!["LED", "급수", "팬"].includes(device.type) && "⚙️"}
                      {" "}
                      <span style={{ fontWeight: 500 }}>{device.name}</span>
                      {" "}
                      <span style={{ color: "#666" }}>({device.type})</span>
                      {" "}
                      <strong style={{ color: device.active ? "green" : "red" }}>
                        {device.active ? "작동중" : "정지됨"}
                      </strong>
                    </p>
                  ))
                ) : (
                  <p style={{ color: "#5a9a5a" }}>등록된 제어 장치가 없습니다 ⚙️</p>
                )
              ) : (
                <p style={{ color: "#5a9a5a" }}>작물을 먼저 추가해주세요 🌱</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default UserDashboard;
