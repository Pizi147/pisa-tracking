/**
 * Kiểm tra môi trường trước khi chạy: phiên bản Node và thư viện database.
 * Mục tiêu là báo lỗi bằng tiếng Việt kèm cách khắc phục, thay vì để người dùng
 * nhìn thấy stack trace của Node.
 */
const major = Number(process.versions.node.split('.')[0]);
const MIN = 20;
const MAX_TESTED = 24;

const box = (title, body) => {
  console.error(`\n┌${'─'.repeat(62)}┐`);
  console.error(`│  ${title.padEnd(60)}│`);
  console.error(`└${'─'.repeat(62)}┘\n${body}\n`);
};

if (major < MIN) {
  box('Phiên bản Node.js quá cũ', `  Bạn đang dùng Node.js v${process.versions.node}
  Bản demo cần Node.js phiên bản ${MIN} trở lên.

  Cách xử lý:
    1. Vào https://nodejs.org
    2. Tải bản "LTS" và cài đặt
    3. Đóng cửa sổ dòng lệnh, mở lại, rồi chạy lại lệnh vừa rồi`);
  process.exit(1);
}

if (major > MAX_TESTED) {
  console.warn(
    `[chú ý] Node.js v${process.versions.node} mới hơn phiên bản đã được kiểm thử (v${MAX_TESTED}). ` +
    `Nếu gặp lỗi lạ, cài Node.js bản LTS từ https://nodejs.org rồi thử lại.\n`,
  );
}

// Thư viện database (libsql) tải sẵn tệp bản địa cho từng hệ điều hành lúc `npm install`. Thiếu tệp đó
// thì ứng dụng chết với thông báo rất khó hiểu — nên kiểm trước và nói rõ.
try {
  const { default: Database } = await import('libsql');
  new Database(':memory:').close();
} catch (err) {
  box('Chưa cài được thư viện database', `  Thư viện SQLite (libsql) chưa sẵn sàng nên chưa chạy được.

  Chạy lệnh sau, rồi thử lại:

      npm install

  Chi tiết kỹ thuật: ${err instanceof Error ? err.message.split('\n')[0] : String(err)}`);
  process.exit(1);
}
