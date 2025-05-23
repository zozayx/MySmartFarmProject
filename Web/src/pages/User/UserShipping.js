import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

const UserShipping = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    phone: '',
    address: '',
    addressDetail: '',
    zipCode: '',
    message: '',
    messageType: 'default'
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // 다음 우편번호 스크립트 동적 로드
    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePostcodeSearch = () => {
    new window.daum.Postcode({
      oncomplete: (data) => {
        let fullAddress = data.address;
        let extraAddress = '';

        if (data.addressType === 'R') {
          if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
            extraAddress += data.bname;
          }
          if (data.buildingName !== '' && data.apartment === 'Y') {
            extraAddress += (extraAddress !== '' ? ', ' + data.buildingName : data.buildingName);
          }
          if (extraAddress !== '') {
            fullAddress += ` (${extraAddress})`;
          }
        }

        setShippingInfo(prev => ({
          ...prev,
          zipCode: data.zonecode,
          address: fullAddress
        }));
      }
    }).open();
  };

  const validateForm = () => {
    const newErrors = {};
    if (!shippingInfo.name) newErrors.name = '이름을 입력해주세요';
    if (!shippingInfo.phone) newErrors.phone = '전화번호를 입력해주세요';
    if (!shippingInfo.address) newErrors.address = '주소를 입력해주세요';
    if (!shippingInfo.zipCode) newErrors.zipCode = '우편번호를 입력해주세요';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCheckout = async () => {
    if (!validateForm()) return;

    try {
      const items = cartItems.map(item => ({
        store_id: item.store_id,
        quantity: item.quantity
      }));

      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/user/devices/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(items)
      });
      
      const data = await response.json();
      if (data.success) {
        clearCart();
        alert('구매가 완료되었습니다! 내 장치 관리에서 확인하세요.');
        navigate('/user/farm-management');
      } else {
        alert(data.error || '구매 처리 중 오류가 발생했습니다.');
      }
    } catch (e) {
      alert('서버 오류가 발생했습니다.');
    }
  };

  if (!location.state?.cartItems) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">
          장바구니가 비어있습니다.
          <Button variant="link" onClick={() => navigate('/user/store')}>
            쇼핑 계속하기
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4 mb-5">
      <h1 className="mb-4">배송 정보</h1>
      <Row>
        <Col md={8}>
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">배송지 정보</h5>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>받는 사람</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={shippingInfo.name}
                    onChange={handleInputChange}
                    isInvalid={!!errors.name}
                    placeholder="받는 분 성함을 입력해주세요"
                  />
                  <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>전화번호</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={shippingInfo.phone}
                    onChange={handleInputChange}
                    isInvalid={!!errors.phone}
                    placeholder="'-' 없이 숫자만 입력해주세요"
                  />
                  <Form.Control.Feedback type="invalid">{errors.phone}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>우편번호</Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Control
                      type="text"
                      name="zipCode"
                      value={shippingInfo.zipCode}
                      onChange={handleInputChange}
                      isInvalid={!!errors.zipCode}
                      placeholder="우편번호"
                      readOnly
                    />
                    <Button 
                      variant="outline-secondary" 
                      onClick={handlePostcodeSearch}
                      style={{ width: '120px' }}
                    >
                      우편번호 검색
                    </Button>
                  </div>
                  <Form.Control.Feedback type="invalid">{errors.zipCode}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>주소</Form.Label>
                  <Form.Control
                    type="text"
                    name="address"
                    value={shippingInfo.address}
                    onChange={handleInputChange}
                    isInvalid={!!errors.address}
                    placeholder="기본주소"
                    readOnly
                  />
                  <Form.Control.Feedback type="invalid">{errors.address}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>상세주소</Form.Label>
                  <Form.Control
                    type="text"
                    name="addressDetail"
                    value={shippingInfo.addressDetail}
                    onChange={handleInputChange}
                    placeholder="상세주소를 입력해주세요"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>배송 메시지</Form.Label>
                  <Form.Select
                    className="mb-2"
                    value={shippingInfo.messageType}
                    onChange={(e) => {
                      const value = e.target.value;
                      setShippingInfo(prev => ({
                        ...prev,
                        messageType: value,
                        message: value === 'default' ? '' : prev.message
                      }));
                    }}
                  >
                    <option value="default">배송 시 요청사항을 선택해주세요</option>
                    <option value="door">문 앞에 놓아주세요</option>
                    <option value="security">경비실에 맡겨주세요</option>
                    <option value="call">배송 전에 연락주세요</option>
                    <option value="custom">직접 입력</option>
                  </Form.Select>
                  {shippingInfo.messageType === 'custom' && (
                    <Form.Control
                      as="textarea"
                      name="message"
                      value={shippingInfo.message}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="배송 시 요청사항을 직접 입력해주세요"
                    />
                  )}
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <h5 className="mb-3">주문 상품</h5>
              {cartItems.map((item) => (
                <div key={item.store_id} className="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <h6 className="mb-0">{item.name}</h6>
                    <small className="text-muted">
                      [{item.type === 'sensor' ? '센서 장치' : '제어 장치'}] {item.subtype}
                    </small>
                  </div>
                  <div>
                    <span className="me-2">{item.quantity}개</span>
                    <span>{item.price?.toLocaleString()}원</span>
                  </div>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">결제 정보</h5>
              <div className="d-flex justify-content-between mb-2">
                <span>상품 금액:</span>
                <span>{getTotalPrice().toLocaleString()}원</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>배송비:</span>
                <span>무료</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-3">
                <span>총 결제 금액:</span>
                <span className="h5 mb-0">{getTotalPrice().toLocaleString()}원</span>
              </div>
              <Button
                variant="success"
                className="w-100"
                onClick={handleCheckout}
              >
                결제하기
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default UserShipping; 