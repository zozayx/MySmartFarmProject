import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button , Alert, Spinner , Form} from "react-bootstrap";
import {
  FaLightbulb,
  FaRegLightbulb,
  FaFan,
  FaSeedling,
  FaShower,
} from "react-icons/fa";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

function UserControlPanel() {
  const [ledStatus, setLedstatus] = useState("OFF");  // 기본값 "OFF"
  const [fanStatus, setFanStatus] = useState("OFF");  // 기본값 "OFF"
  const [waterStatus, setWaterStatus] = useState("OFF");  // 기본값 "OFF"

  const [lightErrorMessage, setLightErrorMessage] = useState("");
  const [fanErrorMessage, setFanErrorMessage] = useState("");
  const [waterErrorMessage, setWaterErrorMessage] = useState("");

   const [inputValues, setInputValues] = useState({
      temperature: null,
      humidity: null,
      soilMoisture: null,
    });
    const [farmNames, setfarmNames] = useState([]);
    const [farmName, setfarmName] = useState("");
    const [savedSettings, setSavedSettings] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
          try {
            setLoading(true);
            console.log("🔄 품종 데이터 요청 중...");
    
            const res = await fetch(`${BASE_URL}/user/farm-types`, {
              method: "GET",
              credentials: "include", // 쿠키 포함
            });
    
            console.log("✅ 응답 상태:", res.status);
    
            if (!res.ok) {
              throw new Error("품종 목록과 환경 설정을 불러오는 데 실패했습니다.");
            }
    
            const data = await res.json();
            console.log("📦 받은 데이터:", data);
    
            if (data.success && Array.isArray(data.farmNames)) {
              setfarmNames(data.farmNames);
    
              if (data.farmNames.length > 0) {
                const firstFarm = data.farmNames[0];
                setfarmName(firstFarm.farmName);
                setInputValues({
                  temperature: firstFarm.temperature,
                  humidity: firstFarm.humidity,
                  soilMoisture: firstFarm.soilMoisture,
                });
                setSavedSettings(firstFarm);
              }
            } else {
              throw new Error(data.message || "데이터를 불러오는 데 실패했습니다.");
            }
          } catch (err) {
            console.error("❌ 에러 발생:", err);
            setErrorMessage(err.message);
          } finally {
            setLoading(false);
          }
        };
    
        fetchData();
      }, []);
    
      const handleChange = (e) => {
        const { name, value } = e.target;
        setInputValues({ ...inputValues, [name]: value });
      };
    
      const handleFarmChange = (e) => {
        const selectedFarm = e.target.value;
        setfarmName(selectedFarm);
        const selectedFarmData = farmNames.find(
          (farm) => farm.farmName === selectedFarm
        );
        if (selectedFarmData) {
          setInputValues({
            temperature: selectedFarmData.temperature,
            humidity: selectedFarmData.humidity,
            soilMoisture: selectedFarmData.soilMoisture,
          });
        }
      };
    
      const handleSave = async () => {
        setLoading(true);
        setErrorMessage(null);
    
        const settings = {
          farmName: farmName,
          temperature: inputValues.temperature,
          humidity: inputValues.humidity,
          soilMoisture: inputValues.soilMoisture,
        };
    
        try {
          const res = await fetch(`${BASE_URL}/user/farm-settings`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include", // 쿠키 포함
            body: JSON.stringify(settings),
          });
    
          const data = await res.json();
    
          if (data.success) {
            setSavedSettings(settings);
            alert("환경 설정이 저장되었습니다!");
          } else {
            throw new Error(data.message || "설정 저장 실패");
          }
        } catch (err) {
          setErrorMessage(err.message);
        } finally {
          setLoading(false);
        }
      };

  useEffect(() => {
    // LED 상태 가져오기
    fetch(`${BASE_URL}/led/status`, {
      method: "GET",
      //credentials: "include",  // 인증 정보 전송
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.ledStatus) {
          setLedstatus(data.ledStatus);
        }
      })
      .catch(() => {
        setLightErrorMessage("");  // 오류 메시지 비우기
      });

    // 팬 상태 가져오기
    fetch(`${BASE_URL}/fan/status`, {
      method: "GET",
      //credentials: "include",  // 인증 정보 전송
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.fanStatus) {
          setFanStatus(data.fanStatus);
        }
      })
      .catch(() => {
        setFanErrorMessage("");  // 오류 메시지 비우기
      });

    // 급수 상태 가져오기
    fetch(`${BASE_URL}/watering/status`, {
      method: "GET",
      //credentials: "include",  // 인증 정보 전송
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.wateringStatus) {
          setWaterStatus(data.wateringStatus);
        }
      })
      .catch(() => {
        setWaterErrorMessage("");  // 오류 메시지 비우기
      });
  }, []);

  const toggleLight = () => {
    setLightErrorMessage("");
    const newStatus = ledStatus === "ON" ? "OFF" : "ON";

    fetch(`${BASE_URL}/actuator/led/control`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      //credentials: "include",  // 인증 정보 전송
      body: JSON.stringify({ ledStatus: newStatus }),
    })
      .then((res) => res.json())
      .then((data) => setLedstatus(data.ledStatus))
      .catch(() => setLightErrorMessage("⚠️ 전구 제어 실패"));
  };

  const toggleFan = () => {
    setFanErrorMessage("");
    const newStatus = fanStatus === "ON" ? "OFF" : "ON";

    fetch(`${BASE_URL}/actuator/fan/control`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      //credentials: "include",  // 인증 정보 전송
      body: JSON.stringify({ fanStatus: newStatus }),
    })
      .then((res) => res.json())
      .then((data) => setFanStatus(data.fanStatus))
      .catch(() => setFanErrorMessage("⚠️ 팬 제어 실패"));
  };

  const toggleWatering = () => {
    setWaterErrorMessage("");
    const newStatus = waterStatus === "ON" ? "OFF" : "ON";

    fetch(`${BASE_URL}/actuator/watering/control`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      //credentials: "include",  // 인증 정보 전송
      body: JSON.stringify({ wateringStatus: newStatus }),
    })
      .then((res) => res.json())
      .then((data) => setWaterStatus(data.wateringStatus))
      .catch(() => setWaterErrorMessage("⚠️ 급수 제어 실패"));
  };

  if (loading) {
      return (
        <Container className="py-5 text-center">
          <Spinner animation="border" variant="primary" />
        </Container>
      );
    }

  return (
  <Container className="py-5">
    {/* 🤖 자동 제어 설정 영역 */}
    <h2 className="mb-4 text-center">🤖 자동 제어 패널</h2>

    {savedSettings && (
      <Alert variant="info" className="text-center">
        ✅ 현재 자동 기준값: 온도 <strong>{savedSettings.temperature}℃</strong> / 습도{" "}
        <strong>{savedSettings.humidity}%</strong> / 토양 습도{" "}
        <strong>{savedSettings.soilMoisture}%</strong> / 농장 이름{" "}
        <strong>{savedSettings.farmName}</strong>
      </Alert>
    )}

    {errorMessage && (
      <Alert variant="danger" className="text-center">
        {errorMessage}
      </Alert>
    )}

    <Card className="p-4 shadow-sm mb-5">
      <Form>
        <Row className="mb-4">
          <Col md={6}>
            <Form.Group>
              <Form.Label>📌 농장 선택</Form.Label>
              <Form.Select value={farmName} onChange={handleFarmChange}>
                {Array.isArray(farmNames) && farmNames.length > 0 ? (
                  farmNames.map((type) => (
                    <option key={type.farmName} value={type.farmName}>
                      {type.farmName}
                    </option>
                  ))
                ) : (
                  <option disabled>등록된 품종이 없습니다.</option>
                )}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Row className="mb-4">
          <Col md={4}>
            <Form.Group>
              <Form.Label>🌡️ 온도 기준 (°C)</Form.Label>
              <Form.Control
                type="number"
                name="temperature"
                value={inputValues.temperature ?? ""}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>

          <Col md={4}>
            <Form.Group>
              <Form.Label>💧 습도 기준 (%)</Form.Label>
              <Form.Control
                type="number"
                name="humidity"
                value={inputValues.humidity ?? ""}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>

          <Col md={4}>
            <Form.Group>
              <Form.Label>🌱 토양 습도 기준 (%)</Form.Label>
              <Form.Control
                type="number"
                name="soilMoisture"
                value={inputValues.soilMoisture ?? ""}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
        </Row>

        <div className="text-center mt-4">
          <Button
            variant="success"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? <Spinner animation="border" size="sm" /> : "기준값 저장"}
          </Button>
        </div>
      </Form>
    </Card>

    {/* ⚙️ 수동 제어 패널 영역 */}
    <h2 className="mb-4 text-center">⚙️ 수동 제어 패널</h2>
    <Row className="g-4">
      {/* 💡 조명 */}
      <Col xs={12} md={4}>
        <Card className="shadow-sm text-center">
          <Card.Body>
            <h5 className="fw-bold text-primary">조명 제어</h5>
            <div className="display-5 my-2">
              {ledStatus === "ON" ? (
                <FaLightbulb className="text-warning" />
              ) : (
                <FaRegLightbulb style={{ color: "gray" }} />
              )}
            </div>
            <p className="text-muted">
              현재 상태: {ledStatus === "ON" ? "켜짐" : "꺼짐"}
            </p>
            <Button
              variant={ledStatus === "ON" ? "danger" : "success"}
              className="fw-bold w-100"
              onClick={toggleLight}
            >
              {ledStatus === "ON" ? "전구 끄기" : "전구 켜기"}
            </Button>
            {lightErrorMessage && (
              <p className="mt-3 text-danger small">{lightErrorMessage}</p>
            )}
          </Card.Body>
        </Card>
      </Col>

      {/* 💧 급수 */}
      <Col xs={12} md={4}>
        <Card className="shadow-sm text-center">
          <Card.Body>
            <h5 className="fw-bold text-primary">급수 제어</h5>
            <div className="display-5 my-2">
              {waterStatus === "ON" ? (
                <FaShower className="text-info" />
              ) : (
                <FaSeedling style={{ color: "green" }} />
              )}
            </div>
            <p className="text-muted">
              현재 상태: {waterStatus === "ON" ? "작동 중" : "대기 중"}
            </p>
            <Button
              variant={waterStatus === "ON" ? "danger" : "success"}
              className="fw-bold w-100"
              onClick={toggleWatering}
            >
              {waterStatus === "ON" ? "급수 중지" : "급수 시작"}
            </Button>
            {waterErrorMessage && (
              <p className="mt-3 text-danger small">{waterErrorMessage}</p>
            )}
          </Card.Body>
        </Card>
      </Col>

      {/* 🌬️ 팬 */}
      <Col xs={12} md={4}>
        <Card className="shadow-sm text-center">
          <Card.Body>
            <h5 className="fw-bold text-primary">환기팬 제어</h5>
            <div className="display-5 my-2">
              <FaFan
                style={{
                  color: fanStatus === "ON" ? "#0d6efd" : "gray",
                  transform: fanStatus === "ON" ? "rotate(45deg)" : "none",
                }}
              />
            </div>
            <p className="text-muted">
              현재 상태: {fanStatus === "ON" ? "켜짐" : "꺼짐"}
            </p>
            <Button
              variant={fanStatus === "ON" ? "danger" : "success"}
              className="fw-bold w-100"
              onClick={toggleFan}
            >
              {fanStatus === "ON" ? "팬 끄기" : "팬 켜기"}
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
};

export default UserControlPanel;
