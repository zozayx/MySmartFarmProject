import React, { useState, useEffect } from "react";
import {
  Container,
  Form,
  Button,
  Card,
  Row,
  Col,
  Alert,
  Spinner,
} from "react-bootstrap";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

function UserEnvironmentSettings() {
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

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h2 className="mb-4 text-center">🌿 내 농장 설정</h2>

      {savedSettings && (
        <Alert variant="info" className="text-center">
          ✅ 현재 기준 설정:
          온도 <strong>{savedSettings.temperature}℃</strong> / 습도{" "}
          <strong>{savedSettings.humidity}%</strong> / 토양 습도{" "}
          <strong>{savedSettings.soilMoisture}%</strong> / 품종{" "}
          <strong>{savedSettings.farmName}</strong>
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="danger" className="text-center">
          {errorMessage}
        </Alert>
      )}

      <Card className="p-4 shadow-sm">
        <Form>
          <Row className="mb-4">
            <Col md={6}>
              <Form.Group>
                <Form.Label>📌 품종 선택</Form.Label>
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
              {loading ? <Spinner animation="border" size="sm" /> : "저장하기"}
            </Button>
          </div>
        </Form>
      </Card>
    </Container>
  );
}

export default UserEnvironmentSettings;
