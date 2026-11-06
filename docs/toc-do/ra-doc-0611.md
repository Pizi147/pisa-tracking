# RA-DOC-0611 — rà tốc độ / dòng đọc Turso (06/11)

Chủ SP 06/11: "có thể cải thiện tốc độ hay giảm dòng đọc hay không". Cách đo như DOC-IT 02/11 (`doc-it-0211.md`): `tocDo.run` ghi mọi câu của 716 (vai × đường),
`scripts/do-it.py` chạy lại trên DB ×3 (≈ 0,5–1 lần bản chính) đếm **bước máy ảo** (xếp hạng) và **dòng quét cả bảng** (Turso tính hết).
Turso tính dòng đọc (cả dòng chỉ mục) — không đo đúng đơn vị đó được trên máy này (sqld chỉ bản Linux); "dòng trả + dòng quét cả bảng" là cận dưới.

## Cách chạy lại

```bash
npm run build:server
PISA_IN_JSON=<thư mục>/json.json PISA_IN_DO=<thư mục>/in-do.json PISA_DO_IT=<thư mục>/x3 node dist-server/server/src/tests/tocDo.run.js
python -I scripts/do-it.py <thư mục>/x3
```

`PISA_IN_JSON` (mới, PR này): ghi [mã, JSON] mọi (vai × đường) ở lượt ×1 — so trước / sau. Hai lượt chạy cùng mã chỉ lệch phần GIỜ của dấu thời gian lúc seed
(`createdAt`… = giờ thật); chuẩn hoá `T hh:mm:ss.mmmZ` rồi so: hai lượt mốc 0 lệch, mốc → PR **0 lệch / 716 đường**. (`scripts/chup-api.mjs` đã cũ: thiếu vai ADMIN / TVV / CX và chỗ thay `{gv}`, `{ycPa}`… — lỗi ngay khi chạy.)

## Xếp hạng (bước VM ×3 × lần mở / ngày, giả định ~50 GV · 8 QL · vài TVV / CX)

| Hạng | Đường | Vai | bước VM ×3 | Ghi chú |
|---|---|---|---|---|
| 1 | `/tong-quan/lop-toi-day/hai-khoi` (Tổng quan GV) | GVCN · GVBM | 529 k · 595 k | ~400 lần / ngày — **sửa (1)(2)** |
| 2 | `/my-work` (Tổng quan GV + Công việc) | GVCN · GVBM | 190 k · 189 k | ~700 lần / ngày; SCAN `sos_cases` — [XM-1] |
| 3 | `/hoc-vien-lop` | GV · QL | 530–667 k | đọc theo chỉ mục, không câu lặp |
| 4 | `/tong-quan/v5?ct=ft` · `/phan-tich/giao-vien` (Tổng quan QL) | QL | 489 k · 343 k | DOC-PT #1011 đã giảm |
| 5 | `/classes/{lop}/roster` · `/overview` · `/cham` | GV | 336 k · 174 k · 201 k | đọc theo chỉ mục |
| 6 | `/tong-quan/hoc-vien` · `/hoc-vien-lop/theo-vai` | CX · QT · TVV | 1,16–1,26 M (CX / QT) | ít người mở; câu lượt đọc hai lần — **sửa (3)** |
| — | mỗi request: `/demo/session`, phiên, `/ref/*`, `/yeu-cau/dem`, `/notifications` | mọi vai | ≤ 11 k | đã 1 câu phiên (TD2-d), `/ref/branches` nhớ ở web |

Phía web: không poll (chuông chỉ tải khi mở app / bấm chuông), `useApi` gộp GET đang bay + bản vừa xem 10 s, tải lại sau lưu gộp 1,5 s (TAI-NHANH) — không thấy gọi trùng.

## Sửa (JSON giống hệt, 716 / 716)

1. **Tổng quan GV bỏ phần chỉ số không hiện** — `lopToiDayHaiKhoi` gọi `chiSoHoSoGv` đủ bộ, nhưng chỉ đọc `tu`, `den`, `ketQua`, `tienBo`, `hocThuatTheoLop`.
   Cờ `chiHocThuat` bỏ ba tập Chấm đúng hạn, Ghi KQ PA (`dung-han-cap-nhat` cả chi nhánh), PA hiệu quả (`paCoKetQua` cả chi nhánh). Hồ sơ GV giữ đủ.
2. **Tổng quan GV đọc bảng lớp một lần** — `tinhLopToiDay` (khung FT rồi lớp thường) đọc cùng câu lớp + sĩ số hai lần → nhớ trong request.
3. **`standingFor` nhớ theo từng em** trong request GET — Tổng quan TVV / CX và Học viên theo vai tính tình trạng hai lần (chip, rồi `danhSachHocVienLop`: tập con, khác thứ tự).
   Map trả về theo thứ tự người gọi, bản chép sâu. Phép kiểm `RA-DOC-0611` ở `tocDo.run` (tập con 0 câu, trùng tính thẳng; `chiHocThuat` giữ năm trường).
4. **`classProgressMany` nhớ trong request** — hồ sơ lớp thường gọi 2–3 lần cùng tập lớp.

