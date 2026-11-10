# Chuông V2 — recon (11/11, main d8b3490 + #1363 đang mở)

## Hiện trạng đã kiểm (đọc mã)

- Máy chủ: `GET /notifications` = `dongBoKhiMoChuong` (tối đa 1 lần / 5 phút / người: tính lại `myWork` 3 nhóm + Case của người đó, ghi / xoá
  4–5 loại thông báo tự động) rồi `thongBaoCua` (≤ 50 dòng, chưa đọc trước, + ≤ 20 dòng Cần làm đã đọc; mỗi dòng nối 9 bảng để biết `con_viec`).
  Trần `tocDoDuong`: QL / GVCN / GVBM 13 câu, QT 25 câu; dòng 66–449.
- Web (`Header.tsx`): tải `/notifications` khi tab hiện lần đầu + MỖI lần bấm mở chuông. Hai nhóm Cần làm / Để biết, mỗi dòng 3–4 dòng chữ
  (tiêu đề · thân · hạn · "bấm tới đâu ›"). Số trên chuông = tin CHƯA ĐỌC (DESIGN V13) — khác số việc của Công việc.
- `/my-work` (đủ `dong` + `summary`) ĐÃ được App tải sẵn cho badge Công việc ở mọi vai có `workSupport` (GV, QL, QT, Admin, TVV) — chuông V2 đọc
  lại bản đó (`useApi(..., { chiNghe: true })`), **0 request thêm**. QL / QT duyệt: `/yeu-cau/dem` cũng đã tải sẵn ở App.

## Vì sao rối (đối chiếu lời chủ SP 11/11)

1. Một việc = một dòng thông báo 3–4 dòng chữ; 20 việc = 70 dòng chữ, không thấy "bao nhiêu việc, ở đâu".
2. Số chuông = tin chưa đọc ≠ số việc → hai con số trên thanh trên, không khớp Công việc.
3. Cần làm chỉ có việc NÀO phát thông báo (5 loại tự động + vài loại sự kiện); việc khác (Mô tả Case, Ghi KQ PA, Ý thức…) không có → thiếu trọng tâm.
4. Dòng Cần làm đã xong rơi xuống Để biết (vẫn đọc như việc), "bấm tới đâu" lặp ở mọi dòng.

## Bảng loại tin

Cột "Sau": **Việc** = không còn là dòng riêng, việc đó nằm trong số đếm của dòng loại việc (nguồn `/my-work` — cùng Công việc); **Để biết** = dòng nhẹ ở khối dưới;
**Bỏ** = không hiện ở chuông (lý do).

