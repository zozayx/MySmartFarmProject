require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');  // axios를 가져옵니다.

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

// 환경 변수에서 라즈베리파이 IP 가져오기 (localhost로 로컬 테스트 가능)
const RPI_IP = process.env.RPI_IP || 'localhost'; // 로컬 개발을 위한 기본값 localhost

// 전구 상태 저장 변수
let isLightOn = false;
let isFanOn = false;

// 로그인 처리
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === '1234') {
    res.status(200).json({ success: true, role: 'admin' });
  } else if (username === 'user' && password === '1234') {
    res.status(200).json({ success: true, role: 'user' });
  } else {
    res.status(401).json({ success: false, message: '로그인 실패: 아이디 또는 비밀번호가 틀렸습니다.' });
  }
});

// 📌 전구 상태 조회 API
app.get('/light/status', (req, res) => {
  res.json({ status: isLightOn ? 'on' : 'off' });
});

// 💡 조명 제어 요청 (웹 → 라즈베리파이)
app.post('/light/toggle', (req, res) => {
  isLightOn = !isLightOn; // 상태 변경
  const message = isLightOn ? 'ON' : 'OFF';

  // 라즈베리파이로 HTTP 요청 보내기 (axios 사용)
  axios.post(`http://${RPI_IP}:3000/light/toggle`, { status: message })
    .then(response => {
      console.log(`📤 조명 제어 상태: ${message}`);
      res.json({ status: isLightOn ? 'on' : 'off' });
    })
    .catch(err => {
      console.error('❌ 라즈베리파이로 조명 제어 요청 실패:', err);

      // 라즈베리파이로 요청을 보냈으나 실패한 경우
      if (err.code === 'ECONNREFUSED') {
        // 라즈베리파이 연결이 안 됐을 경우
        res.status(500).json({ error: '⚠️ 라즈베리파이로 조명 제어 요청 실패! 라즈베리파이와 연결을 확인하세요.' });
      } else {
        // 네트워크 연결 등의 문제로 실패한 경우
        res.status(500).json({ error: '⚠️ 전구 제어 요청 실패! 서버와의 연결을 확인하세요.' });
      }
    });
});

// 🌀 환기팬 상태 조회 API
app.get('/fan/status', (req, res) => {
  res.json({ status: isFanOn ? 'on' : 'off' });
});

// 🌀 환기팬 제어 요청 (웹 → 라즈베리파이)
app.post('/fan/toggle', (req, res) => {
  isFanOn = !isFanOn; // 상태 변경
  const message = isFanOn ? 'ON' : 'OFF';

  // 라즈베리파이로 HTTP 요청 보내기 (axios 사용)
  axios.post(`http://${RPI_IP}:3000/fan/toggle`, { status: message })
    .then(response => {
      console.log(`📤 환기팬 제어 상태: ${message}`);
      res.json({ status: isFanOn ? 'on' : 'off' });
    })
    .catch(err => {
      console.error('❌ 라즈베리파이로 환기팬 제어 요청 실패:', err);

      // 라즈베리파이로 요청을 보냈으나 실패한 경우
      if (err.code === 'ECONNREFUSED') {
        // 라즈베리파이 연결이 안 됐을 경우
        res.status(500).json({ error: '⚠️ 라즈베리파이로 환기팬 제어 요청 실패! 라즈베리파이와 연결을 확인하세요.' });
      } else {
        // 네트워크 연결 등의 문제로 실패한 경우
        res.status(500).json({ error: '⚠️ 환기팬 제어 요청 실패! 서버와의 연결을 확인하세요.' });
      }
    });
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`🌐 웹서버 실행 중: http://localhost:${PORT}`);
});
