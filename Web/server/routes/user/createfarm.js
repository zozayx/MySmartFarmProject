const express = require('express');
const router = express.Router();
const pool = require('../../db');

// 농장 추가 API
router.post('/user/createfarm', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const {
      farmName,
      location,
      crop,
      farmSize
    } = req.body;

    // 필수 필드 검증
    if (!farmName || !crop) {
      return res.status(400).json({
        success: false,
        message: '농장 이름과 작물은 필수 입력 항목입니다.'
      });
    }

    // 농장 추가 쿼리
    const query = `
      INSERT INTO farms (
        user_id,
        farm_name,
        location,
        farm_size,
        plant_name,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, now())
      RETURNING farm_id, farm_name, location, farm_size, plant_name, created_at
    `;

    const values = [
      req.user.userId, // authenticateToken 미들웨어에서 설정된 사용자 ID
      farmName,
      location || null,
      farmSize ? parseFloat(farmSize) : null,
      crop
    ];

    const result = await client.query(query, values);

    res.json({
      success: true,
      message: '농장이 성공적으로 추가되었습니다.',
      farm: result.rows[0]
    });

  } catch (error) {
    console.error('농장 추가 중 오류 발생:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다. 다시 시도해주세요.'
    });
  } finally {
    client.release();
  }
});

module.exports = router;
