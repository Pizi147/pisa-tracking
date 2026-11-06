# XOA-MT (PR a) — Xoá MT một kiểu, đồng bộ Kế hoạch Test ↔ hồ sơ MT (chủ SP 06/11)

Lời chủ SP: "Hồ sơ MT vẫn cần thao tác để xóa MT nhé, và việc 'bỏ khỏi đợt' với xóa tại sao phải khác nhau vậy? … nó ẩn hẳn luôn không cho bấm gì nữa ở kế hoạch test … ở Kế hoạch test hay hồ sơ MT (cái lớn hơn - PHẢI CÓ ĐỦ TÍNH NĂNG), các tính năng phải đồng bộ chứ. Và đừng để nó xóa ẩn hẳn đi nhìn rất ngứa mắt".
Không có mockup mới: thêm chữ / nút theo mẫu sẵn có (ô khung đứt như "Đã huỷ", dải mảnh như dải "Đã huỷ" của hồ sơ MT, mục ⋯ sẵn có) — `plan.md` 1.3b. Phông đã kiểm `document.fonts.check('600 14px "Be Vietnam Pro"') === true` ở mọi ảnh.
Dữ liệu demo 18/09: QL Phạm Quang Anh (Hải Dương), lớp HD FT 306, em Quách Tuấn Kiệt, MT3 (W1 OCT) — bốn kỹ năng đã "Bỏ khỏi đợt" bằng đường cũ.

## Hiện trạng đã kiểm (trước PR)

