# GV cũ theo dõi + làm Case bổ trợ sau chuyển lớp — thiết kế ngắn (chủ SP chọn A, 13/11)

## Vì sao
Chủ SP 13/11: "Phải đảm bảo rằng GV cũ của bạn theo dõi được case này và được truy cập hồ sơ của HV, nên vẫn để cho GV cũ nhìn thấy hồ sơ lớp mới, theo dõi và
thực hiện, tất nhiên phần công việc phải có rồi, nhưng đường vào khác cũng phải có … tôi vẫn đang thấy navigate phần này hơi phức tạp." → "Làm A nhé".
Luật có sẵn: PA Bổ trợ miễn phí sau Final, **Người dạy = GV cũ** đúng môn, "người đó ghi tiếp" sau chuyển lớp (`cuoiKhoa.ts:226`).

## Hiện trạng (PTA rà mã 13/11)
- `GET /students/:id` mở được nhờ phân công lớp cũ còn active (mất nếu em đổi chi nhánh).
- `GET /cases/:id` → `kiemXemCase` (`server/src/cases/cases.ts:2293-2304`) đòi `ATTEMPT_VIEW` lớp MỚI → 403; `POST /interventions/:id/result` gọi `caseDetail` trong tx → 403 + rollback
  dù `quyenBoTro` cho ghi. Ghi Mini Test lần đầu đi qua Ngăn Case (`KetLuanKhoa.tsx:170-171`) → 403; cờ `miniTest.coTheGhi` (`profile.ts:814`) ≠ `ghiDuocPaMany` (`cases.ts:4839-4853`).
- Hồ sơ lớp mới `/classes/:id/overview` → 403.
- Công việc: việc Ghi kết quả PA / Ghi Mini Test giữ bởi GVCN lớp mới (`giuKetQua.ts:30`, `mywork.ts:967-985, 1339-1348`); GV cũ không dòng, không chuông.
- Hồ sơ lớp cũ chưa kết thúc: roster chỉ `active` → em đã chuyển biến mất (`classes.ts:362`). Hồ sơ GV không có lối.

## Cách làm (A — chủ SP chọn)
Đã cân nhắc: B (chỉ sửa 403 + dòng Công việc, không xem lớp mới) — thiếu ý chủ SP; C (phân công tạm "Bổ trợ" ở lớp mới) — sai lệch phân công, Phân tích GV, sổ nghĩa vụ, % tuần thi thật.

1. **Quyền tạm "người dạy bổ trợ"**: khi user là `performer` của một PA `bo_tro_mien_phi` ĐANG CHẠY của em → được `STUDENT_VIEW` em đó, xem + ghi Case chứa PA đó (`kiemXemCase` / `ghiDuocPaMany` cùng luật), và `ATTEMPT_VIEW` CHỈ XEM hồ sơ lớp hiện tại của em. Hết khi PA kết thúc / Mini Test chốt / PA huỷ. Không mở quyền sửa nào khác (vi phạm, điểm, lớp…). Chuyển chi nhánh vẫn giữ trong thời gian PA.
2. **Công việc**: người giữ việc "Ghi kết quả bổ trợ" + "Ghi Mini Test" = **Người dạy** (GV cũ); GVCN lớp mới thấy dòng theo dõi "Chờ GV {tên} …" và làm thay được (luật làm thay hiện có). Thẻ Báo QL khi Mini Test < 70 % giữ như cũ. Chuông cho GV cũ khi PA bắt đầu / mang sang lớp mới.
3. **Lối vào khác** (đều dẫn về hồ sơ HV, nơi có ô Mini Test + Case):
   - Hồ sơ lớp cũ: em đã chuyển còn hiện "Đã chuyển · đang bổ trợ ›" khi còn PA bổ trợ của GV xem (kể cả lớp cũ chưa kết thúc).
   - Hồ sơ GV: mục "Em đang bổ trợ" (em · lớp mới · buổi n/m · hạn Mini Test).
   - Ô tìm kiếm (đã có).
4. **Sửa lỗi 403**: ghi Kết quả PA / Mini Test lần đầu của người dạy chạy được; cờ nút cùng một hàm.

## Ràng buộc
Không đổi bố cục màn (thêm dòng / mục theo mẫu sẵn có → không cần mockup). Turso: không thêm request khi mở trang; điều kiện quyền đọc trong cùng câu phiên / câu
Case sẵn có; đo trước → sau. Phép kiểm: GV cũ xem / ghi được; GV khác (không performer) vẫn 403; hết PA → hết quyền; chỉ xem lớp mới (mọi POST lớp mới 403).
`/security-review` (đổi quyền).
