require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const cookieParser = require('cookie-parser');
const moment = require('moment');
const multer = require('multer');
const path = require('path');
const saltRounds = 10;

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

// 업로드된 파일을 클라이언트에서 접근할 수 있도록 설정
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// 파일 업로드 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "uploads"));  // 여기만 바꿈
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('이미지 파일만 업로드할 수 있습니다.'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }  // 5MB 제한
});

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

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const farmLocationValue = farm_location ? farm_location : null;

    const result = await pool.query(
      `INSERT INTO users (email, password, user_name, nickname, farm_location)
       VALUES ($1, $2, $3, $4, $5) RETURNING user_id, role`,
      [email, hashedPassword, user_name, nickname, farmLocationValue]
    );

    console.log('[회원가입 성공]', { userId: result.rows[0].user_id });

    // ❌ JWT 발급 및 쿠키 설정은 생략
    res.json({ success: true, message: '회원가입 성공! 이제 로그인 해주세요.' });

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
    const isMatch = await bcrypt.compare(password, user.password);
    //const isMatch = password === user.password;
    
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

// ✅ 자동 로그인 및 사용자 정보 반환
app.get('/me', async (req, res) => {
  const token = req.cookies.token;
  console.log('[자동 로그인 검사]');

  if (!token) {
    console.log('[자동 로그인 실패] 토큰 없음');
    return res.status(401).json({ success: false, message: '토큰 없음' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await pool.query('SELECT user_id, role FROM users WHERE user_id = $1', [decoded.userId]);

    if (result.rows.length === 0) {
      console.log('[자동 로그인 실패] 사용자 없음');
      return res.status(401).json({ success: false, message: '사용자 없음' });
    }

    console.log('[자동 로그인 성공]', { userId: decoded.userId });
    res.json({ success: true, userId: decoded.userId, role: result.rows[0].role });

  } catch (err) {
    console.error('[자동 로그인 오류]', err);
    res.status(401).json({ success: false, message: '토큰 오류' });
  }
});

// 사용자 정보 조회 (GET)
app.get('/user/profile', authenticateToken, async (req, res) => {
  const userId = req.user.userId;  // JWT 토큰에서 userId 추출

  try {
    // 사용자 기본 정보
    const userResult = await pool.query(`
      SELECT user_id, email, user_name, nickname, farm_location, role, provider, created_at
      FROM users
      WHERE user_id = $1
    `, [userId]);

    if (userResult.rowCount === 0) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    const { password, ...userInfo } = userResult.rows[0];  // 비밀번호 제외한 사용자 정보 반환

    // 작물 정보
    const userPlant = await pool.query(`
      SELECT plant_name, planted_at 
      FROM user_plants
      WHERE user_id = $1 LIMIT 1
    `, [userId]);

    // 장치 상태들
    const devicesResult = await pool.query(`
      SELECT d.device_id, d.type AS device_type, ds.device_status AS status, ds.updated_at
      FROM devices d
      JOIN device_status ds ON d.device_id = ds.device_id
      WHERE d.user_id = $1
      ORDER BY ds.updated_at DESC
    `, [userId]);

    const userDashboard = {
      ...userInfo,
      plant: userPlant.rows[0] || null,
      devices: devicesResult.rows,
    };

    res.json(userDashboard);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 사용자 프로필 수정 (PUT)
app.put('/user/profile', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const { nickname, farm_location, current_password, new_password } = req.body;

  try {
    // 닉네임 중복 체크 (닉네임이 바뀌려는 경우만)
    if (nickname) {
      const nicknameCheck = await pool.query(
        'SELECT user_id FROM users WHERE nickname = $1 AND user_id != $2',
        [nickname, userId]
      );
      if (nicknameCheck.rowCount > 0) {
        return res.status(409).json({ message: '이미 사용 중인 닉네임입니다.' });
      }
    }

    // 비밀번호를 바꾸려는 경우, 현재 비밀번호가 필요함
    let hashedPassword = null;
    if (new_password) {
      if (!current_password) {
        return res.status(400).json({ message: '비밀번호를 변경하려면 현재 비밀번호가 필요합니다.' });
      }

      const userResult = await pool.query(
        'SELECT password FROM users WHERE user_id = $1',
        [userId]
      );

      const isPasswordValid = await bcrypt.compare(current_password, userResult.rows[0].password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: '현재 비밀번호가 올바르지 않습니다.' });
      }

      hashedPassword = await bcrypt.hash(new_password, 10);
    }

    // 업데이트 필드 구성
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (nickname) {
      fields.push(`nickname = $${paramIndex++}`);
      values.push(nickname);
    }

    if (farm_location) {
      fields.push(`farm_location = $${paramIndex++}`);
      values.push(farm_location);
    }

    if (hashedPassword) {
      fields.push(`password = $${paramIndex++}`);
      values.push(hashedPassword);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: '변경할 항목이 없습니다.' });
    }

    values.push(userId); // 마지막에 user_id
    const updateQuery = `UPDATE users SET ${fields.join(', ')} WHERE user_id = $${paramIndex}`;

    await pool.query(updateQuery, values);

    res.status(200).json({ message: '프로필이 성공적으로 수정되었습니다.' });

  } catch (err) {
    console.error('프로필 수정 오류:', err);
    res.status(500).json({ message: '서버 오류로 인해 프로필을 수정할 수 없습니다.' });
  }
});


