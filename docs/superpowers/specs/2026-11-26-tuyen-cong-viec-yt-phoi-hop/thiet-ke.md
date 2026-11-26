# Tuyến công việc Ý thức & Phối hợp — thiết kế (26/11)

Session `brainstorm-yt-phoi-hop` (Fable 5.2 · high), brainstorming trực tiếp với chủ SP 26/11. Đọc trên `origin/main` b636a5545.
Trạng thái: **chờ chủ SP duyệt đặc tả** (đã chốt C1–C4, Q-PH1, Q-PH2 trong session) → mockup `thiet-ke/v27/` → PTA Plan giao code.

## 0. Lời chủ SP (nguyên văn, 26/11)

> "3. Phần tab công việc và panels của công việc liên quan đến ý thức/phối hợp, nhất là phối hợp SOS để mọi thứ nó cụ thể đồng bộ và rõ ràng hơn, chứ đang chỉ nhìn thấy đúng phần việc của họ nên tuyến công việc có thể chưa rõ, làm lại nhé"

**Mục tiêu:** ai mở một việc Ý thức / Phối hợp cũng thấy **cả tuyến**: việc bắt đầu từ đâu, đang ở bước nào, ai giữ, bước sau là gì, đã xong tới đâu. Mọi loại việc, mọi vai hiện **cùng một kiểu**.
**Không làm:** thêm bước, thêm trạng thái chặn, thêm việc / số đếm / chuông, cấp quyền xem mới, đổi luật nghiệp vụ của từng bước (N1–N71 giữ nguyên).
**Hỏng dù chạy được (anti-goal):** danh sách Công việc dài hơn hay lẫn việc phải làm với việc người khác đang làm; số việc trên menu / chuông đổi; người ngoài đọc được chuyện phụ huynh.

## 1. Hiện trạng (đã kiểm trên code + web cục bộ seed 14/09/2026)

Ảnh: `anh/truoc-gvcn-y-thuc.png` (GVCN Trần Ngọc Hà, tab Ý thức & Phối hợp) · `anh/truoc-gvcn-panel-meeting.png` (panel Meeting CX 4 em) · `anh/truoc-tvv-cong-viec.png` (TVV Phan Mai).

### 1.1 Các tuyến thật

| Tuyến | Bước (người giữ mặc định · hạn) | Lưu ở |
|---|---|---|
| **Vi phạm** | ① GV ghi vi phạm (người ghi) → ② **Xử lý vi phạm** (GVCN lớp đang học, không GVCN → Head · 5 ngày, `yt_xu_ly`, tính khi ≥ 3 vi phạm / 2 tuần hoặc có "yêu cầu xử lý") → [khác mặc định: ③ **Head duyệt** (5 ngày, quá hạn tự chốt theo GVCN) → ④ **Đã thực hiện** (GVCN · 5 ngày từ duyệt)] → ⑤ **Báo PH** (TVV của em, không TVV → Head · 5 ngày N2) ⇄ nhánh **Trả lại** (TVV / CX / Head trả → người ghi hoặc GVCN sửa · 3 ngày; Báo PH tạm dừng "Chờ GV sửa", gửi lại → hạn mới) · nhánh **Thu hồi** (GVCN → Head duyệt; Báo PH đã xong → sinh "Báo lại PH") | `violations`, `discipline_measures` (`nhap → cho_duyet → da_duyet → done`, `tu_choi`, `thu_hoi`), `yeu_cau_duyet`, `viec_bao_ph` + `viec_bao_ph_lan`, `vi_pham_tra_lai` |
| **Khai / sửa cấp bậc** | Khai lần đầu (GVCN, áp ngay) · sửa → **Head duyệt** (5 ngày, N70) | `y_thuc_khai_bac`, `yeu_cau_duyet` |
| **Phối hợp SOS** | Mock FT có SOS → `syncSosCoordination` điền sẵn việc theo mốc (`DEFAULT_SOS_COORDINATION`, cấu hình CAU-HINH-CASE-SOS) → ① **GVCN xác nhận** từng việc (Trao đổi ngắn HV · Trao đổi gia đình · GVCN meeting — mặc định không hạn; cấu hình mốc đặt được hạn `hanNgay` / `maViecCoHan`, N58 đặt hạn tay được) → ② nếu mốc có bước TVV (`buocTvvViec`) → **TVV báo PH** (5 ngày) | `sos_coordination_actions` (`pending / done / removed`), `viec_bao_ph.phoi_hop_id` |
| **Meeting CX / GĐCN** | ① GVCN xác nhận (5 ngày) → ba phần **song song**: **Xếp lịch họp** (BPXL → TVV → Head · 5 ngày; tự xong khi có Kết quả — N67) · **Kết quả meeting** (CX → Head; TVV nhập hộ · 14 ngày) · **Báo PH Meeting** (TVV → GVCN → Head · 5 ngày) | `meeting_phan`, `viec_bao_ph` |
| **Tình hình học tập** | chiều GV → TVV: GV gửi → **TVV báo PH** (5 ngày) · chiều TVV → GVCN: TVV hỏi → **GVCN trả lời** (3 ngày) | `tinh_hinh_hoc_tap`, `viec_bao_ph.tinh_hinh_id` |
| **Báo PH kết quả Test lớp thường** | Progress có môn trượt → **GVCN báo PH** (Final < 50 % → Head) · không hạn · không bước TVV (N6) | `sos_coordination_actions.kind='bao_ph_tvv'` |

Giao việc / theo dõi (N58): `viec_theo_doi`, `viec_giao_lan`, `viec_han_lan`; khối Phụ trách · Hạn · Theo dõi (`xemGiaoViec`) và tab Đang theo dõi (`viecTheoDoi`) **chỉ biết một việc**, không biết việc trước / sau.

### 1.2 Mỗi vai đang thấy gì

