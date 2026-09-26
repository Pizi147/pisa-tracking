# UX sau đánh giá toàn web 26/09 — Kế hoạch (CHƯA LÀM, chờ ghép với các prompt UI sắp tới)

> **Trạng thái:** kế hoạch sẵn, **chưa giao cho session code**. Chủ sản phẩm (26/09/2026) muốn *chưa sửa ngay*.
> Sẽ có thêm prompt UI mới; khi đó session planning **ghép** các mục dưới đây vào các PR đó theo bảng
> "File → mục" ở cuối file, thay vì mở PR riêng chồng file.
>
> **Nguồn:** `thiet-ke/DANH_GIA_GIAO_DIEN_2026-09-26.md`, gồm điểm 24/40, bảng chấm 77 trang/panel và mục 3 sáu vấn đề hệ thống.
> Mã mục dưới đây (A1, B3…) là mã của kế hoạch này, không phải mã trong file đánh giá.

**Thứ tự chủ sản phẩm chốt (26/09):** **sửa sai sự thật trước**. Làm gói **UX-A** và **UX-B** trước, sau đó mới tới các gói còn lại.

**Quyết định màu đã chốt (26/09):**
- Giữ nguyên thang SOS 1 vàng / SOS 2 cam / SOS 3 đỏ đang chạy.
- **SOS tạm thời** mang đúng màu của mức SOS đó, thêm viền đứt và luôn có chữ "tạm thời".
- Đã ghi vào `thiet-ke/HE_GIAO_DIEN.md` §2 và §5.
- Đề xuất "SOS 3 khối đỏ đặc" đã được xem và **không chọn**, vì cần đồng bộ với các màn khác.

---

## 0. Luật chung cho mọi gói

- Mỗi gói một PR, nhánh riêng, **không tự merge**. Không migrate trừ khi ghi rõ.
- Mỗi mục phải có **ảnh trước/sau** chụp bằng Playwright kênh Chrome, ở hai khổ 1440 px và 375 px, lưu vào `thiet-ke/anh/<ma-pr>/`.
- Rà lại luật "tinh tế" của chủ sản phẩm:
  - dấu trạng thái nhỏ gọn, nét mảnh;
  - cột và hàng thẳng: số căn phải, chữ số cùng độ rộng (`tabular-nums`), hàng cao đều;
  - dòng phụ không dồn chữ, không lặp thông tin đã có ở cột khác.
- Chữ trên giao diện theo `thiet-ke/TU_DIEN_VA_CHU.md` và `thiet-ke/THUAT_NGU_DA_CHOT.md`.
- Không được để lọt ra màn hình: mã kỹ thuật, ngày dạng ISO, lệnh npm.
- Mỗi luật thuần mới phải có phép kiểm trong `server/src/tests/`.
- Trước khi kết thúc session: kiểm không còn `npm run check` nào đang chạy chồng (xem cảnh báo trong memory dự án).

---

## Gói UX-A — Sửa sai sự thật (nhỏ, rủi ro thấp) · ƯU TIÊN 1

**Model:** Sonnet 5 · High · **phương án B:** Fable 5.1 · Medium. **Người rà:** session planning (Opus).
**Không migrate.** Chủ yếu là giao diện; một vài câu do máy chủ viết cũng thuộc gói này.

