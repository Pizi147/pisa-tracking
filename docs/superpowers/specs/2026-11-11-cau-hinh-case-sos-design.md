# CẤU HÌNH CASE & SOS — Quản trị tự sửa nhóm nguyên nhân, nhóm PA, việc theo mốc SOS (chủ SP 11/11)

Trạng thái: **bản thiết kế + mockup, CHỜ chủ SP duyệt** (chưa code). Mockup: `thiet-ke/2026-11-11-cau-hinh-case-sos/`.
Mã đọc: `main` 3ed02511f. Session CAU-HINH-CASE-SOS (Opus 5.5 · high).

## 1. Lời chủ SP và mô tả đã duyệt

> "Cho tôi quyền chỉnh sửa/ tạo nhóm nguyên nhân của các case, các nhóm phương án của các case và quy định các mốc SOS cần phải làm gì cho cả lớp thường và lớp FT…"
> "Tôi muốn thay đổi danh sách nhóm nguyên nhân cho vấn đề của học sinh, FT lẫn lớp thường. Việc phải thực hiện phối hợp theo quy chế khi có SOS cũng sẽ có thay đổi trong tương lai và tôi muốn mình có thể chủ động đổi được."
> "bạn cứ làm theo những gì bạn đoán đi, chuẩn rồi đấy" (duyệt mô tả PTA, plan.md 11/11 khuya)

Mô tả đã duyệt: mục mới trong Quản trị hệ thống; **chỉ Quản trị sửa, QL xem**; 3 danh sách — (1) nhóm nguyên nhân Case **riêng FT / lớp thường**, (2) nhóm PA Case,
(3) việc theo quy chế ở từng mốc SOS (FT SOS 1/2/3 theo MT, mốc lớp thường): mỗi việc có **ai làm**, **hạn n ngày**, **có phải ghi kết quả**; mỗi danh sách
**thêm / sửa tên / đổi thứ tự / tạm ẩn**; đổi **chỉ áp cho Case / SOS sinh sau**, Case cũ giữ nguyên + lịch sử đọc được; mục đã có Case dùng **không xoá hẳn, chỉ ẩn**;
**nhật ký** ai đổi gì lúc nào. Thiết kế thành **mục độc lập** để lắp vào khung Quản trị mới — **PTA chốt 11/11 với QUAN-TRI-V2** (ghi chú chung `quan-tri-v2-mau-chung.md`): mẫu trang của mục này là
**mẫu chung mọi mục cấu hình**; Case & SOS = mục `/quan-tri/case-sos` trong nhóm "Cấu hình hệ thống" ở cột trái Quản trị.

Ngoài phạm vi: khung Quản trị + các mục khác (QUAN-TRI-V2), **ngưỡng % Final lớp thường / Mini Test** (mục "Band & ngưỡng" của QUAN-TRI-V2 — PTA chốt 11/11), luồng Case / PA (SOS-TAM-PA, CASE-LOP-GON đang sửa), giao diện việc Phối hợp ở Công việc / hồ sơ (PHOI-HOP-SOS-V2), khung Quản trị mới.
Ở đây chỉ làm: **cấu hình + mọi chỗ đọc danh sách**.

## 2. Hiện trạng (đã kiểm trên mã)

