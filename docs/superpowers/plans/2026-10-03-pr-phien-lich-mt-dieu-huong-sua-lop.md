# Phiên đăng nhập · Lịch MT linh hoạt · Điều hướng hồ sơ · Sửa cả lớp — Kế hoạch (03/10, chủ sản phẩm)

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sửa lỗi "báo đăng xuất giả", gom thao tác lịch MT (dời / huỷ lịch / xếp / nhập điểm) về panel Lộ trình và cho dời vượt lượt sau có xác nhận, thêm cột Dự kiến thi + Sắp tới có kỳ vọng, nút học viên/lớp kế tiếp, và panel sửa thông tin cả lớp.

**Architecture:** Bốn PR độc lập theo thứ tự PR-PH (máy chủ + phiên web) → PR-LM (lịch MT: luật thuần ở `shared/domain/lichMt.ts`, máy chủ ở `skillSchedule.ts`/`keHoachTest.ts`, giao diện ở panel Lộ trình, HopKyNang, WeekModal) → PR-DH (bảng Học viên & Lớp + điều hướng hồ sơ) → PR-SL (sửa cả lớp, endpoint mới gọi lại các hàm đã có). Luật mới đều là hàm thuần trong `shared/domain` có phép kiểm trước.

**Tech Stack:** React + react-router + Tailwind (web/), Express + SQLite/Turso (server/), phép kiểm `server/src/tests/*.tests.ts` chạy qua `npm test` (`run.ts`), `npm run check` = build + test + typecheck.

**Spec:** yêu cầu 9 mục của chủ sản phẩm 03/10 (chép nguyên văn ở mục A) + 4 ảnh chụp; quyết định Q-03/10 ở mục B. Không có file spec riêng — mục A + B **là** spec.

## Global Constraints
- CLAUDE.md: tinh chỉnh, không làm lại — giữ Be Vietnam Pro, bảng màu, bố cục; thời gian trên màn ưu tiên **mã tuần** `W2 OCT`; ngày chỉ cho hạn cụ thể, **ngày thi**, ngày sinh, nhật ký.
- Luật S3: không dùng nút "Huỷ" trần; form chưa sửa → "Đóng", đã sửa → "Huỷ thay đổi".
- Lý do bắt buộc tối thiểu `LY_DO_TOI_THIEU = 5` ký tự (`shared/domain/chamDiem.ts:124`) ở mọi chỗ mục này đòi lý do.
- Không bao giờ bớt: kiểm tra dữ liệu nhập, chống mất dữ liệu (điểm đã nhập không bao giờ bị xoá ngầm), phân quyền.
- Mỗi PR: phép kiểm trước (đỏ) → sửa → `npm run check` xanh → ảnh 1440/375 sáng/tối → `/impeccable audit` (PR có giao diện) → `/ponytail-review`.
- PR có giao diện: gõ `/ponytail lite` đầu phiên. Lệnh impeccable chỉ trong phạm vi PR.
- Hàm mới ở `shared/domain/*` phải re-export qua `shared/domain/index.ts`. File phép kiểm mới phải import + gọi ở cuối `server/src/tests/run.ts`.
- Đổi tên/xoá file thì sửa `CODE_MAP.md` trong cùng commit.
- Xong mỗi PR: đánh dấu `[x]` ở file này, thêm một dòng mục 11 `plan.md`, mở PR (không tự merge), liệt kê chú thích `ponytail:`.

## Skill bắt buộc (mọi PR trong file này)
- **superpowers:** `superpowers:subagent-driven-development` chạy kế hoạch từng Task; `test-driven-development` cho mỗi Task (phép kiểm đỏ trước); `systematic-debugging` khi gặp lỗi/phép kiểm hỏng bất ngờ; `brainstorming` nếu phát sinh việc cần chủ sản phẩm quyết (dừng, hỏi, không tự chọn); `verification-before-completion` trước khi báo xong; `requesting-code-review` trước khi mở PR; `finishing-a-development-branch` để chốt nhánh (mở PR, không merge).
- **ponytail:** PR có giao diện gõ `/ponytail lite` đầu phiên; PR chỉ máy chủ giữ `full`. `/ponytail-review` trước khi mở PR; liệt kê mọi chú thích `ponytail:` trong mô tả PR.
- **impeccable:** lệnh theo từng Task (ghi ở dòng "Skill:" đầu mỗi Task) — giữ nguyên, chỉ trong phạm vi PR; `/impeccable audit` trước **mọi** PR có giao diện.

---

## A. Yêu cầu gốc (03/10) và đối chiếu kế hoạch cũ

| # | Yêu cầu (tóm tắt) | Đã có kế hoạch cũ? | Vào PR |
|---|---|---|---|
| 1 | Thỉnh thoảng web báo "đã đăng xuất, đăng nhập lại", tải lại thì vẫn đăng nhập | Chưa. Liên quan PR-Z2c-b (`auth.ts:81`, chỉ chữa lỗi "stream not found") và Z2c-e (503 khi kiểm phiên) | **PR-PH** |
| 2 | (Ảnh 1) Panel Lộ trình có hai ô "Dự kiến thi" trùng → giữ ô trên. Bảng MT bên dưới cần nút chỉnh lịch ngay tại đây | Q9 `2026-09-29-pr-nhap-them-hoc-vien.md:557` cho hiện ô tuần thi khi chưa có ngày → **chủ sản phẩm 03/10 đổi**: bỏ ô tuần | **PR-LM** (LM-2, LM-5) |
| 3 | (Ảnh 2) "Dời lịch thi cả đợt": thay ô chọn tuần dạng cuộn; huỷ lịch / xếp lịch / nhập điểm MT cũ và mới quá phức tạp → làm được ngay trong panel Lộ trình | Chưa | **PR-LM** (LM-4, LM-5) |
| 4 | Hồ sơ học viên: nút sang học viên kế tiếp, không chỉ "Quay lại". Tương tự hồ sơ lớp | Chưa (spec `2026-09-22-ux-audit-hien-trang.md:435` chỉ gợi ý breadcrumb) | **PR-DH** (DH-3, DH-4) |
| 5 | (Ảnh 3) Bảng Học viên & Lớp: thêm cột "Dự kiến thi"; "Sắp tới" hết MT thì "Thi thật · thời gian", còn MT thì thêm số kỳ vọng | Cột "Sắp tới" chốt 30/09 (`2026-09-29-pr-hvl-hoc-vien-lop.md:246`); chưa có cột dự kiến thi | **PR-DH** (DH-1, DH-2) |
| 6 | (Ảnh 3) Hàng chip đầu trang chưa gọn, khoảng cách lệch | K1 (PR-HK1) chỉ làm cuộn ngang + mờ mép ở điện thoại | **PR-DH** (DH-5) |
| 7 | (Ảnh 4) Hộp xếp lịch "Lê Hà Vy · MT1" quá nhỏ, chữ bị cắt "W…", hai thanh chọn tuần thừa | Chưa (HopKyNang `w-[372px]`, Q19 chỉ chốt "hộp nhỏ neo chip") | **PR-LM** (LM-3) |
| 8 | Cho ghi đè, đổi tuần MT đã xếp, kể cả MT lịch sử. Dời một MT vượt lịch các MT sau → huỷ lịch các MT bị vượt; cảnh báo đỏ trên panel; lưu thì hộp xác nhận nêu rõ MT nào bị huỷ | **Trái với** quyết định 23/09 "máy chủ chỉ báo xung đột, không tự đẩy MT khác" (`skillSchedule.ts:433-449`) và Q6/T34 "MT lịch sử chỉ nhập bù điểm" (`pr-xlmt:567`) → **chủ sản phẩm 03/10 đổi** (mục B) | **PR-LM** (LM-1) |
| 9 | Hồ sơ lớp: sửa thông tin cả lớp trên một panel giống panel Thêm học viên, không cần dán Excel | Chưa (L3 `2026-10-03-pr-l1…:54` "không sửa hàng loạt" là ở Quản trị tài khoản, không liên quan) | **PR-SL** |

## B. Quyết định của chủ sản phẩm 03/10 (ghi đè quyết định cũ)

- **Q-0310-1 (mục 8).** "Huỷ lịch" một MT = **bỏ tuần, giữ lượt**: lượt vẫn còn, giữ số MT, các kỹ năng chưa có điểm về trạng thái "Chưa xếp lịch" (`attempt_skills.planned_period_id = NULL`, đã được schema cho phép: "Trống = chưa xếp"). Không đóng Case / việc, không đổi số MT. Khác với "Huỷ cả lượt" hiện có (giữ nguyên ở hồ sơ MT).
- **Q-0310-2 (mục 8).** MT bị vượt mà **đã có điểm hoặc đã xác nhận đã thi** (dù một kỹ năng) → **chặn dời**, báo đỏ: "MT2 đã có điểm — không huỷ lịch được. Dời MT1 vào tuần trước W3 JUL." Không bao giờ xoá điểm.
- **Q-0310-3 (mục 9).** Panel sửa cả lớp gồm: Họ tên, Ngày sinh, Email, Tuần bắt đầu học, Dự kiến thi, Target, Điểm đầu vào. (Không có Tư vấn viên, Ghi chú.)
- **Q-0310-4 (mục 4).** "Học viên tiếp theo" đi **theo danh sách vừa mở** (đúng bộ lọc + sắp xếp đang dùng). Mở hồ sơ thẳng bằng link → đi theo lớp của em, A→Z.
- **Q-0310-5 (mục 2, suy từ yêu cầu).** Bỏ ô tuần thi thứ hai ở panel Lộ trình. Hệ quả cần chủ sản phẩm biết: chỉ ghi **tháng** thì không có tuần thi → không đếm ngược (đếm ngược chỉ chạy khi có ngày cụ thể; ngày suy ra tuần). Nếu chủ sản phẩm muốn giữ "biết tuần mà chưa biết ngày" thì báo lại — mặc định làm theo yêu cầu.

### Mặc định session planning tự chọn — chủ sản phẩm duyệt khi đọc PR (đổi được, không chặn làm)
- **D1.** "Vượt" = MT sau có **tuần sớm nhất ≤ tuần muộn nhất mới** của MT đang dời. Trùng tuần cũng tính là vượt (trước đây trùng tuần là chặn; nay thành huỷ lịch có xác nhận).
- **D2.** Dời MT **sớm hơn** MT trước nó (MT2 về trước MT1) vẫn **chặn** như cũ — yêu cầu chỉ nói chiều "muộn hơn".
- **D3.** MT lịch sử (`lich_su = 1`) được đổi tuần: sang tuần đã qua khác (vẫn phải trước ngày em vào web, luật `kiemTuanDaQua`) hoặc tuần tương lai (khi đó thành MT đang chạy; cờ `lich_su` tính lại). Kỹ năng **đã có điểm** của MT lịch sử được đổi tuần như **sửa hồ sơ** (bắt buộc lý do, ghi nhật ký, giữ điểm). MT đang chạy: kỹ năng có điểm vẫn không dời (luật cũ).
- **D4.** MT đang chạy vẫn không dời vào tuần đã qua (K2-33 giữ nguyên).
- **D5.** "Điểm mục tiêu của lần thi đó" (mục 5) = **kỳ vọng** của lượt (`expectationFor`: Target − 1.0 ở MT1, − 0.5 ở MT2, − 0 từ MT3) — đúng số đang hiện "Kỳ vọng 5.0" ở hồ sơ MT. Target chung đã có cột riêng.
- **D6.** "Huỷ lịch" ở panel Lộ trình = Q-0310-1 (bỏ tuần, giữ lượt). Nút "Huỷ cả lượt" giữ ở hồ sơ MT, không đưa vào panel để tránh hai nghĩa cạnh nhau.

---

# PR-PH — "Báo đăng xuất" giả · ƯU TIÊN 1 (P1, nên vào trước deploy)

Nhánh: `pr-ph-phien-dang-nhap`. Không sửa giao diện → `ponytail` mức `full`.

**Nguyên nhân (đã đọc code 03/10):**
1. `server/src/auth.ts:72-88` `attachPrincipal` **nuốt mọi lỗi** khi kiểm phiên, trừ "stream not found" (`laLoiMatLuongTurso`, `db.ts:134`, chỉ khớp `/stream not found/i`) và `HttpError`. Lỗi mạng Turso khác (`Hrana(Http("error sending request"))`, reset kết nối, 5xx của Turso, kết nối nguội lần đầu) bị nuốt → `req.principal` trống → `requireAuth` trả **401 "Chưa đăng nhập, hoặc phiên đăng nhập đã hết hạn. Đăng nhập lại."** (`auth.ts:92`) dù phiên còn tốt. Chú thích ở nhánh nuốt ("session trỏ tới user đã bị xoá") đã lỗi thời: câu JOIN `auth.ts:53-58` đã lọc user bị xoá, và `loadPrincipal` ném `HttpError` 403 nếu thiếu user.
2. `web/src/lib/session.tsx:55-65` `reload()` coi **mọi** lỗi của `GET /demo/session` (mạng, 502/504 của Netlify, 500, 503) là `authenticated:false` → hiện màn đăng nhập (`App.tsx:113-114`) trong khi cookie vẫn đúng.
3. Web không xử lý 401 riêng (`web/src/lib/api.ts:46-62`) — chữ "đăng nhập lại" chỉ là thông điệp lỗi của máy chủ hiện như mọi lỗi khác, nên tải lại là hết.

### Task PH-1: `attachPrincipal` không biến lỗi máy chủ thành "chưa đăng nhập"
Skill: test-driven-development (máy chủ, ponytail full)

**Files:**
- Modify: `server/src/auth.ts:72-88`
- Test: `server/src/tests/anToan.tests.ts` (thêm vào khối PR-Z2c-b, sau phép ở dòng ~583)

**Interfaces:**
- Consumes: `giaLoi`, `goi`, `cookieLuong` có sẵn trong khối Z2c-b của `anToan.tests.ts`.
- Produces: hành vi — lỗi không phải xác thực ở bước kiểm phiên → 500 "Có lỗi · mã …" (qua `traLoiLoi`, `app.ts:124`), "stream not found" vẫn thử lại GET như cũ.

- [ ] **Step 1: Viết phép kiểm đỏ**

```ts
  await checkAsync('PR-PH · lỗi Turso KHÁC "stream not found" ở bước kiểm phiên → 500 có mã, KHÔNG phải 401 "đăng nhập lại", KHÔNG phải authenticated:false', async () => {
    for (const loi of ['Hrana(Http("error sending request for url"))', 'SQLITE_IOERR: hỏng đĩa giả', 'fetch failed: ECONNRESET']) {
      const { kq: s } = await giaLoi(/FROM demo_sessions/, loi, () => goi('GET', '/demo/session', { cookie: cookieLuong }));
      assert(s.status === 500 && /Có lỗi · mã/.test(s.json?.error ?? ''), `/demo/session với "${loi}": ${s.status} ${JSON.stringify(s.json)}`);
      const { kq: r } = await giaLoi(/FROM demo_sessions/, loi, () => goi('GET', '/ref/branches', { cookie: cookieLuong }));
      assert(r.status === 500 && !/đăng nhập/i.test(r.json?.error ?? ''), `/ref/branches với "${loi}": ${r.status} ${JSON.stringify(r.json)}`);
    }
  });

  await checkAsync('PR-PH · không có cookie / cookie sai vẫn là 401 (không đổi hành vi đúng)', async () => {
    const r = await goi('GET', '/ref/branches', { cookie: 'pisa_demo_session=khong-ton-tai' });
    assert(r.status === 401 && /đăng nhập/i.test(r.json?.error ?? ''), `${r.status} ${JSON.stringify(r.json)}`);
    const s = await goi('GET', '/demo/session', { cookie: 'pisa_demo_session=khong-ton-tai' });
    assert(s.status === 200 && s.json?.authenticated === false, `${s.status} ${JSON.stringify(s.json)}`);
  });
```

- [ ] **Step 2: Chạy, thấy đỏ** — `npm test 2>&1 | grep -A3 "PR-PH"`. Mong đợi: phép 1 FAIL (`/demo/session` trả 200 `authenticated:false`, `/ref/branches` trả 401).

- [ ] **Step 3: Sửa**

```ts
export function attachPrincipal(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
  try {
    const principal = resolveSession(token);
    if (principal) {
      req.principal = principal;
      req.sessionToken = token;
    }
  } catch (e) {
    /*
     * PR-PH (03/10): KHÔNG nuốt lỗi nào ở đây. Lỗi khi kiểm phiên là lỗi máy chủ/kết nối, không phải "chưa đăng nhập" —
     * nuốt đi thì requireAuth trả 401 "Đăng nhập lại" trong khi phiên vẫn tốt (tải lại trang là hết: lỗi chủ sản phẩm báo 03/10).
     * Mất luồng Turso → bộ thử lại (Z2c-b); 503 đang bận → đúng câu đó (Z2c-e); còn lại → 500 có mã (traLoiLoi).
     * User bị xoá đã được câu JOIN của resolveSession lọc, không cần nhánh nuốt.
     */
    next(e);
    return;
  }
  next();
}
```

