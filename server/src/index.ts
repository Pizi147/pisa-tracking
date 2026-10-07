import { db, isInitialised } from './db.ts';
import { createApp } from './app.ts';
import { hasLegacyDisciplineModel } from './migrate.ts';

const PORT = Number(process.env.PORT ?? 4000);
/* Ứng dụng dựng ở `app.ts` để phép kiểm gọi được đúng ứng dụng này bằng HTTP thật. */
const app = createApp();

if (!isInitialised()) {
  console.warn('\n⚠️  Chưa có dữ liệu. Chạy:  npm run seed\n');
} else {
  const conn = db();
  /* Database từ trước PR-J (21/09/2026) chưa có bốn bảng Ý thức, còn cột `sos_cases.track` — API sẽ lỗi ở các đường Ý thức và ghi tín hiệu. */
  const hasViolations = !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = 'violations'").get();
  if (hasLegacyDisciplineModel(conn) || !hasViolations) {
    console.warn('\n⚠️  Database này còn ở mô hình Ý thức cũ (trước 21/09/2026). Chạy:  npm run migrate   (tự sao lưu trước) — hoặc npm run seed nếu là dữ liệu demo.\n');
  }
}

app.listen(PORT, () => {
  console.log(`[api] PISA Tracking — API đang chạy tại http://localhost:${PORT}`);
});
