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
    `Nếu gặp lỗi lạ, hãy cài Node.js bản LTS từ https://nodejs.org rồi thử lại.\n`,
  );
}

// Thư viện database cần một tệp bản địa được biên dịch lúc cài đặt. Một số phiên bản npm
// chặn bước này vì lý do an toàn, khiến ứng dụng chết với thông báo rất khó hiểu.
try {
  const { default: Database } = await import('better-sqlite3');
  new Database(':memory:').close();
} catch (err) {
  box('Chưa cài được thư viện database', `  Thư viện SQLite chưa sẵn sàng nên chưa chạy được.
  Nguyên nhân thường gặp: npm đã chặn bước cài đặt của gói này.

  Hãy chạy lần lượt hai lệnh sau, rồi thử lại:

      npm install-scripts approve better-sqlite3
      npm install

  Nếu lệnh đầu báo không nhận ra, hãy chạy:

      npm rebuild better-sqlite3

  Chi tiết kỹ thuật: ${err instanceof Error ? err.message.split('\n')[0] : String(err)}`);
  process.exit(1);
}
