require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const cookieParser = require('cookie-parser');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

// 미들웨어 설정
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// PostgreSQL 연결 설정
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// ✅ DB 연결 테스트
pool.connect()
  .then(client => {
    console.log('✅ PostgreSQL 데이터베이스 연결 성공');
    client.release();
  })
  .catch(err => {
    console.error('❌ PostgreSQL 연결 실패', err);
  });

  // JWT 인증 미들웨어 추가 (✅ 이 부분 추가!)
function authenticateToken(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ success: false, message: '인증 토큰 없음' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: '유효하지 않은 토큰' });
    req.user = user;
    next();
  });
}

// 🌱 회원가입
app.post('/signup', async (req, res) => {
  console.log('[✅ 요청 도착]');
  const { email, password, user_name, nickname, farm_location } = req.body;

  try {
    console.log('[회원가입 시도]', { email, user_name, nickname });

    const hashedPassword = await bcrypt.hash(password, 10);
    const farmLocationValue = farm_location ? farm_location : null;

    const result = await pool.query(
      `INSERT INTO users (email, password, user_name, nickname, farm_location)
       VALUES ($1, $2, $3, $4, $5) RETURNING user_id, role`,
      [email, hashedPassword, user_name, nickname, farmLocationValue]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.user_id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    console.log('[회원가입 성공]', { userId: user.user_id, role: user.role });

    res
      .cookie('token', token, { httpOnly: true, sameSite: 'Lax', maxAge: 7 * 24 * 60 * 60 * 1000 })
      .json({ success: true, role: user.role });

  } catch (err) {
    console.error('[회원가입 오류]', err);
    res.status(500).json({ success: false, message: '회원가입 실패' });
  }
});

// 🔐 로그인
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('[로그인 시도]', email);

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      console.log('[로그인 실패] 이메일 없음');
      return res.status(401).json({ success: false, message: '이메일 또는 비밀번호가 틀렸습니다.' });
    }

    const user = result.rows[0];
    //const isMatch = await bcrypt.compare(password, user.password);
    const isMatch = password === user.password;
    
    if (!isMatch) {
      console.log('[로그인 실패] 비밀번호 불일치');
      return res.status(401).json({ success: false, message: '이메일 또는 비밀번호가 틀렸습니다.' });
    }

    const token = jwt.sign({ userId: user.user_id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    console.log('[로그인 성공]', { userId: user.user_id, role: user.role });

    res
      .cookie('token', token, { httpOnly: true, sameSite: 'Lax', maxAge: 7 * 24 * 60 * 60 * 1000 })
      .json({ success: true, role: user.role });

  } catch (err) {
    console.error('[로그인 오류]', err);
    res.status(500).json({ success: false, message: '로그인 실패' });
  }
});

// ✅ 자동 로그인
app.get('/me', async (req, res) => {
  const token = req.cookies.token;
  console.log('[자동 로그인 검사]');

  if (!token) {
    console.log('[자동 로그인 실패] 토큰 없음');
    return res.status(401).json({ success: false, message: '토큰 없음' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await pool.query('SELECT role FROM users WHERE user_id = $1', [decoded.userId]);

    if (result.rows.length === 0) {
      console.log('[자동 로그인 실패] 사용자 없음');
      return res.status(401).json({ success: false, message: '사용자 없음' });
    }

    console.log('[자동 로그인 성공]', { userId: decoded.userId });
    res.json({ success: true, role: result.rows[0].role });

  } catch (err) {
    console.error('[자동 로그인 오류]', err);
    res.status(401).json({ success: false, message: '토큰 오류' });
  }
});

// 🚪 로그아웃
app.post("/logout", (req, res) => {
  res.clearCookie("token"); // HttpOnly 쿠키 제거
  res.json({ success: true, message: "로그아웃 완료" });
});

// ✅ User의 대시보드
app.get('/user/dashboard', authenticateToken, async (req, res) => {
  const userId = req.user.userId; // ✅ user.user_id ➝ userId

  try {
    const userPlant = await pool.query(`
      SELECT plant_name, planted_at FROM user_plants
      WHERE user_id = $1 LIMIT 1
    `, [userId]);

    const status = await pool.query(`
      SELECT lighting, watering, fan, updated_at FROM device_status
      JOIN devices ON device_status.device_id = devices.device_id
      WHERE devices.user_id = $1
      ORDER BY updated_at DESC LIMIT 1
    `, [userId]);

    const recentSensorData = await pool.query(`
      SELECT time, temperature, humidity, soil_moisture
      FROM sensor_logs
      JOIN devices ON sensor_logs.device_id = devices.device_id
      WHERE devices.user_id = $1
      ORDER BY time DESC
      LIMIT 10
    `, [userId]);

    res.json({
      crop: userPlant.rows[0]?.plant_name ?? '등록된 작물 없음',
      plantedAt: userPlant.rows[0]?.planted_at,
      deviceStatus: status.rows[0] ?? {},
      sensorLogs: recentSensorData.rows.reverse(), // 시간순 정렬
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '데이터 불러오기 실패' });
  }
});


// 💡 장치 상태 관련 API
let lightStatus = "OFF";
let fanStatus = "OFF";
let wateringStatus = "OFF";

app.get('/light/status', (req, res) => res.json({ lightStatus }));
app.post('/light/toggle', (req, res) => {
  const { lightStatus: status } = req.body;
  if (status !== 'ON' && status !== 'OFF') return res.status(400).json({ error: 'invalid lightStatus' });
  lightStatus = status;
  res.json({ lightStatus });
});

app.get('/fan/status', (req, res) => res.json({ fanStatus }));
app.post('/fan/toggle', (req, res) => {
  const { fanStatus: status } = req.body;
  if (status !== 'ON' && status !== 'OFF') return res.status(400).json({ error: 'invalid fanStatus' });
  fanStatus = status;
  res.json({ fanStatus });
});

app.get('/watering/status', (req, res) => res.json({ wateringStatus }));
app.post('/watering/toggle', (req, res) => {
  const { wateringStatus: status } = req.body;
  if (status !== 'ON' && status !== 'OFF') return res.status(400).json({ error: 'invalid wateringStatus' });
  wateringStatus = status;
  res.json({ wateringStatus });
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`🌐 서버 실행 중: http://localhost:${PORT}`);
});
