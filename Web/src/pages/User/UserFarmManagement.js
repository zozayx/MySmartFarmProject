import React, { useState, useEffect } from "react";
import { Card, Row, Col, Container, Modal, Button } from "react-bootstrap";
import { FaTrash, FaWifi, FaLeaf } from "react-icons/fa";
import { usePopup } from "../../context/PopupContext";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

function DeleteButton({ farmId, espId, type, onDelete }) {
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
          }
          // 센서/액추에이터 삭제는 더 이상 지원하지 않음
          
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
  const [espDetails, setEspDetails] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [newEspIp, setNewEspIp] = useState("");
  const [newEspName, setNewEspName] = useState("");
  const [newEspType, setNewEspType] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [farmId, setFarmId] = useState(null);
  const [deviceName, setDeviceName] = useState('');
  const [unassignedDevices, setUnassignedDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [allDevices, setAllDevices] = useState([]);
  const [farmIdToName, setFarmIdToName] = useState({});
  const [showAssignDeviceModal, setShowAssignDeviceModal] = useState(false);
  const [gpioPin, setGpioPin] = useState('');
  const [usedGpioPins, setUsedGpioPins] = useState([]);

  // IP랑 Serial 번호 형식
  const isValidIp = (ip) => /^(\d{1,3}\.){3}\d{1,3}$/.test(ip);

  // 사용 가능한 GPIO 핀 목록
  const availableGpioPins = [4, 5, 13, 14, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33];

  // GPIO 핀 번호 유효성 검사
  const isValidGpioPin = (pin) => {
    const num = parseInt(pin);
    return !isNaN(num) && availableGpioPins.includes(num) && !usedGpioPins.includes(num);
  };

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
        return;
    }

    // 세부 정보를 새로 가져오는 경우에만 호출
    fetch(`${BASE_URL}/user/farm/${farmId}/esp/${espId}`, {
      method: 'GET',
      credentials: 'include',
    })
      .then(response => response.json())
      .then(data => {
        setEspDetails(data);
        setUsedGpioPins(data.used_gpio_pins || []);
        setActiveModal(`esp_${espId}`);
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

  // 모달 닫기
  const handleCloseModal = () => {
    setActiveModal(null); // 모달 닫기
    setEspDetails(null); 
};

  // ESP 추가 모달 열릴 때마다 미할당 장치 목록 fetch
  useEffect(() => {
    if (activeModal === 'addEsp') {
      fetch(`${BASE_URL}/user/devices/unassigned`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => setUnassignedDevices(Array.isArray(data) ? data : []));
    }
  }, [activeModal]);

  // ESP 추가 모달 열기
  const handleAddEsp = (farmId) => {
    console.log('Opening ESP add modal for farm:', farmId);
    setFarmId(farmId);
    setNewEspIp("");
    setNewEspName("");
    setNewEspType("");
    setSubmitted(false);
    setActiveModal('addEsp');
    console.log('Modal state after setting:', 'addEsp');
  };

  // ESP 추가 API 호출
  const handleAddEspSubmit = () => {
    setSubmitted(true);
    if (!newEspIp || !isValidIp(newEspIp) || !newEspName || !newEspType) return;

    fetch(`${BASE_URL}/user/farm/${farmId}/esp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        esp_ip: newEspIp,
        esp_name: newEspName,
        device_type: newEspType
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert('ESP가 추가되었습니다!');
          setActiveModal(null);
          // 농장 데이터 새로고침
          fetch(`${BASE_URL}/user/farms`, {
            method: 'GET',
            credentials: 'include',
          })
            .then(response => response.json())
            .then(newData => {
              console.log('새로 가져온 농장 데이터:', newData);
              setFarms(newData);
            })
            .catch(error => {
              console.error("Error refreshing farm data:", error);
            });
        } else {
          alert(data.error || '서버 오류가 발생했습니다. 다시 시도해주세요.');
        }
      })
      .catch(error => {
        console.error('ESP 추가 중 오류:', error);
        alert('서버 오류가 발생했습니다. 다시 시도해주세요.');
      });
  };

  // 장치 할당 모달 열기
  const handleShowAssignDeviceModal = () => {
    fetch(`${BASE_URL}/user/devices/unassigned`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setUnassignedDevices(Array.isArray(data) ? data : []);
        setSelectedDeviceId("");
        setDeviceName("");
        setGpioPin("");
        setShowAssignDeviceModal(true);
      });
  };

  // 장치 할당 API 호출
  const handleAssignDevice = () => {
    setSubmitted(true);
    if (!selectedDeviceId || !deviceName) return;
    if (gpioPin && !isValidGpioPin(gpioPin)) return;

    fetch(`${BASE_URL}/user/devices/${selectedDeviceId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        farm_id: espDetails.farm_id,
        esp_id: espDetails.esp_id,
        custom_name: deviceName,
        gpio_pin: gpioPin ? parseInt(gpioPin) : null
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert('장치가 할당되었습니다!');
          setShowAssignDeviceModal(false);
          // ESP 세부 정보 새로고침
          fetchEspDetails(espDetails.farm_id, espDetails.esp_id);
          // 농장 데이터 전체 새로고침
          refreshFarms();
        } else {
          alert(data.error || '서버 오류가 발생했습니다. 다시 시도해주세요.');
        }
      })
      .catch(error => {
        alert('서버 오류가 발생했습니다. 다시 시도해주세요.');
      });
  };

  // 장치 관리 모달 열기
  const handleShowDeviceModal = () => {
    fetch(`${BASE_URL}/user/devices/all`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setAllDevices(Array.isArray(data) ? data : []);
        // farmId -> farmName 매핑 생성
        const map = {};
        farms.forEach(farm => { map[farm.farm_id] = farm.farm_name; });
        setFarmIdToName(map);
        setShowDeviceModal(true);
      });
  };
  const handleCloseDeviceModal = () => setShowDeviceModal(false);

  // ESP에서 장치 제거
  const handleRemoveDeviceFromEsp = async (deviceId) => {
    if (!window.confirm('이 장치를 ESP에서 제거하시겠습니까?')) return;

    try {
      const response = await fetch(
        `${BASE_URL}/user/farm/${espDetails.farm_id}/esp/${espDetails.esp_id}/${espDetails.devices.find(d => d.id === deviceId).type}/${deviceId}`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        alert('장치가 ESP에서 제거되었습니다.');
        // ESP 세부 정보 새로고침
        fetchEspDetails(espDetails.farm_id, espDetails.esp_id);
        // 농장 데이터 전체 새로고침
        refreshFarms();
      } else {
        alert(data.error || '장치 제거 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Error removing device from ESP:', error);
      alert('장치 제거 중 오류가 발생했습니다. 관리자에게 문의하세요.');
    }
  };

  // 장치 영구삭제
  const handleDeleteDevice = async (deviceId) => {
    // 장치가 할당되어 있는지 확인
    const device = allDevices.find(d => d.device_id === deviceId);
    if (device && device.status === 'assigned') {
      alert('할당된 장치는 삭제할 수 없습니다. 먼저 ESP에서 장치를 제거해주세요.');
      return;
    }

    if (!window.confirm('이 장치를 영구 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(
        `${BASE_URL}/user/devices/${deviceId}`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        alert('장치가 성공적으로 삭제되었습니다.');
        // 장치 목록 새로고침
        handleShowDeviceModal();
      } else {
        alert(data.error || '장치 삭제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Error deleting device:', error);
      alert('장치 삭제 중 오류가 발생했습니다. 관리자에게 문의하세요.');
    }
  };

  return (
    <Container fluid style={{ backgroundColor: "#ffffff", minHeight: "100vh", paddingTop: "50px" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-center text-dark mb-0" style={{ color: "#3c8d40" }}>🌱 내 농장 관리</h2>
        <Button variant="outline-primary" size="sm" onClick={handleShowDeviceModal}>
          내 장치 관리
        </Button>
      </div>
      {farms.length > 0 ? (
        farms.map((farm, idx) => (
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
                  {/* 메인 ESP 섹션 */}
                  {farm.main && farm.main.length > 0 && (
                    <Col sm={12}>
                      <h5 className="mb-3" style={{ color: "#3c8d40" }}>🌐 메인 ESP</h5>
                      <Row className="g-4">
                        {farm.main.map(esp => (
                          <Col key={esp.esp_id} sm={12} md={6} lg={4}>
                            <Card className="mb-4 shadow-sm" style={{
                              borderRadius: "16px",
                              background: "#f8fafc",
                              border: "1px solid #e0e0e0",
                              minHeight: 220,
                              position: "relative"
                            }}>
                              <Card.Body>
                                <div className="d-flex align-items-center mb-2">
                                  <div style={{
                                    fontSize: 32,
                                    color: esp.is_connected ? "#28a745" : "#dc3545",
                                    marginRight: 12
                                  }}>
                                    <FaWifi />
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 600, fontSize: 20 }}>
                                      {esp.esp_name}
                                    </div>
                                    <span className="badge bg-light text-dark border" style={{ fontSize: 13 }}>
                                      메인
                                    </span>
                                    {esp.is_connected ? (
                                      <span className="badge bg-success ms-2">연결됨</span>
                                    ) : (
                                      <span className="badge bg-danger ms-2">연결 안 됨</span>
                                    )}
                                  </div>
                                </div>
                                <hr style={{ margin: "10px 0" }} />
                                <div style={{ fontSize: 15, color: "#444" }}>
                                  <div><b>IP:</b> {esp.ip_address}</div>
                                </div>
                                <div className="d-flex justify-content-end mt-3">
                                  <Button
                                    variant="outline-success"
                                    size="sm"
                                    onClick={() => fetchEspDetails(farm.farm_id, esp.esp_id)}
                                    style={{ borderRadius: 8, marginRight: 8 }}
                                  >
                                    세부 정보
                                  </Button>
                                  <DeleteButton farmId={farm.farm_id} espId={esp.esp_id} type="esp" onDelete={refreshFarms} />
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    </Col>
                  )}

                  {/* 센서 ESP 섹션 */}
                  {farm.sensors && farm.sensors.length > 0 && (
                    <Col sm={12}>
                      <h5 className="mb-3" style={{ color: "#3c8d40" }}>🌡️ 센서 ESP</h5>
                      <Row className="g-4">
                        {farm.sensors.map(esp => (
                          <Col key={esp.esp_id} sm={12} md={6} lg={4}>
                            <Card className="mb-4 shadow-sm" style={{
                              borderRadius: "16px",
                              background: "#f8fafc",
                              border: "1px solid #e0e0e0",
                              minHeight: 220,
                              position: "relative"
                            }}>
                              <Card.Body>
                                <div className="d-flex align-items-center mb-2">
                                  <div style={{
                                    fontSize: 32,
                                    color: esp.is_connected ? "#28a745" : "#dc3545",
                                    marginRight: 12
                                  }}>
                                    <FaWifi />
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 600, fontSize: 20 }}>
                                      {esp.esp_name}
                                    </div>
                                    <span className="badge bg-light text-dark border" style={{ fontSize: 13 }}>
                                      센서
                                    </span>
                                    {esp.is_connected ? (
                                      <span className="badge bg-success ms-2">연결됨</span>
                                    ) : (
                                      <span className="badge bg-danger ms-2">연결 안 됨</span>
                                    )}
                                  </div>
                                </div>
                                <hr style={{ margin: "10px 0" }} />
                                <div style={{ fontSize: 15, color: "#444" }}>
                                  <div><b>타입명:</b> {esp.device?.device_type}</div>
                                  <div><b>GPIO 핀:</b> {esp.device?.gpio_pin}</div>
                                  <div><b>IP:</b> {esp.ip_address}</div>
                                  <div><b>연결된 장치:</b> {esp.device?.name || '없음'}</div>
                                </div>
                                <div className="d-flex justify-content-end mt-3">
                                  <Button
                                    variant="outline-success"
                                    size="sm"
                                    onClick={() => fetchEspDetails(farm.farm_id, esp.esp_id)}
                                    style={{ borderRadius: 8, marginRight: 8 }}
                                  >
                                    세부 정보
                                  </Button>
                                  <DeleteButton farmId={farm.farm_id} espId={esp.esp_id} type="esp" onDelete={refreshFarms} />
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    </Col>
                  )}

                  {/* 액추에이터 ESP 섹션 */}
                  {farm.actuators && farm.actuators.length > 0 && (
                    <Col sm={12}>
                      <h5 className="mb-3" style={{ color: "#3c8d40" }}>⚙️ 제어 ESP</h5>
                      <Row className="g-4">
                        {farm.actuators.map(esp => (
                          <Col key={esp.esp_id} sm={12} md={6} lg={4}>
                            <Card className="mb-4 shadow-sm" style={{
                              borderRadius: "16px",
                              background: "#f8fafc",
                              border: "1px solid #e0e0e0",
                              minHeight: 220,
                              position: "relative"
                            }}>
                              <Card.Body>
                                <div className="d-flex align-items-center mb-2">
                                  <div style={{
                                    fontSize: 32,
                                    color: esp.is_connected ? "#28a745" : "#dc3545",
                                    marginRight: 12
                                  }}>
                                    <FaWifi />
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 600, fontSize: 20 }}>
                                      {esp.esp_name}
                                    </div>
                                    <span className="badge bg-light text-dark border" style={{ fontSize: 13 }}>
                                      제어장치
                                    </span>
                                    {esp.is_connected ? (
                                      <span className="badge bg-success ms-2">연결됨</span>
                                    ) : (
                                      <span className="badge bg-danger ms-2">연결 안 됨</span>
                                    )}
                                  </div>
                                </div>
                                <hr style={{ margin: "10px 0" }} />
                                <div style={{ fontSize: 15, color: "#444" }}>
                                  <div><b>타입명:</b> {esp.device?.device_type || '없음'}</div>
                                  <div><b>IP:</b> {esp.ip_address}</div>
                                  <div><b>연결된 장치:</b> {esp.device?.name || '없음'}</div>
                                </div>
                                <div className="d-flex justify-content-end mt-3">
                                  <Button
                                    variant="outline-success"
                                    size="sm"
                                    onClick={() => fetchEspDetails(farm.farm_id, esp.esp_id)}
                                    style={{ borderRadius: 8, marginRight: 8 }}
                                  >
                                    세부 정보
                                  </Button>
                                  <DeleteButton farmId={farm.farm_id} espId={esp.esp_id} type="esp" onDelete={refreshFarms} />
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    </Col>
                  )}

                  {/* 장치가 없는 경우 */}
                  {(!farm.sensors || farm.sensors.length === 0) && (!farm.actuators || farm.actuators.length === 0) && (
                    <Col sm={12}><p>장치(ESP) 정보가 없습니다.</p></Col>
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
              <label className="form-label">ESP 이름</label>
              <input
                type="text"
                className={`form-control ${submitted && !newEspName ? 'is-invalid' : ''}`}
                value={newEspName}
                onChange={e => setNewEspName(e.target.value)}
                placeholder="ESP 이름을 입력하세요"
              />
              {submitted && !newEspName && (
                <div className="invalid-feedback">ESP 이름을 입력해주세요.</div>
              )}
            </div>
            <div className="mb-3">
              <label className="form-label">IP 주소</label>
              <input
                type="text"
                className={`form-control ${submitted && (!newEspIp || !isValidIp(newEspIp)) ? 'is-invalid' : ''}`}
                value={newEspIp}
                onChange={e => setNewEspIp(e.target.value)}
                placeholder="예: 192.168.1.100"
              />
              {submitted && !newEspIp && (
                <div className="invalid-feedback">IP 주소를 입력해주세요.</div>
              )}
              {submitted && newEspIp && !isValidIp(newEspIp) && (
                <div className="invalid-feedback">올바른 IP 주소 형식으로 입력해주세요.</div>
              )}
            </div>
            <div className="mb-3">
              <label className="form-label">ESP 타입</label>
              <select
                className={`form-select ${submitted && !newEspType ? 'is-invalid' : ''}`}
                value={newEspType}
                onChange={e => setNewEspType(e.target.value)}
              >
                <option value="">ESP 타입을 선택하세요</option>
                <option value="main">메인 ESP</option>
                <option value="sensor">센서 ESP</option>
                <option value="actuator">제어장치 ESP</option>
              </select>
              {submitted && !newEspType && (
                <div className="invalid-feedback">ESP 타입을 선택해주세요.</div>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="success"
              onClick={handleAddEspSubmit}
              disabled={!newEspIp || !isValidIp(newEspIp) || !newEspName || !newEspType}
            >
              추가
            </Button>
            <Button variant="secondary" onClick={handleCloseModal}>취소</Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* ESP 세부 정보 모달 */}
      {espDetails && (
        <Modal show={true} onHide={handleCloseModal} centered>
          <Modal.Header closeButton style={{ background: "#f1f8f4", borderBottom: "1px solid #e0e0e0" }}>
            <div className="d-flex align-items-center w-100">
              <div style={{
                fontSize: 36,
                color: espDetails.is_connected ? "#28a745" : "#dc3545",
                marginRight: 16
              }}>
                <FaWifi />
              </div>
              <div>
                <Modal.Title style={{ fontWeight: 700, fontSize: 22 }}>
                  ESP 정보
                </Modal.Title>
                <div>
                  {espDetails.is_connected ? (
                    <span className="badge bg-success">연결됨</span>
                  ) : (
                    <span className="badge bg-danger">연결 안 됨</span>
                  )}
                </div>
              </div>
            </div>
          </Modal.Header>
          <Modal.Body style={{ background: "#f8fafc" }}>
            <div style={{ fontSize: 16, color: "#333" }}>
              <div className="mb-3">
                <h5 style={{ fontWeight: '600', marginBottom: '1rem' }}>ESP 정보</h5>
                <div className="mb-2"><b>IP 주소:</b> {espDetails.ip_address}</div>
                <div className="mb-2">
                  <b>연결 상태:</b>
                  <span style={{ 
                    color: espDetails.is_connected ? '#28a745' : '#dc3545',
                    marginLeft: '8px',
                    fontWeight: 'bold'
                  }}>
                    {espDetails.is_connected ? '연결됨' : '연결 안 됨'}
                  </span>
                </div>
              </div>

              <hr />

              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 style={{ fontWeight: '600', margin: 0 }}>연결된 장치</h5>
                  <Button variant="success" size="sm" onClick={handleShowAssignDeviceModal}>
                    + 장치 할당
                  </Button>
                </div>
                {espDetails.devices && espDetails.devices.length > 0 ? (
                  espDetails.devices.map((device, index) => (
                    <div key={device.id} className="mb-4 p-3" style={{ 
                      background: '#fff', 
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0'
                    }}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 style={{ margin: 0, fontWeight: '600' }}>
                          {device.name}
                          <span className="badge bg-light text-dark border ms-2" style={{ fontSize: '0.8rem' }}>
                            {device.type === 'sensor' ? '센서' : '제어장치'}
                          </span>
                        </h6>
                        <span style={{ 
                          color: device.is_active ? '#28a745' : '#dc3545',
                          fontWeight: 'bold'
                        }}>
                          {device.is_active ? '작동중' : '작동중이 아님'}
                        </span>
                      </div>
                      <div className="mb-2"><b>장치 이름(구매명):</b> {device.device_name}</div>
                      <div className="mb-2"><b>타입명:</b> {device.device_type}</div>
                      <div className="mb-2"><b>GPIO 핀:</b> {device.gpio_pin}</div>
                      <div className="d-flex justify-content-end mt-3">
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleRemoveDeviceFromEsp(device.id)}
                        >
                          <FaTrash /> 제거
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted">연결된 장치가 없습니다.</p>
                )}
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer style={{ background: "#f1f8f4", borderTop: "1px solid #e0e0e0" }}>
            <Button variant="secondary" onClick={handleCloseModal} style={{ width: "100%", borderRadius: 10 }}>
              닫기
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* 장치 할당 모달 */}
      {showAssignDeviceModal && (
        <Modal show={true} onHide={() => setShowAssignDeviceModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>장치 할당</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mb-3">
              <label className="form-label">내 미할당 장치</label>
              <select
                className="form-select"
                value={selectedDeviceId}
                onChange={e => setSelectedDeviceId(e.target.value)}
              >
                <option value="">장치를 선택하세요</option>
                {unassignedDevices.map(dev => (
                  <option key={dev.device_id} value={dev.device_id}>
                    [{dev.device_type === 'sensor' ? '센서' : '제어장치'}] {dev.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">설정할 이름</label>
              <input
                type="text"
                className={`form-control ${submitted && !deviceName ? 'is-invalid' : ''}`}
                value={deviceName}
                onChange={e => setDeviceName(e.target.value)}
              />
              {submitted && !deviceName && (
                <div className="invalid-feedback">장치 이름을 입력해주세요.</div>
              )}
            </div>
            <div className="mb-3">
              <label className="form-label">GPIO 핀 번호 (선택사항)</label>
              <select
                className={`form-select ${submitted && gpioPin && !isValidGpioPin(gpioPin) ? 'is-invalid' : ''}`}
                value={gpioPin}
                onChange={e => setGpioPin(e.target.value)}
              >
                <option value="">GPIO 핀을 선택하세요</option>
                {availableGpioPins.map(pin => (
                  <option 
                    key={pin} 
                    value={pin}
                    disabled={usedGpioPins.includes(pin)}
                  >
                    {pin} {usedGpioPins.includes(pin) ? '(사용 중)' : ''}
                  </option>
                ))}
              </select>
              {submitted && gpioPin && !isValidGpioPin(gpioPin) && (
                <div className="invalid-feedback">사용 가능한 핀 번호를 선택해주세요.</div>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="success"
              onClick={handleAssignDevice}
              disabled={!selectedDeviceId || !deviceName || (gpioPin && !isValidGpioPin(gpioPin))}
            >
              할당
            </Button>
            <Button variant="secondary" onClick={() => setShowAssignDeviceModal(false)}>취소</Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* 장치 관리 모달 */}
      <Modal show={showDeviceModal} onHide={handleCloseDeviceModal} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>내 장치 관리</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <table className="table table-bordered align-middle">
            <thead>
              <tr>
                <th>이름</th>
                <th>타입</th>
                <th>GPIO</th>
                <th>상태</th>
                <th>할당 정보</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {allDevices.length === 0 ? (
                <tr><td colSpan={6} className="text-center">장치가 없습니다.</td></tr>
              ) : (
                allDevices.map(device => (
                  <tr key={device.device_id}>
                    <td>{device.name}</td>
                    <td>{device.device_type}</td>
                    <td>{device.gpio_pin}</td>
                    <td>{device.status === 'assigned' ? '할당됨' : device.status === 'unassigned' ? '미할당' : device.status}</td>
                    <td>
                      {device.status === 'assigned' && device.assigned_farm_id && farmIdToName[device.assigned_farm_id]
                        ? `[${farmIdToName[device.assigned_farm_id]}]`
                        : '[미할당]'}
                    </td>
                    <td>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteDevice(device.device_id)}
                      >
                        영구삭제
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeviceModal}>닫기</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default UserFarmManagement;
