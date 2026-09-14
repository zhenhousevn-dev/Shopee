# AGENT.md — shopee-data-bridge

## Purpose

File này quy định cách Codex/ChatGPT/agent phải thao tác với repository `shopee-data-bridge`.

Mục tiêu là hoàn thành task bằng thay đổi nhỏ nhất, an toàn và có thể kiểm chứng.

---

## Mandatory Workflow

Trước khi code:

1. Đọc `SoT.md`.
2. Đọc `AGENT.md`.
3. Xác định chính xác Current Task.
4. Kiểm tra chỉ các file liên quan trực tiếp đến task.
5. Thực hiện thay đổi nhỏ nhất cần thiết.
6. Chạy test hoặc verification phù hợp.
7. Báo cáo kết quả.

Không audit toàn bộ repository nếu task không yêu cầu.

---

## Source of Truth

- `SoT.md` là nguồn sự thật chính về kiến trúc, schema, metric và trạng thái hệ thống.
- Current Task được cung cấp trực tiếp trong prompt/chat.
- Không ghi Current Task vào `SoT.md` trừ khi task tạo ra quyết định kiến trúc hoặc trạng thái dài hạn cần lưu lại.
- Nếu code hiện tại mâu thuẫn với SoT, phải báo rõ trước khi thay đổi kiến trúc.

---

## Change Policy

Ưu tiên:
- Sửa nhỏ nhất có thể.
- Giữ cấu trúc hiện tại nếu vẫn đáp ứng task.
- Tái sử dụng pattern đang có trong repo.
- Không refactor unrelated code.
- Không đổi tên file/module không cần thiết.
- Không thêm dependency nếu có thể giải quyết bằng dependency hiện tại hoặc standard library.
- Không tạo abstraction/framework dùng cho tương lai nếu chưa có nhu cầu thực tế.

Không tự ý thay đổi kiến trúc đã ghi trong SoT.

---

## Shopee API Rules

- Không tự bịa endpoint, field, permission hoặc metric.
- Nếu endpoint chưa được xác nhận, phải kiểm tra tài liệu hoặc response thực tế.
- Phân biệt rõ public-level API và shop-level API.
- Luôn kiểm tra signing rules tương ứng endpoint.
- Timestamp phải dùng đúng đơn vị theo Shopee API.
- Không hardcode access token hoặc refresh token.
- Không log token.
- Không coi Ads Sales là Net Revenue nếu chưa có mapping canonical.
- Phải xử lý pagination nếu endpoint có pagination.
- Phải xử lý token expiry nếu task liên quan shop-level API.

---

## Security Rules

Tuyệt đối không:
- Commit `.env`.
- Hardcode Partner Key.
- Hardcode Access Token.
- Hardcode Refresh Token.
- Hardcode `DATABASE_URL`.
- In secret ra console/log.
- Trả secret qua Analytics API.
- Cho ChatGPT/AI quyền write lên Shopee.

Secret chỉ được đọc từ environment variables hoặc secret storage phù hợp.

Nếu phát hiện secret trong source code:
1. Không lặp lại giá trị secret trong response.
2. Báo vị trí file.
3. Đề xuất chuyển sang environment variable.
4. Không tự xoay vòng credential nếu user chưa yêu cầu.

---

## Database Rules

- Neon PostgreSQL là database canonical.
- Không tạo bảng mới nếu task chưa cần.
- Mọi migration phải nhỏ, rõ ràng và có thể review.
- Không drop hoặc truncate bảng production nếu user không yêu cầu rõ ràng.
- Không thay đổi schema unrelated.
- Khi thêm field, giải thích purpose nếu không hiển nhiên.
- Không lưu secret vào bảng analytics hoặc endpoint public.

---

## Analytics API Rules

Analytics API dành cho ChatGPT phải:
- Chỉ hỗ trợ READ.
- Không có write action lên Shopee.
- Không trả credential.
- Chỉ trả dữ liệu cần thiết.
- Có filter/time range rõ ràng khi phù hợp.
- Dùng metric canonical từ SoT khi đã được định nghĩa.

Không thêm dashboard chỉ để phục vụ việc kiểm tra API.

---

## Testing Rules

Sau thay đổi:
- Chạy test liên quan trực tiếp.
- Nếu không có test suite, chạy verification nhỏ nhất phù hợp.
- Với API route, kiểm tra status code và response shape.
- Với database, kiểm tra migration/query thực tế nếu có môi trường phù hợp.
- Với Shopee request, kiểm tra signing/token flow nếu có thể mà không expose secret.

Không nói "đã test" nếu chưa thực sự chạy test.

Nếu không thể test đầy đủ, báo rõ:
- Đã test gì.
- Chưa test gì.
- Vì sao.

---

## Repository Inspection Rules

Không scan toàn bộ repo theo thói quen.

Chỉ mở:
- `SoT.md`
- `AGENT.md`
- File được user chỉ định
- File import trực tiếp bởi phần đang sửa
- Config cần thiết cho task
- Test liên quan

Mở rộng phạm vi chỉ khi có bằng chứng rằng dependency nằm ngoài phạm vi trên.

---

## Reporting Format

Sau mỗi task, báo ngắn gọn:

### Changed
- File nào đã thay đổi.
- Thay đổi chính là gì.

### Tested
- Command/test đã chạy.
- Kết quả.

### Remaining
- Vấn đề còn lại.
- Dependency hoặc quyền API chưa xác nhận.
- Bước tiếp theo nếu có.

Không tạo báo cáo dài nếu task nhỏ.

---

## Current Task Handling

Current Task không được ghi cố định trong file này.

Agent phải lấy Current Task từ prompt hiện tại.

Ví dụ:

```text
Current Task:
Implement Shopee OAuth callback and persist tokens to Neon.
```

Agent chỉ làm task đó, không tự mở rộng sang:
- order sync
- product sync
- cron
- dashboard
- analytics API

trừ khi task yêu cầu.

---

## Definition of Done

Một task được coi là hoàn thành khi:
- Thay đổi đúng scope.
- Không expose secret.
- Không phá kiến trúc trong SoT.
- Test/verification phù hợp đã chạy.
- Kết quả được báo rõ.
- Không còn lỗi known trực tiếp làm task thất bại.
