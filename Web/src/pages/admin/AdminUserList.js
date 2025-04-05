// src/pages/admin/AdminUserList.js
import React from "react";
import { Table, Container } from "react-bootstrap";
import sampleUsers from "./sampleUserData";

function AdminUserList() {
  return (
    <Container className="py-5">
      <h3>👥 사용자 목록</h3>
      <Table striped bordered hover responsive className="mt-4">
        <thead>
          <tr>
            <th>#</th>
            <th>이름</th>
            <th>이메일</th>
            <th>지역</th>
            <th>연결된 장치</th>
          </tr>
        </thead>
        <tbody>
          {sampleUsers.map((user, idx) => (
            <tr key={user.id}>
              <td>{idx + 1}</td>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.location}</td>
              <td>
                {Object.entries(user.devices)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(", ")}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
}

export default AdminUserList;