- [ ] **Step 4: Chạy lại** — `npm test`. Mong đợi: hai phép PR-PH PASS, các phép Z2c-b (dòng 566-600) và Z2c-e (dòng 722-737) vẫn PASS.
- [ ] **Step 5: Commit** — `git commit -am "PR-PH: kiểm phiên gặp lỗi máy chủ trả 500 có mã, không trả 401 đăng nhập lại"`

### Task PH-2: Web — lỗi khi tải phiên không đẩy ra màn đăng nhập
Skill: test-driven-development · systematic-debugging

**Files:**
- Modify: `web/src/lib/session.tsx:55-65` (`reload`)
- Modify: `web/src/App.tsx:113-114` (nhánh hiện `WelcomePage`)
- Test: `server/src/tests/prPh.tests.ts` (mới, kiểu quét mã nguồn như `prHk1.tests.ts`) + `run.ts`

**Interfaces:**
- Produces: `Session` có thêm `loiKetNoi?: string` (chỉ ở web, không đổi API). `SessionProvider` giữ phiên cũ khi tải lại lỗi.

- [ ] **Step 1: Phép kiểm đỏ (quét mã nguồn)** — tạo `server/src/tests/prPh.tests.ts`:

```ts
/** PHÉP KIỂM PR-PH — phiên đăng nhập không bị coi là đã đăng xuất khi máy chủ/kết nối lỗi. */
import { readFileSync } from 'node:fs';
import type { YThucTestKit } from './yThuc.tests.ts';

export function runPrPhTests(t: Pick<YThucTestKit, 'check' | 'assert'>) {
  const { check, assert } = t;
  const doc = (p: string) => readFileSync(new URL(`../../../${p}`, import.meta.url), 'utf8');
  check('PR-PH · session.tsx: reload chỉ coi là chưa đăng nhập khi máy chủ TRẢ LỜI authenticated:false; lỗi mạng/5xx giữ phiên cũ + báo mất kết nối', () => {
    const s = doc('web/src/lib/session.tsx');
    assert(/loiKetNoi/.test(s), 'phải có trạng thái loiKetNoi');
    assert(!/catch\s*\{\s*\/\/[^\n]*\n[^}]*setSession\(\{\s*authenticated:\s*false/.test(s), 'catch không được đặt authenticated:false vô điều kiện');
  });
  check('PR-PH · App.tsx: có dải "Mất kết nối" với nút Thử lại thay vì màn đăng nhập khi loiKetNoi', () => {
    const a = doc('web/src/App.tsx');
    assert(/loiKetNoi/.test(a) && /Thử lại/.test(a), 'App phải hiện dải mất kết nối + Thử lại');
  });
}
```

Thêm vào cuối `server/src/tests/run.ts`:

```ts
const { runPrPhTests } = await import('./prPh.tests.ts');
runPrPhTests({ check, assert });
```

- [ ] **Step 2: Chạy, thấy đỏ** — `npm test 2>&1 | grep -A2 "PR-PH ·"` → FAIL.

- [ ] **Step 3: Sửa `reload`**

```ts
  const reload = useCallback(async () => {
    try {
      setSession(await api.get<Session>('/demo/session'));
    } catch (e) {
      /*
       * PR-PH (03/10): lỗi mạng / 5xx / 503 KHÔNG có nghĩa là đã đăng xuất (cookie vẫn đúng — tải lại là vào được).
       * Đã có phiên → giữ nguyên, chỉ báo mất kết nối. Chưa có phiên (lần tải đầu) → màn chào kèm lỗi để biết đường xử lý
       * (máy chủ chưa chạy / chưa seed), như trước.
       */
      const loi = e instanceof Error ? e.message : 'Không gọi được máy chủ.';
      setSession((cu) => cu?.authenticated ? { ...cu, loiKetNoi: loi } : { authenticated: false, demoDate: '', scenario: 'normal', loiKetNoi: loi });
    } finally {
      setLoading(false);
    }
  }, []);
```

Thêm `loiKetNoi?: string` vào kiểu `Session` trong file này. Lần tải thành công thì `loiKetNoi` tự mất vì `setSession` thay cả object.

- [ ] **Step 4: Dải mất kết nối ở `App.tsx`** — khi `session.authenticated && session.loiKetNoi`: một dải `role="alert"` trên đầu nội dung: "Mất kết nối tới máy chủ — dữ liệu trên màn có thể chưa mới. [Thử lại]" (nút gọi `reload()`). Dùng tone cảnh báo có sẵn (`Nhan`/`HopBao` trong `web/src/ui/`), không tạo màu mới. Không đổi nhánh `WelcomePage` khi `!authenticated`.
- [ ] **Step 5: Chạy** — `npm run check` xanh.
- [ ] **Step 6: Bấm thử** — `npm run seed && npm run dev`, đăng nhập, tắt máy chủ API (Ctrl+C phía server), bấm "Lưu" ở hồ sơ cá nhân (gọi `reload`) → thấy dải mất kết nối, **không** về màn đăng nhập; bật lại máy chủ, bấm Thử lại → dải mất.
- [ ] **Step 7: Commit** — `git commit -am "PR-PH: web giữ phiên khi mất kết nối, dải Thử lại thay màn đăng nhập"`

### Task PH-3: Chống cache phản hồi API
Skill: test-driven-development (máy chủ)
**Files:** Modify `server/src/app.ts` (middleware trước router `/api`). Test: `server/src/tests/anToan.tests.ts`, cạnh PH-1 (đã có `goi`, `cookieLuong`).

- [ ] **Step 1: Phép đỏ** (trong `anToan.tests.ts`, cạnh PH-1):

```ts
  await checkAsync('PR-PH · mọi phản hồi /api có Cache-Control: no-store (phiên không bị cache ở trình duyệt/CDN)', async () => {
    const r = await goi('GET', '/demo/session', { cookie: cookieLuong });
    assert(/no-store/.test(String(r.headers?.['cache-control'] ?? '')), `cache-control: ${r.headers?.['cache-control']}`);
  });
```
  (Nếu `goi` chưa trả `headers`, thêm `headers: Object.fromEntries(res.headers)` vào kết quả của `goi` — đọc định nghĩa `goi` trong file trước.)
- [ ] **Step 2: Sửa** — trong `createApp`, trước khi gắn router API: `app.use('/api', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });` (bỏ chỗ đặt riêng ở `server/src/platform/suKhoe.ts:18` nếu thành thừa).
- [ ] **Step 3:** `npm run check` xanh → commit `"PR-PH: no-store cho mọi phản hồi /api"`.

**Nghiệm thu PR-PH:** 3 phép PR-PH xanh; Z2c-b/Z2c-e không đổi; ghi vào mô tả PR: "Nếu sau deploy vẫn gặp, log Netlify sẽ có dòng `[api] mã …` kèm lỗi thật — chụp gửi lại."

---

# PR-LM — Lịch MT: panel Lộ trình là nơi chỉnh lịch, dời vượt có xác nhận · ƯU TIÊN 2

Nhánh: `pr-lm-lich-mt-linh-hoat`. Có giao diện → `/ponytail lite`; impeccable: `critique` không chạy (đã có ở đây), dùng `layout` (LM-3, LM-5), `clarify` (LM-1 chữ cảnh báo, LM-4), `harden` (LM-3 popover), `audit` cuối.

**Bản đồ code (đọc trước):**
- Panel Lộ trình: `web/src/modules/students/StudentPlanPanel.tsx` (ô Dự kiến thi 1 `:139-143` `ONgay`, ô 2 `:144-150` `WeekPicker`, `hienTuanThi :70`, lưu `:79-82`, bảng "Lịch MT hệ thống đề xuất" `:163-235`).
- Hồ sơ MT: `web/src/modules/fasttrack/MockDetailPage.tsx` (menu "Chỉnh lịch" `:169-184`, `WeekModal` `:599-649` gửi `force:true` luôn, `<select>` từ `usePeriods()` có cả tuần đã qua).
- Hộp xếp lịch (ảnh 4): `web/src/modules/test/keHoach/HopKyNang.tsx` (`fixed w-[372px]` `:194,:218`, lưới hàng `:276`), `TuanNho.tsx:19-61` (bấm giữa → mở thêm một `WeekPicker` bên dưới = "hai thanh chọn tuần"), không truyền `toiThieu` (`:293`).
- `WeekPicker`: `web/src/ui/Filters.tsx:80-202` (chưa có tuần tối thiểu; popover `LichNho`).
- Máy chủ: `server/src/fasttrack/skillSchedule.ts` (`checkWeekVsNeighbours :462-533`, `setSkillWeek :591-690`), `server/src/fasttrack/attempts.ts:1120-1159` (`setPlanningWeek`, không chặn `lich_su`), `server/src/keHoach/keHoachTest.ts:339-434` (`luuDot`/`kiemDotNoi`), luật thuần `shared/domain/lichMt.ts` (`kiemTuanDaQua :71-81`, `laLichSu :32`, `mocKeTiep :111-118`).
- Route: `/ke-hoach-test/dot/kiem :467`, `/ke-hoach-test/dot :475`, `/attempts/:id/week :628`, `/attempts/:id/skills/:skill/week :650` (`server/src/routes/index.ts`).

### Task LM-1: Luật "dời vượt → huỷ lịch lượt bị vượt" (máy chủ, Q-0310-1/2, D1–D4)
Skill: test-driven-development (máy chủ) · impeccable clarify (chữ cảnh báo)

**Files:**
- Modify: `shared/domain/lichMt.ts` (thêm `luotBiVuot`), `shared/domain/index.ts` (re-export)
- Modify: `server/src/fasttrack/skillSchedule.ts` (thêm `kiemVuot`, `boTuanLuot`; `setSkillWeek` nhận `huyLichVuot`; nới D3)
- Modify: `server/src/fasttrack/attempts.ts:1120-1159` (`setPlanningWeek` nhận `huyLichVuot`)
- Modify: `server/src/keHoach/keHoachTest.ts:339-434` (`kiemDotNoi` trả `seHuyLich`; `luuDot` nhận `xacNhanHuyLich`)
- Modify: `server/src/routes/index.ts:467,475,628,650` (truyền `xacNhanHuyLich`); thêm `POST /attempts/:id/bo-tuan`
- Test: `server/src/tests/prLm.tests.ts` (mới) + `run.ts`

**Interfaces:**
- Produces:
  - `luotBiVuot(ds: LuotLanCan[], o: { attemptNo: number; tuanCuoiMoi: string }): { biVuot: LuotLanCan[]; chan: string | null }`
  - `type LuotLanCan = { attemptId: number; attemptNo: number; kind: string; tuanDau: string | null; coDiem: boolean; daThi: boolean; huy: boolean }`
  - Máy chủ: `kiemVuot(attemptId: number, tuanCuoiMoi: string): { biVuot: Array<{ attemptId: number; nhan: string; tuan: string }>; chan: string | null }`
  - `boTuanLuot(p: Principal, attemptId: number, o: { lyDo: string; doVuotBoi?: number }): { daBo: string[] }`
  - Phản hồi kiểm trước (`/ke-hoach-test/dot/kiem`): thêm `seHuyLich: Array<{ attemptId: number; nhan: string; tuan: string }>`
  - Thân lưu (`/ke-hoach-test/dot`, `/attempts/:id/week`, `/attempts/:id/skills/:skill/week`): thêm `xacNhanHuyLich?: boolean`. Thiếu xác nhận mà có lượt bị vượt → 409 `{ error, details: { seHuyLich } }`.

- [x] **Step 1: Phép kiểm luật thuần (đỏ)** — `server/src/tests/prLm.tests.ts`:

```ts
/** PHÉP KIỂM PR-LM — lịch MT linh hoạt: dời vượt lượt sau thì huỷ lịch lượt bị vượt (chủ sản phẩm 03/10, Q-0310-1/2). */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrLmTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d = await import('../../../shared/domain/index.ts');
  console.log('\nPR-LM · Lịch MT linh hoạt');
  const L = (attemptNo: number, tuanDau: string | null, o: Partial<{ coDiem: boolean; daThi: boolean; huy: boolean }> = {}) =>
    ({ attemptId: 100 + attemptNo, attemptNo, kind: 'mock', tuanDau, coDiem: false, daThi: false, huy: false, ...o });

  check('PR-LM (1) · luotBiVuot: MT1 sang sau MT2 → vượt MT2; sau cả MT3 → vượt MT2+MT3; trùng tuần cũng là vượt (D1)', () => {
    const ds = [L(2, '2026-07-13'), L(3, '2026-08-10')];
    const a = d.luotBiVuot(ds, { attemptNo: 1, tuanCuoiMoi: '2026-07-20' });
    assert(a.chan === null && a.biVuot.map((x) => x.attemptNo).join() === '2', JSON.stringify(a));
    const b = d.luotBiVuot(ds, { attemptNo: 1, tuanCuoiMoi: '2026-08-17' });
    assert(b.biVuot.map((x) => x.attemptNo).join() === '2,3', JSON.stringify(b));
    const c = d.luotBiVuot(ds, { attemptNo: 1, tuanCuoiMoi: '2026-07-13' });
    assert(c.biVuot.map((x) => x.attemptNo).join() === '2', `trùng tuần: ${JSON.stringify(c)}`);
    const e = d.luotBiVuot(ds, { attemptNo: 1, tuanCuoiMoi: '2026-07-06' });
    assert(e.biVuot.length === 0 && e.chan === null, `không vượt: ${JSON.stringify(e)}`);
  });

  check('PR-LM (1) · luotBiVuot: bỏ qua lượt trước, lượt đã huỷ, lượt chưa xếp tuần', () => {
    const ds = [L(1, '2026-06-01'), L(3, '2026-07-13', { huy: true }), L(4, null)];
    const a = d.luotBiVuot(ds, { attemptNo: 2, tuanCuoiMoi: '2026-09-07' });
    assert(a.biVuot.length === 0 && a.chan === null, JSON.stringify(a));
  });

  check('PR-LM (1) · luotBiVuot: lượt bị vượt đã có điểm hoặc đã thi → chặn, nêu tên lượt (Q-0310-2)', () => {
    const a = d.luotBiVuot([L(2, '2026-07-13', { coDiem: true }), L(3, '2026-08-10')], { attemptNo: 1, tuanCuoiMoi: '2026-08-17' });
    assert(a.chan !== null && /MT2 đã có điểm/.test(a.chan) && /không huỷ lịch được/.test(a.chan), String(a.chan));
    const b = d.luotBiVuot([L(2, '2026-07-13', { daThi: true })], { attemptNo: 1, tuanCuoiMoi: '2026-08-17' });
    assert(b.chan !== null && /MT2 đã thi/.test(b.chan), String(b.chan));
  });
}
```

Thêm vào cuối `run.ts`:

```ts
const { runPrLmTests, runPrLmMayChu } = await import('./prLm.tests.ts');
await runPrLmTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
await runPrLmMayChu({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
```
(`runPrLmMayChu` viết ở Step 5; tạm export một hàm rỗng để build qua.)

- [x] **Step 2: Chạy, thấy đỏ** — `npm test 2>&1 | grep -A2 "PR-LM"` → FAIL "d.luotBiVuot is not a function".

- [x] **Step 3: Viết `luotBiVuot`** trong `shared/domain/lichMt.ts` (dùng `tuanLich` + `labelOf`/nhãn lượt có sẵn trong file; nếu `labelOf` ở chỗ khác thì import đúng chỗ đó):

