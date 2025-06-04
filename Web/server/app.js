const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

// 환경변수 설정
dotenv.config();

const { authenticateToken } = require('./middleware/authenticateToken.js');

// 라우트 파일들 불러오기
const authRouter = require('./routes/auth');
const boardRouter = require('./routes/board');
const userRouter = require('./routes/user/dashboard');
const devicesRouter = require('./routes/user/devices');
const autoMationRouter = require('./routes/user/automation.js');
const graphRouter = require('./routes/user/graph.js');
const profileRouter = require('./routes/user/profile.js');
const postRouter = require('./routes/user/post.js');
const farmManagementRouter = require('./routes/user/farmmanagement.js');
const storeRouter = require('./routes/user/store.js');
const createFarmRouter = require('./routes/user/createfarm');
const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어 설정
app.use(cors({
  origin: true,  // 허용할 IP 주소 , 네트워크 바뀔떄마다 해야함
  credentials: true,  // 쿠키 포함
}));
app.use(express.json());
app.use(cookieParser());

// 업로드된 파일을 클라이언트에서 접근할 수 있도록 설정 (boardRouter에서 사용될 예정)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));  // 추가

// 라우트 설정
app.use('/', authRouter);
app.use('/', boardRouter);
app.use('/', authenticateToken, userRouter);  // 인증된 사용자만 접근 가능한 대시보드
app.use('/', authenticateToken, devicesRouter);  // 인증된 사용자만 접근 가능한 장치 관련 API
app.use('/', authenticateToken, autoMationRouter);
app.use('/', authenticateToken, graphRouter);
app.use('/', authenticateToken, profileRouter);
app.use('/', authenticateToken, postRouter);
app.use('/', authenticateToken, farmManagementRouter);
app.use('/', authenticateToken, storeRouter);
app.use('/', authenticateToken, createFarmRouter);
// 서버 실행
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 서버 실행 중: http://0.0.0.0:${PORT}`);
});