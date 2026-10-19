import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { Card, Empty, ErrorState, Skeleton, TargetText } from '../../ui/ui.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { PhanTrang, usePhanTrang } from '../../ui/PhanTrang.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { KetQuaOHocVien } from './BangHocVienLop.tsx';
import { NganXuatDs } from './NganXuatDs.tsx';
import {
  KET_LUAN_LICH_THI, cuaSoThang, demKetLuan, dsThangLichThi, ketQuaGanNhat, nhanThang,
  type ExamPlan, type KetLuanLichThi, type KetQuaVao, type NguCanhDs,
} from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/** Một hàng của `GET /hoc-vien-lop/lich-thi` (server/src/classes/lichThi.ts → HangLichThi). */
type Luu = { ketLuan: KetLuanLichThi | null; thang: string | null; ghiChu: string | null; ai: string | null; luc: string };
type Hang = {
  studentId: number; cycleId: number | null; ten: string; ma: string; classId: number; classCode: string; thuong: boolean; gvcn: string | null; tvv: string | null;
  target: number | null; kck: boolean; standing: KetQuaVao | null;
  duKien: ExamPlan; coNgay: boolean; thangDuKien: string | null; chuaCo: boolean; ketLuan: KetLuanLichThi | null; luu: Luu | null; coTheSua: boolean;
};
type Trang = { thang: string[]; rows: Hang[] };
type TrangThaiLuu = { kieu: 'luu' | 'xong' | 'loi'; loi?: string; lai?: () => void };
/** Hàng đang hiện: dữ liệu máy chủ + việc làm tại chỗ (chuyển sang tháng nào, đang lưu / đã lưu / lỗi). Em "Chưa có" giữ cờ gốc để dải đếm không nhảy nhóm. */
type HangHien = Hang & { chuyenSang: string | null; chuaCoGoc: boolean; tt?: TrangThaiLuu };

