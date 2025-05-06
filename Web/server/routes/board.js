const express = require("express");         // Express 라이브러리
const router = express.Router();            // 라우터 객체 생성
const pool = require("../db");           // DB 연결 객체

//게시판 미리보기
router.get("/board/posts", async (req, res) => {
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

  //게시판 미리보기
router.get("/board/posts", async (req, res) => {
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

  module.exports = router;