| Danh sách | Nằm ở | Ghi vào DB | Chỗ đọc chính |
|---|---|---|---|
| Nhóm nguyên nhân | `ISSUE_TAXONOMY` (`shared/domain/cases.ts:357`) — 7 nhánh: L · R · W (W1 + W2 chung) · S · G+V (FOU) · Pronunciation (FOU) · Tổng hợp (Pre FOU). **FT và lớp thường BE / ELE dùng CHUNG nhánh L R W S** | `case_issues.taxonomy_code` (+ `taxonomy_version` luôn = 1) · `assessment_scores.nhom_nguyen_nhan` (JSON mã) | Chọn: `ChonNhom` (NhanXet, HopNhapDiem, MockDetailPage, CasePanel, CaseSosControls), QuickReport · Kiểm: `cases.ts:667`, `kiemNoiDungCase`, `kiemNhomNguyenNhan` · Nhãn: `issueLabel` ~20 chỗ · Số liệu: `issueBoard`, `hieuQuaPa` (theo nhánh), Xuất MT cột "Nhóm nguyên nhân" |
| Nhóm PA | `SUPPORT_KINDS` / `PROPOSAL_KINDS` / `SYSTEM_KINDS` (`cases.ts:577`) — GV tự làm: Tự học · Tutor · Điều chỉnh cách dạy · Tăng cường bài tập; cần QL duyệt: Hỗ trợ học thuật · Khác; hệ thống: Bổ trợ · Bổ trợ miễn phí | `case_interventions.kind` | `FormPa`, `ThaoTacCase`, `CapNhatTuan`, `DoiPa` (`LOAI_PA_DOI`) · Kiểm `cases.ts:1002` · Nhãn `INTERVENTION_KIND_LABEL` ~25 chỗ · `hieuQuaPa` thứ tự loại |
| PA quy chế FT | `DEFAULT_ACADEMIC_SUPPORT` (`shared/domain/sos.ts:56`) — MT × SOS → (loại, đến khi) | `case_interventions` `preset = 1`, `moc_quy_che` | `presetFor` (`sosAuto.ts:68`) — **một chỗ** |
| Việc phối hợp FT | `DEFAULT_SOS_COORDINATION` (`sos.ts:180`) — MT × SOS → loại việc; `COORDINATION_KINDS` 7 loại; hạn `hanPhoiHop` (chỉ Meeting CX: 5 ngày); ghi chú ≥ 10 ký tự chỉ Meeting CX | `sos_coordination_actions` (`kind`, `preset`, `han_chon`…) | `syncSosCoordination` (`yThuc/phoiHop.ts:53`) — **một chỗ**; nhãn `COORDINATION_KIND_LABEL` (PhoiHopSosSection, Công việc, Phân tích) |
| Lớp thường | Không có bảng: luật nằm trong hàm — Progress Test trượt môn → Case + Bổ trợ (`boTroGiuaKhoa`: FOU 2 buổi/tuần chung, BE / ELE 1 buổi/tuần/môn) + "Báo PH qua TVV" (`dongBoBaoPh`) · Final 60–69 % / 50–59 % cho lên → Bổ trợ miễn phí (1 / 2 tuần × môn trượt; Pre FOU 2 / 4 buổi) · Final < 50 % / 50–59 % học lại → "Báo PH qua TVV" · Lên FT không đạt kỳ vọng (Trung tâm) → Case + Tutor 10 buổi/kỹ năng (`kyVong.ts:258`) | như trên | `normal/regular.ts:1036, 1055`, `normal/cuoiKhoa.ts:270–306`, `normal/kyVong.ts:198` |

Luật hiện tại từng mốc FT (ngày đầu phải ra đúng như vậy):

| Hàng | SOS 1 | SOS 2 | SOS 3 |
|---|---|---|---|
| MT1 | Tự học · 1 tháng · việc: Trao đổi ngắn với HV, Trao đổi với gia đình | Tự học · 1 tháng · Gia đình | Tutor · đến MT kế · Gia đình, GVCN meeting |
| MT2 | như MT1 | Tự học · 1 tháng · Gia đình, GVCN meeting | Tutor · đến MT kế · Gia đình, GVCN meeting, Meeting CX · HV |
| MT3 | Tutor · đến lúc thi · HV, Gia đình | Tutor · đến lúc thi · Gia đình, GVCN meeting | Tutor · đến lúc thi · Gia đình, GVCN meeting, **Meeting CX · HV / PH** |
| MT4, MT5+ | Tutor · đến lúc thi · HV, Gia đình | Tutor · đến lúc thi · Gia đình, GVCN meeting | Tutor · đến lúc thi · Gia đình, GVCN meeting, Meeting CX · HV |
| RF (mọi MT) | = hàng MT4 (PA hàng MT3 ≡ MT4) | | |

Ai làm: **chủ SP chốt 11/11 (PTA Plan): mọi việc phối hợp SOS = GVCN** (QL làm thẳng được). Riêng **Meeting CX/GĐCN**: GVCN xác nhận → **sinh thêm việc TVV**
(báo gia đình, sắp xếp họp, báo lại kết quả — như Báo PH ý thức; PHOI-HOP-SOS-V2 làm luồng đó). Bản gốc cấu hình (= hành vi sau PHOI-HOP-SOS-V2, session đó trả lời 11/11): `aiLam = 'gvcn'` mọi việc; HV · gia đình · GVCN meeting · Khác: không hạn, Nội dung theo PHOI-HOP-SOS-V2 ([XM] bắt buộc hay không); hai việc
Meeting CX: bước GVCN hạn 5 ngày (`hanPhoiHop` giữ), Nội dung tuỳ chọn + `buocTvv = { hanNgay: 5 (từ ngày GVCN xác nhận), toiThieu: 10 }`; Báo PH qua TVV (lớp thường) giữ GVCN. Quản trị đổi được "ai làm" về sau; PHOI-HOP-SOS-V2 đọc người làm + cờ qua hàm chung `aiLamViec(dongViec)` (mục 5).

