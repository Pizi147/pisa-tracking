import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Han } from '../../ui/Han.tsx';
import { Level, NutChon } from '../../ui/ui.tsx';
import { Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { ONgay } from '../../ui/ONgay.tsx';
import { REGULAR_SKILLS, chuHopKetLuan, dsLoi, duongLoTrinhLop, ngay, tenMon, tenMonNgan, type GoiYCuoiKhoa } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/** `studentProfile().cuoiKhoa` — cùng hình với `EmCuoiKhoa` của máy chủ. */
export type CuoiKhoaEm = {
  attemptId: number | null; tyLe: number | null; scored: number; required: number; monTruot: string[];
  mon: { skill: string; ratio: number | null }[]; goiY: GoiYCuoiKhoa | null;
  quyetDinh: { huong: string; luc: string } | null;
  ketLuanFt: { dat: boolean | null; nguyenNhan: 'trung_tam' | 'hoc_sinh' | null; mon: string[]; ghiChu: string | null } | null;
  /** PR-KV: gợi ý Kết quả đầu ra theo MT0 (FOU/BE/ELE) — kỹ năng điền sẵn ở "Không đạt". */
  kyVongMt0?: { monTruot: string[] } | null;
  /** PR-S5F-a: lớp của bài Cuối khoá (có thể là lớp em VỪA RỜI — `daChuyen`). */
  ct?: string | null; lop?: string | null; daChuyen?: boolean;
};
export type MiniTestEm = {
  id: number; soBuoi: number; ngayDuKien: string; han: string; tyLe: number | null; ngayLam: string | null;
  caseId: number | null; paId: number | null; coTheGhi: boolean;
  /** OV-7a: người ghi được (người dạy · GVCN · người giữ việc · QL) sửa % và ngày của Mini Test đã ghi. */
  coTheSua?: boolean;
};

const TONE = { ok: 'ok', warn: 'warn', bad: 'danger', muted: 'muted' } as const;

/**
 * HỘP "KẾT LUẬN KHOÁ" (PR-LT2b, K3 §4b, K3-43, T49) — Nằm ở: Hồ sơ HV → tab Học thuật → ngay trên bảng "Tiến độ và hỗ trợ theo kỹ năng"
 * (chỉ em đang học lớp thường đã có điểm Cuối khoá). Dòng 1: % Cuối khoá (tầng 1) + % từng môn · dòng 2: MỘT nhãn hướng/trạng thái ·
 * FOU/BE/ELE: dòng Kết quả đầu ra (Quản lý: Đạt / Không đạt) · nút phụ Lộ trình tiếp theo (OV-3b: sang bảng lớp, mở hộp của em). Không có nút "Chuyển tiếp" — việc chuyển ở PR-CT.
 */
export function KetLuanKhoa({ studentId, studentName, lop, classId, ct, cuoiKhoa, coTheKetLuan, onDoi }: {
  studentId: number; studentName: string; lop: string | null; classId: number | null; ct: string | null;
  cuoiKhoa: CuoiKhoaEm; coTheKetLuan: boolean; onDoi: () => void;
}) {
  const { homNay } = useNgayNghiepVu();
  const [moKhongDat, setMoKhongDat] = useState(false);
  const toast = useToast();
  const h = chuHopKetLuan({ ct, ...cuoiKhoa, homNay });
  const danhDauDat = async () => {
    try {
      await api.put(`/students/${studentId}/ket-luan-ft`, { dat: true });
      invalidate('/students'); toast.push('ok', t('Đã ghi: đạt Kỳ vọng')); onDoi();
    } catch (e: any) { toast.push('error', e.message); }
  };
  return (
    <section id="ket-luan-khoa" aria-label={t('Kết luận khoá')} className="rounded-lg border p-3 space-y-1.5" style={{ borderColor: 'var(--line)' }}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <span className="text-lg font-bold tabular-nums text-slate-100">{h.chinh}</span>
        {h.phu && <span className="text-xs tabular-nums text-slate-400">{h.phu}</span>}
        {cuoiKhoa.daChuyen && cuoiKhoa.lop && <span className="text-xs text-slate-500">{t('lớp {lop} (đã chuyển)', { lop: cuoiKhoa.lop })}</span>}
      </div>
      {/* Nhãn hướng gợi ý có thể dài ("Lên ELE + bổ trợ miễn phí …"): chip được xuống dòng thay vì đẩy trang tràn ngang ở 375 px (PR-UXD). */}
      {h.nhan && <div className="[&>span]:max-w-full [&>span]:whitespace-normal [&>span]:rounded-xl"><Level tone={TONE[h.tone]}>{h.nhan}</Level></div>}
      {h.kyVong && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="text-slate-400">{h.kyVong.nhan}</span>
          <span className={`tabular-nums ${h.kyVong.daDanhDau ? 'text-slate-100' : 'text-slate-500'}`}>{h.kyVong.trangThai}</span>
          {coTheKetLuan && (
            <span className="flex gap-1.5">
              <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={danhDauDat}>{t('Đạt')}</button>
              <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setMoKhongDat(true)}>{t('Không đạt')}</button>
            </span>
          )}
        </div>
      )}
      {!cuoiKhoa.daChuyen && classId && (
        <div>
          <Link className="btn btn-sm min-h-[44px] sm:min-h-0" to={duongLoTrinhLop(classId, studentId)}>{t('Cuối khoá ›')}</Link>
        </div>
      )}
      {moKhongDat && (
        <PanelKhongDat studentId={studentId} studentName={studentName} lop={lop} ct={ct} monTruot={cuoiKhoa.kyVongMt0?.monTruot ?? []}
          ban={cuoiKhoa.ketLuanFt} onDong={() => setMoKhongDat(false)} onXong={() => { setMoKhongDat(false); onDoi(); }} />
      )}
    </section>
  );
}