```ts
/** Một lượt khác trong cùng lộ trình, đủ để biết lượt đang dời có VƯỢT nó không (PR-LM, chủ sản phẩm 03/10). */
export type LuotLanCan = { attemptId: number; attemptNo: number; kind: string; tuanDau: string | null; coDiem: boolean; daThi: boolean; huy: boolean };

/**
 * Q-0310-1/2 + D1: dời lượt `attemptNo` tới tuần cuối `tuanCuoiMoi` thì mọi lượt SAU có tuần sớm nhất ≤ tuần đó là "bị vượt" —
 * huỷ lịch (bỏ tuần, giữ lượt) khi người dời xác nhận. Lượt bị vượt đã có điểm / đã thi → chặn: không bao giờ bỏ lịch phần đã thi.
 * Bỏ qua lượt trước, lượt đã huỷ, lượt chưa xếp tuần (`tuanDau` null — không có gì để vượt).
 */
export function luotBiVuot(ds: readonly LuotLanCan[], o: { attemptNo: number; tuanCuoiMoi: string }): { biVuot: LuotLanCan[]; chan: string | null } {
  const biVuot = ds
    .filter((x) => x.attemptNo > o.attemptNo && !x.huy && x.tuanDau !== null && x.tuanDau <= o.tuanCuoiMoi)
    .sort((a, b) => a.attemptNo - b.attemptNo);
  const vuongDiem = biVuot.find((x) => x.coDiem);
  if (vuongDiem) return { biVuot, chan: `${nhanLuot(vuongDiem)} đã có điểm — không huỷ lịch được. Dời vào tuần trước ${tuanLich(vuongDiem.tuanDau!)}.` };
  const vuongThi = biVuot.find((x) => x.daThi);
  if (vuongThi) return { biVuot, chan: `${nhanLuot(vuongThi)} đã thi — không huỷ lịch được. Dời vào tuần trước ${tuanLich(vuongThi.tuanDau!)}.` };
  return { biVuot, chan: null };
}
const nhanLuot = (x: { attemptNo: number; kind: string }) => (x.kind === 'mock' ? `MT${x.attemptNo}` : labelOf(x.kind, x.attemptNo));
```
(Đọc `lichMt.ts` trước: dùng hàm đặt nhãn lượt **đã có** — `labelOf` ở `:130` theo báo cáo — đừng viết hàm thứ hai.) Re-export `luotBiVuot`, `LuotLanCan` trong `shared/domain/index.ts`.

- [x] **Step 4: Chạy** — 3 phép PR-LM (1) PASS.

- [x] **Step 5: Phép kiểm máy chủ (đỏ)** — thêm `runPrLmMayChu` vào `prLm.tests.ts`. Theo mẫu tạo học viên/lộ trình/lượt của `runPrXlmtMayChu` (`prXlmt.tests.ts`, đọc phần "khối 2" để lấy hàm dựng dữ liệu và cách gọi HTTP với cookie Quản lý). Các trường hợp phải có (mỗi trường hợp một `checkAsync`, dữ liệu riêng, `TODAY` của harness):
  1. Lộ trình có MT1 (tuần T+1), MT2 (T+4), MT3 (T+8), chưa điểm. `POST /ke-hoach-test/dot/kiem` dời cả 4 kỹ năng MT1 sang T+5 → `seHuyLich` = [MT2], không có blocker "vượt qua lượt kế tiếp".
  2. Như (1) nhưng `POST /ke-hoach-test/dot` **không** có `xacNhanHuyLich` → 409, `details.seHuyLich[0].nhan === 'MT2'`, DB không đổi (so `planned_period_id` trước/sau).
  3. Như (1) với `xacNhanHuyLich: true` → 200; MT1 ở T+5; mọi kỹ năng MT2 `planned_period_id IS NULL`, `plan_source='manual'`; `assessment_attempts.planned_period_id` của MT2 NULL; MT2 vẫn `status='planned'`, `attempt_no=2`; MT3 không đổi; có dòng audit `attempt.unschedule` với `doVuotBoi` = id MT1.
  4. Dời MT1 sang T+9 với xác nhận → MT2 **và** MT3 đều bỏ tuần.
  5. MT2 có điểm Listening → kiểm trước trả `chan` "MT2 đã có điểm — không huỷ lịch được…", lưu (dù có xác nhận) → 400, DB không đổi.
  6. `POST /attempts/:id/week` (cả đợt) đi cùng luật: không xác nhận → 409; có → 200 như (3).
  7. D2: dời MT2 về trước MT1 vẫn 400 "Phần thi của lượt sau không được xếp trước phần cuối của lượt trước".
  8. D3: MT lịch sử (tạo qua `xepMoi` tuần đã qua) có điểm L → `POST /attempts/:id/skills/listening/week` sang tuần đã qua khác **trước ngày vào web**, có lý do ≥ 5 → 200, điểm còn nguyên; thiếu lý do → 400; sang tuần đã qua **sau** ngày vào web → 400 (thông điệp `kiemTuanDaQua`).
  9. D4: MT đang chạy dời vào tuần đã qua vẫn 400 "Không dời vào tuần đã qua".
  10. `POST /attempts/:id/bo-tuan {lyDo}` (nút "Huỷ lịch" ở panel): lượt chưa điểm → 200 bỏ tuần; lượt có điểm → 400; lý do < 5 ký tự → 400; GV không có quyền xếp lịch → 403.
  11. Sau khi MT2 bỏ tuần: `mocKeTiep` / `standingFor` không lấy MT2 làm "Sắp tới" (không có tuần) và không lỗi; Kế hoạch Test (`GET` lưới kế hoạch của lớp) hiện MT2 ở trạng thái `chua-xep`.

- [x] **Step 6: Chạy, thấy đỏ** — `npm test 2>&1 | grep -B1 -A3 "PR-LM (2)"`.

- [x] **Step 7: Viết máy chủ**
  - `kiemVuot(attemptId, tuanCuoiMoi)` trong `skillSchedule.ts`: đọc các lượt khác cùng `cycle_id` (một câu SQL như `checkWeekVsNeighbours :474-483`, thêm `MIN(week_start)` theo lượt, `EXISTS` điểm (dùng câu kiểm điểm mà `hasScore` đang dùng) và `EXISTS sit_status='sat'`), dựng `LuotLanCan[]`, gọi `luotBiVuot`.
  - `boTuanLuot(p, attemptId, { lyDo, doVuotBoi })`: quyền như `setPlanningWeek` (`PLAN_WEEK`) cho lượt đó; `kiemLyDoThaoTac('Huỷ lịch', lyDo)` (bắt buộc khi gọi thẳng; khi gọi từ dời vượt, lý do = lý do của lần dời hoặc mặc định `Huỷ lịch vì MT{n} dời sang {tuần}`); chặn nếu có điểm/đã thi; `UPDATE attempt_skills SET planned_period_id=NULL, plan_source='manual' WHERE attempt_id=? AND required=1 AND sit_status='scheduled' AND <không có điểm>`; `UPDATE assessment_attempts SET planned_period_id=NULL, plan_source='manual'`; huỷ đề nghị dời đang chờ của lượt đó **nếu có** theo cách `setSkillWeek` đang xử lý đề nghị chờ duyệt (đọc đoạn "ĐANG CÓ ĐỀ NGHỊ DỜI CHỜ DUYỆT" — nếu luật là chặn thì chặn với câu rõ: "MT2 đang có đề nghị dời chờ duyệt — duyệt hoặc từ chối trước"); `writeAudit({ action: 'attempt.unschedule', after: { lyDo, doVuotBoi } })`.
  - `setSkillWeek` / `setPlanningWeek` / `luuDot`: **trước** khi gọi `checkSkillWeekMove`/`checkWeekVsNeighbours`, tính `tuanCuoiMoi` = tuần muộn nhất của lượt sau khi dời (cả đợt: tuần mới; từng kỹ năng: max(tuần mới, tuần của các kỹ năng khác còn lịch)) → `kiemVuot`. `chan` → 400. `biVuot` không rỗng và không có `huyLichVuot` → `throw new HttpError(409, 'Lưu sẽ huỷ lịch ' + nhãn + '. Xác nhận để tiếp tục.', { seHuyLich })`. Có xác nhận → trong **cùng transaction** gọi `boTuanLuot` cho từng lượt bị vượt rồi mới dời (lúc đó `checkWeekVsNeighbours` không còn thấy lượt bị vượt vì JOIN `report_periods` bỏ dòng tuần NULL).
  - `setPlanningWeek`: bỏ `force:true` phía web (LM-4) nên giữ nguyên luật cảnh báo một tuần; thêm tham số `huyLichVuot`.
  - D3 trong `setSkillWeek`: nếu `attempt.lich_su = 1` → không áp chặn "đã có điểm" (cho đổi tuần như sửa hồ sơ, bắt buộc `kiemLyDoThaoTac('Sửa tuần MT lịch sử', reason)`), tuần đích đã qua thì kiểm bằng `kiemTuanDaQua({ taoMoi: true, … })` (cùng luật lúc tạo); sau khi lưu tính lại `lich_su` bằng đúng đoạn tính ở `server/src/classes/schedule.ts:204-209` (tách thành hàm dùng chung nếu đang viết liền trong `apLichMacDinhLo`). MT đang chạy giữ nguyên mọi luật cũ.
  - `kiemDotNoi` (`keHoachTest.ts`): trả thêm `seHuyLich` (từ `kiemVuot`) và **không** đưa câu "vượt qua lượt kế tiếp" vào `chan` khi lượt đó nằm trong `seHuyLich`.
  - Route: đọc `xacNhanHuyLich === true` từ body ở 4 route; thêm `api.post('/attempts/:id/bo-tuan', requireAuth, wrap((req) => boTuanLuot(req.principal!, Number(req.params.id), { lyDo: req.body?.lyDo })))`.
  - `apLichMacDinhLo` (`schedule.ts:153+`, "Áp lịch cho N lượt"): **chỉ** chạm lượt `auto` như cũ; lượt đã bỏ tuần là `manual` nên không bị áp lại — đúng ý "không ghi đè cái Quản lý đã xếp".

- [x] **Step 8: Chạy** — `npm run check` xanh, kể cả `prXlmt`, `prMt`, `keHoachTest` (những phép cũ về "vượt qua lượt kế tiếp" sẽ đỏ: sửa kỳ vọng của chúng **chỉ** ở chỗ hành vi đã đổi theo Q-0310-1 — 409 cần xác nhận thay vì 400 — và ghi chú `// PR-LM 03/10: đổi theo Q-0310-1` cạnh dòng sửa; không xoá phép).
- [x] **Step 9: Commit** — `"PR-LM (1): dời vượt lượt sau → huỷ lịch lượt bị vượt có xác nhận; MT lịch sử đổi tuần được; POST /attempts/:id/bo-tuan"`

### Task LM-2: Panel Lộ trình — một ô "Dự kiến thi" (mục 2, Q-0310-5)
Skill: test-driven-development · impeccable layout

**Files:** Modify `web/src/modules/students/StudentPlanPanel.tsx:65-82,128-150`. Test: `prLm.tests.ts` (quét nguồn).

- [x] **Step 1: Phép đỏ (quét nguồn, trong `runPrLmTests`)**

```ts
  check('PR-LM (2) · panel Lộ trình chỉ còn MỘT ô Dự kiến thi (ONgay), không còn WeekPicker tuần thi / examPeriodId', async () => {
    const { readFileSync } = await import('node:fs');
    const s = readFileSync(new URL('../../../web/src/modules/students/StudentPlanPanel.tsx', import.meta.url), 'utf8');
    assert((s.match(/Dự kiến thi/g) ?? []).length === 1, 'nhãn "Dự kiến thi" chỉ một lần');
    assert(!/examPeriodId/.test(s) && !/hienTuanThi/.test(s), 'bỏ examPeriodId và hienTuanThi');
  });
```
- [x] **Step 2: Đỏ** → **Step 3: Sửa:** xoá `hienTuanThi`, state `examPeriodId`, khối `WeekPicker` `:144-150` và chú thích `:128-136` (thay bằng một dòng: "Q-0310-5: một ô — ngày hoặc tháng; ngày thì máy chủ tự suy tuần để đếm ngược"); thân PATCH chỉ còn `{ startPeriodId, examDate: thiDuKien || null }`. Chữ gợi ý dưới ô: "Biết ngày thì gõ dd/mm/yyyy (hệ thống đếm ngược); mới biết tháng thì gõ mm/yyyy." Máy chủ không đổi (`updateCycle` đã suy tuần từ ngày và xoá tuần khi đổi từ ngày sang tháng).
- [x] **Step 4:** `npm run check` → **Step 5:** commit `"PR-LM (2): panel Lộ trình một ô Dự kiến thi"`.

### Task LM-3: Hộp xếp lịch MT (ảnh 4) — rộng hơn, một thanh chọn tuần
Skill: test-driven-development · impeccable layout, harden (popover)

**Files:** Modify `web/src/modules/test/keHoach/HopKyNang.tsx:194,218,276,293`, `web/src/modules/test/keHoach/TuanNho.tsx:19-61`, `web/src/ui/Filters.tsx:80-202` (thêm `toiThieu`). Test: `prLm.tests.ts` (quét nguồn).

**Interfaces:**
- Produces: `WeekPicker` thêm prop `toiThieu?: string` (ISO thứ Hai; nút ‹ và ngày trong `LichNho` trước tuần đó bị khoá, `aria-disabled`). `TuanNho` bấm phần giữa **mở popover lịch** (`LichNho` qua `createPortal`, mẫu `MissingBadge`/PR-L1) thay vì chèn thêm `WeekPicker` bên dưới.

- [x] **Step 1: Phép đỏ (quét nguồn)**: `HopKyNang.tsx` không còn `w-[372px]`; `TuanNho` trong `HopKyNang` có `toiThieu`; `TuanNho.tsx` không render `<WeekPicker`; `Filters.tsx` có `toiThieu`.
- [x] **Step 2: Đỏ** → **Step 3: Sửa (impeccable `layout` + `harden`):**
  - Hộp rộng `w-[min(520px,calc(100vw-32px))]` từ ≥ 640 px; dưới 640 px giữ bottom sheet.
  - Lưới hàng: `20px · 96px · minmax(0,1fr) · auto` — cột tuần đủ cho "W3 JUN · 15/06 – 21/06" **không cắt chữ** (bỏ `truncate` ở mã tuần; khoảng ngày được xuống dòng nếu thiếu chỗ, mã tuần thì không).
  - Một thanh chọn mỗi kỹ năng: `‹ [W3 JUN 15/06–21/06] ›`; bấm giữa → popover lịch tháng có nút "Tuần này" bên trong; chọn xong đóng popover. Không còn hàng `WeekPicker` thứ hai, không còn nút "Tuần này" lẻ dưới hàng Listening.
  - `toiThieu` = thứ Hai tuần này cho MT đang chạy; MT lịch sử (D3) không đặt `toiThieu`.
  - Cảnh báo "Chặn: …" giữ màu đỏ hiện có; thêm dòng **đỏ** từ `seHuyLich` của kiểm trước (LM-1): "Lưu sẽ huỷ lịch MT2 (W3 JUL) và MT3 (W1 SEP) — hai lượt này về Chưa xếp lịch." (impeccable `clarify` chốt chữ).
  - Bấm "Lưu" khi `seHuyLich` không rỗng → hộp xác nhận nhỏ (dùng component xác nhận có sẵn trong `web/src/ui/`, tìm `XacNhan`/`ConfirmDialog`; không tự viết mới): tiêu đề "Huỷ lịch MT2, MT3?"; thân liệt kê từng lượt + tuần đang có; nút "Quay lại" và "Huỷ lịch và lưu" (tone nguy hiểm). Xác nhận → gửi `xacNhanHuyLich: true`. Máy chủ trả 409 (dữ liệu đổi giữa chừng) → mở lại hộp với `details.seHuyLich` mới.
- [x] **Step 4:** `npm run check` + ảnh 1440/375 hộp mở ở Kế hoạch Test (MT đang chạy, MT có cảnh báo huỷ lịch, popover lịch mở) → **Step 5:** commit `"PR-LM (3): hộp xếp lịch rộng, một thanh chọn tuần, cảnh báo huỷ lịch"`.

### Task LM-4: "Dời lịch thi cả đợt" (ảnh 2) — chọn tuần dễ, không bỏ cảnh báo
Skill: test-driven-development · impeccable clarify

**Files:** Modify `web/src/modules/fasttrack/MockDetailPage.tsx:160-184,599-649`.

- [x] **Step 1: Phép đỏ (quét nguồn)**: `WeekModal` không còn `<select` và không còn `force: true` cố định; có `WeekPicker` với `toiThieu`.
- [x] **Step 2: Đỏ** → **Step 3: Sửa:**
  - Thay `<select>` bằng `WeekPicker scope="planning" toiThieu={MT đang chạy ? thứ Hai tuần này : undefined}` (‹ tuần › + lịch tháng + "Tuần này") — cùng kiểu chọn tuần như mọi nơi khác.
  - Đổi tuần → gọi `/ke-hoach-test/dot/kiem` cho mọi kỹ năng còn dời được → hiện cảnh báo một tuần (vàng) và `seHuyLich` (đỏ) ngay trong hộp. Bỏ `force:true` cố định: có cảnh báo một tuần thì nút đổi thành "Vẫn dời vào tuần này" (gửi `force:true`); có `seHuyLich` thì đi qua hộp xác nhận như LM-3.
  - Rút đoạn giải thích `:642-645` thành 2 dòng: "Các kỹ năng chưa thi chuyển sang cùng một tuần; kỹ năng đã thi hoặc có điểm giữ nguyên. Muốn tách Speaking thì dời ở dòng kỹ năng." (impeccable `clarify`).
  - Menu "Chỉnh lịch": "Dời lịch thi cả đợt" hiện cho cả MT lịch sử (D3) — tuần đích đã qua hợp lệ thì máy chủ cho.
