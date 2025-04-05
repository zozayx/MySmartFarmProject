import { Container, Row, Col, Card } from "react-bootstrap";

function AdminDashboard() {
  return (
    <Container className="py-4">
      <h2 className="mb-4 fw-bold">📊 어드민 대시보드</h2>
      <Row>
        <Col md={4}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <Card.Title>전체 사용자</Card.Title>
              <Card.Text className="fs-3 fw-bold">23명</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <Card.Title>활성 장치 수</Card.Title>
              <Card.Text className="fs-3 fw-bold">17대</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <Card.Title>최근 알림</Card.Title>
              <Card.Text className="fs-6 text-muted">온도 이상 감지 (User3)</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default AdminDashboard;
