const express = require('express');
const router = express.Router();
const pool = require('../../db'); 

// 상점 상품 전체 조회 API
router.get('/store', async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT store_id, name, type, subtype, price, image_url, description, details, communication, stock, created_at, updated_at, is_active
         FROM store
         WHERE is_active = TRUE
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

module.exports = router;