const express = require('express');
const router = express.Router();
const pool = require('../../db');  // pool.query를 사용할 수 있도록 연결 설정된 DB 객체

// ✅ 유저의 농장, ESP, 센서, 액추에이터 데이터 가져오기
router.get('/user/farms', async (req, res) => {
    const userId = req.user.userId;
  
    try {
      const farmsQuery = `
        SELECT f.farm_id, f.farm_name, f.location, f.farm_size, f.plant_name,
               e.esp_id, e.esp_name, e.ip_address, e.is_connected
        FROM farms f
        LEFT JOIN esps e ON e.farm_id = f.farm_id
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
          acc[row.farm_id].esps.push({
            esp_id: row.esp_id,
            esp_name: row.esp_name,
            ip_address: row.ip_address,
            is_connected: row.is_connected
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
            SELECT e.esp_id, e.farm_id, e.esp_name, e.ip_address, e.is_connected
            FROM esps e
            WHERE e.farm_id = $1 AND e.esp_id = $2;
        `;
        
        // 센서와 액추에이터를 각각 별도로 가져오는 쿼리
        const sensorsQuery = `
            SELECT s.sensor_id, s.sensor_name, s.sensor_type, s.is_active, s.gpio_pin
            FROM sensors s
            WHERE s.esp_id = $1;
        `;
        
        const actuatorsQuery = `
            SELECT a.actuator_id, a.actuator_name, a.actuator_type, a.is_active, a.gpio_pin
            FROM actuators a
            WHERE a.esp_id = $1;
        `;

        // 쿼리 실행
        const espDetailsResult = await pool.query(espDetailsQuery, [farm_id, esp_id]);
        const sensorsResult = await pool.query(sensorsQuery, [esp_id]);
        const actuatorsResult = await pool.query(actuatorsQuery, [esp_id]);

        if (espDetailsResult.rows.length === 0) {
            return res.status(404).json({ error: 'ESP not found' });
        }

        // ESP 세부 정보
        const espData = espDetailsResult.rows[0];
        const espDetails = {
            esp_id: espData.esp_id,
            farm_id: espData.farm_id,
            esp_name: espData.esp_name,
            ip_address: espData.ip_address,
            is_connected: espData.is_connected,
            sensors: [],
            actuators: []
        };

        // 센서 정보 처리
        espDetails.sensors = sensorsResult.rows.map(row => ({
            sensor_id: row.sensor_id,
            sensor_name: row.sensor_name,
            sensor_type: row.sensor_type,
            is_active: row.is_active,
            gpio_pin: row.gpio_pin
        }));

        // 액추에이터 정보 처리
        espDetails.actuators = actuatorsResult.rows.map(row => ({
            actuator_id: row.actuator_id,
            actuator_name: row.actuator_name,
            actuator_type: row.actuator_type,
            is_active: row.is_active,
            gpio_pin: row.gpio_pin
        }));

        // ESP, 센서, 액추에이터 정보를 합쳐서 반환
        res.json(espDetails);
    } catch (error) {
        console.error('Error fetching ESP details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//추가 부분
// ESP 추가 API
router.post('/user/farm/:farm_id/esp', async (req, res) => {
  const { farm_id } = req.params;
  const { esp_name, ip_address, serial_number } = req.body;  // 클라이언트에서 받은 ESP 이름, IP, 시리얼 번호

  // 입력값 검증
  if (!esp_name || !ip_address || !serial_number) {
    return res.status(400).json({ error: "ESP 이름, IP 주소, 시리얼 번호는 필수 항목입니다." });
  }

  try {
    // 새로운 ESP를 DB에 추가하는 쿼리
    const insertEspQuery = `
      INSERT INTO esps (farm_id, esp_name, serial_number, ip_address, is_connected)
      VALUES ($1, $2, $3, $4, false)  
      RETURNING esp_id;
    `;

    const result = await pool.query(insertEspQuery, [farm_id, esp_name, serial_number, ip_address ]);
    const newEsp = result.rows[0];

    // 추가된 ESP 정보 반환
    res.status(201).json(newEsp);
  } catch (error) {
    console.error('Error adding ESP:', error);
    res.status(500).json({ error: "Internal server error" });
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
    const query = 'DELETE FROM esps WHERE esp_id = $1 AND farm_id = $2';
    try {
      await pool.query(query, [esp_id, farm_id]);
      res.status(200).send({ message: "ESP deleted successfully" });
    } catch (error) {
      console.error('Error deleting ESP:', error);
      res.status(500).send({ error: "Failed to delete ESP" });
    }
  });

// 센서 삭제 API
router.delete('/user/farm/esp/:esp_id/sensor/:sensor_id', async (req, res) => {
    const { esp_id, sensor_id } = req.params;
    const query = 'DELETE FROM sensors WHERE sensor_id = $1 AND esp_id = $2';
    try {
      await pool.query(query, [sensor_id, esp_id]);
      res.status(200).send({ message: "Sensor deleted successfully" });
    } catch (error) {
      console.error('Error deleting sensor:', error);
      res.status(500).send({ error: "Failed to delete sensor" });
    }
  });

// 액추에이터 삭제 API
router.delete('/user/farm/esp/:esp_id/actuator/:actuator_id', async (req, res) => {
    const { esp_id, actuator_id } = req.params;
    const query = 'DELETE FROM actuators WHERE actuator_id = $1 AND esp_id = $2';
    try {
      await pool.query(query, [actuator_id, esp_id]);
      res.status(200).send({ message: "Actuator deleted successfully" });
    } catch (error) {
      console.error('Error deleting actuator:', error);
      res.status(500).send({ error: "Failed to delete actuator" });
    }
  });

  

  
module.exports = router;