Mã gắn hành vi (phải giữ cố định, không cho xoá / đổi nghĩa): `*.other` / `other_proposal` (bắt "Ghi rõ", nhóm mặc định khi ô có nhận xét chưa chọn nhóm) ·
`tutor` (Số buổi khi xác nhận, chọn GV dạy, PA quy chế) · `self_study` (không người dạy, PA quy chế) · `bo_tro`, `bo_tro_mien_phi` (hệ thống tạo, hàng chục câu SQL `kind =`) ·
`LOAI_PA_DOI` (đổi PA mặc định) · `teaching_adjust` (meeting tự chèn) · `bao_ph_tvv` (máy tạo, nội dung 4 ô) · Meeting CX (hạn + ghi chú tối thiểu).

## 3. Thiết kế dữ liệu

### 3.1. Một bảng phiên bản dùng chung (`cau_hinh_phien_ban`)

```sql
CREATE TABLE cau_hinh_phien_ban (   -- dùng chung với QUAN-TRI-V2 (loại 'han_mac_dinh', 'nguong_band'…); ai merge trước tạo bảng
  id INTEGER PRIMARY KEY,
  loai TEXT NOT NULL,            -- của mục này: 'nguyen_nhan' | 'phuong_an' | 'moc_sos'
  du_lieu TEXT NOT NULL,         -- JSON cả danh sách (xem 3.2) — bất biến sau khi ghi
  thay_doi TEXT,                 -- JSON mô tả lần đổi: [{ viec: 'them'|'sua'|'an'|'hien'|'xoa'|'thu_tu'|'o_moc', muc, truoc, sau }]
  khoi_phuc_tu INTEGER,          -- Hoàn tác / Khôi phục: chép lại phiên bản này
  nguoi_id INTEGER REFERENCES users(id),
  tao_luc TEXT NOT NULL
);
CREATE INDEX idx_chpb_loai ON cau_hinh_phien_ban(loai, id);
```

- Mỗi lần lưu (một thao tác) = **một dòng mới**, không sửa / xoá dòng cũ (như `bang_quy_doi`). Bản đang dùng của một danh sách = dòng `id` lớn nhất của `loai` đó.
- Bảng nhỏ: ~10–30 KB mỗi dòng; vài trăm dòng sau nhiều năm. Không cần "hiệu lực từ ngày" tương lai: **hiệu lực ngay khi lưu** (`tao_luc`) — chủ SP muốn đổi là
  áp luôn cho Case / SOS mới. *(Hẹn ngày áp: chưa làm — thêm khi chủ SP cần.)*
- Migrate ghi **một dòng gốc mỗi loại = đúng hằng số hiện tại** (nguyên nhân phải là `id` 1 nếu bảng mới tạo; nếu QUAN-TRI-V2 đã tạo bảng trước thì map
  `taxonomy_version = 1` → id dòng gốc nguyên nhân trong hàm đọc) → ngày đầu không đổi hành vi. `case_issues.taxonomy_version`
  đang = 1 ở mọi dòng ⇒ trỏ đúng bản 1 nguyên nhân, không phải sửa dữ liệu cũ.

### 3.2. Nội dung JSON

