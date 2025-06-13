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
  '온도', '습도', '토양 수분', '조도', '토양온도', '이산화탄소', 'ph', 'ec', '풍속', '풍향', '강우', '수위', '미세먼지', '공기질',
];

const actuatorSubtypes = [
  '릴레이', '모터', '펌프','밸브', '급수장치', '조명', '환풍기', '히터', '냉방기', '커튼', '영양분공급기', 'co2발생기', '스프링클러', '자동문',
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
    '토양 수분': '토양 수분 센서',
    '조도': '조도 센서',
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

  // 카테고리와 서브타입으로 정렬
  filteredProducts.sort((a, b) => {
    // 먼저 카테고리로 정렬
    if (a.type !== b.type) {
      const typeOrder = { 'sensor': 0, 'actuator': 1 };
      return typeOrder[a.type] - typeOrder[b.type];
    }
    
    // 같은 카테고리 내에서는 서브타입으로 정렬
    const subtypeOrder = {
      'sensor': sensorSubtypes,
      'actuator': actuatorSubtypes
    };
    const order = subtypeOrder[a.type];
    return order.indexOf(a.subtype) - order.indexOf(b.subtype);
  });

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
    <Container fluid className="px-2 py-3">
      <h1 className="mb-3 fs-4 text-center">ACG 스마트팜 상점</h1>
      <Row className="g-3">
        {/* 왼쪽 사이드바 */}
        <Col
          xs={12}
          md={3}
          className="border-end pe-0 pe-md-3"
          style={{
            minHeight: 'auto',
            borderRight: window.innerWidth >= 768 ? '1px solid #dee2e6' : 'none',
            borderBottom: window.innerWidth < 768 ? '1px solid #dee2e6' : 'none',
            paddingBottom: window.innerWidth < 768 ? '1rem' : '0'
          }}
        >
          {/* 검색창 */}
          <Form.Control
            type="search"
            placeholder="상품명 또는 세부 분류 검색"
            className="mb-3 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ fontSize: '0.9rem' }}
          />

          {/* 카테고리 */}
          <div className="d-flex overflow-auto mb-2" style={{ 
            WebkitOverflowScrolling: 'touch',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none'
          }}>
            {categories.map(cat => (
              <Button
                key={cat.value}
                variant={selectedCategory === cat.value ? 'success' : 'outline-secondary'}
                size="sm"
                className="me-2 flex-shrink-0"
                onClick={() => handleCategoryClick(cat.value)}
                style={{ 
                  fontSize: '0.85rem',
                  whiteSpace: 'nowrap',
                  borderRadius: '20px'
                }}
              >
                {cat.label}
              </Button>
            ))}
          </div>

          {/* 선택된 카테고리의 서브타입 목록 */}
          {selectedCategory === 'sensor' && (
            <>
              <div className="fw-bold mb-2 fs-6">센서 종류</div>
              <div className="d-flex flex-wrap gap-1 mb-3">
                {sensorSubtypes.map(sub => (
                  <Button
                    key={sub}
                    variant={selectedSubtype === sub ? 'success' : 'outline-secondary'}
                    size="sm"
                    className="flex-shrink-0"
                    onClick={() => handleSubtypeClick(sub)}
                    style={{ 
                      fontSize: '0.8rem',
                      whiteSpace: 'nowrap',
                      borderRadius: '15px'
                    }}
                  >
                    {subtypeToKorean(sub)}
                  </Button>
                ))}
              </div>
            </>
          )}

          {selectedCategory === 'actuator' && (
            <>
              <div className="fw-bold mb-2 fs-6">제어 장치 종류</div>
              <div className="d-flex flex-wrap gap-1 mb-3">
                {actuatorSubtypes.map(sub => (
                  <Button
                    key={sub}
                    variant={selectedSubtype === sub ? 'success' : 'outline-secondary'}
                    size="sm"
                    className="flex-shrink-0"
                    onClick={() => handleSubtypeClick(sub)}
                    style={{ 
                      fontSize: '0.8rem',
                      whiteSpace: 'nowrap',
                      borderRadius: '15px'
                    }}
                  >
                    {subtypeToKorean(sub)}
                  </Button>
                ))}
              </div>
            </>
          )}
        </Col>

        {/* 상품 리스트 */}
        <Col xs={12} md={9}>
          {loading ? (
            <div className="d-flex justify-content-center align-items-center" style={{ height: 150 }}>
              <Spinner animation="border" size="sm" />
            </div>
          ) : error ? (
            <Alert variant="danger" className="py-2" style={{ fontSize: '0.9rem' }}>{error}</Alert>
          ) : (
            <Row className="g-3">
              {filteredProducts.length === 0 ? (
                <Col>
                  <Alert variant="info" className="py-2" style={{ fontSize: '0.9rem' }}>조건에 맞는 상품이 없습니다.</Alert>
                </Col>
              ) : (
                filteredProducts.map(product => (
                  <Col key={product.store_id} xs={6} md={4} lg={3}>
                    <Card 
                      onClick={() => handleCardClick(product)} 
                      className="h-100 shadow-sm"
                      style={{ 
                        cursor: 'pointer',
                        borderRadius: '12px',
                        border: 'none'
                      }}
                    >
                      {product.image_url && (
                        <Card.Img
                          variant="top"
                          src={`${BASE_URL}${product.image_url}`}
                          alt={product.name}
                          style={{ 
                            height: 150,
                            objectFit: 'cover',
                            objectPosition: 'center',
                            borderTopLeftRadius: '12px',
                            borderTopRightRadius: '12px'
                          }}
                        />
                      )}
                      <Card.Body className="p-3">
                        <Card.Title className="fs-6 mb-1" style={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          lineHeight: '1.2',
                          height: '2.4em'
                        }}>
                          {product.name}
                        </Card.Title>
                        <Card.Text style={{ 
                          color: '#888', 
                          fontSize: '0.8rem',
                          marginBottom: '0.5rem'
                        }}>
                          [{typeToKorean(product.type)}] {subtypeToKorean(product.subtype)}
                          {product.type === 'sensor' && product.unit && (
                            <span style={{ marginLeft: 4, color: '#4a90e2' }}>({product.unit})</span>
                          )}
                        </Card.Text>
                        {product.size && (
                          <Card.Text style={{ fontSize: '0.75rem', color: '#555', marginBottom: '0.5rem' }}>
                            크기: {product.size}
                          </Card.Text>
                        )}
                        <Card.Text className="mb-0">
                          <strong style={{ fontSize: '0.95rem' }}>{product.price?.toLocaleString()}원</strong>
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
      <Modal show={showModal} onHide={handleClose} centered size="lg">
        {selectedProduct && (
          <>
            <Modal.Header closeButton className="border-0 pb-0">
              <Modal.Title className="w-100">
                <div className="fs-5 fw-bold mb-1">{selectedProduct.name}</div>
                <div style={{ fontSize: '0.85rem', color: '#888' }}>
                  [{typeToKorean(selectedProduct.type)}] {subtypeToKorean(selectedProduct.subtype)}
                  {selectedProduct.type === 'sensor' && selectedProduct.unit && (
                    <span style={{ marginLeft: 4, color: '#4a90e2' }}>({selectedProduct.unit})</span>
                  )}
                </div>
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-3">
              {selectedProduct.image_url && (
                <img
                  src={`${BASE_URL}${selectedProduct.image_url}`}
                  alt={selectedProduct.name}
                  style={{ 
                    width: '100%', 
                    height: 'auto',
                    maxHeight: '300px',
                    objectFit: 'contain',
                    marginBottom: '1rem', 
                    borderRadius: '12px' 
                  }}
                />
              )}
              <div className="mb-3">
                <p style={{ 
                  fontSize: '0.95rem', 
                  lineHeight: '1.5',
                  marginBottom: '0.5rem' 
                }}>
                  {selectedProduct.description}
                </p>
              </div>
              <hr className="my-3" />
              <div className="row g-3">
                <div className="col-6">
                  <p className="mb-2" style={{ fontSize: '0.9rem' }}>
                    <strong>가격:</strong><br />
                    <span style={{ color: '#2c3e50' }}>{selectedProduct.price?.toLocaleString()}원</span>
                  </p>
                </div>
                <div className="col-6">
                  <p className="mb-2" style={{ fontSize: '0.9rem' }}>
                    <strong>통신 방식:</strong><br />
                    <span style={{ color: '#2c3e50' }}>{selectedProduct.communication}</span>
                  </p>
                </div>
                <div className="col-12">
                  <p className="mb-2" style={{ fontSize: '0.9rem' }}>
                    <strong>상세 정보:</strong><br />
                    <span style={{ color: '#2c3e50' }}>{selectedProduct.details}</span>
                  </p>
                </div>
                {selectedProduct.type === 'sensor' && (
                  <>
                    <div className="col-6">
                      <p className="mb-2" style={{ fontSize: '0.9rem' }}>
                        <strong>측정 범위:</strong><br />
                        <span style={{ color: '#2c3e50' }}>{selectedProduct.measurement_range || '정보 없음'}</span>
                      </p>
                    </div>
                    <div className="col-6">
                      <p className="mb-2" style={{ fontSize: '0.9rem' }}>
                        <strong>정확도:</strong><br />
                        <span style={{ color: '#2c3e50' }}>{selectedProduct.accuracy || '정보 없음'}</span>
                      </p>
                    </div>
                    <div className="col-6">
                      <p className="mb-2" style={{ fontSize: '0.9rem' }}>
                        <strong>단위:</strong><br />
                        <span style={{ color: '#2c3e50' }}>{selectedProduct.unit || '정보 없음'}</span>
                      </p>
                    </div>
                  </>
                )}
                <div className="col-6">
                  <p className="mb-2" style={{ fontSize: '0.9rem' }}>
                    <strong>재고:</strong><br />
                    <span style={{ color: '#2c3e50' }}>{selectedProduct.stock}개</span>
                  </p>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer className="border-0 pt-0">
              <Button 
                variant="success" 
                onClick={() => handleAddToCart(selectedProduct)}
                className="w-100 py-2"
                style={{ fontSize: '0.95rem' }}
              >
                장바구니 담기
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>
    </Container>
  );
};

export default UserStore;