| Vai | Thấy | Không thấy |
|---|---|---|
| GVCN | Công việc › Ý thức & Phối hợp: Xử lý vi phạm, Phối hợp SOS (dòng lớp × loại việc), Báo PH kết quả Test; panel Xử lý vi phạm có "ai ghi vi phạm nào" | Bấm Xác nhận Phối hợp → em **biến khỏi panel**; BPXL / CX / TVV tới đâu chỉ xem ở hồ sơ lớp (`BangPhoiHopHoSo` có thanh bước, Công việc không có) · gửi Head duyệt → việc **biến khỏi Công việc**, không chỗ nào ghi "đang chờ Head" (trừ "Yêu cầu của tôi" gập dưới đáy) · panel Xử lý không lịch sử, bước sau chỉ là câu luật |
| TVV | tab Báo PH: Báo PH vi phạm (panel đủ nhất: tóm lần xử lý, vi phạm, lịch sử), Báo PH Meeting một em (thấy hai phần Meeting) | **không biết trước** em SOS 3 sắp có Meeting (chưa có việc tới khi GVCN xác nhận) · dòng Meeting nhiều em mở `BangPhoiHop` kiểu TVV: không thấy Xếp lịch / Kết quả |
| BPXL · CX | `PanelMeeting`: phần mình mở, phần kia một dòng, Báo PH chỉ "Chưa xong / Đã báo PH" | bước GVCN chỉ là dòng bối cảnh · BPXL **bị chặn đọc** việc Báo PH (`xemViecBaoPh` 403 nếu không theo dõi) |
| Head | Chờ bạn duyệt: dòng mở ra có vi phạm, bằng chứng, "Sau khi duyệt" | các lần xử lý trước của em, Báo PH đang tới đâu |
| Người theo dõi | tab Đang theo dõi: "Phụ trách {tên} · trạng thái" | mở Phối hợp / Tình hình / Trả lại / Meeting chỉ thấy khối Phụ trách + lịch sử giao, **không thấy nội dung việc**; Meeting chỉ thấy một phần (máy chủ đã cho người theo dõi đọc — `laNguoiTheoDoi` — chỉ web chưa vẽ) |
| GV bộ môn (người ghi vi phạm) | Vi phạm bị trả lại: "{TVV} trả lại «lý do»" | lần xử lý / Báo PH trước đó |

### 1.3 Vấn đề (gốc)

1. **Không có khái niệm "tuyến"** ở máy chủ lẫn web: mỗi panel tự ghép một ít bối cảnh theo kiểu riêng (Báo PH có lịch sử đủ, Xử lý vi phạm không có, Meeting có ba phần, Phối hợp SOS không có).
2. **Làm xong là mất dấu:** việc rời danh sách mà không vào chỗ theo dõi có nội dung.
3. **Không thấy bước sắp tới:** người làm bước sau chỉ biết khi việc đã giao cho họ.
4. **Đang theo dõi rỗng ruột:** không có nội dung, không ghi đang ở bước nào.
5. **Tên lệch:** chữ "Nhờ TVV" ở Báo PH kết quả Test trong khi việc là của GVCN (N6); nhóm "Báo PH" xuất hiện hai lần trong cùng tab với hai nghĩa.

## 2. Đã chốt với chủ SP (26/11, trong session)

