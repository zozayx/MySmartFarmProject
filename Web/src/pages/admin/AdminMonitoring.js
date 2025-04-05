// src/pages/admin/AdminMonitoring.js
import React from "react";
import { Container, Card, Row, Col, Badge } from "react-bootstrap";
import sampleUsers from "./sampleUserData";

function AdminMonitoring() {
  return (
    <Container className="py-5">
      <h3 className="mb-4">🖥️ 사용자별 장치 모니터링</h3>
      <Row>
        {sampleUsers.map((user) => {
          const recent = user.recentData || {};
          const devices = Object.entries(user.devices)
            .map(([key, value]) => (
              <Badge
                bg={value === "ON" ? "success" : "secondary"}
                className="me-2"
                key={key}
              >
                {key}: {value}
              </Badge>
            ));

          return (
            <Col md={6} lg={4} key={user.id} className="mb-4">
              <Card className="shadow-sm h-100">
                <Card.Body>
                  <Card.Title>{user.fullName}</Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">
                    위치: {user.farmLocation}<br />
                    품종: {user.plantType}
                  </Card.Subtitle>
                  <hr />
                  <div className="mb-3">
                    <strong>장치 상태:</strong><br />
                    {devices}
                  </div>
                  <div>
                    <strong>최근 센서 데이터</strong>
                    <ul className="list-unstyled mt-2">
                      <li>🌡️ 온도: {recent.temperature ?? "-"}℃</li>
                      <li>💧 습도: {recent.humidity ?? "-"}%</li>
                      <li>🌱 토양 습도: {recent.soilMoisture ?? "-"}%</li>
                      <li className="text-muted" style={{ fontSize: "0.9em" }}>
                        ⏱️ {recent.timestamp ?? "-"}
                      </li>
                    </ul>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    </Container>
  );
}

export default AdminMonitoring;
