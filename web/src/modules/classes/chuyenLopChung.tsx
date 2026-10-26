import { api } from '../../lib/api.ts';
import { ONgay } from '../../ui/ONgay.tsx';
import { NutChon } from '../../ui/ui.tsx';
import { thuNgay } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * Phần dùng chung của các màn chuyển lớp (R5.3: dời từ `TransitionPanel` cũ khi gỡ "Chuyển tiếp lớp" lớp FT) — trang Cuối khoá, Chuyển lớp một / nhiều em.
 *
 * GỬI THEO LÔ: `lo` em một lời gọi (chuyển ngay chạy trong lời gọi — Netlify 10 s), tuần tự. Lô lỗi cả lời gọi → mọi em của lô vào `failed` với chữ lỗi,
 * các lô sau vẫn gửi. `onTienDo([đã gửi, tổng])`.
 */
export async function guiTheoLo(url: string, tuanChung: string | null, lo: number, onTienDo: (x: [number, number]) => void,
  dongs: { studentId: number }[]): Promise<{ ok: number[]; failed: { studentId: number; message: string }[]; daChuyen: number[] }> {
  const kq = { ok: [] as number[], failed: [] as { studentId: number; message: string }[], daChuyen: [] as number[] };
  for (let i = 0; i < dongs.length; i += lo) {
    onTienDo([i, dongs.length]);
    const phan = dongs.slice(i, i + lo);
    try {
      const r = await api.post<any>(url, { tuanChung, dongs: phan });
      kq.ok.push(...r.ok); kq.failed.push(...r.failed); kq.daChuyen.push(...(r.daChuyen ?? []));
    } catch (e: any) { kq.failed.push(...phan.map((d) => ({ studentId: d.studentId, message: e.message as string }))); }
  }
  return kq;
}

/** Khung vàng "chuyển ngay, không hoàn tác" / FT → Thường — cùng màu ở mọi panel chuyển lớp. */
export const KHOI_VANG = { borderColor: 'rgb(var(--soon-line-rgb))', background: 'rgb(var(--soon-bg-rgb))' };

/** OV-13l (mockup bước tiếp mục 4): lựa chọn ĐẦU của ô Tuần bắt đầu — "Ngay hôm nay · T5 15/10" = chuyển ngay khi lưu, không hoàn tác. */
export function NutHomNay({ homNay, chon, onClick, nho }: { homNay: string | null; chon: boolean; onClick: () => void; nho?: boolean }) {
  if (!homNay) return null;
  return <NutChon nho={nho} chon={chon} onClick={onClick}>{t('Ngay hôm nay')} <span className="tabular-nums text-slate-400">{thuNgay(homNay, homNay)}</span></NutChon>;
}

/** Ô tuần chỉ nhận Thứ Hai từ TUẦN SAU trở đi (Q5) — `tuanChon` do máy chủ trả (`tuanChonDuoc`). `rong`: không chặn trên (tuần xem lại của Tạm dừng học (bảo lưu)). */
export function OTuan({ tuanChon, value, onChange, ariaLabel, chuaChon, rong }: {
  tuanChon: string[]; value: string; onChange: (v: string) => void; ariaLabel: string; chuaChon?: string; rong?: boolean;
}) {
  return <ONgay kieu="tuan" moc="dau" value={value} onChange={onChange} toiThieu={tuanChon[0] ?? null} toiDa={rong ? null : tuanChon[tuanChon.length - 1] ?? null}
    ariaLabel={ariaLabel} goiY={chuaChon} />;
}
