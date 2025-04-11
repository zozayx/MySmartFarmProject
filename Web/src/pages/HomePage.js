import { Container, Row, Col, Card, Navbar, Nav } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "animate.css";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

function HomePage({ setUserRole }) {
  const navigate = useNavigate();
  const [animated, setAnimated] = useState(false);
  const [userRole, setLocalUserRole] = useState(null); // 로그인 여부 확인용

  // ✅ 자동 로그인 체크
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const res = await fetch(`${BASE_URL}/me`, {
          method: "GET",
          credentials: "include", // 쿠키 포함
        });
        const data = await res.json();
        if (data.success) {
          setUserRole(data.role);       // 상위 App에도 전달
          setLocalUserRole(data.role);  // 로컬 상태에도 저장해서 UI 렌더링
        }
      } catch (err) {
        console.log("자동 로그인 안 됨");
      }
    };

    checkLogin();
  }, [setUserRole]);

  useEffect(() => {
    setTimeout(() => setAnimated(true), 10); // 애니메이션 지연
  }, []);

  return (
    <>
      {/* 상단 네비게이션 바 */}
      <Navbar bg="light" expand="lg" className="px-3 shadow-sm">
        <Navbar.Brand
          className="fw-bold text-success"
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          🌾 ACG 스마트팜
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link onClick={() => navigate("/board")}>게시판</Nav.Link>

            {userRole ? (
              // ✅ 로그인 상태일 때: 내 농장 버튼
              <Nav.Link onClick={() => navigate("/user")}>🌱 내 농장</Nav.Link>
            ) : (
              // ✅ 비로그인 상태일 때: 로그인 & 회원가입
              <>
                <Nav.Link onClick={() => navigate("/register")}>회원가입</Nav.Link>
                <Nav.Link onClick={() => navigate("/login")}>로그인</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Navbar>

      {/* 메인 콘텐츠 */}
      <Container className={`text-center py-5 ${animated ? "animate__animated animate__fadeIn" : ""}`}>
        <h1 className="fw-bold text-success mb-4 animate__animated animate__fadeInDown">
          🌾 ACG 스마트팜에 오신 것을 환영합니다!
        </h1>

        <p className="lead mb-5 animate__animated animate__fadeInUp animate__delay-1s">
          언제 어디서나 농작물을 스마트하게 관리하세요.
          실시간 모니터링과 자동화 제어로 더 효율적인 농업을 경험해보세요.
        </p>

        <Row className="mb-5 animate__animated animate__zoomIn animate__delay-2s">
          {/* 카드 3개 */}
          {[...Array(3)].map((_, i) => (
            <Col md={4} key={i}>
              <Card className="shadow-lg border-0 h-100">
                <Card.Body>
                  <div className="display-4 mb-3">{["📊", "💡", "📱"][i]}</div>
                  <Card.Title className="fw-bold text-primary">
                    {["실시간 데이터", "자동 제어", "쉬운 사용"][i]}
                  </Card.Title>
                  <Card.Text>
                    {
                      [
                        "온도, 습도, 토양 수분을 실시간으로 확인할 수 있어요.",
                        "조명, 급수 시스템을 원격으로 간편하게 제어할 수 있어요.",
                        "초보자도 쉽게 사용할 수 있는 직관적인 UI를 제공합니다.",
                      ][i]
                    }
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </>
  );
}

export default HomePage;
