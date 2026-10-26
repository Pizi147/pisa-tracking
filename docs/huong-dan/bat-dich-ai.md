# Bật nút "Dịch" (dịch nhận xét bằng AI) — hướng dẫn cho chủ sản phẩm

> Tra tài liệu chính thức ngày **26/10/2026**. Tên menu có thể đổi theo thời gian; thấy khác thì tìm mục cùng nghĩa.
> - OpenAI: [model gpt-6-luna](https://developers.openai.com/api/docs/models/gpt-6-luna) · [danh sách model](https://developers.openai.com/api/docs/models) ·
>   [giới hạn chi tiêu](https://developers.openai.com/api/docs/guides/spend-limits) · [quyền của khoá](https://help.openai.com/en/articles/8867743-assign-api-key-permissions) ·
>   [ChatGPT và API tính tiền riêng](https://help.openai.com/en/articles/8156019)
> - Netlify: [biến môi trường — tổng quan](https://docs.netlify.com/build/environment-variables/overview/) · [cách thêm biến](https://docs.netlify.com/build/environment-variables/get-started/)

**Làm khi nào:** chỉ SAU KHI bản R1 đã deploy xong (bản có bảng `ban_dich`, `dich_luot`). Bật trước thì bấm Dịch sẽ lỗi.
**Mất bao lâu:** khoảng 20 phút. **Ai làm:** chủ sản phẩm (agent không được tạo / nhập / xem khoá).

**Ba điều không bao giờ làm với khoá:** không dán vào chat (kể cả với Claude), không dán vào PR / GitHub / Zalo, không đặt tên biến bắt đầu bằng `VITE_`.

---

## 1. Tài khoản API là phần riêng, không phải ChatGPT

- **Vào đâu:** <https://platform.openai.com> → đăng nhập (dùng được tài khoản ChatGPT, nhưng tiền tính riêng — gói ChatGPT Plus KHÔNG gồm API).
- **Bấm gì:** biểu tượng bánh răng (Settings) → **Billing** → nạp tiền trả trước, **5–10 USD** là đủ nhiều tháng.
- **Thấy gì là đúng:** Billing hiện số dư > 0.
- **Lỗi thì làm gì:** thẻ bị từ chối → thử thẻ khác / thẻ quốc tế. Hết số dư sau này → bấm Dịch báo "Chưa dịch được"; nạp thêm là chạy lại.

Ước tính chi phí: model `gpt-6-luna` giá 0,10 USD / 1 triệu token vào, 0,50 USD / 1 triệu token ra. Một lần dịch nhận xét ~ 500 token
→ 300 lần / ngày tối đa khoảng **0,1 USD / ngày**.

## 2. Tạo project và khoá bí mật

- **Vào đâu:** góc trên trái chọn project → **Create project**, đặt tên `PISA`.
- **Bấm gì:** trong project PISA → **API keys** → **Create new secret key**. Tên: `pisa-netlify`. Quyền (Permissions): để mặc định **All**. Khoá nằm trong project PISA riêng nên chỉ tiêu tiền của project này.
- **Điền gì:** không điền gì thêm. Bấm tạo.
- **Thấy gì là đúng:** hiện một chuỗi bắt đầu `sk-…`. Bấm **Copy**. Chuỗi chỉ hiện **một lần**.
- **Lỗi thì làm gì:** lỡ đóng mà chưa chép → xoá khoá đó, tạo khoá mới. Không gửi khoá cho ai, không lưu vào tệp trong máy chung.

## 3. Đặt trần chi tiêu (khuyên làm)

- **Vào đâu:** project PISA → **Project settings** → **Limits**.
- **Bấm gì:** mục Spend → **Edit spend limit** → điền **Monthly spend limit** = `5` (USD) → bật **Enforce a hard limit** → **Save**.
- **Thấy gì là đúng:** Limits hiện 5 USD / tháng, có chữ hard limit.
- **Hiểu đúng:**
  - Hạn **300 lượt / ngày** trong PISA chỉ đếm số lần bấm, **không phải trần tiền**.
  - Trần tiền thật là "hard limit" ở OpenAI: chạm trần thì OpenAI **chặn** (nút Dịch báo "Chưa dịch được"). Có thể vượt nhẹ vì OpenAI ghi nhận chậm.
  - Cảnh báo (alert) chỉ gửi email, **không chặn**. Không bật hard limit thì chỉ còn chặn khi hết số dư trả trước.

## 4. Đặt khoá vào Netlify (chỉ bản chính)

- **Vào đâu:** <https://app.netlify.com> → đúng site PISA đang chạy bản chính → **Project configuration** (có nơi ghi Site configuration) → **Environment variables**.
- **Bấm gì:** **Add a variable** → tạo từng biến (create variables individually).
- **Điền gì:**

  | Tên biến (Key) | Giá trị | Ghi chú |
  |---|---|---|
  | `OPENAI_API_KEY` | dán khoá `sk-…` vừa chép | bắt buộc |
  | `DICH_MODEL` | `gpt-6-luna` | đã kiểm 26/10; bỏ trống cũng dùng giá trị này |
  | `DICH_TRAN_NGAY` | `300` | số lần dịch / ngày cả trung tâm |
  | `DICH_TRAN_NGUOI` | `50` | số lần dịch / ngày / người |
  | `DICH_TAT` | (KHÔNG tạo lúc này) | chỉ dùng khi muốn tắt nhanh, mục 8 |

  - **Scopes** (nếu thấy ô này): chọn **Functions** (máy chủ PISA chạy ở Functions). Không thấy ô Scopes → bỏ qua, biến dùng cho mọi phần.
  - **Deploy contexts:** chọn **Production** (bản chính). KHÔNG chọn Deploy Previews / Branch deploys — bản thử không cần khoá.
  - Nếu có ô **Contains secret values** → tick cho `OPENAI_API_KEY`.
  - KHÔNG tạo biến `DICH_GIA` (chế độ giả chỉ cho máy dev; bản chính bỏ qua).
- **Thấy gì là đúng:** danh sách có thêm đủ 4 biến mới (các biến cũ như `TURSO_*` giữ nguyên, không sửa), giá trị khoá hiện dạng che (••••).
- **Lỗi thì làm gì:** đặt nhầm site / nhầm context → xoá biến ở chỗ nhầm, tạo lại đúng chỗ.

## 5. Deploy lại rồi tải lại trang

- **Vào đâu:** Netlify → site PISA → **Deploys**.
- **Bấm gì:** **Trigger deploy** → **Deploy site** (biến mới chỉ có hiệu lực sau một lần deploy).
- **Thấy gì là đúng:** deploy mới ở trạng thái **Published**.
- Sau đó mọi người **tải lại trang PISA** (F5): cờ bật dịch được đọc lúc vào phiên, trang mở từ trước vẫn chưa có nút.

## 6. Thử một lần

1. Chọn một nhận xét **không có dữ liệu nhạy cảm**, viết bằng **tiếng Anh**, trong khi giao diện đang **tiếng Việt** (hoặc ngược lại).
   Nút "Dịch" chỉ hiện khi chữ **rõ ràng** khác ngôn ngữ giao diện; chữ quá ngắn / chỉ có số / không đoán được thì không có nút.
2. Bấm **Dịch** → nút đổi thành **Đang dịch…** → hiện bản dịch, nút thành **Xem bản gốc**.
3. Bấm **Xem bản gốc** → về chữ gốc. Chữ gốc trong hệ thống không bị sửa.
- **Thấy gì là đúng:** bản dịch giữ nguyên tên học viên, số điểm, mã tuần (vd `W3 SEP`), chữ Case / PA / MT / Target.
- **Lỗi thì làm gì:**
  - Không thấy nút ở mọi nhận xét: khoá chưa đặt đúng **Production**, chưa deploy lại, hoặc chưa tải lại trang. Chỉ một nhận xét không có nút: chữ đó không rõ là khác ngôn ngữ.
  - "Dịch đang tắt.": trang được mở từ trước khi tắt / trước khi bật — tải lại trang.
  - "Chưa dịch được. Bản gốc vẫn giữ — thử lại sau.": xem nguyên nhân ở Netlify → site PISA → **Logs** → **Functions** → hàm `api` → tìm chữ `[dich]`:
    - `OpenAI trả 401` → khoá sai / đã thu hồi → làm lại mục 2 và mục 4.
    - `OpenAI trả 404` hoặc `400` → tài khoản chưa dùng được model → đổi `DICH_MODEL` thành `gpt-5.4-mini`, deploy lại.
    - `OpenAI trả 429` → hết số dư hoặc chạm trần chi tiêu → nạp thêm (mục 1) hoặc nâng trần (mục 3).
    - `gọi OpenAI lỗi: TimeoutError` → OpenAI chậm; thử lại sau.
    - `OpenAI trả bản không hợp lệ` → bản dịch làm sai chỗ tên; hệ thống đã chặn, thử lại sau.
  - "Nội dung vừa đổi — tải lại trang để dịch.": có người vừa sửa nhận xét — tải lại trang rồi bấm **Dịch**.

## 7. Theo dõi chi phí

- **Vào đâu:** platform.openai.com → **Usage** (chọn project PISA).
- **Thấy gì là đúng:** sau lần thử có vài trăm token, chi phí ~0,00 USD.
- Xem mỗi tuần một lần trong tháng đầu. Bản dịch đã có được nhớ lại, bấm lại cùng nhận xét không tốn thêm tiền.

## 8. Tắt nhanh

- Netlify → Environment variables → **Add a variable**: `DICH_TAT` = `1` (Production) → **Trigger deploy** → mọi người tải lại trang.
- **Thấy gì là đúng:** nút Dịch biến mất. Dữ liệu, nhận xét gốc không đổi.
- Bật lại: xoá biến `DICH_TAT` → deploy lại.

## 9. Thay hoặc thu hồi khoá

- Nghi lộ khoá (lỡ dán vào chat / PR…): platform.openai.com → project PISA → **API keys** → xoá (Revoke) khoá đó **ngay**.
- Tạo khoá mới (mục 2) → Netlify sửa giá trị `OPENAI_API_KEY` (mục 4) → deploy lại (mục 5).
- Thu hồi khoá không ảnh hưởng dữ liệu PISA; trong lúc chưa có khoá mới, nút Dịch báo "Chưa dịch được" hoặc ẩn.
