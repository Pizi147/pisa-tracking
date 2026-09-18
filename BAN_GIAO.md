# Bàn giao hiện hành — PISA Progress

> Cập nhật **19/09/2026 (đêm)**. File này **thay thế** mọi `BAN_GIAO_*.md` cũ; chúng giữ lại
> chỉ để tra lịch sử, **không phải luật**.
>
> File này cố ý **ngắn**. Nó chỉ trả lời: *đang ở đâu · thư mục nào · làm gì tiếp*.
> Kế hoạch chi tiết nằm ở **`plan.md`** và không được chép lại ở đây — chép lại là cách đã
> tạo ra sự cố ghi ở mục 5.

---

## 1. Đọc theo thứ tự này

| # | File | Vì sao |
|---|---|---|
| 1 | **File này** | Đang ở đâu, thư mục nào, làm gì tiếp |
| 2 | **`plan.md`** | Kế hoạch đang chạy, chi tiết tới mức bước. **File sống** — mục 0.2 là quy tắc bắt buộc cập nhật |
| 3 | `CODE_MAP.md` | Muốn sửa chỗ nào thì mở file nào. Có mục tra **theo màn hình** cho người không đọc code |
| 4 | `DEMO_SCENARIOS.md` | Mở hồ sơ nào để xem tình huống nào |
| 5 | `vong7/BRIEF_OVERHAUL_SAU_PR15.md` | Đề bài nghiệp vụ gốc |

Sổ audit `PISA-PR17-Audit-and-Change-Register.md` **không nằm trong repo** — chủ sản phẩm giữ
riêng. Nó là nguồn luật nghiệp vụ cao nhất; mục 13 và 14 là bản mới nhất. Cần thì xin chủ
sản phẩm gửi lại.

---

## 2. THƯ MỤC ĐÚNG — đọc trước khi chạy bất cứ lệnh gì

```
C:\Users\Admin\Downloads\Github\Pisa students tracking\pisa-tracking
```

Đây là thư mục GitHub Desktop quản lý, và là **bản duy nhất** kể từ 18/09/2026.

**Đã từng có bản thứ hai** ở `C:\Users\Admin\Downloads\Pisa students tracking\pisa-tracking` —
một lần `clone` riêng, có `.git` riêng, nên sửa ở bản này thì bản kia không biết. Nó đã làm
chủ sản phẩm tưởng mình mất việc: `plan.md` mới nằm ở một bản, còn session thì chạy ở bản
kia. Bản đó đã được xoá sau khi kiểm chắc **không có commit nào nằm ngoài `origin/main`**.

**Nếu thấy hai thư mục cùng tên ở hai nơi, dừng lại và hỏi chủ sản phẩm.** Đừng đoán bản nào
là thật. Câu lệnh kiểm:

```bash
git log --oneline --all --not origin/main
```

Trả về rỗng = mọi thứ trong bản đó đã có trên GitHub, xoá được. Trả về có dòng = **có việc
chưa sao lưu ở đâu cả**, phải đẩy lên trước.

---

## 3. Trạng thái — đã kiểm bằng lệnh, đêm 19/09/2026

| | |
|---|---|
| `main` | `98efd88` — Merge PR #26 (PR2b) |
| `npm test` trên `main` | **342 phép kiểm, đạt hết** |
| `npx tsc -p tsconfig.build.json --noEmit` trên `main` | sạch |
| `npx tsc -p tsconfig.web.json --noEmit` trên `main` | sạch |
| Nhánh còn mở, **chưa merge** | `worktree-pr-c-form-case-gon` — xem mục 4 |

### Đã merge vào `main`

| PR | Nội dung |
|---|---|
| **#17** | Việc 27 · 28 · 29 — hồ sơ lớp, Thực trạng, công việc quản lý, bộ demo |
| **#18** | Hồ sơ A: thẻ case ghi kết quả tại chỗ · Hành trình hai cách đọc · tab Tình hình đơn vị · tuần mặc định bảng chấm |
| **#19** | `plan.md` — kế hoạch giai đoạn sau PR18 |
| **#20** | PR1: Số khớp danh sách, và có đường đi tới đó |
| **#24** | PR2a: bộ chọn tuần dùng chung (`WeekPicker`/`usePeriodWindow`) |
| **#25** | Kế hoạch PR-C và PR-D viết vào `plan.md` (chưa code, chỉ thiết kế) |
| **#26** | PR2b: Kế hoạch Test chỉ hiện lớp Fast Track, quyền dời lịch skill của lớp Normal (`SCHEDULE_MOVE`) |

