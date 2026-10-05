import { useEffect, useMemo, useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import {
  chuHopKetLuan, huongTiepKhaDung, nhanHuongNgan, xepHuongTheoGoiY,
  type GoiYCuoiKhoa, type HopKetLuanVao, type Huong, type ProgrammeCode,
} from '@shared/domain/index.ts';

type EmCuoiKhoa = {
  tyLe: number | null; scored: number; required: number; mon: { skill: string; ratio: number | null }[];
  goiY: GoiYCuoiKhoa | null; quyetDinh: HopKetLuanVao['quyetDinh']; ketLuanFt: HopKetLuanVao['ketLuanFt'];
};
type BanGhi = { huong: Huong; ghiChu: string | null; ngayXemLai: string | null };
type DuLieu = {
  lop: { id: number; code: string; ma: ProgrammeCode | null; maKe: ProgrammeCode | null };
  coTheGhi: boolean; toiDa: number;
  hocVien: { id: number; ten: string; ma: string; cuoiKhoa: EmCuoiKhoa | null; banGhi: BanGhi | null }[];
};
type Dong = { huong: Huong | ''; ghiChu: string };

/** Lưới 4 cột từ lg; dưới lg mỗi em là một khối xếp dọc (375 px, không cuộn ngang). */
const LUOI = 'lg:grid-cols-[minmax(160px,1.1fr)_minmax(170px,1fr)_minmax(220px,1.2fr)_minmax(180px,1fr)]';

/**
 * GHI LỘ TRÌNH TIẾP THEO CẢ LỚP (PR-K26, K2-26) — GVCN ghi dự định sau lớp cho mọi em trên MỘT bảng, lưu một lần (tất cả hoặc không).
 * Mỗi dòng: Học viên · Cuối khoá (`chuHopKetLuan`, cùng chữ hộp Kết luận khoá) · hướng (điền sẵn bản ghi; chưa có thì hướng Hệ thống gợi ý; em
 * 50–59% để trống + chip "QL quyết") · ghi chú. Hướng gợi ý đứng đầu ô chọn. Chỉ gửi dòng ĐÃ ĐỔI so với bản ghi. Lỗi máy chủ chỉ đúng dòng.
 * Nằm ở: Hồ sơ lớp thường → ⋮ → Ghi lộ trình tiếp theo cả lớp. Chi tiết từng em (lớp dự kiến, Target, ngày xem lại) vẫn ghi ở panel một em.
 */
export function LoTrinhTiepCaLopPanel({ classId, onClose, onDone }: { classId: number; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const { data, loading, error, reload } = useApi<DuLieu>(`/classes/${classId}/lo-trinh-tiep`, [classId]);
  const [dongs, setDongs] = useState<Record<number, Dong>>({});
  const [loiDong, setLoiDong] = useState<{ sid: number; cau: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const cacHuong = useMemo(() => huongTiepKhaDung(data?.lop.ma ?? null), [data?.lop.ma]);
  /** Giá trị ban đầu của một dòng: bản ghi đã lưu; chưa có thì hướng Hệ thống gợi ý (một hướng); 50–59% (hai hướng) để trống cho GVCN chọn. */
  const goc = (h: DuLieu['hocVien'][number]): Dong => {
    if (h.banGhi) return { huong: h.banGhi.huong, ghiChu: h.banGhi.ghiChu ?? '' };
    const { dau } = xepHuongTheoGoiY(cacHuong, h.cuoiKhoa?.goiY);
    return { huong: dau.length === 1 ? dau[0] : '', ghiChu: '' };
  };
  useEffect(() => { setDongs({}); setLoiDong(null); }, [data]);

  if (error) return <KhungPanel tieuDe="Ghi lộ trình tiếp theo cả lớp" onDong={onClose}><ErrorState message={error.message} hint={error.hint} onRetry={reload} /></KhungPanel>;
  if (loading || !data) return <KhungPanel tieuDe="Ghi lộ trình tiếp theo cả lớp" onDong={onClose}><Skeleton rows={6} /></KhungPanel>;

  const dongCua = (h: DuLieu['hocVien'][number]): Dong => dongs[h.id] ?? goc(h);
  /** Dòng đổi = khác bản ghi đã lưu (dòng chưa có bản ghi mà đã có hướng — kể cả hướng gợi ý điền sẵn — là dòng mới cần lưu). */
  const doi = data.hocVien.filter((h) => {
    const d = dongCua(h);
    if (!d.huong) return false;
    return !h.banGhi || h.banGhi.huong !== d.huong || (h.banGhi.ghiChu ?? '') !== d.ghiChu.trim();
  });
  const daSua = Object.keys(dongs).length > 0;
  const quaNhieu = doi.length > data.toiDa;
  const sua = (sid: number, p: Partial<Dong>, h: DuLieu['hocVien'][number]) => {
    setDongs((m) => ({ ...m, [sid]: { ...(m[sid] ?? goc(h)), ...p } }));
    if (loiDong?.sid === sid) setLoiDong(null);
  };

  const luu = async () => {
    if (!doi.length || quaNhieu) return;
    setBusy(true); setLoiDong(null);
    try {
      await api.put(`/classes/${classId}/lo-trinh-tiep`, {
        items: doi.map((h) => { const d = dongCua(h); return { studentId: h.id, huong: d.huong, ghiChu: d.ghiChu.trim() || null }; }),
      });
      invalidate('/students'); invalidate('/classes'); invalidate('/hoc-vien-lop'); invalidate('/my-work');
      toast.push('ok', `Đã lưu lộ trình tiếp theo của ${doi.length} em`);
      onDone(); onClose();
    } catch (e: any) {
      const sid = Number(e?.details?.studentId);
      if (sid && data.hocVien.some((h) => h.id === sid)) {
        setLoiDong({ sid, cau: e.message });
        requestAnimationFrame(() => document.getElementById(`lt-ca-lop-${sid}`)?.focus());
      }
      toast.push('error', `Chưa lưu em nào. ${e.message}`);
    } finally { setBusy(false); }
  };

  const nhan = 'mb-0.5 block text-[11px] text-slate-500 lg:hidden';
  return (
    <KhungPanel tieuDe="Ghi lộ trình tiếp theo cả lớp" lop={data.lop.code} rong="toan" onDong={onClose}
      chan={data.coTheGhi && data.hocVien.length ? {
        huy: { nhan: daSua ? 'Huỷ thay đổi' : 'Đóng', onClick: onClose, disabled: busy },
        dongTren: quaNhieu ? <p className="m-0 text-[12px] text-late">Mỗi lần lưu tối đa {data.toiDa} em — lưu bớt rồi lưu tiếp.</p> : undefined,
        chinh: (
          <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={luu} disabled={busy || !doi.length || quaNhieu}>
            {busy ? 'Đang lưu…' : doi.length ? `Lưu ${doi.length} em` : 'Chưa đổi gì'}
          </button>
        ),
      } : undefined}>
      <p className="m-0 mt-3 text-xs text-slate-400">
        Chỉ là dự định, chưa đổi lớp. Hướng Hệ thống gợi ý theo Cuối khoá đứng đầu ô chọn. Em Cuối khoá 50–59%: bạn ghi đề xuất, Quản lý quyết khi chuyển lớp.
      </p>
      {!data.coTheGhi && <p className="mt-3 text-sm text-slate-400">Bạn chỉ xem được — không có quyền ghi lộ trình tiếp theo cho lớp này.</p>}
      {data.hocVien.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">Lớp chưa có học viên đang học.</p>
      ) : (
        <div role="table" aria-label={`Lộ trình tiếp theo lớp ${data.lop.code}`} className="mt-3">
          <div role="row" className={`hidden gap-x-3 border-b px-3 pb-1.5 text-[11px] font-semibold text-slate-500 lg:grid ${LUOI}`} style={{ borderColor: 'var(--line)' }}>
            <span role="columnheader">Học viên</span>
            <span role="columnheader">Cuối khoá</span>
            <span role="columnheader">Lộ trình tiếp theo</span>
            <span role="columnheader">Ghi chú</span>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
            {data.hocVien.map((h) => {
              const d = dongCua(h);
              const ck = h.cuoiKhoa;
              const k = ck ? chuHopKetLuan({ ct: data.lop.ma, tyLe: ck.tyLe, scored: ck.scored, required: ck.required, mon: ck.mon, goiY: ck.goiY, quyetDinh: ck.quyetDinh, ketLuanFt: null }) : null;
              const { dau, khac } = xepHuongTheoGoiY(cacHuong, ck?.goiY);
              const ctx = { ma: data.lop.ma, maKe: data.lop.maKe, ngayXemLai: h.banGhi?.huong === 'chua_quyet' ? h.banGhi.ngayXemLai : null };
              const opt = (x: Huong) => <option key={x} value={x}>{nhanHuongNgan(x, ctx)}</option>;
              const loi = loiDong?.sid === h.id ? loiDong.cau : null;
              const idLoi = `lt-ca-lop-loi-${h.id}`;
              const doiDong = doi.includes(h);
              return (
                <div key={h.id} role="row" className={`grid gap-x-3 gap-y-2 px-3 py-2.5 text-sm ${LUOI} ${loi ? 'bg-bad/10' : ''}`}>
                  <span role="cell" className="min-w-0">
                    <span className="block truncate font-semibold text-slate-100 lg:font-normal" title={h.ten}>{h.ten}</span>
                    <span className="block text-[11px] tabular-nums text-slate-500">{h.ma}{doiDong ? ' · sẽ lưu' : ''}</span>
                  </span>
                  <span role="cell" className="min-w-0">
                    <span className={nhan}>Cuối khoá</span>
                    {!k ? <span className="text-slate-500">—</span> : (
                      <>
                        <span className="block font-semibold tabular-nums text-slate-100">{k.chinh}</span>
                        {k.nhan && <span className="block text-[12px] leading-4 text-slate-400">{k.nhan}</span>}
                      </>
                    )}
                  </span>
                  <span role="cell" className="min-w-0">
                    <span className={nhan}>Lộ trình tiếp theo</span>
                    <span className="flex items-center gap-2">
                      <select id={`lt-ca-lop-${h.id}`} className="field w-full min-w-0" aria-label={`Lộ trình tiếp theo của ${h.ten}`}
                        aria-invalid={!!loi} aria-describedby={loi ? idLoi : undefined} disabled={!data.coTheGhi || busy}
                        value={d.huong} onChange={(e) => sua(h.id, { huong: e.target.value as Huong | '' }, h)}>
                        {!h.banGhi && <option value="">Chọn hướng</option>}
                        {dau.length ? (
                          <>
                            <optgroup label="Hệ thống gợi ý">{dau.map(opt)}</optgroup>
                            <optgroup label="Hướng khác">{khac.map(opt)}</optgroup>
                          </>
                        ) : cacHuong.map(opt)}
                      </select>
                      {ck?.goiY?.canQuanLy && <Nhan tone="soon" title="Cuối khoá 50–59%: hướng bạn chọn là đề xuất, Quản lý quyết khi chuyển lớp">QL quyết</Nhan>}
                    </span>
                    {loi && <span id={idLoi} role="alert" className="mt-1 block text-[12px] text-late">{loi}</span>}
                  </span>
                  <span role="cell" className="min-w-0">
                    <span className={nhan}>Ghi chú</span>
                    <input className="field w-full" aria-label={`Ghi chú của ${h.ten}`} maxLength={200} disabled={!data.coTheGhi || busy}
                      value={d.ghiChu} onChange={(e) => sua(h.id, { ghiChu: e.target.value }, h)} />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </KhungPanel>
  );
}
