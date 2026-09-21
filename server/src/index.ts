import { db, isInitialised } from './db.ts';
import { createApp } from './app.ts';

const PORT = Number(process.env.PORT ?? 4000);
/* Ứng dụng dựng ở `app.ts` để phép kiểm gọi được đúng ứng dụng này bằng HTTP thật. */
const app = createApp();

if (!isInitialised()) {
  console.warn('\n⚠️  Chưa có dữ liệu. Chạy:  npm run seed\n');
} else {
  db();
}

app.listen(PORT, () => {
  console.log(`[api] PISA Progress demo API đang chạy tại http://localhost:${PORT}`);
});