PR2b đã merge nhưng **để lại một lỗ chưa vá**: quyền `SCHEDULE_MOVE` mới cho giáo viên lớp
Normal đã đúng ở máy chủ, nhưng **chưa có nút nào trên giao diện gọi tới nó** — giáo viên lớp
Normal vẫn không tự dời được lịch skill qua màn hình. Ghi ở `plan.md` mục 7b/12.6. Không chặn
việc gì khác, nhưng đừng báo là "đã xong" nếu chưa vá.

---

## 4. Làm gì tiếp — đúng thứ tự

### 4.1. PR-C — đang mở PR, **CHƯA MERGE**, việc đầu tiên cần làm

- Nhánh: `worktree-pr-c-form-case-gon` (đã đẩy lên GitHub)
- PR: **#27** — https://github.com/Pizi147/pisa-tracking/pull/27
- Nội dung: form `+ Case` nhóm Ý thức chỉ hỏi một câu (không hỏi trùng), case Ý thức không
  nhận ngày quá khứ, thêm tab "Đã xong từ trước" để nhập bù case cũ, và siết quyền sửa case
  đúng giáo viên dạy đúng môn (trước đây một GVBM sửa được MỌI case của lớp, kể cả môn khác).
- Trạng thái: **347 phép kiểm tự động đạt hết**, hai lệnh `tsc` sạch. Đã bấm thử tay **một
  vai** (Quản trị hệ thống) qua trình duyệt cho tab nhập bù — xem chi tiết và danh sách CHƯA
  bấm thử ở `plan.md` mục 14, dòng "19/09/2026 (đêm)".
