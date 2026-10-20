import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { LichSuThayDoi } from '../../ui/LichSuThayDoi.tsx';
import { KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { MONTH_CODE, hienTargetKck, ketQuaThiThat, ngay } from '@shared/domain/index.ts';
import { laBand } from './StudentPlanPanel.tsx';
import { dich, t } from '@shared/i18n/index.ts';
import { PanelBuocTiep } from './PanelBuocTiep.tsx';
import { HopGiaHan } from './HopGiaHan.tsx';

const KY_NANG = ['l', 'r', 'w', 's'] as const;
const fmt = (v: number | null | undefined) => (v === null || v === undefined ? '' : v.toFixed(1));
const toneKq = (n: string) => (n === 'Đạt Target' ? 'ok' : n === 'Chưa đạt Target' ? 'bad' : 'muted') as 'ok' | 'bad' | 'muted';

/** Nhãn "Dự kiến thi" từ cột lộ trình: ngày → dd/mm; tháng → SEP 2026; chưa có → null. */
function nhanThi(c: any, homNay: string | null): string | null {
  if (c.exam_date) return ngay(c.exam_date, homNay);
  if (c.exam_month && /^\d{4}-\d{2}$/.test(c.exam_month)) return `${MONTH_CODE[Number(c.exam_month.slice(5)) - 1]} ${c.exam_month.slice(0, 4)}`;
  return null;
}

/**
 * KẾT QUẢ THI THẬT (PR-TK, TK-K) — GVCN lớp cuối / Quản lý nhập điểm IELTS em báo về: ngày thi, L R W S, hoặc "Không thi". OVR tự tính (chỉ đọc),
 * Đạt / Chưa đạt Target do máy so — không còn ô chọn kết luận. Thay "Kết luận lộ trình". Chữ đúng mockup (màn "GVCN nhập thi thật").
 */
export function KetQuaThiThatPanel({ cycleId, studentName, lop, quayLai, onClose, onDone }: {
  cycleId: number; studentName: string; lop?: string | null;
  /** OV-11d (HV-9): mở TRONG ngăn Tổng kết (thay nội dung, dòng "← Tổng kết") — không panel chồng. */
  quayLai?: { nhan: string; onClick: () => void }; onClose: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const { data: c, error, reload } = useApi<any>(`/cycles/${cycleId}`, [cycleId]);
  /* OV-13q: "Đã thi … · hạn …" + Gia hạn (cùng `trangThaiSauThi` với dòng việc). */
  const sauThi = useApi<{ giaiDoan: string; ngayThi: string | null; han: string | null; daGiaHan: boolean; coTheGiaHan: boolean }>(`/cycles/${cycleId}/han-sau-thi`, [cycleId]);
  const [giaHan, setGiaHan] = useState(false);
  const [form, setForm] = useState<{ ngay: string; l: string; r: string; w: string; s: string; khongThi: boolean; ghiChu: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [goc, setGoc] = useState<string | null>(null);
  /* OV-13m: lưu xong → panel đổi TẠI CHỖ thành "Bước tiếp" (kết quả còn một dòng "✓ … · Sửa"); Sửa → về form, chữ đã lưu giữ nguyên. */
  const [buocTiep, setBuocTiep] = useState(false);
  const [lichSu, setLichSu] = useState(false);   // OV-15g: thay nội dung panel (← Kết quả thi thật), chữ đang gõ giữ nguyên
  const lf = useLoiForm();

  /* Nạp giá trị đang lưu MỘT LẦN — tải lại nền không được xoá điều người dùng đang gõ. */
  if (c && !form) {
    const f = { ngay: c.thi_that_ngay ?? '', l: fmt(c.thi_that_l), r: fmt(c.thi_that_r), w: fmt(c.thi_that_w), s: fmt(c.thi_that_s), khongThi: !!c.thi_that_khong_thi, ghiChu: c.outcome_note ?? '' };
    setForm(f); setGoc(JSON.stringify(f));
  }
  if (lichSu) {
    return <LichSuThayDoi loai="thi-that" id={cycleId} dong2={[studentName, lop]} quayLai={{ nhan: t('Kết quả thi thật'), onClick: () => setLichSu(false) }} onClose={onClose} />;
  }
  if (buocTiep) {
    return <PanelBuocTiep cycleId={cycleId} hocVien={c ? { id: c.student_id, ten: studentName } : null} lop={lop} quayLai={quayLai}
      onSuaKetQua={() => { setBuocTiep(false); reload(); }} onClose={() => { onDone(); onClose(); }} />;
  }
  if (error) return <KhungPanel tieuDe={t('Kết quả thi thật')} hocVien={studentName} lop={lop} quayLai={quayLai} rong={quayLai ? 'rong' : undefined} onDong={onClose}><ErrorState message={error.message} hint={error.hint} onRetry={reload} /></KhungPanel>;
  if (!c || !form) return <KhungPanel tieuDe={t('Kết quả thi thật')} hocVien={studentName} lop={lop} quayLai={quayLai} rong={quayLai ? 'rong' : undefined} onDong={onClose}><Skeleton rows={5} /></KhungPanel>;

  const st = sauThi.data;
  const target: number | null = c.target_score ?? null;   // OV-9: KCK giữ Target — so như máy chủ (`ketQuaThiThat`)
  const so = (s: string) => (s.trim() === '' ? null : Number(s));
  const sai = (s: string) => s.trim() !== '' && !laBand(s);
  const diem = { l: so(form.l), r: so(form.r), w: so(form.w), s: so(form.s) };
  const loiDiem = KY_NANG.some((k) => sai(form[k]));
  const loiNgay = !form.khongThi && form.ngay !== '' && !!homNay && form.ngay > homNay;
  const loi = [
    ...KY_NANG.filter((k) => sai(form[k])).map((k) => ({ khoa: `diem-${k}`, nhan: k.toUpperCase(), lyDo: t('0–9, bước 0.5') })),
    ...(loiNgay ? [{ khoa: 'ngay', nhan: t('Ngày thi'), lyDo: t('Không sau hôm nay') }] : []),
  ];
  const kq = loiDiem ? null : ketQuaThiThat({ ...diem, khongThi: form.khongThi }, target);
  const dat = (k: keyof typeof form, v: string | boolean) => setForm({ ...form, [k]: v });

  const luu = async () => {
    lf.bam();
    if (loi.length > 0) return;
    setBusy(true);
    try {
      await api.put(`/cycles/${cycleId}/outcome`, form.khongThi
        ? { khongThi: true, ghiChu: form.ghiChu }
        : { khongThi: false, ngayThi: form.ngay || null, ...diem, ghiChu: form.ghiChu });
      invalidate('/students'); invalidate('/lo-trinh'); invalidate('/classes'); invalidate('/hoc-vien-lop'); invalidate('/work'); invalidate('/my-work'); invalidate('/cycles');
      const kqMoi = form.khongThi || KY_NANG.every((k) => form[k].trim() !== '');
      setGoc(JSON.stringify(form));
      /* Đủ kết quả (4 kỹ năng hoặc Không thi) → Bước tiếp tại chỗ; chưa đủ → lưu như cũ rồi đóng. */
      if (kqMoi) setBuocTiep(true);
      else { toast.push('ok', t('Đã lưu')); onDone(); onClose(); }
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe={t('Kết quả thi thật')} hocVien={studentName} lop={lop} quayLai={quayLai} rong={quayLai ? 'rong' : undefined} onDong={onClose}
      chan={{ huy: { onClick: onClose }, daSua: JSON.stringify(form) !== goc, conThieu: lf.conThieu(loi), chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={luu} disabled={busy}>{t('Lưu')}</button> }}>
      <div className="max-w-[560px] space-y-3">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-slate-400">
          <span>Target <b className="tabular-nums text-slate-200">{hienTargetKck(target !== null ? target.toFixed(1) : null, !!c.khong_cam_ket)}</b></span>
          <span>{t('Dự kiến thi')} <b className="tabular-nums text-slate-200">{nhanThi(c, homNay) ?? '—'}</b></span>
          {st?.giaiDoan === 'da_thi_cho_kq' && st.han && (
            <span>{t('Hạn sau thi')} <b className="tabular-nums text-slate-200">{ngay(st.han, homNay)}</b>{st.daGiaHan ? ` · ${t('đã gia hạn')}` : ''}
              {st.coTheGiaHan && <>{' · '}<button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 font-semibold sm:min-h-0" onClick={() => setGiaHan(true)}>{t('Gia hạn')}</button></>}
            </span>
          )}
          <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 sm:ml-auto sm:min-h-0" onClick={() => setLichSu(true)}>{t('Lịch sử')}</button>
        </div>
        {giaHan && st && <HopGiaHan x={{ cycleId, han: st.han, daGiaHan: st.daGiaHan }} hocVien={studentName} lop={lop} onClose={() => setGiaHan(false)} onDone={() => { sauThi.reload(); onDone(); }} />}
        <label className="flex min-h-[44px] items-center gap-2 text-[13px] text-slate-300 sm:min-h-0">
          <input type="checkbox" checked={form.khongThi} onChange={(e) => dat('khongThi', e.target.checked)} /> {t('Không thi')}
        </label>
        {form.khongThi ? (
          <Truong nhan={t('Ghi chú')}>
            <input className="field w-full" value={form.ghiChu} onChange={(e) => dat('ghiChu', e.target.value)} />
          </Truong>
        ) : (
          <>
            <div className="max-w-[200px]">
              <Truong nhan={t('Ngày thi')} loi={lf.loiCua(loi, 'ngay')}>
                <ONgay kieu="ngay" toiDa={homNay} toiThieu={c.started_at?.slice(0, 10)} id={lf.oId('ngay')} value={form.ngay} onChange={(v) => dat('ngay', v)} invalid={!!lf.loiCua(loi, 'ngay')} />
              </Truong>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {KY_NANG.map((k) => (
                <Truong key={k} nhan={k.toUpperCase()} loi={lf.loiCua(loi, `diem-${k}`)}>
                  <input className="field w-full tabular-nums" inputMode="decimal" {...lf.o(loi, `diem-${k}`)} value={form[k]}
                    onChange={(e) => dat(k, e.target.value)} />
                </Truong>
              ))}
              <div className="col-span-4 sm:col-span-1">
                {/* OV-11d (HV-22): OVR máy tính — chữ, không trông như ô nhập (như "Overall tự tính" ở Sửa thông tin). */}
                <span className="block text-xs text-slate-400">OVR</span>
                <strong className="mt-1.5 block text-sm tabular-nums text-slate-100" aria-label={t('OVR tự tính')}>{kq?.ovr != null ? kq.ovr.toFixed(1) : '—'}</strong>
              </div>
            </div>
            {kq && kq.nhan !== 'Chờ kết quả thi thật' && <div><Nhan tone={toneKq(kq.nhan)}>{dich(kq.nhan)}</Nhan></div>}
          </>
        )}
      </div>
    </KhungPanel>
  );
}