| # | Việc | Chỗ sửa | Nghiệm thu |
|---|---|---|---|
| A1 | Xoá ký tự điều khiển 0x08 trong biểu thức `/^SOS\s*([123])…/` (hiện nó làm SOS 1 hiện xanh dương ở Tổng quan GV và Công việc) | `web/src/lib/format.ts:85` (`toneTheoNhan`) | Phép kiểm `toneTheoNhan('SOS 1','info') === 'sos1'` (và SOS 2, SOS 3). Ảnh Tổng quan GV: SOS 1 vàng. Quét cả repo tìm ký tự điều khiển khác: `grep -rnP '[\x00-\x08\x0b\x0c\x0e-\x1f]' web shared server --include=*.ts*` |
| A2 | SOS tạm thời: đúng màu của mức SOS, viền đứt, chữ "tạm thời" ở **mọi** chỗ | `web/src/ui/KetQuaDot.tsx:53-66`, `web/src/modules/students/BangHocVienLop.tsx:534-539`, `shared/domain/hocVienLop.ts:109-116`, `web/src/modules/students/StudentDetailPage.tsx:441-447` | Hồ sơ Đỗ Minh Khôi ghi "SOS 2 tạm thời · 2/4 kỹ năng"; danh sách Học viên & Lớp cũng có chữ "tạm thời"; không màn nào hiện "—" kèm SOS |
| A3 | Đạt/chưa đạt không chỉ dựa vào màu: thêm dấu mảnh ▾ cho ô dưới kỳ vọng, hoặc cách khác không dựa vào màu | `web/src/modules/students/ClassRoster.tsx:255`, `web/src/modules/classes/BangDiemLopThuong.tsx:101-106` | Chuyển ảnh sang xám vẫn phân biệt được |
| A4 | Nhãn kết quả lớp thường: "Đạt 0/4 môn · SOS 3" → "0/4 môn đạt · SOS 3" | `web/src/modules/cham/LuoiThuong.tsx:445-481` và hàm `ketQuaThuong` trong `shared/domain` | Không còn nhãn đỏ nào bắt đầu bằng chữ "Đạt" |
| A5 | Hạn và dự kiến: dòng "Làm PA … hạn 30/08" dùng `<Han loai>` (quá hạn thì có ⚠ + "quá hạn n ngày"); nếu thực chất là dự kiến kết thúc thì ghi "Dự kiến kết thúc 30/08" màu trung tính | `web/src/modules/worklist/WorkList.tsx:70` (nhánh không có `loaiHan`) | **Cần trả lời câu hỏi Q1 trước.** Không dòng nào có ngày đã qua mà không có trạng thái |
| A6 | "⚠ 12 ngày" → "quá hạn 12 ngày"; việc "Nhập điểm" trễ cũng đi qua `<Han loai="nhap-diem">` | `web/src/ui/ViecTiep.tsx:10-13` và dữ liệu `viecTiepTheo` phía máy chủ | Không còn ⚠ nào đi kèm số mà thiếu chữ |
| A7 | Chữ máy lọt ra: "COUNT DISTINCT…" → "Mỗi Case chỉ đếm 1 lần"; mã kỹ năng thô (`writing2`, `listening`, "PA writing") → tên hiển thị; nhật ký `attempt.cancel_part`… → nhãn tiếng Việt; "npm run sao-luu" → "Nhờ Quản trị sao lưu trước"; "Hạn 2026-09-16" trong thông báo → dd/mm | `web/src/ui/SoLieu.tsx:33-52`, `shared/domain/metrics.ts`, `web/src/modules/platform/AdminPage.tsx:147`, `web/src/modules/students/XoaHocVienPanel.tsx:80`, `server/src/cases/sosAuto.ts:149`, `server/src/cases/signals.ts:139` | Phép kiểm quét chữ: không có `COUNT`, `npm`, mã có dấu chấm dạng `x.y_z`, hay ngày `\d{4}-\d{2}-\d{2}` trong chuỗi hiển thị |
| A8 | Trạng thái quy trình không mượn màu điểm: "Đang xử lý" (case) và "Tiếp tục xử lý" (việc) đang dùng xanh dương → đổi sang tone trung tính + chữ; "Bình thường" (mức gấp) không tô màu cảnh báo | `web/src/lib/format.ts` (`caseStatusTone`), `web/src/modules/worklist/MgmtTasksPage.tsx`, `web/src/modules/cases/CaseBoardPage.tsx` | Trên màn không còn xanh dương nào ngoài ô điểm "bằng kỳ vọng" |
| A9 | "Chữ số, hai dạng": điểm band luôn một chữ số thập phân ("6.0"); mã HV một dạng | `ClassRoster.tsx:256`, `yThuc/ClassYThucCard.tsx` | Toàn web chỉ còn một dạng |

---

## Gói UX-B — Việc tiếp theo và nút chính đúng việc · ƯU TIÊN 2

**Model:** Fable 5.1 · High · **phương án B:** Opus 5.5 · High. Lý do chọn model mạnh hơn: có luật nghiệp vụ case SOS, và máy chủ phải trả thêm dữ liệu.
**Không migrate.**