- [x] **Step 4:** `npm run check` + ảnh → **Step 5:** commit `"PR-LM (4): Dời lịch cả đợt dùng WeekPicker, giữ cảnh báo, báo huỷ lịch lượt bị vượt"`.

### Task LM-5: Panel Lộ trình — chỉnh lịch MT ngay tại bảng (mục 2, 3)
Skill: test-driven-development · impeccable layout

**Files:**
- Modify: `web/src/modules/students/StudentPlanPanel.tsx:163-235`
- Create: `web/src/modules/students/HangLichMt.tsx` (một hàng của bảng lịch MT + menu thao tác) — tách để `StudentPlanPanel` không phình.
- Modify (nếu cần dữ liệu): `server/src/classes/schedule.ts` `suggestedMockWeeks` trả thêm mỗi lượt `{ attemptId, trangThai: 'chua-xep'|'da-xep'|'co-diem'|'lich-su'|'huy', kyNang: Array<{ skill, periodId, weekStart, coDiem, daThi }>, kyVong }`.
- Test: `prLm.tests.ts` (máy chủ: hình dạng `suggested-mocks` mới; quét nguồn: panel có "Dời lịch", "Huỷ lịch", "Nhập điểm", "Thêm MT").

**Interfaces:**
- Consumes: LM-1 (`/ke-hoach-test/dot/kiem` có `seHuyLich`, `/ke-hoach-test/dot` có `xacNhanHuyLich`, `/attempts/:id/bo-tuan`), LM-3 (`HopKyNang` rộng, có xác nhận huỷ lịch), `xepMoi` (`/ke-hoach-test/xep-moi`, tạo cả MT lịch sử), `DaiODiemLon` (`web/src/modules/fasttrack/ODiemLon.tsx:68`).

- [x] **Step 1: Phép đỏ** — máy chủ: `GET /cycles/:id/suggested-mocks` của học viên có MT1 (có điểm), MT2 (đã xếp), MT3 (bỏ tuần) trả đúng `trangThai` `co-diem`/`da-xep`/`chua-xep` và `kyNang` 4 dòng mỗi lượt. Quét nguồn: `HangLichMt.tsx` tồn tại, có các chữ "Dời lịch", "Huỷ lịch", "Nhập điểm"; `StudentPlanPanel.tsx` có "Thêm MT".
- [x] **Step 2: Đỏ** → **Step 3: Sửa (impeccable `layout`):**
  - Cột "LỊCH KỸ NĂNG" (chỉ có link "Mở lịch kỹ năng") thay bằng cột thao tác: một nút chính theo trạng thái + menu ⋯:
    - `chua-xep` → nút "Xếp lịch" (mở `HopKyNang` cho lượt đó).
    - `da-xep` → nút "Dời lịch" (mở `HopKyNang`); ⋯: "Huỷ lịch" (hộp lý do ≥ 5 → `/attempts/:id/bo-tuan`), "Nhập điểm", "Mở hồ sơ MT".
    - `co-diem` / `lich-su` → nút "Nhập điểm"; ⋯: "Dời lịch" (MT lịch sử, D3), "Mở hồ sơ MT".
  - "Nhập điểm" mở **dải ô điểm ngay dưới hàng** (`DaiODiemLon` với dữ liệu `GET /attempts/:id` như `MockDetailPage.tsx:263`), lưu từng ô bằng `PUT /attempts/:id/scores/:skill` như hồ sơ MT. Một hàng mở dải tại một thời điểm.
  - Cột "HIỆN TẠI" giữ, thêm trạng thái "Chưa xếp lịch".
  - Dưới bảng: nút "+ Thêm MT" → hộp chọn tuần cho từng kỹ năng (dùng lại `HopKyNang` chế độ tạo mới, `/ke-hoach-test/xep-moi`); tuần đã qua → tạo MT lịch sử theo luật `kiemTuanDaQua` (đã có).
  - Nút "Áp lịch cho N lượt" / "Lịch đã đúng" giữ nguyên chỗ và hành vi.
  - Panel rộng `rong` (720 px) giữ; 375 px bảng cuộn ngang trong khung, nút ≥ 40 px.
  - Sau mỗi thao tác: tải lại `suggested-mocks` và báo toast một dòng ("Đã dời MT1 sang W4 JUL · huỷ lịch MT2").
- [x] **Step 4:** `npm run check` + ảnh panel ở 4 trạng thái → **Step 5:** commit `"PR-LM (5): panel Lộ trình xếp/dời/huỷ lịch/nhập điểm MT tại chỗ"`.

### Task LM-6: Chữ hồ sơ Mock (I5 của `2026-10-02-ux-sau-critique.md:95-97`)
Skill: test-driven-development · impeccable clarify

**Files:**
- Modify: `web/src/modules/fasttrack/ODiemLon.tsx:57-60` (nhánh `l.doiTu && l.absenceMoveCount > 0` dựng chữ `vắng · dời sang ${tuanLich(l.weekStart, homNay)} · lần ${l.absenceMoveCount}`).
- Modify: `web/src/modules/fasttrack/NhanXet.tsx:109` (`placeholder="Không bắt buộc"`).
- Test: `prLm.tests.ts` (hàm thuần + quét nguồn).

- [x] **Step 1: Phép đỏ** — tách phần chọn chữ của nhánh trên thành hàm thuần `chuDoiVang(l, homNay)` (cùng file, export để kiểm): (a) `weekStart` thuộc tuần của `homNay` → `chu === 'Thi bù tuần này (lần 1)'` với `absenceMoveCount = 1`; (b) tuần khác → giữ chữ dạng `vắng · dời sang W4 SEP · lần 2` (mã tuần, không ngày); `title` giữ nguyên câu "Dời từ … sang …". Quét nguồn: `NhanXet.tsx` không còn `"Không bắt buộc"`, placeholder bắt đầu "Ví dụ:".
- [x] **Step 2: Đỏ** → **Step 3: Sửa (impeccable `clarify`):**
  - Tuần đang xem = tuần thi bù → "Thi bù tuần này (lần N)"; so tuần bằng hàm tuần sẵn có (`shared/domain`, cùng nguồn với `tuanLich`), không so chuỗi.
  - Placeholder nhận xét: `"Ví dụ: Nghe phần 3 còn chậm, cần luyện thêm dạng điền bảng"` (luật `KhungPanel`: chữ mẫu bắt đầu "Ví dụ:"); giữ `maxLength={NHAN_XET_TOI_DA}`, lưu khi blur / Ctrl+Enter như cũ.
- [x] **Step 4:** `npm run check` + ảnh hồ sơ MT có ô thi bù (tuần này / tuần khác) 1440/375 → **Step 5:** commit `"PR-LM (6): chữ thi bù và chữ mẫu nhận xét ở hồ sơ MT"`.

### Task LM-7: MockDetailPage + HopThaoTacMt: `Modal` (Drawer) → `KhungPanel` (I4, phần lịch MT — `2026-10-02-ux-sau-critique.md:93-94`)
Skill: test-driven-development · impeccable layout, harden

**Files:**
- Modify: `web/src/modules/fasttrack/MockDetailPage.tsx` — import `:10` (`ConfirmDialog, Modal` từ `../../ui/Drawer.tsx`); các hộp `WeekModal :599-649` (`<Modal :613`, đã đổi ở LM-4 — làm SAU LM-4), `DeadlineModal :652-704` (`:675`), `AbsenceMoveModal :753-863` (`:789`), `TraLoiDeNghiModal :865+` (`:875`). `CancelDialog :706` (`ConfirmDialog`) giữ — hộp xác nhận, không phải panel.
- Modify: `web/src/modules/fasttrack/HopThaoTacMt.tsx` — import `:4`, `<Modal :140-145>` (chân: "Đóng" trái, nút chính phải, chữ "Vẫn dời vào tuần này" khi `canhBao`).
- Dùng: `web/src/ui/KhungPanel.tsx` (`KhungPanel` + `chan: { huy, xoa, phu, chinh, conThieu }`, `khoPanelChung` — mở panel mới thì thay, không chồng).
- Test: `prLm.tests.ts` (quét nguồn).

- [x] **Step 1: Phép đỏ** — quét nguồn: `MockDetailPage.tsx` và `HopThaoTacMt.tsx` không import `Modal` từ `Drawer.tsx` (chỉ còn `ConfirmDialog` ở MockDetailPage); có `<KhungPanel`; không có nút chữ trần `>Huỷ<` ở chân (luật S3). Phép hành vi cũ của các hộp (lưu tuần, hạn, xử lý vắng, trả lời đề nghị, thao tác MT) giữ nguyên, phải vẫn xanh.
- [x] **Step 2: Đỏ** → **Step 3: Sửa (impeccable `layout`, `harden`):**
  - Chỉ đổi khung: `title` → `tieuDe` (+ `hocVien`, `lop` từ `detail`), nội dung → thân, `footer` → `chan`. Không đổi gọi API, `force`, lý do ≥ `LY_DO_TOI_THIEU`, điều kiện bật/tắt nút.
  - Luật S3 chân: chưa sửa → `huy.nhan = 'Đóng'`, đã sửa (theo state ô) → `'Huỷ thay đổi'`; thao tác nguy hiểm (`bo-ky-nang`, `huy-diem`) giữ nút chính màu đỏ; đang lưu → "Đang lưu…" và khoá nút.
  - Lỗi máy chủ hiện trong panel (`Truong loi` / dòng lỗi trên chân), không đóng panel, không mất chữ đã gõ.
  - 375 px toàn màn, nút ≥ 40 px; Esc đóng như `onDong` (hỏi nếu đã sửa — như các panel KhungPanel khác).
- [x] **Step 4:** `npm run check` + ảnh từng hộp 1440/375 sáng/tối → **Step 5:** commit `"PR-LM (7): hộp thao tác hồ sơ MT dùng KhungPanel, giữ hành vi"`.

**Nghiệm thu PR-LM:**
1. Ảnh 1: panel Lộ trình một ô Dự kiến thi; mỗi hàng MT có nút xếp/dời/nhập điểm; không phải vào hồ sơ MT.
2. Ảnh 2: chọn tuần bằng ‹ › + lịch, không cuộn danh sách; tuần đã qua bị khoá với MT đang chạy.
3. Ảnh 4: hộp đủ rộng, không chữ "W…", mỗi kỹ năng một thanh chọn tuần.
4. Mục 8: dời MT1 sau MT2 → chữ đỏ trên hộp; Lưu → hộp xác nhận nêu MT2; xác nhận → MT2 "Chưa xếp lịch"; MT2 có điểm → chặn, không có nút lưu. Dời MT lịch sử được.
5. LM-6: ô thi bù đang ở tuần này ghi "Thi bù tuần này (lần 1)"; ô nhận xét có chữ mẫu "Ví dụ: …".
6. LM-7: mọi hộp thao tác của hồ sơ MT mở dạng `KhungPanel` (ngăn phải / toàn màn 375), chân theo luật S3, hành vi y như trước.
7. `/impeccable audit` các màn: panel Lộ trình, hồ sơ MT (hộp Dời cả đợt, các panel thao tác), Kế hoạch Test (HopKyNang) — 1440/375 sáng/tối.

---

# PR-DH — Bảng Học viên & Lớp, điều hướng hồ sơ · ƯU TIÊN 3

Nhánh: `pr-dh-bang-dieu-huong`. Có giao diện → `/ponytail lite`; impeccable `critique` (DH-5, chỉ hàng chip), `layout`, `clarify`, `audit`. Làm **sau** PR-LM (cần trạng thái "chưa xếp lịch").

**Bản đồ code:** `web/src/modules/students/StudentsPage.tsx` (chip `:184-208`, cột `CotBangLop :299-306`, tiêu đề cột, `HopLop :312-392`), `BangHocVienLop.tsx` (ô "Sắp tới" `:147-148,169-171`, thẻ điện thoại `:96-134`), `server/src/students/standing.ts:78-83,140,217-224` (`nextAttemptLabel`, `nextWeekStart`), `shared/domain/lichMt.ts:111-121` (`mocKeTiep`, `MOC_KE_TIEP_SQL`), `server/src/fasttrack/scoring.ts:110` (`expectationFor`), `server/src/fasttrack/cycles.ts:86-115` (`examPlanOf`), roster `classes.ts:609,615-622` (đã trả `examPlan`), `StudentDetailPage.tsx:183` (Quay lại = `navigate(-1)`), `ClassOverviewPage.tsx` + `DauTrangLop.tsx` (chưa có Quay lại), `shared/domain/duongHoSo.ts:38-52`.

### Task DH-1: "Sắp tới" thêm kỳ vọng, hết MT thì "Thi thật" (mục 5, D5)
Skill: test-driven-development (hàm thuần chuSapToi)

**Files:** Create `shared/domain/sapToi.ts` (+ re-export). Modify `server/src/students/standing.ts` (thêm `nextKyVong`, `conLuotChuaXep`, `examPlan`), `BangHocVienLop.tsx:147-171`. Test: `server/src/tests/prDh.tests.ts` (mới) + `run.ts`.

**Interfaces:**
- Produces: `chuSapToi(o: { nhanLuot: string | null; tuanBatDau: string | null; kyVong: number | null; conLuotChuaXep: string | null; duKienThi: { confidence: 'none'|'month'|'week'; label: string } | null; homNay: string; khung: 'ft'|'thuong' }): string | null`
- `Standing` thêm: `nextKyVong: number | null`, `nhanLuotChuaXep: string | null` (lượt chưa huỷ, không lịch sử, chưa có tuần, số nhỏ nhất), `examPlan` (từ `examPlanOf`).

- [x] **Step 1: Phép đỏ (thuần)** — `server/src/tests/prDh.tests.ts`:

```ts
/** PHÉP KIỂM PR-DH — bảng Học viên & Lớp (Sắp tới, Dự kiến thi) và điều hướng hồ sơ (chủ sản phẩm 03/10). */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrDhTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d = await import('../../../shared/domain/index.ts');
  console.log('\nPR-DH · Bảng Học viên & Lớp, điều hướng hồ sơ');
  const goc = { nhanLuot: null, tuanBatDau: null, kyVong: null, conLuotChuaXep: null, duKienThi: null, homNay: '2026-10-03', khung: 'ft' as const };

  check('PR-DH (1) · chuSapToi: còn MT → "MT2 · W3 OCT · 5.5"; kỳ vọng null → không số', () => {
    assert(d.chuSapToi({ ...goc, nhanLuot: 'MT2', tuanBatDau: '2026-10-12', kyVong: 5.5 }) === 'MT2 · W2 OCT · 5.5', String(d.chuSapToi({ ...goc, nhanLuot: 'MT2', tuanBatDau: '2026-10-12', kyVong: 5.5 })));
    assert(d.chuSapToi({ ...goc, nhanLuot: 'MT2', tuanBatDau: '2026-10-12', kyVong: null }) === 'MT2 · W2 OCT', 'không kỳ vọng');
    assert(d.chuSapToi({ ...goc, nhanLuot: 'MT3', tuanBatDau: '2026-10-12', kyVong: 6 }) === 'MT3 · W2 OCT · 6.0', 'số luôn một chữ số thập phân');
  });

  check('PR-DH (1) · chuSapToi: còn lượt chưa xếp tuần → "MT2 · chưa xếp"; hết MT → "Thi thật · <dự kiến>"', () => {
    assert(d.chuSapToi({ ...goc, conLuotChuaXep: 'MT2' }) === 'MT2 · chưa xếp', 'chưa xếp');
    assert(d.chuSapToi({ ...goc, duKienThi: { confidence: 'week', label: 'W2 DEC' } }) === 'Thi thật · W2 DEC', 'tuần');
    assert(d.chuSapToi({ ...goc, duKienThi: { confidence: 'month', label: '12/2026' } }) === 'Thi thật · 12/2026', 'tháng');
    assert(d.chuSapToi({ ...goc, duKienThi: { confidence: 'none', label: '' } }) === 'Thi thật · chưa có ngày', 'chưa có');
    assert(d.chuSapToi({ ...goc, khung: 'thuong' }) === null, 'lớp thường hết mốc → null (giữ "—")');
  });
}
```
  (Đọc `tuanLich` trước để chắc mã tuần của 12/10/2026; sửa kỳ vọng chuỗi nếu tuần đó không phải `W2 OCT` — phép phải khớp hàm thật, không đổi hàm cho khớp phép.)
