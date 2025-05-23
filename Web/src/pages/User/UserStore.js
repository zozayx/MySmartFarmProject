import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, ListGroup, Spinner, Alert, Form } from 'react-bootstrap';
import { useCart } from '../../context/CartContext';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const categories = [
  { label: '전체', value: 'all' },
  { label: '센서 장치', value: 'sensor' },
  { label: '제어 장치', value: 'actuator' },
];

const sensorSubtypes = [
  '온도', '습도', '조도', '토양수분', '토양온도', '이산화탄소', 'ph', 'ec', '풍속', '풍향', '강우', '수위', '미세먼지', '공기질',
];

const actuatorSubtypes = [
  '모터', '펌프', '밸브', '급수장치', '조명', '환풍기', '히터', '냉방기', '커튼', '영양분공급기', 'co2발생기', '스프링클러', '자동문',
];

const typeToKorean = (type) => {
  if (type === 'sensor') return '센서 장치';
  if (type === 'actuator') return '제어 장치';
  return type;
};

const subtypeToKorean = (subtype) => {
  const map = {
    '온도': '온도 센서',
    '습도': '습도 센서',
    '조도': '조도 센서',
    '토양수분': '토양 수분 센서',
    '토양온도': '토양 온도 센서',
    '이산화탄소': 'CO₂ 센서',
    'ph': 'pH 센서',
    'ec': 'EC 센서',
    '풍속': '풍속 센서',
    '풍향': '풍향 센서',
    '강우': '강우 센서',
    '수위': '수위 센서',
    '미세먼지': '미세먼지 센서',
    '공기질': '공기질 센서',

    '릴레이': '릴레이 모듈',
    '모터': '모터 컨트롤러',
    '펌프': '펌프 제어기',
    '밸브': '밸브 제어기',
    '환풍기': '환풍기 컨트롤러',
    '히터': '히터 컨트롤러',
    '냉방기': '냉방기 컨트롤러',
    '영양분공급기': '영양분 공급기',
    '스프링클러': '스프링클러',
  };
  return map[subtype] || subtype;
};

