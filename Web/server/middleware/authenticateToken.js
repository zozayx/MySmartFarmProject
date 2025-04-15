require('dotenv').config();

const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];  // Authorization 헤더에서 Bearer 토큰을 추출

  if (!token) {
    return res.status(401).json({ message: "토큰이 없습니다." });
  }

  const secretKey = process.env.JWT_SECRET || 'default_secret_key';  // 환경변수가 없으면 기본값 사용

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "유효하지 않은 토큰입니다." });
    }
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken };
