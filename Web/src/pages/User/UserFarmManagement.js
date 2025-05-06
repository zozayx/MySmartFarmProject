import React, { useState, useEffect } from "react";
import { Card, Row, Col, Container, Modal, Button } from "react-bootstrap";
import { FaTrash, FaWifi, FaLeaf } from "react-icons/fa"; // 아이콘 추가
import { usePopup } from "../../context/PopupContext";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

function DeleteButton({ farmId, espId, sensorId, actuatorId, type, onDelete }) {
  const { showPopup } = usePopup();  // showPopup 함수 사용

  const handleDelete = () => {
    showPopup({
      title: '삭제하시겠습니까?',
      message: '이 작업은 되돌릴 수 없습니다.',
      buttonText: '삭제',
      cancelButtonText: '취소',
      confirmVariant: 'danger',
      cancelVariant: 'outline-danger',
      onConfirm: async () => {
        try {
          let deleteUrl = '';

          // 삭제 URL 설정
          if (type === 'farm') {
            deleteUrl = `${BASE_URL}/user/farm/${farmId}`;
          } else if (type === 'esp') {
            deleteUrl = `${BASE_URL}/user/farm/${farmId}/esp/${espId}`;
          } else if (type === 'sensor') {
            deleteUrl = `${BASE_URL}/user/farm/esp/${espId}/sensor/${sensorId}`;
          } else if (type === 'actuator') {
            deleteUrl = `${BASE_URL}/user/farm/esp/${espId}/actuator/${actuatorId}`;
          }
          
          const response = await fetch(deleteUrl, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            showPopup({
              title: '삭제 완료',
              message: '정상적으로 삭제되었습니다.',
              buttonText: '확인',
            });
            onDelete(type);  // 부모 컴포넌트에 갱신 요청 (type을 전달하여 삭제된 항목에 맞는 갱신 함수 호출)
          } else {
            showPopup({
              title: '삭제 실패',
              message: '삭제에 실패했습니다. 다시 시도해주세요.',
              buttonText: '확인',
              confirmVariant: 'danger',
            });
          }
        } catch (error) {
          console.error('삭제 중 오류 발생:', error);
          showPopup({
            title: '오류 발생',
            message: '삭제 중 오류가 발생했습니다. 관리자에게 문의하세요.',
            buttonText: '확인',
            confirmVariant: 'danger',
          });
        }
      },
    });
  };

  return (
    <Button variant="danger" size="sm" onClick={handleDelete}>
      <FaTrash /> 삭제
    </Button>
  );
}

const UserFarmManagement = () => {
  const [farms, setFarms] = useState([]);
  const [espDetails, setEspDetails] = useState(null); // ESP 세부 정보를 저장할 상태
  const [activeModal, setActiveModal] = useState(null); // 어떤 모달이 열려있는지 추적
  const [newEspName, setNewEspName] = useState("");  // ESP 이름 상태
  const [newEspIp, setNewEspIp] = useState("");  // ESP IP 주소 상태
  const [submitted, setSubmitted] = useState(false);
  const [farmId, setFarmId] = useState(null); // farmId 상태 추가
  const [deviceType, setDeviceType] = useState('sensor');  // 장치 타입 (sensor / actuator)
  const [sensorType, setSensorType] = useState('');  // 센서 타입
  const [actuatorType, setActuatorType] = useState('');  // 제어 장치 타입
  const [deviceName, setDeviceName] = useState('');  // 장치 이름
  const [gpioPin, setGpioPin] = useState(4);  // GPIO 핀 번호
  const [espId, setEspId] = useState(null);

  // IP랑 Serial 번호 형식
  const isValidIp = (ip) => /^(\d{1,3}\.){3}\d{1,3}$/.test(ip);

  // GPIO 핀 번호 선택을 위한 핀 번호 리스트
  const gpioPins = [4, 5, 13, 14, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33];

  useEffect(() => {
    // 농장 정보를 가져오는 API 호출
    fetch(`${BASE_URL}/user/farms`, {
      method: 'GET',
      credentials: 'include', // 인증 토큰 포함
    })
      .then(response => response.json())
      .then(data => {
        setFarms(data);
      })
      .catch(error => console.error("Error fetching farm data:", error));
  }, []);

  // ESP 세부 정보를 가져오는 함수
  const fetchEspDetails = (farmId, espId) => {
    if (activeModal === `esp_${espId}`) {
        return; // 이미 같은 ESP의 모달이 열려 있다면 다시 열지 않음
    }

    // 세부 정보를 새로 가져오는 경우에만 호출
    fetch(`${BASE_URL}/user/farm/${farmId}/esp/${espId}`, {
      method: 'GET',
      credentials: 'include', // 인증 토큰 포함
    })
      .then(response => response.json())
      .then(data => {
        setEspDetails(data);
        setActiveModal(`esp_${espId}`); // 해당 ESP 모달 열기
      })
      .catch(error => console.error("Error fetching ESP details:", error));
  };

  // 농장, esp 삭제 후 화면 갱신
  const refreshFarms = () => {
    fetch(`${BASE_URL}/user/farms`, {
      method: 'GET',
      credentials: 'include',
    })
      .then(response => response.json())
      .then(data => {
        setFarms(data);
      })
      .catch(error => console.error("Error fetching farm data after delete:", error));
  };

  // 센서, 액추에이터 삭제 후 화면 갱신
  const refreshEspDetails = (farmId, espId) => {
    fetch(`${BASE_URL}/user/farm/${farmId}/esp/${espId}`, {
      method: 'GET',
      credentials: 'include',
    })
      .then(response => response.json())
      .then(data => {
        setEspDetails(data); // 모달 안 내용 갱신
      })
      .catch(error => console.error("Error refreshing ESP details:", error));
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setActiveModal(null); // 모달 닫기
    setEspDetails(null); 
};

  // ESP 추가 모달 열기
  const handleAddEsp = (farmId) => {
    setFarmId(farmId); // farmId 상태를 업데이트
    setNewEspName("");  // 이름 초기화
    setNewEspIp("");  // IP 초기화
    setActiveModal('addEsp');  // ESP 추가 모달 열기
  }

  // ESP 추가 API 호출
  const handleAddEspSubmit = () => {
    
    setSubmitted(true); // 제출 버튼 눌림 표시

    // 유효성 검사: 입력값이 없거나 형식이 틀리면 중단
    if (!newEspName || !newEspIp ||  !isValidIp(newEspIp) ) {
      return; // 유효하지 않으면 API 호출하지 않음
    }

    const newEspData = {
      esp_name: newEspName,
      ip_address: newEspIp,
    };

    fetch(`${BASE_URL}/user/farm/${farmId}/esp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newEspData),
      credentials: 'include',
    })
      .then(response => {
        if (response.status === 201) {
          alert('ESP가 추가되었습니다!');
          setNewEspName(''); // 입력값 초기화
          setNewEspIp('');
          setSubmitted(false); // 제출 상태 초기화
          setActiveModal(null); // 모달 닫기
          refreshFarms();  // 농장 정보 갱신
        } else {
          alert('서버 오류가 발생했습니다. 다시 시도해주세요.');
        }
      })
      .catch(error => {
        console.error("Error adding ESP:", error);
        alert('서버 오류가 발생했습니다. 다시 시도해주세요.');
      });
  };
  
  const handleAddDevice = (farmId, espId) => {
    // 모달 입력값 초기화
    setDeviceType('sensor');
    setSensorType('');
    setActuatorType('');
    setDeviceName('');
    setGpioPin(4);

    // 선택된 농장과 ESP 저장
    setFarmId(farmId);
    setEspId(espId);

    // 모달 열기
    setActiveModal('addDevice');
};

  // 장치 추가 제출
  const handleAddDeviceSubmit = () => {
    setSubmitted(true);

    if (
      !deviceName ||
      (deviceType === 'sensor' && !sensorType) ||
      (deviceType === 'actuator' && !actuatorType)
    ) {
      return; // 입력이 부족하면 중단
    }

    const newDeviceData = {
      device_name: deviceName,
      gpio_pin: parseInt(gpioPin, 10),
      deviceType: deviceType,
    };

    // 센서일 경우
    if (deviceType === 'sensor') {
        newDeviceData.sensor_type = sensorType;
    }
    // 제어장치일 경우
    if (deviceType === 'actuator') {
        newDeviceData.actuator_type = actuatorType;
    }

    fetch(`${BASE_URL}/user/farm/${farmId}/esp/${espId}/device`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(newDeviceData),
        credentials: 'include',
    })
        .then(response => {
            if (response.status === 201) {
                alert('장치가 추가되었습니다!');
                refreshEspDetails(farmId, espId); // 추가: 장치 추가 후 ESP 상세 정보 갱신
                setActiveModal(null);  // 모달 닫기
            } else {
                alert('서버 오류가 발생했습니다. 다시 시도해주세요.');
            }
        })
        .catch(error => {
            console.error("Error adding device:", error);
            alert('서버 오류가 발생했습니다. 다시 시도해주세요.');
        });
  };

  return (
    <Container fluid style={{ backgroundColor: "#ffffff", minHeight: "100vh", paddingTop: "50px" }}>
      <h2 className="text-center text-dark mb-4" style={{ color: "#3c8d40" }}>🌱 내 농장 관리</h2>
      {farms.length > 0 ? (
        farms.map(farm => (
          <div key={farm.farm_id} className="mb-5">
            <Card className="mb-4 shadow" style={{ borderRadius: "15px", backgroundColor: "#f1f8f4", border: "1px solid #ddd" }}>
              <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <h3 className="text-success">
                  <FaLeaf style={{ color: "#3c8d40", marginRight: "10px" }} /> {farm.farm_name}
                </h3>
                <div className="d-flex gap-2">
                    <Button variant="success" size="sm" onClick={() => handleAddEsp(farm.farm_id)}>
                    + ESP 추가
                  </Button>
                  <DeleteButton farmId={farm.farm_id} type="farm" onDelete={refreshFarms} />
                </div>
              </div>
                <p className="text-muted">{farm.location} | {farm.farm_size} m²</p>
                <Row className="g-4">
                  {farm.esps.length > 0 ? (
                    farm.esps.map(esp => (
                      <Col key={esp.esp_id} sm={12} md={6} lg={4}>
                        <Card
                          className="mb-4 shadow"
                          style={{
                            borderRadius: "15px",
                            backgroundColor: "#eaf2e6",
                            border: "1px solid #ddd",
                            cursor: "pointer",
                            height: '100%',
                          }}
                        >
                          <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <Card.Title className="text-dark" style={{ color: "#3c8d40" }}>
                              <FaWifi style={{ color: esp.is_connected ? "#28a745" : "#dc3545", marginRight: "10px" }} />
                              {esp.esp_name}
                            </Card.Title>
                            <div className="d-flex gap-2">
                              <Button variant="success" size="sm" onClick={() => handleAddDevice(farm.farm_id, esp.esp_id)}>
                                + 장치 추가
                              </Button>
                              <DeleteButton farmId={farm.farm_id} espId={esp.esp_id} type="esp" onDelete={refreshFarms} />
                            </div>
                          </div>
                            <Card.Text className="text-muted">
                              <strong>IP 주소:</strong> {esp.ip_address || "N/A"}<br />
                              <strong>연결 상태:</strong> {esp.is_connected ? "연결됨" : "연결 안 됨"}
                            </Card.Text>
                            {/* 버튼을 카드 맨 아래로 보내기 */}
                            <div className="mt-auto">
                                <Button
                                variant="outline-success"
                                onClick={() => fetchEspDetails(farm.farm_id, esp.esp_id)}
                                style={{ width: "100%" }}
                                >
                                세부 정보
                                </Button> 
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))
                  ) : (
                    <Col sm={12}>
                      <p className="text-muted">ESP 정보가 없습니다.</p>
                    </Col>
                  )}
                </Row>
              </Card.Body>
            </Card>
          </div>
        ))
      ) : (
        <p className="text-muted text-center">농장 정보가 없습니다.</p>
      )}

      
      {/* ESP 추가 모달 */}
      {activeModal === 'addEsp' && (
          <Modal show={true} onHide={handleCloseModal} centered>
          <Modal.Header closeButton>
            <Modal.Title>ESP 추가</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mb-3">
              <label htmlFor="espName" className="form-label">ESP 이름</label>
              <input
                type="text"
                className={`form-control ${submitted && !newEspName ? 'is-invalid' : ''}`}
                id="espName"
                placeholder="예: 온실 앞문 ESP1"
                value={newEspName}
                onChange={(e) => setNewEspName(e.target.value)}
              />
              {submitted && !newEspName && (
                <div className="invalid-feedback">이름을 입력해주세요.</div>
              )}
            </div>
            <div className="mb-3">
              <label htmlFor="espIp" className="form-label">IP 주소</label>
              <input
                type="text"
                className={`form-control ${submitted && (!newEspIp || !isValidIp(newEspIp)) ? 'is-invalid' : ''}`}
                id="espIp"
                placeholder="예: 192.168.0.100"
                value={newEspIp}
                onChange={(e) => setNewEspIp(e.target.value)}
              />
              {submitted && !newEspIp && (
                <div className="invalid-feedback">IP 주소를 입력해주세요.</div>
              )}
              {submitted && newEspIp && !isValidIp(newEspIp) && (
                <div className="invalid-feedback">올바른 IP 주소 형식으로 입력해주세요. (예: 192.168.0.100)</div>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="success" onClick={handleAddEspSubmit}>추가 및 연결</Button>
            <Button variant="secondary" onClick={handleCloseModal}>취소</Button>
          </Modal.Footer>
        </Modal>  
      )}

      {/* 장치 추가 모달 UI*/}
      {activeModal === 'addDevice' && (
          <Modal show={true} onHide={handleCloseModal} centered>
              <Modal.Header closeButton>
                  <Modal.Title>장치 추가</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                  <div className="mb-3">
                      <label htmlFor="deviceType" className="form-label">장치 종류</label>
                      <select
                          className="form-select"
                          id="deviceType"
                          value={deviceType}
                          onChange={(e) => setDeviceType(e.target.value)}
                      >
                          <option value="sensor">센서</option>
                          <option value="actuator">제어 장치</option>
                      </select>
                  </div>

                  {deviceType === 'sensor' && (
                      <div className="mb-3">
                        <label htmlFor="sensorType" className="form-label">센서 타입</label>
                        <input
                          type="text"
                          className={`form-control ${submitted && !sensorType ? 'is-invalid' : ''}`}
                          id="sensorType"
                          value={sensorType}
                          onChange={(e) => setSensorType(e.target.value)}
                        />
                        {submitted && !sensorType && (
                          <div className="invalid-feedback">센서 타입을 입력해주세요.</div>
                        )}
                      </div>
                    )}
                  {deviceType === 'actuator' && (
                      <div className="mb-3">
                        <label htmlFor="actuatorType" className="form-label">제어 장치 타입</label>
                        <input
                          type="text"
                          className={`form-control ${submitted && !actuatorType ? 'is-invalid' : ''}`}
                          id="actuatorType"
                          value={actuatorType}
                          onChange={(e) => setActuatorType(e.target.value)}
                        />
                        {submitted && !actuatorType && (
                          <div className="invalid-feedback">제어 장치 타입을 입력해주세요.</div>
                        )}
                      </div>
                    )}
                  <div className="mb-3">
                    <label htmlFor="deviceName" className="form-label">장치 이름</label>
                    <input
                      type="text"
                      className={`form-control ${submitted && !deviceName ? 'is-invalid' : ''}`}
                      id="deviceName"
                      placeholder="예: 동쪽 팬, 온실 온도센서"
                      value={deviceName}
                      onChange={(e) => setDeviceName(e.target.value)}
                    />
                    {submitted && !deviceName && (
                      <div className="invalid-feedback">장치 이름을 입력해주세요.</div>
                    )}
                  </div>

                  <div className="mb-3">
                      <label htmlFor="gpioPin" className="form-label">GPIO 핀 번호</label>
                        <select
                            className="form-select"
                            id="gpioPin"
                            value={gpioPin || 4}
                            onChange={(e) => setGpioPin(e.target.value)}
                          >
                          {gpioPins.map(pin => (
                              <option key={pin} value={pin}>{pin}</option>
                          ))}
                      </select>
                  </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="success" onClick={handleAddDeviceSubmit}>추가 및 연결</Button>
                <Button variant="secondary" onClick={handleCloseModal}>취소</Button>
              </Modal.Footer>
          </Modal>
      )}

      {/* ESP 세부 정보 모달 */}
      {espDetails && (
        <Modal show={true} onHide={handleCloseModal} centered>
          <Modal.Header closeButton style={{ backgroundColor: "#eaf2e6", borderBottom: "1px solid #ddd" }}>
            <Modal.Title>{espDetails.esp_name} 장치 정보</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h5 className="text-dark"><strong>IP 주소:</strong> {espDetails.ip_address}</h5>
            <p className="text-muted"><strong>연결 상태:</strong> {espDetails.is_connected ? "연결됨" : "연결 안 됨"}</p>

            {/* 센서 목록 */}
            <h6 className="text-dark"><strong>센서 목록:</strong></h6>
            <Row className="g-4">
              {espDetails.sensors && espDetails.sensors.length > 0 ? (
                espDetails.sensors.map(sensor => (
                  <Col key={sensor.sensor_id} sm={12} md={6} lg={4}>
                    <Card className="mb-4 shadow" style={{ borderRadius: "15px", backgroundColor: "#eaf2e6", border: "1px solid #ddd" }}>
                      <Card.Body style={{ position: 'relative', paddingBottom: '3rem' }}>
                        <Card.Title>{sensor.sensor_name}</Card.Title>
                        <Card.Text className="text-muted">
                          <strong>GPIO Pin:</strong> {sensor.gpio_pin}
                          <br />
                          <strong>상태:</strong> {sensor.is_active ? "작동 중" : "작동 안 됨"}
                        </Card.Text>
                        <div style={{ position: 'absolute', bottom: '1rem', right: '1rem' }}>
                          <DeleteButton 
                            espId={espDetails.esp_id} 
                            sensorId={sensor.sensor_id} 
                            type="sensor" 
                            onDelete={() => {
                              refreshEspDetails(espDetails.farm_id, espDetails.esp_id); // 삭제 후 상태 갱신
                            }}
                          />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))
              ) : (
                <p className="text-muted">센서 정보가 없습니다.</p>
              )}
            </Row>

            {/* 액추에이터 목록 */}
            <h6 className="text-dark"><strong>액추에이터 목록:</strong></h6>
            <Row className="g-4">
              {espDetails.actuators && espDetails.actuators.length > 0 ? (
                espDetails.actuators.map(actuator => (
                  <Col key={actuator.actuator_id} sm={12} md={6} lg={4}>
                    <Card className="mb-4 shadow" style={{ borderRadius: "15px", backgroundColor: "#eaf2e6", border: "1px solid #ddd" }}>
                      <Card.Body style={{ position: 'relative', paddingBottom: '3rem' }}>
                        <Card.Title>{actuator.actuator_name}</Card.Title>
                        <Card.Text className="text-muted">
                          <strong>GPIO Pin:</strong> {actuator.gpio_pin}
                          <br />
                          <strong>상태:</strong> {actuator.is_active ? "작동 중" : "작동 안 됨"}
                        </Card.Text>
                        <div style={{ position: 'absolute', bottom: '1rem', right: '1rem' }}>
                          <DeleteButton 
                            espId={espDetails.esp_id} 
                            actuatorId={actuator.actuator_id} 
                            type="actuator" 
                            onDelete={() => {
                              refreshEspDetails(espDetails.farm_id, espDetails.esp_id); // 삭제 후 상태 갱신
                            }}
                          />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))
              ) : (
                <p className="text-muted">액추에이터 정보가 없습니다.</p>
              )}
            </Row>
          </Modal.Body>
          <Modal.Footer style={{ backgroundColor: "#eaf2e6", borderTop: "1px solid #ddd" }}>
            <Button variant="secondary" onClick={handleCloseModal} style={{ width: "100%", borderRadius: "10px" }}>
              닫기
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </Container>
  );
};



export default UserFarmManagement;