| # | Việc | Chỗ sửa | Nghiệm thu |
|---|---|---|---|
| B1 | **Case SOS chờ xác định nguyên nhân** (xem chi tiết dưới bảng) | `web/src/modules/cases/SkillBoard.tsx:513-529`, `cases/CasePanel.tsx` (`ThanCase`), `students/NganCase.tsx:105`, `yThuc/CaseSosControls.tsx` | Mở từ thông báo "Xác định nguyên nhân" thì thấy ngay nút đó; ô đầu hồ sơ, hàng kỹ năng và Ngăn Case nói cùng một việc và cùng một nhãn |
| B2 | Nút chính ở chân Ngăn Case: còn PA đang chạy → "Ghi kết quả PA {tên}" (nhiều PA thì chọn PA quá hạn nhất); "Hoàn thành Case" hạ thành nút phụ cho tới khi không còn chặn | `NganCase.tsx:114-128` | Mỗi vùng chỉ một nút chính |
| B3 | Kiểu "đang chọn" khác kiểu nút chính: viền teal + nền `ink-800` + ✓, thêm `aria-pressed` (token "Đang chọn" HE_GIAO_DIEN §2). Áp cho BTVN, Duyệt, Bình thường, bộ lọc | `web/src/ui/ui.tsx` (một chỗ), rồi rà các nơi đang dùng `btn-primary` cho lựa chọn | Trong một panel chỉ còn một khối xanh đặc là nút Lưu |
| B4 | Badge hàng lớp: gộp "HV chờ xếp lớp" và "HV chưa có lộ trình tiếp theo" thành một; "bài chờ chấm" đứng đầu với GV; "+n" thành nút bấm mở danh sách (không chỉ là tooltip) | `shared/domain/hocVienLop.ts:156-168`, `web/src/modules/students/StudentsPage.tsx:287-289`, `web/src/modules/classes/DauTrangLop.tsx:238-247` | **Cần trả lời Q5.** GVBM thấy việc chấm của mình mà không phải rê chuột |
| B5 | Dòng Nợ ở Lịch Test: với Quản lý, ghi tên người chấm ("Chờ cô Trang · S"; nhiều người thì "2 GV" + tooltip) | `web/src/modules/test/lichTest/KhoiNo.tsx:20-25`; máy chủ `server/src/cham/canCham.ts` (`noTuanTruoc`) trả thêm tên người chấm | **Cần trả lời Q4.** Chị Vy biết phải nhắc ai |
| B6 | "Cần xử lý" xếp đúng theo mức gấp; có chữ "Quá hạn / Cần làm" chứ không chỉ chấm màu; đổi "Mở" / "Xem" thành một động từ | `web/src/modules/worklist/KhoiCanXuLy.tsx:13, 36-45` | Thứ tự khớp với tiêu đề "việc gấp nhất lên đầu" |
| B7 | Tab Ý thức: cảnh báo thành thanh có nút "Xử lý {n} vi phạm" (tick sẵn rồi mở Tạo PA); vi phạm chưa xử lý có nhãn "Chưa xử lý · n ngày"; thanh thao tác dính đáy khi đã tick | `web/src/modules/yThuc/StudentYThucSection.tsx:176, 203-213`, `web/src/ui/DongThoiGian.tsx:17` | Từ hồ sơ tới Tạo PA chỉ 1 lần bấm |
| B8 | "Việc tiếp theo" ở danh sách Học viên & Lớp bấm được (liên kết tới đúng chỗ làm); việc chung của lớp chuyển lên hàng lớp | `web/src/ui/ViecTiep.tsx:8-26`, `BangHocVienLop.tsx:544-548` | Không còn "Nhập điểm L, R · Cuối khoá" lặp ở 4 dòng |
| B9 | Panel quyết định lộ trình (Lộ trình tiếp theo, Chuyển tiếp lớp) hiện tóm tắt kết quả/SOS của em; câu "Chỉ là dự định, chưa đổi lớp" hiện thẳng, không giấu sau ⓘ; Chuyển tiếp lớp không báo lỗi trước khi người dùng thao tác và lấy sẵn hướng GVCN đã ghi | `students/LoTrinhTiepPanel.tsx:105-124`, `classes/TransitionPanel.tsx:83`, `shared/domain/lenLop.ts:14-40` | Quyết định được mà không phải nhớ gì từ màn trước |

