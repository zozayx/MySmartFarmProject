import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import { Link } from "react-router-dom";

function SmartFarmNavbar() {
  return (
    <Navbar expand="lg" bg="success" data-bs-theme="dark" className="shadow-lg">
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold text-white">
          🌱 Smart Farm
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />

        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link as={Link} to="/user/dashboard-control" className="text-white">
              🏡 대시보드 & 제어
            </Nav.Link>
            <Nav.Link as={Link} to="/data" className="text-white">
              📊 데이터
            </Nav.Link>
            <Nav.Link as={Link} to="/env-settings" className="text-white">
              🌿 맞춤 설정
            </Nav.Link>

            <NavDropdown title="⚙️ 설정" id="basic-nav-dropdown">
              <NavDropdown.Item as={Link} to="/settings">
                🔧 시스템 설정
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/profile">
                👤 내 프로필
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/help">
                ❓ 도움말
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item as={Link} to="/logout">
                🚪 로그아웃
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default SmartFarmNavbar;
