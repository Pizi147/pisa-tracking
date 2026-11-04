# Luật Mock Test thống nhất — vắng, dời, huỷ, chấm (N38 · N39)

Chủ SP 05/11 (duyệt hướng trong chat PTA Plan: "Tạm ổn … nếu ok rồi thì làm đi"). Thay phần "-" / vắng / huỷ của OV 11/10, T3, T21 và các nút
Khôi phục / Giữ huỷ / Đưa lại vào đợt. Không đổi luật nào khác.

## 1. Vì sao

Chủ SP: "luật đang rất loạn, không thể hiểu nguyên lý hoạt động". Rà mã 05/11 (`server/src/fasttrack/absence.ts`, `skillSchedule.ts`,
`attempts.ts`, `HopKyNang.tsx`, `mywork.ts`, `PanelViec.tsx`) thấy: dời tay không xoá lần vắng (dời kỹ năng đang vắng còn +1); vắng vẫn có lúc
sinh thẻ / chuông cho QL; ba kiểu huỷ chung nút; hai nút "Khôi phục" và "Đưa lại vào đợt" trông giống nhau mà kết quả khác; "MT cũ" tính theo
cả lượt; việc chấm vẫn ghi "MT1, MT4" và có đường mở panel theo đợt, hiện cả lớp.

**Đầu ra mong muốn:** người dùng đoán trước được web làm gì chỉ từ 3 câu: *gõ "-" là dời sang tuần sau; vắng 2 lần là huỷ; chọn tuần là xếp lại
từ đầu.* Chấm Mock theo tuần + lớp, chỉ thấy em có bài.

**Không làm (anti-goal):** thêm nút, trạng thái, thẻ, việc, chuông, hộp hỏi lại. Đổi luật SOS / Case / hạn chấm / MT0 / N15.

## 2. Luật (Mock Test FT)

| # | Luật | Thay cho |
|---|---|---|
| L1 | **Gõ "-" (hoặc "Vắng") ở một kỹ năng** = vắng lần này, chốt ngay. Lần 1 → kỹ năng tự dời sang **tuần ngay sau TUẦN THI của kỹ năng đó** (không theo tuần hiện tại). | giữ OV 11/10, sửa tuần đích |
| L2 | **Vắng lần 2** (tính từ lần xếp tay gần nhất) → kỹ năng **huỷ**, nhãn "Huỷ · vắng 2 lần". **Không** chuông, thẻ, việc, nhắc, "Xin dời". Kỹ năng huỷ = **đã xong (thiếu)**: không chặn đợt hoàn tất (`completionWeekOf`), không thành việc "chưa xếp" ở đâu cả. | T3, chuông `huy_vang`, `xinDoi`, nút "Giữ huỷ" |
| L3 | **Gõ "-" ở MT cũ** = "Không dự thi" (T23): nhãn "Không dự thi" (bỏ nhãn "Đã huỷ · vắng MT cũ"), **không chuông** (bỏ `baoHuyVangCu`), không tính lần vắng, không dời, đã xong (thiếu). **MT cũ xét theo TỪNG KỸ NĂNG**: tuần thi của kỹ năng đó cách tuần hiện tại ≥ 2 tuần — áp cả lượt nhập lịch sử (`lich_su`): kỹ năng tuần gần thì "-" dời như L1. Chỉ dùng cho việc xử lý "-"; định nghĩa MT cũ của cả lượt ở chỗ khác (hạn chấm, Case 4 tuần, T1) giữ nguyên. | nhãn huỷ MT cũ, chuông |
| L4 | **"-" không bao giờ sinh thẻ chờ QL.** Nhờ L3, tuần đích ở L1 luôn là tuần này hoặc tuần sau. Vướng MT0 ↔ MT1 hay trùng MT khác → vẫn dời, chỉ cảnh báo như dời tay. | thẻ "Dời lịch Test" lần 1 |
| L5 | **Chọn tuần cho kỹ năng (dời tay / xếp lại)** = xếp lại từ đầu: lần vắng về 0 (`absence_move_count = 0`), dấu "-" cũ xoá, kỹ năng huỷ / bị bỏ khỏi đợt / chưa xếp đều về "đã xếp" tuần đó. **Chọn đúng tuần đang có cũng hợp lệ** (vẫn tính là xếp lại). Thẻ dời cũ đang chờ của kỹ năng đó **tự rút** (`rutDeNghiDoi`), không chặn. SOS: như "Khôi phục" hôm nay — đợt chờ điểm mới (SOS tạm), Case đã có giữ nguyên. Quyền + khoá giữ như dời tay hiện nay (T4 tuần đã qua chỉ QL, N23 GVCN MT cũ, N15 T6–CN). | "Khôi phục → Chưa xếp", "Đưa lại vào đợt", T21 |
| L6 | **Bỏ khỏi đợt** (kỹ năng không thi trong đợt, `required = 0`) giữ. Muốn đưa lại → chọn tuần (L5). Kỹ năng huỷ không cần nút "Giữ huỷ" — nó đã huỷ. | "Giữ huỷ" / "Không mock lại" (nút) |
| L7 | **Xoá dấu "-" đã chốt** ("Bỏ vắng", PR-BV) giữ như nay (trả về tuần gốc, trừ một lần vắng, Hoàn tác). | — |

