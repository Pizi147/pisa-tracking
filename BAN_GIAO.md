# Bàn giao hiện hành — PISA Progress

> Cập nhật **18/09/2026**. File này **thay thế** mọi `BAN_GIAO_*.md` cũ; chúng giữ lại chỉ để
> tra lịch sử, **không phải luật**.
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

## 3. Trạng thái — đã kiểm bằng lệnh, ngày 18/09/2026

| | |
|---|---|
| `main` | `a0a0766` — Merge PR #20 |
| `npm test` | **326 phép kiểm, đạt hết** |
| `npx tsc -p tsconfig.build.json --noEmit` | sạch |
| `npx tsc -p tsconfig.web.json --noEmit` | sạch |
| Nhánh còn tồn | **không** — mọi nhánh phụ đã merge trọn vào `main` |

### Đã merge

| PR | Nội dung |
|---|---|
| **#17** | Việc 27 · 28 · 29 — hồ sơ lớp, Thực trạng, công việc quản lý, bộ demo |
| **#18** | Hồ sơ A: thẻ case ghi kết quả tại chỗ · Hành trình hai cách đọc · tab Tình hình đơn vị · tuần mặc định bảng chấm |
| **#19** | `plan.md` — kế hoạch giai đoạn sau PR18 |
| **#20** | **PR1: Số khớp danh sách, và có đường đi tới đó** |

PR1 đã xong. Chi tiết nó làm gì: `plan.md` mục 5. Điểm đáng nhớ nhất là luật đếm "bài cần
chấm" nay ở **đúng một hàm** (`shared/domain/fasttrack.ts` → `pendingSkillsOf`), nên badge và
danh sách không thể lệch nhau nữa — trước đó Quản trị thấy badge 28 mà bấm vào ra 0.

---

## 4. Làm gì tiếp

Theo `plan.md` mục 4, đúng thứ tự này:

| Việc tiếp | Ở đâu trong `plan.md` | Mức chi tiết |
|---|---|---|
| **PR-A — Mở lại việc tạo case Ý thức** (lỗi P0) | mục 6 | **Đã viết tới mức bước**, làm được ngay |
| PR2 — Bộ chọn tuần dùng chung, rồi Kế hoạch Test | mục 7 | Mức thiết kế; viết task khi tới lượt |
| PR3 — Chấm điểm, dấu "–", màn hồ sơ Test gọn | mục 8 | Mức thiết kế |
| PR-B — Phân công GV, nốt phần còn thiếu | mục 9 | Mức thiết kế; không chặn ai |

**PR-A nên làm trước** vì nó là lỗi chặn hẳn: chọn nhóm Ý thức trong form `+ Case` thì không
có phân loại nào để bấm, mà form lại đòi phân loại. Không tạo được case Ý thức qua giao diện.

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