- [x] **Step 2: Đỏ** → **Step 3: Viết `chuSapToi`**:

```ts
import { tuanLich } from './…'; // import đúng chỗ tuanLich đang ở

/** Ô "Sắp tới" của bảng Học viên & Lớp (chủ sản phẩm 03/10, mục 5): ngắn, chỉ thêm con số kỳ vọng. */
export function chuSapToi(o: {
  nhanLuot: string | null; tuanBatDau: string | null; kyVong: number | null; conLuotChuaXep: string | null;
  duKienThi: { confidence: 'none' | 'month' | 'week'; label: string } | null; homNay: string; khung: 'ft' | 'thuong';
}): string | null {
  if (o.nhanLuot) {
    const tuan = o.tuanBatDau ? ` · ${tuanLich(o.tuanBatDau, o.homNay)}` : '';
    const so = o.kyVong !== null && o.khung === 'ft' ? ` · ${o.kyVong.toFixed(1)}` : '';
    return `${o.nhanLuot}${tuan}${so}`;
  }
  if (o.conLuotChuaXep) return `${o.conLuotChuaXep} · chưa xếp`;
  if (o.khung !== 'ft') return null;
  const nhan = o.duKienThi && o.duKienThi.confidence !== 'none' ? o.duKienThi.label : 'chưa có ngày';
  return `Thi thật · ${nhan}`;
}
```
- [x] **Step 4: Máy chủ** — `standing.ts`: khi có `nextAttemptNo`, `nextKyVong = expectationFor(target_at_attempt của lượt đó, attemptNo, route)` (dùng `assessment_attempts.target_at_attempt`, hàm ở `scoring.ts:110`; KCK/không target → null). `nhanLuotChuaXep`: lượt `planned`, `lich_su=0`, `planned_period_id IS NULL` nhỏ nhất. `examPlan` = `examPlanOf(cycle)`. Phép máy chủ (thêm vào `prDh.tests.ts`, kiểu `prHvl.tests.ts:593-603`): học viên FT Target 6.0 có MT2 đã xếp → `standing.nextKyVong === 5.5`; học viên hết MT, dự kiến thi tháng 12 → `examPlan.confidence === 'month'`.
- [x] **Step 5: Web** — `BangHocVienLop.tsx`: thay chuỗi `sapToi` bằng `chuSapToi(...)`. Số kỳ vọng hiện cùng cỡ chữ, `tabular-nums`, không thêm chữ "Kỳ vọng" (yêu cầu: "chỉ cần thêm con số"); `title` của ô: "MT2 · tuần thi W2 OCT · kỳ vọng 5.5". "Thi thật · …" dùng tone nhấn nhẹ có sẵn (không màu mới). Thẻ điện thoại (`:96-134`) dùng cùng hàm.
- [x] **Step 6:** `npm run check` → **Step 7:** commit `"PR-DH (1): Sắp tới có kỳ vọng, hết MT thì Thi thật"`.

### Task DH-2: Cột "Dự kiến thi" (mục 5)
Skill: test-driven-development · impeccable layout

**Files:** Modify `StudentsPage.tsx:299-306` (+ tiêu đề cột), `BangHocVienLop.tsx` (ô mới + thẻ điện thoại). Test: quét nguồn trong `prDh.tests.ts`.

- [x] **Step 1: Phép đỏ (quét nguồn)**: tiêu đề cột nhóm FT có "Dự kiến thi"; `BangHocVienLop.tsx` dùng `ExamPlanText` (cùng component `ClassRoster.tsx:178,220` đang dùng) hoặc nhãn `examPlan`.
- [x] **Step 2: Đỏ** → **Step 3: Sửa:**
  - Thêm cột "Dự kiến thi" sau "Target" ở nhóm FT; nhóm lớp thường không có cột này (ô trống giữ thẳng cột, như cách "Target"/"Khoá" đang đổi theo nhóm).
  - Ô: `ExamPlanText` (tuần → mã tuần `W2 DEC`; tháng → `12/2026`; ngày cụ thể → `dd/mm/yyyy` — ngày thi được phép hiện ngày theo CLAUDE.md); trống → "—".
  - Độ rộng (tổng ≤ 98%): Học viên 19 · Kết quả 20 · Target 8 · **Dự kiến thi 11** · Sắp tới 15 · Case 5 · Việc tiếp theo 20 · ⋯ `w-12`; `min-w-[860px]` → `min-w-[960px]`. Kiểm ảnh: không cột nào xuống dòng xấu ở 1440.
  - Thẻ điện thoại: thêm dòng "Dự kiến thi" sau Target.
- [x] **Step 4:** `npm run check` + ảnh → **Step 5:** commit `"PR-DH (2): cột Dự kiến thi ở Học viên & Lớp"`.

### Task DH-3: Học viên trước / sau trong hồ sơ học viên (mục 4, Q-0310-4)
Skill: test-driven-development (hàm thuần keBen)

**Files:**
- Create: `shared/domain/dieuHuongHoSo.ts` (+ re-export) — hàm thuần.
- Create: `web/src/ui/ThanhTruocSau.tsx` — "← Quay lại · ‹ Trước · 3/11 · Sau ›" dùng chung cho hồ sơ HV và hồ sơ lớp.
- Modify: `web/src/modules/students/StudentsPage.tsx` + `BangHocVienLop.tsx` (thu thứ tự đang hiện, truyền vào link), `ClassRoster.tsx:121,207` (truyền thứ tự roster), `StudentDetailPage.tsx:183` (dùng `ThanhTruocSau`).
- Test: `prDh.tests.ts`.

**Interfaces:**
- Produces:
  - `keBen(ds: readonly number[], id: number): { truoc: number | null; sau: number | null; viTri: number; tong: number } | null` (null khi `id` không có trong `ds`).
  - `type NguCanhDs = { loai: 'hoc-vien' | 'lop'; ids: number[]; nhan: string }` — đi qua `location.state.ds` của react-router và lưu `sessionStorage['pisa.ds.' + loai]` (tải lại trang vẫn còn; đọc/ghi trong try/catch).
  - `ThanhTruocSau({ loai, id, duong: (id: number) => string, dsDuPhong?: () => Promise<number[]> })`.

- [x] **Step 1: Phép đỏ (thuần)**

```ts
  check('PR-DH (3) · keBen: giữa / đầu / cuối / không có trong danh sách', () => {
    const ds = [7, 3, 9, 1];
    assert(JSON.stringify(d.keBen(ds, 3)) === JSON.stringify({ truoc: 7, sau: 9, viTri: 2, tong: 4 }), JSON.stringify(d.keBen(ds, 3)));
    assert(JSON.stringify(d.keBen(ds, 7)) === JSON.stringify({ truoc: null, sau: 3, viTri: 1, tong: 4 }), 'đầu');
    assert(JSON.stringify(d.keBen(ds, 1)) === JSON.stringify({ truoc: 9, sau: null, viTri: 4, tong: 4 }), 'cuối');
    assert(d.keBen(ds, 42) === null, 'không có');
  });
```
- [x] **Step 2: Đỏ** → **Step 3: Viết:**

```ts
/** Hồ sơ trước / sau trong danh sách người dùng vừa mở (chủ sản phẩm 03/10, Q-0310-4). */
export function keBen(ds: readonly number[], id: number): { truoc: number | null; sau: number | null; viTri: number; tong: number } | null {
  const i = ds.indexOf(id);
  if (i < 0) return null;
  return { truoc: i > 0 ? ds[i - 1] : null, sau: i < ds.length - 1 ? ds[i + 1] : null, viTri: i + 1, tong: ds.length };
}
```
- [x] **Step 4: Web:**
  - Học viên & Lớp: mỗi `BangHocVienLop` báo lên `StudentsPage` (callback `onThuTu(classId, ids)`) danh sách id **đúng thứ tự đang hiện** (sau `chiHien` + `sapXepHocVien`). `StudentsPage` ghép theo thứ tự lớp đang hiện (chỉ lớp đang mở). Link tên học viên: `<Link to={…} state={{ ds: { loai: 'hoc-vien', ids, nhan: 'Học viên & Lớp' } }}>`.
  - Hồ sơ lớp `ClassRoster` (và `BangDiemLopThuong`/`BangCanHoTro` của lớp thường): truyền `ids` theo thứ tự đang hiện, `nhan: 'Lớp CP FT 131'`.
  - `ThanhTruocSau`: đọc `location.state?.ds` → nếu không có thì `sessionStorage` (chỉ khi `ids` chứa `id`) → nếu vẫn không có thì `dsDuPhong()` = roster lớp hiện tại của em, A→Z (`localeCompare(…, 'vi')`), nhãn "Lớp {code}". Hiện: `← Quay lại` (giữ `navigate(-1)`; không có lịch sử thì về `/hoc-vien`) · `‹ Trước` · `3/11 · Học viên & Lớp` · `Sau ›`. Chuyển hồ sơ dùng `navigate(duong(id), { state: { ds }, replace: true })` để "Quay lại" vẫn về danh sách, không đi qua từng hồ sơ. Phím tắt `[` / `]` khi không gõ trong ô nhập (tuỳ chọn, ghi `ponytail:` nếu bỏ). Nút ≥ 40 px ở điện thoại; ở 375 px ẩn chữ "Trước/Sau", giữ mũi tên + `aria-label`.
  - Giữ tab hồ sơ đang mở khi sang em kế tiếp (đọc tham số `tab` qua `duongHoSoHocVien`).
- [x] **Step 5:** `npm run check`; bấm thử: lọc "Cần làm" → mở em thứ 2 → Sau đi đúng em thứ 3 của danh sách lọc; tải lại trang vẫn còn thanh; mở link trực tiếp → đi theo lớp A→Z.
- [x] **Step 6:** commit `"PR-DH (3): hồ sơ học viên có Trước/Sau theo danh sách vừa mở"`.

### Task DH-4: Lớp trước / sau + Quay lại ở hồ sơ lớp (mục 4)
Skill: test-driven-development · impeccable layout

**Files:** Modify `StudentsPage.tsx` (`HopLop` link "Hồ sơ lớp" truyền `ds` loại `lop` theo thứ tự lớp đang hiện), `DauTrangLop.tsx` (thêm `ThanhTruocSau` trên `header.card`). Fallback `dsDuPhong` = thứ tự `GET /hoc-vien-lop` (`rows`) không lọc.

- [x] **Step 1:** phép quét nguồn: `DauTrangLop.tsx` dùng `ThanhTruocSau` với `loai="lop"` → đỏ.
- [x] **Step 2:** sửa → `npm run check` → bấm thử: từ Học viên & Lớp (khung Fast Track) mở lớp 1 → Sau sang lớp 2 cùng khung → **Step 3:** commit `"PR-DH (4): hồ sơ lớp có Quay lại và Lớp trước/sau"`.

### Task DH-5: Hàng chip đầu trang Học viên & Lớp (mục 6)
Skill: test-driven-development · impeccable critique (vùng đầu trang) → layout

**Files:** Modify `StudentsPage.tsx:138-208`.

- [x] **Step 1:** `/impeccable critique` **chỉ** vùng đầu trang (tiêu đề, ô tìm, Phạm vi/Chi nhánh/Xếp, `CongTacKhung`, chip) ở 1440 và 375, ghi kết quả vào mô tả PR.
- [x] **Step 2: `/impeccable layout`** theo tiêu chí:
  - Một trục căn trái thẳng mép trái bảng; khoảng cách theo thang 8: giữa các chip 8 px, giữa nhóm chip và nhóm điều khiển 16 px, từ hàng chip tới bảng 16 px.
  - Chip cùng chiều cao (32 px desktop, vùng bấm 44 px điện thoại như PR-HK1), số đếm cùng kiểu (`tabular-nums`, cách chữ 6 px), chip đang chọn khác rõ bằng nền + viền đã có (không màu mới).
  - Số 0 không mờ như bị khoá (giống L2 của PR-L1).
  - `CongTacKhung` và "Xếp" cùng hàng với chip ở ≥ 1024 px (chip bên trái, công tắc + Xếp căn phải); hẹp hơn thì xuống hàng gọn, không lệch đường cơ sở.
  - 375 px: giữ cuộn ngang + mờ mép của K1.
- [x] **Step 3:** ảnh trước/sau 1440/375 sáng/tối → commit `"PR-DH (5): hàng chip Học viên & Lớp gọn, khoảng cách đều"`.

**Nghiệm thu PR-DH:** ảnh 3 có cột Dự kiến thi; "Sắp tới" = `MT2 · W3 OCT · 5.5` / `MT2 · chưa xếp` / `Thi thật · 12/2026`; hồ sơ HV và hồ sơ lớp có Quay lại + Trước/Sau đúng thứ tự danh sách; hàng chip đều. `/impeccable audit` cho Học viên & Lớp, hồ sơ HV, hồ sơ lớp.

---

# PR-SL — Sửa thông tin cả lớp (mục 9, Q-0310-3) · ƯU TIÊN 4

Nhánh: `pr-sl-sua-ca-lop`. Có giao diện → `/ponytail lite`; impeccable `layout`, `harden`, `audit`.

**Bản đồ code:** `IntakePanel.tsx` (mẫu panel lưới, `KhungPanel rong="toan"`), `shared/domain/nhapHocVien.ts` (`cotLuoiNhap`), `server/src/classes/intake.ts` (mẫu preview/commit có `idempotencyKey`), `server/src/students/students.ts:353-390` (`updateStudent`), `server/src/fasttrack/cycles.ts` (`updateCycle :185`, `setBaseline :361`, `reviseTarget :486`), quyền `STUDENT_EDIT` / `CYCLE_EDIT` (`server/src/permissions.ts:396-407`), menu ⋮ `DauTrangLop.tsx:108-123`.

### Task SL-1: Máy chủ — xem trước và lưu hàng loạt, tất cả hoặc không gì
Skill: test-driven-development (máy chủ, một giao dịch)

**Files:**
- Create: `server/src/classes/suaCaLop.ts`
- Modify: `server/src/routes/index.ts` (2 route), `CODE_MAP.md` (thêm dòng)
- Test: `server/src/tests/prSl.tests.ts` (mới) + `run.ts`

**Interfaces:**
- `type DongSua = { studentId: number; fullName?: string; dob?: string | null; email?: string | null; startWeek?: string; examDate?: string | null; target?: number | string | null; baseline?: number | null }` — chỉ gửi trường **đã đổi**.
- `xemTruocSuaCaLop(p, classId, { rows: DongSua[]; lyDoTarget?: string }): { rows: Array<{ studentId: number; issues: VanDeNhap[] }>; canhBaoMt: Array<{ studentId: number; cau: string }> }`
- `luuSuaCaLop(p, classId, { rows: DongSua[]; lyDoTarget?: string; idempotencyKey: string }): { daSua: number }`
- Route: `POST /classes/:id/sua-ca-lop/xem-truoc`, `POST /classes/:id/sua-ca-lop`.

- [x] **Step 1: Phép đỏ** — `prSl.tests.ts` (`checkAsync`, gọi HTTP bằng cookie Quản lý và cookie GVCN, theo mẫu `prNhap.tests.ts`):
  1. Sửa họ tên 2 em + email 1 em → 200 `daSua: 2`; DB đổi đúng; 2 dòng audit `student.update`.
  2. Một dòng email sai → xem trước trả issue `loi` đúng dòng; lưu → 400 và **không dòng nào** được ghi (transaction).
  3. Đổi Target 1 em không có `lyDoTarget` → 400 "Ghi lý do đổi Target."; có lý do → `target_revisions` có dòng mới, `effectiveFrom` = hôm nay.
  4. GVCN (có `STUDENT_EDIT`, không có `CYCLE_EDIT`) đổi Target → 403 với câu của `CHI_QL_SUA`; GVCN đổi họ tên → 200.
  5. `studentId` không thuộc lớp `:id` → 400 "Học viên … không thuộc lớp này".
  6. Đổi tuần bắt đầu → xem trước có `canhBaoMt` (cùng câu cảnh báo "các MT … sẽ dời" mà `ThongTinPanel` đang hiện — tìm hàm tạo câu đó và gọi lại).
  7. Gửi lại cùng `idempotencyKey` → không ghi lần hai (theo cách `intake.ts` làm).
  8. Điểm đầu vào 9.5 → issue `loi` "0–9".
  9. Lớp thường: `target`/`baseline`/`startWeek` bị bỏ qua hoặc báo lỗi theo đúng `cotLuoiNhap(lopThuong)` — chọn theo `cotLuoiNhap`, ghi rõ trong phép.
