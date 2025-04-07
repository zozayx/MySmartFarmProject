// LoginPage.js
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Form, Button, Alert } from "react-bootstrap";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

function LoginPage({ setUserRole }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  // ✅ 페이지 로드 시 세션 확인
  useEffect(() => {
    const storedRole = sessionStorage.getItem("userRole");
    if (storedRole) {
      setUserRole(storedRole);
      navigate(storedRole === "admin" ? "/admin" : "/user");
    }
  }, [navigate, setUserRole]);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        sessionStorage.setItem("userRole", data.role); // ✅ 세션 저장
        setUserRole(data.role);

        if (data.role === "admin") {
          navigate("/admin");
        } else if (data.role === "user") {
          navigate("/user");
        }
      } else {
        setErrorMsg(data.message || "로그인 실패");
      }
    } catch (error) {
      setErrorMsg("서버와 연결되지 않았습니다.");
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center vh-100">
      <Form onSubmit={handleLogin} className="p-5 bg-light shadow rounded" style={{ minWidth: "300px" }}>
        <h3 className="mb-4 text-center">🔐 로그인</h3>

        {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}

        <Form.Group className="mb-3">
          <Form.Label>아이디</Form.Label>
          <Form.Control
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-4">
          <Form.Label>비밀번호</Form.Label>
          <Form.Control
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Form.Group>

        <Button type="submit" variant="primary" className="w-100">
          로그인
        </Button>
      </Form>
    </Container>
  );
}

export default LoginPage;
