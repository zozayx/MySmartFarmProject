import { createContext, useContext, useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const PopupContext = createContext();

export function usePopup() {
  return useContext(PopupContext);
}

export function PopupProvider({ children }) {
  const [popupData, setPopupData] = useState({
    title: "",
    message: "",
    redirectPath: "",
    buttonText: "",
    cancelButtonText: "",
    confirmVariant: "primary",  // ✅ 확인 버튼 색상
    cancelVariant: "secondary", // ✅ 취소 버튼 색상
    onConfirm: null,
    onCancel: null,
    show: false,
  });

  const navigate = useNavigate();

  const showPopup = ({
    title,
    message,
    redirectPath = "",
    buttonText = "확인",
    cancelButtonText = "",
    confirmVariant = "primary",   // ✅ 기본값은 파랑
    cancelVariant = "secondary", // ✅ 기본값은 회색
    onConfirm,
    onCancel,
  }) => {
    setPopupData({
      title,
      message,
      redirectPath,
      buttonText,
      cancelButtonText,
      confirmVariant,
      cancelVariant,
      onConfirm,
      onCancel,
      show: true,
    });
  };

  const handleClose = () => {
    setPopupData((prev) => ({ ...prev, show: false }));
  };

  const handleConfirm = () => {
    handleClose();
    if (popupData.onConfirm) popupData.onConfirm();
    if (popupData.redirectPath) navigate(popupData.redirectPath);
  };

  const handleCancel = () => {
    handleClose();
    if (popupData.onCancel) popupData.onCancel();
  };

  return (
    <PopupContext.Provider value={{ showPopup }}>
      {children}

      <Modal
        show={popupData.show}
        onHide={handleClose}
        centered
        backdrop="static"
        keyboard={false}
        size="sm"
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title className="fw-bold fs-5">{popupData.title}</Modal.Title>
        </Modal.Header>

        <Modal.Body className="text-center px-4 py-3">
          <p className="fs-6 mb-0">{popupData.message}</p>
        </Modal.Body>

        <Modal.Footer className="justify-content-center pb-3">
          {/* ✅ 확인 버튼이 왼쪽 */}
          <Button
            variant={popupData.confirmVariant}
            size="md"
            className="px-4 me-2"
            onClick={handleConfirm}
          >
            {popupData.buttonText || "확인"}
          </Button>

          {/* ✅ 취소 버튼이 오른쪽 */}
          {popupData.cancelButtonText && (
            <Button
              variant={popupData.cancelVariant}
              size="md"
              className="px-4"
              onClick={handleCancel}
            >
              {popupData.cancelButtonText}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </PopupContext.Provider>
  );
}