**Hộp kỹ năng (U05, chủ SP 05/11 "có nút riêng cho từng môn"):** mỗi kỹ năng chỉ ba thao tác — **Dời** (chọn tuần = L5) · **Vắng** (= "-", L1–L3)
· **Bỏ khỏi đợt** (L6). Dùng chung `HopKyNang` ở Kế hoạch Test và Hồ sơ HV › Lộ trình. Bỏ hẳn nút "Khôi phục → Chưa xếp", "Giữ huỷ",
"Đưa lại vào đợt", "Xin dời", "Xếp lại bài vắng" trên web (đường máy chủ cũ còn được gọi thì trả về như L5, hoặc gỡ nếu không nơi nào dùng).

**Huỷ cả lượt / Khôi phục lượt** (lượt-level, điểm cất ẩn) **không đổi** — khác khái niệm, khác chỗ.

## 3. Lớp thường

Chỉ đổi tuần đích của "-": **tuần ngay sau tuần thi** (như L1). Giữ: vắng bao nhiêu lần cũng không huỷ; ≥ 2 tuần = Không dự thi.

## 4. Chấm Mock theo tuần + lớp (N39)

- **Việc chấm** (`mywork.ts` `gomBaiChuaCham`, việc gộp "Chấm Speaking" chéo): **giữ cách gom như nay** (lớp + tuần thi + người; việc Chấm
  Speaking chéo gộp như chủ SP 18/10). Chỉ đổi nhãn dòng con: "Speaking · W3 OCT · 2 bài" — **bỏ danh sách "MT1, MT4"** (`contextLabel`
  `mywork.ts:612,634`).
- **Panel nhập điểm từ việc** luôn mở theo **tuần + lớp** (`PanelNhapDiemTuan` / lưới tuần), **chỉ các em có bài** tuần đó (kể cả bài đã chấm
  của tuần đó để sửa). Không còn đường mở panel theo đợt MT hiện cả lớp. Nút "Cả lớp" (thao tác cũ) giữ, không mặc định.
- Một hàng = một lượt như nay (một em hiếm khi có hai lượt cùng tuần; có thì hai hàng, nhãn MTn nhỏ trong hàng).
- Lịch Test / Điểm theo lớp / Kế hoạch Test: **không đổi bố cục** trong đợt này.

## 5. Ràng buộc kỹ thuật (đã kiểm xung đột)