- [x] **Step 2: Đỏ** → **Step 3: Viết `suaCaLop.ts`:**
  - Kiểm từng dòng **trước** khi ghi: em thuộc lớp; quyền theo trường (`STUDENT_EDIT` cho họ tên/ngày sinh/email/tuần bắt đầu/dự kiến thi/điểm đầu vào; `CYCLE_EDIT` cho Target); kiểu dữ liệu bằng chính các hàm đọc mà `updateStudent`/`updateCycle`/`setBaseline` đang dùng (`docNgayNhap`, `docEmail`, `docTarget`, khoảng 0–9) — **không** viết lại luật.
  - Lưu: một transaction, gọi lần lượt `updateStudent`, `updateCycle(p, cycleId, { startWeek?, examDate? })`, `setBaseline(p, cycleId, { source: <nguồn "nhập tay" có trong BASELINE_SOURCES>, score })`, `reviseTarget(p, cycleId, { newTarget, reason: lyDoTarget })`. Lỗi ở bất kỳ dòng nào → rollback toàn bộ, trả lỗi kèm `studentId`.
  - Trần: ≤ 60 dòng một lần (lớp lớn nhất hiện có < 30); vượt → 400.
- [x] **Step 4:** `npm run check` xanh → **Step 5:** commit `"PR-SL (1): máy chủ sửa thông tin cả lớp, xem trước + lưu một giao dịch"`.

### Task SL-2 ✅: Panel "Sửa thông tin cả lớp"
Skill: test-driven-development · impeccable layout, harden

**Files:**
- Create: `web/src/modules/students/SuaCaLopPanel.tsx`
- Modify: `web/src/modules/classes/DauTrangLop.tsx:97-123` (mục ⋮ "Sửa thông tin học viên" + nút nhỏ cạnh "+ Học viên"), `ClassOverviewPage.tsx:118-120` (mở panel).
- Test: quét nguồn trong `prSl.tests.ts`.

- [x] **Step 1: Phép đỏ (quét nguồn)**: `SuaCaLopPanel.tsx` tồn tại, không có `textarea`/`/intake/parse` (không dán Excel); `DauTrangLop.tsx` có "Sửa thông tin học viên".
- [x] **Step 2: Đỏ** → **Step 3: Sửa (impeccable `layout` + `harden`):**
  - `KhungPanel tieuDe="Sửa thông tin học viên" hocVien={"Lớp " + code} rong="toan"`, lưới giống `IntakePanel`: một hàng một em đang học (theo thứ tự roster), cột Họ tên · Ngày sinh (`ONgay`) · Email · Tuần bắt đầu học (`ONgay kieu="tuan"`) · Dự kiến thi (`ONgay kieu="ngay-hoac-thang"`) · Target · Điểm đầu vào. Lớp thường: chỉ các cột `cotLuoiNhap(lopThuong)` cho phép.
  - Ô đã đổi tô nền nhấn nhẹ + chấm "đã sửa"; đầu panel: "Đã sửa 3 em" ; nút "Hoàn tác" từng ô (về giá trị gốc).
  - Có Target đổi → hiện ô **"Lý do đổi Target \*"** dùng chung (≥ 5 ký tự), ghi chú "Áp cho mọi em đổi Target trong lần lưu này". Người không có `CYCLE_EDIT` → cột Target chỉ đọc, `title` "Chỉ Quản lý đổi Target".
  - Xem trước tự động (debounce 400 ms) như IntakePanel → lỗi đỏ ngay dưới ô, cảnh báo MT (đổi tuần bắt đầu) vàng ở cuối hàng.
  - Chân panel theo luật S3: "Đóng" khi chưa sửa / "Huỷ thay đổi" khi đã sửa; nút chính "Lưu 3 em" (khoá khi có lỗi). Đóng khi có thay đổi → hỏi xác nhận (chống mất dữ liệu).
  - Lưu xong: toast "Đã cập nhật 3 học viên", đóng panel, tải lại roster.
  - 375 px: lưới cuộn ngang trong khung, cột Họ tên dính trái.
  - Chỗ vào: mục "Sửa thông tin học viên" trong ⋮ (hiện khi có ít nhất một em và người xem có `STUDENT_EDIT` cho lớp — thêm cờ `viewer.coTheSuaHocVien` vào `HoSoLop.viewer` nếu chưa có) **và** nút nhỏ `btn-ghost btn-sm` "Sửa thông tin" cạnh "+ Học viên".
- [x] **Step 4:** `npm run check` + ảnh 1440/375 (chưa sửa, đang sửa có lỗi, có Target đổi) → `/impeccable audit` → **Step 5:** commit `"PR-SL (2): panel sửa thông tin cả lớp"`.

**Nghiệm thu PR-SL:** từ hồ sơ lớp sửa họ tên/ngày sinh/email/tuần bắt đầu/dự kiến thi/Target/điểm đầu vào của nhiều em trong một panel, lưu một lần; một ô sai → không em nào bị ghi; GVCN không đổi được Target; không có ô dán Excel.

## PR-SL — Task bổ sung 04/10 (SL-3 → SL-9, plan.md mục 3 + mục 4 "PR-SL")

Bản đồ code đã kiểm 04/10 trên `origin/main` 67f48acf. Mọi Task: phép đỏ trước trong `prSl.tests.ts`, rồi sửa, rồi `npm run check`.

### Task SL-3 ✅: Một mẫu Excel chung (quyết định 04/10)
Skill: test-driven-development · impeccable clarify (câu "Đã đọc…")

**Files:** `shared/domain/nhapHocVien.ts` (`docDongDan`), `server/src/classes/intake.ts` (`parsePaste` câu lỗi), `web/src/modules/students/IntakePanel.tsx:209-243` (placeholder ô dán, dòng "Đã đọc…"), `server/src/tests/prNt.tests.ts:135-139` (phép cũ "lớp thường 6 cột" đổi theo quyết định), `prSl.tests.ts`.

- **Luật:** dán **không tiêu đề** → luôn đọc theo thứ tự cột Fast Track `cotLuoiNhap(false)` cho **mọi** lớp. Lớp thường: cột không có trong `cotLuoiNhap(true)` (Overall, L, R, W, S, Đã thi tới MT) thành `null` trong `cot` và tên cột vào `cach.boQua` — **một** lưu ý cho cả lô, không thêm lưu ý từng dòng. Có tiêu đề → giữ nguyên (khớp theo tên). `thua`/`thieu` tính theo 12 cột.
- **Phép kiểm (đỏ trước):** một dòng FT 12 ô `Lê An · 12/05/2008 · an@x.vn · 5 · 5 · 5.5 · 5 · 5 · 6.5 · 05/2027 · 0 · 05/10/2026` dán vào `MB FT 101` và `MB FOU 12` (không tiêu đề) → cả hai ra cùng Họ tên / Ngày sinh / Email / Target `6.5` / Dự kiến thi `05/2027` / Tuần bắt đầu (Thứ Hai `2026-10-05`); lớp thường `cach.boQua` = `Overall, L, R, W, S, Đã thi tới MT`, `thua = 0`; dòng không có band/thi tới MT (`An\t\ta@x.vn`) vẫn đọc đúng.
- **Chữ (clarify):** không tiêu đề → "Đã đọc theo mẫu Excel chung: Họ và tên · … · Tuần bắt đầu." + lớp thường "Lớp thường bỏ qua cột Overall, L, R, W, S, Đã thi tới MT." Placeholder ô dán: "…Không có tiêu đề thì web đọc theo mẫu Excel chung (thứ tự cột Fast Track)." Câu lỗi `parsePaste` "đọc theo thứ tự cột của lớp" → "đọc theo mẫu Excel chung".
- Commit `"PR-SL (3): một mẫu Excel chung cho lớp FT và lớp thường"`.

### Task SL-4 ✅: Khung panel chung — I1 (Đóng / Huỷ thay đổi) + D11 (`aria-describedby`)
Skill: test-driven-development · impeccable harden

**Files:** `web/src/ui/KhungPanel.tsx` (`chan.daSua`, `Truong`), `web/src/ui/ui.tsx:318` (`Field`), nơi gọi: `IntakePanel.tsx:165`, `cases/QuickReport.tsx:295-305` (Tạo Case), Từ chối inline (grep `tu-choi`/`Từ chối` trong `worklist/`), `SuaCaLopPanel.tsx`.

- **I1:** `KhungPanel` nhận `chan.daSua?: boolean`; nhãn mặc định nút trái = `daSua ? 'Huỷ thay đổi' : 'Đóng'` (người gọi truyền `huy.nhan` thì giữ nhãn đó — "Xong", "‹ Sửa"… không đổi). Áp cho Tạo Case (đã gõ/chọn bất kỳ ô nào), Thêm học viên (lưới có dòng có dữ liệu hoặc ô dán có chữ), Từ chối inline (đã gõ lý do), Sửa thông tin học viên. Nơi gọi đang tự viết `daSua ? 'Huỷ thay đổi' : 'Đóng'` thì đổi sang `daSua` (gọn, một luật).
- **D11:** `Truong` và `Field`: dòng lỗi dưới ô có `id` (`useId`); ô đầu tiên trong trường (`input, select, textarea, [aria-invalid]`) được nối `aria-describedby` tới dòng lỗi khi có `loi`, gỡ khi hết lỗi, giữ `aria-describedby` sẵn có của ô. Làm một chỗ trong hai thành phần (không sửa từng nơi gọi).
- **Phép kiểm:** quét nguồn: `KhungPanel.tsx` có `daSua` và chữ "Huỷ thay đổi"; `Truong`/`Field` có `aria-describedby`; bốn nơi gọi trên truyền `daSua`. Bấm thử bằng trình duyệt: ô lỗi có `aria-describedby` trỏ đúng id dòng lỗi.
- Commit `"PR-SL (4): I1 Đóng/Huỷ thay đổi ở khung panel, D11 lỗi dưới ô nối aria-describedby"`.

### Task SL-5 ✅: I2 — form Tạo Case
Skill: test-driven-development · impeccable clarify

**Files:** `web/src/modules/cases/QuickReport.tsx` (`urgency` mặc định, select "Nhóm nguyên nhân", ô "Bắt đầu theo dõi", ô kỹ năng khi chưa chọn HV), luật máy chủ không đổi (`urgency` vẫn bắt buộc khi tạo — kiểm `server/src/cases/*`).
- Không chọn sẵn "Mức độ": `urgency` khởi đầu rỗng, là ô **bắt buộc** trong `loi` (lý do "Chọn mức độ"), `reset()` về rỗng.
- "Nhóm nguyên nhân": option trống ghi "Chọn nhóm" (cả khi chưa chọn kỹ năng: "Chọn kỹ năng trước").
- Kỹ năng: hàng giả khi chưa chọn HV không ghi `W` trần — lấy theo chương trình đã biết hoặc ghi L · R · W1 · W2 · S (FT) / ẩn; HV đã chọn: giữ `tenMonNgan` (W1/W2 FT).
- "Bắt đầu theo dõi" dùng `ChonTuan` (`moc="dau"`, `lui={26} toi={0}`), gửi Thứ Hai của tuần (máy chủ đang nhận ngày — không đổi API).
- Phép: quét nguồn `QuickReport.tsx` không còn `useState<string>(DEFAULT_URGENCY)`, có "Chọn nhóm", ô theo dõi dùng `ChonTuan`.
- Commit `"PR-SL (5): I2 form Tạo Case"`.

### Task SL-6 ✅: I3 — panel Thêm học viên
Skill: impeccable clarify + layout

**Files:** `web/src/modules/students/IntakePanel.tsx` (`RONG`, textarea, nút "Đọc nội dung đã dán", lời nhắc cạnh "+ Thêm dòng").
- Cột "Overall" không cắt chữ (tăng `RONG.baselineScore` hoặc nhãn `OVR` có `title`), placeholder ngày "dd/mm/yyyy" không cắt (ô ngày ≥ chữ mẫu).
- Ô dán bỏ `font-mono`, dùng phông thường.
- Nút "Đọc nội dung đã dán" xuống **dưới** ô dán (ô dán chiếm hết bề rộng).
- Lời nhắc ~100 chữ cạnh "+ Thêm dòng" tách thành 2 dòng ngắn.
- Phép: quét nguồn không còn `font-mono` ở ô dán. Ảnh 1440/375.
- Commit `"PR-SL (6): I3 panel Thêm học viên"`.

### Task SL-7 ✅: I4 — Drawer/Modal → KhungPanel phần còn lại
Skill: impeccable layout · chỉ đổi khung, giữ hành vi

**Files:** `cham/GvCham.tsx:84`, `fasttrack/ScoreEntry.tsx:577` (`CriteriaModal`), `fasttrack/NhanXet.tsx:49`, `yThuc/DeleteViolationConfirm.tsx:31`, `students/StudentDetailPage.tsx:7` (chỉ còn `import { Modal }` thừa → xoá). `MockDetailPage`: đã chuyển ở PR-LM (LM-7); `ConfirmDialog` dòng 769 là hộp xác nhận, giữ.
- Mỗi panel: `KhungPanel` (`rong="hep"`), tiêu đề + tên HV/lớp như đang có, chân theo luật S3 (`daSua`), nút chính giữ nhãn cũ; xoá vi phạm nút chính `btn-danger`. Panel mở chồng trên panel khác (CriteriaModal trong ScoreEntry, NhanXet trong hồ sơ MT) dùng `longTrong` + `z` để Esc chỉ đóng lớp trên.
- Phép: quét nguồn: năm file không còn import `Modal`/`ConfirmDialog` từ `ui/Drawer.tsx` (trừ chỗ đã ghi giữ).
- Commit `"PR-SL (7): I4 các panel còn lại sang KhungPanel"`.

### Task SL-8 ✅: I6 — panel Ghi vi phạm
Skill: impeccable clarify

**Files:** `web/src/modules/yThuc/RecordViolationPanel.tsx`.
- Kiểm lại thật (ảnh): `<li class=inline-flex>` dính mép trên → sửa khoảng cách; "(bắt buộc)" lặp → dùng `*` của `Truong batBuoc` + một dòng chú thích "* bắt buộc" ở đầu thân. Đã hết trên `main` thì ghi "bác bỏ: đã sửa ở PR …" trong mô tả PR.
- Commit `"PR-SL (8): I6 panel Ghi vi phạm"`.

### Task SL-9 ✅: Merge cuối đợt 3 + audit
- `git merge origin/main` (sau U12, DL, K26). Xung đột `run.ts`, `routes/index.ts`, `CODE_MAP.md`, mục 11 `plan.md`: giữ cả hai.
- Rà chân panel của PR-DL và PR-K26 (grep `KhungPanel` trong file mới của hai PR) theo luật I1: có form sửa được → `chan.daSua`.
- `npm run check` → ảnh 375/1440 sáng/tối, vai QL · GVCN · GV · toàn hệ thống → `/impeccable audit` → `/ponytail-review`.

---

## C. Thứ tự làm và rủi ro

| Thứ tự | PR | Phụ thuộc | Rủi ro chính |
|---|---|---|---|
| 1 | PR-PH | — | Thấp; đổi hành vi lỗi 401 → 500 ở bước kiểm phiên |
| 2 | PR-LM | — | **Cao nhất**: lượt có tuần NULL lần đầu xuất hiện trên đường chính. Session code phải `grep -rn "planned_period_id" server/src shared` và kiểm từng chỗ đọc (Tổng quan, Lịch Test, báo cáo, Xuất Excel MT, `mocKeTiep`, hạn chấm) không lỗi/không đếm sai với NULL. Ghi danh sách chỗ đã kiểm vào mô tả PR |
| 3 | PR-DH | PR-LM (trạng thái "chưa xếp") | Trung bình; nhiều cột hơn ở 1440 |
| 4 | PR-SL | — | Trung bình; ghi nhiều bảng trong một giao dịch |

Sổ tay `docs/so-tay/`: PR-LM và PR-DH làm lệch ảnh panel Lộ trình, Kế hoạch Test, Học viên & Lớp — liệt kê ảnh lệch trong mô tả PR, chụp lại cùng đợt sau deploy (như kế hoạch UX 02/10).

## D. Prompt cho session code