// 🚪 로그아웃
app.post("/logout", (req, res) => {
  res.clearCookie("token"); // HttpOnly 쿠키 제거
  res.json({ success: true, message: "로그아웃 완료" });
});

// ✅ User의 대시보드
app.get('/user/dashboard', authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    // 작물 정보
    const userPlant = await pool.query(`
      SELECT plant_name, planted_at FROM user_plants
      WHERE user_id = $1 LIMIT 1
    `, [userId]);

    // 장치 상태들
    const devicesResult = await pool.query(`
      SELECT d.device_id, d.type AS device_type, ds.device_status AS status, ds.updated_at
      FROM devices d
      JOIN device_status ds ON d.device_id = ds.device_id
      WHERE d.user_id = $1
      ORDER BY ds.updated_at DESC
    `, [userId]);

    const devices = devicesResult.rows.map(device => ({
      id: device.device_id,
      type: device.device_type,
      status: device.status
    }));

    // 최신 센서 데이터 (최근 1개)
    const recentSensorData = await pool.query(`
      SELECT time, 
             MAX(CASE WHEN sensor_type = 'temperature' THEN sensor_value END) AS temperature,
             MAX(CASE WHEN sensor_type = 'humidity' THEN sensor_value END) AS humidity,
             MAX(CASE WHEN sensor_type = 'soil_moisture' THEN sensor_value END) AS soil_moisture
      FROM sensor_logs
      JOIN devices ON sensor_logs.device_id = devices.device_id
      WHERE devices.user_id = $1
      GROUP BY time
      ORDER BY time DESC
      LIMIT 1
    `, [userId]);

    // ✅ 1시간 단위 평균값 집계 (최근 24시간)
    const hourlyAverages = await pool.query(`
      SELECT
        time_bucket('1 hour', time) AS hour,
        AVG(CASE WHEN sensor_type = 'temperature' THEN sensor_value END) AS avg_temperature,
        AVG(CASE WHEN sensor_type = 'humidity' THEN sensor_value END) AS avg_humidity,
        AVG(CASE WHEN sensor_type = 'soil_moisture' THEN sensor_value END) AS avg_soil_moisture
      FROM sensor_logs
      JOIN devices ON sensor_logs.device_id = devices.device_id
      WHERE devices.user_id = $1
        AND time > NOW() - INTERVAL '24 hours'
      GROUP BY hour
      ORDER BY hour
    `, [userId]);

    const dailySensorLogs = hourlyAverages.rows.map(row => ({
      time: row.hour,
      temperature: Number(row.avg_temperature),
      humidity: Number(row.avg_humidity),
      soil_moisture: Number(row.avg_soil_moisture)
    }));

    res.json({
      crop: userPlant.rows[0]?.plant_name ?? '등록된 작물 없음',
      plantedAt: userPlant.rows[0]?.planted_at,
      devices,
      sensorLogs: recentSensorData.rows.reverse(),
      dailySensorLogs // ✅ 1시간 단위 하루치 센서 로그
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '데이터 불러오기 실패' });
  }
});