const UserStore = () => {
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubtype, setSelectedSubtype] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${BASE_URL}/store`, { credentials: 'include' });
        if (!response.ok) throw new Error('서버에서 데이터를 불러오지 못했습니다.');
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  // 필터링된 제품
  let filteredProducts = products;

  if (selectedCategory !== 'all') {
    filteredProducts = filteredProducts.filter(p => p.type === selectedCategory);
  }

  if (selectedSubtype) {
    filteredProducts = filteredProducts.filter(p => p.subtype === selectedSubtype);
  }

  if (searchTerm.trim() !== '') {
    const lower = searchTerm.toLowerCase();
    filteredProducts = filteredProducts.filter(p =>
      p.name.toLowerCase().includes(lower) ||
      p.subtype.toLowerCase().includes(lower)
    );
  }

  const handleCategoryClick = (cat) => {
    setSelectedCategory(cat);
    setSelectedSubtype(null);
  };

  const handleSubtypeClick = (sub) => {
    setSelectedSubtype(sub);
  };

  const handleCardClick = async (product) => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/store/${product.store_id}`, { credentials: 'include' });
      if (!response.ok) throw new Error('상세 상품 정보를 불러오지 못했습니다.');
      const detailData = await response.json();
      setSelectedProduct(detailData);
      setShowModal(true);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };


  const handleClose = () => {
    setShowModal(false);
    setSelectedProduct(null);
    setError(null);
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    setShowModal(false);
    alert('장바구니에 추가되었습니다.');
  };

  const activeStyle = (isActive) => ({
    cursor: 'pointer',
    fontWeight: isActive ? '600' : '400',
    backgroundColor: isActive ? 'var(--bs-success)' : undefined,
    color: isActive ? 'white' : undefined,
    borderColor: isActive ? 'var(--bs-success)' : undefined,
  });

  return (
    <Container className="mt-4 mb-5">
      <h1 className="mb-4">스마트팜 상점</h1>
      <Row>
        {/* 왼쪽 사이드바 */}
        <Col
          md={3}
          className="border-end"
          style={{
            minHeight: window.innerWidth >= 768 ? '80vh' : 'auto',  // 화면 너비가 md(768px) 이상일 때만 높이 고정
          }}
        >
          {/* 검색창 */}
          <Form.Control
            type="search"
            placeholder="상품명 또는 세부 분류 검색"
            className="mb-3"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* 카테고리 */}
          <ListGroup>
            {categories.map(cat => (
              <ListGroup.Item
                key={cat.value}
                style={activeStyle(selectedCategory === cat.value)}
                onClick={() => handleCategoryClick(cat.value)}
              >
                {cat.label}
              </ListGroup.Item>
            ))}
          </ListGroup>

          {/* 선택된 카테고리의 서브타입 목록 */}
          {selectedCategory === 'sensor' && (
            <>
              <hr />
              <div style={{ fontWeight: '600', marginBottom: 8 }}>센서 종류</div>
              <ListGroup>
                {sensorSubtypes.map(sub => (
                  <ListGroup.Item
                    key={sub}
                    style={activeStyle(selectedSubtype === sub)}
                    onClick={() => handleSubtypeClick(sub)}
                  >
                    {subtypeToKorean(sub)}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </>
          )}

          {selectedCategory === 'actuator' && (
            <>
              <hr />
              <div style={{ fontWeight: '600', marginBottom: 8 }}>제어 장치 종류</div>
              <ListGroup>
                {actuatorSubtypes.map(sub => (
                  <ListGroup.Item
                    key={sub}
                    style={activeStyle(selectedSubtype === sub)}
                    onClick={() => handleSubtypeClick(sub)}
                  >
                    {subtypeToKorean(sub)}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </>
          )}
        </Col>

        {/* 상품 리스트 */}
        <Col md={9}>
          {loading ? (
            <div className="d-flex justify-content-center align-items-center" style={{ height: 200 }}>
              <Spinner animation="border" />
            </div>
          ) : error ? (
            <Alert variant="danger">{error}</Alert>
          ) : (
            <Row>
              {filteredProducts.length === 0 ? (
                <Col>
                  <Alert variant="info">조건에 맞는 상품이 없습니다.</Alert>
                </Col>
              ) : (
                filteredProducts.map(product => (
                  <Col key={product.store_id} md={4} className="mb-4">
                    <Card onClick={() => handleCardClick(product)} style={{ cursor: 'pointer' }}>
                        {product.image_url && (
                            <Card.Img
                            variant="top"
                            src={`${BASE_URL}${product.image_url}`}
                            alt={product.name}
                            style={{ height: 180, objectFit: 'cover' }}
                            />
                        )}
                        <Card.Body>
                            <Card.Title>{product.name}</Card.Title>
                            <Card.Text style={{ color: '#888', fontSize: '0.95em' }}>
                            [{typeToKorean(product.type)}] {subtypeToKorean(product.subtype)}
                            {product.type === 'sensor' && product.unit && (
                                <span style={{ marginLeft: 6, color: '#4a90e2' }}>({product.unit})</span>
                            )}
                            </Card.Text>
                            {product.size && (
                            <Card.Text style={{ fontSize: '0.85em', color: '#555' }}>
                                크기: {product.size}
                            </Card.Text>
                            )}
                            <Card.Text>
                            <strong>{product.price?.toLocaleString()}원</strong>
                            </Card.Text>
                        </Card.Body>
                        </Card>
                  </Col>
                ))
              )}
            </Row>
          )}
        </Col>
      </Row>

      {/* 상세 모달 */}
      <Modal show={showModal} onHide={handleClose} centered>
        {selectedProduct && (
          <>
            <Modal.Header closeButton>
              <Modal.Title>
                {selectedProduct.name}
                <div style={{ fontSize: '0.95rem', color: '#888', marginTop: '0.3rem' }}>
                  [{typeToKorean(selectedProduct.type)}] {subtypeToKorean(selectedProduct.subtype)}
                  {selectedProduct.type === 'sensor' && selectedProduct.unit && (
                    <span style={{ marginLeft: 6, color: '#4a90e2' }}>({selectedProduct.unit})</span>
                  )}
                </div>
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selectedProduct.image_url && (
                <img
                  src={`${BASE_URL}${selectedProduct.image_url}`}
                  alt={selectedProduct.name}
                  style={{ width: '100%', marginBottom: '1rem', borderRadius: 8 }}
                />
              )}
              <p style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                {selectedProduct.description}
              </p>
              <hr />
              <p><strong>가격:</strong> {selectedProduct.price?.toLocaleString()}원</p>
              <p><strong>통신 방식:</strong> {selectedProduct.communication}</p>
              <p><strong>상세 정보:</strong> {selectedProduct.details}</p>
              {selectedProduct.type === 'sensor' && (
              <>
                <p><strong>측정 가능 범위:</strong> {selectedProduct.measurement_range || '정보 없음'}</p>
                <p><strong>정확도:</strong> {selectedProduct.accuracy || '정보 없음'}</p>
                <p><strong>단위:</strong> {selectedProduct.unit || '정보 없음'}</p>
                </>
              )}
              <p><strong>재고:</strong> {selectedProduct.stock}개</p>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="success" onClick={() => handleAddToCart(selectedProduct)}>
                장바구니 담기
              </Button>
              <Button variant="secondary" onClick={handleClose}>닫기</Button>
            </Modal.Footer>
          </>
        )}
      </Modal>
    </Container>
  );
};

export default UserStore;
