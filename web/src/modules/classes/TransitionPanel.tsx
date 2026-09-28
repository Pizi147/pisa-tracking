import { useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { ErrorState, Skeleton, Th } from '../../ui/ui.tsx';
import {
  HUONG_CHUYEN_TIEP, kiemDongChuyenTiep, nhanHuong, nhanHuongNgan, tomTatChuyenTiep, tuanLich,
  type DongTomTat, type Huong,
} from '@shared/domain/index.ts';
import { ClassCreatePanel } from './ClassCreatePanel.tsx';

type Dong = {
  huong: Huong | ''; toClassId: number | 'new' | ''; mucTieu: string; thangThi: string; lyDo: string; ngayXemLai: string;
};

/**
 * CHUYỂN TIẾP CẢ LỚP KHI HỌC HẾT CHƯƠNG TRÌNH — mục 6.1, §3.9.2 (PR-LT: mỗi em một HƯỚNG).
 *
 * HAI BƯỚC (mockup 11-2): Soạn (bảng mỗi em một hướng + lớp đích + phần cần điền thêm, dòng
 * lỗi hiện ngay) rồi Xác nhận (tóm tắt bằng câu, không phải bảng số). Hệ thống KHÔNG tự chuyển
 * ai — mọi hướng đều do người xếp lớp chọn, điền sẵn từ Lộ trình tiếp theo nếu đã có.
 */
export function TransitionPanel({ classId, open, onClose, onDone }: {
  classId: number; open: boolean; onClose: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const { data, loading, error, reload } = useApi<any>(open ? `/classes/${classId}/transition` : null, [classId, open]);
  const [buoc, setBuoc] = useState<1 | 2>(1);
  const [busy, setBusy] = useState(false);

  const [bulkTarget, setBulkTarget] = useState<number | 'new' | ''>('');
  const [dongs, setDongs] = useState<Record<number, Partial<Dong>>>({});
  const [ngay, setNgay] = useState('');
  const [taoLop, setTaoLop] = useState(false);

  const [loaded, setLoaded] = useState(false);
  if (data && !loaded) {
    setLoaded(true);
    setNgay(data.today ?? '');
  }

  const close = () => { onClose(); setBuoc(1); setLoaded(false); setDongs({}); };

  /** Hướng/lớp đích MẶC ĐỊNH của một em: dự định đã ghi (Lộ trình tiếp theo), rồi mới tới lớp đích chung (chỉ khi hướng là "Lên …"). */
  const dongCua = (s: any): Dong => {
    const banGhi = s.loTrinhTiep;
    const macDinhHuong = (banGhi?.huong && banGhi.huong !== 'chua_ro' ? banGhi.huong : '') as Huong | '';
    /*
     * Lớp dự kiến đã ghi lúc "Lộ trình tiếp theo" có thể KHÔNG còn là ứng viên hợp lệ nữa (lớp
     * đã hết khoá/đóng từ đó tới nay, đổi chương trình…) — không điền sẵn ngầm một id không còn
     * đúng: BỎ CHỌN, để dòng hiện rõ lỗi "Thiếu lớp đích" thay vì gửi lên một lớp đích sai
     * (sửa sau rà PR #86, vấn đề 7a).
     */
    const lopDuKienGhiSan = banGhi?.lopDuKienId ?? '';
    const macDinhToClassId = lopDuKienGhiSan && lopHopLe(macDinhHuong).some((c: any) => c.id === lopDuKienGhiSan)
      ? lopDuKienGhiSan : '';
    const macDinh: Dong = {
      huong: macDinhHuong,
      toClassId: macDinhToClassId,
      mucTieu: banGhi?.mucTieu != null ? String(banGhi.mucTieu) : '',
      thangThi: banGhi?.thangThi ?? '',
      lyDo: banGhi?.lyDo ?? '', ngayXemLai: banGhi?.ngayXemLai ?? '',
    };
    const ghiDe = dongs[s.id] ?? {};
    const ket = { ...macDinh, ...ghiDe };
    if (!ghiDe.toClassId && !macDinh.toClassId && ket.huong === 'len_lop' && bulkTarget) ket.toClassId = bulkTarget;
    return ket;
  };
  const suaDong = (sid: number, patch: Partial<Dong>) => {
    if (patch.toClassId === 'new') setTaoLop(true);
    setDongs((m) => ({ ...m, [sid]: { ...m[sid], ...patch } }));
  };
  /**
   * "+ Mở lớp mới" (K2-16, Q8) mở panel Tạo lớp (lớp thật, tạo ngay). Tạo xong: mọi dòng đang chọn "+ Mở lớp mới" và lớp đích
   * chung nhận lớp đó; huỷ: bỏ chọn. Chuyển tiếp là `KhungPanel longTrong` (không ở `khoPanelChung`) nên panel Tạo lớp mở
   * đè được mà Chuyển tiếp không mất state; khi Tạo lớp mở, `onDong` rỗng để Esc chỉ đóng panel trên.
   */
  const ganLopMoi = (v: number | '') => {
    setDongs((m) => Object.fromEntries(Object.entries(m).map(([k, d]) => [k, d.toClassId === 'new' ? { ...d, toClassId: v } : d])));
    setBulkTarget((b) => (b === 'new' ? v : b));
  };

  const lopHopLe = (huong: Huong | ''): any[] => (data?.candidates ?? []).filter((c: any) => (
    huong === 'fast_track' ? c.ft : huong === 'hoc_lai' ? !c.ft && c.programmeCode === data.from.programmeCode : !c.ft
  ));

  const kiemTra = (s: any, d: Dong): string | null => {
    if (!d.huong) return 'Chọn một hướng.';
    const toClassId = typeof d.toClassId === 'number' ? d.toClassId : null;
    const c = toClassId ? data.candidates.find((x: any) => x.id === toClassId) : null;
    return kiemDongChuyenTiep({
      huong: d.huong, toClassId, toClass: c ? { ma: c.programmeCode, ft: c.ft } : null,
      mucTieu: d.mucTieu ? Number(d.mucTieu) : null, thangThi: d.thangThi || null,
      lyDo: d.lyDo || null, ngayXemLai: d.ngayXemLai || null,
    }, { maTu: data.from.programmeCode });
  };

  const students: any[] = data?.students ?? [];
  const rows = students.map((s) => {
    const d = dongCua(s);
    return { s, d, loi: kiemTra(s, d) };
  });
  const coLoi = rows.some((r) => r.loi);

  const tomTat: ReturnType<typeof tomTatChuyenTiep> = tomTatChuyenTiep(
    rows.filter((r) => r.d.huong).map((r): DongTomTat => ({
      huong: r.d.huong as Huong,
      toClassCode: typeof r.d.toClassId === 'number' ? data.candidates.find((c: any) => c.id === r.d.toClassId)?.code ?? null : null,
      mucTieu: r.d.mucTieu ? Number(r.d.mucTieu) : null,
      caseCount: r.s.caseMo?.tong ?? 0,
      caseWillClose: r.d.huong === 'fast_track' && (r.s.caseMo?.seDongNeuSangFt ?? 0) > 0,
      baiChuaLam: r.s.baiChuaLam ?? 0,
    })),
  );
  /* Nút "Xác nhận chuyển n HV" chỉ đếm em THẬT SỰ đổi lớp — bảo lưu/dừng học/xếp sau không đổi lớp (sửa sau rà PR #86, vấn đề 7b). */
  const soDoiLop = rows.filter((r) => r.d.huong === 'len_lop' || r.d.huong === 'hoc_lai' || r.d.huong === 'fast_track').length;

  const submit = async () => {
    setBusy(true);
    try {
      const r = await api.post<any>(`/classes/${classId}/transition`, {
        effectiveDate: ngay,
        dongs: rows.filter((r) => r.d.huong).map((r) => ({
          studentId: r.s.id, huong: r.d.huong,
          toClassId: typeof r.d.toClassId === 'number' ? r.d.toClassId : undefined,
          mucTieu: r.d.mucTieu ? Number(r.d.mucTieu) : undefined, thangThi: r.d.thangThi || undefined,
          lyDo: r.d.lyDo || undefined, ngayXemLai: r.d.ngayXemLai || undefined,
        })),
      });
      invalidate('/classes'); invalidate('/students'); invalidate('/attempts'); invalidate('/overview'); invalidate('/hoc-vien-lop'); invalidate('/my-work');
      toast.push(r.failed.length ? 'info' : 'ok', `Đã chuyển ${r.done.length} học viên`);
      if (r.lopCuDaKetThuc) toast.push('info', `Lớp ${data.from.code} đã kết thúc`);
      if (r.failed.length) {
        for (const f of r.failed.slice(0, 3)) toast.push('error', f.message);
        setBuoc(1);
      } else { onDone(); close(); }
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <>
    {open && (
    <KhungPanel longTrong rong="rong" onDong={taoLop ? () => {} : close}
      tieuDe={data ? `Chuyển tiếp lớp · ${data.from.code} kết thúc ${data.tuanKetThuc ? tuanLich(data.tuanKetThuc, data.today) : ''} · ${students.length} HV` : 'Chuyển tiếp lớp'}
      chan={buoc === 1 ? {
        huy: { nhan: 'Đóng', onClick: close, disabled: busy },
        chinh: (
          <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={() => setBuoc(2)} disabled={coLoi || !data?.canEdit}
            title={coLoi ? `Còn ${rows.filter((r) => r.loi).length} em chưa điền đủ` : undefined}>
            Tiếp tục
          </button>
        ),
      } : {
        huy: { nhan: 'Quay lại', onClick: () => setBuoc(1), disabled: busy },
        chinh: (
          <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={submit} disabled={busy}>
            {busy ? 'Đang chuyển…' : `Xác nhận chuyển ${soDoiLop} HV`}
          </button>
        ),
      }}
    >
      {error && <ErrorState message={error.message} hint={error.hint} onRetry={reload} />}
      {loading && <Skeleton rows={8} />}
      {data && buoc === 1 && (
        <div className="space-y-4 pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-500 m-0" title="Hệ thống không tự chuyển ai. Lớp cũ giữ nguyên trong lịch sử.">
              ⓘ Mỗi em chọn một hướng riêng. Chưa xác nhận thì chưa đổi gì.
            </p>
            <div className="flex items-center gap-2">
              <span className="label m-0" aria-hidden>Ngày chuyển</span>
              <span className="w-44"><ONgay kieu="ngay" value={ngay} onChange={setNgay} ariaLabel="Ngày chuyển" /></span>
            </div>
          </div>

          {data.alreadyLinked?.length > 0 && (
            <div className="text-xs text-amber-200">
              Lớp này đã có lớp kế tiếp: {data.alreadyLinked.map((c: any) => c.code).join(', ')}.
            </div>
          )}

          <label className="block">
            <span className="label">Lớp đích cho cả lớp</span>
            <select className="field w-full sm:w-auto" value={bulkTarget}
              onChange={(e) => {
                if (e.target.value === 'new') setTaoLop(true);
                setBulkTarget(e.target.value === 'new' ? 'new' : e.target.value ? Number(e.target.value) : '');
              }}>
              <option value="">Chưa chọn</option>
              <option value="new">+ Mở lớp mới…</option>
              {(data.candidates ?? []).map((c: any) => (
                <option key={c.id} value={c.id}>{c.code} · đang có {c.studentCount} HV</option>
              ))}
            </select>
            <span className="block text-[11px] text-slate-500 mt-1">Áp cho mọi em đang chọn hướng "Lên …" mà chưa sửa riêng.</span>
          </label>

          <div className="surface-2 rounded-lg overflow-x-auto sm:overflow-visible">
            <table className="w-full text-sm hidden sm:table">
              <colgroup><col className="w-1/4" /><col className="w-1/5" /><col className="w-1/4" /><col /></colgroup>
              <thead>
                <tr>
                  <Th>Học viên</Th><Th>Lộ trình tiếp theo</Th><Th>Lớp đích</Th><Th>Cần điền thêm</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ s, d, loi }) => (
                  <DongBang key={s.id} s={s} d={d} loi={loi} suaDong={(p) => suaDong(s.id, p)} lopHopLe={lopHopLe} fromMa={data.from.programmeCode} />
                ))}
              </tbody>
            </table>
            {/* 375px (G-11): mỗi em một thẻ, không bảng cuộn ngang. */}
            <div className="sm:hidden divide-y" style={{ borderColor: 'var(--line)' }}>
              {rows.map(({ s, d, loi }) => (
                <div key={s.id} className="p-3 space-y-2">
                  <div className="text-sm text-slate-100">{s.fullName}</div>
                  <DongThe s={s} d={d} loi={loi} suaDong={(p) => suaDong(s.id, p)} lopHopLe={lopHopLe} fromMa={data.from.programmeCode} />
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
      {data && buoc === 2 && (
        <div className="space-y-3 pt-3">
          <div className="surface-2 rounded-lg p-3">
            <ul className="list-disc pl-5 m-0 space-y-1">
              {tomTat.cau.map((c, i) => <li key={i} className="text-sm text-slate-200">{c}</li>)}
            </ul>
            {tomTat.baiChuaLam > 0 && (
              <p className="text-xs text-amber-200 mt-2 mb-0">{tomTat.baiChuaLam} em còn bài Cuối khoá chưa có điểm.</p>
            )}
          </div>
        </div>
      )}
    </KhungPanel>
    )}
    {open && taoLop && data && (
      <ClassCreatePanel moHoSo={false}
        macDinh={{ ...(data.goiYLopMoi ?? { branchId: data.from.branchId }), previousClassId: data.from.id }}
        onDone={(lop) => { reload(); ganLopMoi(lop.id); }}
        onClose={() => { ganLopMoi(''); setTaoLop(false); }} />
    )}
    </>
  );
}

function CanDienThem({ s, d, suaDong }: { s: any; d: Dong; suaDong: (p: Partial<Dong>) => void }) {
  if (d.huong === 'fast_track') return (
    <div className="flex flex-wrap items-end gap-1.5">
      <input className="field w-20 tabular-nums" type="number" step="0.5" min={0} max={9} placeholder="Mục tiêu" aria-label="Mục tiêu"
        value={d.mucTieu} onChange={(e) => suaDong({ mucTieu: e.target.value })} />
      <span className="block w-36">
        <span className="block text-[10.5px] text-slate-500 mb-0.5" aria-hidden>Dự kiến thi</span>
        <ONgay kieu="thang" value={d.thangThi} onChange={(v) => suaDong({ thangThi: v })} ariaLabel="Tháng dự kiến thi" />
      </span>
    </div>
  );
  if (d.huong === 'bao_luu' || d.huong === 'xep_sau') return (
    <div className="flex flex-wrap items-end gap-1.5">
      <input className="field flex-1 min-w-[8rem]" placeholder="Lý do" aria-label="Lý do" value={d.lyDo} onChange={(e) => suaDong({ lyDo: e.target.value })} />
      <span className="block w-40">
        <span className="block text-[10.5px] text-slate-500 mb-0.5" aria-hidden>Xem lại</span>
        <ONgay kieu="ngay" value={d.ngayXemLai} onChange={(v) => suaDong({ ngayXemLai: v })} ariaLabel="Ngày xem lại" />
      </span>
    </div>
  );
  if (d.huong === 'dung_hoc') return (
    <input className="field w-full" placeholder="Lý do" value={d.lyDo} onChange={(e) => suaDong({ lyDo: e.target.value })} />
  );
  void s;
  return <span className="text-slate-600">—</span>;
}

function OLopDich({ d, suaDong, lopHopLe }: {
  d: Dong; suaDong: (p: Partial<Dong>) => void; lopHopLe: (h: Huong | '') => any[];
}) {
  if (!d.huong || d.huong === 'bao_luu' || d.huong === 'dung_hoc' || d.huong === 'xep_sau') {
    return <span className="text-slate-600">không chuyển</span>;
  }
  return (
    <select className="field w-full" value={d.toClassId} onChange={(e) => suaDong({ toClassId: e.target.value === 'new' ? 'new' : e.target.value ? Number(e.target.value) : '' })}>
      <option value="">Chưa chọn</option>
      <option value="new">+ Mở lớp mới…</option>
      {lopHopLe(d.huong).map((c: any) => <option key={c.id} value={c.id}>{c.code}</option>)}
    </select>
  );
}

function DongBang({ s, d, loi, suaDong, lopHopLe, fromMa }: {
  s: any; d: Dong; loi: string | null; suaDong: (p: Partial<Dong>) => void; lopHopLe: (h: Huong | '') => any[];
  fromMa: string | null;
}) {
  const trong = !d.huong;
  return (
    <tr className="row-hover align-top">
      <td className="td">
        <div className="text-slate-100">{s.fullName}</div>
        <div className="text-[11px] text-slate-500">{s.studentCode}</div>
        {loi && <div className="text-[11px] text-rose-300 mt-1">{loi}</div>}
      </td>
      <td className="td" style={trong ? { boxShadow: 'inset 0 0 0 1px var(--warn, #fbbf24)', borderRadius: 6 } : undefined}>
        <select className="field w-full" value={d.huong} onChange={(e) => suaDong({ huong: e.target.value as Huong, toClassId: '' })}>
          <option value="">Chưa chọn</option>
          {HUONG_CHUYEN_TIEP.map((h) => <option key={h} value={h}>{nhanHuongNgan(h, { ma: fromMa as any, maKe: null })}</option>)}
        </select>
      </td>
      <td className="td"><OLopDich d={d} suaDong={suaDong} lopHopLe={lopHopLe} /></td>
      <td className="td"><CanDienThem s={s} d={d} suaDong={suaDong} /></td>
    </tr>
  );
}

function DongThe({ s, d, loi, suaDong, lopHopLe, fromMa }: {
  s: any; d: Dong; loi: string | null; suaDong: (p: Partial<Dong>) => void; lopHopLe: (h: Huong | '') => any[];
  fromMa: string | null;
}) {
  return (
    <div className="space-y-1.5">
      <select className="field w-full" value={d.huong} onChange={(e) => suaDong({ huong: e.target.value as Huong, toClassId: '' })}>
        <option value="">Chưa chọn hướng</option>
        {HUONG_CHUYEN_TIEP.map((h) => <option key={h} value={h}>{nhanHuong(h, { ma: fromMa as any, maKe: null })}</option>)}
      </select>
      <OLopDich d={d} suaDong={suaDong} lopHopLe={lopHopLe} />
      <CanDienThem s={s} d={d} suaDong={suaDong} />
      {loi && <div className="text-[11px] text-rose-300">{loi}</div>}
    </div>
  );
}
