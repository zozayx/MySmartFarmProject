// components/AdminNavbar.js
import { Navbar, Nav, Container, NavDropdown } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

function AdminNavbar() {
  const navigate = useNavigate();

  return (
    <Navbar expand="lg" bg="dark" variant="dark" className="shadow">
      <Container>
        <Navbar.Brand onClick={() => navigate("/admin")} style={{ cursor: "pointer" }}>
          🛠️ SmartFarm Admin
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="admin-navbar-nav" />
        <Navbar.Collapse id="admin-navbar-nav">
        <Nav className="me-auto">
            <Nav.Link onClick={() => navigate("/admin")}>대시보드</Nav.Link>
            <Nav.Link onClick={() => navigate("/admin/users")}>사용자 목록</Nav.Link>
            <Nav.Link onClick={() => navigate("/admin/analytics")}>분석 데이터</Nav.Link>
            <Nav.Link onClick={() => navigate("/admin/monitoring")}>디바이스 모니터링</Nav.Link>
            <Nav.Link onClick={() => navigate("/admin/eventlogs")}>이벤트 로그</Nav.Link>
            <Nav.Link onClick={() => navigate("/admin/environment")}>환경 설정</Nav.Link>
            <Nav.Link onClick={() => navigate("/admin/security")}>보안 설정</Nav.Link>
            <Nav.Link onClick={() => navigate("/admin/system")}>시스템 설정</Nav.Link>
        </Nav>
          <Nav>
            <NavDropdown title="관리자" id="admin-user-dropdown" align="end">
              <NavDropdown.Item onClick={() => navigate("/admin/profile")}>
                내 프로필
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={() => navigate("/logout")}>로그아웃</NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default AdminNavbar;
