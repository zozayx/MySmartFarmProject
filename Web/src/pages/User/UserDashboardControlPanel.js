import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

function UserDashboardControlPanel() {
  const [lightStatus, setLightStatus] = useState("off");
  const [waterStatus, setWaterStatus] = useState("off");
  const [errorMessage, setErrorMessage] = useState("");

  const temperature = 25;
  const soilMoisture = "습함";
  const sunlight = "80%";

  useEffect(() => {
    fetch(`${BASE_URL}/light/status`)
      .then((res) => res.json())
      .then((data) => setLightStatus(data.status))
      .catch((err) => console.error("전구 상태 가져오기 실패:", err));
  }, []);

  const toggleLight = () => {
    setErrorMessage("");
    fetch(`${BASE_URL}/light/toggle`, { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "on" || data.status === "off") {
          setLightStatus(data.status);
        } else {
          setErrorMessage("⚠️ 전구 상태 변경 실패! 서버와 연결을 확인하세요.");
        }
      })
      .catch(() =>
        setErrorMessage("⚠️ 전구 제어 요청 실패! 네트워크를 확인하세요.")
      );
  };

  const toggleWatering = () => {
    setWaterStatus((prevStatus) => (prevStatus === "on" ? "off" : "on"));
  };

  return (
    <Container className="py-5">
      <h2 className="text-center text-success fw-bold mb-4">
        🏡 스마트팜 모니터링 & 제어
      </h2>

      {/* 대시보드 섹션 */}
      <h3 className="text-center text-primary mb-4">🌿 대시보드</h3>
      <Row className="g-4">
        <Col xs={12} sm={6} md={4}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <h5 className="text-primary fw-bold">🌡 온도</h5>
              <h2 className="text-success">{temperature}°C</h2>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} md={4}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <h5 className="text-primary fw-bold">💧 토양 수분</h5>
              <h2 className="text-info">{soilMoisture}</h2>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} md={4}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <h5 className="text-primary fw-bold">☀️ 일조량</h5>
              <h2 className="text-warning">{sunlight}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* 제어 섹션 */}
      <h3 className="text-center text-primary mt-5 mb-4">🔧 제어</h3>
      <Row className="g-4 mt-4">
        <Col xs={12} md={6}>
          <Card className="shadow-sm text-center">
            <Card.Body>
              <h5 className="fw-bold text-primary">💡 조명 제어</h5>
              <div className="display-5 my-2">
                {lightStatus === "on" ? "💡" : "🔅"}
              </div>
              <p className="text-muted">
                현재 상태: {lightStatus === "on" ? "켜짐" : "꺼짐"}
              </p>
              <Button
                variant={lightStatus === "on" ? "danger" : "success"}
                className="fw-bold w-100"
                onClick={toggleLight}
              >
                {lightStatus === "on" ? "전구 끄기" : "전구 켜기"}
              </Button>
              {errorMessage && (
                <p className="mt-3 text-danger small">{errorMessage}</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} md={6}>
          <Card className="shadow-sm text-center">
            <Card.Body>
              <h5 className="fw-bold text-primary">💧 자동 급수</h5>
              <div className="display-5 my-2">
                {waterStatus === "on" ? "🚿" : "🌱"}
              </div>
              <p className="text-muted">
                현재 상태: {waterStatus === "on" ? "작동 중" : "대기 중"}
              </p>
              <Button
                variant={waterStatus === "on" ? "danger" : "success"}
                className="fw-bold w-100"
                onClick={toggleWatering}
              >
                {waterStatus === "on" ? "급수 중지" : "급수 시작"}
              </Button>
              <p className="mt-3 text-danger small">⚠️ 아직 서비스 준비 중</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default UserDashboardControlPanel;