**Chi tiết B1 (case SOS chờ xác định nguyên nhân):**
- Hàm `nextStepOf` xét `sos.awaitingCause` và `sos.unconfirmedPlanId` trước khi trả về "Ghi kết quả PA".
- Đưa phần xác định nguyên nhân, "không cần theo dõi" và xác nhận PA gợi ý vào **Ngăn Case** (một view mới của `NganCase`, hoặc đặt trong `ThanCase`).
- Ẩn nút "Ghi kết quả" khi PA vẫn còn là gợi ý.
- Dùng một nhãn trạng thái chung cho cả hai nơi (hiện hai nơi ghi "Chưa xử lý" và "Đang xử lý").

---

## Gói UX-C — Chống bấm nhầm · ƯU TIÊN 3

**Model:** Sonnet 5 · High · **phương án B:** Fable 5.1 · High.

| # | Việc | Chỗ sửa |
|---|---|---|
| C1 | Thông báo có nút **"Hoàn tác" trong 5 giây**, dùng chung (dựa trên `web/src/ui/Toast.tsx`). Máy chủ cần đường hoàn tác cho từng thao tác được áp dụng | `web/src/ui/Toast.tsx` |
| C2 | Nút "−" trên điện thoại → nút có chữ "Vắng"; bấm thì hỏi lại, hoặc ghi xong thì có Hoàn tác | `web/src/modules/fasttrack/ScoreEntry.tsx:195-203, 304-310, 952-956` |
| C3 | Menu "Thêm" ở màn một lượt Test: "Ghi nhận vắng" và "Kỹ năng không kiểm tra…" mở hộp xác nhận có ô lý do (lý do bắt buộc với "không kiểm tra"); bỏ lý do ghi cứng | `web/src/modules/fasttrack/MockDetailPage.tsx:373-406` |
| C4 | Ngăn Xếp lịch hàng loạt: mặc định chọn đợt **còn em chưa xếp**; có dòng "Đổi" thì nút ghi "Dời n bài · xếp m bài"; trên điện thoại hiện tóm tắt xem trước ngay trên nút Lưu | `web/src/modules/test/keHoach/NganXepHangLoat.tsx:57-60, 141-142, 174-183, 259-268` |
| C5 | Xác nhận PA gợi ý: có Hoàn tác (C1) | `web/src/modules/yThuc/CaseSosControls.tsx:109` |
| C6 | Không chọn sẵn "Duyệt" (Trả lời đề xuất) và "BTVN" (Ghi nhận vi phạm); Trả lời đề xuất có khối ngữ cảnh: người đề xuất · ngày · case · PA hiện có · kết quả gần nhất | `web/src/modules/cases/ThaoTacCase.tsx:234`, `web/src/modules/yThuc/RecordViolationPanel.tsx:44` |
| C7 | Bảng quyền: chế độ "Sửa quyền", có Lưu và tóm tắt thay đổi (hoặc hỏi lại + Hoàn tác) | `web/src/modules/platform/AdminPage.tsx:175-190` |
| C8 | "Bỏ lưu trữ" có Hoàn tác | `web/src/modules/students/LuuTruPage.tsx` |
| C9 | Ô điểm gõ sai: hiện câu lỗi ngay dưới ô, thêm `aria-invalid` và `aria-describedby`, đếm vào "n ô chưa lưu" (lấy hộp 4 tiêu chí làm mẫu); ô tổng lớp thường lấy sẵn tổng của cột trên máy tính; nút "↓" → "Điền cả cột" | `ScoreEntry.tsx:286, 337-343, 848-849, 927-928, 1083-1110`, `web/src/modules/cham/LuoiThuong.tsx:309-321` |
| C10 | Máy chủ từ chối ngày sinh không có thật (31/02) khi nhập học viên | `/intake/preview`, `server/src/classes/intake.ts` |

---

## Gói UX-D — Điện thoại · ƯU TIÊN 4 (gói lớn nhất)

**Model:** Fable 5.1 · High · **phương án B:** Opus 5.5 · High. Có thể tách thành D-1 (mẫu thẻ dùng chung + Học viên & Lớp + hồ sơ) và D-2 (các bảng còn lại).

