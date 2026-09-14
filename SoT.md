# SoT.md — shopee-data-bridge

## 1. Project Goal

Xây dựng cầu nối dữ liệu an toàn, đơn giản và dễ bảo trì:

**Shopee Open Platform → Vercel → Neon PostgreSQL → Read-only Analytics API → ChatGPT**

Mục tiêu chính:
- Đồng bộ dữ liệu cần thiết từ gian hàng Shopee về Neon.
- Chuẩn hóa dữ liệu để phục vụ phân tích kinh doanh.
- Cho phép ChatGPT đọc dữ liệu qua API chỉ-đọc.
- Không cho AI quyền thay đổi giá, sản phẩm, tồn kho, đơn hàng hoặc cấu hình Shopee.

Không xây dashboard hoặc tính năng không cần thiết ở giai đoạn hiện tại.

---

## 2. Business Scope

### Shop scope
- Chủ sở hữu hiện có 2 shop Shopee và có thể có thêm shop trong tương lai.
- Giai đoạn hiện tại chỉ triển khai và vận hành cho **1 shop**.
- Kiến trúc không được hardcode theo hướng chỉ có duy nhất 1 shop.
- Schema chính nên giữ `shop_id` làm khóa/phân vùng phù hợp để có thể mở rộng nhiều shop sau này mà không phải thiết kế lại toàn bộ.

### Analysis priorities
Ưu tiên phân tích theo thứ tự:

1. Doanh thu và lợi nhuận.
2. Hiệu quả SKU / sản phẩm.
3. Ads / ROAS.
4. Vận hành đơn hàng.
5. Các lát cắt và chỉ số bổ sung, ví dụ:
   - thời gian đặt hàng;
   - ngày/giờ phát sinh đơn;
   - tỷ lệ sử dụng voucher;
   - vùng miền;
   - địa lý đơn hàng;
   - hành vi theo SKU;
   - tỷ lệ hủy / hoàn / trả hàng;
   - phí;
   - khuyến mãi;
   - các metric khác khi Shopee API cho phép và có giá trị phân tích.

Không giới hạn hệ thống chỉ ở các metric canonical ban đầu.

---

## 3. Source of Truth

File này là nguồn sự thật chính của hệ thống.

Chỉ ghi vào đây:
- Kiến trúc đã chốt.
- Quyết định kỹ thuật dài hạn.
- Schema và metric canonical.
- Trạng thái triển khai thực tế.
- Giới hạn hệ thống đã xác nhận.

Không ghi:
- Task ngắn hạn.
- Lỗi tạm thời đang debug.
- Prompt của một lần làm việc.
- Secret hoặc credential.

---

## 4. Current Architecture

```text
Shopee Open Platform
        ↓
Vercel
- OAuth callback
- Token refresh
- Shopee API client
- Sync jobs
- Read-only Analytics API
        ↓
Neon PostgreSQL
        ↓
ChatGPT
```

Nguyên tắc:
- Ưu tiên ít thành phần.
- Không thêm queue, worker riêng, framework nội bộ hoặc abstraction nếu chưa có nhu cầu thực tế.
- Vercel là backend/application layer hiện tại.
- Neon PostgreSQL là nơi lưu dữ liệu canonical.
- ChatGPT chỉ đọc dữ liệu qua API read-only.
- Hệ thống hiện phục vụ 1 shop nhưng không được thiết kế theo cách ngăn cản mở rộng multi-shop.

---

## 5. Data Retention Strategy

Mặc định lưu:
- Dữ liệu giao dịch cần thiết ở mức chi tiết phù hợp cho phân tích.
- Dữ liệu sản phẩm/SKU cần thiết.
- Dữ liệu phí, payment, promotion, voucher và advertising nếu API cho phép.
- Các bảng analytics/summary được tính từ dữ liệu canonical.

Mặc định **không** lưu toàn bộ raw API response vô thời hạn nếu chưa có nhu cầu cụ thể.