```ts
type MucNguyenNhan = { ma: string; ten: string; tenEn?: string; giaiThich?: string; an?: true; heThong?: 'khac' };
type NguyenNhan = { ft: Record<'listening'|'reading'|'writing'|'speaking', MucNguyenNhan[]>;
                    thuong: Record<'listening'|'reading'|'writing'|'speaking'|'gv'|'phat_am'|'tong_hop', MucNguyenNhan[]> };

type MucPa = { ma: string; ten: string; tenEn?: string; nhom: 'gv_tu_lam' | 'can_ql_duyet'; nguoiDay: boolean; soBuoi: boolean; an?: true;
               coDinh?: true /* mã có hành vi riêng — không đổi nhóm / cờ */ };
type PhuongAn = { muc: MucPa[] };       // Bổ trợ / Bổ trợ miễn phí KHÔNG ở đây (hệ thống tạo)

type Viec = { ma: string; ten: string; tenEn?: string; aiLam: 'gvcn' | 'tvv' | 'cx'; hanNgay: number | null;
              ghiChu: 'khong' | 'bat_buoc'; toiThieu?: number;
              buocTvv?: { hanNgay: number; toiThieu: number } /* GVCN xác nhận xong → sinh việc TVV của em: báo gia đình, sắp xếp họp, ghi KQ */;
              an?: true; coDinh?: true };
type O = { pa: { loai: string; den: 'one_month' | 'until_next_mt' | 'until_exam' } | null; viec: string[] };
type MocSos = { viec: Viec[];
  ft: Record<'mt1'|'mt2'|'mt3'|'mt4'|'mt5'|'rf', Record<1|2|3, O>>;
  thuong: { progress: { viec: string[]; boTro: { fou: number; beEle: number } };             // buổi / tuần
            final6069: { viec: string[]; tuan: number }; final5059Len: { viec: string[]; tuan: number };
            final5059HocLai: { viec: string[] }; finalDuoi50: { viec: string[] };
            preFou: { buoi6069: number; buoi5059: number };
            khongDatKyVong: { viec: string[]; tutorBuoi: number } } };
```

- **Mã ổn định**: mục sẵn có giữ mã cũ (`student.listening.language`, `tutor`, `talk_family`…). Mục mới: nguyên nhân `student.<nhánh>.m<n>`, PA `pa.m<n>`,
  việc `viec.m<n>` (`n` tăng toàn cục) — giữ dạng `student.<nhánh>.x` để `issueBranchOf`, `hieuQuaPa` chạy như cũ. Mã không bao giờ dùng lại.
- **FT / lớp thường tách**: ngày đầu hai bên **chép cùng mục, cùng mã** (Phân tích gộp như cũ); từ đó sửa riêng. Nhãn tra theo (bên, mã), thiếu thì bên kia.
- `heThong: 'khac'` — mục "Khác" mỗi nhánh: luôn cuối, không ẩn / xoá được (đổi tên được). `coDinh` — mã có hành vi (mục 2): đổi tên / thứ tự / ẩn (nếu không bị
  ô mốc dùng) được, không đổi nhóm / cờ.
- **RF** thành hàng riêng (hôm nay mã suy RF = hàng MT3 cho PA, MT4 cho việc — PA MT3 ≡ MT4 ≡ MT5 nên một hàng RF = MT4 ra đúng như cũ).
- **Lớp thường**: ngưỡng % Final / Mini Test thuộc "Band & ngưỡng" (QUAN-TRI-V2) — nhãn mốc ở đây đọc từ đó ("Final {a}–{b} %"); môn, ai dạy Bổ trợ giữ trong mã; số buổi / tuần,
  số tuần, số buổi Tutor và việc phối hợp mỗi mốc sửa ở đây.

### 3.3. Case / SOS mang bản chụp (chỉ áp cho cái sinh sau)

| Bảng | Cột mới | Ghi lúc | Đọc |
|---|---|---|---|
| `case_issues` | (dùng `taxonomy_version` sẵn có = id phiên bản) | chọn nhóm (tạo / sửa Case, nhận xét → mô tả) | nhãn = mục trong đúng phiên bản đó |
| `case_interventions` | `pb_loai INTEGER` (NULL = bản 2) | tạo PA | nhãn + cờ (người dạy, số buổi, cần duyệt) theo bản đó |
| `sos_coordination_actions` | `pb_moc INTEGER` (NULL = bản 3) | máy / GVCN tạo việc | tên, ai làm, hạn, ghi chú tối thiểu theo bản đó |

- **Vì sao con trỏ phiên bản, không tra theo `tao_luc`** (QUAN-TRI-V2 tra theo giờ cho hạn mặc định): `sos_coordination_actions.created_at` ghi theo **ngày nghiệp vụ**
  (`nowNghiepVu`, có thể lệch giờ thật ở chế độ demo), Case / ô nhận xét được tạo lại lúc migrate / đồng bộ → tra giờ dễ trúng nhầm bản; con trỏ chính xác, `case_issues` đã có sẵn cột.