| # | Việc | Chỗ sửa |
|---|---|---|
| D1 | **Một mẫu dùng chung "bảng → thẻ" dưới 640 px** (HE_GIAO_DIEN §10); chưa kịp chuyển thì tối thiểu cột tên `sticky left-0` | component mới trong `web/src/ui/` |
| D2 | Áp mẫu D1 cho Học viên & Lớp và hồ sơ lớp | `StudentsPage.tsx:196-197`, `BangHocVienLop.tsx:523-563`, `ClassRoster.tsx`, `BangDiemLopThuong.tsx` |
| D3 | Bảng kỹ năng trong hồ sơ học viên thành thẻ: tên + điểm → case → việc tiếp + hạn | `web/src/modules/cases/SkillBoard.tsx:139` |
| D4 | Hành trình mở ở tuần hiện tại (cột "tuần này" sát mép phải); trên điện thoại bật sẵn Xem gọn; Xem gọn không làm mất nhãn SOS | `web/src/modules/students/HanhTrinh.tsx:170` |
| D5 | Dòng thời gian Ý thức dưới `sm`: ngày + nhãn thành một dòng, nội dung chiếm hết bề ngang | `web/src/ui/DongThoiGian.tsx:34-43` |
| D6 | Thông báo trên điện thoại neo theo mép màn hình (`fixed inset-x-4`) hoặc mở dạng ngăn toàn màn; thêm giờ, "Đọc hết", nhóm Chưa đọc | `web/src/modules/platform/Header.tsx:80-112` |
| D7 | Bảng Vận hành, Báo cáo đơn vị, Theo lớp, Quản trị › Tài khoản thành thẻ | `MgmtTasksPage.tsx:197`, `MeetingPage.tsx:175`, `BranchPulse.tsx:84`, `AccountsAdmin.tsx:98` |
| D8 | Lịch Test: gom "Tuần này" và Chi nhánh vào nút "Lọc ▾"; dải số rút về một hàng | `web/src/modules/test/LichTestTab.tsx:210-230` |
| D9 | Thanh dưới điện thoại có biểu tượng mảnh 20 px và vạch chỉ báo mục đang chọn; Tổng quan GV có lối tắt "Học viên cần hỗ trợ (n)" ở đầu trang | `web/src/App.tsx:44-53`, `web/src/modules/worklist/ViecCuaToi.tsx` |

---

## Gói UX-E — Nhất quán và bàn phím · ƯU TIÊN 5

**Model:** Sonnet 5 · High · **phương án B:** Fable 5.1 · Medium.

| # | Việc | Chỗ sửa |
|---|---|---|
| E1 | Chỉ còn một khung panel `KhungPanel` (bỏ kiểu `Drawer`: Thêm HV, Tạo lớp, Lịch kiểm tra, Lộ trình lớp, Chuyển tiếp lớp, panel Lộ trình của HV) | `web/src/ui/Drawer.tsx`, `web/src/ui/KhungPanel.tsx` và các panel kể trên |
| E2 | Panel: nhận focus khi mở, giữ focus bên trong, trả focus về chỗ cũ khi đóng. Menu ⋯: mở thì focus vào mục đầu, ↑/↓ để di chuyển, Esc/Tab để đóng và trả focus | `web/src/ui/KhungPanel.tsx:49`, `web/src/ui/Drawer.tsx:16-27`, `web/src/ui/MenuDong.tsx:120-140` |
| E3 | Esc đóng Thông báo, menu tài khoản, danh sách tìm; tìm kiếm dùng mũi tên; không có kết quả thì hiện "Không tìm thấy học viên"; thêm liên kết "Bỏ qua tới nội dung" | `web/src/modules/platform/Header.tsx:32-106`, `web/src/App.tsx:83` |
| E4 | Chữ tối thiểu 12 px, màu `slate-400` cho kết quả, hạn, trạng thái (máy dò đếm được `text-[10px]` ×67, `text-[10.5px]` ×17); `Nhan` tối thiểu 11,5 px | `web/src/ui/Nhan.tsx:27`, `web/src/modules/cases/SkillBoard.tsx:230-557`, `web/src/App.tsx:85`… (quét `text-\[10`) |
| E5 | Căn số một kiểu trong mọi lưới (căn phải); Lịch Test: bảng Nợ và bảng lớp dùng chung độ rộng ba cột đầu; ô chỉ đọc hiển thị như chữ, không có viền; "— (—)" → "—" | `web/src/modules/cham/LuoiFT.tsx:106-131, 254-279`, `test/lichTest/KhoiNo.tsx:86-91`, `test/lichTest/HangLop.tsx:124-126`, `ScoreEntry.tsx:321-322, 408-418` |
| E6 | Một kiểu tab cho tab trang (gạch chân) và một kiểu cho bộ lọc (nút đoạn) | `web/src/ui/HangTab.tsx` và các nơi dùng viên bo |
| E7 | Tách nghĩa từ ngữ: "Thiếu 2 thông tin" và "dưới kỳ vọng: L 5.5"; nút "Lộ trình lớp" → "Tuần khai giảng" (FT) / "Lịch kiểm tra" (lớp thường); "LT1" → "Lộ trình 1" | `shared/domain/hocVienLop.ts:111-116`, `web/src/modules/students/MissingBadge.tsx:33`, `DauTrangLop.tsx:216` |
| E8 | Luật "vắng" thống nhất giữa lưới và màn một lượt; chip điện thoại đếm đúng mẫu số | `web/src/modules/cham/MotKyNang.tsx:131-148`, `ScoreEntry.tsx:393` — **cần trả lời Q6** |
| E9 | Tải font Inter đang khai báo (hoặc bỏ khai báo) để mọi máy thấy cùng một font | `web/src/index.css:70`, `index.html` |