Ưu tiên:
- schema chuẩn hóa;
- dữ liệu truy vết được về nguồn;
- đủ chi tiết để tính lại metric khi công thức thay đổi.

Raw payload chỉ nên lưu có chọn lọc khi:
- cần debug;
- endpoint chưa ổn định;
- cần audit field chưa chuẩn hóa;
- hoặc task cụ thể yêu cầu.

---

## 6. Historical Backfill

Mục tiêu backfill ban đầu:

**Lấy toàn bộ lịch sử mà Shopee API thực tế cho phép truy xuất.**

Quy tắc:
- Không giả định API cho phép lấy toàn bộ lịch sử.
- Phải tuân theo giới hạn time window, pagination và retention thực tế của từng endpoint.
- Backfill thực hiện theo checkpoint và có khả năng resume.
- Không để backfill làm ảnh hưởng sync dữ liệu mới.

---

## 7. Sync Cadence

### Orders
- Đồng bộ **mỗi giờ**.

Mục tiêu:
- cập nhật đơn mới;
- trạng thái đơn;
- hủy / hoàn / trả hàng;
- các thay đổi liên quan order khi endpoint cho phép.

### Analytics / Summary
- Tính và cập nhật **mỗi ngày**.

Ví dụ:
- daily sales;
- SKU daily performance;
- shop daily metrics;
- ads daily;
- promotion/voucher daily;
- geographic/time-based summaries.

Không tăng tần suất nếu chưa có nhu cầu kinh doanh rõ ràng.

---

## 8. Shopee Open Platform

### Environment
- Region: VN
- Intended environment: Live
- Seller authorization: OAuth từ chính shop của chủ sở hữu

### Credentials
Các giá trị sau chỉ được lưu trong environment variables hoặc secret storage phù hợp:
- `SHOPEE_PARTNER_ID`
- `SHOPEE_PARTNER_KEY`
- `SHOPEE_SHOP_ID` nếu cần
- `SHOPEE_ACCESS_TOKEN`
- `SHOPEE_REFRESH_TOKEN`

Không ghi các giá trị thật vào source code, log, markdown hoặc commit.

### OAuth Flow

```text
GET /api/shopee/auth
        ↓
Shopee authorization
        ↓
GET /api/shopee/callback?code=...&shop_id=...
        ↓
Exchange code for token
        ↓
Store shop authorization in Neon
```

### Token Lifecycle
- Access token có thời hạn và phải được refresh tự động.
- Refresh token không được log.
- Khi token hết hạn, backend phải refresh trước khi tiếp tục gọi shop-level API.
- Không yêu cầu người dùng copy token thủ công vào ChatGPT.

---

## 9. Vercel

Vercel chịu trách nhiệm:
- Tạo URL authorize Shopee.
- Xử lý OAuth callback.
- Ký request Shopee Open Platform.
- Refresh token.
- Đồng bộ dữ liệu Shopee.
- Chạy scheduled sync phù hợp với cadence đã chốt.
- Cung cấp API chỉ-đọc cho ChatGPT.

### Environment Variables

Tối thiểu:
- `DATABASE_URL`
- `SHOPEE_PARTNER_ID`
- `SHOPEE_PARTNER_KEY`
- `SHOPEE_REDIRECT_URL`

Không hardcode secret.

---

## 10. Neon PostgreSQL

Neon là database canonical của hệ thống.

### Initial Authorization Table

Dự kiến tối thiểu:

```sql
shopee_shops
- shop_id
- shop_name
- access_token
- refresh_token
- token_expires_at
- region
- created_at
- updated_at
```

Token cần được bảo vệ phù hợp trước khi production hóa hoàn toàn.

### Planned Core Tables

Chỉ tạo khi task yêu cầu và endpoint đã được xác nhận:

```text
shopee_orders
shopee_order_items
shopee_payments
shopee_products
shopee_product_daily
shopee_ads_daily
shopee_shop_daily
```

