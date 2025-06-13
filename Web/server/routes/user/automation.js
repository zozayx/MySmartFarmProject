const express = require('express');
const router = express.Router(); // JWT 인증 미들웨어
const pool = require('../../db');

//유저의 품종 , 기준치 가져오기
router.get('/user/farm-types', async (req, res) => {
    const userId = req.user.userId;  // JWT에서 사용자 ID 가져오기
  
    try {
      // 사용자별 식물 품종 및 환경 설정 가져오기
      const result = await pool.query(`
        SELECT farm_name, plant_name, temperature_optimal, humidity_optimal, soil_moisture_optimal
        FROM farms
        WHERE user_id = $1
      `, [userId]);
  
      if (result.rows.length > 0) {
        // 품종 목록과 환경 설정 정보 반환
        const farmNames = result.rows.map(row => ({
          farmName: row.farm_name,
          plantName: row.plant_name,
          temperature: row.temperature_optimal,
          humidity: row.humidity_optimal,
          soilMoisture: row.soil_moisture_optimal
        }));
  
        res.json({ success: true, farmNames });
      } else {
        res.json({ success: false, message: '등록된 식물이 없습니다.' });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
  });
  
  
  //내 농장 설정 저장
router.post('/user/farm-settings', async (req, res) => {
    const { farmName, temperature, humidity, soilMoisture } = req.body;
    const userId = req.user.userId;  // JWT에서 사용자 ID 가져오기

    try {
        // 사용자에 해당하는 식물의 환경 설정을 업데이트
        const result = await pool.query(`
        UPDATE farms
        SET temperature_optimal = $1, humidity_optimal = $2, soil_moisture_optimal = $3
        WHERE user_id = $4 AND farm_name = $5
        RETURNING *
        `, [temperature, humidity, soilMoisture, userId, farmName]);

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

// 자동화 조건 목록 조회
router.get('/user/automation-conditions', async (req, res) => {
    const userId = req.user.userId;

    try {
        const result = await pool.query(`
            SELECT ac.*, s.sensor_type, a.actuator_type, f.farm_name
            FROM automation_conditions ac
            JOIN sensors s ON ac.sensor_id = s.sensor_id
            JOIN actuators a ON ac.actuator_id = a.actuator_id
            JOIN farms f ON ac.farm_id = f.id
            WHERE ac.user_id = $1
        `, [userId]);

        const conditions = result.rows.map(row => ({
            id: row.condition_id,
            farmName: row.farm_name,
            sensorType: row.sensor_type,
            actuatorType: row.actuator_type,
            trigger: row.trigger,
            threshold: row.threshold
        }));

        res.json({ success: true, conditions });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
});

// 자동화 조건 추가
router.post('/user/automation-conditions', async (req, res) => {
    const userId = req.user.userId;
    const { farmName, sensorType, actuatorType, trigger, threshold } = req.body;

    try {
        // 농장 ID 조회
        const farmResult = await pool.query(
            'SELECT id FROM farms WHERE farm_name = $1 AND user_id = $2',
            [farmName, userId]
        );

        if (farmResult.rows.length === 0) {
            return res.status(400).json({ success: false, message: '유효하지 않은 농장입니다.' });
        }

        // 센서 ID 조회
        const sensorResult = await pool.query(
            'SELECT sensor_id FROM sensors WHERE sensor_type = $1 AND user_id = $2',
            [sensorType, userId]
        );

        if (sensorResult.rows.length === 0) {
            return res.status(400).json({ success: false, message: '유효하지 않은 센서입니다.' });
        }

        // 액추에이터 ID 조회
        const actuatorResult = await pool.query(
            'SELECT actuator_id FROM actuators WHERE actuator_type = $1 AND user_id = $2',
            [actuatorType, userId]
        );

        if (actuatorResult.rows.length === 0) {
            return res.status(400).json({ success: false, message: '유효하지 않은 액추에이터입니다.' });
        }

        // 자동화 조건 추가
        const result = await pool.query(`
            INSERT INTO automation_conditions 
            (user_id, farm_id, sensor_id, actuator_id, trigger, threshold)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING condition_id
        `, [userId, farmResult.rows[0].id, sensorResult.rows[0].sensor_id, actuatorResult.rows[0].actuator_id, trigger, threshold]);

        const newCondition = {
            id: result.rows[0].condition_id,
            farmName,
            sensorType,
            actuatorType,
            trigger,
            threshold
        };

        res.json({ success: true, condition: newCondition });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
});

// 자동화 조건 삭제
router.delete('/user/automation-conditions/:conditionId', async (req, res) => {
    const userId = req.user.userId;
    const { conditionId } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM automation_conditions WHERE condition_id = $1 AND user_id = $2 RETURNING condition_id',
            [conditionId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: '조건을 찾을 수 없습니다.' });
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router;