---

## Gói UX-F — Số liệu khớp nhau · ƯU TIÊN 6 (cần trả lời Q1–Q2 trước)

**Model:** Opus 5.5 · High · **phương án B:** Fable 5.1 · High. Đụng định nghĩa chỉ số; đối chiếu `thiet-ke/HOP_DONG_SO_LIEU.md`.

| # | Cặp số lệch (dữ liệu demo 26/09) | Chỗ |
|---|---|---|
| F1 | "14 bài chưa nhập điểm quá hạn" (Cần xử lý) và 38 ở bảng Theo giáo viên | `worklist/KhoiCanXuLy.tsx`, `worklist/BranchPulse.tsx` |
| F2 | Bài tuần W1 OCT bị tính quá hạn vào 26/09 | luật quá hạn nhập điểm (máy chủ) |
| F3 | "13 case SOS chưa xử lý xong" (Báo cáo đơn vị) và "14 Case" (Tổng quan) | `worklist/meeting.ts`, `metrics.ts` |
| F4 | "6 Chưa báo cáo" trong khi bảng có 2 đơn vị → ghi "6 ô chưa báo cáo" | `worklist/MeetingPage.tsx` |
| F5 | Chip "Tất cả 12" và các nhóm cộng lại 14 (Công việc GV) | `congViec/HoTroHocVienTab.tsx`, `shared/domain/congViec.ts` |
| F6 | Bộ lọc Lớp thường/FT không áp cho bảng Theo giáo viên; "Chờ xác minh quá hạn 0" nằm cạnh "3 Case quá hạn xác định nguyên nhân" (đổi tên ô) | `BranchPulse.tsx:84-180`, `MetricTiles.tsx:31-37` |
| F7 | Dòng việc trùng hệt ("Làm PA: Học tutor – Lê Quang Huy" ×2; "MB-FT 101 · MT3" ×2 ở Lịch Test, cần ghi tuần thi) | `/my-work`, `test/lichTest/KhoiNo.tsx:134-139` |
| F8 | Đợt có 2/4 điểm vẫn ghi "Đã lên lịch" (bảng Mock Test trong hồ sơ) | `students/StudentDetailPage.tsx:505-575` |

**Nghiệm thu:** trên cùng một màn, hai con số nói về cùng một tập thì phải bằng nhau. Mỗi số có ghi đơn vị (bài / ô điểm / HV / Case).

---

## Việc P2/P3 còn lại (ghép vào PR nào chạm đúng file đó)

Các mục 🟡 trong bảng chấm `thiet-ke/DANH_GIA_GIAO_DIEN_2026-09-26.md` mục 4, và mục 5 của file đó. Không làm thành PR riêng.
Ví dụ:
- trang đăng nhập (email kiểm tại chỗ, "Bốn nhóm");
- 12 nút lọc ở tab Ý thức lớp;
- ghi chú dài giọng kỹ thuật ở panel Thêm học viên;
- Phân tích mặc định chỉ hiện 4 nhóm cột;
- "Nhắc tất cả" ở Công việc;
- Lưu trữ bỏ lớp mờ 70%;
- breadcrumb ở trang case đầy đủ;
- nút Lưu ở Hồ sơ cá nhân;
- màn một lượt: 5 nút xanh "Sửa điểm" và câu "0/4 kỹ năng" lặp.

