import { useState } from 'react';
import { fmtDateTime } from '../../lib/format.ts';
import { CHU_THAO_TAC, docTuanLich, tenMon, tuanLich } from '@shared/domain/index.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { dich, t } from '@shared/i18n/index.ts';

type LichSuLich = { id: number; action: string; field: string | null; oldValue: string | null; newValue: string | null; reason: string | null; actorName: string | null; createdAt: string };
type LichSuDiem = { id: number; kind: 'edit' | 'override' | 'no_show' | 'nhan_xet'; skill: string; before: string; after: string; actorName: string | null; createdAt: string; lyDo: string | null; phan?: 'nhom' };

/** HSL-FT: Case mở · PA thêm của các Case của lượt (`attemptDetail.lichSuCase`). */
export type LichSuCase = { id: string; loai: 'case' | 'pa'; topic: string | null; ten: string; actorName: string | null; createdAt: string };

type Loai = 'lich' | 'diem' | 'vang' | 'huy' | 'case';
export type DongLuot = { key: string; at: string; loai: Loai; viec: string; mon: string | null; doi: string | null; ai: string | null; lyDo: string | null };

/** Nhãn việc theo T38 — cùng chữ với menu thao tác (`CHU_THAO_TAC`); việc không có trong bảng thao tác giữ chữ cũ. */
const NHAN_VIEC: Record<string, { chu: string; loai: Loai }> = {
  created: { chu: t('Tạo kế hoạch'), loai: 'lich' }, recreated: { chu: t('Tạo lại (số dùng lại)'), loai: 'lich' },
  week_set: { chu: CHU_THAO_TAC['doi-lich'], loai: 'lich' }, skill_week_set: { chu: CHU_THAO_TAC['doi-lich'], loai: 'lich' },
  lrw_set: { chu: t('Chốt buổi chính'), loai: 'lich' }, speaking_set: { chu: t('Chốt buổi Speaking'), loai: 'lich' },
  deadline_set: { chu: t('{x} cả đợt', { x: CHU_THAO_TAC['doi-han'] }), loai: 'lich' }, deadline_cleared: { chu: t('Bỏ dời hạn chấm cả đợt'), loai: 'lich' },
  skill_deadline_set: { chu: CHU_THAO_TAC['doi-han'], loai: 'lich' }, skill_deadline_cleared: { chu: t('Bỏ dời hạn chấm'), loai: 'lich' },
  skill_skipped: { chu: CHU_THAO_TAC['bo-ky-nang'], loai: 'huy' }, skill_restored: { chu: CHU_THAO_TAC['dua-lai'], loai: 'lich' },
  skill_no_show_settled: { chu: t('{x} / vắng', { x: CHU_THAO_TAC['bao-vang'] }), loai: 'vang' },
  skill_week_moved_absence: { chu: t('Dời do vắng'), loai: 'vang' }, skill_unscheduled: { chu: t('Huỷ lịch (về Chưa xếp lịch)'), loai: 'huy' },
  cancelled: { chu: t('Huỷ lượt'), loai: 'huy' }, skill_part_cancelled: { chu: t('Huỷ phần còn lại'), loai: 'huy' },
  skill_cancelled_absence: { chu: t('Huỷ do vắng 2 lần'), loai: 'huy' }, skill_part_restored: { chu: CHU_THAO_TAC['khoi-phuc'], loai: 'lich' }, reopened: { chu: t('Khôi phục'), loai: 'lich' },
  skill_absence_undone: { chu: t('Bỏ vắng'), loai: 'vang' },   // PR-BV: xoá "-" đã chốt
  skill_sit_status: { chu: t('Trạng thái làm bài'), loai: 'lich' }, completion_week: { chu: t('Tuần dự kiến hoàn tất'), loai: 'lich' },
};
const SIT: Record<string, string> = { scheduled: t('Theo lịch'), sat: t('Đã làm bài'), absent: t('Vắng'), cancelled: t('Đã huỷ'), required: t('Trong đợt'), skipped: t('Đã bỏ khỏi đợt') };

/** Biểu tượng 12 px bằng SVG — ký tự Unicode nhỏ của Inter ở cỡ này thành dấu chấm (bẫy đã gặp 28/09). */
function BieuTuong({ loai }: { loai: Loai }) {
  const p = { width: 12, height: 12, viewBox: '0 0 12 12', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, 'aria-hidden': true } as const;
  if (loai === 'diem') return <svg {...p} className="text-slate-400"><path d="M2 10l1-3 5-5 2 2-5 5-3 1z" /></svg>;
  if (loai === 'vang') return <svg {...p} className="text-late"><circle cx="6" cy="6" r="4.5" /><path d="M6 3.5V6.5M6 8.3v.2" /></svg>;
  if (loai === 'case') return <svg {...p} className="text-slate-400"><rect x="1.5" y="1.5" width="9" height="9" rx="2" /><path d="M4 6h4M6 4v4" /></svg>;
  if (loai === 'huy') return <svg {...p} className="text-bad"><circle cx="6" cy="6" r="4.5" /><path d="M3 9l6-6" /></svg>;
  return <svg {...p} className="text-slate-400"><rect x="1.5" y="2.5" width="9" height="8" rx="1" /><path d="M1.5 5h9M4 1.5v2M8 1.5v2" /></svg>;
}

