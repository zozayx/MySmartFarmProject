const express = require('express');
const router = express.Router();
const pool = require('../../db');

// ✅ User의 농장 목록 조회 API
router.get('/user/farm-list', async (req, res) => {
  const userId = req.user.userId;

  try {
    // 사용자가 소유한 농장 목록 조회
    const farmsResult = await pool.query(`
      SELECT f.farm_id, f.farm_name, f.location, f.created_at
      FROM farms f
      WHERE f.user_id = $1
    `, [userId]);

    if (farmsResult.rows.length === 0) {
      return res.status(404).json({ error: '등록된 농장이 없습니다.' });
    }

    // 농장 정보 반환
    const farms = farmsResult.rows.map(farm => ({
      farmId: farm.farm_id,
      farmName: farm.farm_name,
      location: farm.location,
      plantedAt: farm.planted_at,
    }));

    res.json(farms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '농장 목록을 불러오는 데 실패했습니다.' });
  }
});

// ✅ User의 대시보드 (농장별)
router.get('/user/dashboard/:farmId', async (req, res) => {
  const { farmId } = req.params;  // farmId를 URL 파라미터로 받음
  const userId = req.user.userId;  // 인증된 사용자 ID (JWT에서 추출)

  try {
    // 작물 정보 (농장 정보)
    const userPlant = await pool.query(`
      SELECT plant_name, created_at 
      FROM farms
      WHERE farm_id = $1 AND user_id = $2
      LIMIT 1
    `, [farmId, userId]);

    if (!userPlant.rows.length) {
      return res.status(404).json({ error: '농장을 찾을 수 없습니다.' });
    }

    // 해당 농장의 ESP 장치 목록을 조회
    const espsResult = await pool.query(`
      SELECT esp_id 
      FROM esps
      WHERE farm_id = $1
    `, [farmId]);

    if (!espsResult.rows.length) {
      return res.status(404).json({ error: 'ESP 장치를 찾을 수 없습니다.' });
    }

    // ESP 장치들의 ID 배열을 가져옴
    const espIds = espsResult.rows.map(row => row.esp_id);

    // 🌡️ 센서 목록 (해당 ESP 장치들에 속한 센서들)
    const sensorsResult = await pool.query(`
      SELECT s.sensor_id, s.sensor_type, s.sensor_name, s.gpio_pin, s.unit, s.is_active, s.installed_at
      FROM sensors s
      WHERE s.esp_id = ANY($1::int[])
    `, [espIds]);

    const sensors = sensorsResult.rows.map(sensor => ({
      id: sensor.sensor_id,
      type: sensor.sensor_type,
      name: sensor.sensor_name,
      pin: sensor.gpio_pin,
      unit: sensor.unit,
      active: sensor.is_active,
      installedAt: sensor.installed_at
    }));

    // ⚙️ 액추에이터 목록 (해당 ESP 장치들에 속한 액추에이터들)
    const actuatorsResult = await pool.query(`
      SELECT a.actuator_id, a.actuator_type, a.actuator_name, a.gpio_pin, a.is_active, a.installed_at
      FROM actuators a
      WHERE a.esp_id = ANY($1::int[])
    `, [espIds]);

    const actuators = actuatorsResult.rows.map(act => ({
      id: act.actuator_id,
      type: act.actuator_type,
      name: act.actuator_name,
      pin: act.gpio_pin,
      active: act.is_active,
      installedAt: act.installed_at
    }));

    // 최신 센서 데이터 (최근 1개)
    const recentSensorData = await pool.query(`
      SELECT time, 
         MAX(CASE WHEN sensor_logs.sensor_type = 'temperature' THEN sensor_value END) AS temperature,
         MAX(CASE WHEN sensor_logs.sensor_type = 'humidity' THEN sensor_value END) AS humidity,
         MAX(CASE WHEN sensor_logs.sensor_type = 'soil_moisture' THEN sensor_value END) AS soil_moisture
      FROM sensor_logs
      JOIN sensors ON sensor_logs.sensor_id = sensors.sensor_id
      JOIN esps ON sensors.esp_id = esps.esp_id 
      WHERE esps.farm_id = $1 
      GROUP BY time
      ORDER BY time DESC
      LIMIT 1
    `, [farmId]);

    // ✅ 1시간 단위 평균값 집계 (최근 24시간)
    const hourlyAverages = await pool.query(`
      SELECT
        time_bucket('1 hour', sensor_logs.time) AS hour,
        AVG(CASE WHEN sensor_logs.sensor_type = 'temperature' THEN sensor_logs.sensor_value END) AS avg_temperature,
        AVG(CASE WHEN sensor_logs.sensor_type = 'humidity' THEN sensor_logs.sensor_value END) AS avg_humidity,
        AVG(CASE WHEN sensor_logs.sensor_type = 'soil_moisture' THEN sensor_logs.sensor_value END) AS avg_soil_moisture
      FROM sensor_logs
      JOIN sensors ON sensor_logs.sensor_id = sensors.sensor_id
      JOIN esps ON sensors.esp_id = esps.esp_id
      WHERE esps.farm_id = $1
        AND sensor_logs.time > NOW() - INTERVAL '24 hours'
      GROUP BY hour
      ORDER BY hour
    `, [farmId]);

    const dailySensorLogs = hourlyAverages.rows.map(row => ({
      time: row.hour,
      temperature: Number(row.avg_temperature),
      humidity: Number(row.avg_humidity),
      soil_moisture: Number(row.avg_soil_moisture)
    }));

    // 응답 데이터
    res.json({
      crop: userPlant.rows[0]?.plant_name ?? '등록된 작물 없음',
      plantedAt: userPlant.rows[0]?.created_at ?? null,
      sensors: sensors.length > 0 ? sensors : [],
      actuators: actuators.length > 0 ? actuators : [],
      sensorLogs: recentSensorData.rows.length > 0 ? recentSensorData.rows.reverse() : [],
      dailySensorLogs: dailySensorLogs.length > 0 ? dailySensorLogs : [] // ✅ 1시간 단위 하루치 센서 로그
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '데이터 불러오기 실패' });
  }
});

  module.exports = router;

