import { DsLichSu, lucNgan } from '../../ui/LichSuThayDoi.tsx';
import { CHU_THAO_TAC, docTuanLich, tenMon, tuanLich } from '@shared/domain/index.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { dich, t } from '@shared/i18n/index.ts';

type LichSuLich = { id: number; action: string; field: string | null; oldValue: string | null; newValue: string | null; reason: string | null; actorName: string | null; createdAt: string };
type LichSuDiem = { id: number; kind: 'edit' | 'override' | 'no_show' | 'nhan_xet'; skill: string; before: string; after: string; actorName: string | null; createdAt: string; lyDo: string | null; phan?: 'nhom' };

/** HSL-FT: Case mở · PA thêm của các Case của lượt (`attemptDetail.lichSuCase`). */
export type LichSuCase = { id: string; loai: 'case' | 'pa'; topic: string | null; ten: string; actorName: string | null; createdAt: string };

type Loai = 'lich' | 'diem' | 'vang' | 'huy' | 'case';
export type DongLuot = { key: string; at: string; loai: Loai; viec: string; mon: string | null; cu: string | null; moi: string | null; ai: string | null; lyDo: string | null };

/** Nhãn việc theo T38 — cùng chữ với menu thao tác (`CHU_THAO_TAC`); việc không có trong bảng thao tác giữ chữ cũ. */
const NHAN_VIEC: Record<string, { chu: string; loai: Loai }> = {
  created: { chu: t('Tạo kế hoạch'), loai: 'lich' }, recreated: { chu: t('Tạo lại (số dùng lại)'), loai: 'lich' },
  week_set: { chu: CHU_THAO_TAC['doi-lich'], loai: 'lich' }, skill_week_set: { chu: CHU_THAO_TAC['doi-lich'], loai: 'lich' },
  lrw_set: { chu: t('Chốt buổi chính'), loai: 'lich' }, speaking_set: { chu: t('Chốt buổi Speaking'), loai: 'lich' },
  deadline_set: { chu: t('{x} cả đợt', { x: CHU_THAO_TAC['doi-han'] }), loai: 'lich' }, deadline_cleared: { chu: t('Bỏ dời hạn chấm cả đợt'), loai: 'lich' },
  skill_deadline_set: { chu: CHU_THAO_TAC['doi-han'], loai: 'lich' }, skill_deadline_cleared: { chu: t('Bỏ dời hạn chấm'), loai: 'lich' },
  skill_skipped: { chu: CHU_THAO_TAC['bo-ky-nang'], loai: 'huy' }, skill_restored: { chu: CHU_THAO_TAC['khoi-phuc-kn'], loai: 'lich' },   // chủ SP 06/11: Xoá ⇄ Khôi phục
  skill_no_show_settled: { chu: t('{x} / vắng', { x: CHU_THAO_TAC['bao-vang'] }), loai: 'vang' },
  skill_week_moved_absence: { chu: t('Dời do vắng'), loai: 'vang' }, skill_unscheduled: { chu: t('Huỷ lịch (về Chưa xếp lịch)'), loai: 'huy' },
  cancelled: { chu: t('Huỷ lượt'), loai: 'huy' }, skill_part_cancelled: { chu: t('Huỷ phần còn lại'), loai: 'huy' },
  skill_cancelled_absence: { chu: t('Huỷ do vắng 2 lần'), loai: 'huy' }, skill_part_restored: { chu: CHU_THAO_TAC['khoi-phuc'], loai: 'lich' }, reopened: { chu: t('Khôi phục'), loai: 'lich' },
  skill_absence_undone: { chu: t('Bỏ vắng'), loai: 'vang' },
  skill_huy_tay: { chu: CHU_THAO_TAC['huy-diem'], loai: 'huy' }, skill_bo_huy_tay: { chu: CHU_THAO_TAC['khoi-phuc-diem'], loai: 'lich' },   // NHAP-DIEM-b: Huỷ điểm ⇄ Khôi phục (cùng dòng lịch sử LG-9 cũ)   // PR-BV: xoá "-" đã chốt
  skill_move_decision_undone: { chu: t('Huỷ quyết định dời lịch'), loai: 'vang' },   // RKC-3c: Huỷ quyết định ở Chờ duyệt
  skill_absence_reset: { chu: t('Lần vắng về 0'), loai: 'vang' },   // N38 L5: migrate PR-MT-VANG-RESET (đã chọn tuần sau lần vắng)
  skill_sit_status: { chu: t('Trạng thái làm bài'), loai: 'lich' }, completion_week: { chu: t('Tuần dự kiến hoàn tất'), loai: 'lich' },
};
const SIT: Record<string, string> = { scheduled: t('Theo lịch'), sat: t('Đã làm bài'), absent: t('Vắng'), cancelled: t('Đã huỷ'), required: t('Trong đợt'), skipped: t('Đã bỏ khỏi đợt') };