Các bảng bổ sung có thể được thêm khi cần cho:
- vouchers/promotions;
- returns/refunds;
- geographic analysis;
- fees;
- traffic;
- affiliate;
- ads;
- operational timing.

Không tạo toàn bộ schema trước nếu chưa cần.

---

## 11. Canonical Metrics

Các metric dưới đây là mục tiêu phân tích, chưa mặc định rằng mọi metric đều có endpoint Shopee trực tiếp.

```text
Revenue
Net Revenue
Orders
Units
AOV
Traffic
CTR
CVR
Ads Spend
Ads Sales
ROAS
Refund Rate
Cancel Rate
Fee Rate
Profit Contribution
Voucher Usage Rate
Orders by Hour
Orders by Region
SKU Revenue
SKU Units
SKU Conversion-related metrics when source data permits
```

Quy tắc:
- Không đồng nhất `Ads Sales` với `Net Revenue`.
- Không tự suy diễn metric từ tên field nếu chưa xác nhận định nghĩa.
- Mỗi metric quan trọng phải có nguồn và công thức rõ ràng trước khi dùng cho báo cáo.
- Metric mới có thể được bổ sung khi Shopee API cung cấp dữ liệu đủ tin cậy.

### Profit
Mục tiêu có phân tích lợi nhuận, nhưng nguồn input chi phí/giá vốn chưa được chốt.

Các input có thể cần:
- COGS / giá vốn;
- Shopee fees;
- transaction fees;
- service fees;
- ads spend;
- shop voucher / seller discount;
- shipping-related seller cost/subsidy;
- refund/return impact.

**Status: chưa chốt nguồn dữ liệu giá vốn và công thức Profit canonical.**

---

## 12. Read-only Analytics API

Mục tiêu cuối của API:

```text
GET /api/analytics/shop-summary
GET /api/analytics/daily-sales
GET /api/analytics/products
GET /api/analytics/orders
GET /api/analytics/ads
GET /api/analytics/compare
```

Đây chỉ là direction, không phải bắt buộc phải tạo toàn bộ ngay.

Nguyên tắc:
- Chỉ hỗ trợ READ.
- Không có endpoint sửa giá, tồn kho, sản phẩm, đơn hàng hoặc cấu hình Shopee.
- Chỉ expose dữ liệu cần thiết cho phân tích.
- Không expose token hoặc secret.
- Các API phải hỗ trợ `shop_id` khi cần để không khóa kiến trúc vào single-shop.

---

## 13. Security Decisions

Bắt buộc:
- Không commit `.env`.
- Không ghi secret vào source code.
- Không ghi secret vào log.
- Không paste secret vào ChatGPT.
- API dành cho AI chỉ có quyền READ.
- Không dùng AI để thực hiện write action lên Shopee.
- Không expose raw credential qua analytics API.
- Production logs phải tránh chứa authorization headers hoặc token.

---

## 14. Implementation Strategy

Triển khai theo checkpoint nhỏ:

### Checkpoint 1 — OAuth
Mục tiêu:
- Vercel chạy.
- Redirect URL đúng.
- Authorize shop thành công.
- Callback nhận được `code` và `shop_id`.

### Checkpoint 2 — Token
Mục tiêu:
- Exchange authorization code.
- Lưu token vào Neon.
- Refresh token thành công.

### Checkpoint 3 — Shop API
Mục tiêu:
- Gọi được một shop-level endpoint đơn giản.
- Xác nhận signing, token và shop ID hoạt động.

### Checkpoint 4 — Core Sync
Ưu tiên:
- Orders
- Order items
- Products
- Payments

Sau core sync mới mở rộng:
- vouchers/promotions;
- returns/refunds;
- ads;
- traffic;
- geography;
- operational metrics.

### Checkpoint 5 — Historical Backfill
- Backfill tối đa lịch sử Shopee cho phép.
- Có pagination.
- Có khả năng resume.
- Không ảnh hưởng sync dữ liệu mới.

