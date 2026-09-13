# Prompt bàn giao — bắt đầu vòng 4, phase 1

> **Cách dùng:** mở một chat Claude Code mới trên repo `Pizi147/pisa-tracking`, rồi dán toàn bộ
> phần trong khung dưới đây làm tin nhắn đầu tiên.

---

```
Tôi là chủ dự án PISA Progress — giáo viên IELTS, KHÔNG biết code. Hãy giải thích mọi thứ
bằng tiếng Việt, không dùng thuật ngữ kỹ thuật, nói cái gì thay đổi trên màn hình chứ đừng
nói tên hàm hay tên bảng dữ liệu.

Bắt đầu VÒNG 4, PHASE 1 của dự án.

TRƯỚC KHI LÀM BẤT CỨ VIỆC GÌ, đọc ba file này trong thư mục `vong4/` của repo:
  1. vong4/01_CHOT_NGHIEP_VU.md   — nghiệp vụ đã chốt, đây là nguồn sự thật
  2. vong4/02_KE_HOACH_PHASE.md   — phase 1 gồm những gì, xong khi nào
  3. vong4/00_BOI_CANH_KY_THUAT.md — cách chạy dự án và những cái bẫy đã gặp

Sau khi đọc xong:
  - Tóm tắt lại cho tôi bạn hiểu phase 1 phải làm gì (ngắn thôi).
  - Hỏi tôi hai điểm còn treo ghi ở cuối file 02.
  - Với hai phần tôi giao bạn tự thiết kế (mục 7.11 "theo dõi hỗ trợ theo kỹ năng" và
    mục 7.18 "hồ sơ học viên + màn case"), trình bản phác cho tôi xem TRƯỚC khi code xong
    cả phase — đừng làm hết rồi mới hỏi, tôi không muốn làm lại.
  - Rồi làm phase 1 và cho tôi một PR.

BA RÀNG BUỘC TÔI KHÔNG MUỐN NHẮC LẠI:
  1. ĐỪNG để server chạy ngầm. Chỉ bật khi cần chụp màn hình hoặc chạy thử, xong thì tắt
     và kiểm cổng 5173/4000 đã trống. Chạy suốt rất tốn.
  2. ĐỪNG merge, đừng deploy, đừng gửi thông báo ra ngoài nếu tôi không bảo.
  3. Nhánh làm việc: claude/pisa-progress-local-demo-42ct9j

Ưu tiên của tôi, theo đúng thứ tự: PRACTICALITY — INTUITIVE — USER-FRIENDLY.
Less UI, fewer clicks, better system logic.
```

---

## Vì sao cần cả ba file

| File | Trả lời câu hỏi |
|---|---|
| `01_CHOT_NGHIEP_VU.md` | **Cái gì là đúng** — quy tắc SOS, vòng đời case, lịch MT, phân quyền |
| `02_KE_HOACH_PHASE.md` | **Làm gì trước, xong khi nào** |
| `00_BOI_CANH_KY_THUAT.md` | **Chạy dự án thế nào, đã vấp phải cái gì** |

`PISA_Claude_Prompt.md` (bản gốc owner gửi) vẫn là nguồn tham chiếu cho phần chi tiết cột bảng
ở mục 8, 9, 10. File `01` chỉ chốt lại những chỗ có mâu thuẫn hoặc thiếu thông tin, không chép
lại toàn bộ.

## Thứ tự ưu tiên khi có mâu thuẫn

```
lời owner mới nhất
  → vong4/01_CHOT_NGHIEP_VU.md
    → PISA_Claude_Prompt.md
      → PISA_Design_Master_Reference.md
        → hiện trạng code
```

Code đang chạy **không tự chứng minh** là owner đã duyệt. Vòng 3a từng làm đúng lời owner lúc
đó và vẫn bị đảo ngược ở vòng 4 — chuyện bình thường.
