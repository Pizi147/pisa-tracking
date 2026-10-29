# DỌN MÁY 29/10 — báo cáo giai đoạn 1 (chỉ đo, chưa xoá gì)

**Trước dọn:** ổ C trống 29,5 GB (dùng 153,7) · ổ D trống 53,4 GB (dùng 240,2) · RAM trống 0,9 / 15,7 GB.

## RAM (tiến trình ăn nhiều)
| PID | MB | Việc | Kết luận |
|---|---|---|---|
| 31064 | 3410 | `node dist-server/.../tests/run.js` (check đang chạy, cùng lúc `tsc` ở worktree ke-hoach-test-23b141) | GIỮ — session ke-hoach-test đang check; xong tự nhả |
| 38952 | 836 | `tsc -p tsconfig.web.json` trong ke-hoach-test-23b141 | GIỮ |
| 12156… | ~3000 (8 tiến trình `claude`) | các session Claude | GIỮ |
| 5964 | 563 | MsMpEng (Defender) | CHỦ SP QUYẾT (có thể loại trừ thư mục worktree khỏi quét realtime → nhẹ hơn) |
Không thấy vite / sqld mồ côi.

## XOÁ AN TOÀN (tạo lại được) — ước ~22 GB
| Mục | Dung lượng | Ghi chú |
|---|---|---|
| 15 worktree trong `Temp/claude/D--Github-Pisa-tracking/b6b91552…/scratchpad/` (en2gop, p13, p600, p601, p606, p618, p619, p623, p626, p627, p629, p630, p632, p635, p8) — sạch, nhánh đã vào main / HEAD đã trong main | ~9,9 GB | session cũ (26/10); `git worktree remove` rồi prune. Bỏ cả thư mục khi xong (còn br, m5… ~40 MB) |
| Worktree `.claude/worktrees` sạch, nhánh đã merge, không session: hsl-ft 686 · hv-loc-giu-cu 709 · mau-web-2 694 · mockup-m2 565 · pilot-case 681 · plan-bo-dan-excel-2 565 · plan-p8-quyen 565 · plan-sang-2710 576 · sau-d7-nho 676 · sau-r1-may-chu 810 · sua-nho-ui 687 | ~7,2 GB | PR #638 #664 #645 #589 #632 #598 #596 #610 #642 #633 #635 đều MERGED |
| Thư mục rỗng `.claude/worktrees/ban-giao-toi`, `luat-hinh-anh` | 0 | không phải worktree, rỗng |
| `Temp/deploy-*` (892 thư mục, cũ nhất 10/10) | ~3,7 GB | tạm của netlify deploy; chỉ xoá cái không bị khoá |
| `Temp/z2-lenh-bk-*`, `node-compile-cache`, mục Temp > 2 ngày không khoá (6508 mục) | ~0,3 GB+ | giữ `pisa-slot` |
| `npm cache clean --force` (npm-cache 1,2 GB: _cacache 913 + _npx 284) | ~1,2 GB | tải lại khi cần |
| `.cache/chrome-devtools-mcp` | 98 MB | |
| Thư mục build trong repo khác ở `D:/Github` | — | chỉ có `Pisa-vocab` 41 MB, không đáng; bỏ qua |

## CÓ ĐIỀU KIỆN (nhánh đã merge, chỉ `M .claude/launch.json` chưa commit — chỉnh cổng cục bộ) ~2,3 GB
jovial-clarke-de2947 (847, PR #669) · loc-hien-tai-95bb81 (698, #665) · panel-6c-d34757 (706, #661). Xoá được nếu PTA Plan xác nhận launch.json đó vô giá trị (tôi sẽ KHÔNG xoá nếu không có chữ "xác nhận").

## GIỮ
- Thư mục chính + node_modules (159 MB), `.git` (1 GB), `pisa-slot`, `D:\pisa-mig` (kiem.sqlite, mig.sqlite — 19 MB, cần deploy), `H:\My Drive\PISA TRACKING\back-up` (còn nguyên, không đụng).
- Worktree session đang chạy: hsl-lt-5f54ac (gon-ma) · hv-lop-gon-0bacf9 (ra-luong) · ra-ui-6da7f6 (ra-ui) · pta-dot1 (PTA) · ke-hoach-test-23b141 (PR #673 mở) · mockup-m6-e3379b (PR #672 mở) · hoan-tac-xn-06228d (PR #674 mở).
- `.claude/projects` 2,4 GB, plugins, bộ nhớ; Claude-Data 10,5 GB (vm_bundles 8,3 GB của ứng dụng); `Temp/claude/*` thư mục tạm của session hiện có.
- ms-playwright (chỉ 1 bản 1248 — đang dùng), Programs, GitHubDesktop.

## CHỦ SP QUYẾT
| Mục | Dung lượng | Vì sao |
|---|---|---|
| `scratchpad/p624` (nhánh claude/compassionate-gauss-t9gw8k-pta, 2 commit chưa vào main, không PR) | 665 MB | có thể mất việc chưa đưa vào |
| `scratchpad/r1gop` (HEAD rời, 1 commit chưa vào main) | 634 MB | như trên |
| `worktrees/pta-dot4` (nhánh `pta-dot4`, 35 commit chưa vào main, không upstream) | 712 MB | có thể là việc của PTA |
| `worktrees/claude-6c-nho` (merged #640, nhưng có `.anh6c/` ảnh chưa theo dõi) | 687 MB | ảnh có thể còn cần |
| Opera (Roaming 3,5 GB + Local 2 GB) · NVIDIA 5,2 GB · Steam 0,7 · Zoom 0,9 · ZaloData 0,8 · Discord | ~14 GB | ứng dụng / dữ liệu cá nhân, tôi không đụng |
| `git gc --aggressive` trên `.git` (1 GB) | ~vài trăm MB | chưa đo lợi |
| `Temp/claude/bash-edit-diff` 81 MB, thư mục session cũ trong `Temp/claude/*` | ~0,3 GB | nhỏ, có thể thuộc session còn dùng |

**Chờ PTA Plan** nhắn "BẮT ĐẦU DỌN" (kèm xác nhận launch.json nếu muốn dọn 3 worktree có điều kiện).

## KẾT QUẢ GIAI ĐOẠN 2 (29/10)
Trống: ổ D 53,4 → 64,9 GB · ổ C 29,5 → 40,9 GB · RAM trống 0,9 → 5,7 GB.
Đã xoá: 18 worktree .claude/worktrees (11 đã merge + 3 launch.json + ke-hoach-test, hoan-tac-xn, mockup-m6, pta-dot4) và 17 worktree scratchpad (p624, r1gop đã kiểm nội dung có trong main); thư mục rỗng pta-dot2 / ban-giao-toi / luat-hinh-anh; 2 tệp pta-dotN-check.log; 25 nhánh cục bộ (`git branch -d`); npm cache; cache chrome-devtools-mcp; Temp/deploy-* và z2-lenh-bk cũ (còn 225 deploy-* mới / bị khoá).
Giữ lại: nhánh `pta-dot4` và `claude/compassionate-gauss-t9gw8k-pta` (chưa merge, -d từ chối); worktree gon-ma, ra-luong, ra-ui, pta-dot1, claude-6c-nho (có .anh6c).
Còn chờ chủ SP quyết: claude-6c-nho (687 MB), Opera/NVIDIA/Steam/Zoom/Zalo/Discord (~14 GB), Defender quét worktree, 2 nhánh chưa merge, Temp/deploy-* còn lại.