### Checkpoint 6 — Scheduled Sync
- Orders: hourly.
- Analytics/summary: daily.

### Checkpoint 7 — Analytics
- Chuẩn hóa daily metrics.
- SKU metrics.
- Revenue / fee / profit inputs.
- Voucher, time-of-day, geography và các lát cắt khác.

### Checkpoint 8 — ChatGPT
- Read-only Analytics API.
- ChatGPT đọc và phân tích dữ liệu.

Không bỏ qua checkpoint nếu checkpoint trước chưa test thành công.

---

## 15. Current Status

Trạng thái hiện tại:
- Shopee Open Platform account: có.
- Vercel account/project capability: có.
- Neon account/database capability: có.
- Chủ sở hữu có 2 shop; giai đoạn đầu triển khai 1 shop.
- Kiến trúc tổng thể: đã chốt.
- Business analysis priorities: đã chốt sơ bộ.
- Historical backfill goal: toàn bộ lịch sử API cho phép.
- Sync cadence: orders hourly, analytics daily.
- OAuth implementation: auth + callback code đã chuẩn bị; real Shopee authorization/deploy test chưa pass.
- Token persistence: chưa xác nhận hoàn thành.
- Core data sync: chưa triển khai.
- Analytics API: chưa triển khai.
- ChatGPT direct read integration: chưa triển khai.
- Profit canonical formula/source: chưa chốt.

Cập nhật section này sau mỗi milestone đã test thành công.

---

## 16. Known Unknowns

Cần xác nhận theo từng task:
- Quyền API thực tế của Shopee app hiện tại.
- Endpoint khả dụng cho shop tại Việt Nam.
- Dữ liệu Ads/Traffic/Affiliate nào được phép đọc.
- Định nghĩa chính xác của từng metric Shopee trả về.
- Rate limit và pagination của từng endpoint đang dùng.
- Historical retention/window thực tế của từng endpoint.
- Cơ chế bảo vệ token phù hợp trước production.
- Nguồn giá vốn và công thức lợi nhuận canonical.

Không đoán endpoint hoặc field nếu chưa kiểm tra tài liệu hoặc response thực tế.

---

## 17. Architecture Decision Log

### ADR-001
**Decision:** Dùng Vercel làm backend trung gian giữa Shopee và Neon.

**Reason:** Đơn giản, ít thành phần, phù hợp serverless và dễ triển khai.

### ADR-002
**Decision:** Neon PostgreSQL là nơi lưu dữ liệu canonical.

**Reason:** Dễ query, phù hợp analytics và không phụ thuộc Google Sheets làm source of truth.

### ADR-003
**Decision:** ChatGPT chỉ truy cập qua read-only Analytics API.

**Reason:** Giảm rủi ro bảo mật và tránh cho AI quyền thay đổi shop.

### ADR-004
**Decision:** Không xây dashboard ở giai đoạn đầu.

**Reason:** Ưu tiên data bridge và khả năng phân tích trước.

### ADR-005
**Decision:** Giai đoạn đầu vận hành 1 shop nhưng data model không khóa vào single-shop.

**Reason:** Chủ sở hữu hiện có 2 shop và có thể mở rộng thêm sau này.

### ADR-006
**Decision:** Lưu dữ liệu giao dịch chuẩn hóa + analytics; không mặc định lưu toàn bộ raw API response.

**Reason:** Đơn giản hơn, tiết kiệm storage và vẫn đủ khả năng phân tích/truy vết trong phạm vi cần thiết.

### ADR-007
**Decision:** Backfill tối đa lịch sử Shopee API cho phép.

**Reason:** Phục vụ trend, SKU lifecycle, seasonality và các phân tích lịch sử.

### ADR-008
**Decision:** Orders sync mỗi giờ; analytics/summary cập nhật mỗi ngày.

**Reason:** Cân bằng độ mới dữ liệu với độ đơn giản và chi phí vận hành.
