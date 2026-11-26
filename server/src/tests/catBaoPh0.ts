/**
 * BAOPH-0 (4.6): cắt phần lược đồ BAOPH-0 khỏi CHỮ schema.sql (đã đổi CRLF → LF) — phép kiểm "DB cũ → migrate" dựng DB trước BAOPH-0;
 * so cột với schema.sql hiện tại thì chạy thêm `themCotPrBaoPh0` (bước thêm cột của BAOPH-0). Bỏ: cột giao việc của discipline_measures, bảng viec_xu_ly
 * + hai chỉ mục, cột việc cha của tasks + chỉ mục. Khuôn đổi → ném lỗi (sửa bộ cắt).
 */
export function catBaoPh0(schema: string): string {
  const cat = schema
    .replace(/,\n  -- BAOPH-0 \(N72 ⑥, 4\.6\): giao việc[^\n]*\n  phu_trach_id[^\n]*\n\);/, '\n);')
    .replace(/-- BAOPH-0 \(N72 ⑥, 4\.6\): KHỐI GIAO VIỆC[\s\S]*?idx_dm_giao[^\n]*\n/, '')
    .replace(/hang_muc TEXT,\n  \/\* BAOPH-0[\s\S]*?cha_loai TEXT, cha_id INTEGER\n\);\nCREATE INDEX idx_task_cha[^\n]*\n/, 'hang_muc TEXT\n);\n');
  if (/BAOPH-0|viec_xu_ly|cha_loai/.test(cat)) throw new Error('schema.sql đổi khuôn — sửa bộ cắt catBaoPh0');
  return cat;
}