| Loại tin (`kind`) | Ai nhận | Hiện nay | Sau | Lý do |
|---|---|---|---|---|
| `cham_qua_han` (tự động) | GV có bài quá hạn | Cần làm | Việc · Nhập điểm | đã có trong `/my-work` (score) |
| `case_chua_chot_pa` (tự động) | GV phụ trách Case | Cần làm | Việc · Xác nhận PA / Thêm PA | đã có (`xac_nhan_pa`, `no_plan`) |
| `chot_lo_trinh` (tự động, 3 mốc N20) | QL | Cần làm | Việc · Chốt lộ trình | đã có (`chot_len_ft`, #1349); mốc T2 / T5 / T6 → "hôm nay" / "quá hạn" trên dòng |
| `bao_ph_xu_ly` (tự động) | TVV / QL | Cần làm | Việc · Báo PH vi phạm | đã có (`bao_ph_yt`) |
| `xuat_bc_ph_qua_han` (#1363) | Admin | Cần làm | Việc · Xuất báo cáo PH | đã có (`xuat_bc_ph`) |
| `case_giao` | người phụ trách Case | Cần làm tới khi có PA | Việc · Thêm PA | đã có (`no_plan`) |
| `sos` / `sos_new` (Case) | GV phụ trách | Cần làm tới khi có nguyên nhân | Việc · Mô tả / Xác nhận Case | đã có (`ghi_nhan_xet`, `cause`) |
| `discipline` (vi phạm mới) | GVCN | Cần làm | Việc · Ý thức | đã có (`yt_xu_ly`, `yt_xem`) |
| `phoi_hop` (Báo PH qua TVV) | TVV | Cần làm | Việc · Báo phụ huynh qua TVV | đã có (`phoi_hop`) |
| `lam_lai_ban_giao` | GV lớp cũ | Cần làm (đọc → Để biết) | Việc · Bàn giao | đã có (`ban_giao` mở lại) |
| `nhan_xet_speaking` | GV S phụ trách | Để biết | Việc · Xác nhận Case Speaking | đã có (`xem_nx_s`); hết việc → không cần tin |
| `duyet_moi` · `duyet_qua_han` | QL / QT duyệt | Cần làm | Việc · Duyệt yêu cầu | số từ `/yeu-cau/dem` (`cho`, `quaHan`) đã tải |
| `dang_ky` | Quản trị | Cần làm | Việc · Duyệt tài khoản | không có trong `/my-work` → đếm dòng `con_viec = 1` của `/notifications` |
| `schedule_move` | QL | Cần làm khi còn chờ | Việc · Duyệt dời lịch (nếu còn) | N38 bỏ "Xin dời" — còn dòng cũ thì đếm như `dang_ky` |
| `bao_len` (Báo QL) | QL | Cần làm | Để biết | thẻ "chỉ để biết — bấm Mở" (`kieuNut = nhac`), hộp Chờ duyệt để ở nhóm Để biết |
| `duyet_ket_qua` · `duyet_tu_choi` · `duyet_tu_duyet` | người xin | Để biết / Cần làm (từ chối) | Để biết | lời chủ SP: "QL duyệt / từ chối đề xuất của mình" — từ chối hiện chữ "Từ chối", bấm → Yêu cầu của tôi sửa gửi lại |
| `transfer_in` · `sap_nhan` · `ban_giao` · `ban_giao_gv` · `bo_tro_mien_phi` | GV lớp mới | Để biết | Để biết | em mình dạy vừa chuyển / sắp nhận / có bàn giao |
| `huy_lenh` · `lenh_loi` · `phan_cong_loi` · `buoc_tiep_loi` | người ra lệnh | Để biết / Cần làm | Để biết | lỗi của chính thao tác mình — cần biết, không thành việc |
| `doi_lich_lop` · `doi_lich_thuong` · `tu_doi_lich` | GVCN / GV lớp | Để biết | Để biết | luật T11: người khác dời → một chuông cho GVCN |
| `phan_cong_gvcn` · `phan_cong_moi` | QL / GV được nhận | Để biết | Để biết | đổi người dạy / nhận lớp |
| `case_dong_gv` | QL chi nhánh | Để biết | Để biết | QL theo dõi Case đóng |
| `discipline_de_biet` | QL / GVCN | Để biết | Để biết | Báo PH để biết |
| `sos` gắn lượt (`assessment_attempt`) | GVCN | Để biết | Để biết | em lớp mình SOS — việc (nếu của mình) đã ở khối trên |
| Dòng việc ĐÃ XONG (`con_viec = 0` của loại việc) | — | rơi xuống Để biết | **Bỏ** | việc xong không nơi nào còn báo (CLAUDE.md); lịch sử ở nhật ký |

Không bỏ tin nào có việc; chỉ bỏ dòng việc đã xong và dòng việc trùng (đã đếm ở khối Việc cần làm).

## Dòng đọc (ước, đo thật ở bước code)

| | Trước | Sau |
|---|---|---|
| Mở chuông | `GET /notifications` mỗi lần bấm: 13 câu (QT 25), tới 5 phút / lần thêm `myWork` 3 nhóm | Khối việc: 0 request (bản `/my-work` đã có). Để biết: `GET /notifications?de-biet` ≤ 20 dòng, không đồng bộ, không nối 9 bảng `con_viec` |
| Đồng bộ thông báo tự động | `dongBoKhiMoChuong` + `dongBoSauMyWork` | Bỏ được (chuông không đọc dòng tự động nữa) — giảm ghi + đọc; giữ bảng `notifications` cho tin sự kiện |
| Số trên chuông | tin chưa đọc (cần `/notifications` mỗi trang) | số việc từ `/my-work` đã tải |