/**
 * DÒNG THỜI GIAN MỘT LƯỢT (YC-13.6 "Lịch sử rõ hơn") — GD-4c: vẽ bằng MỘT KIỂU LỊCH SỬ (`DsLichSu`, H4): giờ · người · việc · môn · cũ → mới,
 * lý do ở dòng phụ; mới nhất trên. Mở sẵn `gioiHan` dòng; dài hơn thì "Xem hết n". Hồ sơ Mock, ngăn Lịch sử một bài lớp thường, hộp nhập điểm dùng chung.
 */
export function DongThoiGianLuot({ history, scoreHistory, lichSuCase = [], ct = null, gioiHan = 5, dong: dongSan }: {
  history: LichSuLich[]; scoreHistory: LichSuDiem[]; lichSuCase?: LichSuCase[]; ct?: string | null; gioiHan?: number;
  /** HSL-FT: dòng đã dựng sẵn (`dongLuot`, đã lọc theo kỹ năng) — số "Lịch sử · n" của dải gập cùng tập với danh sách. */
  dong?: DongLuot[];
}) {
  const { homNay } = useNgayNghiepVu();
  const dong = dongSan ?? dongLuot({ history, scoreHistory, lichSuCase, ct, homNay });
  return (
    <DsLichSu gioiHan={gioiHan} dong={dong.map((d) => ({
      key: d.key, gio: d.at ? lucNgan(d.at) : '—', ai: d.ai, viec: d.mon ? `${d.viec} · ${d.mon}` : d.viec, cu: d.cu, moi: d.moi,
      phu: [d.lyDo && t('Lý do: {lyDo}', { lyDo: dich(d.lyDo) })],
    }))} />
  );
}

/**
 * DÒNG CỦA LỊCH SỬ MỘT LƯỢT, mới nhất trước — lịch, điểm, nhận xét và (HSL-FT) Case / PA trong một tập. Danh sách (`DongThoiGianLuot`) và dải
 * thu gọn "n thay đổi · mới nhất …" của hồ sơ lượt dựng từ đây, nên số và dòng luôn khớp.
 */
export function dongLuot({ history, scoreHistory, lichSuCase = [], ct = null, homNay }: {
  history: LichSuLich[]; scoreHistory: LichSuDiem[]; lichSuCase?: LichSuCase[]; ct?: string | null; homNay: string;
}): DongLuot[] {
  /* OV-11e (TE-12): mã tuần lưu kèm năm ("W4 SEP 2026") — cùng năm thì bỏ năm như mọi chỗ khác (G-6). */
  const gia = (v: string) => { const t2 = docTuanLich(v, homNay); return t2 ? tuanLich(t2, homNay) : SIT[v] ?? v; };
  const mon = (k: string | null) => (k && /^(listening|reading|writing|writing1|writing2|speaking|tong_hop)$/.test(k) ? tenMon(ct, k) : null);
  const dong: DongLuot[] = [
    ...history.map((h) => {
      const n = NHAN_VIEC[h.action] ?? { chu: h.action, loai: 'lich' as Loai };
      return { key: `l${h.id}`, at: h.createdAt ?? '', loai: n.loai, viec: n.chu, mon: mon(h.field), cu: h.oldValue ? gia(h.oldValue) : null, moi: h.newValue ? gia(h.newValue) : null, ai: h.actorName, lyDo: h.reason };
    }),
    ...scoreHistory.map((h) => {
      /* Dn7: nhận xét W/S cùng dòng thời gian (biểu tượng bút như dòng điểm); xoá nhận xét không phải "huỷ điểm". */
      const nhanXet = h.kind === 'nhan_xet';
      const huy = !nhanXet && h.kind !== 'no_show' && h.after === 'Trống';
      const viec = nhanXet ? (h.phan === 'nhom' ? t('Nhóm nguyên nhân') : t('Nhận xét')) : huy ? CHU_THAO_TAC['huy-diem'] : h.kind === 'no_show' ? t('Dấu "-"') : h.kind === 'override' ? t('Hiệu chỉnh điểm') : CHU_THAO_TAC['sua-diem'];
      return { key: `d${h.id}${h.phan ?? ''}`, at: h.createdAt, loai: (huy ? 'huy' : h.kind === 'no_show' ? 'vang' : 'diem') as Loai, viec, mon: mon(h.skill), cu: dich(h.before), moi: dich(h.after), ai: h.actorName, lyDo: h.lyDo };
    }),
    ...lichSuCase.map((h) => ({
      key: h.id, at: h.createdAt, loai: 'case' as Loai, viec: h.loai === 'case' ? t('Mở Case') : t('Thêm PA'), mon: mon(h.topic),
      cu: null, moi: dich(h.ten) || null, ai: h.actorName, lyDo: null,
    })),
  ];
  return dong.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}
