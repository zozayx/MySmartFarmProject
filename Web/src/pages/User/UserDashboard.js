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

function UserDashboard() {
  const { farm_id } = useParams(); // URL에서 farm_id를 추출합니다.
  const [farms, setFarms] = useState([]); // 농장 목록을 저장
  const [selectedFarmId, setSelectedFarmId] = useState(farm_id || null); // 선택된 farm_id
  const [data, setData] = useState(null); // 대시보드 데이터
  const [loading, setLoading] = useState(true); // 로딩 상태

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
  
        if (!res.ok) throw new Error("Failed to fetch farm list");
  
        const result = await res.json();
        console.log("농장 목록:", result);
  
        // 농장 목록이 있을 때만 setFarms 호출
        if (result && result.length > 0) {
          setFarms(result); // 농장 목록을 설정
        }
      } catch (err) {
        console.error("농장 목록 가져오기 실패:", err);
      }
    };
  
    fetchFarms();
  }, []);

  // 농장 목록이 변경될 때마다 selectedFarmId 설정
useEffect(() => {
  if (farms.length > 0 && !selectedFarmId) {
    setSelectedFarmId(farms[0].farmId); // 첫 번째 농장의 farmId로 기본값 설정
    console.log("기본 선택 농장 ID:", farms[0].farmId);
  }
}, [farms, selectedFarmId]); // farms 배열이 변경되면 실행

  // 선택된 농장의 대시보드 데이터를 가져오는 API 호출
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedFarmId) return; // 선택된 농장이 없으면 요청하지 않음

      setLoading(true); // 데이터 로딩 시작
      try {
        const res = await fetch(`${BASE_URL}/user/dashboard/${selectedFarmId}`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error("Failed to fetch dashboard data");

        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error("대시보드 데이터 가져오기 실패:", err);
      } finally {
        setLoading(false); // 데이터 로딩 완료
      }
    };

    fetchData();
  }, [selectedFarmId]); // selectedFarmId가 변경될 때마다 fetchData를 호출

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Spinner
            animation="border"
            variant="success"
            style={{ width: "3rem", height: "3rem", borderWidth: "0.25rem" }}
          />
          <p style={{ marginLeft: "1rem", fontSize: "1.5rem", color: "#5a9a5a" }}>
            🌱 로딩 중... 기다려주세요 🌱
          </p>
        </div>
      </Container>
    );
  }

  if (!data || (!data.crop && !data.plantedAt)) {
    return (
      <Container className="py-5 text-center">
        <h3 style={{ color: "#5a9a5a" }}>아직 키우는 식물이 없습니다 🌱</h3>
      </Container>
    );
  }

  // 차트에 사용할 데이터 설정 함수
  const sensorLogs = data.sensorLogs || [];
  const dailySensorLogs = data.dailySensorLogs || [];

  const latest = sensorLogs.at(-1) || {};
  const temperature = latest.temperature;
  const humidity = latest.humidity;
  const soil_moisture = latest.soil_moisture;

  const labels = dailySensorLogs.map((item) =>
    new Date(item.time).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );

  // 센서 존재 여부 확인
  const hasTemperatureSensor = data.sensors?.some(sensor => sensor.type === "온도");
  const hasHumiditySensor = data.sensors?.some(sensor => sensor.type === "습도");
  const hasSoilMoistureSensor = data.sensors?.some(sensor => sensor.type === "토양 수분");

  // 센서 로그 데이터 존재 여부 확인
  const hasTemperatureLogs = sensorLogs.some(log => log.temperature !== null && log.temperature !== undefined);
  const hasHumidityLogs = sensorLogs.some(log => log.humidity !== null && log.humidity !== undefined);
  const hasSoilMoistureLogs = sensorLogs.some(log => log.soil_moisture !== null && log.soil_moisture !== undefined);

  // 센서 데이터 유효성 검사
  const isValidSensorData = (data) => {
    return Array.isArray(data) && 
           data.length > 0 && 
           data.some(value => value !== null && value !== undefined && !isNaN(value));
  };

  const temperatureData = dailySensorLogs.map((item) => item.temperature);
  const humidityData = dailySensorLogs.map((item) => item.humidity);
  const soilmoistureData = dailySensorLogs.map((item) => item.soil_moisture);

  // 센서 존재 여부, 로그 데이터 존재 여부, 데이터 유효성 모두 확인
  const hasValidTemperature = hasTemperatureSensor && hasTemperatureLogs && isValidSensorData(temperatureData);
  const hasValidHumidity = hasHumiditySensor && hasHumidityLogs && isValidSensorData(humidityData);
  const hasValidSoilMoisture = hasSoilMoistureSensor && hasSoilMoistureLogs && isValidSensorData(soilmoistureData);

  const chartConfig = (label, data, color) => ({
    labels,
    datasets: [
      {
        label,
        data,
        borderColor: color.border,
        backgroundColor: color.background,
        tension: 0.4,
        fill: true,
      },
    ],
  });
  

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
                color: 'black', // 모든 탭을 검정색으로 설정
                fontWeight: 'normal', // 글자 두께는 normal로 설정
              }}
            >
              {farm.farmName}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>
  
      {(data.crop || data.plantedAt) && (
        <Row className="mb-4">
          <Col>
            <Card className="text-center shadow-sm">
              <Card.Body>
                <h5 className="fw-bold text-primary">키우는 작물 정보</h5>
                {data.crop && <p>품종: <strong>{data.crop}</strong></p>}
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
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
  
      {/* 현재 센서 값 */}
      {data.sensorLogs?.length > 0 && (
        <Row className="g-4 mb-4">
          {hasTemperatureSensor && (
            <Col md={4}>
              <Card className="text-center shadow-sm">
                <Card.Body>
                  <h6 className="text-primary">🌡️ 현재 온도</h6>
                  {hasValidTemperature ? (
                    <h2 className="text-danger">{temperature}°C</h2>
                  ) : (
                    <p className="text-muted">데이터 없음</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          )}
          {hasHumiditySensor && (
            <Col md={4}>
              <Card className="text-center shadow-sm">
                <Card.Body>
                  <h6 className="text-primary">💧 현재 습도</h6>
                  {hasValidHumidity ? (
                    <h2 className="text-primary">{humidity}%</h2>
                  ) : (
                    <p className="text-muted">데이터 없음</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          )}
          {hasSoilMoistureSensor && (
            <Col md={4}>
              <Card className="text-center shadow-sm">
                <Card.Body>
                  <h6 className="text-primary">🌱 토양 수분</h6>
                  {hasValidSoilMoisture ? (
                    <h2 className="text-info">{soil_moisture}%</h2>
                  ) : (
                    <p className="text-muted">데이터 없음</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          )}
        </Row>
      )}
  
      {/* 하루 평균 그래프 */}
      {data.dailySensorLogs?.length > 0 && (
        <Row className="mb-4">
          {/* 온도 그래프 */}
          {hasTemperatureSensor && (
            <Col md={4}>
              <Card className="shadow-sm">
                <Card.Body>
                  <h6 className="text-success">📈 온도 변화 (최근 24시간)</h6>
                  {hasValidTemperature ? (
                    <Line data={chartConfig("온도(°C)", temperatureData, {
                      border: "rgba(255, 99, 132, 0.8)",
                      background: "rgba(255, 99, 132, 0.2)",
                    })} height={150} />
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted">데이터 없음</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          )}

          {/* 습도 그래프 */}
          {hasHumiditySensor && (
            <Col md={4}>
              <Card className="shadow-sm">
                <Card.Body>
                  <h6 className="text-warning">💦 습도 변화 (최근 24시간)</h6>
                  {hasValidHumidity ? (
                    <Line data={chartConfig("습도(%)", humidityData, {
                      border: "rgba(54, 162, 235, 0.8)",
                      background: "rgba(54, 162, 235, 0.2)",
                    })} height={150} />
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted">데이터 없음</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          )}

          {/* 토양 수분 그래프 */}
          {hasSoilMoistureSensor && (
            <Col md={4}>
              <Card className="shadow-sm">
                <Card.Body>
                  <h6 className="text-primary">🌱 토양 수분 변화 (최근 24시간)</h6>
                  {hasValidSoilMoisture ? (
                    <Line data={chartConfig("토양 수분(%)", soilmoistureData, {
                      border: "rgba(75, 192, 192, 0.8)",
                      background: "rgba(75, 192, 192, 0.2)",
                    })} height={150} />
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted">데이터 없음</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          )}
        </Row>
      )}
  
      {/* 센서 목록 */}
      {Array.isArray(data.sensors) && data.sensors.length > 0 && (
        <Row className="mb-4">
          <Col>
            <Card className="text-center shadow-sm">
              <Card.Body>
                <h5 className="text-dark fw-bold">🌡️ 센서 목록</h5>
                {data.sensors.map((sensor) => (
                  <p key={sensor.id}>
                    {sensor.type === "온도" && "🌡️"}
                    {sensor.type === "습도" && "💧"}
                    {sensor.type === "토양 수분" && "🌱"}
                    {!["온도", "습도", "토양 수분"].includes(sensor.type) && "📟"}
                    {" "}
                    <span style={{ fontWeight: 500 }}>{sensor.name}</span>
                    {" "}
                    <span style={{ color: "#666" }}>({sensor.type})</span>
                    {" "}
                    <strong style={{ color: sensor.active ? 'green' : 'red' }}>
                      {sensor.active ? "작동중" : "정지됨"}
                    </strong>
                  </p>
                ))}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
  
      {/* 제어 장치 */}
      {Array.isArray(data.actuators) && data.actuators.length > 0 && (
        <Row className="mb-4">
          <Col>
            <Card className="text-center shadow-sm">
              <Card.Body>
                <h5 className="text-dark fw-bold">⚙️ 제어 장치 상태</h5>
                {data.actuators.map((device) => (
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
                ))}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
}

export default UserDashboard;