| # | Câu hỏi | Chủ SP chọn |
|---|---|---|
| C1 | Làm xong phần mình, việc đi đâu? | **Rời danh sách việc cần làm, tự vào Đang theo dõi** — số việc / chuông không đổi; mở lại từ Đang theo dõi thấy cả tuyến; xong hẳn thì rời sau 7 ngày như nay |
| C2 | Bước chưa tới lượt có hiện cho người làm bước sau? | **Có, chỉ trong khối Tuyến** — dòng xám "… · chờ {bước trước}", không thành việc, không đếm, không chuông |
| C3 | Ai xem nội dung bước của người khác? | **Khung tuyến** (tên bước · người giữ · trạng thái · ngày) ai có mặt trong tuyến cũng thấy; **nội dung** chỉ ai đã có quyền xem phần đó như hiện nay — **không cấp quyền mới** |
| C4 | Cách làm | **Cách 1: máy chủ dựng tuyến từ dữ liệu đang có** (mục 3) |
| C5 | Góp ý mockup v27 #2214 (chủ SP 26/11, qua PTA Plan): "Các việc liên quan đến TVV và báo PH thì luật vẫn là như cũ nhé không thêm việc head phải duyệt nếu không cần thiết nữa (trừ khi cần duyệt như luật cũ)" | **Không thêm bước Head duyệt nào.** Duyệt chỉ còn ở luật cũ: Xử lý khác mặc định (N1), Thu hồi (N5), Sửa cấp bậc (N70). Head chỉ **theo dõi** việc Báo PH (4b.2), không duyệt |
| C6 | cùng lời: "Các hệ thống công việc này cần đồng bộ và làm khá giống base, kiểu có hạn và bấm vào hạn sửa được, chọn/ đổi người thực hiện (có mặc định sẵn theo đúng luật), và có thể tạo công việc 'con' nếu muốn nhé, thể hiện cho gọn gàng đơn giản rõ ràng và đẹp hơn chút" | Mọi panel việc Ý thức / Phối hợp / Báo PH dùng **khung việc base** như panel Vận hành: khối **Phụ trách · Hạn · Theo dõi** (`KhoiGiaoViec`, bấm ngày hạn để sửa — `HanBam` #2211; người làm mặc định theo luật, Đổi được) + mục **Việc con** ("+ Việc con", như N59) — mục 4.6. Khối Tuyến làm **gọn** hơn (bỏ khung viền) |
| C7 | Góp ý mockup v27 (chủ SP 26/11, qua PTA Plan): "phần phụ người phụ trách cũng bấm vào tên người rồi đổi luôn, hoặc để trong box là ok, hạn cũng để dạng badge hoặc trong box nhé" | **Phụ trách và Hạn cùng MỘT kiểu "ô bấm"**: giá trị nằm trong ô viền mảnh, bấm thẳng vào ô là đổi người / sửa hạn; **bỏ nút "Đổi" riêng**. Ô người: tên · "bạn" · ▾; ô hạn: ngày tô màu theo luật hạn (NH4). Không có quyền → chữ trơn không viền. Áp mọi panel + hạn việc con |
| C8 | cùng lời: "cái meeting CX/GĐCN thì nhớ là để nó ở mốc cuối cùng nha, nó là việc cuối nhé" | **Meeting CX/GĐCN là mốc CUỐI của tuyến Phối hợp SOS**: khối Tuyến hiện các việc khác của mốc SOS trước ("việc của mốc, cùng lúc"), rồi nhãn "Mốc cuối · Meeting CX/GĐCN" + ba phần của nó; nhóm Phối hợp SOS ở Công việc xếp dòng theo bậc việc (Trao đổi ngắn → Trao đổi gia đình → GVCN meeting → **Meeting CX/GĐCN cuối**); tuyến chỉ "xong" khi Meeting xong. *(Session hiểu: thứ tự hiện + mốc kết thúc — KHÔNG thêm điều kiện chặn: GVCN vẫn xác nhận Meeting được khi việc khác chưa xong, đúng luật "không thêm bước / trạng thái chặn". Muốn Meeting chỉ mở sau khi các việc khác xong thì báo.)* |

## 3. Cách làm (Approaches)

| Cách | Được | Mất | Chọn |
|---|---|---|---|
| **1. Máy chủ dựng tuyến từ bảng sẵn có** — một hàm chung ghép bước, bước tương lai tính theo luật + cấu hình mốc SOS | không bảng mới, không migrate, luôn khớp nguồn (một số liệu một nguồn) | mỗi loại tuyến một hàm ghép; vài câu mỗi lần mở | **✓ chủ SP chọn** |
| 2. Bảng "bước tuyến" ghi thêm mỗi lần chuyển bước | đọc nhanh nhất | ghi đôi > 20 chỗ, migrate dữ liệu cũ, quên một chỗ là sai | bỏ |
| 3. Chỉ web, ghép từ các đường đang có | không đụng máy chủ | nhiều request; BPXL bị chặn nên thiếu bước; không tính được bước tương lai | bỏ |

## 4. Thiết kế

### 4.1 Khối **Tuyến** (thành phần web mới `KhoiTuyen`, một kiểu mọi nơi)

```
Tuyến · Vi phạm · Trịnh Ngọc Ánh                       ⓘ
✓ GV ghi 3 vi phạm        Lê Minh Khoa · 10/09/2026      ▸
● Xử lý vi phạm · Report 1 Bạn · hạn 15/09/2026
○ Báo PH                  Phan Mai · sau khi xử lý
```

- **Một dòng một bước:** dấu trạng thái · tên bước (= đúng tên nhóm việc ở Công việc) · chi tiết ngắn (bậc, kết quả "Đã báo PH" / "Chưa liên hệ được · lần 2") · người giữ (tên; chính mình = "Bạn") · ngày làm hoặc hạn (luật hạn NH4: dd/mm/yyyy, chỉ tô màu chữ).
- **Dấu trạng thái** (không chỉ dựa màu — luôn kèm chữ ở tên đọc màn): ✓ xong · ● đang ở bước này · ○ chưa tới lượt (xám, chi tiết "sau khi {bước trước}" hoặc "chờ GVCN xác nhận") · ✕ đã bỏ / từ chối / thu hồi (kèm lý do ngắn) · ⏸ tạm dừng ("Chờ GV sửa").
- **Bước song song** (Meeting): ba dòng cùng một mức thụt, nhãn nhỏ "cùng lúc" ở dòng đầu — không đánh số, không thứ tự (N58).
- **Vòng lặp** (Trả lại → gửi lại, Chưa liên hệ được → lần sau, Thu hồi → Báo lại PH): thêm dòng theo thời gian, không ghi đè; dòng cũ gọn một hàng.
- **Bấm dòng đã xong** → nội dung mở **ngay dưới dòng** (TVV đã báo gì, CX ghi kết quả gì, vi phạm nào, lý do trả lại…), không đổi panel, không panel lồng panel (G4). Người không có quyền xem nội dung (C3): dòng không có ▸, rê/đọc màn "Không xem được nội dung".
- **Vị trí (sửa theo mockup v27 + C6):** ngay **dưới** khối việc base Phụ trách · Hạn · Theo dõi (thứ tự đọc: ai giữ việc này, hạn → tuyến đi đâu → làm → việc con → lịch sử) — giống panel Vận hành.
- **Gọn (C6):** không khung viền / nền riêng; đầu khối là nhãn mục "Tuyến · {tên tuyến}" + "Xong a/b · đang n" như nhãn "Việc con"; dòng 36 px; kẻ trên + dưới.
- **Gập (sau critique):** tuyến > 4 bước gập **các bước đã xong** vào "Xem n bước đã xong"; bước đang ở, bước sau, và bước cha đã xong còn bước con mở luôn hiện. ≤ 4 bước mở sẵn. Bấm dòng có nội dung (cả dòng là vùng bấm, mũi tên ˅ / ˄) → mở tại chỗ.
- **Thay** các câu luật kiểu "Sau khi chốt: TVV nhận việc báo PH…" (ⓘ `quyCheXuLy`, `TomLanXuLy`, dòng bối cảnh `BoiCanh` Meeting, `ThanhBuoc`/`tienDoViec` ở hồ sơ) — bỏ chỗ trùng, giữ lưu ý hậu quả cần thiết (bo-chu-thich).
- **375:** toàn bề ngang, người + ngày xuống dòng hai của bước; vùng bấm ≥ 44 px.

### 4.2 Khối Tuyến hiện ở đâu

| Chỗ | Hiện |
|---|---|
| Mọi panel việc Ý thức / Phối hợp ở Công việc: Xử lý vi phạm, Đã thực hiện, Báo PH (vi phạm · Meeting · Tình hình · Báo lại PH), Vi phạm bị trả lại, Tình hình học tập (TVV hỏi), Phối hợp SOS, Xếp lịch họp, Kết quả meeting, Báo PH kết quả Test | khối Tuyến đầy đủ của **đúng tuyến đó** |
| Panel **nhiều em** (Phối hợp SOS cả lớp, Meeting nhiều em của TVV, lô Xử lý) | mỗi em một dòng có **chuỗi chấm** `✓ ● ○` (kèm tên đọc màn) → bấm mở khối Tuyến của em ngay dưới dòng. **Dòng Meeting nhiều em của TVV** dùng cùng bảng, có ba phần Meeting (sửa lỗ 1.2) |
| Tab **Đang theo dõi** (mọi vai) | **một dòng một tuyến**: lớp · em · tên tuyến · "Đang ở {bước} · {người} · hạn" (hoặc "Xong {ngày}"); bấm → panel chỉ đọc **có khối Tuyến + nội dung theo quyền** (thay `PanelTheoDoiChung` rỗng ruột) |
| **Chờ bạn duyệt** (Head) — dòng Xử lý khác mặc định / Thu hồi / Sửa cấp bậc mở tại dòng | khối Tuyến của lần xử lý đó trong phần chi tiết (thấy các lần xử lý trước, Báo PH đang tới đâu) |
| **Hồ sơ HV / hồ sơ lớp** › Ý thức & Phối hợp | mỗi lần xử lý / mỗi việc Phối hợp có chuỗi chấm + mở khối Tuyến; **chỉ chỗ này** hiện bước "○ chưa tới lượt" cho người không giữ bước nào (vd TVV mở em SOS 3 thấy "Báo PH Meeting · chờ GVCN xác nhận") |

Bước "○ chưa tới lượt" (C2) **không** vào: danh sách Công việc, số việc, badge, chuông, Tổng quan, Phân tích, "Cần làm ngay".

### 4.3 Làm xong phần mình → Đang theo dõi (C1)

- Người **làm xong một bước** của tuyến (GVCN xác nhận / xử lý / gửi Head duyệt, Head duyệt hoặc từ chối, GV gửi lại trả lại, GV gửi Tình hình, TVV hỏi tình hình, BPXL / CX xong phần Meeting) **tự vào theo dõi tuyến đó** nếu tuyến còn bước chưa xong. Người làm bước cuối không cần theo dõi (tuyến xong).
- Theo dõi theo **tuyến**, không theo từng việc: một dòng ở Đang theo dõi dù tuyến có nhiều việc; dòng đổi "Đang ở…" khi tuyến sang bước khác. Người theo dõi mặc định đang có (N58: GVCN + GV ghi + Head + CX trên Báo PH; TVV + GVCN + Head trên Meeting) giữ nguyên, gom theo tuyến.
- Tin "Cập nhật" giữ luật N58 (giao / đổi người, đổi hạn, có kết quả, bỏ, trả lại); **không thêm tin** nào mới, không tin quá hạn tự động.
- "Bỏ theo dõi" bỏ cả tuyến. Tuyến xong → "Vừa xong 7 ngày" (như nay) rồi rời.
- "Yêu cầu của tôi" (gập dưới đáy Công việc GV) **giữ** — nó gom mọi loại yêu cầu (cả học thuật); dòng Đang theo dõi của tuyến Vi phạm ghi "Đang ở Head · chờ duyệt" cùng nguồn dữ liệu. *(Session tự quyết.)*

### 4.4 Tên — một khái niệm một tên

| Hiện | Sau |
|---|---|
| Nhóm "Báo PH" thứ hai trong tab Ý thức & Phối hợp (Báo PH kết quả Test của GVCN) | **bỏ** — việc chuyển sang TVV (4b); tab Ý thức & Phối hợp của GV không còn nhóm Báo PH |
| Chữ "Nhờ TVV" ở việc Báo PH kết quả Test | bỏ — việc là của TVV thật (4b) |
| `dauPanel.loai` ("Theo dõi · …", "Làm thay · …") khai nhưng không vẽ | bỏ trường chết; vai người xem đã nói ở dải "Bạn đang làm thay…" / "Bạn đang theo dõi · chỉ xem" + khối Tuyến ("Bạn") |
| Tên bước trong Tuyến | đúng tên nhóm việc ở Công việc (Xử lý vi phạm · Đã thực hiện · Head duyệt · Báo PH · Vi phạm bị trả lại · Tình hình học tập · Phối hợp SOS / tên việc cụ thể · Xếp lịch họp · Kết quả meeting) |

### 4.5 Máy chủ

- **Một hàm chung** `dungTuyen(loai, khoa, nguoiXem)` (thư mục `server/src/yThuc/tuyen.ts`) trả `{ loai, tieuDe, em, buoc: [{ ten, trangThai: 'xong'|'dang'|'cho'|'bo'|'tam_dung', nguoi, ngay|han, chiTiet, coNoiDung, noiDung? , cungLuc? }] }`.
- **Ranh giới tuyến** *(session tự quyết sau rà người làm)*:
  - **Vi phạm = một lần xử lý** (`discipline_measures.id`). Trước khi có lần xử lý: tuyến "đang chờ xử lý" của em (khoá = em, đúng như việc `yt_xu_ly` đang tính theo em; không có khái niệm "đợt"). Lưu xử lý → tuyến đó thành tuyến của lần xử lý mới. Head xem lần trước qua một dòng "Lần trước: {bậc} · {ngày}" đầu khối, không gộp lần cũ vào tuyến. **Thu hồi** → tuyến cũ kết thúc ✕ "Đã thu hồi"; GVCN xử lý lại = tuyến mới. **Trả lại một vi phạm** thuộc tuyến của lần xử lý có Báo PH đang mở (chỉ trả lại được khi Báo PH còn mở).
  - **Phối hợp SOS = một em × một lượt SOS** — **Meeting CX/GĐCN luôn là mốc cuối** (C8) (vd "Phối hợp SOS · MT2 · SOS 3"): các việc của mốc (Trao đổi ngắn HV, Trao đổi gia đình, GVCN meeting, Meeting CX…) là các bước **song song**, bước con của từng việc (TVV báo PH, ba phần Meeting) thụt dưới việc đó. Hồ sơ HV / Đang theo dõi: **một dòng** cho em × lượt. Khoá = (em, lượt Mock).
  - Báo PH kết quả Test = một em × một đợt Test · Tình hình = `tinh_hinh_hoc_tap.id` · Sửa cấp bậc = `yeu_cau_duyet.id`.
- **Bước tương lai** (○) tính bằng đúng hàm luật đang dùng (`buocTvvViec`, `hanPhanMeeting`, người giữ mặc định `nguoiGiuBaoPh` / `docViec` / `nguoiNhanTraLai`, luật N1 khác mặc định → Head) — không viết lại luật.
- **Quyền (C3):** khung bước trả cho ai có mặt trong tuyến (người giữ / đã làm / theo dõi một bước) hoặc có quyền xem em; `noiDung` chỉ khi người xem có quyền đọc phần đó **theo hàm quyền đang có** (`coTheGhi`, `canManageDiscipline`, quyền xem Ý thức…). BPXL thấy dòng "Báo PH · Đã báo PH · 19/09" nhưng không `noiDung` (N63 ⑤ giữ).
- **Ít request:** đường panel đang có (`xemViecBaoPh`, `xemMeeting`, `xemTraLai`, `xemXuLy`, Xử lý vi phạm, Phối hợp lớp / em, `yThucHocVien`) **trả thêm trường `tuyen`** trong cùng request; chỉ Đang theo dõi + Chờ duyệt dùng đường riêng `GET /tuyen/:loai/:khoa` khi mở dòng. Bảng nhiều em: chuỗi chấm tính theo lô trong cùng câu, mở chi tiết mới gọi đường riêng. Trần câu / dòng mỗi đường ở `server/src/tests/tocDoDuong.ts`, đo trước → sau trong mô tả PR (mục tiêu ≤ +4 câu mỗi panel, không N+1).
- **Theo dõi theo tuyến** *(session tự quyết sau rà người làm)*:
  - Theo dõi do luật tuyến (C1) lưu **tách** khỏi người theo dõi từng việc của N58 (cột nguồn / khoá tuyến, hoặc bảng nhỏ riêng — người làm chọn cách ít đổi). Nó **không** là quyền đọc: không đi vào `laNguoiTheoDoi` / `requireDoc`; quyền đọc nội dung chỉ theo C3. Người theo dõi tay một việc (N58) giữ như nay.
  - **Không thêm tin:** theo dõi do luật tuyến không nhận tin "Cập nhật" mới; tin đang có (N41 GVCN nhận tin khi TVV báo PH xong, N58 tin cho người theo dõi tay…) giữ nguyên. Người muốn tin thì theo dõi tay việc đó (N58). Chuông không đổi.
  - **Bỏ theo dõi** = bỏ cả tuyến; tuyến sinh việc mới sau đó **không tự thêm lại** người đã bỏ (chỉ thêm lại khi người đó tự làm thêm một bước).
  - **Bù dữ liệu khi deploy:** migrate một lần cho tuyến **đang mở** — người đã làm một bước (`performed_by` của lần xử lý, người quyết thẻ duyệt, người xác nhận Phối hợp, người xong phần Meeting, người gửi Tình hình / hỏi tình hình) thành người theo dõi tuyến (như TD-HEAD-CX). Thử trên bản chép `mig.sqlite`, ghi số dòng.
  - `viecTheoDoi` trả một dòng / tuyến + bước đang ở; dòng theo dõi tay N58 của việc thuộc tuyến gom vào cùng dòng tuyến.

### 4.6 Khung việc base cho mọi việc Ý thức / Phối hợp / Báo PH (C6 — chủ SP 26/11)

Một panel việc = **đầu** (tên việc · em · lớp · ⓘ ⋯ ✕) → **khối việc** → **Tuyến** → **nội dung / form của việc** → **Việc con** → **Lịch sử** (gập) → chân Lưu.

| Phần | Luật | Dùng lại |
|---|---|---|
| Khối việc | **Phụ trách** = ô bấm {tên} "bạn" ▾ (bấm là đổi — **không nút "Đổi"**, C7) · thẻ "mặc định" / "{tên} giao" · **Hạn** = ô bấm cùng kiểu, ngày tô màu (không nút "Sửa hạn") · **Theo dõi** chip + "+" · Mô tả (tuỳ chọn, N62). Hạn chỉ ở khối (bỏ ngày lặp ở đầu panel) | `KhoiGiaoViec`, `HanBam`, `DongTheoDoi`, `HopDoiNguoi` |
| Người làm mặc định | theo luật từng việc (N1, N6, N58, N61, 4b.2) — "Về mặc định" như N58 | máy chủ `nguoiGiu*`, `docViec` |
| Áp cho | mọi việc ở mục 4.2, **gồm cả Xử lý vi phạm, Đã thực hiện, Phối hợp SOS của GVCN** (trước đây N58 để ngoài khối giao việc) — **chủ SP 26/11 duyệt: "Cho mọi việc"**. Đổi người = giao đúng việc đó (người nhận làm được việc đó, như N58); quyền đổi như N58 (người đang giữ · Head · Quản trị · CX) | đường `/giao-viec/:loai/:id` thêm loại |
| Việc con | "+ Việc con" như việc Vận hành (N59): một cấp, mỗi việc con có tên · người · hạn (bấm sửa), tick xong; không bắt buộc, không chặn việc cha, **không vào số việc của việc cha**; người được giao việc con thấy nó ở Công việc như việc Vận hành được giao | bảng / đường việc con N59, gắn việc cha (loại, id) |
| Panel nhiều em | khối việc + Tuyến của TỪNG em nằm trong khay mở dưới dòng em (không khối chung ở đầu panel) | `bem` / `BangPhoiHop` |
| Không thêm bước duyệt | Head **không** duyệt gì mới (C5) — Head ở "Theo dõi" của Báo PH; duyệt chỉ N1 / N5 / N70 | — |

## 4b. Báo PH thống nhất — mọi việc động tới PH là MỘT loại việc "TVV báo PH"

**Lời chủ SP 26/11 (qua PTA Plan, nguyên văn):** "Những việc liên quan đến báo kết quả test hay báo gì đó cho PH từ các test mọc ra (case SOS, test lớp thường), nói chung cứ động đến PH, thì cần phải tạo task cho TVV và có head theo dõi như là các phần khác, cố gắng làm đồng bộ hết tất cả các công việc liên quan đến TVV báo cho PH nhé"

### 4b.1 Kiểm kê hiện trạng (code `origin/main` b636a5545)

| Nguồn | Ai làm hôm nay | Việc TVV? | Hạn | Head theo dõi? |
|---|---|---|---|---|
| Báo PH sau xử lý vi phạm (`sinhViecBaoPh`) | TVV (không TVV → Head) | có | 5 ngày | có (+ GVCN, GV ghi, CX) |
| Báo lại PH sau thu hồi (`bao_lai_cua`) | TVV | có | 5 ngày | **không ai theo dõi** |
| Tình hình học tập GV → TVV (`guiTinhHinh`) | TVV | có | 5 ngày | **không ai theo dõi** (GV gửi chỉ nhận tin khi "Đã báo PH") |
| Meeting CX / GĐCN sau Mock (`dongBoViecTvv`) | TVV (**không TVV → GVCN**) | có | 5 ngày | có (+ TVV, GVCN) |
| Phối hợp SOS **Trao đổi với gia đình** (`talk_family`, mọi ô SOS) | **GVCN** bấm Xác nhận | **không** | không | không |
| Báo PH kết quả Test lớp thường — **Progress** (`dongBoBaoPh`, có môn trượt) | **GVCN** ("nhờ TVV" nhưng TVV không có việc) | **không** | không | không |
| Báo PH kết quả Test lớp thường — **Final** < 50 % / 50–59 % học lại (`cuoiKhoa` `viecKhiChot`) | **Head** | **không** | không | — |
| Báo cáo PH tháng / đợt (N40) | GV viết, Admin xuất; không ai theo dõi việc gửi tới PH | không | — | — |
| Vắng lần 2 lớp thường | chỉ tin cho GVCN "xem có cần trao đổi với em / PH" | không | — | — |
| Case / PA học thuật, PA quy chế, Kỳ vọng FT, Thi thật, Mock `final_soon` | không có bước PH (bước `talk_parent` ở `cases/sos.ts:57` là mã chết) | — | — | — |

Lệch khác: em không có TVV → vi phạm về **Head**, Meeting về **GVCN** · Xét lại lộ trình hiện "TVV" của mục Phụ huynh bằng `performed_by` (người bấm xong — GVCN / Head), không phải TVV.

### 4b.2 Luật chung "TVV báo PH" (áp cho MỌI nguồn sinh việc ở 4b.3)

| Mặt | Luật |
|---|---|
| Loại việc | một loại: bảng `viec_bao_ph`, nhóm **"Báo PH"** ở tab Báo PH của TVV; tên dòng = nguồn (Vi phạm · Báo lại · Tình hình học tập · Meeting CX/GĐCN · Trao đổi gia đình · Kết quả Progress · Kết quả Final) |
| Người làm | **TVV của em**; em không có TVV → **Head chi nhánh** (theo N6 — Meeting thôi về GVCN); giao lại được (N58); TVV cùng chi nhánh, CX, Head làm được như nay |
| Hạn | **5 ngày lịch** tính cả ngày sinh việc (`hanBaoPh`, N2), sửa được (N34 ①), tạm dừng khi em Tạm dừng / "Chờ GV sửa" như nay |
| Theo dõi mặc định | **Head chi nhánh + CX** (như Báo PH vi phạm) + **người tạo ra việc** (GVCN / GV ghi / GV gửi Tình hình / người chốt Final) — áp cả Báo lại PH, Tình hình (đang thiếu) |
| Panel | một panel `PanelBaoPhTvv`: khối Tuyến (mục 4.1) → Phụ trách · Hạn · Theo dõi → bối cảnh theo nguồn (vi phạm / điểm Test / nội dung GV gửi / phần Meeting) → form **Kết quả (Đã báo PH / Chưa liên hệ được) · Ngày · Nội dung** → Lịch sử |
| Hoàn tác / sửa sai | như Báo PH vi phạm: Bỏ việc → Khôi phục (Thùng rác N28), giao lại có Hoàn tác, "Chưa liên hệ được" giữ việc mở + đếm lần; nguồn bị gỡ (điểm sửa hết trượt, thu hồi, huỷ lượt, Lộ trình mới) → việc tự đóng / mở lại như luật nguồn đang có |
| Dòng ở Công việc | khuôn A (NH10): một dòng một lớp × nguồn × đợt, "n em" mở tại chỗ |
| Tin | giữ tin hiện có (GVCN / GV gửi nhận tin khi có kết quả — N41); người theo dõi mặc định nhận "Cập nhật" theo N58; không thêm vào số chuông |

### 4b.3 Nguồn sinh việc sau khi đồng bộ

| Nguồn | Sinh việc TVV khi | Thay đổi |
|---|---|---|
| Xử lý vi phạm | lưu đúng mặc định / Head chốt (N1) | giữ |
| Báo lại PH | thu hồi khi đã báo PH | + theo dõi mặc định |
| Tình hình học tập | GV gửi | + theo dõi mặc định |
| Meeting CX / GĐCN | GVCN xác nhận | không TVV → Head (đồng bộ N6) |
| **Trao đổi với gia đình** (Phối hợp SOS) | Mock có SOS điền sẵn việc `talk_family` (như nay) → **sinh thẳng việc TVV**, nội dung máy điền (MT · Overall · kỹ năng trượt · Case / PA nếu có) | **GVCN thôi việc này** (chỉ theo dõi; ghi chú thêm tuỳ chọn) — chủ SP 26/11 Q-PH1 |
| **Kết quả Progress lớp thường** (có môn trượt) | `dongBoBaoPh` như nay (có môn trượt) → **sinh thẳng việc TVV**, nội dung máy điền (điểm từng môn · môn trượt · nhận xét GV) | **GVCN thôi việc** (theo dõi); **thay N6** "Báo PH kết quả Test lớp thường giữ GVCN" — chủ SP 26/11 Q-PH1 |
| **Kết quả Final lớp thường** (< 50 % · 50–59 % học lại) | Cuối khoá chốt (`viecKhiChot`) như nay → **sinh thẳng việc TVV**, nội dung máy điền (Final từng môn · hướng đã chốt) | **Head thôi việc**, thành người theo dõi; Xét lại lộ trình đọc kết quả + **tên TVV thật** — chủ SP 26/11 Q-PH1 |
| Báo cáo PH tháng / đợt (N40) | **không sinh việc TVV** — Admin gửi theo lô như nay (chủ SP 26/11 Q-PH2) | giữ |
| Vắng lần 2 lớp thường | không sinh việc *(session tự quyết: vắng không bao giờ là việc — tinh thần N38 / N57; tin cho GVCN giữ)* | giữ |

## 5. Luật mới — **chủ SP duyệt 26/11** (đề xuất số N72; PTA Plan ghi vào `plan.md` 1.6 khi duyệt đặc tả)

**N72 · Tuyến việc Ý thức & Phối hợp:** ① làm xong phần mình → việc rời "việc cần làm", người đó tự theo dõi **cả tuyến** ở Đang theo dõi (một dòng một tuyến, "Đang ở {bước} · {người}"); số việc / badge / chuông không đổi · ② mọi panel việc Ý thức / Phối hợp, Đang theo dõi, Chờ duyệt, hồ sơ HV / lớp có chung **khối Tuyến** (bước · người · trạng thái · ngày; bấm bước mở nội dung tại chỗ) · ③ bước **chưa tới lượt** hiện xám trong khối Tuyến, **không** thành việc / số / chuông · ④ khung tuyến ai có mặt trong tuyến cũng thấy; **nội dung theo quyền xem sẵn có, không cấp quyền mới**. Không đổi luật từng bước (người giữ, hạn, duyệt) ngoài ⑤ ⑥ · ⑤ **Báo PH thống nhất** (chủ SP 26/11, qua PTA Plan + Q-PH1 / Q-PH2 "theo khuyến nghị"): mọi việc động tới PH là **một loại việc "TVV báo PH"** — người làm TVV của em (không TVV → Head), hạn 5 ngày (N2), Head + CX + người tạo việc theo dõi mặc định, một panel, một cách Hoàn tác; **Trao đổi với gia đình (Phối hợp SOS), kết quả Progress / Final lớp thường sinh thẳng việc TVV, nội dung máy điền, GVCN / Head thôi bước này (thay N6 phần "Báo PH kết quả Test lớp thường giữ GVCN")**; Báo cáo PH tháng / đợt không sinh việc TVV; vắng lần 2 chỉ tin như nay · ⑥ **Khung việc base** (chủ SP 26/11 sau mockup v27 — C5, C6): mọi việc Ý thức / Phối hợp / Báo PH có khối Phụ trách · Hạn (bấm ngày để sửa) · Theo dõi như việc Vận hành, người làm mặc định theo luật và **Đổi được** (**mọi việc trong tuyến**, gồm Xử lý vi phạm, Đã thực hiện, Phối hợp SOS của GVCN — mở rộng N58; chủ SP 26/11 trả lời [XM] 10: "Cho mọi việc"), có **Việc con** như N59; **không thêm bước Head duyệt** — duyệt chỉ N1 / N5 / N70 · Phụ trách và Hạn cùng một kiểu **ô bấm** (bấm thẳng là đổi, không nút "Đổi" — C7) · **Meeting CX/GĐCN là mốc cuối** của tuyến Phối hợp SOS (hiện cuối, tuyến xong khi Meeting xong, không thêm điều kiện chặn — C8).

## 6. Mockup cần vẽ — `thiet-ke/v27/tuyen-cong-viec.html` (+ ghi chú, ảnh)

Dữ liệu bịa theo seed (hôm nay T2 14/09/2026, MB FT 101, GVCN Trần Ngọc Hà, TVV Phan Mai, BPXL Lương Thu Trang, CX Vũ Thanh Tâm, Head Nguyễn Khánh Vy). Mỗi khung **1440 tối + 375 sáng**; nền v24 (khuôn A, panel 720) + v22 (khối Phụ trách · Hạn · Theo dõi).

| Khung | Vẽ | Trạng thái phải có |
|---|---|---|
| T0 | Khối Tuyến (bảng thành phần) | ✓ ● ○ ✕ ⏸ · song song "cùng lúc" · vòng Trả lại / Chưa liên hệ được · dòng mở nội dung · dòng không quyền xem nội dung · gập "n bước ▾" vs mở sẵn · 375 |
| T1 | GVCN · panel **Xử lý vi phạm** | tuyến 3 bước, đang ở GVCN · chọn "Không nâng" → ○ Head duyệt hiện thêm |
| T2 | GVCN · **Đã thực hiện** sau Head duyệt | ✓ Head duyệt (ai, ngày) |
| T3 | TVV · **Báo PH vi phạm** | tuyến đủ + ⏸ Chờ GV sửa · lần 2 "Chưa liên hệ được" |
| T4 | GV ghi · **Vi phạm bị trả lại** | thấy lần xử lý + Báo PH đang tạm dừng |
| T5 | GVCN · panel **Phối hợp SOS cả lớp** (Meeting 4 em) | chuỗi chấm từng em · em đã xác nhận vẫn tra được (qua Đang theo dõi, không ở danh sách cần làm) · mở Tuyến một em |
| T6 | BPXL · **Xếp lịch họp** · CX · **Kết quả meeting** · TVV · **Báo PH Meeting** (một em + nhiều em) | ba phần song song; BPXL không đọc nội dung Báo PH |
| T7 | **Tình hình học tập** hai chiều (GV → TVV, TVV → GVCN) | tuyến 2 bước, GV gửi theo dõi |
| T11 | TVV · tab **Báo PH** đủ mọi nguồn (Vi phạm · Báo lại · Tình hình · Meeting · Trao đổi gia đình · Kết quả Progress · Kết quả Final) + panel **Trao đổi gia đình** và **Kết quả Progress** (nội dung máy điền) | dòng khuôn A lớp × nguồn, n em mở tại chỗ · em không TVV → ở Head · Xét lại lộ trình hiện tên TVV thật |
| T8 | **Đang theo dõi** (GVCN, Head) + panel chỉ đọc có Tuyến + nội dung | "Đang ở…", "Vừa xong 7 ngày", rỗng |
| T9 | Head · **Chờ bạn duyệt** dòng mở có Tuyến | khác mặc định · thu hồi · sửa cấp bậc |
| T10 | **Hồ sơ HV** › Ý thức & Phối hợp (TVV xem em SOS 3) | ○ "Báo PH Meeting · chờ GVCN xác nhận"; hồ sơ lớp chuỗi chấm |

Rà mockup: bảng ý → khung (mục 2, 4) + `impeccable critique` + `ui-ux-pro-max`; ảnh **cả màn** (danh sách + panel) 1440 / 1280 / 375 (rà-panel-cả-màn); soi ✕ / ⋯ ≤ 1 px; không chú thích tĩnh lên web.

## 7. Kế hoạch PR (PTA Plan giao sau khi mockup duyệt)

| PR | Phạm vi | Model · effort |
|---|---|---|
| **TUYEN-0** (máy chủ, chạy trước) | `dungTuyen` + bước tương lai + quyền nội dung (C3) · trường `tuyen` trong các đường panel · `GET /tuyen/:loai/:khoa` · theo dõi theo tuyến + tự theo dõi khi làm xong bước (C1) · `viecTheoDoi` một dòng / tuyến · trần `tocDoDuong.ts` · kiểm: mỗi loại tuyến (vi phạm mặc định / khác mặc định / thu hồi / trả lại; Phối hợp có / không bước TVV; Meeting đủ ba phần; Tình hình hai chiều; sửa cấp bậc), BPXL không nhận `noiDung`, số việc / chuông không đổi | Opus 5.5 · high (B: Sonnet 5.5 · high) · `/code-review high` khi rà |
| **BAOPH-0** (máy chủ, cùng đợt / trước TUYEN-0) | 4.6 máy chủ: `/giao-viec` thêm loại Xử lý vi phạm · Đã thực hiện · Phối hợp SOS (GVCN) — đổi người / hạn / theo dõi / mô tả; việc con N59 gắn việc cha (loại, id) ·  4b: Trao đổi gia đình + kết quả Progress / Final sinh việc `viec_bao_ph` TVV (nội dung máy điền; nguồn bị gỡ → việc tự đóng / mở lại như nay), GVCN / Head thôi việc cũ · theo dõi mặc định Head + CX + người tạo cho mọi nguồn (Báo lại PH, Tình hình đang thiếu) · Meeting không TVV → Head · Xét lại đọc tên TVV thật · **migrate**: việc `talk_family` / `bao_ph_tvv` đang chờ → việc TVV (thử trên `mig.sqlite`, ghi số dòng) · kiểm: số việc GVCN giảm đúng, TVV tăng đúng, Hoàn tác / Bỏ / Khôi phục | Opus 5.5 · high · `/code-review high` |
| **TUYEN-1** (web) | `KhoiTuyen` gọn + khung việc base (4.6: `KhoiGiaoViec` mọi panel, Việc con) + panel Ý thức (Xử lý vi phạm, Đã thực hiện, Báo PH, Vi phạm bị trả lại, Tình hình) · bỏ câu luật trùng | Opus 5.5 · medium · `/ponytail lite`, impeccable `layout` `harden` `audit` |
| **TUYEN-2** (web) | Phối hợp SOS cả lớp + Meeting (BPXL / CX / TVV một + nhiều em) + tab Báo PH của TVV đủ mọi nguồn (T11) | như trên |
| **TUYEN-3** (web) | Đang theo dõi một dòng / tuyến + panel chỉ đọc có nội dung · Chờ duyệt Head | như trên |
| **TUYEN-4** (web) | Hồ sơ HV / hồ sơ lớp › Ý thức & Phối hợp: chuỗi chấm + Tuyến, thay `ThanhBuoc` / `tienDoViec` | như trên |

TUYEN-1…4 nối sau TUYEN-0; mỗi PR giao diện: bảng truy vết khung → thành phần → ảnh, ảnh cặp cả màn, cổng ≥ 90 % KHỚP, chủ SP duyệt ảnh trước merge (Q-3…Q-6), bảng thao tác TRƯỚC → SAU (mọi thao tác cũ giữ: Đổi, Sửa hạn, Theo dõi, Trả lại, Bỏ việc, Thêm việc, Xác nhận n em, Hoàn tác, Lưu · việc tiếp ›).

## 8. Để người làm tự quyết

- Gập / mở mặc định của khối Tuyến (mục 4.1) — theo ảnh mockup chủ SP duyệt.
- Cách lưu theo dõi theo tuyến (cột mới vs gom khi đọc) — chọn cách ít đổi, giữ được Hoàn tác / Bỏ theo dõi.
- Chữ chi tiết từng bước — ngắn, theo bảng thuật ngữ sẵn có.
