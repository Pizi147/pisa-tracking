import { api } from '../../lib/api.ts';
import { LO_HANG_LOAT_EM, LO_XOA_EM, VIEC_NGUOC, chiaLo, type KetQuaHangLoat, type ViecHangLoat } from '@shared/domain/index.ts';

/**
 * GỬI LÀM NHIỀU HỌC VIÊN THEO LÔ (PR-LUI-b) — mỗi lô `LO_HANG_LOAT_EM` một request (10 s của Netlify), gom `ok` / `failed`. Một lô ném lỗi (mất mạng, 503
 * "sắp hết giờ") thì DỪNG: phần còn lại ghi là "chưa lưu" với đúng câu lỗi — phần đã lưu giữ nguyên, người dùng Thử lại đúng các học viên chưa lưu.
 * ponytail: lô đang bay mà mất mạng có thể đã ghi xong dù web nhận lỗi — Thử lại gặp học viên "Đã …" thì máy chủ báo lý do ngắn (an toàn, không ghi lại); thêm khoá chống gửi trùng nếu cần nói gọn hơn.
 */
export async function chayHangLoat(
  viec: ViecHangLoat, ids: number[], o: { lyDo?: string; date?: string; moLaiLop?: boolean; lopMoiId?: number; xacNhan?: string }, onTienDo?: (xong: number, tong: number) => void,
): Promise<KetQuaHangLoat> {
  const kq: KetQuaHangLoat = { ok: [], failed: [] };
  const lo = chiaLo(ids, viec === 'xoa' ? LO_XOA_EM : LO_HANG_LOAT_EM);
  for (let i = 0; i < lo.length; i++) {
    onTienDo?.(kq.ok.length + kq.failed.length, ids.length);
    try {
      const r = await api.post<KetQuaHangLoat>('/hang-loat-hoc-vien', {
        viec, studentIds: lo[i], lyDo: o.lyDo || undefined, date: o.date || undefined, moLaiLop: o.moLaiLop === true, lopMoiId: o.lopMoiId, xacNhan: o.xacNhan,
      });
      kq.ok.push(...r.ok); kq.failed.push(...r.failed);
      if (r.thungRac?.length) (kq.thungRac ??= []).push(...r.thungRac);   // Q-RL2b: Xoá — id thùng rác từng em đã xoá
    } catch (e: any) {
      for (const sid of lo.slice(i).flat()) kq.failed.push({ studentId: sid, message: e.message });
      break;
    }
  }
  return kq;
}

/**
 * Hoàn tác = làm việc NGƯỢC cho đúng các học viên đã làm được: Kết thúc học → `hoan-tac-ket-thuc` (mở lại đúng Case / PA đã đóng), Học lại → `hoan-tac-hoc-lai`
 * (gỡ ghi danh / lộ trình mới; có dữ liệu thì máy chủ từ chối kèm câu rõ), lưu trữ ↔ bỏ lưu trữ, huỷ ↔ khôi phục chuyển lớp.
 * Xoá không đi đường này: Hoàn tác = khôi phục thùng rác (`hoanTacXoaLo`, Q-RL2b).
 */
export async function hoanTacHangLoat(viec: Exclude<ViecHangLoat, 'xoa'>, ids: number[]): Promise<KetQuaHangLoat> {
  return chayHangLoat(VIEC_NGUOC[viec], ids, {});
}
