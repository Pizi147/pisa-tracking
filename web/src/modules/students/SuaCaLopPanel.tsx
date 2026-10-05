import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { ConfirmDialog } from '../../ui/Drawer.tsx';
import { ErrorState, Skeleton, Th } from '../../ui/ui.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { KCK, LY_DO_TOI_THIEU, laKck, type VanDeNhap } from '@shared/domain/index.ts';

type Cot = 'fullName' | 'dob' | 'email' | 'startWeek' | 'examDate' | 'target' | 'baseline';
type DongGoc = {
  studentId: number; fullName: string; dob: string | null; email: string | null; coLoTrinh: boolean;
  startWeek: string | null; examDate: string | null; target: number | string | null; baseline: number | null;
};
type DuLieu = { lop: { id: number; code: string }; lopThuong: boolean; coTheSuaTarget: boolean; rows: DongGoc[] };
type XemTruoc = { rows: { studentId: number; issues: VanDeNhap[] }[]; canhBaoMt: { studentId: number; cau: string }[] };

const COT: { key: Cot; nhan: string; rong: number; so?: boolean }[] = [
  { key: 'fullName', nhan: 'Họ và tên', rong: 190 }, { key: 'dob', nhan: 'Ngày sinh', rong: 168 },
  { key: 'email', nhan: 'Email', rong: 210 }, { key: 'startWeek', nhan: 'Tuần bắt đầu học', rong: 172 },
  { key: 'examDate', nhan: 'Dự kiến thi', rong: 168 }, { key: 'target', nhan: 'Target', rong: 76, so: true },
  { key: 'baseline', nhan: 'Điểm đầu vào', rong: 96, so: true },
];
/* Ô lộ trình (tuần, dự kiến thi, Target, điểm đầu vào): em chưa có lộ trình thì không sửa được ở đây. */
const O_LO_TRINH = new Set<Cot>(['startWeek', 'examDate', 'target', 'baseline']);
const moiKhoa = () => `suacalop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const chuGoc = (d: DongGoc, k: Cot) => (d[k] === null || d[k] === undefined ? '' : String(d[k]));

/**
 * PR-SL (Q-0310-3): SỬA THÔNG TIN CẢ LỚP trên một panel — lưới giống Thêm học viên, KHÔNG dán Excel. Một hàng một em đang học (A→Z),
 * bảy ô: Họ tên · Ngày sinh · Email · Tuần bắt đầu · Dự kiến thi · Target · Điểm đầu vào (lớp thường không có điểm đầu vào — `lopThuong`).
 * Ô đã đổi tô nhấn + chấm, mỗi ô có Hoàn tác về giá trị gốc. Xem trước tự động (400 ms) → lỗi đỏ dưới ô, cảnh báo MT dời vàng cuối hàng.
 * Lưu một lần, tất cả hoặc không gì (máy chủ). Đổi Target → một ô lý do chung. Đóng khi đang sửa → hỏi trước (chống mất dữ liệu).
 */
export function SuaCaLopPanel({ classId, onClose, onDone }: { classId: number; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const du = useApi<DuLieu>(`/classes/${classId}/sua-ca-lop`, [classId]);
  /** Chữ đã sửa theo em → ô. Ô không có trong đây = giữ giá trị gốc. */
  const [sua, setSua] = useState<Record<number, Partial<Record<Cot, string>>>>({});
  const [lyDo, setLyDo] = useState('');
  const [xem, setXem] = useState<XemTruoc | null>(null);
  const [busy, setBusy] = useState(false);
  const [hoiDong, setHoiDong] = useState(false);
  const lf = useLoiForm();
  const khoa = useRef(moiKhoa());

  const d = du.data;
  const cot = COT.filter((c) => !(d?.lopThuong && c.key === 'baseline'));
  const goc = useMemo(() => new Map((d?.rows ?? []).map((r) => [r.studentId, r])), [d]);

  /** Chỉ những ô KHÁC giá trị gốc (gõ lại đúng giá trị cũ = không đổi). */
  const daDoi = (sid: number): Partial<Record<Cot, string>> => {
    const g = goc.get(sid);
    if (!g) return {};
    return Object.fromEntries(Object.entries(sua[sid] ?? {}).filter(([k, v]) => v.trim() !== chuGoc(g, k as Cot))) as Partial<Record<Cot, string>>;
  };
  const dongDoi = (d?.rows ?? []).map((r) => ({ sid: r.studentId, doi: daDoi(r.studentId) })).filter((x) => Object.keys(x.doi).length);
  const soEm = dongDoi.length;
  const doiTarget = dongDoi.some((x) => x.doi.target !== undefined);

  /* Gửi lên máy chủ: chuỗi đã cắt; ô trống → null (xoá); Target theo chữ (KCK / số); điểm đầu vào nhận dấu phẩy. */
  const payload = dongDoi.map(({ sid, doi }) => {
    const r: Record<string, unknown> = { studentId: sid };
    for (const [k, v0] of Object.entries(doi)) {
      const v = v0!.trim();
      r[k] = k === 'fullName' ? v : k === 'baseline' ? (v ? v.replace(',', '.') : null) : v || null;
    }
    return r;
  });
  const payloadKey = JSON.stringify(payload);

  useEffect(() => {
    if (!payload.length) { setXem(null); return undefined; }
    const t = setTimeout(() => {
      api.post<XemTruoc>(`/classes/${classId}/sua-ca-lop/xem-truoc`, { rows: payload })
        .then(setXem).catch((e: any) => toast.push('error', e.message));
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payloadKey, classId]);

  const vanDe = (sid: number, k: Cot) => xem?.rows.find((x) => x.studentId === sid)?.issues.filter((i) => i.field === k) ?? [];
  const soLoi = xem ? xem.rows.reduce((n, x) => n + x.issues.filter((i) => i.muc === 'loi').length, 0) : 0;
  const loiLyDo = doiTarget && lyDo.trim().length < LY_DO_TOI_THIEU
    ? (lyDo.trim() ? `Cần ít nhất ${LY_DO_TOI_THIEU} ký tự.` : 'Ghi lý do đổi Target.') : null;
  const loiForm = loiLyDo ? [{ khoa: 'ly-do-target', nhan: 'Lý do đổi Target', lyDo: loiLyDo }] : [];

  const datO = (sid: number, k: Cot, v: string) => setSua((s) => ({ ...s, [sid]: { ...s[sid], [k]: v } }));
  const hoanTac = (sid: number, k: Cot) => setSua((s) => {
    const { [k]: _bo, ...con } = s[sid] ?? {};
    return { ...s, [sid]: con };
  });

  const dong = () => (soEm && !busy ? setHoiDong(true) : onClose());
  const luu = async () => {
    lf.bam();
    if (busy || !soEm || soLoi || !xem || loiLyDo) return;
    setBusy(true);
    try {
      const r = await api.post<{ daSua: number }>(`/classes/${classId}/sua-ca-lop`, {
        rows: payload, lyDoTarget: doiTarget ? lyDo.trim() : undefined, idempotencyKey: khoa.current,
      });
      toast.push('ok', `Đã cập nhật ${r.daSua} học viên`);
      onDone();
      onClose();
    } catch (e: any) {
      /* Giữ nguyên lưới đang sửa để thử lại; khoá mới để lần sau là một lần lưu mới. */
      khoa.current = moiKhoa();
      toast.push('error', e.message);
    } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe="Sửa thông tin học viên" lop={d ? `Lớp ${d.lop.code}` : null} rong="toan" onDong={dong}
      ngCanh={soEm ? `Đã sửa ${soEm} em` : 'Sửa thẳng trên lưới — ô đã đổi được tô nhấn, lưu một lần cho cả lớp'}
      chan={{
        daSua: soEm > 0, huy: { onClick: dong, disabled: busy },
        conThieu: lf.conThieu(loiForm),
        phu: soLoi > 0 ? <span className="text-xs text-late tabular-nums">{soLoi} ô cần sửa</span> : null,
        chinh: (
          <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={() => void luu()}
            disabled={busy || !soEm || soLoi > 0 || !xem}>
            {busy ? 'Đang lưu…' : soEm ? `Lưu ${soEm} em` : 'Lưu'}
          </button>
        ),
      }}>
      {du.error ? <ErrorState message={du.error.message} hint={du.error.hint} onRetry={du.reload} />
        : !d ? <Skeleton rows={6} />
        : !d.rows.length ? <p className="pt-3 text-sm text-slate-400">Lớp chưa có học viên đang học.</p>
        : (
          <div className="space-y-3 pt-3">
            {doiTarget && (
              <div className="max-w-xl">
                <Truong nhan="Lý do đổi Target" batBuoc phu="Áp cho mọi em đổi Target trong lần lưu này" loi={lf.loiCua(loiForm, 'ly-do-target')}>
                  <input className="field w-full" {...lf.o(loiForm, 'ly-do-target')} value={lyDo} onChange={(e) => setLyDo(e.target.value)}
                    placeholder="Ví dụ: Phụ huynh đổi Target sau buổi tư vấn" />
                </Truong>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-sm" style={{ minWidth: cot.reduce((n, c) => n + c.rong, 0) + 200 }}>
                <colgroup>
                  {cot.map((c) => <col key={c.key} style={{ width: c.rong }} />)}
                  <col style={{ width: 200 }} />
                </colgroup>
                <thead>
                  <tr>
                    {cot.map((c) => (
                      <Th key={c.key} align={c.so ? 'right' : 'left'}
                        className={c.key === 'fullName' ? 'sticky-col' : ''}
                        hint={c.key === 'target' && !d.coTheSuaTarget ? 'Chỉ Quản lý đổi Target' : c.key === 'target' ? `Band 0–9, bước 0,5. Gõ ${KCK} nếu em không cam kết đầu ra.` : undefined}>
                        {c.nhan}
                      </Th>
                    ))}
                    <Th>Lưu ý</Th>
                  </tr>
                </thead>
                <tbody>
                  {d.rows.map((r) => {
                    const doi = daDoi(r.studentId);
                    const mt = xem?.canhBaoMt.find((x) => x.studentId === r.studentId);
                    return (
                      <tr key={r.studentId}>
                        {cot.map((c) => {
                          const v = sua[r.studentId]?.[c.key] ?? chuGoc(r, c.key);
                          const daSuaO = doi[c.key] !== undefined;
                          const loi = daSuaO ? vanDe(r.studentId, c.key).find((i) => i.muc === 'loi')?.message ?? null : null;
                          const khoaO = (O_LO_TRINH.has(c.key) && !r.coLoTrinh) || (c.key === 'target' && !d.coTheSuaTarget);
                          const nhan = `${c.nhan} · ${r.fullName}`;
                          const idLoi = `loi-${r.studentId}-${c.key}`;
                          return (
                            <td key={c.key} className={`td px-1.5 py-1.5 align-top${c.key === 'fullName' ? ' sticky-col' : ''}`}
                              style={daSuaO ? { background: 'rgb(var(--chon-bg-rgb))' } : undefined}>
                              <div className="flex items-center gap-1">
                                <span className="min-w-0 flex-1">
                                  {c.key === 'dob' || c.key === 'startWeek' || c.key === 'examDate' ? (
                                    <ONgay gon kieu={c.key === 'dob' ? 'ngay' : c.key === 'startWeek' ? 'tuan' : 'ngay-hoac-thang'}
                                      value={v} ariaLabel={nhan} invalid={!!loi} moTa={loi ? idLoi : undefined} disabled={khoaO}
                                      onChange={(x) => datO(r.studentId, c.key, x)} />
                                  ) : (
                                    <input className={`field w-full${c.so ? ' text-right tabular-nums' : ''}${loi ? ' border-late' : ''}`}
                                      value={v} aria-label={nhan} aria-invalid={!!loi || undefined} aria-describedby={loi ? idLoi : undefined}
                                      disabled={khoaO} title={khoaO ? (c.key === 'target' && !d.coTheSuaTarget ? 'Chỉ Quản lý đổi Target' : 'Em chưa có lộ trình') : undefined}
                                      type={c.key === 'email' ? 'email' : 'text'} autoComplete="off"
                                      inputMode={c.key === 'baseline' ? 'decimal' : c.key === 'email' ? 'email' : undefined}
                                      onChange={(e) => datO(r.studentId, c.key, e.target.value)}
                                      onBlur={c.key === 'target' ? (e) => { if (laKck(e.target.value) && e.target.value !== KCK) datO(r.studentId, 'target', KCK); } : undefined} />
                                  )}
                                </span>
                                {daSuaO && (
                                  <button type="button" className="btn btn-sm btn-ghost min-h-[44px] min-w-[44px] justify-center px-1 sm:min-h-[28px] sm:min-w-[28px]"
                                    title={`Hoàn tác — về "${chuGoc(r, c.key) || 'trống'}"`} aria-label={`Hoàn tác ${nhan}`}
                                    onClick={() => hoanTac(r.studentId, c.key)}>↺</button>
                                )}
                              </div>
                              {loi && <span id={idLoi} className="mt-1 block text-[11px] text-late">{loi}</span>}
                            </td>
                          );
                        })}
                        <td className="td px-2 py-1.5 align-top text-xs">
                          {mt ? <span className="text-soon">{mt.cau}</span>
                            : Object.keys(doi).length ? <span className="inline-flex items-center gap-1.5 text-slate-300"><span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: 'rgb(var(--soon-rgb))' }} />đã sửa</span>
                            : <span className="text-slate-500">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      <ConfirmDialog open={hoiDong} onClose={() => setHoiDong(false)} onConfirm={() => { setHoiDong(false); onClose(); }} danger
        title="Bỏ những gì vừa sửa?" closeLabel="Tiếp tục sửa" confirmLabel="Bỏ thay đổi"
        body={`Đã sửa ${soEm} em nhưng chưa lưu. Đóng panel thì các thay đổi này mất.`} />
    </KhungPanel>
  );
}
