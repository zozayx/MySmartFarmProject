import { useState } from "react";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import { Link, useNavigate } from "react-router-dom";
import { usePopup } from "../context/PopupContext"; // 모달 컨텍스트 임포트

function SmartFarmNavbar() {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const { showPopup } = usePopup(); // 모달 함수 가져오기

  const handleNavClick = (path) => {
    setExpanded(false);
    navigate(path);
  };

  const handleLogout = () => {
    setExpanded(false);
  
    showPopup({
      title: "로그아웃",
      message: "로그아웃 하시겠습니까?",
      buttonText: "로그아웃",
      cancelButtonText: "취소",
      confirmVariant: "success", // 초록
      cancelVariant: "danger",   // 빨강
      onConfirm: () => {
        sessionStorage.removeItem("userRole");
        showPopup({
          title: "로그아웃 완료",
          message: "정상적으로 로그아웃되었습니다.",
          buttonText: "확인",
          confirmVariant: "primary", // 파랑
          onConfirm: () => navigate("/login")
        });
      }
    });
  };

  return (
    <Navbar
      expand="lg"
      bg="success"
      data-bs-theme="dark"
      className="shadow-lg"
      expanded={expanded}
    >
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold text-white">
          🌱 Smart Farm
        </Navbar.Brand>

        <Navbar.Toggle
          aria-controls="basic-navbar-nav"
          onClick={() => setExpanded(!expanded)}
        />

        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link onClick={() => handleNavClick("/user/dashboard-control")} className="text-white">
              🏡 대시보드 & 제어
            </Nav.Link>
            <Nav.Link onClick={() => handleNavClick("/data")} className="text-white">
              📊 데이터
            </Nav.Link>
            <Nav.Link onClick={() => handleNavClick("/env-settings")} className="text-white">
              🌿 맞춤 설정
            </Nav.Link>

            <NavDropdown title="⚙️ 설정" id="basic-nav-dropdown">
              <NavDropdown.Item onClick={() => handleNavClick("/settings")}>
                🔧 시스템 설정
              </NavDropdown.Item>
              <NavDropdown.Item onClick={() => handleNavClick("/profile")}>
                👤 내 프로필
              </NavDropdown.Item>
              <NavDropdown.Item onClick={() => handleNavClick("/help")}>
                ❓ 도움말
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={handleLogout}>
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