| vai × đường | câu ×1 | dòng ×1 | dòng trả ×3 | bước VM ×3 | quét cả bảng ×3 |
|---|---|---|---|---|---|
| GVBM `/tong-quan/lop-toi-day/hai-khoi` | 61 → 49 | 2 298 → 2 090 | 6 248 → 5 712 | 595 k → 486 k | 1 318 → 625 |
| GVCN · GVCN_THUONG `/tong-quan/lop-toi-day/hai-khoi` | 61 → 49 | 2 037 → 1 828 | 5 507 → 4 958 | 529 k → 420 k | 1 246 → 553 |
| CX `/tong-quan/hoc-vien` | 62 → 60 | 4 734 → 4 265 | 12 622 → 11 215 | 1 163 k → 986 k | 2 450 |
| QT `/tong-quan/hoc-vien` | 61 → 59 | 4 779 → 4 310 | 12 859 → 11 452 | 1 190 k → 1 012 k | 2 450 |
| CX `/tong-quan/hoc-vien?branchId=1` | 54 → 52 | 3 373 → 3 048 | 9 027 → 8 052 | 819 k → 696 k | 1 865 |
| CX `/hoc-vien-lop/theo-vai` | 64 → 62 | 4 896 → 4 427 | 13 110 → 11 703 | 1 262 k → 1 084 k | 2 454 |
| CX `/hoc-vien-lop/theo-vai?branchId=1` | 58 → 56 | 3 515 → 3 190 | 9 379 → 8 404 | 891 k → 767 k | 1 869 |
| TVV `/tong-quan/hoc-vien` | 48 → 46 | 428 → 408 | 1 060 → 1 000 | 77 k → 70 k | 775 |
| TVV `/hoc-vien-lop/theo-vai` (· `?phamVi=chi-nhanh`) | 53 → 49 · 52 → 48 | 443 → 421 · 798 → 771 | 1 091 → 1 029 · 2 156 → 2 079 | 80 k → 72 k · 127 k → 117 k | 779 · 1 243 |
| QL · QT · GVCN_THUONG `/classes/{lopThuong}/overview` | 44 → 40 · 43 → 39 · 43 → 41 | −4 · −4 · −2 | −4 · −4 · −2 | −2 k · −2 k · −1 k | 43 |
| Trang đầu GV · TVV · CX (`TAI_TRANG`) | 128 → 116 · 79 → 77 · 111 → 109 | | | | |

Mọi đường khác: số câu, dòng, bước VM không đổi.

**Ước / ngày (cận dưới "dòng trả + dòng quét cả bảng", ×3 ≈ bản chính):** Tổng quan GV ~1 240 dòng / lần × ~400 lần ≈ **0,5 triệu**; CX / QT / TVV ~1 400 · 60 dòng / lần
× vài chục lần ≈ 0,05 triệu → **~0,55 triệu dòng / ngày (~16 triệu / tháng)**, Tổng quan GV nhanh hơn ~20 % (bước VM).

## [XM] cho PTA — chưa sửa, lý do + đề xuất

1. **[XM-1] Công việc / Tổng quan GV `/my-work` đọc cả hệ thống** (GV 33 câu · ~1 700 dòng trả · ~1 500 dòng quét cả bảng ×3, ~700 lần / ngày ≈ **2–2,5 triệu dòng / ngày**):
   `napCaseMo` (`mywork.ts`) đọc MỌI Case mở (SCAN `sos_cases`) + các nguồn việc khác cả hệ thống, rồi lọc theo người giữ việc. Lọc tập cha theo lớp như DOC-IT-3 không chắc đúng:
   người phụ trách Case / người giữ việc có thể ngoài lớp mình. Đề xuất: tập cha theo (lớp có phân công ∪ Case mình phụ trách ∪ việc mình giữ) trong SQL, kèm phép so JSON
   mọi vai — gộp với DOC-SOS-CHI-MUC (đang chờ log bản chính).
2. **[XM-2] Chuông đồng bộ = một lần tính việc nữa** — `GET /notifications` chạy `dongBoThongBaoTuDong` (`viecMuon` ≈ `myWork`) tối đa 5 phút / người mỗi lần mở app,
   cùng lúc trang đầu đã gọi `/my-work`. Đề xuất (đổi hành vi, cần PTA): đồng bộ chuông từ chính lần tính `/my-work` của request đó.
3. **[XM-3] Đường còn > 30 câu hoặc > 2 000 dòng (×1) sau PR:** Tổng quan GV 49 câu / 1 828–2 090 dòng · `/hoc-vien-lop` 48–50 câu / 1 988–2 645 dòng ·
   CX / QT `/tong-quan/hoc-vien` 59–60 câu / ~4 300 dòng · `/tong-quan/v5?ct=ft` QL 35 câu / 2 270 dòng. Mỗi câu đã đi chỉ mục; dòng = em × lượt.
   Đề xuất nhẹ hơn cho `/tong-quan/hoc-vien` (CX / QT): chip chỉ cần số đếm nhưng gọi `danhSachHocVienLop` đủ (dựng cả danh sách) chỉ để lấy cờ "Thiếu thông tin" —
   tính riêng cờ đó cho em đang học (ước bớt ~1/2 đường; ít người mở nên lợi nhỏ).
4. **`ADMIN /my-work`** (RA-LOI-0611 hỏi — `viecXuatBaoCaoPh` chạy mỗi lần; `/my-work` gọi ở mỗi lần mở app cho badge): thêm vào `DUONG_DO` + trần.
   Đo 13 câu · 449 dòng ×1 (×3: 86 k bước VM, 265 quét cả bảng); phần Xuất báo cáo PH = 4 câu (ghi danh lớp có đợt 294 dòng ×3, tiến độ lớp, bản ghi PH, đợt) ≈ 19 % bước VM.
   Đã theo chỉ mục, không đọc lặp; gộp thành một câu đếm vẫn đọc đủ dòng ghi danh (Turso tính dòng đọc) → không sửa. Vài Admin × vài lần / ngày: ~vài chục nghìn dòng / ngày.
5. `scripts/chup-api.mjs` cũ (thiếu vai / chỗ thay) — thay bằng `PISA_IN_JSON` của `tocDo.run`; xoá hoặc sửa script là việc riêng.

Không index mới → **không có migrate cần chạy khi deploy.**
