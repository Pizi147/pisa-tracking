/**
 * QUY ƯỚC TỆP ĐÍNH KÈM — MỘT nơi cho máy chủ (kiểm khi nhận) và giao diện (lọc khi chọn tệp, báo lỗi sớm).
 * Hai bên đọc cùng danh sách nên không có chuyện giao diện cho chọn một loại tệp mà máy chủ từ chối.
 *
 * Không có HTML, SVG, tập lệnh hay tệp chạy được: đó là thứ chạy trong trình duyệt của người tải về.
 */
export const ATTACHMENT_MAX_BYTES = 4 * 1024 * 1024;

export const ATTACHMENT_MIME_BY_EXT: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain', csv: 'text/csv',
  mp3: 'audio/mpeg', m4a: 'audio/mp4', wav: 'audio/wav', mp4: 'video/mp4', mov: 'video/quicktime',
};

export const ATTACHMENT_EXTENSIONS: readonly string[] = Object.keys(ATTACHMENT_MIME_BY_EXT);
