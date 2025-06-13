import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button , Alert, Spinner , Form, Table} from "react-bootstrap";
import {
  FaLightbulb,
  FaRegLightbulb,
  FaFan,
  FaSeedling,
  FaShower,
} from "react-icons/fa";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

function UserControlPanel() {
  const [ledStatus, setLedstatus] = useState("OFF");  // 기본값 "OFF"
  const [fanStatus, setFanStatus] = useState("OFF");  // 기본값 "OFF"
  const [waterStatus, setWaterStatus] = useState("OFF");  // 기본값 "OFF"

  const [lightErrorMessage, setLightErrorMessage] = useState("");
  const [fanErrorMessage, setFanErrorMessage] = useState("");
  const [waterErrorMessage, setWaterErrorMessage] = useState("");

   const [inputValues, setInputValues] = useState({
      temperature: null,
      humidity: null,
      soilMoisture: null,
    });
    const [farmNames, setfarmNames] = useState([]);
    const [selectedFarm, setSelectedFarm] = useState("");
    const [savedSettings, setSavedSettings] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [automationRules, setAutomationRules] = useState([]);
    const [newRule, setNewRule] = useState({
      farmName: "",
      sensorType: 'temperature',
      threshold: '',
      trigger: 'above',
      actuatorType: 'fan'
    });

    useEffect(() => {
        const fetchData = async () => {
          try {
            setLoading(true);
            console.log("🔄 품종 데이터 요청 중...");
    
            const res = await fetch(`${BASE_URL}/user/farm-types`, {
              method: "GET",
              credentials: "include", // 쿠키 포함
            });
    
            console.log("✅ 응답 상태:", res.status);
    
            if (!res.ok) {
              throw new Error("품종 목록을 불러오는 데 실패했습니다.");
            }
    
            const data = await res.json();
            console.log("📦 받은 데이터:", data);
    
            if (data.success && Array.isArray(data.farmNames)) {
              setfarmNames(data.farmNames);
    
              if (data.farmNames.length > 0) {
                setSelectedFarm(data.farmNames[0].farmName);
                setNewRule(prev => ({...prev, farmName: data.farmNames[0].farmName}));
              }
            } else {
              throw new Error(data.message || "데이터를 불러오는 데 실패했습니다.");
            }
          } catch (err) {
            console.error("❌ 에러 발생:", err);
            setErrorMessage(err.message);
          } finally {
            setLoading(false);
          }
        };
    
        fetchData();
      }, []);
    
      const handleChange = (e) => {
        const { name, value } = e.target;
        setInputValues({ ...inputValues, [name]: value });
      };
    
      const handleSave = async () => {
        setLoading(true);
        setErrorMessage(null);
    
        const settings = {
          farmName: selectedFarm,
          temperature: inputValues.temperature,
          humidity: inputValues.humidity,
          soilMoisture: inputValues.soilMoisture,
        };
    
        try {
          const res = await fetch(`${BASE_URL}/user/farm-settings`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include", // 쿠키 포함
            body: JSON.stringify(settings),
          });
    
          const data = await res.json();
    
          if (data.success) {
            setSavedSettings(settings);
            alert("환경 설정이 저장되었습니다!");
          } else {
            throw new Error(data.message || "설정 저장 실패");
          }
        } catch (err) {
          setErrorMessage(err.message);
        } finally {
          setLoading(false);
        }
      };

  useEffect(() => {
    // LED 상태 가져오기
    fetch(`${BASE_URL}/led/status`, {
      method: "GET",
      //credentials: "include",  // 인증 정보 전송
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.ledStatus) {
          setLedstatus(data.ledStatus);
        }
      })
      .catch(() => {
        setLightErrorMessage("");  // 오류 메시지 비우기
      });

    // 팬 상태 가져오기
    fetch(`${BASE_URL}/fan/status`, {
      method: "GET",
      //credentials: "include",  // 인증 정보 전송
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.fanStatus) {
          setFanStatus(data.fanStatus);
        }
      })
      .catch(() => {
        setFanErrorMessage("");  // 오류 메시지 비우기
      });

    // 급수 상태 가져오기
    fetch(`${BASE_URL}/watering/status`, {
      method: "GET",
      //credentials: "include",  // 인증 정보 전송
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.wateringStatus) {
          setWaterStatus(data.wateringStatus);
        }
      })
      .catch(() => {
        setWaterErrorMessage("");  // 오류 메시지 비우기
      });
  }, []);

  const toggleLight = () => {
    setLightErrorMessage("");
    const newStatus = ledStatus === "ON" ? "OFF" : "ON";

    fetch(`${BASE_URL}/actuator/led/control`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      //credentials: "include",  // 인증 정보 전송
      body: JSON.stringify({ ledStatus: newStatus }),
    })
      .then((res) => res.json())
      .then((data) => setLedstatus(data.ledStatus))
      .catch(() => setLightErrorMessage("⚠️ 전구 제어 실패"));
  };

  const toggleFan = () => {
    setFanErrorMessage("");
    const newStatus = fanStatus === "ON" ? "OFF" : "ON";

    fetch(`${BASE_URL}/actuator/fan/control`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      //credentials: "include",  // 인증 정보 전송
      body: JSON.stringify({ fanStatus: newStatus }),
    })
      .then((res) => res.json())
      .then((data) => setFanStatus(data.fanStatus))
      .catch(() => setFanErrorMessage("⚠️ 팬 제어 실패"));
  };

  const toggleWatering = () => {
    setWaterErrorMessage("");
    const newStatus = waterStatus === "ON" ? "OFF" : "ON";

    fetch(`${BASE_URL}/actuator/watering/control`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      //credentials: "include",  // 인증 정보 전송
      body: JSON.stringify({ wateringStatus: newStatus }),
    })
      .then((res) => res.json())
      .then((data) => setWaterStatus(data.wateringStatus))
      .catch(() => setWaterErrorMessage("⚠️ 급수 제어 실패"));
  };

  useEffect(() => {
    const fetchAutomationRules = async () => {
      try {
        const res = await fetch(`${BASE_URL}/user/automation-conditions`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          setAutomationRules(data.conditions);
        }
      } catch (err) {
        console.error("자동화 규칙을 불러오는데 실패했습니다:", err);
      }
    };

    fetchAutomationRules();
  }, []);

  const handleAddRule = () => {
    if (!selectedFarm || !newRule.threshold) return;
    
    const newAutomationRule = {
      id: Date.now(), // 임시 ID 생성
      farmName: selectedFarm,
      sensorType: newRule.sensorType,
      actuatorType: newRule.actuatorType,
      trigger: newRule.trigger,
      threshold: newRule.threshold
    };
    
    setAutomationRules([...automationRules, newAutomationRule]);
    setNewRule({
      farmName: selectedFarm,
      sensorType: 'temperature',
      threshold: '',
      trigger: 'above',
      actuatorType: 'fan'
    });
  };

  const handleDeleteRule = (ruleId) => {
    setAutomationRules(automationRules.filter(rule => rule.id !== ruleId));
  };

  if (loading) {
      return (
        <Container className="py-5 text-center">
          <Spinner animation="border" variant="primary" />
        </Container>
      );
    }

  const sensorTypes = [
    { value: 'temperature', label: '🌡️ 온도', unit: '°C' },
    { value: 'humidity', label: '💧 습도', unit: '%' },
    { value: 'light', label: '☀️ 조도', unit: 'lux' }
  ];

  const actuatorTypes = [
    { value: 'fan', label: '🌬️ 환기팬' },
    { value: 'led', label: '💡 조명' },
    { value: 'watering', label: '💧 급수' }
  ];

  // 센서와 제어 장치의 적절한 조건 매핑
  const getAppropriateConditions = (sensorType, actuatorType) => {
    const conditions = {
      temperature: {
        fan: { trigger: 'above', threshold: '28' },
        led: { trigger: 'below', threshold: '15' }
      },
      humidity: {
        fan: { trigger: 'above', threshold: '70' },
        watering: { trigger: 'below', threshold: '40' }
      },
      light: {
        led: { trigger: 'below', threshold: '5000' }
      }
    };
    return conditions[sensorType]?.[actuatorType] || { trigger: 'above', threshold: '' };
  };

  const handleSensorChange = (sensorType) => {
    // 센서가 변경되면 적절한 제어 장치와 조건을 자동으로 설정
    let appropriateActuator = 'fan';
    if (sensorType === 'humidity') appropriateActuator = 'watering';
    if (sensorType === 'light') appropriateActuator = 'led';

    const conditions = getAppropriateConditions(sensorType, appropriateActuator);
    
    setNewRule({
      ...newRule,
      sensorType,
      actuatorType: appropriateActuator,
      trigger: conditions.trigger,
      threshold: conditions.threshold
    });
  };

  return (
  <Container className="py-5">
    <h2 className="mb-4 text-center fw-bold" style={{ color: '#2c3e50' }}>
      <span className="me-2">🤖</span>자동 제어 패널
    </h2>

    {errorMessage && (
      <Alert variant="danger" className="text-center shadow-sm">
        {errorMessage}
      </Alert>
    )}

    <Card className="p-4 shadow-sm mb-5 border-0" style={{ borderRadius: '15px', backgroundColor: '#f8f9fa' }}>
      <h3 className="mb-4 fw-bold" style={{ color: '#2c3e50' }}>
        <span className="me-2">🔄</span>자동화 설정
      </h3>
      
      {/* 농장 선택 및 정보 섹션 */}
      <Row className="mb-4">
        <Col md={6}>
          <Form.Group>
            <Form.Label className="h5 fw-bold" style={{ color: '#2c3e50' }}>
              <span className="me-2">📌</span>농장 선택
            </Form.Label>
            <Form.Select
              size="lg"
              value={selectedFarm}
              onChange={(e) => {
                setSelectedFarm(e.target.value);
                setNewRule(prev => ({...prev, farmName: e.target.value}));
              }}
              className="shadow-sm border-0"
              style={{ borderRadius: '10px' }}
            >
              {Array.isArray(farmNames) && farmNames.length > 0 ? (
                farmNames.map((type) => (
                  <option key={type.farmName} value={type.farmName}>
                    {type.farmName}
                  </option>
                ))
              ) : (
                <option disabled>등록된 농장이 없습니다.</option>
              )}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6}>
          {selectedFarm && (
            <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: '15px', backgroundColor: '#fff' }}>
              <Card.Body className="d-flex align-items-center">
                <div>
                  <h5 className="mb-0 fw-bold" style={{ color: '#2c3e50' }}>
                    <span className="me-2">🌱</span>현재 작물
                  </h5>
                  <p className="mt-2 mb-0 fs-4" style={{ color: '#27ae60' }}>
                    {farmNames.find(f => f.farmName === selectedFarm)?.plantName || '정보 없음'}
                  </p>
                  <p className="mt-2 mb-0 small text-muted" style={{ fontSize: '0.85rem' }}>
                    {farmNames.find(f => f.farmName === selectedFarm)?.plantName ? 
                      `${farmNames.find(f => f.farmName === selectedFarm)?.plantName}에 추천되는 최적 값은 온도 ${farmNames.find(f => f.farmName === selectedFarm)?.temperature}°C, 습도 ${farmNames.find(f => f.farmName === selectedFarm)?.humidity}%, 토양 수분 ${farmNames.find(f => f.farmName === selectedFarm)?.soilMoisture}% 입니다!` 
                      : ''}
                  </p>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* 자동화 규칙 설정 섹션 */}
      <Card className="mt-4 border-0 shadow-sm" style={{ borderRadius: '15px', backgroundColor: '#fff' }}>
        <Card.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold" style={{ color: '#2c3e50' }}>센서 선택</Form.Label>
                <Form.Select
                  value={newRule.sensorType}
                  onChange={(e) => handleSensorChange(e.target.value)}
                  className="shadow-sm border-0"
                  style={{ borderRadius: '10px' }}
                >
                  {sensorTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold" style={{ color: '#2c3e50' }}>제어 장치 선택</Form.Label>
                <Form.Select
                  value={newRule.actuatorType}
                  onChange={(e) => setNewRule({...newRule, actuatorType: e.target.value})}
                  className="shadow-sm border-0"
                  style={{ borderRadius: '10px' }}
                >
                  {actuatorTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold" style={{ color: '#2c3e50' }}>조건</Form.Label>
                <Form.Select
                  value={newRule.trigger}
                  onChange={(e) => setNewRule({...newRule, trigger: e.target.value})}
                  className="shadow-sm border-0"
                  style={{ borderRadius: '10px' }}
                >
                  <option value="above">이상</option>
                  <option value="below">이하</option>
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold" style={{ color: '#2c3e50' }}>
                  기준값 ({sensorTypes.find(s => s.value === newRule.sensorType)?.unit || ''})
                </Form.Label>
                <Form.Control
                  type="number"
                  value={newRule.threshold}
                  onChange={(e) => setNewRule({...newRule, threshold: e.target.value})}
                  placeholder="값 입력"
                  className="shadow-sm border-0"
                  style={{ borderRadius: '10px' }}
                />
              </Form.Group>
            </Col>
          </Row>
          
          <div className="text-center mt-4">
            <Button 
              variant="primary" 
              size="lg"
              onClick={handleAddRule}
              disabled={!selectedFarm}
              className="px-5 py-2 fw-bold shadow-sm"
              style={{ 
                borderRadius: '10px',
                backgroundColor: '#3498db',
                border: 'none'
              }}
            >
              설정 추가
            </Button>
          </div>
        </Card.Body>
      </Card>
      
      {/* 현재 설정된 규칙 목록 */}
      <div className="mt-5">
        <h4 className="fw-bold mb-4" style={{ color: '#2c3e50' }}>
          <span className="me-2">📋</span>현재 설정된 규칙
        </h4>
        {automationRules.length === 0 ? (
          <Alert variant="info" className="shadow-sm border-0" style={{ borderRadius: '10px' }}>
            설정된 자동화 규칙이 없습니다.
          </Alert>
        ) : (
          <div className="table-responsive">
            <Table className="shadow-sm border-0" style={{ borderRadius: '10px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th className="py-3 px-4" style={{ borderTopLeftRadius: '10px' }}>농장</th>
                  <th className="py-3 px-4">센서</th>
                  <th className="py-3 px-4">조건</th>
                  <th className="py-3 px-4">기준값</th>
                  <th className="py-3 px-4">제어 장치</th>
                  <th className="py-3 px-4" style={{ borderTopRightRadius: '10px' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {automationRules.map((rule) => (
                  <tr key={rule.id} style={{ backgroundColor: '#fff' }}>
                    <td className="py-3 px-4 align-middle">
                      <span className="fw-bold" style={{ color: '#2c3e50' }}>{rule.farmName}</span>
                    </td>
                    <td className="py-3 px-4 align-middle">
                      {sensorTypes.find(s => s.value === rule.sensorType)?.label}
                    </td>
                    <td className="py-3 px-4 align-middle">
                      <span className={`badge ${rule.trigger === 'above' ? 'bg-danger' : 'bg-primary'}`}>
                        {rule.trigger === 'above' ? '이상' : '이하'}
                      </span>
                    </td>
                    <td className="py-3 px-4 align-middle">
                      <span className="fw-bold" style={{ color: '#2c3e50' }}>
                        {rule.threshold}
                        {sensorTypes.find(s => s.value === rule.sensorType)?.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 align-middle">
                      {actuatorTypes.find(a => a.value === rule.actuatorType)?.label}
                    </td>
                    <td className="py-3 px-4 align-middle">
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteRule(rule.id)}
                        className="shadow-sm"
                        style={{ 
                          borderRadius: '8px',
                          borderWidth: '1px',
                          padding: '0.375rem 1rem'
                        }}
                      >
                        삭제
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </div>
    </Card>

    {/* ⚙️ 수동 제어 패널 영역 */}
    <h2 className="mb-4 text-center">⚙️ 수동 제어 패널</h2>
    <Row className="g-4">
      {/* 💡 조명 */}
      <Col xs={12} md={4}>
        <Card className="shadow-sm text-center">
          <Card.Body>
            <h5 className="fw-bold text-primary">조명 제어</h5>
            <div className="display-5 my-2">
              {ledStatus === "ON" ? (
                <FaLightbulb className="text-warning" />
              ) : (
                <FaRegLightbulb style={{ color: "gray" }} />
              )}
            </div>
            <p className="text-muted">
              현재 상태: {ledStatus === "ON" ? "켜짐" : "꺼짐"}
            </p>
            <Button
              variant={ledStatus === "ON" ? "danger" : "success"}
              className="fw-bold w-100"
              onClick={toggleLight}
            >
              {ledStatus === "ON" ? "전구 끄기" : "전구 켜기"}
            </Button>
            {lightErrorMessage && (
              <p className="mt-3 text-danger small">{lightErrorMessage}</p>
            )}
          </Card.Body>
        </Card>
      </Col>

      {/* 💧 급수 */}
      <Col xs={12} md={4}>
        <Card className="shadow-sm text-center">
          <Card.Body>
            <h5 className="fw-bold text-primary">급수 제어</h5>
            <div className="display-5 my-2">
              {waterStatus === "ON" ? (
                <FaShower className="text-info" />
              ) : (
                <FaSeedling style={{ color: "green" }} />
              )}
            </div>
            <p className="text-muted">
              현재 상태: {waterStatus === "ON" ? "작동 중" : "대기 중"}
            </p>
            <Button
              variant={waterStatus === "ON" ? "danger" : "success"}
              className="fw-bold w-100"
              onClick={toggleWatering}
            >
              {waterStatus === "ON" ? "급수 중지" : "급수 시작"}
            </Button>
            {waterErrorMessage && (
              <p className="mt-3 text-danger small">{waterErrorMessage}</p>
            )}
          </Card.Body>
        </Card>
      </Col>

      {/* 🌬️ 팬 */}
      <Col xs={12} md={4}>
        <Card className="shadow-sm text-center">
          <Card.Body>
            <h5 className="fw-bold text-primary">환기팬 제어</h5>
            <div className="display-5 my-2">
              <FaFan
                style={{
                  color: fanStatus === "ON" ? "#0d6efd" : "gray",
                  transform: fanStatus === "ON" ? "rotate(45deg)" : "none",
                }}
              />
            </div>
            <p className="text-muted">
              현재 상태: {fanStatus === "ON" ? "켜짐" : "꺼짐"}
            </p>
            <Button
              variant={fanStatus === "ON" ? "danger" : "success"}
              className="fw-bold w-100"
              onClick={toggleFan}
            >
              {fanStatus === "ON" ? "팬 끄기" : "팬 켜기"}
            </Button>
            {fanErrorMessage && (
              <p className="mt-3 text-danger small">{fanErrorMessage}</p>
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  </Container>
 );
};

export default UserControlPanel;
