const express = require('express');
const router = express.Router();
const pool = require('../../db'); 

// 상점 상품 전체 조회 API
router.get('/store', async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT store_id, name, type, subtype, price, image_url, description, details, communication, stock, created_at, updated_at, is_active
         FROM store
         WHERE is_active = TRUE and stock > 0
         ORDER BY created_at DESC`
      );
      res.json(result.rows);
    } catch (err) {
      console.error('DB error:', err);
      res.status(500).json({ error: 'DB error' });
    }
  });
  
  // (선택) 특정 상품 상세 조회 API
router.get('/store/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query(
        `SELECT * FROM store WHERE store_id = $1`,
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Not found' });
      }
      res.json(result.rows[0]);
    } catch (err) {
      console.error('DB error:', err);
      res.status(500).json({ error: 'DB error' });
    }
  });

// 장바구니 결제(구매) API
router.post('/user/devices/purchase', async (req, res) => {
  const userId = req.user.userId;
  const items = req.body; // [{ store_id, quantity, gpio_pin }]
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const item of items) {
      // 상품 정보 조회
      const storeResult = await client.query(
        'SELECT * FROM store WHERE store_id = $1',
        [item.store_id]
      );
      if (storeResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: '상품 정보가 없습니다.' });
      }
      const store = storeResult.rows[0];
      // 수량만큼 user_devices에 insert
      for (let i = 0; i < item.quantity; i++) {
        // 시리얼 번호는 하드웨어에서 추후 입력될 예정이므로 null로 저장
        await client.query(
          `INSERT INTO user_devices
            (user_id, device_type, device_subtype, name, status, gpio_pin, unit, purchased_at)
           VALUES ($1, $2, $3, $4, 'unassigned', $5, $6, now())`,
          [
            userId,
            store.type,
            store.subtype,
            store.name,
            store.gpio_pin,
            store.unit
          ]
        );
      }
    }
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('구매 처리 오류:', err);
    res.status(500).json({ error: '구매 처리 중 오류가 발생했습니다.' });
  } finally {
    client.release();
  }
});

module.exports = router;