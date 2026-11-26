/** HAN-HOP-DIEM (chủ SP 26/11) — bấm ngày hạn để sửa (không nút "Sửa hạn"); hộp chấm: ⋯ Huỷ điểm hỏi một dòng. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_HAN_HOP_DIEM = {
  'Sửa hạn {ngay}': (b) => `Edit deadline ${b.ngay}`,
  'Huỷ điểm {skillLabel} · {tenHv}?': (b) => `Cancel ${b.skillLabel} score · ${b.tenHv}?`,
} as const satisfies Record<string, Dich>;