- **Việc cần làm tiếp với PR-C, trước khi merge:**
  1. Bấm thử tay ba vai còn lại của mục 10.6: GVBM Listening · GVBM Reading · GVCN — cả hai
     nhóm Học thuật lẫn Ý thức của tab "Đã xong từ trước".
  2. Đọc kết quả review tự động (nếu đã chạy — tìm bình luận trên PR #27) và xử lý các điểm
     Critical/Important nếu có.
  3. Sau khi chủ sản phẩm xem và đồng ý, **chủ sản phẩm sẽ tự merge** — session code không tự
     merge PR này.

### 4.2. PR-D — Khung case gọn, **phải branch từ PR-C, không phải từ `main`**

- `plan.md` mục 11. Phụ thuộc PR-C: PR-D dùng đúng cái form và cái quyền PR-C vừa sửa, và gỡ
  bớt khung case lồng nhau ở hồ sơ học viên (`SkillBoard.tsx` đang nhúng nguyên `CasePanel.tsx`
  vào bên dưới — hai khối hiện cùng một case bằng hai cách khác nhau).
- **Trước khi mở PR-D:** `git diff --stat worktree-pr-c-form-case-gon` để chắc PR-D không
  đảo ngược việc gì PR-C vừa làm.
- Nếu lúc làm PR-D mà PR-C **đã merge vào `main`** rồi, branch PR-D từ `main` như bình thường
  — chỉ cần branch-từ-PR-C khi PR-C còn chưa merge.

### 4.3. PR-B — Phân công GV, độc lập, branch từ `main`

`plan.md` mục 9. Không phụ thuộc PR-C/PR-D, làm lúc nào cũng được.

### 4.4. PR3 — Chấm điểm, dấu "–", màn hồ sơ Test gọn

`plan.md` mục 8. Mức thiết kế, chưa viết tới mức bước — viết task khi tới lượt.

---

## 5. Cái bẫy đã sập hai lần — đừng sập lần thứ ba

**Lần 1: tin file bàn giao.** `BAN_GIAO_CHAT_TIEP_THEO.md` ghi ô điểm "chênh lệch so với lượt
trước" như một quyết định, trong khi sổ audit đã chốt ngược lại từ 17/09. File bàn giao chép
lại **thứ đã code**, không phải **thứ đã chốt**. Vòng sau tin nó nên tưởng quyết định là sai.

**Lần 2: hai thư mục.** Xem mục 2.

Thứ tự tin cậy, ghi ở `plan.md` mục 1.2:

> **sổ audit mục 13–14 > `vong7/BRIEF_OVERHAUL_SAU_PR15.md` > code đang chạy > file bàn giao**

Và: **chạy thật > đọc code**. Hai lỗi lớn nhất của giai đoạn này (badge lệch, không tạo được
case Ý thức) chỉ lộ ra khi chạy thật; đọc code thì cả hai trông như đang đúng, và bộ kiểm thử
vẫn xanh.

---

## 6. Ba ràng buộc của chủ sản phẩm

1. **Chủ sản phẩm KHÔNG BIẾT CODE.** Báo cáo bằng tiếng Việt, nói *cái gì đổi trên màn hình*.
   Không nói tên hàm, tên bảng dữ liệu.
2. **Đừng để máy chủ chạy ngầm.** Xong việc thì tắt, kiểm cổng 5173 và 4000 đã trống.
3. **Đừng merge, đừng deploy, đừng gửi gì ra ngoài** nếu chủ sản phẩm không bảo.

Thêm: **LOGICAL · SIMPLE · PRACTICAL · USER-FRIENDLY · INTUITIVE.** Không overhaul toàn hệ
thống. Không reset bộ demo. Không mở rộng phân quyền.

---

## 7. Bật lên xem

```bash
npm run dev
```

Mở http://localhost:5173, vào bằng tab **"Vào nhanh bằng tài khoản demo"** — bấm một tài
khoản là vào, không cần mật khẩu.

| Xem gì | Mở đâu |
|---|---|
| Hồ sơ dày nhất: 5 case, một case hai phương án hạn khác nhau, Ý thức hai đợt | **MB-FT 101 → Lê Quang Huy** (`/hoc-vien/3`) |
| Hai case song song cùng một kỹ năng | **CP-FT 110 → Đinh Ngọc Quyên** → Writing Task 2 |
| Bảng chấm điểm | `/nhap-diem/3` |
| Tiến độ công việc và tab Tình hình đơn vị | `/tien-do-cong-viec` |

**Kiểm bằng ba vai**: một giáo viên bộ môn · Quản lý Monbay · Quản trị hệ thống. Lỗi badge
của PR1 chỉ lộ ra ở vai Quản lý và Quản trị — một vai thôi là không thấy gì.

Xong thì tắt:

```bash
pkill -f concurrently
```

Rồi kiểm cổng 5173 và 4000 đã trống.

---

## 8. Kỹ thuật dễ vấp

| Chuyện | Phải làm thế nào |
|---|---|
| Biên dịch | Dùng **`tsc`**. **TUYỆT ĐỐI KHÔNG** `tsx` hay `esbuild` làm trình chạy TS — cả hai đã từng làm hỏng máy chủ sản phẩm (Windows) |
| Đường dẫn khi import | Bắt buộc có đuôi `.ts` / `.tsx`. Thiếu là gãy |
| Sau khi sửa máy chủ | **Bắt buộc** `npm run build:server`. `npm run dev` KHÔNG tự dựng lại máy chủ |
| Chạy kiểm thử | `npm test` — harness **không có bộ lọc**, nó chạy cả bộ. Xác minh một phép kiểm mới bằng cách tìm tên nó trong kết quả |
| Ngày demo | **14/09/2026** cố định. `demoToday()` ở máy chủ, `session.demoDate` ở web |
| Dựng lại bộ demo | `npm run seed` · nâng cấp database đang có: `npm run migrate` |
| Sao chép database | Phải chép **cả ba** file `.sqlite`, `.sqlite-wal`, `.sqlite-shm`. Chép mỗi `.sqlite` sẽ ra một bản CŨ |
| `gh` CLI | Đã cài và **đã đăng nhập** (`Pizi147`). Nếu shell không thấy `gh` thì gọi `& "C:\Program Files\GitHub CLI\gh.exe"` |

---

## 9. Lịch sử cập nhật file này

| Ngày | Đổi gì |
|---|---|
| 18/09/2026 | Tạo file, thay thế ba file `BAN_GIAO_*.md` cũ. Gộp một bản thư mục duy nhất ở `Downloads\Github\...`, xoá bản trùng sau khi kiểm không có commit nào nằm ngoài `origin/main`. Ghi lại cả hai lần sập bẫy ở mục 5 |
| 19/09/2026 (đêm) | Cập nhật sau một phiên làm việc qua đêm: PR2a (#24) và PR2b (#26) đã merge; PR-C mở PR #27 (form case, nhập bù, siết quyền AUTH-01) — **chưa merge**, chờ chủ sản phẩm xem. Ghi rõ PR-D phải branch từ nhánh PR-C chứ không phải từ `main`, và PR2b để lại một lỗ UI chưa vá (giáo viên Normal chưa có nút dời lịch). Việc cập nhật này viết ở nhánh riêng `worktree-docs-ban-giao-pr-c`, không gộp vào PR-C, để giữ PR-C gọn đúng phạm vi của nó |