### PR-PH
```
Làm PR-PH trong docs/superpowers/plans/2026-10-03-pr-phien-lich-mt-dieu-huong-sua-lop.md (Task PH-1 → PH-3). Nhánh mới từ main: pr-ph-phien-dang-nhap.
Đọc trước: CLAUDE.md, mục "Global Constraints" và "PR-PH" của kế hoạch. Không sửa giao diện ngoài dải "Mất kết nối".
Phép kiểm trước (đỏ) → sửa → npm run check. Bấm thử: tắt API khi đang đăng nhập → không về màn đăng nhập.
Xong: đánh dấu [x], thêm dòng mục 11 plan.md, /ponytail-review, mở PR (không merge).
```

### PR-LM
```
/ponytail lite

Làm PR-LM trong docs/superpowers/plans/2026-10-03-pr-phien-lich-mt-dieu-huong-sua-lop.md (Task LM-1 → LM-7). Nhánh mới từ main: pr-lm-lich-mt-linh-hoat.
Skill: superpowers:subagent-driven-development (từng Task) · test-driven-development mỗi Task · systematic-debugging khi lỗi · brainstorming nếu cần chủ sản phẩm quyết · verification-before-completion trước khi báo xong · requesting-code-review + finishing-a-development-branch trước khi mở PR.
Đọc trước: CLAUDE.md, mục A, B (Q-0310-1..5, D1–D6), "Global Constraints", "PR-LM" và mục C (rủi ro tuần NULL); thiet-ke/HE_GIAO_DIEN.md.
- LM-1 máy chủ trước, có phép kiểm đỏ; phép cũ về "vượt qua lượt kế tiếp" chỉ sửa đúng chỗ hành vi đổi theo Q-0310-1.
- LM-2..LM-7 giao diện: /impeccable layout (LM-2, LM-3, LM-5, LM-7), /impeccable clarify (chữ cảnh báo đỏ, hộp xác nhận, LM-4, LM-6), /impeccable harden (popover lịch LM-3, LM-7).
- LM-6: chữ "Thi bù tuần này (lần N)" (ODiemLon.tsx:57-60), chữ mẫu nhận xét "Ví dụ: …" (NhanXet.tsx:109).
- LM-7: làm SAU LM-4; MockDetailPage + HopThaoTacMt đổi Modal → KhungPanel, chỉ đổi khung, chân theo luật S3.
- grep mọi chỗ đọc planned_period_id, kiểm với lượt bỏ tuần, ghi danh sách vào mô tả PR.
Kiểm: npm run check; npm run seed && npm run dev; ảnh 1440/375 sáng/tối: panel Lộ trình (4 trạng thái hàng MT, dải nhập điểm mở), hồ sơ MT (hộp Dời cả đợt có cảnh báo), Kế hoạch Test (HopKyNang + popover lịch + hộp xác nhận huỷ lịch), hồ sơ MT (ô thi bù, các panel thao tác KhungPanel).
/impeccable audit các màn đã sửa → /ponytail-review. Xong: [x], dòng mục 11 plan.md, mở PR, liệt kê ponytail:, báo ảnh sổ tay lệch.
```

### PR-DH
```
/ponytail lite

Làm PR-DH trong docs/superpowers/plans/2026-10-03-pr-phien-lich-mt-dieu-huong-sua-lop.md (Task DH-1 → DH-5). Nhánh mới từ main SAU khi PR-LM đã merge: pr-dh-bang-dieu-huong.
Skill: superpowers:subagent-driven-development (từng Task) · test-driven-development mỗi Task · systematic-debugging khi lỗi · brainstorming nếu cần chủ sản phẩm quyết · verification-before-completion trước khi báo xong · requesting-code-review + finishing-a-development-branch trước khi mở PR.
Đọc trước: CLAUDE.md, mục A, B (Q-0310-4, D5), "Global Constraints", "PR-DH".
- DH-1/DH-3 hàm thuần chuSapToi, keBen có phép kiểm đỏ trước.
- DH-2, DH-4: /impeccable layout. DH-5: /impeccable critique chỉ vùng đầu trang Học viên & Lớp, rồi /impeccable layout.
Kiểm: npm run check; ảnh 1440/375 sáng/tối Học viên & Lớp (cột mới, Sắp tới 3 dạng), hồ sơ HV và hồ sơ lớp (thanh Trước/Sau); bấm thử Trước/Sau với bộ lọc "Cần làm" và với link mở thẳng.
/impeccable audit → /ponytail-review. Xong: [x], dòng mục 11 plan.md, mở PR, liệt kê ponytail:, báo ảnh sổ tay lệch.
```

### PR-SL
```
/ponytail lite

Làm PR-SL trong docs/superpowers/plans/2026-10-03-pr-phien-lich-mt-dieu-huong-sua-lop.md (Task SL-1 → SL-2). Nhánh mới từ main: pr-sl-sua-ca-lop.
Skill: superpowers:subagent-driven-development (từng Task) · test-driven-development mỗi Task · systematic-debugging khi lỗi · brainstorming nếu cần chủ sản phẩm quyết · verification-before-completion trước khi báo xong · requesting-code-review + finishing-a-development-branch trước khi mở PR.
Đọc trước: CLAUDE.md, mục B (Q-0310-3), "Global Constraints", "PR-SL"; IntakePanel.tsx làm mẫu.
- SL-1 máy chủ: phép kiểm đỏ trước; gọi lại updateStudent / updateCycle / setBaseline / reviseTarget, không viết lại luật; một giao dịch.
- SL-2: /impeccable layout + /impeccable harden; không có ô dán Excel; luật S3 cho nút chân panel.
Kiểm: npm run check; ảnh 1440/375 sáng/tối panel (chưa sửa / có lỗi / có Target đổi); bấm thử bằng tài khoản Quản lý và GVCN.
/impeccable audit → /ponytail-review. Xong: [x], dòng mục 11 plan.md, cập nhật CODE_MAP.md, mở PR, liệt kê ponytail:.
```

---

# PR-DH — Bổ sung 04/10 (DH-6 → DH-13)