/** Ô "Không đạt Kỳ vọng": nguyên nhân Trung tâm / Học viên · kỹ năng · phương án (Học viên, bắt buộc, không Case — N17) — cùng luật trang Cuối khoá. */
function PanelKhongDat({ studentId, studentName, lop, ct, monTruot, ban, onDong, onXong }: {
  studentId: number; studentName: string; lop: string | null; ct: string | null; monTruot: string[];
  ban: CuoiKhoaEm['ketLuanFt']; onDong: () => void; onXong: () => void;
}) {
  const toast = useToast();
  const lf = useLoiForm();
  const [nn, setNn] = useState<'trung_tam' | 'hoc_sinh' | ''>(ban?.dat === false ? ban.nguyenNhan ?? '' : '');
  const [mon, setMon] = useState<string[]>(ban?.mon?.length ? ban.mon : monTruot);
  const [ghiChu, setGhiChu] = useState(ban?.ghiChu ?? '');
  const [busy, setBusy] = useState(false);
  const loi = dsLoi([
    { khoa: 'nguyen-nhan', nhan: t('Nguyên nhân'), chon: true },
    ...(nn === 'hoc_sinh' ? [{ khoa: 'ghi-chu', nhan: t('Phương án') }] : []),
  ], { 'nguyen-nhan': nn, 'ghi-chu': ghiChu });
  if (nn !== '' && mon.length === 0) loi.push({ khoa: 'mon', nhan: t('Kỹ năng'), lyDo: t('Chọn ít nhất một kỹ năng chưa đạt') });
  const luu = async () => {
    lf.bam();
    if (loi.length) return;
    setBusy(true);
    try {
      const r: any = await api.put(`/students/${studentId}/ket-luan-ft`, {
        dat: false, nguyenNhan: nn, mon, ...(nn === 'hoc_sinh' ? { ghiChu: ghiChu.trim() } : {}),
      });
      invalidate('/students'); invalidate('/cases'); invalidate('/my-work');
      toast.push('ok', r?.taoCaseTutor ? t('Đã ghi — tạo {n} Case', { n: r.taoCaseTutor }) : t('Đã ghi Kỳ vọng'));
      if (r?.luuY) toast.push('info', dich(r.luuY));
      onXong();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };
  return (
    <KhungPanel tieuDe={t('Không đạt Kỳ vọng')} hocVien={studentName} lop={lop} onDong={onDong}
      chan={{ conThieu: lf.conThieu(loi), chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={luu}>{t('Lưu')}</button> }}>
      <Khoi tieuDe={t('Nguyên nhân')}>
        <div {...lf.o(loi, 'nguyen-nhan')} tabIndex={-1} role="radiogroup" aria-label={t('Nguyên nhân')} className="grid grid-cols-2 gap-2 outline-none">
          <NutChon chon={nn === 'trung_tam'} onClick={() => setNn('trung_tam')} className="justify-center">{t('Trung tâm')}</NutChon>
          <NutChon chon={nn === 'hoc_sinh'} onClick={() => setNn('hoc_sinh')} className="justify-center">{t('Học viên')}</NutChon>
        </div>
        {lf.loiCua(loi, 'nguyen-nhan') && <span className="mt-1 block text-xs text-late">{lf.loiCua(loi, 'nguyen-nhan')}</span>}
        <p className="m-0 mt-1 text-xs text-slate-500">
          {nn === 'trung_tam' ? t('Sau khi em sang Fast Track: mỗi kỹ năng một Case + PA Tutor 10 buổi.')
            : nn === 'hoc_sinh' ? t('Ghi phương án, không Case.') : t('Trung tâm chưa dạy đủ hay học viên chưa theo kịp?')}
        </p>
      </Khoi>
      {nn !== '' && (
        <Khoi tieuDe={t('Kỹ năng chưa đạt')}>
          <div {...lf.o(loi, 'mon')} tabIndex={-1} className="flex flex-wrap gap-2 outline-none">
            {REGULAR_SKILLS.map((k) => (
              <NutChon key={k} chon={mon.includes(k)} onClick={() => setMon((m) => (m.includes(k) ? m.filter((x) => x !== k) : [...m, k]))} title={tenMon(ct, k)}>
                {tenMonNgan(ct, k)}
              </NutChon>
            ))}
          </div>
          {lf.loiCua(loi, 'mon') && <span className="mt-1 block text-xs text-late">{lf.loiCua(loi, 'mon')}</span>}
        </Khoi>
      )}
      {nn === 'hoc_sinh' && (
        <Khoi tieuDe={t('Phương án')}>
          <Truong nhan={t('Phương án')} batBuoc loi={lf.loiCua(loi, 'ghi-chu')}>
            <textarea className="field w-full" rows={3} {...lf.o(loi, 'ghi-chu')} value={ghiChu} maxLength={500} onChange={(e) => setGhiChu(e.target.value)}
              placeholder={t('Ví dụ: Nghỉ 5 buổi trước Final Test')} />
          </Truong>
        </Khoi>
      )}
    </KhungPanel>
  );
}

/**
 * Ô MINI TEST (M-05) — Nằm ở: Hồ sơ HV → tab Học thuật, đầu tab (em đang học lộ trình mới có bổ trợ miễn phí).
 * Chưa ghi: `Mini Test · — · hạn 12/10` + [Ghi Mini Test] (khi có quyền và đã tới ngày buổi cuối → mở Ngăn Case, form Ghi kết quả cuối có ô Mini Test). Đã ghi: `72% · 10/10 · Đạt` / `Chưa đạt — đã báo QL`.
 */
export function MiniTestO({ mt, onGhi }: { mt: MiniTestEm; onGhi: (caseId: number, paId: number) => void }) {
  const { homNay } = useNgayNghiepVu();
  if (mt.tyLe === null) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--line)' }}>
        <span className="font-semibold text-slate-100">Mini Test</span>
        <span className="text-slate-500">—</span>
        <Han loai="mini-test" han={mt.han} />
        {/* PR-S5F-a: chỉ từ ngày buổi cuối — trước đó form Ghi kết quả chưa phải lần cuối nên không có ô Mini Test. */}
        {mt.coTheGhi && mt.caseId && mt.paId && !!homNay && homNay >= mt.ngayDuKien && (
          <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => onGhi(mt.caseId!, mt.paId!)}>{t('Ghi Mini Test')}</button>
        )}
      </div>
    );
  }
  return <MiniTestDaGhi mt={mt as MiniTestEm & { tyLe: number }} />;
}

