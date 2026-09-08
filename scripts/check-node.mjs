/** Kiểm tra phiên bản Node trước khi chạy, báo bằng tiếng Việt nếu không phù hợp. */
const major = Number(process.versions.node.split('.')[0]);
const MIN = 20;
const MAX_TESTED = 24;

if (major < MIN) {
  console.error(`
┌──────────────────────────────────────────────────────────────┐
│  Phiên bản Node.js quá cũ                                    │
└──────────────────────────────────────────────────────────────┘

  Bạn đang dùng Node.js v${process.versions.node}
  Bản demo cần Node.js phiên bản ${MIN} trở lên.

  Cách xử lý:
    1. Vào https://nodejs.org
    2. Tải bản "LTS" và cài đặt
    3. Đóng cửa sổ dòng lệnh, mở lại, rồi chạy lại lệnh vừa rồi
`);
  process.exit(1);
}

if (major > MAX_TESTED) {
  console.warn(
    `[chú ý] Node.js v${process.versions.node} mới hơn phiên bản đã được kiểm thử (v${MAX_TESTED}). ` +
    `Nếu gặp lỗi lạ, hãy cài Node.js bản LTS từ https://nodejs.org rồi thử lại.\n`,
  );
}