Viết 04/10 trên main `67cb5db` (PR-LM #182–#188 và PR-NT đã merge; PHH, SO chưa — **merge PR-DH sau PHH và SO**, merge `origin/main` vào nhánh trước khi mở PR). Cùng nhánh `pr-dh-bang-dieu-huong`, cùng `prDh.tests.ts` (tạo ở DH-1, gọi ở cuối `run.ts`), cùng skill và luật "Global Constraints" ở đầu file. Mọi `Interfaces` ở đây là hợp đồng giữa các Task.

**Thứ tự làm cả PR:** DH-1 → DH-2 (bản sửa dưới đây) → DH-6 → DH-9 (cùng chạm `BangHocVienLop`/`khoaLopThuong`) → DH-3 → DH-4 → DH-5 → DH-7 → DH-8 → DH-11 → DH-12 → DH-10 (chờ chủ sản phẩm) → DH-13.

## Sửa bản đồ code của DH-1 → DH-5 (đã kiểm 04/10; số dòng cũ lệch sau PR-LM/PR-NT)

| Chỗ | Số dòng cũ | Số dòng đúng |
|---|---|---|
| `StudentsPage.tsx` đầu trang (tiêu đề, ô tìm, Phạm vi/Chi nhánh/Xếp, `CongTacKhung`, chip) | `:138-208` | `:145-212` (chip `:194-211`) |
| `StudentsPage.tsx` tiêu đề cột / `CotBangLop` / `HopLop` | `:299-306` / `:312-392` | `tieuDeCot :130`, khối tiêu đề `:247-252`, `CotBangLop :279-287`, `HopLop :293-386` |
| `BangHocVienLop.tsx` "Sắp tới" | `:147-148,169-171` | bảng `:147-148,169-171` (đúng), thẻ điện thoại `:103-104,123` |
| `BangHocVienLop.tsx` ô Target/Khoá | — | bảng `:161-168`, thẻ `:120-122` |
| `StudentDetailPage.tsx` Quay lại | `:183` | `:183` (đúng, `navigate(-1)`) |
| `ClassRoster.tsx` link tên (cho DH-3) | `:121,207` | `:121` (thẻ), `:207` (bảng) — đúng |
| `DauTrangLop.tsx` | chưa có Quay lại | `<header className="card …">` `:136`; `ClassOverviewPage.tsx:86` gọi nó |
| Link "Hồ sơ lớp" ở `HopLop` (cho DH-4) | — | tên lớp `<Link>` `:368`, menu "Hồ sơ lớp" `:320` |

`standing.ts` (DH-1 Step 4): chưa kiểm — grep `nextAttemptLabel` trước khi sửa, đừng tin số dòng.

## DH-2 sửa (quyết định 04/10: cột Dự kiến thi áp cả lớp thường)

Thay các dòng "nhóm lớp thường không có cột này" và độ rộng của DH-2 Step 3 bằng:
- Cả hai nhóm có **8 cột**: Học viên · Kết quả gần nhất · Target (FT) / Khoá (thường) · **Dự kiến thi** · Sắp tới · Case · Việc tiếp theo · ⋯. `tieuDeCot(k)` (`:130`) trả cùng bộ cho hai nhóm, chỉ đổi cột 3.
- `CotBangLop` (`:279-287`): Học viên 19 · Kết quả 20 · Target/Khoá 10 · Dự kiến thi 11 · Sắp tới 15 · Case 5 · Việc tiếp theo 18 (= 98%) · ⋯ `w-12`; `min-w-[860px]` → `min-w-[960px]` ở **hai** chỗ (`:248`, `:254`). Cột Case đổi từ chỉ số 4 sang **5** (`text-right`, `:250`).
- `HopLop` hàng lớp phải khớp 8 cột: `HangNhom soCotDau={3}` giữ, `<td colSpan={3}>` badge (`:378`) → `colSpan={4}`; `BangHocVienLop soCot={7}` (`:383`) → `8`; thẻ điện thoại `soCot={1}` giữ.
- Ô: `ExamPlanText plan={s.examPlan}` (`DongRoster` thêm `examPlan: ExamPlan`; roster FT và thường **đều đã trả** `examPlan`, `classes.ts:~609`). Thẻ điện thoại: thêm `{ nhan: 'Dự kiến thi', noiDung: <ExamPlanText …/> }` sau dòng Target/Khoá.
- Phép đỏ (quét nguồn, thay phép cũ): `StudentsPage.tsx` có `'Dự kiến thi'` trong `tieuDeCot` và **không** phân nhánh theo `k` cho cột đó; `BangHocVienLop.tsx` có `ExamPlanText` ở cả nhánh bảng lẫn nhánh `the`.

### Task DH-6: Cột Target + Dự kiến thi ở bảng điểm lớp thường (hồ sơ lớp)
Skill: test-driven-development · impeccable layout

**Files:** Modify `web/src/modules/classes/BangDiemLopThuong.tsx` (type `DongThuong :20-29`, bảng `:110-173`, thẻ `:67-108`). Test: `prDh.tests.ts`.

**Interfaces:**
- Consumes: roster lớp thường đã trả `cycle: { target, khongCamKet, … } | null` và `examPlan` (PR-NT, `classes.ts:~600-612`) — **không đổi máy chủ**. `TargetText`, `ExamPlanText` (`web/src/ui/ui.tsx:443,462`).
- Produces: `DongThuong` thêm `cycle: { target: number | null; khongCamKet?: boolean } | null; examPlan: ExamPlan`.

- [x] **Step 1: Phép đỏ.**
  - Quét nguồn: `BangDiemLopThuong.tsx` chứa `TargetText`, `ExamPlanText`, và hai tiêu đề `Target`, `Dự kiến thi` ở cả bảng lẫn thẻ điện thoại (`nhan: 'Target'`, `nhan: 'Dự kiến thi'`).
  - Máy chủ (bảo vệ, có thể đã xanh): roster của một lớp thường (dựng em có Target 5.5 và dự kiến thi tháng, theo mẫu `prNt.tests.ts` — đọc đầu file lấy cách dựng và gọi) trả `cycle.target === 5.5` và `examPlan.confidence === 'month'`; em không có chu kỳ → `cycle === null`, `examPlan.confidence === 'none'`, không lỗi.
- [x] **Step 2: Đỏ** → **Step 3: Sửa:**
  - Bảng: hai `<th rowSpan={2}>` mới sau "Học viên": `Target` (căn phải, `title` như `ClassRoster.tsx:177`) và `Dự kiến thi` (`title` như `ClassRoster.tsx:178`); ô `<TargetText band={s.cycle?.target} kck={s.cycle?.khongCamKet} />` và `<ExamPlanText plan={s.examPlan} />`, cùng class ô với `ClassRoster.tsx:219-220`.
  - `colgroup` (`:113-117`): Học viên `24%` → `19%`, thêm `w-[6%]` (Target) và `w-[9%]` (Dự kiến thi); `min-w` `840/960` → `920/1040`. Lớp thường **chỉ theo dõi** Target (04/10): không so với điểm, không tô đạt/chưa đạt.
  - Thẻ điện thoại: hai dòng `Target`, `Dự kiến thi` đứng **đầu** `dong` (trước các mốc), cùng thứ tự với `ClassRoster.tsx:131-132`.
  - Tên cột giữ "Target" (xem DH-10).
- [x] **Step 4:** `npm run check` + ảnh bảng điểm lớp FOU/BE ở 1440/375: không cột nào xuống dòng xấu, cột Học viên không cắt tên quá sớm → **Step 5:** commit `"PR-DH (6): bảng điểm lớp thường có cột Target + Dự kiến thi"`.

### Task DH-7: Popover "Thiếu n" không bị hàng dưới che (mục L1 của `2026-10-03-pr-l1-popover-bao-cao-loc-gv.md`)
Skill: test-driven-development · impeccable harden

**Files:** Modify `web/src/modules/students/MissingBadge.tsx:37-54` (một chỗ đủ cho 4 nơi dùng: `BangHocVienLop`, `ClassRoster`, `BangDiemLopThuong`, `StudentDetailPage`). Test: `prDh.tests.ts`.

**Interfaces:** props của `MissingBadge` **không đổi** (`items`, `className`, `gon`).

- [x] **Step 1: Xác nhận nguyên nhân (không sửa trước khi thấy):** `npm run seed && npm run dev`, Playwright 1440: Học viên & Lớp → mở lớp có ≥ 3 em thiếu thông tin → bấm badge "Thiếu n" ở hàng 2. Ghi `document.elementFromPoint(giữa popover)`: nếu trả về ô của hàng 3 thì đúng như L1 (popover `absolute z-20` kẹt trong ngữ cảnh xếp chồng của hàng). Nếu không tái hiện được → dừng, ghi vào mô tả PR, không sửa.
- [x] **Step 2: Phép đỏ (quét nguồn):** `MissingBadge.tsx` có `createPortal`, `fixed`, `Escape`, `getBoundingClientRect`, `aria-expanded`; **không** còn `absolute z-20`; `title` của nút là `open ? undefined : …` (hết tooltip hệ thống đè popover).
- [x] **Step 3: Sửa** theo mẫu `MenuDong.tsx:35-73,88-108` (portal → `document.body`, `fixed`, `z-[60]`): vị trí `useLayoutEffect` từ `getBoundingClientRect()` của nút; `left = clamp(r.left, 8, innerWidth - 240 - 8)` (rộng `15rem`); đủ chỗ thì mở xuống, không thì lật lên; đóng khi `mousedown` ngoài, `Escape` (pha bắt, trả focus về nút), `scroll` (bắt), `resize`. Sự kiện React **vẫn nổi lên cha qua portal** → giữ `stopPropagation`/`preventDefault` ở popover và nút (hàng bảng/thẻ có `onClick` riêng). Viết trong `MissingBadge`, không tách hook (`ponytail:` tách khi có chỗ thứ ba cần).
- [x] **Step 4: Bấm thử (Playwright, 1440 + 375):** badge ở hàng đầu, giữa, cuối bảng; ở bảng cuộn ngang (640–1023 px); ở thẻ điện thoại; ở hồ sơ HV. Mỗi ca: `elementFromPoint` ở 4 góc popover trả về phần tử trong popover; popover không tràn mép phải ở 375; không che nút ⋯ của hàng chứa nó; Esc đóng và focus về nút. Ảnh 1440/375.
- [x] **Step 5:** `npm run check` → commit `"PR-DH (7): popover Thiếu n vẽ bằng portal, không bị hàng dưới che"`.

### Task DH-8: Chip "+n" ở dòng lớp bấm mở được (H6)
Skill: test-driven-development

**Files:** `web/src/modules/students/StudentsPage.tsx:327-331` (`menuBadgeAn`), `DauTrangLop.tsx:175-178`. Test: `prDh.tests.ts`.

Đã kiểm 04/10: `+n` **đã** là `MenuDong bieuTuong="+n"` (PR-HVL B4) — nút thật, không phụ thuộc rê chuột; mỗi mục đi `denBadge(x) ?? /hoc-vien/lop/:id`. Nên H6 có thể đã xong; việc là **kiểm rồi đóng**, không viết lại.

- [x] **Step 1: Bấm thử (Playwright 1440 + 375, tài khoản Quản lý):** lớp có ≥ 3 badge (`+1` hoặc `+2` hiện) — (a) nút `+n` thấy ngay, không cần rê chuột; (b) bấm ở hàng lớp **đang đóng** và **đang mở** → menu mở, hàng lớp không gập/mở theo; (c) chọn từng mục đi đúng đích (`cho-duyet` → `/cong-viec/cho-duyet?lop=`, `qua-han` → `/hoc-vien?view=qua-han&classId=`, `cham` → Lịch Test, mục không có đích → Hồ sơ lớp); (d) ở 375 vùng bấm ≥ 40 px (`after:-inset-2` của `MenuDong`).
- [x] **Step 2:** cả bốn ca đạt → **không đổi mã**: thêm một phép quét nguồn giữ nguyên hành vi (`StudentsPage.tsx` chứa `bieuTuong={\`+${b.an.length}\`}` và `onChon` điều hướng), tick `[x]` H6 ở `2026-10-02-ux-sau-critique.md:74` kèm "đã có từ PR-HVL B4, kiểm 04/10". Ca nào hỏng → sửa đúng chỗ hỏng, phép kiểm đỏ trước.
- [x] **Step 3 (chỉ ghi, không sửa):** ở `DauTrangLop.tsx:177` mục `+n` **không có đích** (`thieu-gv`, `chang`, `thieu-tt`) gọi `() => undefined` — chọn mục không làm gì. Ghi vào mô tả PR để chủ sản phẩm quyết đích; ngoài phạm vi H6.
- [x] **Step 4:** commit `"PR-DH (8): H6 — kiểm +n bấm được, thêm phép giữ hành vi"`.

### Task DH-9: Badge "n HV chưa có quyết định chuyển lớp" khớp số dòng có cờ (D1)
Skill: test-driven-development (hàm thuần `khoaLopThuong`)

**Files:** Modify `shared/domain/hocVienLop.ts:179-193` (`khoaLopThuong`), `web/src/modules/students/BangHocVienLop.tsx:161-168` (ô Khoá có `title`). Test: `prDh.tests.ts`.

**Nguyên nhân (đã đọc code 04/10):** badge đếm `emChuaCoLenh` (`classes.ts:99,126`; `hocVienLop.ts:224-231`) và cờ dòng `chuaLoTrinh` cũng từ đúng hàm đó (`classes.ts:421,670`) — hai số bằng nhau từ máy chủ. Lệch nằm ở **hiển thị**: `khoaLopThuong` chọn **một** dòng phụ theo thứ tự `tiếp theo đã ghi › chờ duyệt đề xuất › nhắc chưa ghi › kết thúc khoá` (`:186-191`), nên em chưa có quyết định **nhưng đã ghi "tiếp theo: …"** hiện "tiếp theo: …" và **không** hiện cờ → badge `3` nhưng chỉ 2 dòng có chữ "chưa có quyết định chuyển lớp". (Chữ hiện hành là `CHU_CHUYEN_LOP.chua`; không đổi chữ.)

**Interfaces:** `khoaLopThuong(i)` giữ chữ ký; `phu` của em có `nhacLoTrinh: true` **luôn chứa** `CHU_CHUYEN_LOP.chua.toLowerCase()`.

- [x] **Step 1: Phép đỏ (thuần)** — `prDh.tests.ts`:

```ts
  check('PR-DH (9) · khoaLopThuong: em chưa có quyết định chuyển lớp luôn có chữ cờ, kể cả khi đã ghi lộ trình tiếp theo', () => {
    const g = { maChuongTrinh: 'FOU', tuanHienTai: 10, tongTuan: 10, tuanKetThuc: '2026-10-12', homNay: '2026-10-04' };
    const co = d.CHU_CHUYEN_LOP.chua.toLowerCase();   // chưa re-export qua index thì import từ shared/domain/chuyenLop.ts
    const phu = (o: object) => d.khoaLopThuong({ ...g, tiepTheo: null, ...o }).phu ?? '';
    assert(phu({ nhacLoTrinh: true }).includes(co), 'chưa ghi lộ trình');
    assert(phu({ tiepTheo: 'BE', nhacLoTrinh: true }).includes(co), 'đã ghi lộ trình, chưa có quyết định');
    assert(/tiếp theo: BE/.test(phu({ tiepTheo: 'BE', nhacLoTrinh: true })), 'vẫn giữ lộ trình đã ghi');
    assert(!phu({ tiepTheo: 'BE', nhacLoTrinh: false }).includes(co), 'em đã có quyết định: không cờ');
    assert(phu({ choDuyetChuyen: true, nhacLoTrinh: false }).includes('chờ QL duyệt'), 'đề xuất đang chờ duyệt');
  });
```
- [x] **Step 2: Đỏ** (phép 2 FAIL) → **Step 3: Sửa** `khoaLopThuong`: `phu` = nếu `tiepTheo` thì `"tiếp theo: {x}"` nối ` · ` với chữ cờ khi `nhacLoTrinh`; còn lại giữ thứ tự cũ. Ô Khoá của `BangHocVienLop` (bảng `:165`, thẻ `:121`) thêm `title={khoa.phu}` (dòng phụ dài bị `truncate`).
- [x] **Step 4:** `npm run check` — các phép cũ về chữ cột Khoá (`hocVienLop.tests.ts`, `lenLop.tests.ts`) chỉ sửa đúng chỗ chữ đổi theo bước này, ghi `// PR-DH 04/10: D1`.
- [x] **Step 5: Bấm thử:** lớp thường ở Cuối khoá (seed `lenLop`): số trên badge = số dòng em có chữ cờ ở cột Khoá. Commit `"PR-DH (9): D1 — dòng em hiện cờ chưa có quyết định chuyển lớp khớp số badge"`.

### Task DH-10: J6 — cột "Target" → "Mục tiêu"? **KHÔNG ĐỔI, chờ chủ sản phẩm**
Skill: brainstorming (chỉ để ghi quyết định, không tự chọn)

Đã kiểm `thiet-ke/` 04/10 — các nguồn **mâu thuẫn**:
- `THUAT_NGU_2026-10-01.md:24` (chủ sản phẩm 01/10, **bản mới nhất**): "Mục tiêu band → Đổi hết thành **Target**"; B-026 `Target`, B-027/E-038 `Mục tiêu` là "trùng nghĩa" cần thống nhất.
- `THUAT_NGU_DA_CHOT.md` (22/09, đã bị 01/10 thay): g13-002 `Target` "Sửa thành" **trống = giữ**; g5-003 `Mục tiêu` (mockup mới) cũng trống.
- `TU_DIEN_VA_CHU.md:474`: "FT `Mục tiêu` · lớp thường `Khoá`".
- J6 (critique 02/10): đổi thành "Mục tiêu".

Theo `CLAUDE.md` (quyết định chủ sản phẩm mới nhất đứng trước; mâu thuẫn thì ghi, không tự làm): **giữ "Target"** ở mọi cột DH-2/DH-6; không viết phép kiểm đổi chữ.
- [x] **Step 1:** ghi vào mô tả PR một câu hỏi: "Cột Target ở Học viên & Lớp: giữ 'Target' (chốt 01/10) hay đổi 'Mục tiêu' (J6, TU_DIEN)? Nếu đổi, đổi cả Hồ sơ lớp, Thêm HV, Kế hoạch Test (`· Target {điểm}`)." Đánh `[~]` J6 ở `2026-10-02-ux-sau-critique.md:110`.
- [ ] **Step 2 (chờ chủ sản phẩm):** chủ sản phẩm trả lời "đổi" → `grep -rn "Target" web/src` các **tiêu đề cột và nhãn hiển thị** (không đụng tên biến, không đụng "Mục tiêu tại thời điểm đánh giá"), một commit riêng `"PR-DH (10): J6 Target → Mục tiêu"`, impeccable `clarify` chốt chữ.

### Task DH-11: J8 — chữ bị cắt mất nghĩa
Skill: test-driven-development · impeccable clarify

**Files:** `web/src/ui/ViecTiep.tsx:19-26` + các chỗ tìm được ở Step 1. Test: `prDh.tests.ts`.

- [x] **Step 1: Dò (Playwright, 1440 + 375, seed, Quản lý):** ở Học viên & Lớp (mở 2 lớp FT + 1 lớp thường), Hồ sơ lớp (3 tab, FT và thường), Hồ sơ HV: liệt kê phần tử có `scrollWidth > clientWidth + 1` và (`text-overflow: ellipsis` hoặc `overflow: hidden` + `white-space: nowrap`) kèm chữ và selector. Dán danh sách vào mô tả PR. Ba chỗ chủ sản phẩm thấy: "Ghi kết q…" (cột Theo dõi hồ sơ lớp) = `ViecTiep.tsx:19-26`; "L, R, W1, W…" và "Cao Khánh Linh, Lê …" chưa rõ chỗ — ứng viên: `DauTrangLop.tsx:203` (dòng GV bộ môn `overflow-hidden whitespace-nowrap`), `ClassCreatePanel.tsx:284` (`dạy được L, R, W1, W2` trong `<option>`), danh sách tên nối dấu phẩy. Chỗ nào dò ra mới sửa.
- [x] **Step 2: Phép đỏ (quét nguồn):** `ViecTiep.tsx` chữ việc dùng `line-clamp-2` (không còn `min-w-0 truncate` ở span chữ việc) và vẫn có `title={v.title}`; mỗi chỗ khác dò ra: phép quét tương tự trên file đó.
- [x] **Step 3: Sửa (impeccable `clarify`):** chữ **mang nghĩa** (câu việc, tên người, mã kỹ năng) → xuống dòng tối đa 2 dòng (`line-clamp-2 break-words`) hoặc rút gọn có chủ đích "+k" như `DongGiaoVienBoMon`, **luôn kèm `title` đủ chữ**; chữ phụ (mã tuần, ngày, hạn) không bao giờ cắt (`shrink-0 whitespace-nowrap`, như `ViecTiep` đang làm với "quá hạn n ngày"). Không đụng chỗ cắt có chủ đích của PR-S4F #11 nếu nghĩa không mất. `ViecTiep` dùng chung (Học viên & Lớp, hồ sơ lớp, Cần hỗ trợ): chụp cả ba nơi sau khi sửa.
- [x] **Step 4:** `npm run check` + ảnh trước/sau 1440/375 → commit `"PR-DH (11): J8 chữ có nghĩa không bị cắt, kèm title"`.

### Task DH-12: J10 — hồ sơ HV bỏ ý "chưa có dữ liệu" nói hai lần
Skill: test-driven-development · impeccable clarify

**Files:** `web/src/modules/cases/SkillBoard.tsx:595-607` (`ScoreCell`) và `:699-707` (`Trend`), `web/src/modules/cases/TheKyNang.tsx:42` (`TheGon`), rà `web/src/modules/students/DauHoSo.tsx:220`. Test: `prDh.tests.ts`.

Phần "Quyền cấp riêng ở Quản trị" của J10 đã xong ở PR-BC. Còn lại: bảng kỹ năng hồ sơ HV — hàng chưa có điểm: ô điểm hiện chip "—" kèm "chưa có dữ liệu" ngay cạnh cột xu hướng ghi "chưa có điểm" (`SkillBoard.tsx:705`) → một ý hai lần; thẻ điện thoại `TheGon` hiện "chưa có điểm" rồi "—".

- [x] **Step 1: Phép đỏ (quét nguồn):** `SkillBoard.tsx` không còn chuỗi JSX `mt-0.5">chưa có dữ liệu` trong `ScoreCell` (comment ở `:583` không tính — dùng regex trên JSX); `TheKyNang.tsx` `TheGon` không dựng đồng thời `'—'` và `'chưa có điểm'` (`diem` rỗng khi `band === null`).
- [x] **Step 2: Sửa (impeccable `clarify`):** `ScoreCell`: `band === null` → chỉ chip "—" với `title="Chưa có điểm"` (cột Trend giữ chữ "chưa có điểm" **một lần**); `TheGon`: `band === null` → chỉ chữ "chưa có điểm", không "—". `DauHoSo.tsx:220`: chỉ sửa nếu ô "Kết quả gần nhất" hiện đồng thời "—" và "chưa có điểm nào"; không thì giữ.
- [x] **Step 3:** `npm run check`; ảnh hồ sơ HV chưa có điểm (bảng 1440, thẻ 375) → commit `"PR-DH (12): J10 hồ sơ HV không nói chưa có điểm hai lần"`.

### Task DH-13: Kiểm thật panel Chuyển lớp vs demo bar · 375 px · Trước/Sau · audit cuối
Skill: verification-before-completion · impeccable adapt, audit

- [x] **Step 1: Panel Chuyển lớp có đè demo bar không?** Đã đọc: `DemoBar` nằm **trong luồng** (`App.tsx:129`, không fixed/sticky); `KhungPanel` là `fixed inset-0 z-50` (`KhungPanel.tsx:19,67`) nên phủ **lên** cả demo bar và header — chủ ý như mọi panel. Kiểm hai ca thật bằng Playwright, 1440 và 375×667, kịch bản demo bật (không `banChinh`): (a) `ChuyenLopPanel` (hồ sơ HV ⋮ Chuyển lớp, `KhungPanel` hẹp); (b) `TransitionPanel` (hồ sơ lớp ⋮ Chuyển tiếp lớp…, `rong="toan"`, `longTrong`). Mỗi ca ghi: `panel.getBoundingClientRect().top === 0`; `elementFromPoint` ở giữa mép trên panel và giữa nút ✕ trả về phần tử trong panel; nút chính ở chân panel nằm trong viewport và không bị thanh dưới điện thoại (`z-30`) che; Esc đóng. **Có lỗi thật → sửa đúng chỗ lệch (phép đỏ trước); không có → ghi "đã kiểm, không có" vào mô tả PR, không sửa gì.**
- [x] **Step 2: Trước/Sau (DH-3/DH-4) bấm thử đủ ba ca:** (a) bộ lọc "Cần làm" → mở em thứ 2 → Sau đi đúng em thứ 3 **của danh sách đã lọc**; (b) tải lại trang giữa chừng → thanh vẫn còn (`sessionStorage`); (c) dán link `/hoc-vien/:id` vào tab mới → thanh theo lớp của em, A→Z, "Quay lại" về `/hoc-vien` khi không có lịch sử; (d) em đầu danh sách: nút Trước khoá; em cuối: Sau khoá.
- [x] **Step 3: 375 px — `/impeccable adapt`** chỉ cho phần DH thêm: cột/thẻ Dự kiến thi, `ThanhTruocSau`, thẻ bảng điểm lớp thường (Target, Dự kiến thi), popover Thiếu n. Tiêu chí: `document.documentElement.scrollWidth <= innerWidth`; không phần tử bấm được nào cao dưới 40 px (bỏ qua demo bar).
- [x] **Step 4: `/impeccable audit`** Học viên & Lớp, hồ sơ HV, hồ sơ lớp (FT + thường), popover Thiếu n — ảnh 1440/375 sáng/tối. Vấn đề ngoài phạm vi PR → ghi mô tả PR, không sửa.
- [x] **Step 5:** `npm run check` xanh → `/ponytail-review` → liệt kê mọi chú thích `ponytail:` trong mô tả PR → đánh `[x]` DH-1→13 ở file này → thêm một dòng mục 11 `plan.md` → ảnh sổ tay lệch (Học viên & Lớp, hồ sơ lớp, hồ sơ HV) → mở PR (không tự merge).

## Review Focus (bổ sung)
- Danh sách Trước/Sau rỗng, một phần tử, hoặc `id` không có trong danh sách đã lưu → `keBen` trả `null`, thanh rơi về `dsDuPhong`, không lỗi (DH-3, phép `keBen` đã có).
- Popover "Thiếu n" ở hàng cuối bảng / sát mép phải 375 px → lật lên, không tràn (DH-7 Step 4).
- Em lớp thường không có chu kỳ hoặc Target KCK ở cột mới → "—"/"KCK", không "NaN"/"0.0" (DH-6 Step 1, phép máy chủ `cycle === null`).
- Em ở Cuối khoá đã ghi lộ trình tiếp theo nhưng chưa có quyết định chuyển lớp → vẫn có cờ, số badge = số dòng (DH-9).
- Bảng 8 cột ở 960 px: lớp thường có dòng phụ Khoá dài ("tiếp theo: … · chưa có quyết định chuyển lớp") → cắt có `title`, không đẩy cột khác (DH-2 sửa + DH-9 Step 3).