---

## Câu hỏi chặn (chủ sản phẩm trả lời trước khi làm mục tương ứng)

| Mã | Câu hỏi | Chặn |
|---|---|---|
| Q1 | "Làm PA … hạn 30/08" là **hạn phải làm** hay **dự kiến kết thúc**? Dự kiến thì có nằm trong "Việc cần làm" không? | A5 |
| Q2 | "Bài chưa nhập điểm quá hạn" đếm theo **bài thi** hay **ô điểm**? | F1, F2 |
| Q4 | Với Quản lý, Lịch Test nhóm theo **giáo viên đang nợ** hay theo **lớp** như hiện nay? | B5 |
| Q5 | Gộp hai badge "chờ xếp lớp" và "chưa có lộ trình tiếp theo"? "Bài chờ chấm" luôn đứng đầu với GV? | B4 |
| Q6 | Môn đã xác nhận vắng có được nhập điểm làm bù trong lưới không? | E8 |
| Q7 | Phân tích có thành mục riêng trên menu của Quản lý không? | (P2, khu Tổng quan) |
| Q8 | Trên điện thoại, cô Hà mở app cần thấy mấy việc (màn "hôm nay 3 việc")? | D9 |

(Q3 về màu SOS đã chốt 26/09, xem đầu file.)

---

## File → mục (để ghép vào prompt UI sắp tới)

Prompt UI mới chạm file nào thì **ghép luôn** các mục tương ứng ở bảng dưới, hoặc ghi rõ lý do không ghép.

| File / thư mục | Mục |
|---|---|
| `web/src/lib/format.ts` | A1, A8 |
| `web/src/ui/KetQuaDot.tsx` | A2 |
| `web/src/ui/ViecTiep.tsx` | A6, B8 |
| `web/src/ui/SoLieu.tsx` · `shared/domain/metrics.ts` | A7 |
| `web/src/ui/ui.tsx` | B3 |
| `web/src/ui/Nhan.tsx` | E4 |
| `web/src/ui/Toast.tsx` | C1 |
| `web/src/ui/KhungPanel.tsx` · `Drawer.tsx` · `MenuDong.tsx` | E1, E2 |
| `web/src/ui/DongThoiGian.tsx` | B7, D5 |
| `web/src/App.tsx` · `platform/Header.tsx` | D6, D9, E3, E4 |
| `students/StudentsPage.tsx` · `BangHocVienLop.tsx` · `shared/domain/hocVienLop.ts` | A2, B4, B8, D2, E7 |
| `students/StudentDetailPage.tsx` · `cases/SkillBoard.tsx` | A2, B1, D3, E4, F8 |
| `students/NganCase.tsx` · `cases/CasePanel.tsx` · `cases/ThaoTacCase.tsx` · `yThuc/CaseSosControls.tsx` | B1, B2, C5, C6 |
| `students/HanhTrinh.tsx` | D4 |
| `students/LoTrinhTiepPanel.tsx` · `classes/TransitionPanel.tsx` · `shared/domain/lenLop.ts` | B9 |
| `students/ClassRoster.tsx` · `classes/BangDiemLopThuong.tsx` | A3, A9, D2 |
| `classes/DauTrangLop.tsx` | B4, E7 |
| `yThuc/StudentYThucSection.tsx` · `yThuc/RecordViolationPanel.tsx` | B7, C6 |
| `worklist/WorkList.tsx` · `KhoiCanXuLy.tsx` · `MetricTiles.tsx` · `BranchPulse.tsx` | A5, B6, F1, F6, D7 |
| `worklist/MgmtTasksPage.tsx` · `MeetingPage.tsx` · `congViec/*` | A8, D7, F4, F5 |
| `test/lichTest/*` · `test/LichTestTab.tsx` | B5, D8, E5, F7 |
| `test/keHoach/NganXepHangLoat.tsx` | C4 |
| `cham/*` · `fasttrack/ScoreEntry.tsx` · `fasttrack/MockDetailPage.tsx` | A4, C2, C3, C9, E5, E8 |
| `platform/AdminPage.tsx` | A7, C7 |
| `server/src/cases/sosAuto.ts` · `signals.ts` | A7 |
| `server/src/cham/canCham.ts` | B5 |
| `server/src/classes/intake.ts` | C10 |