| Thao tác | Kế hoạch Test | Hồ sơ MT | Máy chủ | Sau khi làm |
|---|---|---|---|---|
| "Bỏ khỏi đợt" một môn | hộp một đợt: nút thứ ba trên dòng môn (bật / tắt, lưu cùng Lưu) | ⋯ dòng kỹ năng → hộp hỏi | `/ke-hoach-test/dot {bo}` hoặc `/skills/:k/skip` → `required = 0`, tuần giữ; có điểm → 409 rồi cất điểm | môn mờ trong ô; hồ sơ "Ngoài phạm vi" + "Không học" |
| "Bỏ khỏi đợt" cả 4 môn | như trên, từng môn | như trên, từng môn | như trên | **Kế hoạch Test: ô thành "—", không bấm được gì** (`oGon` null → `OTrong`); hồ sơ: "Đã huỷ" + menu "Đưa lại cả 4 kỹ năng" |
| "Xóa lịch" cả lượt | ⋯ đầu hộp → hỏi trong hộp → Hoàn tác | **không có trên trang** (chỉ khi mở hộp "Dời lịch cả đợt" rồi ⋯) | `/attempts/:id/bo-tuan` (QL / Admin / Quản trị; GVCN khi công tắc #1064 bật): kỹ năng về Chưa xếp; chặn có điểm / đã thi / đề nghị dời chờ | ô "Chưa xếp tuần" |
| "Đưa lại cả 4 kỹ năng" | không có | ⋯ "Chỉnh lịch" khi huỷ hết | `/dua-lai-ca-luot` (chỉ QL — `attempt.skip_skill`) | — |

## Sau PR — một thao tác "Xoá"

| Thao tác | Kế hoạch Test | Hồ sơ MT | Máy chủ |
|---|---|---|---|
| **Xoá MT{n}** (cả MT) | ⋯ đầu hộp một đợt | ⋯ "Chỉnh lịch" (cuối, vạch đỏ; bị chặn thì dòng phụ nói lý do) | `POST /attempts/:id/xoa` (`xoaLuot`): mọi kỹ năng bắt buộc `required = 0`, **tuần giữ**; một tx; quyền `requireSuaLichTest` (= "Xóa lịch" cũ); N15 qua `setSkillScope`; chặn có điểm / đã làm bài (như "Xóa lịch" cũ) |
| Sau khi xoá | ô **mờ khung đứt "Đã xoá" + "Khôi phục"** ngay dưới (bấm được ngay); bấm ô vẫn mở hộp; toast **Hoàn tác** | dải mảnh **"Đã xoá · ai · ngày" + "Khôi phục MT{n}"**; Overall "Đã xoá"; dòng kỹ năng "Đã xoá" + nút "Khôi phục"; toast Hoàn tác | — |
| **Khôi phục MT{n}** | "Khôi phục" dưới ô · ⋯ đầu hộp | nút trên dải | `POST /attempts/:id/dua-lai-ca-luot {kyNang?}`: tuần cũ còn hợp lệ thì giữ, vướng thứ tự đợt → Chưa xếp; Hoàn tác gửi `kyNang` = đúng các môn vừa xoá; môn "Không học (môn đăng ký)" không bao giờ bị đưa lại |
| **Xoá** một môn (tên cũ "Bỏ khỏi đợt") | nút thứ ba trên dòng môn; môn đã xoá → chữ đổi "**Khôi phục**" | ⋯ dòng kỹ năng "Xoá" (có điểm: "Xoá cả điểm") | như cũ (`attempt.skip_skill`) |
| **Khôi phục** một môn | nút "Khôi phục" trên dòng (lưu cùng Lưu) | nút chính "Khôi phục" một bấm; "Dời lịch" vẫn trong ⋯ | `/skills/:k/skip {skipped:false}` |
| Ghi chú lịch Test | trong hộp | **thêm**: hộp mở từ hồ sơ MT nay có ô ghi chú (đọc ghi chú hiện tại lúc bấm, một câu) | như cũ |

Lớp thường giữ nguyên "Xóa lịch" (về Chưa xếp, có hỏi lại): lớp thường không bỏ môn được (Q3), nên không dùng chung tên "Xoá" cho một hành vi khác.

## Ảnh trước | sau

| Nơi | 1440 tối | 375 sáng |
|---|---|---|
| Kế hoạch Test HD FT 306 (MT3 Quách Tuấn Kiệt) | `truoc-kht-1440.png` · `sau-kht-1440.png` | `truoc-kht-375.png` · `sau-kht-375.png` |
| Hồ sơ MT3 (đã xoá) | `truoc-hoso-1440.png` · `sau-hoso-1440.png` | `truoc-hoso-375.png` · `sau-hoso-375.png` |
| Hộp một đợt (MT đã xoá — ⋯ Khôi phục, dòng môn "Khôi phục") | `sau-hop-1440.png` | — |
| Hồ sơ MT chưa xoá — ⋯ "Chỉnh lịch" có "Xoá MT{n}" | `sau-hoso-menu-1440.png` | — |
| Bấm thử: Khôi phục ở lưới → ô về W1 OCT · Xoá ở hồ sơ → dải + toast Hoàn tác (Hoàn tác đưa lại đủ 4 môn) | `sau-kht-khoi-phuc-1440.png` · `sau-hoso-vua-xoa-1440.png` | — |

375 Kế hoạch Test: thẻ mỗi em chỉ hiện MT kế tiếp chưa xong (ở ca demo là MT2), nên ảnh 375 trước / sau giống nhau; khi MT kế tiếp là MT đã xoá, thẻ hiện "Đã xoá" + Khôi phục (mã `LuoiKeHoach` nhánh điện thoại).

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Bỏ một môn khỏi MT | "Bỏ khỏi đợt" | "Xoá" (cùng hành vi, cùng chỗ) |
| Đưa một môn lại | "Dời" (chọn tuần) | "Khôi phục" một bấm (tuần cũ) **hoặc** "Dời" (chọn tuần) |
| Xoá cả MT ở Kế hoạch Test | "Xóa lịch" → về Chưa xếp | "Xoá MT{n}" → "Đã xoá" + Khôi phục (tuần giữ) |
| Xoá cả MT ở hồ sơ MT | chỉ qua hộp "Dời lịch cả đợt" → ⋯ | ⋯ "Chỉnh lịch" › "Xoá MT{n}" thẳng (hộp vẫn có) |
| Khôi phục cả MT | hồ sơ: "Đưa lại cả 4 kỹ năng" (QL); Kế hoạch Test: không có (ô "—") | cả hai nơi: "Khôi phục" (người xoá được) |
| Hoàn tác | "Xóa lịch" có | Xoá MT có (đúng các môn vừa xoá) |
| **Đưa MT về "Chưa xếp" (bỏ tuần, giữ lượt) — FT** | "Xóa lịch" | **bỏ** — lý do: một thao tác "Xoá" (chủ SP); tuần giữ để Khôi phục; muốn đổi tuần → Dời. [XM-1] |

## [XM] chờ PTA Plan

1. **"Xóa lịch → Chưa xếp" của FT không còn** (thay bằng Xoá → "Đã xoá"). 57 lượt MT "chưa xếp" cũ trên bản sao 29/10 không đổi dữ liệu. Nếu vẫn cần "bỏ tuần, giữ lượt" cho FT thì thêm lại dưới tên khác (vd "Bỏ tuần").
2. **Quyền**: Xoá / Khôi phục cả MT = quyền "Xóa lịch" cũ (QL · Admin · Quản trị; GVCN lớp đó khi công tắc #1064 bật). Vì thế "Khôi phục cả MT" (trước là "Đưa lại cả 4 kỹ năng", chỉ QL) nay **Admin cũng làm được** — để ai xoá được thì khôi phục / Hoàn tác được. Xoá / Khôi phục **một môn** giữ `attempt.skip_skill` (chỉ QL, OV-10a).
3. **Không hỏi lại khi Xoá MT** (cả hai trang): ô vẫn ở đó + Khôi phục + Hoàn tác — theo CLAUDE.md "xác nhận chỉ khi hậu quả lớn"; khác mockup OV-15c mục 6 (hỏi trong hộp). Lớp thường giữ hỏi.
4. **Thùng rác N28**: Xoá MT không xoá dòng nào (chỉ `required = 0`) nên không vào Quản trị › Đã xoá — khôi phục ngay tại ô / hồ sơ, lịch sử ở "Lịch sử lượt" (nhật ký `skill_skipped` / `skill_restored`). Muốn có cả ở Đã xoá thì PR riêng.
5. Chặn Xoá cả MT khi **đã có điểm / đã làm bài** giữ như "Xóa lịch" cũ (xoá điểm theo T22, hoặc Xoá từng môn — có "Xoá cả điểm").
6. Hộp Kế hoạch Test chưa phân biệt môn "Không học (môn đăng ký)" với môn đã xoá (dòng ghi "Đã xoá", nút "Khôi phục" như nút "Bỏ khỏi đợt" cũ bật lại được) — hồ sơ MT và máy chủ đã phân biệt. Sửa cần thêm cờ vào dữ liệu lưới; để sau nếu PTA thấy cần.

## Dữ liệu thật (bản sao `D:\pisa-mig\mig.sqlite` 29/10, chỉ đọc)

Không migrate, không đổi dữ liệu. Ảnh hưởng hiển thị: **1** lượt MT đang "—" (mọi môn bỏ khỏi đợt) sẽ hiện "Đã xoá" + Khôi phục · 14 lượt có môn bỏ khỏi đợt (chữ đổi "Đã xoá") · 8 lượt "đã huỷ" cũ giữ ô "Đã huỷ" · 57 lượt chưa xếp giữ nguyên.

## Turso

Không thêm câu ở đường GET: ô "Đã xoá" dùng dữ liệu lưới đã nạp. Hồ sơ MT: mở hộp lịch thêm **một** câu đọc ghi chú (`/ke-hoach-test/ghi-chu/lich-su`, ≤ 50 dòng của một em × một MT) — chỉ khi người dùng bấm. Đường ghi `/attempts/:id/xoa` ≈ 4 × `setSkillScope` (như "Bỏ khỏi đợt" 4 môn cũ).
