/** QUYEN-LIEN-HE (luật 13/10): ô Liên hệ chỉ QL / Quản trị / TVV / CX / Admin — câu máy chủ. Khoá = chữ Việt. */
import type { Dich } from '../en.ts';

export const EN_QUYEN_LIEN_HE = {
  'Chỉ Head, TVV hoặc CX sửa được thông tin liên hệ — báo TVV / Head cập nhật.': 'Only a Head, consultant or CX can edit contact details — ask the consultant / Head to update them.',
  /* QUYEN-CN: Sửa cả lớp — ô Liên hệ chỉ đọc khi vai ở chi nhánh em không sửa được. */
  'Em thuộc chi nhánh bạn không sửa được liên hệ — báo TVV / Head chi nhánh em': "This student's branch doesn't let you edit contact details — ask the consultant / Head there",
} satisfies Record<string, Dich>;