- **Phiên bản bất biến** ⇒ nhớ theo tiến trình **mãi mãi** theo `id` (không cần làm mới): một trang 50 Case thường chạm 1–3 phiên bản → 1–3 câu lần đầu mỗi tiến trình, sau đó 0.
- **SOS đang chạy không đổi theo**: `syncSosCoordination` / `presetFor` / `resyncUnconfirmedPresets` dùng **bản của lượt** = `pb_moc` của dòng việc preset đầu tiên của lượt
  (có từ lần sinh đầu, kể cả dòng đã bỏ); lượt chưa có dòng nào → bản hiện tại. Điểm sửa qua lại vẫn theo đúng bản lúc SOS sinh.
- Lớp thường: bản chụp nằm ở PA (`pb_loai` + `so_buoi` đã ghi) và dòng việc (`pb_moc`) lúc tạo — đổi số buổi không đụng PA đã tạo.

### 3.4. Đọc ít dòng (Turso)

- Server: `cauHinhHienTai(loai)` = `nhoThamChieu('chcs:'+loai, …)` — thêm `cau_hinh_phien_ban` vào `BANG_THAM_CHIEU` (trigger tăng `tham-chieu`, migrate mới + `schema.sql`).
  Không ai sửa → **0 câu / request**; sau một lần sửa: 1 câu (3 dòng) mỗi tiến trình. Phiên bản cũ: nhớ theo `id` như 3.3.
- Web: hôm nay danh sách nằm trong JS (0 request). Mới: phiên đăng nhập trả thêm `cauHinhPb: [id nguyên nhân, id PA, id mốc]` (đọc kèm câu phiên — 0 câu thêm);
  web gọi `GET /ref/cau-hinh-case-sos?pb=…` **một lần mỗi lần tải app**, trả `Cache-Control: immutable` (đổi `pb` mới tải lại) — mở trang **không thêm request**.
  Gói ~15 KB gzip ~4 KB. Phiên bản cũ cho Case cũ: máy chủ trả nhãn sẵn trong dữ liệu Case như nay (không bắt web tra).
- Màn Quản trị (hiếm mở, chỉ Quản trị / QL): 1 câu bản hiện tại + 1 câu 30 phiên bản gần nhất + 1 câu đếm "đang dùng" (`GROUP BY` trên `case_issues` / `case_interventions` /
  `sos_coordination_actions` theo mã — ước ~10–25 nghìn dòng quét mỗi lần mở tab, vài lần / tuần ⇒ < 0,1 triệu dòng / tháng). Không đường nào khác tăng đọc.
- Trần ở `server/src/tests/tocDoDuong.ts`: `GET /admin/cau-hinh-case-sos` ≤ 4 câu; `/ref/cau-hinh-case-sos` ≤ 1 câu.

## 4. Quyền, lưu, Hoàn tác, nhật ký

- **Sửa**: chỉ Quản trị hệ thống (`PERMISSIONS.ADMIN_CONFIG`) — máy chủ kiểm. **Xem**: Quản trị + vai Quản lý (`laVaiQuanLy`, như Bảng quy đổi). Vai khác: 403
  (web ẩn tab). Đây là quyền **hệ thống** (cấu hình) đúng mô tả chủ SP duyệt — không phải việc nghiệp vụ hằng ngày (bộ nhớ `quan-ly-vs-quan-tri`).
- **Một thao tác một lần lưu** (sửa tên, thêm, ẩn / hiện, xoá mục chưa dùng, đổi thứ tự, sửa một ô mốc) → `PUT /admin/cau-hinh-case-sos/:loai` với `tuPhienBan`
  (bản đang thấy; khác bản đang dùng → 409 "Vừa có người khác sửa — tải lại", không đè). Giống hệt bản đang dùng → không thêm phiên bản.
- **Hoàn tác 10 s** (toast) = khôi phục bản ngay trước (`khoiPhucTu`), thành một phiên bản mới; **Khôi phục về bản bất kỳ** ở Nhật ký (hộp nêu đúng các thay đổi sẽ đảo).
  Không có thao tác nào không đảo được (bộ nhớ `feedback-khong-khoa-cung`). Xoá chỉ có cho mục **chưa từng dùng** (0 Case / PA / việc / ô mốc); mục đã dùng chỉ **Ẩn**.
