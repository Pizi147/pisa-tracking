# vong4/ — bộ tài liệu bàn giao vòng 4

Chốt 13/09/2026. Đọc theo đúng thứ tự số.

| File | Nội dung | Ai cần đọc |
|---|---|---|
| **`00_BOI_CANH_KY_THUAT.md`** | Chạy dự án thế nào, cấu trúc mã nguồn, những cái bẫy đã vấp | Session code |
| **`01_CHOT_NGHIEP_VU.md`** | **Nguồn sự thật của vòng 4.** Vòng đời case, quy tắc SOS, lịch MT, phân quyền, tài khoản | Session code + owner |
| **`02_KE_HOACH_PHASE.md`** | Bốn phase, phase 1 gồm gì, xong khi nào | Session code + owner |
| **`03_PROMPT_BAN_GIAO.md`** | Đoạn văn dán vào chat mới để bắt đầu phase 1 | Owner |
| **`04_PROMPT_GOC_OWNER.md`** | Nguyên văn yêu cầu owner gửi 12/09/2026 | Tham chiếu |

## Thứ tự ưu tiên khi có mâu thuẫn

```
lời owner mới nhất
  → 01_CHOT_NGHIEP_VU.md
    → 04_PROMPT_GOC_OWNER.md
      → PISA_Design_Master_Reference.md (ở thư mục gốc)
        → hiện trạng code
```

Code đang chạy **không tự chứng minh** là owner đã duyệt.

## Bắt đầu thế nào

Mở chat Claude Code mới trên repo này, dán đoạn trong khung của `03_PROMPT_BAN_GIAO.md`.
