// src/pages/admin/AdminAnalytics.js
import React from "react";
import { Card, Row, Col, Container } from "react-bootstrap";
import sampleUsers from "./sampleUserData";

function AdminAnalytics() {
  return (
    <Container className="py-5">
      <h3>📈 사용자별 센서 데이터 분석</h3>
      <Row className="mt-4">
        {sampleUsers.map((user) => (
          <Col md={6} lg={4} key={user.id} className="mb-4">
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title>{user.name} ({user.location})</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">{user.email}</Card.Subtitle>
                <Card.Text>
                  <strong>온도:</strong> {user.recentData.temperature}℃<br />
                  <strong>습도:</strong> {user.recentData.humidity}%<br />
                  <strong>토양 습도:</strong> {user.recentData.soilMoisture}%<br />
                  <small className="text-muted">측정시간: 측정시간: {user.recentData?.timestamp ?? "N/A"}</small>
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}

export default AdminAnalytics;