- **Nhật ký**: mỗi phiên bản = một dòng "ai · lúc · việc · trước → sau" (từ `thay_doi`) + `writeAudit` (`cau_hinh_case_sos.<viec>`) để hiện ở Quyền & nhật ký chung.
- **Kiểm nhập**: tên 1–60 ký tự, không trùng trong cùng nhánh / nhóm (bỏ dấu cách, không phân biệt hoa thường); giải thích ≤ 160; tên EN ≤ 60; hạn 1–60 ngày hoặc
  "không hạn"; ghi chú tối thiểu 1–200; số buổi 1–60; thứ tự là hoán vị đúng các mã đang có; ô mốc chỉ trỏ mục chưa ẩn. Lỗi trả theo ô, không mất chữ.

## 5. Chỗ đọc phải đổi (khi code — phạm vi PR code)

Thay hằng số bằng hàm đọc cấu hình, **giữ tên hàm cũ làm vỏ** để diff nhỏ:
- `issuesForTopic(topic, ct, ben?)` → mục **chưa ẩn** của bản hiện tại; `issueLabel(code, pb?, ben?)`; `issueBranchOf` không đổi (đọc từ mã).
  Chọn nhóm khi **sửa** Case / ô: hiện mục chưa ẩn + mục đang chọn dù đã ẩn (gắn "đã ẩn"). Kiểm máy chủ chấp nhận mã đã có sẵn trên dòng (đã ẩn vẫn giữ được).
  Sửa luôn chỗ hở: `kiemNhomNguyenNhan` thiếu `ct` (agent recon).
- `INTERVENTION_KIND_LABEL[kind]` → `tenLoaiPa(kind, pb?)`; `SELF_SERVE_KINDS` / `ACADEMIC_PROPOSAL_KINDS` / `isProposalKind` / `coSoBuoi` / `coNguoiDay` → đọc cờ của mục;
  `LOAI_PA_DOI` = mục `gv_tu_lam` chưa ẩn; `hieuQuaPa` thứ tự = thứ tự cấu hình. Mã cũ chỉ để đọc (`other`, `meeting_cx`, `reschedule_mt`) giữ nhãn trong mã.
- `academicSupportFor` / `sosCoordinationFor` → đọc ô của bản lượt; `hanPhoiHop(kind, taoLuc, hanChon, pb)` lấy `hanNgay`; `GHI_CHU_MEETING_TOI_THIEU` → `toiThieu` của việc;
  người làm = `aiLamViec(dongViec)` đọc `aiLam` + `buocTvv` của bản chụp (GVCN · TVV của em, không TVV → GVCN · CX chi nhánh; QL luôn làm thẳng) — **PHOI-HOP-SOS-V2 đọc hàm này** (họ làm giao diện + việc TVV sau Meeting CX).
- Lớp thường: `boTroGiuaKhoa`, `boTro` (Final), `MO_TA_TUTOR` / `soBuoi: 10`, `coBaoPhKhiChot` / `dongBoBaoPh` → đọc số / việc từ `moc_sos.thuong`.
- Chữ EN: mục sẵn có dùng từ điển như nay (khoá = tên gốc); mục mới / đổi tên dùng `tenEn` (bỏ trống → hiện tên Việt).
- Trang Hướng dẫn chép tay luật (`shared/huongDan/tvv.ts:178`, `cx.ts:28–30, 84`) → bỏ số cứng, trỏ "Quản trị › Case & SOS".
- Hằng số cũ giữ làm **bản gốc** (`*_GOC`) cho migrate + phép kiểm.

## 6. Ca biên