// ✅ User의 환경 그래프
app.get('/user/sensor-data', authenticateToken, async (req, res) => {
  const userId = req.user.userId; // authenticateToken 미들웨어에서 userId 추출
  const { timeFrame } = req.query;

  if (!timeFrame || !['7days', '30days'].includes(timeFrame)) {
    return res.status(400).json({ error: 'Invalid timeFrame parameter' });
  }

  const currentDate = moment();  // 현재 날짜와 시간
  let startDate;

  if (timeFrame === '7days') {
    startDate = currentDate.clone().subtract(7, 'days').format('YYYY-MM-DD');
  } else if (timeFrame === '30days') {
    startDate = currentDate.clone().subtract(30, 'days').format('YYYY-MM-DD');
  }

  try {
    const query = `
      SELECT DATE(time) as date, sensor_type, AVG(sensor_value) as avg_value
      FROM sensor_logs
      JOIN devices ON sensor_logs.device_id = devices.device_id
      WHERE devices.user_id = $1
        AND time >= $2
        AND time <= $3
      GROUP BY DATE(time), sensor_type
      ORDER BY DATE(time);
    `;
    const result = await pool.query(query, [userId, startDate, currentDate.format('YYYY-MM-DD')]);

    const sensorData = result.rows.reduce((acc, row) => {
      const date = moment(row.date).format('YYYY-MM-DD');
      if (!acc[date]) {
        acc[date] = {
          date,
          temperature: null,
          humidity: null,
          moisture: null,
        };
      }
      if (row.sensor_type === 'temperature') acc[date].temperature = row.avg_value;
      if (row.sensor_type === 'humidity') acc[date].humidity = row.avg_value;
      if (row.sensor_type === 'soil_moisture') acc[date].moisture = row.avg_value;
      return acc;
    }, {});

    const data = Object.values(sensorData);
    res.json(data);
  } catch (error) {
    console.error("Error fetching sensor data: ", error);
    res.status(500).json({ message: '서버 오류 발생', error: error.message });
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

//유저의 품종 , 기준치 가져오기
app.get('/user/plant-types', authenticateToken, async (req, res) => {
  const userId = req.user.userId;  // JWT에서 사용자 ID 가져오기

  try {
    // 사용자별 식물 품종 및 환경 설정 가져오기
    const result = await pool.query(`
      SELECT plant_name, temperature_optimal, humidity_optimal, soil_moisture_optimal
      FROM user_plants
      WHERE user_id = $1
    `, [userId]);

    if (result.rows.length > 0) {
      // 품종 목록과 환경 설정 정보 반환
      const plantTypes = result.rows.map(row => ({
        plantName: row.plant_name,
        temperature: row.temperature_optimal,
        humidity: row.humidity_optimal,
        soilMoisture: row.soil_moisture_optimal
      }));

      res.json({ success: true, plantTypes });
    } else {
      res.json({ success: false, message: '등록된 식물이 없습니다.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
});


//내 농장 설정 저장
app.post('/user/environment-settings', authenticateToken, async (req, res) => {
  const { plantName, temperature, humidity, soilMoisture } = req.body;
  const userId = req.user.userId;  // JWT에서 사용자 ID 가져오기

  try {
    // 사용자에 해당하는 식물의 환경 설정을 업데이트
    const result = await pool.query(`
      UPDATE user_plants
      SET temperature_optimal = $1, humidity_optimal = $2, soil_moisture_optimal = $3
      WHERE user_id = $4 AND plant_name = $5
      RETURNING *
    `, [temperature, humidity, soilMoisture, userId, plantName]);

    if (result.rows.length > 0) {
      return res.json({ success: true, message: '환경 설정이 저장되었습니다.' });
    } else {
      return res.json({ success: false, message: '환경 설정 저장에 실패했습니다.' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
});

//게시판 미리보기
app.get("/board/posts", async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT p.post_id, p.title, p.plant_type, p.created_at, u.nickname AS author
      FROM board_posts p
      JOIN users u ON p.user_id = u.user_id
      ORDER BY p.created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("게시글 불러오기 실패:", err);
    res.status(500).json({ message: "서버 오류로 게시글을 불러오지 못했습니다." });
  } finally {
    client.release();
  }
});

// 게시글 상세 정보 + 댓글 조회
app.get("/board/posts/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    // 게시글 가져오기
    const postResult = await client.query(`
      SELECT p.post_id, p.title, p.content, p.plant_type, p.created_at, u.nickname AS author
      FROM board_posts p
      JOIN users u ON p.user_id = u.user_id
      WHERE p.post_id = $1
    `, [id]);

    if (postResult.rows.length === 0) {
      return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
    }

    const post = postResult.rows[0];

    // 댓글 가져오기
    const commentResult = await client.query(`
      SELECT c.comment_id, c.comment, c.commented_at, u.nickname AS author
      FROM board_comments c
      JOIN users u ON c.user_id = u.user_id
      WHERE c.post_id = $1
      ORDER BY c.commented_at ASC
    `, [id]);

    const comments = commentResult.rows;

    res.json({ post, comments });
  } catch (err) {
    console.error("게시글 상세 조회 실패:", err);
    res.status(500).json({ message: "서버 오류로 게시글을 불러오지 못했습니다." });
  } finally {
    client.release();
  }
});


// 2. 게시글 수정
app.put('/board/posts/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, content, plant_type } = req.body;
  const userId = req.user.userId;

  try {
    const postResult = await pool.query('SELECT * FROM board_posts WHERE post_id = $1', [id]);
    if (postResult.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const post = postResult.rows[0];
    if (post.user_id !== userId) {
      return res.status(403).json({ message: 'You are not the author of this post' });
    }

    // 게시글 수정
    await pool.query(
      'UPDATE board_posts SET title = $1, content = $2, plant_type = $3 WHERE post_id = $4',
      [title, content, plant_type, id]
    );
    res.json({ message: 'Post updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 2. 게시글 삭제
app.delete('/board/posts/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  try {
    // 게시글의 작성자만 삭제할 수 있도록 체크
    const postResult = await pool.query('SELECT * FROM board_posts WHERE post_id = $1', [id]);
    if (postResult.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const post = postResult.rows[0];
    if (post.user_id !== userId) {
      return res.status(403).json({ message: 'You are not the author of this post' });
    }

    // 댓글도 함께 삭제
    await pool.query('DELETE FROM board_comments WHERE post_id = $1', [id]);
    await pool.query('DELETE FROM board_posts WHERE post_id = $1', [id]);
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 로그인된 사용자 정보 가져오기 (게시글 본인 인증)
app.get('/board/me', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  try {
    // 'id'를 'user_id'로 수정
    const result = await pool.query('SELECT user_id, nickname FROM users WHERE user_id = $1', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
} );

// 댓글 추가 API
app.post("/board/posts/:id/comments", authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment.trim()) {
      return res.status(400).json({ message: "댓글 내용을 입력해주세요." });
    }

    const userId = req.user.userId;

    if (!userId) {
      return res.status(400).json({ message: "사용자 정보가 없습니다." });
    }

    // 댓글 추가
    const result = await client.query(`
      INSERT INTO board_comments (post_id, user_id, comment, commented_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING comment_id, comment, commented_at, user_id
    `, [id, userId, comment]);

    // 닉네임 가져오기
    const userResult = await client.query(`
      SELECT nickname FROM users WHERE user_id = $1
    `, [userId]);

    const newComment = {
      ...result.rows[0],
      author: userResult.rows[0].nickname  // nickname을 author 키로 함께 반환
    };

    res.json({ newComment });
  } catch (err) {
    console.error("댓글 추가 실패:", err);
    res.status(500).json({ message: "서버 오류로 댓글을 추가하지 못했습니다." });
  } finally {
    client.release();
  }
});

app.post('/posts/upload-images', upload.array('images'), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: '이미지 파일을 업로드해주세요.' });
  }

  const imageUrls = req.files.map(file => `/uploads/${file.filename}`);  // 저장된 이미지 URL 리스트
  res.json({ success: true, imageUrls });
});

// 게시글 작성 API (이미지 업로드 포함)
app.post("/write/posts", authenticateToken, upload.array("images", 5), async (req, res) => {
  const uploadedFiles = req.files;  // 업로드된 파일들

  const { title, content, plant_type } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: "제목과 내용을 입력해주세요." });
  }

  try {
    // 이미지 URL을 배열로 만들어 게시글에 추가
    const imageUrls = uploadedFiles.map(file => `/uploads/${file.filename}`);

    // 게시글 DB에 저장 (이 예시는 실제 DB 저장 부분으로 대체)
    const result = await pool.query(`
      INSERT INTO board_posts (user_id, title, content, plant_type, images)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING post_id, title, content, plant_type, images
    `, [req.user.userId, title, content, plant_type, imageUrls]);

    const newPost = result.rows[0];
    res.status(201).json({ newPost });
  } catch (err) {
    console.error("게시글 작성 실패:", err);
    res.status(500).json({ message: "서버 오류로 게시글을 작성하지 못했습니다." });
  }
});


// 서버 실행
app.listen(PORT, () => {
  console.log(`서버가 ${PORT}에서 실행 중...`);
});


// 서버 실행
app.listen(PORT, () => {
  console.log(`🌐 서버 실행 중: http://localhost:${PORT}`);
});