1. **Một số đếm, không cờ mới.** `absence_move_count`: L1 +1 · L5 = 0 · L7 −1 (như nay). `applyMove` của L1 đang ghi `plan_source='manual'` —
   không dựa vào `plan_source` để phân biệt. SOS (`kyNangXongThieu`) và nhãn "vắng W3" (`oMt.ts:203` `daDoi`, `attempts.ts:534`,
   `keHoachTest.ts:380,495`) đọc số này như nay → sau L5 đợt về SOS tạm, nhãn vắng mất (lịch sử vẫn ở dòng thời gian). Đây là hành vi
   "Khôi phục" hôm nay, mở rộng cho mọi lần xếp tay. Case đã có không đóng / mở.
2. **Thẻ "Dời lịch Test" cũ đang chờ trong DB:** không tạo mới; thẻ cũ vẫn đọc / duyệt / từ chối được như nay (không migrate dữ liệu thẻ).
   Nhánh "-" sinh thẻ (`absence.ts` ~286–315, kể cả khi vướng `checkSkillWeekMove`) **xoá hẳn**: vướng thì vẫn dời + cảnh báo.
   Hàng cũ đang `absent` chờ QL / `huy_vang = 1` hiện trong hộp 3 nút như kỹ năng huỷ / vắng thường (Dời = L5).
3. **N15 khoá cuối tuần:** "-" vẫn được miễn (là ghi nhận, không phải xếp lịch); dời tay vẫn khoá như nay.
4. **Turso:** không thêm câu khi mở trang; panel tuần đọc đúng lớp + tuần (`/classes/:id/cham?periodId`), không đọc theo đợt cả lớp.
5. **Đổi dữ liệu em thật:** chỉ ở mức tương lai (luật áp từ lần gõ / dời sau deploy). Em đang có kỹ năng `scheduled` với số vắng = 1 sau một lần
   dời tay → theo L5 lẽ ra là 0: PR kèm **SQL chỉ đọc** đếm số em như vậy; PTA báo chủ SP trước merge nếu > 0.
6. Hướng dẫn (`shared/huongDan/*`), chú thích luật trong mã, test cũ nói "Khôi phục / Giữ huỷ / Xin dời / vắng lần 2 thẻ" → sửa theo luật mới.

## 6. Chia PR

- **PR-MT-VANG** (luật L1–L7 + lớp thường + hộp kỹ năng 3 nút): `absence.ts`, `skillSchedule.ts`, `attempts.ts` (nhánh `noShow`),
  `normal/regular.ts`, `shared/domain/vang.ts`, `lichMt.ts`, `oMt.ts`, `thaoTacMt.ts`, `HopKyNang.tsx`, Hướng dẫn, test.
- **PR-MT-CHAM** (mục 4): `mywork.ts` (`gomBaiChuaCham`, chấm chéo), `PanelViec.tsx`, `LuoiNhung` / `LuoiChamLop` nếu cần lọc, test.
- Hai PR không sửa chung tệp; làm song song.

## 7. PTA chốt sau rà xung đột (05/11, không cần hỏi lại chủ SP — suy từ "vắng 2 lần thì huỷ, đừng hỏi lại, đừng yêu cầu xếp lại")

MT cũ "-" = "Không dự thi", không chuông · MT cũ theo tuần từng kỹ năng, áp cả `lich_su` · L5 như "Khôi phục" hôm nay về SOS (không cờ mới) ·
kỹ năng huỷ = đã xong, không chặn đợt · L5 tự rút thẻ cũ đang chờ · thẻ cũ bị từ chối / hết hạn vẫn chạy luồng cũ (chỉ cho thẻ còn sót) ·
việc chấm giữ cách gom, chỉ đổi nhãn + panel chỉ em có bài.

## 8. Để builder quyết

Cách tách số đếm (mục 5.1) · gỡ hay giữ đường máy chủ cũ không còn web gọi · tên nhãn ngắn trong hộp kỹ năng (theo mẫu chữ sẵn có) ·
vị trí cảnh báo khi dời trùng / vượt MT khác (dùng cảnh báo dời tay sẵn có).