| Tình huống | Xử lý |
|---|---|
| Ẩn nhóm nguyên nhân 14 Case đang dùng | Một bấm + Hoàn tác (không hỏi — đảo được). Case cũ giữ nhóm + tên; ô chọn Case mới không còn; sửa Case cũ vẫn thấy nhóm đó ("đã ẩn"). Phân tích vẫn đếm |
| Ẩn Tutor / Tự học / việc đang nằm trong ô mốc | Nút Ẩn tắt, lý do ngay tại nút: "Đang dùng ở 9 ô Mốc SOS" + link "Xem ô ›" (lọc bảng mốc) |
| Ẩn "Khác" | Không có nút (mục hệ thống — ⓘ ở dòng) |
| Đổi tên nhóm | Case cũ giữ tên lúc chọn (bản chụp); Case mới + Phân tích dùng tên mới (cùng mã). Muốn **đổi nghĩa** → Ẩn mục cũ, Thêm mục mới (ⓘ ở cột Tên) |
| Đổi hạn / ai làm / ghi chú bắt buộc khi SOS đang chạy | Việc đã sinh giữ bản chụp; chỉ SOS sinh sau theo luật mới. Điểm sửa làm SOS đổi mức → vẫn theo bản của lượt |
| Bỏ một việc khỏi ô mốc | SOS cũ: việc chờ giữ nguyên (không tự rút như `system_bang_doi` cũ — chủ SP: "chỉ áp cho sinh sau") |
| Đổi PA quy chế ô MT1 · SOS 3 | PA quy chế đã tạo / chờ xác nhận giữ; lượt mới theo ô mới. SOS-TAM-PA so "trùng loại" theo mã — không đổi |
| Hai Quản trị sửa cùng lúc | Người sau nhận 409 + "Tải lại" — chữ đang gõ giữ trong ô |
| Hoàn tác sau khi đã có Case dùng mục vừa thêm | Hoàn tác vẫn chạy (mục biến mất khỏi ô chọn); Case đó giữ mục (bản chụp) — không mất dữ liệu |
| Xoá mục chưa dùng | Có (Hoàn tác 10 s, Khôi phục ở Nhật ký). Đã dùng → chỉ Ẩn |
| Một nhánh chỉ còn "Khác" | Hợp lệ (ô chọn chỉ có "Khác" + Ghi rõ). Trạng thái rỗng: "Chưa có nhóm nào ngoài Khác · + Thêm nhóm" |
| Lớp thường: đổi số buổi Bổ trợ giữa khoá | PA Bổ trợ đã tạo giữ số buổi; Progress Test chấm sau mới theo số mới |
| Mất mạng khi lưu | Ô giữ chữ, báo lỗi tại dòng + "Thử lại"; không hiện "✓ Đã lưu" khi chưa lưu |

## 7. Giao diện (mockup `thiet-ke/2026-11-11-cau-hinh-case-sos/`)

- **Vị trí**: `/quan-tri/case-sos` — mục "Case & SOS" trong nhóm "Cấu hình hệ thống" ở cột trái Quản trị (khung QUAN-TRI-V2; mockup vẽ tạm cột trái theo ghi chú chung).
  Toàn bộ là MỘT thành phần `CauHinhCaseSos` (đầu mục + nội dung + nhật ký) lắp vào ô nội dung. Nếu PR này merge trước khung mới: tạm là tab "Case & SOS" của trang Quản trị cũ.
- **Đầu mục** (mẫu chung): tên "Case & SOS" 22/700 · đoạn chọn **Nguyên nhân · Phương án · Mốc SOS** · đoạn **Fast Track · Lớp thường** (Nguyên nhân, Mốc SOS) · "Áp cho Case / SOS sinh sau ⓘ".
- **Một luật lưu** (cả mục): ô chữ / số lưu khi **Enter** hoặc **Lưu** (Esc / Thôi bỏ); nút **một bấm** (Ẩn, Hiện lại, Xoá, ↑ ↓, kéo) **lưu ngay** + toast
  "✓ … · áp cho Case mới · Hoàn tác" 10 s. Lỗi tại dòng, chữ giữ, "Thử lại".
- **Nguyên nhân / Phương án** = **một bảng đơn giản** nhóm theo kỹ năng / nhóm PA (dải nhóm V21): ⠿ · Tên (giải thích / cách chạy là dòng 13 px dưới tên, chỉ khi có) ·
  Đang dùng (n Case / n PA) · nút cuối dòng. Bấm thẳng vào tên = sửa tại dòng; dòng cuối mỗi nhóm "+ Thêm …"; kéo ⠿ hoặc Alt + ↑ ↓ đổi thứ tự (↑ ↓ cũng có trong dòng sửa);
  mục ẩn mờ tại chỗ + "Hiện lại". Phương án có thêm nhóm khoá "Hệ thống tạo" (Bổ trợ, Bổ trợ miễn phí → "Số buổi ở Mốc SOS ›").
- **Mốc SOS · FT** = bảng mốc 6 hàng (MT1…MT5+, RF ⓘ) × SOS 1 · 2 · 3; mỗi ô: PA quy chế + các việc; ô giống hệt hàng trên hiện mờ. Bấm ô → khung phải sửa ô (Loại PA +
  Đến khi, tick việc) + **"Cũng áp cho"** hàng khác cùng mức SOS (đổi cả cột một lần) — "Lưu n ô" · Thôi. Dưới: **Danh mục việc phối hợp** (Việc · ai làm / hạn / ghi kết quả /
  bước TVV · Đang dùng = n ô mốc ›, lọc bảng mốc · Ẩn).
