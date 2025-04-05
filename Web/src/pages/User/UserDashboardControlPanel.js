import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

function UserDashboardControlPanel() {
  const [lightStatus, setLightStatus] = useState("off");
  const [waterStatus, setWaterStatus] = useState("off");
  const [fanStatus, setFanStatus] = useState("off");
  const [lightErrorMessage, setLightErrorMessage] = useState(""); // 전구 에러 메시지
  const [fanErrorMessage, setFanErrorMessage] = useState(""); // 환기팬 에러 메시지

  const temperature = 25;
  const soilMoisture = "습함";
  const sunlight = "80%";

  useEffect(() => {
    // 서버 연결 실패 또는 라즈베리파이 송신 실패 처리
    fetch(`${BASE_URL}/light/status`)
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            throw new Error(data.error || "서버 연결 실패");
          });
        }
        return res.json();
      })
      .then((data) => setLightStatus(data.status))
      .catch((err) => {
        setLightErrorMessage(err.message);
      });

    fetch(`${BASE_URL}/fan/status`)
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            throw new Error(data.error || "서버 연결 실패");
          });
        }
        return res.json();
      })
      .then((data) => setFanStatus(data.status))
      .catch((err) => {
        setFanErrorMessage(err.message);
      });
  }, []);

  const toggleLight = () => {
    setLightErrorMessage(""); // 에러 메시지 초기화
    fetch(`${BASE_URL}/light/toggle`, { method: "POST" })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            throw new Error(data.error || "서버 연결 실패");
          });
        }
        return res.json();
      })
      .then((data) => {
        if (data.status === "on" || data.status === "off") {
          setLightStatus(data.status);
        } else {
          setLightErrorMessage("⚠️ 라즈베리파이로 송신 실패!");
        }
      })
      .catch((err) => {
        setLightErrorMessage(err.message);
      });
  };

  const toggleWatering = () => {
    setWaterStatus((prevStatus) => (prevStatus === "on" ? "off" : "on"));
  };

  const toggleFan = () => {
    setFanErrorMessage(""); // 에러 메시지 초기화
    fetch(`${BASE_URL}/fan/toggle`, { method: "POST" })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            throw new Error(data.error || "서버 연결 실패");
          });
        }
        return res.json();
      })
      .then((data) => {
        if (data.status === "on" || data.status === "off") {
          setFanStatus(data.status);
        } else {
          setFanErrorMessage("⚠️ 라즈베리파이로 송신 실패!");
        }
      })
      .catch((err) => {
        setFanErrorMessage(err.message);
      });
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
        <Col xs={12} md={4}>
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
              {lightErrorMessage && (
                <p className="mt-3 text-danger small">{lightErrorMessage}</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} md={4}>
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

        <Col xs={12} md={4}>
          <Card className="shadow-sm text-center">
            <Card.Body>
              <h5 className="fw-bold text-primary">🌬️ 환기팬 제어</h5>
              <div className="display-5 my-2">
                {fanStatus === "on" ? "🌬️" : "❌"}
              </div>
              <p className="text-muted">
                현재 상태: {fanStatus === "on" ? "켜짐" : "꺼짐"}
              </p>
              <Button
                variant={fanStatus === "on" ? "danger" : "success"}
                className="fw-bold w-100"
                onClick={toggleFan}
              >
                {fanStatus === "on" ? "환기팬 끄기" : "환기팬 켜기"}
              </Button>
              {fanErrorMessage && (
                <p className="mt-3 text-danger small">{fanErrorMessage}</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default UserDashboardControlPanel;
