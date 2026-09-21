/**
 * MÁY CHỦ BẢN CHÍNH trên Netlify — chính ứng dụng Express của máy dev (`createApp`), bọc thành một Function.
 * Không có logic nghiệp vụ nào ở đây.
 */
import serverless from 'serverless-http';
import { connectLambda } from '@netlify/blobs';
import { createApp } from '../../server/src/app.ts';
import { choViecNenKhoTep } from '../../server/src/platform/khoTep.ts';

/*
 * File này CHỈ chạy trên Netlify — tức luôn là bản chính. Tự bật chế độ bản chính thay vì trông vào một biến đặt tay:
 * thiếu hay gõ sai `BAN_CHINH` trên Netlify sẽ mở lại "Vào nhanh" không mật khẩu trên dữ liệu thật.
 */
process.env.BAN_CHINH = '1';

const app = createApp();
/* Kiểu nội dung trả về dạng nhị phân. Thiếu một kiểu → tệp tải xuống bị hỏng (đã thấy 22/09: mp4 13 byte → 19 byte).
   Phải phủ mọi đuôi trong ATTACHMENT_MIME_BY_EXT (shared/domain/attachments.ts). */
const xuLy = serverless(app, {
  binary: ['multipart/form-data', 'application/octet-stream', 'image/*', 'audio/*', 'video/*', 'application/pdf',
           'application/msword', 'application/vnd.*', 'application/zip',
           /* txt, csv: tệp người dùng có thể không phải UTF-8 — trả nguyên byte. JSON của API là application/json, không dính. */
           'text/plain', 'text/csv'],
});

export const handler = async (event: any, context: any) => {
  /* Cho @netlify/blobs biết site/đường vào kho (chế độ Lambda). Không có `event.blobs` (ví dụ chạy thử cục bộ) thì
     connectLambda ném lỗi — nên chỉ gọi khi có. Đã kiểm với @netlify/blobs 11.1.0. */
  if (event?.blobs) connectLambda(event);
  const traLoi = await xuLy(event, context);
  /* Netlify đóng băng tiến trình ngay khi trả lời — chờ các lệnh xoá tệp chạy nền xong đã (xem khoTep.ts). */
  await choViecNenKhoTep();
  return traLoi;
};