- **Mốc SOS · Lớp thường** = bảng 6 mốc (Progress Test · Final 60–69 % · lên · Final 50–59 % · QL cho lên · Final 50–59 % · học lại · Final < 50 % · học lại · Lên FT không đạt
  kỳ vọng): Case · PA quy chế (ô số buổi / tuần, số tuần, buổi Tutor sửa tại ô, Enter lưu) · Việc phối hợp (bấm → khung phải như FT). Nhãn % đọc từ "Band & ngưỡng".
- **Nhật ký** cột phải 320 px (1440) / dòng "Nhật ký ›" (375): 8 lần đổi gần nhất của danh sách đang xem, mỗi dòng "Khôi phục về đây"; **"Xem tất cả ›" = trang Vận hành ›
  Nhật ký chung `/quan-tri/nhat-ky?muc=case-sos`** (QUAN-TRI-V2, không panel).
- **QL**: cột trái "Cấu hình hệ thống" (cả nhóm, chỉ xem) + Đã xoá; cùng màn, không nút sửa, nhãn "Chỉ xem" (rê: "Quản trị hệ thống sửa").
- 375: từ mục lục Quản trị vào mục, "‹ Quản trị" đầu trang; mỗi mục hai dòng (tên · đang dùng), chạm dòng → hộp sửa toàn màn (có ↑ ↓ thay kéo); bảng mốc thành thẻ theo hàng MT.

## 8. Kế hoạch PR (sau khi chủ SP duyệt mockup)

Một PR (máy chủ + màn Quản trị — màn mới, không đổi bố cục màn cũ), TDD:
1. Migrate `prCauHinhCaseSos`: bảng + 3 dòng gốc + cột `pb_loai`, `pb_moc` + trigger tham chiếu. Phép kiểm: hành vi ngày đầu giống hệt (so 18 ô FT + 6 mốc thường + mọi nhãn).
2. Hàm đọc + vỏ hàm cũ; chuyển mọi chỗ đọc (mục 5). Phép kiểm: thêm / ẩn / đổi tên / đổi ô chỉ áp cho cái sinh sau; SOS đang chạy giữ bản.
3. API `GET/PUT /admin/cau-hinh-case-sos/:loai`, `/ref/cau-hinh-case-sos` + trần `tocDoDuong`. Quyền: QT sửa, QL xem, vai khác 403.
4. Màn `CauHinhCaseSos` theo mockup; ảnh cặp 1440 tối + 375 sáng.
5. `/security-review` + `/code-review high`; thử migrate trên bản chép `D:\Github\pisa-mig\mig.sqlite` (chép ra tạm): đếm Case / PA / việc không đổi nhãn, SOS sinh mới đúng ô.

## 9. Câu hỏi / [XM] cho PTA Plan

- [XM-1] **Ai làm**: bản gốc = GVCN mọi việc (chủ SP 11/11) + "Bước TVV sau xác nhận" (hạn 5 ngày, Nội dung ≥ 10) ở Meeting CX/GĐCN. Em không có TVV → theo PHOI-HOP-SOS-V2 ([XM] của họ). `aiLam` là vai chính; QL luôn làm thẳng. Đổi sang TVV / CX về sau:
  việc vào Công việc của vai đó (luồng PHOI-HOP-SOS-V2). Ai merge trước: bên sau đọc / ghi qua `aiLamViec` — thống nhất tên khi code.
- [XM-2] **Bỏ việc khỏi ô mốc**: việc chờ của SOS cũ GIỮ (đúng "chỉ áp cho sinh sau"); khác cách migrate OV-13n đã làm (tự rút `system_bang_doi`). Khuyến nghị: giữ.
- [XM-3] ~~ngưỡng % Final lớp thường~~ → **PTA chốt 11/11: sang "Band & ngưỡng" (QUAN-TRI-V2)**; ở đây chỉ số buổi / tuần, số tuần, buổi Tutor, việc phối hợp.
- [XM-4] **Tên EN**: ô "Tên tiếng Anh" không bắt buộc trong hộp sửa (cho GV nước ngoài); bỏ trống hiện tên Việt. Khuyến nghị: có (một ô, chỉ trong hộp sửa).
- [XM-5] **Cờ PA mới** ("Có người dạy", "Đếm số buổi"): hai ô tick khi thêm PA, để PA mới chạy đúng như Tutor / Tự học. Khuyến nghị: có.