/**
 * DÒNG THỜI GIAN MỘT LƯỢT (YC-13.6 "Lịch sử rõ hơn"): mỗi dòng biểu tượng · việc · ai · khi · lý do, mới nhất trên. Lịch, phạm vi
 * và điểm trong MỘT dòng. Mở sẵn 5 dòng; dài hơn thì "Xem hết n". Hồ sơ Mock và ngăn Lịch sử một bài lớp thường dùng chung.
 */
export function DongThoiGianLuot({ history, scoreHistory, lichSuCase = [], ct = null, gioiHan = 5, dong: dongSan }: {
  history: LichSuLich[]; scoreHistory: LichSuDiem[]; lichSuCase?: LichSuCase[]; ct?: string | null; gioiHan?: number;
  /** HSL-FT: dòng đã dựng sẵn (`dongLuot`, đã lọc theo kỹ năng) — số "n thay đổi" của dải thu gọn cùng tập với danh sách. */
  dong?: DongLuot[];
}) {
  const [het, setHet] = useState(false);
  const { homNay } = useNgayNghiepVu();
  const dong = dongSan ?? dongLuot({ history, scoreHistory, lichSuCase, ct, homNay });
  if (!dong.length) return <p className="m-0 text-xs text-slate-500">{t('Chưa có thay đổi nào.')}</p>;
  const hien = het ? dong : dong.slice(0, gioiHan);
  return (
    <div>
      <ol className="m-0 list-none space-y-2 p-0">
        {hien.map((d) => (
          <li key={d.key} className="flex gap-2 text-xs">
            <span className="mt-0.5 flex-none"><BieuTuong loai={d.loai} /></span>
            <div className="min-w-0">
              <div className="text-slate-200">
                <span className="font-medium">{d.viec}</span>{d.mon && <span className="text-slate-400"> · {d.mon}</span>}
                {d.doi && <span className="text-slate-400"> · {d.doi}</span>}
              </div>
              <div className="text-xs text-slate-500 tabular-nums">
                {d.ai ?? '—'} · {d.at ? fmtDateTime(d.at) : '—'}
                {d.lyDo && <> · <span className="inline-block max-w-full truncate align-bottom sm:max-w-[26rem]" title={t('Lý do: {lyDo}', { lyDo: dich(d.lyDo) })}>{t('Lý do: {lyDo}', { lyDo: dich(d.lyDo) })}</span></>}
              </div>
            </div>
          </li>
        ))}
      </ol>
      {dong.length > gioiHan && (
        <button type="button" className="btn btn-sm btn-ghost mt-2 min-h-[44px] sm:min-h-0" onClick={() => setHet((v) => !v)}>
          {het ? t('Thu gọn') : t('Xem hết {length}', { length: dong.length })}
        </button>
      )}
    </div>
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
      const doi = [h.oldValue && `${gia(h.oldValue)} →`, h.newValue && gia(h.newValue)].filter(Boolean).join(' ');
      return { key: `l${h.id}`, at: h.createdAt ?? '', loai: n.loai, viec: n.chu, mon: mon(h.field), doi: doi || null, ai: h.actorName, lyDo: h.reason };
    }),
    ...scoreHistory.map((h) => {
      /* Dn7: nhận xét W/S cùng dòng thời gian (biểu tượng bút như dòng điểm); xoá nhận xét không phải "huỷ điểm". */
      const nhanXet = h.kind === 'nhan_xet';
      const huy = !nhanXet && h.kind !== 'no_show' && h.after === 'Trống';
      const viec = nhanXet ? (h.phan === 'nhom' ? t('Nhóm nguyên nhân') : t('Nhận xét')) : huy ? CHU_THAO_TAC['huy-diem'] : h.kind === 'no_show' ? t('Dấu "-"') : h.kind === 'override' ? t('Hiệu chỉnh điểm') : CHU_THAO_TAC['sua-diem'];
      return { key: `d${h.id}${h.phan ?? ''}`, at: h.createdAt, loai: (huy ? 'huy' : h.kind === 'no_show' ? 'vang' : 'diem') as Loai, viec, mon: mon(h.skill), doi: `${dich(h.before)} → ${dich(h.after)}`, ai: h.actorName, lyDo: h.lyDo };
    }),
    ...lichSuCase.map((h) => ({
      key: h.id, at: h.createdAt, loai: 'case' as Loai, viec: h.loai === 'case' ? t('Mở Case') : t('Thêm PA'), mon: mon(h.topic),
      doi: dich(h.ten) || null, ai: h.actorName, lyDo: null,
    })),
  ];
  return dong.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}
