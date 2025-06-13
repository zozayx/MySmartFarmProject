import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Form,
  Button,
  Card,
  Row,
  Col,
  Alert,
  Spinner,
  Modal,
} from "react-bootstrap";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;
const KAKAO_MAP_KEY = process.env.REACT_APP_KAKAO_MAP_KEY;

function UserCreateFarm() {
  const [formData, setFormData] = useState({
    farmName: "",
    location: "",
    detailAddress: "",
    crop: "",
    farmSize: "",
    latitude: "",
    longitude: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // 지도 정리 함수
  const cleanupMap = useCallback(() => {
    if (marker) {
      marker.setMap(null);
      setMarker(null);
    }
    if (map) {
      // 지도 컨테이너 초기화
      const container = document.getElementById("map");
      if (container) {
        container.innerHTML = '';
      }
      setMap(null);
    }
  }, [map, marker]);

  useEffect(() => {
    // 카카오맵 스크립트가 이미 로드되어 있는지 확인
    if (window.kakao && window.kakao.maps) {
      setIsMapLoaded(true);
      return;
    }

    // 스크립트 로드
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_KEY}&libraries=services&autoload=false`;
    script.async = true;

    script.onload = () => {
      // 카카오맵 초기화
      window.kakao.maps.load(() => {
        setIsMapLoaded(true);
      });
    };

    script.onerror = (error) => {
      console.error("카카오맵 스크립트 로드 실패:", error);
      setErrorMessage("지도를 불러오는데 실패했습니다. API 키를 확인해주세요.");
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // 모달이 닫힐 때 지도 정리
  useEffect(() => {
    if (!showMap) {
      cleanupMap();
    }
  }, [showMap, cleanupMap]);

  const initMap = useCallback(() => {
    if (!window.kakao || !window.kakao.maps) {
      setErrorMessage("카카오맵이 로드되지 않았습니다. 페이지를 새로고침해주세요.");
      return;
    }

    try {
      const container = document.getElementById("map");
      if (!container) return;

      // 컨테이너가 비어있는지 확인
      if (container.innerHTML) {
        container.innerHTML = '';
      }

      const options = {
        center: new window.kakao.maps.LatLng(37.5665, 126.9780),
        level: 3,
      };

      const newMap = new window.kakao.maps.Map(container, options);
      setMap(newMap);

      // 마커 이미지 설정
      const markerImage = new window.kakao.maps.MarkerImage(
        "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
        new window.kakao.maps.Size(24, 35)
      );

      window.kakao.maps.event.addListener(newMap, "click", function (mouseEvent) {
        const latlng = mouseEvent.latLng;
        
        // 이전 마커 제거
        if (marker) {
          marker.setMap(null);
        }

        // 새 마커 생성
        const newMarker = new window.kakao.maps.Marker({
          position: latlng,
          image: markerImage,
          title: "선택한 위치"
        });
        newMarker.setMap(newMap);
        setMarker(newMarker);

        // 인포윈도우 생성
        const infowindow = new window.kakao.maps.InfoWindow({
          content: `
            <div style="
              padding: 12px;
              min-width: 200px;
              border-radius: 8px;
              background: white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              font-family: 'Noto Sans KR', sans-serif;
            ">
              <div style="
                display: flex;
                align-items: center;
                margin-bottom: 8px;
              ">
                <span style="
                  background: #28a745;
                  color: white;
                  padding: 4px 8px;
                  border-radius: 4px;
                  font-size: 12px;
                  margin-right: 8px;
                ">📍 선택한 위치</span>
              </div>
              <div style="
                font-size: 13px;
                color: #666;
                line-height: 1.4;
              ">
                <div style="margin-bottom: 4px;">위도: ${latlng.getLat().toFixed(6)}</div>
                <div>경도: ${latlng.getLng().toFixed(6)}</div>
              </div>
            </div>
          `,
          removable: true,
          zIndex: 1
        });
        infowindow.open(newMap, newMarker);

        // 주소 검색
        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.coord2Address(latlng.getLng(), latlng.getLat(), function (result, status) {
          if (status === window.kakao.maps.services.Status.OK) {
            const address = result[0].address;
            setFormData(prev => ({
              ...prev,
              location: address.address_name,
              latitude: latlng.getLat(),
              longitude: latlng.getLng()
            }));

            // 주소 정보로 인포윈도우 업데이트
            infowindow.setContent(`
              <div style="
                padding: 12px;
                min-width: 200px;
                border-radius: 8px;
                background: white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                font-family: 'Noto Sans KR', sans-serif;
              ">
                <div style="
                  display: flex;
                  align-items: center;
                  margin-bottom: 8px;
                ">
                  <span style="
                    background: #28a745;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    margin-right: 8px;
                  ">📍 선택한 위치</span>
                </div>
                <div style="
                  font-size: 13px;
                  color: #666;
                  line-height: 1.4;
                ">
                  <div style="margin-bottom: 4px;">${address.address_name}</div>
                </div>
              </div>
            `);
          }
        });
      });
    } catch (error) {
      console.error("지도 초기화 실패:", error);
      setErrorMessage("지도를 초기화하는데 실패했습니다. API 키를 확인해주세요.");
    }
  }, [marker]);

  useEffect(() => {
    if (showMap && isMapLoaded && !map) {
      // 모달이 열린 후 약간의 지연을 주고 지도 초기화
      setTimeout(() => {
        initMap();
      }, 100);
    }
  }, [showMap, isMapLoaded, map, initMap]);

  const handleSearch = () => {
    if (!searchKeyword || !map) return;

    try {
      const places = new window.kakao.maps.services.Places();
      places.keywordSearch(searchKeyword, function (results, status) {
        if (status === window.kakao.maps.services.Status.OK) {
          const bounds = new window.kakao.maps.LatLngBounds();
          
          results.forEach(result => {
            bounds.extend(new window.kakao.maps.LatLng(result.y, result.x));
          });

          map.setBounds(bounds);
          
          if (results.length > 0) {
            const firstResult = results[0];
            const latlng = new window.kakao.maps.LatLng(firstResult.y, firstResult.x);
            
            // 이전 마커 제거
            if (marker) {
              marker.setMap(null);
            }

            // 마커 이미지 설정
            const markerImage = new window.kakao.maps.MarkerImage(
              "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
              new window.kakao.maps.Size(24, 35)
            );

            // 새 마커 생성
            const newMarker = new window.kakao.maps.Marker({
              position: latlng,
              image: markerImage,
              title: firstResult.place_name
            });
            newMarker.setMap(map);
            setMarker(newMarker);

            // 인포윈도우 생성
            const infowindow = new window.kakao.maps.InfoWindow({
              content: `
                <div style="
                  padding: 12px;
                  min-width: 200px;
                  border-radius: 8px;
                  background: white;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                  font-family: 'Noto Sans KR', sans-serif;
                ">
                  <div style="
                    display: flex;
                    align-items: center;
                    margin-bottom: 8px;
                  ">
                    <span style="
                      background: #28a745;
                      color: white;
                      padding: 4px 8px;
                      border-radius: 4px;
                      font-size: 12px;
                      margin-right: 8px;
                    ">🔍 검색 결과</span>
                  </div>
                  <div style="
                    font-size: 13px;
                    color: #666;
                    line-height: 1.4;
                  ">
                    <div style="margin-bottom: 4px;">${firstResult.place_name}</div>
                    <div style="color: #999;">${firstResult.address_name}</div>
                  </div>
                </div>
              `,
              removable: true,
              zIndex: 1
            });
            infowindow.open(map, newMarker);

            const geocoder = new window.kakao.maps.services.Geocoder();
            geocoder.coord2Address(latlng.getLng(), latlng.getLat(), function (result, status) {
              if (status === window.kakao.maps.services.Status.OK) {
                const address = result[0].address;
                setFormData(prev => ({
                  ...prev,
                  location: address.address_name,
                  latitude: latlng.getLat(),
                  longitude: latlng.getLng()
                }));
              }
            });
          }
        }
      });
    } catch (error) {
      console.error("장소 검색 실패:", error);
      setErrorMessage("장소 검색에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${BASE_URL}/user/createfarm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        alert("농장이 성공적으로 추가되었습니다!");
        setFormData({
          farmName: "",
          location: "",
          detailAddress: "",
          crop: "",
          farmSize: "",
          latitude: "",
          longitude: "",
        });
      } else {
        throw new Error(data.message || "농장 추가에 실패했습니다.");
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" variant="success" />
        <p className="mt-3" style={{ color: "#5a9a5a" }}>🌱 농장을 추가하는 중입니다...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4 px-3">
      <h2 className="mb-4 text-center text-success" style={{ fontSize: "1.75rem" }}>🌱 내 농장 추가</h2>

      {errorMessage && (
        <Alert variant="danger" className="text-center mb-3">
          {errorMessage}
        </Alert>
      )}

      <Card className="p-3 p-md-4 shadow-sm">
        <Form onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label className="fw-bold">📌 농장 이름</Form.Label>
                <Form.Control
                  type="text"
                  name="farmName"
                  value={formData.farmName}
                  onChange={handleChange}
                  placeholder="농장 이름을 입력하세요"
                  required
                  className="py-2"
                />
              </Form.Group>
            </Col>
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label className="fw-bold">📍 위치</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Control
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="지도에서 위치를 선택하세요"
                    required
                    className="py-2"
                    readOnly
                  />
                  <Button
                    variant="outline-success"
                    onClick={() => setShowMap(true)}
                    className="py-2"
                  >
                    지도에서 선택
                  </Button>
                </div>
              </Form.Group>
            </Col>
          </Row>

          <Row className="g-3 mt-2">
            <Col xs={12}>
              <Form.Group>
                <Form.Label className="fw-bold">🏠 상세 주소</Form.Label>
                <Form.Control
                  type="text"
                  name="detailAddress"
                  value={formData.detailAddress}
                  onChange={handleChange}
                  placeholder="상세 주소를 직접 입력하세요"
                  className="py-2"
                />
                <Form.Text className="text-muted">
                  지도에서 선택한 위치의 상세 주소를 입력해주세요.
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <Row className="g-3 mt-2">
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label className="fw-bold">🌿 키울 작물</Form.Label>
                <Form.Control
                  type="text"
                  name="crop"
                  value={formData.crop}
                  onChange={handleChange}
                  placeholder="키울 작물을 입력하세요"
                  required
                  className="py-2"
                />
              </Form.Group>
            </Col>
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label className="fw-bold">📏 농장 크기 (m²)</Form.Label>
                <Form.Control
                  type="number"
                  name="farmSize"
                  value={formData.farmSize}
                  onChange={handleChange}
                  placeholder="농장 크기를 입력하세요"
                  required
                  className="py-2"
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="text-center mt-4">
            <Button
              variant="success"
              type="submit"
              disabled={loading}
              size="lg"
              className="w-100 w-md-auto px-5 py-2"
            >
              {loading ? <Spinner animation="border" size="sm" /> : "농장 추가하기"}
            </Button>
          </div>
        </Form>
      </Card>

      <Modal
        show={showMap}
        onHide={() => {
          setShowMap(false);
          setSearchKeyword(""); // 검색어 초기화
        }}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>농장 위치 선택</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!isMapLoaded ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="success" />
              <p className="mt-3">지도를 불러오는 중입니다...</p>
            </div>
          ) : (
            <>
              <div className="mb-3">
                <div className="d-flex gap-2">
                  <Form.Control
                    type="text"
                    placeholder="주소 또는 장소를 검색하세요"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button variant="success" onClick={handleSearch}>
                    검색
                  </Button>
                </div>
              </div>
              <div id="map" style={{ width: "100%", height: "500px" }}></div>
              <div className="mt-3">
                <p className="text-muted mb-1">선택된 위치: {formData.location}</p>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowMap(false)}>
            닫기
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default UserCreateFarm;
