import React, { useState } from "react";
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

function UserCreateFarm() {
  const [formData, setFormData] = useState({
    farmName: "",
    location: "",
    crop: "",
    farmSize: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${BASE_URL}/user/createfarm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        alert("농장이 성공적으로 추가되었습니다!");
        // 입력 폼 초기화
        setFormData({
          farmName: "",
          location: "",
          crop: "",
          farmSize: "",
        });
      } else {
        throw new Error(data.message || "농장 추가에 실패했습니다.");
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
        <Spinner animation="border" variant="success" />
        <p className="mt-3" style={{ color: "#5a9a5a" }}>🌱 농장을 추가하는 중입니다...</p>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h2 className="mb-4 text-center text-success">🌱 내 농장 추가</h2>

      {errorMessage && (
        <Alert variant="danger" className="text-center">
          {errorMessage}
        </Alert>
      )}

      <Card className="p-4 shadow-sm">
        <Form onSubmit={handleSubmit}>
          <Row className="mb-4">
            <Col md={6}>
              <Form.Group>
                <Form.Label>📌 농장 이름</Form.Label>
                <Form.Control
                  type="text"
                  name="farmName"
                  value={formData.farmName}
                  onChange={handleChange}
                  placeholder="농장 이름을 입력하세요"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>📍 지역</Form.Label>
                <Form.Control
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="농장 위치를 입력하세요"
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-4">
            <Col md={6}>
              <Form.Group>
                <Form.Label>🌿 키울 작물</Form.Label>
                <Form.Control
                  type="text"
                  name="crop"
                  value={formData.crop}
                  onChange={handleChange}
                  placeholder="키울 작물을 입력하세요"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>📏 농장 크기 (m²)</Form.Label>
                <Form.Control
                  type="number"
                  name="farmSize"
                  value={formData.farmSize}
                  onChange={handleChange}
                  placeholder="농장 크기를 입력하세요"
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="text-center mt-4">
            <Button
              variant="success"
              type="submit"
              disabled={loading}
              size="lg"
            >
              {loading ? <Spinner animation="border" size="sm" /> : "농장 추가하기"}
            </Button>
          </div>
        </Form>
      </Card>
    </Container>
  );
}

export default UserCreateFarm;
