// 💡 장치 상태 관련 API
const express = require('express');
const router = express.Router();
const pool = require('../../db');

// 💡 장치 상태 관련 API
let lightStatus = "OFF";
let fanStatus = "OFF";
let wateringStatus = "OFF";

router.get('/led/status', (req, res) => res.json({ ledStatus }));

router.post('/actuator/led/control', (req, res) => {
  const { lightStatus: status } = req.body;
  if (status !== 'ON' && status !== 'OFF') return res.status(400).json({ error: 'invalid lightStatus' });
  lightStatus = status;
  res.json({ lightStatus });
});

router.get('/fan/status', (req, res) => res.json({ fanStatus }));
router.post('/actuator/fan/control', (req, res) => {
  const { fanStatus: status } = req.body;
  if (status !== 'ON' && status !== 'OFF') return res.status(400).json({ error: 'invalid fanStatus' });
  fanStatus = status;
  res.json({ fanStatus });
});

router.get('/watering/status', (req, res) => res.json({ wateringStatus }));
router.post('/actuator/watering/control', (req, res) => {
  const { wateringStatus: status } = req.body;
  if (status !== 'ON' && status !== 'OFF') return res.status(400).json({ error: 'invalid wateringStatus' });
  wateringStatus = status;
  res.json({ wateringStatus });
});

module.exports = router;