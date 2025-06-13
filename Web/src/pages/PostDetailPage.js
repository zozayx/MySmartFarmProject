import { useParams, useNavigate } from "react-router-dom"; // useHistory -> useNavigate로 변경
import { useState, useEffect } from "react";
import { Container, Card, Form, Button, ListGroup, Spinner } from "react-bootstrap";
import moment from "moment";
import "moment/locale/ko";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [user, setUser] = useState(null); // 로그인된 사용자 정보
  const [loading, setLoading] = useState(true); // 로딩 상태 추가
  
  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch(`${BASE_URL}/board/me`, {
        credentials: "include",
      });
      const data = await res.json();
      setUser(data.user); // 로그인된 사용자 정보
    };
  
    const fetchPostDetail = async () => {
      try {
        const res = await fetch(`${BASE_URL}/board/posts/${id}`, {
          credentials: "include",
        });
        const data = await res.json();
        setPost(data.post);
        setComments(data.comments || []);
      } catch (err) {
        console.error("게시글 불러오기 실패:", err);
      } finally {
        setLoading(false); // 로딩 완료
      }
    };
  
    fetchUser();
    fetchPostDetail();
  }, [id]);
  
  const handleAddComment = async () => {
    if (!comment.trim()) return;

    const newComment = {
      comment,
    };

    try {
      const res = await fetch(`${BASE_URL}/board/posts/${id}/comments`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newComment),
      });

      const result = await res.json();
      setComments([...comments, result.newComment]);
      setComment("");
    } catch (err) {
      console.error("댓글 등록 실패:", err);
    }
  };

  const handleDeletePost = async () => {
    const confirmDelete = window.confirm("정말로 게시글을 삭제하시겠습니까?");
    if (confirmDelete) {
      try {
        const res = await fetch(`${BASE_URL}/board/posts/${id}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (res.ok) {
          alert("게시글이 삭제되었습니다.");
          navigate("/board"); // 게시글 목록으로 리다이렉트
        } else {
          alert("게시글 삭제에 실패했습니다.");
        }
      } catch (err) {
        console.error("게시글 삭제 실패:", err);
      }
    }
  };

  const handleEditPost = () => {
    navigate(`/edit/post/${id}`); // 수정 페이지로 리다이렉트
  };

  const formatCommentTime = (time) => {
    const now = moment();
    const posted = moment(time);
    const diffMins = now.diff(posted, "minutes");
    const diffHours = now.diff(posted, "hours");

    if (diffMins < 1) return "방금 전";
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24 && now.isSame(posted, "day")) {
      return `오늘 ${posted.format("A h:mm")}`;
    }
    if (now.subtract(1, "day").isSame(posted, "day")) {
      return `어제 ${posted.format("A h:mm")}`;
    }
    return posted.format("YYYY.MM.DD HH:mm");
  };

  if (loading) {
    return (
      <Container className="py-5 d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <Spinner animation="border" variant="success" />
        <span className="ms-3">로딩 중...</span>
      </Container>
    );
  }

  if (!post) {
    return (
      <Container className="py-5">
        <h4 className="text-danger">❌ 게시글을 찾을 수 없습니다.</h4>
      </Container>
    );
  }

  const isAuthor = user && user.user_id === post.user_id; // 현재 사용자와 게시글 작성자가 동일한지 확인

  return (
    <Container fluid className="px-2 py-3">
      <Card className="mb-3 shadow-sm border-0" style={{ borderRadius: '12px' }}>
        <Card.Body className="p-3">
          <div className="d-flex justify-content-between align-items-start mb-2">
            <div>
              <h4 className="fw-bold text-dark mb-1" style={{ fontSize: '1.1rem' }}>{post.title}</h4>
              <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
                {post.nickname}
                {post.plant_type && (
                  <span className="ms-2 badge bg-light text-dark" style={{ fontSize: '0.75rem' }}>
                    {post.plant_type}
                  </span>
                )}
              </p>
            </div>
            <small className="text-muted" style={{ fontSize: '0.75rem' }}>
              {new Date(post.created_at).toLocaleDateString("ko-KR")}
            </small>
          </div>

          <div
            className="post-content mt-3"
            style={{ fontSize: '0.95rem', lineHeight: '1.6' }}
            dangerouslySetInnerHTML={{
              __html: post.content
                .replace(
                  /<img /g,
                  '<img style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;" '
                )
                .replace(
                  /\/uploads\//g,
                  `${BASE_URL}/uploads/`
                )
                .replace(/\n/g, "<br>")
            }}
          />

          {isAuthor && (
            <div className="d-flex gap-2 mt-3">
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={handleEditPost}
                className="flex-grow-1 py-2"
                style={{ fontSize: '0.9rem' }}
              >
                수정
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={handleDeletePost}
                className="flex-grow-1 py-2"
                style={{ fontSize: '0.9rem' }}
              >
                삭제
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      <Card className="mb-3 shadow-sm border-0" style={{ borderRadius: '12px' }}>
        <Card.Body className="p-3">
          <h5 className="fw-bold mb-3" style={{ fontSize: '1rem' }}>💬 댓글 {comments.length > 0 && <span className="text-muted" style={{ fontSize: '0.85rem' }}>({comments.length})</span>}</h5>
          
          {comments.length > 0 ? (
            <ListGroup variant="flush" className="mb-3">
              {comments.map((c, i) => (
                <ListGroup.Item 
                  key={i} 
                  className="px-0 py-2 border-bottom"
                  style={{ fontSize: '0.9rem' }}
                >
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <strong style={{ fontSize: '0.85rem' }}>{c.author}</strong>
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {formatCommentTime(c.commented_at)}
                    </small>
                  </div>
                  <p className="mb-0" style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
                    {c.comment}
                  </p>
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <p className="text-muted text-center py-3" style={{ fontSize: '0.9rem' }}>
              아직 댓글이 없습니다.
            </p>
          )}

          <Form className="mt-3">
            <Form.Group className="mb-2">
              <Form.Control
                as="textarea"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="댓글을 입력하세요"
                style={{ 
                  fontSize: '0.9rem',
                  borderRadius: '8px',
                  border: '1px solid #dee2e6'
                }}
              />
            </Form.Group>
            <div className="text-end">
              <Button 
                variant="success" 
                onClick={handleAddComment}
                className="px-4 py-2"
                style={{ 
                  fontSize: '0.9rem',
                  borderRadius: '8px'
                }}
              >
                댓글 등록
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {loading && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" 
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            zIndex: 1000
          }}
        >
          <div className="text-center">
            <Spinner animation="border" variant="success" size="sm" />
            <p className="mt-2 mb-0" style={{ fontSize: '0.9rem' }}>로딩 중...</p>
          </div>
        </div>
      )}
    </Container>
  );
}

export default PostDetailPage;
