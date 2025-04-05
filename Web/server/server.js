// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mqtt = require('mqtt');

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

// MQTT 연결 (브로커는 Raspberry Pi)
const RPI_IP = '172.20.10.2'; // 라즈베리파이 IP
const mqttClient = mqtt.connect(`mqtt://${RPI_IP}`);

const CONTROL_TOPIC = 'esp32/control';     // 제어 명령
const SENSOR_TOPIC = 'esp32/testdata';     // 센서 데이터 (ESP32 → 서버)

// MQTT 연결 완료
mqttClient.on('connect', () => {
  console.log('✅ 웹서버가 Raspberry Pi MQTT 브로커에 연결됨');

  // 센서 데이터 토픽 구독
  mqttClient.subscribe(SENSOR_TOPIC, (err) => {
    if (err) {
      console.error('❌ 센서 토픽 구독 실패:', err);
    } else {
      console.log(`📡 센서 토픽 구독 완료: ${SENSOR_TOPIC}`);
    }
  });
});

// ✅ MQTT 연결 에러 처리
mqttClient.on('error', (err) => {
  console.error('❌ MQTT 연결 중 오류 발생:', err);
});

// ✅ MQTT 연결 끊김 처리
mqttClient.on('close', () => {
  console.warn('⚠️ MQTT 연결이 끊어졌습니다.');
});

// MQTT 메시지 수신 처리
mqttClient.on('message', (topic, message) => {
  if (topic === SENSOR_TOPIC) {
    const sensorValue = message.toString();
    console.log(`📥 [MQTT 수신] 센서 데이터: ${sensorValue}`);

    // 👉 여기에 DB 저장 또는 분석 코드 추가 가능
  }
});


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

// 📩 라즈베리파이로부터 HTTP로 센서 데이터 받는 용도 (선택사항)
app.post('/data', (req, res) => {
  const { sensorData } = req.body;
  console.log('📨 [HTTP 수신] 라즈베리파이로부터 센서 데이터:', sensorData);
  res.sendStatus(200);
});

// 전구 상태 저장 변수
let isLightOn = false;

// 📌 전구 상태 조회 API
app.get('/light/status', (req, res) => {
  res.json({ status: isLightOn ? 'on' : 'off' });
});

// 💡 제어 요청 (웹 → ESP32 via MQTT)
app.post('/light/toggle', (req, res) => {
  if (!mqttClient.connected) {
    return res.status(500).json({ error: 'MQTT 연결 실패' });
  }

  isLightOn = !isLightOn; // 상태 변경
  const message = isLightOn ? 'ON' : 'OFF';
  mqttClient.publish(CONTROL_TOPIC, message, { qos: 1 }, (err) => {
    if (err) {
      console.error('❌ 제어 MQTT 전송 실패:', err);
      return res.status(500).json({ error: '전송 실패' });
    }
    console.log(`📤 제어 명령 MQTT 전송됨: ${message}`);
    res.json({ status: isLightOn ? 'on' : 'off' });
  });
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`🌐 웹서버 실행 중: http://localhost:${PORT}`);
});
