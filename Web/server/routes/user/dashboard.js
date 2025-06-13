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
      ORDER BY farm_id ASC
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
  const { farmId } = req.params;
  const userId = req.user.userId;

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

    // ESP 장치들의 ID 배열을 가져옴
    const espIds = espsResult.rows.map(row => row.esp_id);

    // ESP 장치가 없는 경우에도 계속 진행
    let sensors = [];
    let actuators = [];
    let recentSensorData = { rows: [] };
    let dailySensorLogs = [];

    if (espIds.length > 0) {
      // 🌡️ 센서 목록 (해당 ESP 장치들에 속한 센서들)
      const sensorsResult = await pool.query(`
        SELECT s.sensor_id, s.sensor_type, s.sensor_name, s.gpio_pin, s.unit, s.is_active, s.installed_at
        FROM sensors s
        WHERE s.esp_id = ANY($1::int[])
      `, [espIds]);

      sensors = sensorsResult.rows.map(sensor => ({
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

      actuators = actuatorsResult.rows.map(act => ({
        id: act.actuator_id,
        type: act.actuator_type,
        name: act.actuator_name,
        pin: act.gpio_pin,
        active: act.is_active,
        installedAt: act.installed_at
      }));

      // 센서 타입 목록 가져오기
      const sensorTypes = [...new Set(sensorsResult.rows.map(s => s.sensor_type))].filter(Boolean);

      if (sensorTypes.length === 0) {
        return res.json({
          crop: userPlant.rows[0]?.plant_name ?? '등록된 작물 없음',
          plantedAt: userPlant.rows[0]?.created_at ?? null,
          sensors: sensors,
          actuators: actuators
        });
      }

      // CASE 문 동적 생성
      const caseStatements = sensorTypes.map(type => 
        `MAX(CASE WHEN s.sensor_type = '${type}' THEN sl.sensor_value END) as ${type}`
      ).join(',\n          ');

      // 최신 센서 데이터 (최근 1개)
      const recentSensorQuery = `
        WITH latest_time AS (
          SELECT MAX(time) as max_time
          FROM sensor_logs
          JOIN sensors ON sensor_logs.sensor_id = sensors.sensor_id
          JOIN esps ON sensors.esp_id = esps.esp_id 
          WHERE esps.farm_id = $1
        )
        SELECT 
          sl.time,
          ${caseStatements}
        FROM sensor_logs sl
        JOIN sensors s ON sl.sensor_id = s.sensor_id
        JOIN esps e ON s.esp_id = e.esp_id
        WHERE e.farm_id = $1 
          AND sl.time = (SELECT max_time FROM latest_time)
        GROUP BY sl.time
      `;
      recentSensorData = await pool.query(recentSensorQuery, [farmId]);

      // 1시간 단위 평균값 집계 (최근 24시간)
      const avgCaseStatements = sensorTypes.map(type => 
        `AVG(CASE WHEN s.sensor_type = '${type}' THEN sl.sensor_value END) as avg_${type}`
      ).join(',\n          ');

      const hourlyAveragesQuery = `
        SELECT 
          date_trunc('hour', sl.time) as hour,
          ${avgCaseStatements}
        FROM sensor_logs sl
        JOIN sensors s ON sl.sensor_id = s.sensor_id
        JOIN esps e ON s.esp_id = e.esp_id
        WHERE e.farm_id = $1
          AND sl.time > NOW() - INTERVAL '24 hours'
        GROUP BY date_trunc('hour', sl.time)
        ORDER BY hour
      `;
      const hourlyAverages = await pool.query(hourlyAveragesQuery, [farmId]);

      // 데이터 매핑
      dailySensorLogs = hourlyAverages.rows.map(row => {
        const log = { time: row.hour };
        sensorTypes.forEach(type => {
          log[type] = Number(row[`avg_${type}`]);
        });
        return log;
      });
    }

    // 응답 데이터
    const responseData = {
      crop: userPlant.rows[0]?.plant_name ?? '등록된 작물 없음',
      plantedAt: userPlant.rows[0]?.created_at ?? null
    };

    // 센서가 있는 경우에만 센서 목록 추가
    if (sensors.length > 0) {
      responseData.sensors = sensors;
    }

    // 액추에이터가 있는 경우에만 액추에이터 목록 추가
    if (actuators.length > 0) {
      responseData.actuators = actuators;
    }

    // 최신 센서 데이터가 있는 경우에만 추가
    if (recentSensorData.rows.length > 0) {
      responseData.sensorLogs = recentSensorData.rows.reverse();
    }

    // 일일 센서 로그가 있는 경우에만 추가
    if (dailySensorLogs.length > 0) {
      responseData.dailySensorLogs = dailySensorLogs;
    }

    res.json(responseData);
  } catch (err) {
    console.error('대시보드 데이터 조회 중 에러 발생:', err);
    res.status(500).json({ error: '데이터 불러오기 실패' });
  }
});

module.exports = router;

