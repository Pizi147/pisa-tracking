import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { fmtBand } from '../../lib/format.ts';
import { useToast } from '../../ui/Toast.tsx';
import { ConfirmDialog } from '../../ui/Drawer.tsx';
import { Truong } from '../../ui/KhungPanel.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { tenMon, tuanLich } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

type Muc = { id: number; ten: string };
/** Khớp `HeQuaHuyLuot` của `server/src/fasttrack/attempts.ts` (bỏ `caseIds`). */
export type HeQuaHuy = {
  cachDuoc: 'ca-luot' | null; case: number; pa: number; phoiHop: number;
  lich: { soKyNang: number; tuan: string[] };
  diem: { skill: string; band: number | null; raw: number | null }[];
  caseDong: Muc[]; paDong: Muc[]; paGiu: Muc[];
  /** Bài lớp thường: điểm xoá (không cất), Khôi phục ra lượt trống. */
  xoaDiem: boolean;
};

const NGAN: Record<string, string> = { listening: 'L', reading: 'R', writing1: 'W1', writing2: 'W2', speaking: 'S' };

/**
 * HỘP "HUỶ MT{n}?" (PR-OV4a, mockup §5): gạch đầu dòng đúng số thật — lịch bỏ khỏi Lịch Test, điểm ẩn (không tính Overall, SOS, Phân tích),
 * Case / PA đóng, PA có kết quả giữ, Phối hợp — và nói trước Khôi phục được. Lý do tuỳ chọn (rà #282) — trống thì nhật ký ghi "Huỷ MT{n}".
 * Dùng ở Hồ sơ MT và ⋯ đầu `HopKyNang`. Không truyền `heQua` thì tự đọc `viewer.huyLuot` của lượt (`trongHop`: nằm trên hộp z-60).
 */
export function HopHuyMt({ open, onClose, attemptId, attemptNo, heQua, phu, trongHop, onDone }: {
  open: boolean; onClose: () => void; attemptId: number; attemptNo: number; heQua?: HeQuaHuy | null;
  /** Dòng phụ dưới tiêu đề: "{em} · {lớp} · {tuần}". */
  phu?: string; trongHop?: boolean; onDone: () => void;
}) {
  const toast = useToast();
  const homNay = useNgayNghiepVu().homNay;
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const doc = useApi<{ viewer: { huyLuot: HeQuaHuy | null } }>(open && heQua === undefined ? `/attempts/${attemptId}` : null);
  const hq = heQua === undefined ? doc.data?.viewer.huyLuot ?? null : heQua;
  const mt = `MT${attemptNo}`;
  const diem = hq?.diem.map((x) => `${NGAN[x.skill] ?? tenMon(null, x.skill)} ${x.band != null ? fmtBand(x.band) : x.raw ?? ''}`.trim()).join(' · ');
  return (
    <ConfirmDialog
      open={open} onClose={onClose} danger busy={busy} z={trongHop ? 'z-[70]' : undefined}
      title={t('Huỷ {mt}?', { mt })} closeLabel={t('Đóng')} confirmLabel={t('Huỷ {mt}', { mt })}
      confirmDisabled={!hq} confirmTitle={t('Đang đọc hệ quả của lượt…')}
      body={
        <div className="space-y-3">
          {phu && <p className="m-0 break-words text-xs text-slate-400">{phu}</p>}
          {!hq ? (
            <p className="m-0 text-slate-400" role={doc.error ? 'alert' : undefined}>
              {doc.error ? t('Chưa đọc được hệ quả của {mt}: {message} Đóng hộp rồi thử lại.', { mt, message: doc.error.message }) : t('Đang đọc hệ quả…')}
            </p>
          ) : (
            <ul className="m-0 space-y-1 pl-5" style={{ listStyle: 'disc' }}>
              {hq.lich.soKyNang > 0 && (
                <li>{t('Lịch')}{' '}<b className="text-slate-100">{t('{soKyNang} kỹ năng', { soKyNang: hq.lich.soKyNang })}</b>
                  {hq.lich.tuan.length > 0 && homNay ? <>{' '}{t('tuần')}{' '}<span className="tabular-nums">{hq.lich.tuan.map((w) => tuanLich(w, homNay)).join(', ')}</span></> : null}{' '}{t('bỏ khỏi Lịch Test và việc chấm.')}</li>
              )}
              {hq.diem.length > 0 && (
                <li><b className="text-slate-100">{t('{length} điểm đã nhập', { length: hq.diem.length })}</b> (<span className="tabular-nums">{diem}</span>){' '}
                  {hq.xoaDiem ? t('sẽ xoá (nhật ký giữ giá trị cũ).') : t('ẩn đi, không tính Overall, SOS, Phân tích.')}</li>
              )}
              {hq.caseDong.length > 0 && (
                <li><b className="text-slate-100">{hq.caseDong.length === 1 ? hq.caseDong[0].ten : `${hq.caseDong.length} Case`}</b>
                  {hq.caseDong.length > 1 ? ` (${hq.caseDong.map((c) => c.ten.replace(/^Case /, '')).join(', ')})` : ''}{' '}{t('đóng (“Lượt đã huỷ”).')}</li>
              )}
              {/* OV-11e (TE-12): PA đang chạy của Case sinh riêng (`pa` = PA của Case đóng + `paDong`) — chưa có kết quả, đóng cùng Case. */}
              {hq.pa - hq.paDong.length > 0 && (
                <li><b className="text-slate-100">{hq.pa - hq.paDong.length} PA</b>{' '}{t('chưa có kết quả của Case trên — đóng cùng Case.')}</li>
              )}
              {hq.paDong.map((x) => <li key={x.id}><b className="text-slate-100">{x.ten}</b>{' '}{t('kết quả gần nhất “Chưa đủ dữ liệu” — đóng cùng lượt.')}</li>)}
              {hq.paGiu.map((x) => <li key={x.id}><b className="text-slate-100">{x.ten}</b>{' '}{t('đang chạy có kết quả — giữ nguyên.')}</li>)}
              {hq.phoiHop > 0 && <li><b className="text-slate-100">{t('{phoiHop} việc Phối hợp', { phoiHop: hq.phoiHop })}</b>{' '}{t('còn chờ bỏ.')}</li>}
              <li>{hq.xoaDiem ? t('Khôi phục ra lượt trống (bài lớp thường không giữ điểm).') : t('Khôi phục được: lịch, điểm và Case trở lại như trước.')}</li>
            </ul>
          )}
          <Truong nhan={t('Lý do')} tuyChon>
            <textarea className="field w-full" rows={2} value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} placeholder={t('Ví dụ: em ốm cả tuần')} />
          </Truong>
        </div>
      }
      onConfirm={async () => {
        setBusy(true);
        try {
          await api.post(`/attempts/${attemptId}/cancel`, { reason: reason.trim() || null });
          for (const k of ['/attempts', '/tong-quan', '/ke-hoach-test', '/cycles', '/classes', '/students', '/my-work']) invalidate(k);
          onDone(); onClose(); toast.push('ok', t('Đã huỷ {mt}', { mt }));
        } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
      }}
    />
  );
}
