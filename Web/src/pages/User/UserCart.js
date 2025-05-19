import React from 'react';
import { Container, Row, Col, Card, Button, Form, Alert } from 'react-bootstrap';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  const handleQuantityChange = (productId, newQuantity) => {
    updateQuantity(productId, parseInt(newQuantity));
  };

  const handleCheckout = () => {
    // TODO: 결제 페이지로 이동
    alert('결제 기능은 아직 구현되지 않았습니다.');
  };

  if (cartItems.length === 0) {
    return (
      <Container className="mt-4">
        <Alert variant="info">
          장바구니가 비어있습니다.
          <Button variant="link" onClick={() => navigate('/user/store')}>
            쇼핑 계속하기
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h1 className="mb-4">장바구니</h1>
      <Row>
        <Col md={8}>
          {cartItems.map((item) => (
            <Card key={item.store_id} className="mb-3">
              <Card.Body>
                <Row>
                  <Col md={3}>
                    {item.image_url && (
                      <img
                        src={`${process.env.REACT_APP_API_BASE_URL}${item.image_url}`}
                        alt={item.name}
                        style={{ width: '100%', borderRadius: '4px' }}
                      />
                    )}
                  </Col>
                  <Col md={9}>
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h5>{item.name}</h5>
                        <p className="text-muted">
                          [{item.type === 'sensor' ? '센서 장치' : '제어 장치'}] {item.subtype}
                        </p>
                        <p className="mb-0">
                          <strong>{item.price?.toLocaleString()}원</strong>
                        </p>
                      </div>
                      <div className="d-flex align-items-center">
                        <Form.Control
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.store_id, e.target.value)}
                          style={{ width: '70px', marginRight: '10px' }}
                        />
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => removeFromCart(item.store_id)}
                        >
                          삭제
                        </Button>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          ))}
        </Col>
        <Col md={4}>
          <Card>
            <Card.Body>
              <h5 className="mb-3">주문 요약</h5>
              <div className="d-flex justify-content-between mb-2">
                <span>상품 수량:</span>
                <span>{cartItems.reduce((total, item) => total + item.quantity, 0)}개</span>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span>총 주문 금액:</span>
                <span className="h5 mb-0">{getTotalPrice().toLocaleString()}원</span>
              </div>
              <Button
                variant="success"
                className="w-100 mb-2"
                onClick={handleCheckout}
              >
                결제하기
              </Button>
              <Button
                variant="outline-danger"
                className="w-100"
                onClick={clearCart}
              >
                장바구니 비우기
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Cart; 