const NHAN_KL: Record<KetLuanLichThi, string> = {
  'giu-thang': t('Giữ tháng'), 'chot-ngay': t('Chốt ngày'), 'chuyen-thang': t('Chuyển tháng'), 'can-xac-nhan': t('Cần xác nhận'),
};
const gio = (iso: string) => { try { return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };

/**
 * HỌC VIÊN & LỚP › LỊCH THI (OV-15f, mockup 5 khung 1 — phương án D): chọn Tháng dự kiến thi (một hoặc nhiều) → em có tháng đó + em chưa có dự kiến →
 * bấm Kết luận ngay trên hàng (Giữ tháng · Cần xác nhận: 1 bấm; Chốt ngày · Chuyển tháng: thêm một ô) → LƯU NGAY vào lịch chuẩn / nhật ký, không bước duyệt.
 * Em vừa chuyển tháng ở lại danh sách tới khi rời trang ("Đã chuyển sang 12/2026"). Quyền = sửa "Dự kiến thi" (máy chủ kiểm; hàng không sửa được chỉ đọc).
 * `duongGoc`: đuôi truy vấn của trang (`?q=&phamVi=&branchId=`) — cùng phạm vi với các góc kia. Tháng nằm trên URL (`thang=`).
 */
export function GocLichThi({ duongGoc, thangUrl, onDoiThang }: { duongGoc: string; thangUrl: string | null; onDoiThang: (thang: string[]) => void }) {
  const { homNay } = useNgayNghiepVu();
  const thang = useMemo(() => {
    const d = dsThangLichThi(thangUrl);
    return d.length ? d : [cuaSoThang(homNay, 0, 1)[1]];   // mặc định: tháng kế tiếp
  }, [thangUrl, homNay]);
  const khoaThang = thang.join(',');
  const duong = `/hoc-vien-lop/lich-thi${duongGoc}${duongGoc.includes('?') ? '&' : '?'}thang=${khoaThang}`;
  const { data, loading, error, reload } = useApi<Trang>(duong, [duong]);
  const [rows, setRows] = useState<HangHien[]>([]);
  useEffect(() => {
    setRows((data?.rows ?? []).map((r) => ({ ...r, chuyenSang: null, chuaCoGoc: r.chuaCo })));
  }, [data]);
  const [gomChuaCo, setGomChuaCo] = useState(true);
  const [xuat, setXuat] = useState(false);
  const [moRong, setMoRong] = useState<{ id: number; kieu: 'ngay' | 'thang' } | null>(null);
  /* Điện thoại: hàng tháng cuộn ngang — đưa tháng đang chọn vào tầm nhìn (không cuộn cả trang). */
  const hangThang = useRef<HTMLDivElement>(null);
  useEffect(() => { hangThang.current?.querySelector<HTMLElement>('[aria-pressed="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest' }); }, []);

  const hien = useMemo(() => {
    const co = rows.filter((r) => !r.chuaCoGoc || r.chuyenSang);
    const chua = gomChuaCo ? rows.filter((r) => r.chuaCoGoc && !r.chuyenSang) : [];
    return { co, chua, tat: [...co, ...chua] };
  }, [rows, gomChuaCo]);
  const pt = usePhanTrang(hien.tat.length, `${khoaThang}|${gomChuaCo}`, 'HV');
  const trangRows = pt.cat(hien.tat);
  const dem = demKetLuan(rows.map((r) => ({ ketLuan: r.ketLuan, chuaCoDuKien: r.chuaCoGoc, chuyenSang: r.chuyenSang })));
  const soChuaCo = rows.filter((r) => r.chuaCoGoc && !r.chuyenSang).length;

  const sua = (id: number, f: (r: HangHien) => HangHien) => setRows((ds) => ds.map((r) => (r.studentId === id ? f(r) : r)));
  /** Lưu MỘT kết luận / ghi chú; lỗi thì giữ chữ đang gõ và cho Thử lại. */
  const luu = (r: HangHien, body: { ketLuan?: KetLuanLichThi; ngay?: string; thang?: string; ghiChu?: string }) => {
    if (!r.cycleId) return;
    const lan = () => luu(r, body);
    sua(r.studentId, (x) => ({ ...x, tt: { kieu: 'luu' } }));
    api.put<Pick<Hang, 'duKien' | 'coNgay' | 'thangDuKien' | 'chuaCo' | 'ketLuan' | 'luu'>>(`/hoc-vien-lop/lich-thi/${r.cycleId}`, body)
      .then((kq) => {
        /* Làm mới các trang khác (danh sách lớp, TVV / CX, hồ sơ) nhưng KHÔNG đường của chính góc này (`/hoc-vien-lop/lich-thi`): tải lại sẽ làm em vừa chuyển tháng biến mất khỏi danh sách. */
        invalidate('/hoc-vien-lop?'); invalidate('/hoc-vien-lop/theo-vai'); invalidate('/hoc-vien-lop/em'); invalidate('/students');
        sua(r.studentId, (x) => ({
          ...x, ...kq, chuaCoGoc: x.chuaCoGoc && kq.chuaCo, chuyenSang: body.ketLuan === 'chuyen-thang' ? body.thang ?? null : body.ketLuan ? null : x.chuyenSang,
          tt: { kieu: 'xong' },
        }));
        setMoRong(null);
      })
      .catch((e: any) => sua(r.studentId, (x) => ({ ...x, tt: { kieu: 'loi', loi: e?.message ?? t('Chưa lưu được.'), lai: lan } })));
  };

  const thangChon = (m: string) => {
    const cu = new Set(thang);
    if (cu.has(m)) { if (cu.size > 1) cu.delete(m); } else cu.add(m);
    onDoiThang([...cu].sort());
  };
  const idsXuat = hien.tat.map((r) => r.studentId);
  const dsTrang: NguCanhDs = { loai: 'hoc-vien', nhan: t('Lịch thi'), ids: idsXuat };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2" data-hd="hvl-lich-thi">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 max-sm:w-full" role="group" aria-label={t('Tháng dự kiến thi')}>
          <span className="shrink-0 text-xs font-semibold text-slate-400">{t('Tháng dự kiến thi')}</span>
          <div ref={hangThang} className="flex min-w-0 flex-wrap items-center gap-1.5 max-sm:w-full max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:pb-1">
            {cuaSoThang(homNay, 1, 10).map((m) => (
              <button key={m} type="button" className="nut-loc shrink-0" aria-pressed={thang.includes(m)} onClick={() => thangChon(m)}>{nhanThang(m)}</button>
            ))}
          </div>
        </div>
        <label className="flex min-h-[44px] items-center gap-2 text-xs text-slate-300 sm:min-h-0">
          <input type="checkbox" checked={gomChuaCo} onChange={(e) => setGomChuaCo(e.target.checked)} />
          {t('Gồm HV chưa có dự kiến thi')}<span className="tabular-nums text-slate-500">{soChuaCo}</span>
        </label>
        <button type="button" className="btn btn-sm sm:ml-auto max-sm:min-h-[44px]" disabled={!idsXuat.length} onClick={() => setXuat(true)}>
          {t('Xuất Excel · {n} HV', { n: idsXuat.length })}
        </button>
      </div>

      {error && <ErrorState message={error.message} hint={error.hint} onRetry={reload} />}
      {loading && !data && <Skeleton rows={5} />}
      {data && (
        <>
          <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300" aria-live="polite">
            <b className="font-semibold text-slate-100">{t('Thi thật dự kiến {thang} · {n} HV', { thang: thang.map(nhanThang).join(' + '), n: hien.co.length })}</b>
            <span className="tabular-nums"><b>{dem.chotNgay}</b> {t('đã chốt ngày')}</span>
            <span className="tabular-nums"><b>{dem.giuThang}</b> {t('giữ tháng')}</span>
            <span className="tabular-nums"><b>{dem.chuyenThang}</b> {t('chuyển tháng')}</span>
            <span className="tabular-nums"><b>{dem.canXacNhan}</b> {t('cần xác nhận')}</span>
            <span className="tabular-nums"><b>{dem.chuaRa}</b> {t('chưa rà')}</span>
          </p>
          {hien.tat.length === 0 ? (
            <Card>
              <Empty title={t('Không có HV dự kiến thi thật trong {thang}.', { thang: thang.map(nhanThang).join(' + ') })}
                hint={soChuaCo ? t('{n} HV chưa có dự kiến thi.', { n: soChuaCo }) : undefined}
                action={soChuaCo && !gomChuaCo ? <button type="button" className="btn btn-sm" onClick={() => setGomChuaCo(true)}>{t('Xem {n} HV chưa có dự kiến', { n: soChuaCo })}</button> : undefined} />
            </Card>
          ) : (
            <Card className="overflow-hidden !p-0">
              <div className="px-2"><PhanTrang {...pt.thanh} /></div>
              <div role="table" aria-label={t('Lịch thi')}>
                <div role="row" className="hidden border-b px-3 py-2 text-xs font-semibold text-slate-400 md:grid md:grid-cols-[minmax(0,1.6fr)_48px_minmax(0,1.3fr)_104px_minmax(372px,2.4fr)_minmax(0,1.4fr)] md:gap-3" style={{ borderColor: 'var(--line)' }}>
                  <span role="columnheader">{t('Học viên')}</span><span role="columnheader" className="text-center">Target</span><span role="columnheader">{t('Kết quả gần nhất')}</span>
                  <span role="columnheader">{t('Lịch hiện tại')}</span><span role="columnheader">{t('Kết luận')}</span><span role="columnheader">{t('Ghi chú họp')}</span>
                </div>
                {trangRows.map((r, i) => (
                  <div key={r.studentId} role="presentation">
                    {r.chuaCoGoc && !r.chuyenSang && (i === 0 || !(trangRows[i - 1].chuaCoGoc && !trangRows[i - 1].chuyenSang)) && (
                      <div role="row" className="border-b bg-white/[.03] px-3 py-1.5 text-xs font-semibold text-slate-300" style={{ borderColor: 'var(--line)' }}>
                        <span role="cell">{t('Chưa có dự kiến thi')} · <span className="tabular-nums">{t('{n} HV', { n: soChuaCo })}</span></span>
                      </div>
                    )}
                    <DongLichThi r={r} ds={dsTrang} moRong={moRong?.id === r.studentId ? moRong.kieu : null} onMoRong={(k) => setMoRong(k ? { id: r.studentId, kieu: k } : null)}
                      onLuu={(b) => luu(r, b)} />
                  </div>
                ))}
              </div>
              <div className="px-2"><PhanTrang {...pt.thanh} duoi /></div>
            </Card>
          )}
        </>
      )}
      {xuat && (
        <NganXuatDs ids={idsXuat} boLoc={`${t('Lịch thi')} · ${thang.map(nhanThang).join(' + ')}`} mauMacDinh="co-ban"
          macDinh={['ten', 'gmail', 'lop', 'coSo', 'target', 'lichThi', 'ketLuan', 'ghiChuHop']} onDong={() => setXuat(false)} />
      )}
    </div>
  );
}

