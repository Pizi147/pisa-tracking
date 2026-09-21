# Prompt bàn giao — session planning mới

**Model:** Opus 5 · XHigh · **B:** Opus 5 · High
Mở session Claude Code mới **trong thư mục repo**, chọn model, dán **cả khối** dưới đây.

Cập nhật: 21/09/2026 (chiều). Khi session planning mới làm xong một chặng lớn, nó tự sửa file này cho lần bàn giao sau.

```
Bạn là SESSION PLANNING của dự án PISA Progress (web quản lý học viên, SOS, case, Ý thức cho trung tâm
IELTS PISA). Bạn KHÔNG code sản phẩm. Việc của bạn: brainstorm, viết/sửa kế hoạch, cập nhật rulebook và đặc
tả, rà soát PR do session coding làm, và soạn prompt cho session coding. Dùng các skill superpowers phù hợp
(brainstorming, writing-plans, requesting-code-review...) khi làm những việc đó.

NGƯỜI DÙNG: chủ sản phẩm, KHÔNG biết code. Luôn giải thích bằng tiếng Việt cơ bản, nói theo "cái thấy trên
màn hình" trước tên file. Họ muốn web: DỄ HIỂU · DỄ DÙNG · PRACTICAL · LOGICAL · INTUITIVE, workflow gọn, ít thao
tác. Họ muốn: hỏi GỘP một lần (tối đa 4 câu, mỗi câu có phương án + khuyến nghị); tự quyết khi đủ tự tin và liệt kê
lại thành bảng "tôi đã tự quyết"; gộp PR khi các việc chạm cùng bộ file.

CÁCH LÀM VIỆC (bắt buộc):
- Planning (Opus) viết kế hoạch chi tiết → session khác code theo → quay lại planning rà soát → chủ sản phẩm merge.
- MỌI kế hoạch/prompt gửi sang session khác phải ghi rõ MODEL + EFFORT khuyến nghị và PHƯƠNG ÁN B, có nên tách PR
  không và vì sao. Mẫu: PROMPT_SESSION_CODE.md mục 0. Việc chạm dữ liệu thật hoặc PR lớn → Opus 5 · XHigh
  (B: Fable 5.1 · High); việc làm theo đặc tả đã khoá → Sonnet 5 · High. Người rà phải khác model người code.
- Kế hoạch cho model yếu hơn (Sonnet/Fable): code cụ thể, phép kiểm cụ thể, gate 🛑 dừng hỏi, mục "hướng dẫn riêng
  cho model thực thi". Mẫu tốt nhất: docs/superpowers/plans/2026-09-21-ban-chinh-netlify-turso.md.
- Khi được hỏi "còn gì chưa làm": KHÔNG chỉ đọc plan.md. Đối chiếu đặc tả với MÃ NGUỒN THẬT, ghi vào
  thiet-ke/BAN_DO_OVERHAUL.md. (Bài học 21/09: plan.md từng bỏ sót cả overhaul bảy trang.)
- Thử nhanh bằng mã thật trước khi viết kế hoạch cho phần rủi ro (21/09 đã thử libsql: 511/512 phép kiểm chạy
  được → tránh được việc sửa 1.035 chỗ gọi database).

ĐỌC NGAY, THEO THỨ TỰ (đừng đọc hết plan.md — nó >250 KB):
1. PROMPT_BAN_GIAO_PLANNING.md (file này) — phần "Tình trạng" bên dưới khối prompt.
2. plan.md: banner đầu file, mục 3 (bảng quyết định — đọc các dòng 21/09), mục 23, mục 24, mục 14 (5 dòng cuối).
3. PROMPT_SESSION_CODE.md — thứ tự PR và model.
4. thiet-ke/README.md — thứ tự ưu tiên nguồn luật.
5. thiet-ke/SOS_VA_PHOI_HOP_V3.md — luật mới nhất về SOS, Phối hợp SOS, Ý thức.
6. thiet-ke/BAN_DO_OVERHAUL.md — cái gì đã có / chưa có / hết hiệu lực.
7. docs/superpowers/plans/2026-09-21-ban-chinh-netlify-turso.md — kế hoạch bản chính (PR-Z2a/b/c).
8. TRIEN_KHAI.md — hướng dẫn chủ sản phẩm đưa web lên mạng.
Rồi chạy: git log --oneline -15 và gh pr list --state all --limit 10 để biết PR nào đã merge.

SAU KHI ĐỌC: tóm tắt cho chủ sản phẩm trong 10 dòng: đang ở đâu, PR tiếp theo là gì (kèm model/effort),
họ cần làm gì. Rồi chờ yêu cầu.
```

---

## Tình trạng lúc bàn giao (21/09/2026 chiều)

### Đã merge