/** Mini Test đã ghi — OV-7a: `Sửa` mở ô % + ngày ngay tại chỗ; máy tính lại như lần ghi đầu (≥ 70% Case Hoàn thành, < 70% Case mở + Báo QL). */
function MiniTestDaGhi({ mt }: { mt: MiniTestEm & { tyLe: number } }) {
  const { homNay } = useNgayNghiepVu();
  const toast = useToast();
  const [sua, setSua] = useState<{ pt: string; ngay: string } | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const dat = mt.tyLe >= 0.7;
  const pt = sua ? Number(sua.pt.replace(',', '.')) : NaN;
  const loiPt = sua && (sua.pt.trim() === '' || !Number.isFinite(pt) || pt < 0 || pt > 100) ? t('Nhập % từ 0 đến 100') : null;
  const luu = async () => {
    if (!sua || loiPt || !sua.ngay) return;
    setBusy(true); setLoi(null);
    try {
      await api.put(`/mini-test/${mt.id}`, { tyLe: pt, ngay: sua.ngay });
      invalidate('/students'); invalidate('/cases'); invalidate('/yeu-cau'); invalidate('/my-work');
      toast.push('ok', t('Đã lưu Mini Test {pt}%', { pt: Math.round(pt) }));
      setSua(null);
    } catch (e: any) { setLoi(e.message); } finally { setBusy(false); }
  };
  return (
    <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--line)' }}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-semibold text-slate-100">Mini Test</span>
        <span className="font-bold tabular-nums text-slate-100">{Math.round(mt.tyLe * 100)}%</span>
        <span className="text-xs tabular-nums text-slate-400">{mt.ngayLam ? ngay(mt.ngayLam, homNay) : ''}</span>
        <Level tone={dat ? 'ok' : 'warn'}>{dat ? t('Đạt') : t('Chưa đạt — đã báo QL')}</Level>
        {mt.coTheSua && !sua && (
          <button type="button" className="btn btn-sm ml-auto min-h-[44px] sm:min-h-0"
            onClick={() => { setLoi(null); setSua({ pt: String(Math.round(mt.tyLe * 100)), ngay: mt.ngayLam ?? homNay }); }}>{t('Sửa')}</button>
        )}
      </div>
      {sua && (
        <div className="mt-2 flex flex-wrap items-end gap-2" onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setSua(null); } if (e.key === 'Enter') void luu(); }}>
          <Truong nhan="Mini Test (%)" batBuoc loi={loiPt}>
            <input className="field w-24 tabular-nums" inputMode="decimal" autoFocus aria-invalid={!!loiPt} value={sua.pt} onChange={(e) => setSua({ ...sua, pt: e.target.value })} />
          </Truong>
          <Truong nhan={t('Ngày làm')} batBuoc>
            <span className="block w-[11.5rem]"><ONgay kieu="ngay" value={sua.ngay} onChange={(v) => setSua({ ...sua, ngay: v })} toiDa={homNay || null} /></span>
          </Truong>
          <div className="flex gap-1.5 pb-0.5">
            <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => setSua(null)}>{t('Đóng')}</button>
            <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" disabled={busy || !!loiPt || !sua.ngay} onClick={() => void luu()}>{busy ? t('Đang lưu…') : t('Lưu')}</button>
          </div>
          {loi && <p role="alert" className="m-0 w-full text-xs text-late">{loi}</p>}
        </div>
      )}
    </div>
  );
}
