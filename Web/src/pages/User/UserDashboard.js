import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Nav, Spinner} from "react-bootstrap";
import { useParams } from "react-router-dom";
import { Line } from "react-chartjs-2"; // 그래프를 위한 라이브러리
import moment from "moment"; // 날짜 포맷을 위한 라이브러리

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

  const temperatureData = dailySensorLogs.map((item) => item.temperature);
  const humidityData = dailySensorLogs.map((item) => item.humidity);
  const soilmoistureData = dailySensorLogs.map((item) => item.soil_moisture);

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
          {data.sensorLogs[0].temperature !== undefined && (
            <Col md={4}>
              <Card className="text-center shadow-sm">
                <Card.Body>
                  <h6 className="text-primary">🌡️ 현재 온도</h6>
                  <h2 className="text-danger">{temperature}°C</h2>
                </Card.Body>
              </Card>
            </Col>
          )}
          {data.sensorLogs[0].humidity !== undefined && (
            <Col md={4}>
              <Card className="text-center shadow-sm">
                <Card.Body>
                  <h6 className="text-primary">💧 현재 습도</h6>
                  <h2 className="text-primary">{humidity}%</h2>
                </Card.Body>
              </Card>
            </Col>
          )}
          {data.sensorLogs[0].soil_moisture !== undefined && (
            <Col md={4}>
              <Card className="text-center shadow-sm">
                <Card.Body>
                  <h6 className="text-primary">🌱 토양 수분</h6>
                  <h2 className="text-info">{soil_moisture}%</h2>
                </Card.Body>
              </Card>
            </Col>
          )}
        </Row>
      )}
  
      {/* 하루 평균 그래프 */}
      {data.dailySensorLogs?.length > 0 && (
        <Row className="mb-4">
          {/* 그래프용 데이터는 전처리해서 props로 넘겨야 함. 예: tempChartData, humidChartData, moistChartData */}
          <Col md={4}>
            <Card className="shadow-sm">
              <Card.Body>
                <h6 className="text-success">📈 온도 변화 (최근 24시간)</h6>
                <Line data={chartConfig("온도(°C)", temperatureData, {
                  border: "rgba(255, 99, 132, 0.8)",
                  background: "rgba(255, 99, 132, 0.2)",
                })} height={150} />
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-sm">
              <Card.Body>
                <h6 className="text-warning">💦 습도 변화 (최근 24시간)</h6>
                <Line data={chartConfig("습도(%)", humidityData, {
                  border: "rgba(54, 162, 235, 0.8)",
                  background: "rgba(54, 162, 235, 0.2)",
                })} height={150} />
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-sm">
              <Card.Body>
                <h6 className="text-primary">🌱 토양 수분 변화 (최근 24시간)</h6>
                <Line data={chartConfig("토양 수분(%)", soilmoistureData, {
                  border: "rgba(75, 192, 192, 0.8)",
                  background: "rgba(75, 192, 192, 0.2)",
                })} height={150} />
              </Card.Body>
            </Card>
          </Col>
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
                    {sensor.type === "temperature" && "🌡 온도 센서"}
                    {sensor.type === "humidity" && "💧 습도 센서"}
                    {sensor.type === "soil_moisture" && "🌱 토양 습도 센서"}
                    {!["temperature", "humidity", "soil_moisture"].includes(sensor.type) && `📟 ${sensor.type} 센서`}
                    : <strong>{sensor.active ? "활성화됨" : "비활성화됨"}</strong>
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
                    {device.type === "lighting" && "💡 조명"}
                    {device.type === "watering" && "💦 급수 시스템"}
                    {device.type === "fan" && "🌬 팬"}
                    {!["lighting", "watering", "fan"].includes(device.type) && `⚙️ ${device.type}`}
                    : <strong>{device.active ? "활성화됨" : "비활성화됨"}</strong>
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
