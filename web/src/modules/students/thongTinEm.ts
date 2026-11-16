import type { ThongTinEm } from './StudentManagePanel.tsx';

/* TD-NGUOI-2: tách khỏi `StudentManagePanel.tsx` để hồ sơ HV dùng mà panel vẫn tải khi mở. */
/** Hồ sơ (`/students/:id`) → dữ liệu Sửa thông tin. Chung cho hồ sơ HV và ⋯ dòng. */
export function thongTinEmCua(d: any): ThongTinEm {
  return {
    id: d.id, name: d.fullName, classId: d.currentClass?.id ?? null, dob: d.dob ?? null, email: d.email ?? null,
    consultantName: d.consultantName ?? null, note: d.note ?? null, status: d.status, tvv: d.tvv ?? null, tvvChon: d.tvvChon ?? null,
    lienHe: d.lienHe ?? null, deXuatTarget: d.deXuatTarget ?? null,
  };
}