function DongLichThi({ r, ds, moRong, onMoRong, onLuu }: {
  r: HangHien; ds: NguCanhDs; moRong: 'ngay' | 'thang' | null; onMoRong: (k: 'ngay' | 'thang' | null) => void;
  onLuu: (b: { ketLuan?: KetLuanLichThi; ngay?: string; thang?: string; ghiChu?: string }) => void;
}) {
  const { homNay } = useNgayNghiepVu();
  const k = ketQuaGanNhat(r.standing);
  const [ghiChu, setGhiChu] = useState(r.luu?.ghiChu ?? '');
  const daLuuGhiChu = useRef(r.luu?.ghiChu ?? '');
  useEffect(() => { daLuuGhiChu.current = r.luu?.ghiChu ?? ''; setGhiChu(r.luu?.ghiChu ?? ''); }, [r.luu?.ghiChu]);
  const khoa = !r.coTheSua || r.tt?.kieu === 'luu';
  const lich = r.coNgay ? `${t('Chốt')} ${r.duKien.label}` : r.chuaCo ? t('Chưa có') : `${t('Dự kiến')} ${r.duKien.confidence === 'month' && r.thangDuKien ? nhanThang(r.thangDuKien) : r.duKien.label}`;
  const nutKl: KetLuanLichThi[] = r.chuaCoGoc && !r.thangDuKien ? ['chuyen-thang', 'chot-ngay', 'can-xac-nhan'] : [...KET_LUAN_LICH_THI];
  const nhanNut = (x: KetLuanLichThi) => (x === 'chuyen-thang' && r.chuaCoGoc && !r.thangDuKien ? t('Đặt tháng') : NHAN_KL[x]);
  const bam = (x: KetLuanLichThi) => {
    if (khoa) return;
    if (x === 'chot-ngay') onMoRong(moRong === 'ngay' ? null : 'ngay');
    else if (x === 'chuyen-thang') onMoRong(moRong === 'thang' ? null : 'thang');
    else { onMoRong(null); onLuu({ ketLuan: x }); }
  };
  const luuGhiChu = () => { if (ghiChu.trim() !== daLuuGhiChu.current.trim()) onLuu({ ghiChu: ghiChu.trim() }); };
  return (
    <div role="row" className={`grid gap-x-3 gap-y-2 border-b px-3 py-2.5 md:grid-cols-[minmax(0,1.6fr)_48px_minmax(0,1.3fr)_104px_minmax(372px,2.4fr)_minmax(0,1.4fr)] ${r.chuyenSang ? 'bg-white/[.03]' : ''}`} style={{ borderColor: 'var(--line)' }}>
      <div role="cell" className="min-w-0">
        <Link className="link font-semibold" to={`/hoc-vien/${r.studentId}`} state={{ ds }}>{r.ten}</Link>
        <span className="block truncate text-xs text-slate-400" title={[r.classCode, r.gvcn && `GVCN ${r.gvcn}`, r.tvv && `TVV ${r.tvv}`].filter(Boolean).join(' · ')}>
          {[r.classCode, r.gvcn && `GVCN ${r.gvcn}`, r.tvv && `TVV ${r.tvv}`].filter(Boolean).join(' · ')}
        </span>
      </div>
      <div role="cell" className="tabular-nums text-slate-200 md:text-center"><span className="text-xs text-slate-500 md:hidden">Target </span><TargetText band={r.target} kck={r.kck} /></div>
      <div role="cell" className="min-w-0 text-xs"><KetQuaOHocVien k={k} standing={r.standing} thuong={r.thuong} /></div>
      <div role="cell" className="text-xs">
        <span className="block text-slate-100">{r.chuyenSang ? `${t('Dự kiến')} ${nhanThang(r.chuyenSang)}` : lich}</span>
      </div>
      <div role="cell" className="min-w-0">
        {r.chuyenSang && <p className="m-0 mb-1 text-xs font-semibold text-slate-200">{t('Đã chuyển sang {thang}', { thang: nhanThang(r.chuyenSang) })}</p>}
        <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap" role="group" aria-label={t('Kết luận')}>
          {nutKl.map((x) => {
            const dang = !r.chuyenSang && r.ketLuan === x;
            return (
              <button key={x} type="button" disabled={khoa} aria-pressed={dang || (moRong === 'ngay' && x === 'chot-ngay') || (moRong === 'thang' && x === 'chuyen-thang')} onClick={() => bam(x)}
                className={`inline-flex min-h-[44px] items-center justify-center rounded-md border px-2 text-xs font-semibold disabled:cursor-not-allowed sm:min-h-[30px] ${
                  dang ? 'bg-[color:var(--accent-soft)] text-slate-100 shadow-[inset_0_0_0_1px_var(--accent)]' : 'bg-transparent text-slate-300 hover:text-slate-100'} ${khoa && !dang ? 'opacity-50' : ''}`}
                style={{ borderColor: 'var(--line)' }}>
                <span aria-hidden className={`mr-1 ${dang ? '' : 'hidden'}`}>✓</span>{nhanNut(x)}
              </button>
            );
          })}
        </div>
        {moRong === 'ngay' && (
          <div className="mt-1.5 max-w-[220px]"><ONgay kieu="ngay" value={null} ariaLabel={t('Chốt ngày')} onChange={(iso) => iso && onLuu({ ketLuan: 'chot-ngay', ngay: iso })} toiThieu={homNay} /></div>
        )}
        {moRong === 'thang' && (
          <div className="mt-1.5 max-w-[220px]"><ONgay kieu="thang" value={null} ariaLabel={t('Chuyển tháng')} onChange={(iso) => iso && onLuu({ ketLuan: 'chuyen-thang', thang: iso.slice(0, 7) })} toiThieu={homNay.slice(0, 7)} /></div>
        )}
        {r.tt && <TrangThai tt={r.tt} />}
      </div>
      <div role="cell" className="min-w-0">
        <input className="field h-8 w-full text-xs max-sm:min-h-[44px]" aria-label={t('Ghi chú họp')} placeholder={t('Thêm ghi chú…')} maxLength={300} disabled={!r.coTheSua}
          value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} onBlur={luuGhiChu} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
        {r.luu?.ghiChu && r.luu.ai && <span className="block truncate text-[11px] text-slate-500">{r.luu.ai} · {gio(r.luu.luc)}</span>}
      </div>
    </div>
  );
}

function TrangThai({ tt }: { tt: TrangThaiLuu }) {
  return (
    <p className="m-0 mt-1 text-[11px]" aria-live="polite">
      {tt.kieu === 'luu' && <span className="text-slate-400">{t('Đang lưu…')}</span>}
      {tt.kieu === 'xong' && <span className="text-slate-300">{t('Đã lưu')}</span>}
      {tt.kieu === 'loi' && (
        <span role="alert" className="text-bad">
          {tt.loi} {t('Nội dung bạn nhập vẫn được giữ.')} <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 sm:min-h-0" onClick={tt.lai}>{t('Thử lại')}</button>
        </span>
      )}
    </p>
  );
}