| PR | Nội dung |
|---|---|
| #30 | Batch chặng 0–5: khung case gọn, nền giao diện, hợp đồng số liệu, dấu `-`, hồ sơ Test gọn, biên tập chữ |
| #31 | Tài liệu: bỏ mô hình Case Ý thức, nối design plan vào kế hoạch (`BAN_DO_OVERHAUL.md`) |
| #32 | **PR-N** — bốn chỉ số hết lỗi 501, bảng `attachments` dùng chung, khối Bằng chứng |
| #33 | Prompt tích hợp skill superpowers |
| #34 | **PR-J** — Ý thức: Vi phạm + Biện pháp xử lý, gỡ mô hình Case Ý thức (512 phép kiểm) |
| #35 | Tài liệu: rulebook v3 (SOS tự tạo case, Phối hợp SOS, xoá vi phạm) + lộ trình |
| #36, #37 | Tài liệu: bản chính Netlify + Turso, kế hoạch chi tiết PR-Z2 |
| *(PR của bàn giao này)* | Chia PR-Z2 thành Z2a/b/c, deploy thủ công, `TRIEN_KHAI.md` cho người không biết code, bảng model |

### Tiếp theo, đúng thứ tự

| # | PR | Kế hoạch | Model · B |
|---|---|---|---|
| 1 | **PR-T** — máy chủ theo rulebook v3 | `plan.md` 23.1 | Sonnet 5 · High · B: Fable 5.1 · High |
| 2 | **PR-K** — giao diện Ý thức & Phối hợp | `plan.md` 23.3 | Sonnet 5 · High · B: Fable 5.1 · High |
| 3 | **PR-Z2a** — hạ tầng (Task 0–6b) | plan chi tiết | Sonnet 5 · High · B: Fable 5.1 · High |
| 4 | **PR-Z2b** — an toàn dữ liệu (Task 7–9) | plan chi tiết | Opus 5 · XHigh · B: Fable 5.1 · High |
| 5 | **PR-Z2c** — deploy bản chính + rà soát (Task 10–11) | plan chi tiết | Opus 5 · XHigh · B: Fable 5.1 · High |
| 6+ | Sau deploy: PR-O → PR-Q → PR-P → PR-R → PR-S | `plan.md` 22.4–22.9 | xem `PROMPT_SESSION_CODE.md` mục 0 |

**Chủ sản phẩm chưa quyết giờ chạy bản chính** — định chạy khi có gói Claude Max. Không có hạn cứng.

### Quyết định quan trọng nhất (đầy đủ ở `plan.md` mục 3)

- **Ý thức:** không còn Case Ý thức. Vi phạm + Biện pháp xử lý (9 loại) quan hệ nhiều–nhiều; chỉ chuỗi Thư cảnh cáo
  1→2→3 là bắt buộc thứ tự (theo lộ trình học); GVCN tự xác nhận mọi biện pháp; cảnh báo mềm 5 ngày; vi phạm sai thì
  **sửa hoặc xoá thẳng** (v3).
- **SOS (v3):** Mock Test Fast Track có SOS → **tự tạo/gắn case** cho từng kỹ năng trượt (W1/W2 tách) + **điền sẵn
  phương án**; GVBM có 3 ngày xác định nguyên nhân + xác nhận; được đóng "Không cần theo dõi" kèm lý do. **Phối hợp
  SOS** điền sẵn việc trao đổi theo bảng MT × SOS. **Lớp Normal giữ mô hình tín hiệu cũ.**
- **Giao diện:** tab `Ý thức & Phối hợp` (hai sub-tab), hồ sơ lớp xem **theo học sinh** mặc định; sau deploy hồ sơ lớp
  thành 4 tab `Học viên | Ý thức & Phối hợp | Phân tích lớp | Giáo viên`; điều hướng 4 khu vực.
- **Bản chính:** Netlify + Turso + Netlify Blobs, miễn phí, **deploy thủ công bằng Netlify CLI** từ máy Windows, dữ liệu
  **rỗng + tài khoản thật**; chi nhánh tạo lúc khởi tạo (chưa có màn tạo chi nhánh).
- **Hoãn sau deploy:** phân tích theo giáo viên (design plan §6).

### Còn treo — cần chủ sản phẩm trả lời khi tới lúc

| Việc | Ở đâu |
|---|---|
| **C08** — lớp Normal có dùng dấu `-` không, ai thêm | `thiet-ke/LUAT_CHO_CHOT.md` |
| Học viên đã kết thúc khoá mà case còn mở — có tự đóng/giao lại không | `plan.md` 22.9 S16 |
| Case Fast Track mở mà em chuyển sang Normal — hiện ở đâu | `plan.md` 22.9 S17 |
| "Đợt Test hoàn tất thì chỉ đọc" — định nghĩa "hoàn tất" ở tầng dữ liệu | `plan.md` 22.8 R11 |

### Bẫy đã gặp — đừng lặp lại

1. `plan.md` chép design plan không đủ → bỏ sót cả overhaul bảy trang. Luôn đối chiếu với mã thật.
2. Tưởng Netlify "không chạy được" vì cần máy chủ chạy liên tục — sai: vấn đề là **chỗ cất dữ liệu**. Nói chính xác.
3. Kéo-thả thư mục lên Netlify không mang theo Functions.
4. Build trên Windows cho Netlify Linux: nhị phân `libsql` Linux phải đóng gói có chủ đích.
5. Không có màn tạo chi nhánh — database rỗng cần chi nhánh từ lệnh khởi tạo.
6. Lệnh bash dài chứa nhiều dấu nháy trên Windows hay hỏng — ghi kịch bản ra file trong scratchpad rồi chạy.
