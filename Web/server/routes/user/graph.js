const express = require('express');
const router = express.Router();
const pool = require('../../db');
const moment = require('moment');

// ✅ User의 환경 그래프
router.get('/user/sensor-data', async (req, res) => {
  const userId = req.user.userId;
  const { timeFrame, farmId } = req.query;

  if (!timeFrame || !['7days', '30days'].includes(timeFrame)) {
    return res.status(400).json({ error: 'Invalid timeFrame parameter' });
  }

  if (!farmId) {
    return res.status(400).json({ error: 'Farm ID is required' });
  }

  const endDate = moment().endOf('day');  // 오늘 자정까지
  let startDate;

  if (timeFrame === '7days') {
    startDate = moment().subtract(6, 'days').startOf('day');  // 7일 전 시작
  } else if (timeFrame === '30days') {
    startDate = moment().subtract(29, 'days').startOf('day');  // 30일 전 시작
  }

  try {
    // 먼저 해당 농장의 모든 센서 타입을 조회
    const sensorTypesQuery = `
      SELECT DISTINCT s.sensor_type
      FROM sensors s
      JOIN esps e ON s.esp_id = e.esp_id
      WHERE e.farm_id = $1
    `;
    const sensorTypesResult = await pool.query(sensorTypesQuery, [farmId]);
    const sensorTypes = sensorTypesResult.rows.map(row => row.sensor_type);

    if (sensorTypes.length === 0) {
      return res.json([]);
    }

    // 센서 데이터 조회
    const query = `
      SELECT DATE(sensor_logs.time) as date, sensor_logs.sensor_type, AVG(sensor_logs.sensor_value) as avg_value
      FROM sensor_logs
      JOIN sensors ON sensor_logs.sensor_id = sensors.sensor_id
      JOIN esps ON sensors.esp_id = esps.esp_id 
      WHERE esps.farm_id = $1
        AND time >= $2
        AND time <= $3
      GROUP BY DATE(time), sensor_logs.sensor_type
      ORDER BY DATE(time);
    `;
    const result = await pool.query(query, [
      farmId, 
      startDate.format('YYYY-MM-DD'), 
      endDate.format('YYYY-MM-DD')
    ]);

    if (result.rows.length === 0) {
      return res.json([]);
    }

    // 동적으로 데이터 객체 생성
    const sensorData = result.rows.reduce((acc, row) => {
      const date = moment(row.date).format('YYYY-MM-DD');
      if (!acc[date]) {
        // 모든 센서 타입에 대해 null로 초기화
        acc[date] = {
          date,
          ...Object.fromEntries(sensorTypes.map(type => [type, null]))
        };
      }
      // 센서 타입에 해당하는 값을 설정
      acc[date][row.sensor_type] = Number(row.avg_value);
      return acc;
    }, {});

    const data = Object.values(sensorData);

    res.json(data);
  } catch (error) {
    console.error("Error fetching sensor data: ", error);
    res.status(500).json({ message: '서버 오류 발생', error: error.message });
  }
});

module.exports = router;