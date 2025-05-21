const express = require('express');
const router = express.Router();
const pool = require('../../db');  // pool.query를 사용할 수 있도록 연결 설정된 DB 객체

// ✅ 유저의 농장, ESP, 센서, 액추에이터 데이터 가져오기
router.get('/user/farms', async (req, res) => {
    const userId = req.user.userId;
  
    try {
      const farmsQuery = `
        SELECT f.farm_id, f.farm_name, f.location, f.farm_size, f.plant_name,
               e.esp_id,  e.ip_address, e.is_connected,
               s.sensor_id, s.sensor_type, s.sensor_name, s.gpio_pin AS sensor_gpio_pin,
               a.actuator_id, a.actuator_type, a.actuator_name, a.gpio_pin AS actuator_gpio_pin
        FROM farms f
        LEFT JOIN esps e ON e.farm_id = f.farm_id
        LEFT JOIN LATERAL (
          SELECT * FROM sensors s2 WHERE s2.esp_id = e.esp_id LIMIT 1
        ) s ON true
        LEFT JOIN LATERAL (
          SELECT * FROM actuators a2 WHERE a2.esp_id = e.esp_id LIMIT 1
        ) a ON true
        WHERE f.user_id = $1;
      `;
  
      const result = await pool.query(farmsQuery, [userId]);
      const rows = result.rows;
  
      // 농장 데이터를 farm_id 기준으로 그룹화
      const farmsData = rows.reduce((acc, row) => {
        if (!acc[row.farm_id]) {
          acc[row.farm_id] = {
            farm_id: row.farm_id,
            farm_name: row.farm_name,
            location: row.location,
            farm_size: row.farm_size,
            plant_name: row.plant_name,
            esps: []
          };
        }
  
        // 중복된 ESP가 추가되지 않도록 체크
        if (row.esp_id && !acc[row.farm_id].esps.some(e => e.esp_id === row.esp_id)) {
          let device = null;
          if (row.sensor_id) {
            device = {
              type: 'sensor',
              id: row.sensor_id,
              name: row.sensor_name,
              device_type: row.sensor_type,
              gpio_pin: row.sensor_gpio_pin
            };
          } else if (row.actuator_id) {
            device = {
              type: 'actuator',
              id: row.actuator_id,
              name: row.actuator_name,
              device_type: row.actuator_type,
              gpio_pin: row.actuator_gpio_pin
            };
          }
          acc[row.farm_id].esps.push({
            esp_id: row.esp_id,
            esp_name: row.esp_name,
            ip_address: row.ip_address,
            is_connected: row.is_connected,
            device
          });
        }
  
        return acc;
      }, {});
  
      res.json(Object.values(farmsData));
      console.log('Cleaned farms data:', farmsData);
    } catch (error) {
      console.error('Error fetching farms:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  

// ✅ 특정 농장의 ESP 정보 및 센서/액추에이터 정보 가져오기
router.get('/user/farm/:farm_id/esp/:esp_id', async (req, res) => {
    const { farm_id, esp_id } = req.params;

    try {
        // ESP의 기본 정보를 가져오는 쿼리
        const espDetailsQuery = `
            SELECT e.esp_id, e.farm_id, e.ip_address, e.is_connected,
                   s.sensor_id, s.sensor_type, s.sensor_nae, s.device_name AS sensor_device_name, s.gpio_pin AS sensor_gpio_pin,
                   a.actuator_id, a.actuator_type, a.actuator_name, a.device_name AS actuator_device_name, a.gpio_pin AS actuator_gpio_pin
            FROM esps e
            LEFT JOIN sensors s ON s.esp_id = e.esp_id
            LEFT JOIN actuators a ON a.esp_id = e.esp_id
            WHERE e.farm_id = $1 AND e.esp_id = $2;
        `;

        // 쿼리 실행
        const result = await pool.query(espDetailsQuery, [farm_id, esp_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'ESP not found' });
        }

        // ESP 세부 정보
        const row = result.rows[0];
        let device = null;
        if (row.sensor_id) {
          device = {
            type: 'sensor',
            id: row.sensor_id,
            name: row.sensor_name,
            device_name: row.sensor_device_name,
            device_type: row.sensor_type,
            gpio_pin: row.sensor_gpio_pin
          };
        } else if (row.actuator_id) {
          device = {
            type: 'actuator',
            id: row.actuator_id,
            name: row.actuator_name,
            device_name: row.actuator_device_name,
            device_type: row.actuator_type,
            gpio_pin: row.actuator_gpio_pin
          };
        }

        // ESP, 센서, 액추에이터 정보를 합쳐서 반환
        res.json({
          esp_id: row.esp_id,
          farm_id: row.farm_id,
          esp_name: row.esp_name,
          ip_address: row.ip_address,
          is_connected: row.is_connected,
          device
        });
    } catch (error) {
        console.error('Error fetching ESP details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// [신규] 유저의 장치 타입별 보유 수량 및 사용 현황 조회 API
router.get('/user/device-inventory', async (req, res) => {
  const userId = req.user.userId;
  // 예시: available_device_inventory 테이블이 있다고 가정
  // (user_id, device_type, total_count)
  // 센서/액추에이터 테이블에서 이미 추가된 개수 카운트
  try {
    // 1. 전체 보유 수량
    const inventoryQuery = `
      SELECT device_type, total_count
      FROM available_device_inventory
      WHERE user_id = $1
    `;
    const inventoryResult = await pool.query(inventoryQuery, [userId]);
    const inventory = inventoryResult.rows;
    // 2. 이미 추가된 장치 수
    // 센서
    const sensorCountQuery = `
      SELECT sensor_type AS device_type, COUNT(*) AS used_count
      FROM sensors s
      JOIN esps e ON s.esp_id = e.esp_id
      JOIN farms f ON e.farm_id = f.farm_id
      WHERE f.user_id = $1
      GROUP BY sensor_type
    `;
    const sensorCountResult = await pool.query(sensorCountQuery, [userId]);
    // 액추에이터
    const actuatorCountQuery = `
      SELECT actuator_type AS device_type, COUNT(*) AS used_count
      FROM actuators a
      JOIN esps e ON a.esp_id = e.esp_id
      JOIN farms f ON e.farm_id = f.farm_id
      WHERE f.user_id = $1
      GROUP BY actuator_type
    `;
    const actuatorCountResult = await pool.query(actuatorCountQuery, [userId]);
    // 합치기
    const usedMap = {};
    sensorCountResult.rows.forEach(row => {
      usedMap[row.device_type] = (usedMap[row.device_type] || 0) + parseInt(row.used_count);
    });
    actuatorCountResult.rows.forEach(row => {
      usedMap[row.device_type] = (usedMap[row.device_type] || 0) + parseInt(row.used_count);
    });
    // 최종 응답
    const result = inventory.map(inv => ({
      type: inv.device_type,
      total: parseInt(inv.total_count),
      used: usedMap[inv.device_type] || 0,
      remain: parseInt(inv.total_count) - (usedMap[inv.device_type] || 0)
    }));
    res.json(result);
  } catch (error) {
    console.error('Error fetching device inventory:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ESP 추가 API (장치 타입별 수량 체크 추가)
router.post('/user/farm/:farm_id/esp', async (req, res) => {
  const { farm_id } = req.params;
  const { esp_name, ip_address, device_type, device_name, device_subtype, gpio_pin, unit } = req.body;
  if (!esp_name || !ip_address || !device_type || !device_name || !gpio_pin) {
    return res.status(400).json({ error: "필수 항목 누락" });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // [수량 체크] 유저가 해당 장치 타입을 몇 개 보유하고 있는지, 이미 추가한 개수는 몇 개인지 확인
    // 1. 유저 ID 조회
    const userIdResult = await client.query(
      'SELECT user_id FROM farms WHERE farm_id = $1',
      [farm_id]
    );
    if (userIdResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '잘못된 farm_id' });
    }
    const userId = userIdResult.rows[0].user_id;
    // 2. 전체 보유 수량
    const invResult = await client.query(
      'SELECT total_count FROM available_device_inventory WHERE user_id = $1 AND device_type = $2',
      [userId, device_subtype]
    );
    if (invResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '해당 장치 타입을 보유하고 있지 않습니다.' });
    }
    const totalCount = parseInt(invResult.rows[0].total_count);
    // 3. 이미 추가된 개수(센서/액추에이터)
    let usedCount = 0;
    if (device_type === 'sensor') {
      const usedResult = await client.query(
        `SELECT COUNT(*) FROM sensors s
         JOIN esps e ON s.esp_id = e.esp_id
         JOIN farms f ON e.farm_id = f.farm_id
         WHERE f.user_id = $1 AND s.sensor_type = $2`,
        [userId, device_subtype]
      );
      usedCount = parseInt(usedResult.rows[0].count);
    } else if (device_type === 'actuator') {
      const usedResult = await client.query(
        `SELECT COUNT(*) FROM actuators a
         JOIN esps e ON a.esp_id = e.esp_id
         JOIN farms f ON e.farm_id = f.farm_id
         WHERE f.user_id = $1 AND a.actuator_type = $2`,
        [userId, device_subtype]
      );
      usedCount = parseInt(usedResult.rows[0].count);
    } else {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: "device_type은 'sensor' 또는 'actuator'만 가능합니다." });
    }
    if (usedCount >= totalCount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '해당 장치 타입의 남은 수량이 없습니다.' });
    }
    // 4. ESP 생성
    const insertEspQuery = `
      INSERT INTO esps (farm_id, esp_name, ip_address, is_connected)
      VALUES ($1, $2, $3, false)
      RETURNING esp_id;
    `;
    const espResult = await client.query(insertEspQuery, [farm_id, esp_name, ip_address]);
    const esp_id = espResult.rows[0].esp_id;
    // 5. 센서/액추에이터 1개만 생성
    if (device_type === 'sensor') {
      const insertSensorQuery = `
        INSERT INTO sensors (esp_id, sensor_type, sensor_name, gpio_pin, unit)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING sensor_id;
      `;
      await client.query(insertSensorQuery, [esp_id, device_subtype, device_name, gpio_pin, unit || null]);
    } else if (device_type === 'actuator') {
      const insertActuatorQuery = `
        INSERT INTO actuators (esp_id, actuator_type, actuator_name, gpio_pin)
        VALUES ($1, $2, $3, $4)
        RETURNING actuator_id;
      `;
      await client.query(insertActuatorQuery, [esp_id, device_subtype, device_name, gpio_pin]);
    }
    await client.query('COMMIT');
    res.status(201).json({ esp_id });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding ESP/device:', error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

/// 장치 추가 API (센서 또는 액추에이터)
router.post('/user/farm/:farm_id/esp/:esp_id/device', async (req, res) => {
  const { farm_id, esp_id } = req.params;
  const {
    deviceType,        // 'sensor' 또는 'actuator'
    sensor_type,       // 센서일 경우만 사용
    actuator_type,     // 제어장치일 경우만 사용
    device_name,       // 공통 이름
    gpio_pin           // 공통 GPIO 핀 번호
  } = req.body;

  try {
    // ✅ 필수 입력 검증
    if (!deviceType || !device_name || gpio_pin === undefined) {
      return res.status(400).json({ error: "필수 입력값 누락: deviceType, device_name, gpio_pin" });
    }

    // ✅ farm_id와 esp_id 매핑 검증
    const validateEspQuery = `
      SELECT 1 FROM esps WHERE esp_id = $1 AND farm_id = $2
    `;
    const validateResult = await pool.query(validateEspQuery, [esp_id, farm_id]);
    if (validateResult.rowCount === 0) {
      return res.status(403).json({ error: "해당 ESP는 지정된 농장(farm_id)에 속하지 않습니다." });
    }

    if (deviceType === 'sensor') {
      if (!sensor_type) {
        return res.status(400).json({ error: "센서 타입이 필요합니다." });
      }

      const insertSensorQuery = `
        INSERT INTO sensors (esp_id, sensor_type, sensor_name, gpio_pin, is_active)
        VALUES ($1, $2, $3, $4, true)
        RETURNING sensor_id;
      `;

      const result = await pool.query(insertSensorQuery, [esp_id, sensor_type, device_name, gpio_pin]);
      return res.status(201).json({ message: "Sensor added successfully", sensor_id: result.rows[0].sensor_id });
    }

    else if (deviceType === 'actuator') {
      if (!actuator_type) {
        return res.status(400).json({ error: "제어장치 타입이 필요합니다." });
      }

      const insertActuatorQuery = `
        INSERT INTO actuators (esp_id, actuator_type, actuator_name, gpio_pin, is_active)
        VALUES ($1, $2, $3, $4, true)
        RETURNING actuator_id;
      `;

      const result = await pool.query(insertActuatorQuery, [esp_id, actuator_type, device_name, gpio_pin]);
      return res.status(201).json({ message: "Actuator added successfully", actuator_id: result.rows[0].actuator_id });
    }

    else {
      return res.status(400).json({ error: "deviceType은 'sensor' 또는 'actuator'만 가능합니다." });
    }
  } catch (error) {
    console.error('Error adding device:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});


//삭제 부분
// 농장 삭제 API
router.delete('/user/farm/:farm_id', async (req, res) => {
    const { farm_id } = req.params;
    const query = 'DELETE FROM farms WHERE farm_id = $1';
    try {
      await pool.query(query, [farm_id]);
      res.status(200).send({ message: "Farm deleted successfully" });
    } catch (error) {
      console.error('Error deleting farm:', error);
      res.status(500).send({ error: "Failed to delete farm" });
    }
  });

// ESP 삭제 API
router.delete('/user/farm/:farm_id/esp/:esp_id', async (req, res) => {
  const { farm_id, esp_id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // 1. 해당 ESP에 연결된 user_devices를 unassigned로 변경
    await client.query(
      `UPDATE user_devices
       SET status = 'unassigned', assigned_farm_id = NULL, assigned_esp_id = NULL
       WHERE assigned_esp_id = $1`,
      [esp_id]
    );
    // 2. ESP 삭제 (센서/액추에이터는 CASCADE 또는 별도 삭제)
    await client.query('DELETE FROM esps WHERE esp_id = $1 AND farm_id = $2', [esp_id, farm_id]);
    await client.query('COMMIT');
    res.status(200).send({ message: "ESP deleted successfully" });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting ESP:', error);
    res.status(500).send({ error: "Failed to delete ESP" });
  } finally {
    client.release();
  }
});

// [신규] 미할당 장치 목록 조회 API
router.get('/user/devices/unassigned', async (req, res) => {
  const userId = req.user.userId;
  try {
    const result = await pool.query(
      'SELECT device_id, name, device_type, device_subtype, gpio_pin, status FROM user_devices WHERE user_id = $1 AND status = $2',
      [userId, 'unassigned']
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching unassigned devices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// [신규] 장치 할당(설치) API
router.post('/user/devices/:device_id/assign', async (req, res) => {
  const { device_id } = req.params;
  const { farm_id, esp_ip, custom_name} = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // 1. user_devices에서 장치 정보 조회
    const devResult = await client.query(
      'SELECT * FROM user_devices WHERE device_id = $1 AND status = $2',
      [device_id, 'unassigned']
    );
    if (devResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '해당 장치가 없거나 이미 할당됨' });
    }
    const device = devResult.rows[0];
    // 2. esps에 insert (새 ESP 생성)
    const espResult = await client.query(
      'INSERT INTO esps (farm_id, ip_address, is_connected) VALUES ($1, $2, false) RETURNING esp_id',
      [farm_id, esp_ip]
    );
    const esp_id = espResult.rows[0].esp_id;
    // 3. 센서/액추에이터 테이블에 insert
    if (device.device_type === 'sensor') {
      await client.query(
        'INSERT INTO sensors (esp_id, sensor_type, device_name, sensor_name, gpio_pin, unit, is_active) VALUES ($1, $2, $3, $4, $5, $6, true)',
        [esp_id, device.device_subtype, device.name,  custom_name, device.gpio_pin, device.unit]
      );
    } else if (device.device_type === 'actuator') {
      await client.query(
        'INSERT INTO actuators (esp_id, actuator_type, device_name, actuator_name, gpio_pin, is_active) VALUES ($1, $2, $3, $4, $5, %6, true)',
        [esp_id, device.device_subtype, device.name,  custom_name, device.gpio_pin]
      );
    } else {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'device_type이 올바르지 않습니다.' });
    }
    // 4. user_devices 상태/할당 정보 및 gpio_pin 업데이트
    await client.query(
      'UPDATE user_devices SET status = $1, assigned_farm_id = $2, assigned_esp_id = $3 WHERE device_id = $4',
      ['assigned', farm_id, esp_id, device_id]
    );
    await client.query('COMMIT');
    res.json({ success: true, esp_id });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error assigning device:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// [신규] 유저의 모든 장치 목록 조회 API
router.get('/user/devices/all', async (req, res) => {
  const userId = req.user.userId;
  try {
    const result = await pool.query(
      `SELECT device_id, name, device_type, device_subtype, gpio_pin, status, assigned_farm_id, assigned_esp_id
       FROM user_devices WHERE user_id = $1`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching all devices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// [신규] 장치 영구삭제 API
router.delete('/user/devices/:device_id', async (req, res) => {
  const { device_id } = req.params;
  try {
    const result = await pool.query('DELETE FROM user_devices WHERE device_id = $1', [device_id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
