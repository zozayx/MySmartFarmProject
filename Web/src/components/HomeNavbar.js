import { useState } from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import { Link } from "react-router-dom";
import { FaSignInAlt, FaUserPlus } from "react-icons/fa";  // 아이콘 사용

function HomeNavbar() {
  const [expanded, setExpanded] = useState(false);

  const handleNavClick = () => {
    setExpanded(false); // 드롭다운 닫기
  };

  return (
    <Navbar bg="light" expand="lg" className="shadow-sm" expanded={expanded}>
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold text-success">
          🌾 ACG 스마트팜
        </Navbar.Brand>
        <Navbar.Toggle 
          aria-controls="basic-navbar-nav" 
          onClick={() => setExpanded(!expanded)} 
        />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/board" onClick={handleNavClick}>게시판</Nav.Link>
            <Nav.Link href="#features" onClick={handleNavClick}>서비스 소개</Nav.Link>
          </Nav>
          <Nav>
            {/* 로그인 아이콘과 텍스트 */}
            <Nav.Link as={Link} to="/login" className="d-flex align-items-center me-2" onClick={handleNavClick}>
              <FaSignInAlt className="me-2" /> 로그인
            </Nav.Link>
            {/* 회원가입 아이콘과 텍스트 */}
            <Nav.Link as={Link} to="/signup" className="d-flex align-items-center" onClick={handleNavClick}>
              <FaUserPlus className="me-2" /> 회원가입
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default HomeNavbar;
