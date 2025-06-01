const express = require('express');
const router = express.Router();
const pool = require('../../db');  // pool.query를 사용할 수 있도록 연결 설정된 DB 객체

// ✅ 유저의 농장, ESP, 센서, 액추에이터 데이터 가져오기
router.get('/user/farms', async (req, res) => {
    const userId = req.user.userId;
  
    try {
      const farmsQuery = `
        SELECT f.farm_id, f.farm_name, f.location, f.farm_size, f.plant_name,
               e.esp_id, e.esp_name, e.device_type, e.ip_address, e.is_connected,
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
            sensors: [],    // 센서 ESP 배열
            actuators: [],   // 액추에이터 ESP 배열
            main: []        // 메인 ESP 배열
          };
        }
  
        // 중복된 ESP가 추가되지 않도록 체크
        if (row.esp_id) {
          const espData = {
            esp_id: row.esp_id,
            esp_name: row.esp_name,
            ip_address: row.ip_address,
            is_connected: row.is_connected,
            device: null
          };

          // 장치 정보 설정
          if (row.device_type === 'main') {
            // 메인 ESP 추가
            if (!acc[row.farm_id].main.some(e => e.esp_id === row.esp_id)) {
              acc[row.farm_id].main.push(espData);
            }
          } else if (row.sensor_id) {
            espData.device = {
              type: 'sensor',
              id: row.sensor_id,
              name: row.sensor_name,
              device_type: row.sensor_type,
              gpio_pin: row.sensor_gpio_pin
            };
            // 센서 ESP 추가
            if (!acc[row.farm_id].sensors.some(e => e.esp_id === row.esp_id)) {
              acc[row.farm_id].sensors.push(espData);
            }
          } else if (row.actuator_id) {
            espData.device = {
              type: 'actuator',
              id: row.actuator_id,
              name: row.actuator_name,
              device_type: row.actuator_type,
              gpio_pin: row.actuator_gpio_pin
            };
            // 액추에이터 ESP 추가
            if (!acc[row.farm_id].actuators.some(e => e.esp_id === row.esp_id)) {
              acc[row.farm_id].actuators.push(espData);
            }
          }
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
        const espQuery = `
            SELECT e.esp_id, e.farm_id, e.device_type, e.ip_address, e.is_connected
            FROM esps e
            WHERE e.farm_id = $1 AND e.esp_id = $2;
        `;

        // 센서 정보를 가져오는 쿼리
        const sensorsQuery = `
            SELECT sensor_id, sensor_type, sensor_name, is_active, 
                   device_name, gpio_pin
            FROM sensors
            WHERE esp_id = $1;
        `;

        // 액추에이터 정보를 가져오는 쿼리
        const actuatorsQuery = `
            SELECT actuator_id, actuator_type, actuator_name, is_active, 
                   device_name, gpio_pin
            FROM actuators
            WHERE esp_id = $1;
        `;

        // 쿼리 실행
        const [espResult, sensorsResult, actuatorsResult] = await Promise.all([
            pool.query(espQuery, [farm_id, esp_id]),
            pool.query(sensorsQuery, [esp_id]),
            pool.query(actuatorsQuery, [esp_id])
        ]);

        if (espResult.rows.length === 0) {
            return res.status(404).json({ error: 'ESP not found' });
        }

        // ESP 기본 정보
        const esp = espResult.rows[0];
        
        // 센서와 액추에이터 정보를 배열로 변환
        const devices = [
            ...sensorsResult.rows.map(sensor => ({
                type: 'sensor',
                id: sensor.sensor_id,
                name: sensor.sensor_name,
                is_active: sensor.is_active,
                device_name: sensor.device_name,
                device_type: sensor.sensor_type,
                gpio_pin: sensor.gpio_pin
            })),
            ...actuatorsResult.rows.map(actuator => ({
                type: 'actuator',
                id: actuator.actuator_id,
                name: actuator.actuator_name,
                is_active: actuator.is_active,
                device_name: actuator.device_name,
                device_type: actuator.actuator_type,
                gpio_pin: actuator.gpio_pin
            }))
        ];

        // 사용 중인 GPIO 핀 목록 추출
        const usedGpioPins = devices.map(device => device.gpio_pin).filter(pin => pin !== null);

        // ESP, 센서, 액추에이터 정보를 합쳐서 반환
        res.json({
            esp_id: esp.esp_id,
            farm_id: esp.farm_id,
            ip_address: esp.ip_address,
            is_connected: esp.is_connected,
            devices,
            used_gpio_pins: usedGpioPins
        });
    } catch (error) {
        console.error('Error fetching ESP details:', error);
        res.status(500).json({ error: 'Internal server error' });
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
  const { farm_id, esp_id, custom_name, gpio_pin } = req.body;
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

    // 2. ESP가 존재하는지 확인
    const espResult = await client.query(
      'SELECT * FROM esps WHERE esp_id = $1 AND farm_id = $2',
      [esp_id, farm_id]
    );
    if (espResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'ESP를 찾을 수 없습니다.' });
    }

    // 3. 센서/액추에이터 테이블에 insert
    if (device.device_type === 'sensor') {
      await client.query(
        'INSERT INTO sensors (esp_id, sensor_type, device_name, sensor_name, gpio_pin, unit, is_active) VALUES ($1, $2, $3, $4, $5, $6, true)',
        [esp_id, device.device_subtype, device.name, custom_name, gpio_pin || null, device.unit]
      );
    } else if (device.device_type === 'actuator') {
      await client.query(
        'INSERT INTO actuators (esp_id, actuator_type, device_name, actuator_name, gpio_pin, is_active) VALUES ($1, $2, $3, $4, $5, true)',
        [esp_id, device.device_subtype, device.name, custom_name, gpio_pin || null]
      );
    } else {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'device_type이 올바르지 않습니다.' });
    }

    // 4. user_devices 상태/할당 정보 및 gpio_pin 업데이트
    await client.query(
      'UPDATE user_devices SET status = $1, assigned_farm_id = $2, assigned_esp_id = $3, gpio_pin = $4 WHERE device_id = $5',
      ['assigned', farm_id, esp_id, gpio_pin || null, device_id]
    );
    await client.query('COMMIT');
    res.json({ success: true });
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
    // 먼저 장치가 할당되어 있는지 확인
    const checkResult = await pool.query(
      'SELECT status FROM user_devices WHERE device_id = $1',
      [device_id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '장치를 찾을 수 없습니다.' });
    }

    // 장치가 할당되어 있는 경우 삭제 불가
    if (checkResult.rows[0].status === 'assigned') {
      return res.status(400).json({ 
        error: '할당된 장치는 삭제할 수 없습니다.' 
      });
    }

    // 할당되지 않은 장치만 삭제
    const result = await pool.query('DELETE FROM user_devices WHERE device_id = $1', [device_id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// [신규] ESP만 추가하는 API
router.post('/user/farm/:farm_id/esp', async (req, res) => {
  const { farm_id } = req.params;
  const { esp_ip, esp_name, device_type } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // ESP 추가
    const espResult = await client.query(
      'INSERT INTO esps (farm_id, ip_address, esp_name, is_connected, device_type) VALUES ($1, $2, $3, false, $4) RETURNING esp_id',
      [farm_id, esp_ip, esp_name, device_type]
    );
    const esp_id = espResult.rows[0].esp_id;
    await client.query('COMMIT');
    res.json({ success: true, esp_id });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding ESP:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// [신규] ESP에서 장치 삭제 API
router.delete('/user/farm/:farm_id/esp/:esp_id/:device_type/:device_id', async (req, res) => {
  const { farm_id, esp_id, device_type, device_id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. 장치 타입에 따라 해당 테이블에서 삭제
    if (device_type === 'sensor') {
      await client.query('DELETE FROM sensors WHERE esp_id = $1 AND sensor_id = $2', [esp_id, device_id]);
    } else if (device_type === 'actuator') {
      await client.query('DELETE FROM actuators WHERE esp_id = $1 AND actuator_id = $2', [esp_id, device_id]);
    } else {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '잘못된 장치 타입입니다.' });
    }

    // 2. user_devices 테이블 업데이트 (초기화)
    await client.query(
      `UPDATE user_devices 
       SET status = 'unassigned', 
           assigned_farm_id = NULL, 
           assigned_esp_id = NULL,
           gpio_pin = NULL
       WHERE assigned_esp_id = $1`,
      [esp_id]
    );

    await client.query('COMMIT');
    res.json({ success: true, message: '장치가 성공적으로 삭제되었습니다.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting device from ESP:', error);
    res.status(500).json({ error: '장치 삭제 중 오류가 발생했습니다.' });
  } finally {
    client.release();
  }
});

module.exports = router;
