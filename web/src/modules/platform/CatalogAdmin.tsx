import { useRef, useState, type ReactNode } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { ApiError, api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Card, ErrorState, Field, Forbidden, Info, Skeleton } from '../../ui/ui.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { MON_CHON, MON_GOP, MT_TOI_DA, dsLoi, kyHieuLop, oPhanCong, skillShort, tenMonNgan, thuTuKyHieu, type LoiTruong } from '@shared/domain/index.ts';
import { PhanDoan } from '../classes/ClassCreatePanel.tsx';
import { useSession } from '../../lib/session.tsx';
import { NhatKyMuc } from './NhatKyChung.tsx';
import { SuaTaiDong } from './SuaTaiDong.tsx';
import { OChon as OChonThuong } from '../phanTich/dungChung.tsx';
import { dich, t } from '@shared/i18n/index.ts';

type RouteRow = { code: string; name: string; note: string | null; seq: number; status: string; inUse: number; lichMt: number[]; lopDangChay: number };
type Programme = {
  code: string; name: string; weeks: number | null; scoringMode: string; status: string;
  skills: string[]; checkpoints: { kind: string; studyWeek: number }[]; nguongDat: number | null; lopDangChay: number;
  /** OV-6b2: liên tục — Checkpoint mỗi n tuần · `goc` = chương trình có sẵn (cách chấm khoá) · `coLop` = đã có lớp (độ dài khoá). */
  lapMoiTuan: number | null; goc: boolean; coLop: boolean;
  /** MON-CT-1311: lý do Môn khoá (FT, Pre FOU); null = Quản trị sửa được (kể cả chương trình gốc, đang có lớp). */
  khoaMon: string | null;
};
/** Một dòng của bảng: chương trình lớp thường, hoặc FT theo từng lộ trình (mockup §6); `moi` = panel "+ Chương trình" (OV-6b2). */
type Dong = { loai: 'ct'; ct: Programme } | { loai: 'ft'; lt: RouteRow } | { loai: 'moi' };

const moc = (p: Programme, kind: 'progress' | 'final') => p.checkpoints.find((c) => c.kind === kind)?.studyWeek ?? null;
const thuTu = (p: Programme) => thuTuKyHieu(kyHieuLop(p.code, null));
/** MH9: bộ môn của CHÍNH chương trình đó (FOU: L · R · G+V · P; Pre FOU: Tổng hợp) — không gộp mọi môn. */
function boMon(p: Programme) {
  const mon = oPhanCong(p.code, p.skills).filter((o) => !o.laGvcn).map((o) => o.nhan);
  return (mon.length ? mon : p.skills.map(skillShort)).join(' · ');
}
type DongCo = Exclude<Dong, { loai: 'moi' }>;
const tenDong = (d: Dong) => (d.loai === 'moi' ? t('Chương trình mới') : d.loai === 'ft' ? `FT · ${d.lt.code}` : `${kyHieuLop(d.ct.code, null) ?? d.ct.code} · ${d.ct.name}`);
const khoaDong = (d: Dong) => (d.loai === 'moi' ? '+moi' : d.loai === 'ft' ? `ft:${d.lt.code}` : d.ct.code);
const conDung = (d: DongCo) => (d.loai === 'ft' ? d.lt.status : d.ct.status) === 'active';
const soLop = (d: Dong) => (d.loai === 'moi' ? 0 : d.loai === 'ft' ? d.lt.lopDangChay : d.ct.lopDangChay);
/** Độ dài: FT = tuần MT cuối của lộ trình (FT không có số tuần cố định); OV-6b2: "liên tục". */
const doDai = (d: DongCo): string => {
  if (d.loai === 'ct' && d.ct.lapMoiTuan) return t('liên tục');
  const n = d.loai === 'ft' ? d.lt.lichMt.at(-1) ?? null : d.ct.weeks;
  return n !== null ? t('{n} tuần', { n }) : '—';
};
/** "Progress tuần 5 · Final tuần 10" / "MT1 tuần 6 · MT2 tuần 12 · MT3 tuần 16"; `ngan` cho thẻ điện thoại: "Progress t5 · Final t10" / "MT t6 · t12 · t16". */
function chuMoc(d: DongCo, ngan = false): string {
  const tu = (n: number) => (ngan ? t('t{n}', { n }) : t('tuần {n}', { n }));
  if (d.loai === 'ct' && d.ct.lapMoiTuan) return t('Checkpoint mỗi {n} tuần', { n: d.ct.lapMoiTuan });
  if (d.loai === 'ft') return ngan ? `MT ${d.lt.lichMt.map(tu).join(' · ')}` : d.lt.lichMt.map((w, i) => t('MT{i} tuần {w}', { i: i + 1, w })).join(' · ');
  const p = moc(d.ct, 'progress'); const f = moc(d.ct, 'final');
  return [p !== null ? `Progress ${tu(p)}` : null, f !== null ? `Final ${tu(f)}` : null].filter(Boolean).join(' · ') || '—';
}

/**
 * QUẢN TRỊ › CHƯƠNG TRÌNH (OV-6b1, mockup overhaul-3 §6) — mục 7.3, K1-46…K1-50.
 *
 * Một bảng: chương trình lớp thường + Fast Track theo từng lộ trình (LT1, LT2, RF). Sửa trong panel: tên, "Đạt từ" (đúng/tổng),
 * số tuần và mốc Test (lớp thường: Progress / Final; FT: tuần học của từng MT; liên tục: Checkpoint mỗi n tuần). Lưu xong chỉ áp cho LỚP MỞ SAU —
 * lớp đang chạy giữ bản chụp lúc tạo, nên lịch của lớp đó không đổi. Cách chấm chỉ đọc. MON-CT-1311: Môn sửa được ở mọi chương trình lớp thường
 * (trừ Pre FOU) — áp cả bài Test chưa có điểm của lớp đang chạy; có lớp đang học thì máy chủ hỏi trước (hộp xác nhận chung).
 *
 * OV-6b2: "+ Chương trình" tạo mã mới (đúng/tổng; số tuần hoặc liên tục). Không xoá — mã đang có lớp dùng thì NGỪNG DÙNG (biến khỏi ô chọn, lớp cũ vẫn đọc được).
 */
export function CatalogAdmin() {
  const routes = useApi<RouteRow[]>('/admin/routes');
  const programmes = useApi<Programme[]>('/admin/programmes');
  const [them, setThem] = useState(false);
  /* QTV2-CAU-HINH: Quản lý xem (chỉ đọc) — không ô sửa, không công tắc, không + Chương trình. */
  const phien = useSession();
  const quanTri = !!phien.session?.nav?.admin;

  /* Không có quyền thì nói thẳng, đừng để một khối trống — xem chú thích ở `AccountsAdmin`. */
  /* 6c (lỗi 6): chỉ 403 mới là thiếu quyền — lỗi mạng / máy chủ thì nói thật + Thử lại. */
  const loiTai = routes.error ?? programmes.error;
  if (loiTai && loiTai.status !== 403) {
    return <Card title={t('Chương trình')}><ErrorState message={loiTai.message} hint={loiTai.hint} status={loiTai.status} onRetry={() => { routes.reload(); programmes.reload(); }} /></Card>;
  }
  if (loiTai) {
    return (
      <Forbidden
        message={t('Phần này chỉ dành cho Quản trị hệ thống.')}
        hint={t('Chương trình là cấu hình chung của cả trung tâm, nên chỉ Quản trị sửa được.')}
      />
    );
  }
  const dong: DongCo[] = [
    ...[...(programmes.data ?? [])].filter((p) => p.code !== 'FT').sort((a, b) => thuTu(a) - thuTu(b)).map((ct) => ({ loai: 'ct' as const, ct })),
    ...(routes.data ?? []).map((lt) => ({ loai: 'ft' as const, lt })),
  ];
  /* Lưu xong: tải lại đúng nguồn. MON-CT-1311 PR 2: phiên mang bộ môn chương trình (`boMonLich` ở web) — tải lại để các trang theo môn mới ngay. */
  const daLuu = (d: Dong) => {
    if (d.loai === 'ft') { routes.reload(); invalidate('/ref/routes'); } else { programmes.reload(); invalidate('/ref/programmes'); void phien.reload(); }
    invalidate('/admin/nhat-ky');
  };
  const ngung = (d: DongCo) => !conDung(d) && <span className="ml-1.5"><Info pending>{t('ngừng dùng')}</Info></span>;
  /* QTV2-CAU-HINH: hai nhóm (dải V21) — loại lớp thường · Fast Track theo lộ trình. */
  const nhom = [
    { key: 'thuong', ten: t('Lớp thường'), ds: dong.filter((d) => d.loai === 'ct') },
    { key: 'ft', ten: t('Fast Track · lộ trình'), ds: dong.filter((d) => d.loai === 'ft') },
  ].filter((g) => g.ds.length > 0);
  const dai = (g: (typeof nhom)[number]) => (
    <span className="flex items-center gap-2 text-[15px] font-bold text-slate-100">{g.ten}<span className="text-[13px] font-normal tabular-nums text-slate-400">{g.ds.length}</span></span>
  );
  /* GD-17b (mockup ⑩ K2): mỗi giá trị sửa được là MỘT ô có viền (bấm là sửa tại chỗ); ô khoá (Môn FT / Pre FOU, Độ dài FT / liên tục, Đạt từ FT) = chữ mờ không viền. */
  const khoa = (chu: ReactNode, title?: string) => <span className="text-slate-400" title={title}>{chu}</span>;
  const oTen = (d: DongCo) => (
    <span className="grid justify-items-start gap-0.5">
      {quanTri ? <OCt d={d} o="ten" mat={<span className={conDung(d) ? '' : 'text-faint'}>{tenDong(d)}</span>} onDaLuu={() => daLuu(d)} />
        : <span className={conDung(d) ? 'text-slate-100' : 'text-faint'}>{tenDong(d)}</span>}
      <span className="flex items-center text-xs text-slate-400">{d.loai === 'ft' || d.ct.scoringMode !== 'ratio' ? 'band IELTS' : t('đúng / tổng')}{ngung(d)}</span>
    </span>
  );
  const oMon = (d: DongCo) => {
    const chu = d.loai === 'ft' ? 'L · R · W · S' : boMon(d.ct);
    const sua = d.loai === 'ct' && (coCauTruc(d) || !d.ct.khoaMon);
    return quanTri && sua ? <OCt d={d} o="mon" mat={chu} onDaLuu={() => daLuu(d)} /> : khoa(chu, d.loai === 'ct' && d.ct.khoaMon ? dich(d.ct.khoaMon) : undefined);
  };
  const oNguong = (d: DongCo) => {
    if (d.loai === 'ft' || d.ct.scoringMode !== 'ratio') return khoa('—');
    const chu = d.ct.nguongDat != null ? `${d.ct.nguongDat} %` : '—';
    return quanTri ? <OCt d={d} o="nguong" mat={<span className="tabular-nums">{chu}</span>} onDaLuu={() => daLuu(d)} /> : chu;
  };
  const oDoDai = (d: DongCo) => {
    const sua = d.loai === 'ct' && (coCauTruc(d) || !!d.ct.weeks);
    return quanTri && sua ? <OCt d={d} o="so-tuan" mat={<span className="tabular-nums">{doDai(d)}</span>} onDaLuu={() => daLuu(d)} /> : khoa(<span className="tabular-nums">{doDai(d)}</span>);
  };
  const oMoc = (d: DongCo) => (quanTri
    ? <OCt d={d} o="moc" mat={<span className="tabular-nums">{chuMoc(d)}</span>} onDaLuu={() => daLuu(d)} />
    : <span className="tabular-nums">{chuMoc(d)}</span>);

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="min-w-0" bodyClass="p-0">
        {routes.loading || programmes.loading ? <div className="p-4"><Skeleton rows={6} /></div> : (
          <>
            <div className="table-scroll bang-dinh max-sm:hidden"><table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="th">{t('Chương trình · cách chấm')}</th><th className="th">{t('Môn')}</th><th className="th">{t('Đạt từ')}</th><th className="th">{t('Độ dài')}</th>
                  <th className="th">{t('Mốc Test')}</th>{quanTri && <th className="th text-right">{t('Lớp đang chạy')}</th>}<th className="th">{t('Còn dùng')}</th>
                </tr>
              </thead>
              {nhom.map((g) => (
              <tbody key={g.key}>
                <tr><td colSpan={quanTri ? 7 : 6} className="td border-t" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)', boxShadow: 'inset 3px 0 0 var(--accent)' }}>{dai(g)}</td></tr>
                {g.ds.map((d) => (
                  <tr key={khoaDong(d)}>
                    <td className="td">{oTen(d)}</td>
                    <td className="td whitespace-nowrap">{oMon(d)}</td>
                    <td className="td whitespace-nowrap">{oNguong(d)}</td>
                    <td className="td whitespace-nowrap">{oDoDai(d)}</td>
                    <td className="td">{oMoc(d)}</td>
                    {quanTri && <td className="td text-right tabular-nums text-slate-300">{soLop(d)}</td>}
                    <td className="td">{quanTri ? <CongTacConDung d={d} onDaLuu={() => daLuu(d)} /> : <span className={conDung(d) ? 'text-slate-200' : 'text-slate-400'}>{conDung(d) ? t('Có') : t('Không')}</span>}</td>
                  </tr>
                ))}
              </tbody>
              ))}
            </table></div>
            {/* Điện thoại: mỗi chương trình một thẻ — cùng ô sửa tại chỗ (mở panel toàn màn), công tắc Còn dùng. */}
            <ul className="sm:hidden m-0 list-none p-0">
              {nhom.map((g) => [
                <li key={`dai-${g.key}`} className="flex min-h-[44px] items-center border-b px-4" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)', boxShadow: 'inset 3px 0 0 var(--accent)' }}>{dai(g)}</li>,
                ...g.ds.map((d) => (
                <li key={khoaDong(d)} className="grid gap-2 border-b px-4 py-3 last:border-b-0" style={{ borderColor: 'var(--line)' }}>
                  {oTen(d)}
                  <span className="flex flex-wrap items-center gap-2 text-sm">{oMon(d)}{oNguong(d)}{oDoDai(d)}</span>
                  <span className="text-sm">{oMoc(d)}</span>
                  {quanTri && <CongTacConDung d={d} onDaLuu={() => daLuu(d)} />}
                </li>
                )),
              ])}
            </ul>
            {quanTri && (
              <div className="border-t px-4 py-2.5" style={{ borderColor: 'var(--line)' }}>
                <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setThem(true)}>{t('+ Chương trình')}</button>
              </div>
            )}
          </>
        )}
      </Card>
      <NhatKyMuc muc="chuong-trinh" quanTri={quanTri} />
      </div>
      {them && <ThemChuongTrinh onClose={() => setThem(false)} onDone={() => { setThem(false); daLuu({ loai: 'moi' }); }} />}
    </>
  );
}

const NHAN_O: Record<string, string> = { ma: t('Mã'), ten: t('Tên'), mon: t('Môn'), 'so-tuan': t('Độ dài'), moc: t('Mốc Test'), nguong: t('Đạt từ') };
const soNguyen = (v: string) => (/^\d+$/.test(v.trim()) ? Number(v) : NaN);

/** Môn chọn được (OV-6b2): danh sách cố định; môn gộp không đi cùng môn nó đã gồm. */
const monConChon = (da: readonly string[]) => (MON_CHON as readonly string[]).filter((k) => !da.includes(k)
  && !MON_GOP[k]?.some((x) => da.includes(x)) && !da.some((g) => MON_GOP[g]?.includes(k)));

/** Giá trị form của một dòng (chưa sửa) — panel "+ Chương trình", ô sửa tại chỗ và công tắc Còn dùng cùng điểm xuất phát. */
function fCua(d: Dong, suaCauTruc: boolean) {
  const ct = d.loai === 'ct' ? d.ct : null;
  const moi = d.loai === 'moi';
  return {
    ma: '',
    ten: d.loai === 'moi' ? '' : d.loai === 'ft' ? d.lt.name : d.ct.name,
    mon: ct ? [...ct.skills] : ['listening_speaking', 'reading_writing'],
    nguong: ct?.nguongDat != null ? String(ct.nguongDat) : moi ? '70' : '',
    lienTuc: moi || !!ct?.lapMoiTuan,
    lap: ct?.lapMoiTuan ? String(ct.lapMoiTuan) : '6',
    soTuan: ct?.weeks ? String(ct.weeks) : suaCauTruc ? '10' : '',
    progress: ct ? String(moc(ct, 'progress') ?? '') : '',
    final: ct && moc(ct, 'final') !== null ? String(moc(ct, 'final')) : suaCauTruc ? '10' : '',
    mt: d.loai === 'ft' ? d.lt.lichMt.map(String) : [],
    conDung: d.loai === 'moi' || conDung(d),
  };
}
type FormCt = ReturnType<typeof fCua>;
const coCauTruc = (d: Dong) => d.loai === 'moi' || (d.loai === 'ct' && !d.ct.goc && !d.ct.coLop);

/** Thân PUT của một dòng từ giá trị form — một chỗ cho panel, ô sửa tại chỗ, công tắc Còn dùng và Hoàn tác. */
function yeuCauLuu(d: Dong, f: FormCt): [string, Record<string, unknown>] {
  const ct = d.loai === 'ct' ? d.ct : null;
  const thuong = d.loai === 'moi' || ct?.scoringMode === 'ratio';
  const suaCauTruc = coCauTruc(d);
  const suaMon = suaCauTruc || (!!ct && !ct.khoaMon);
  const coGiuaKhoa = !!ct && moc(ct, 'progress') !== null;
  const nguongDat = Number(f.nguong.replace(',', '.'));
  const soTuan = soNguyen(f.soTuan);
  const trangThai = f.conDung ? 'active' : 'inactive';
  if (d.loai === 'ft') return ['/admin/routes', { code: d.lt.code, name: f.ten, note: d.lt.note, status: trangThai, lichMt: f.mt.map(Number) }];
  const cauTruc = f.lienTuc ? { weeks: null, lapMoiTuan: Number(f.lap) } : { weeks: soTuan, progressWeek: f.progress.trim() ? Number(f.progress) : null, finalWeek: Number(f.final) };
  if (d.loai === 'moi') return ['/admin/programmes', { taoMoi: true, code: f.ma, name: f.ten, skills: f.mon, scoringMode: 'ratio', nguongDat, status: trangThai, ...cauTruc }];
  if (suaCauTruc) return ['/admin/programmes', { code: d.ct.code, name: f.ten, skills: f.mon, nguongDat, status: trangThai, ...cauTruc }];
  return ['/admin/programmes', {
    code: d.ct.code, name: f.ten, status: trangThai,
    weeks: d.ct.weeks ? soTuan : null, progressWeek: coGiuaKhoa ? Number(f.progress) : null, finalWeek: d.ct.weeks ? Number(f.final) : null,
    ...(thuong ? { nguongDat } : {}),
    ...(d.ct.lapMoiTuan ? { lapMoiTuan: Number(f.lap) } : {}),
    ...(suaMon ? { skills: f.mon } : {}),
  }];
}

/**
 * FORM MỘT DÒNG (mockup §6 · GD-17b): giá trị · kiểm lỗi dưới ô (cùng luật máy chủ `sysconfig.ts`) · lưu. Panel "+ Chương trình" dùng đủ trường;
 * ô sửa tại chỗ (K2) dùng một trường — lưu vẫn gửi đủ dòng (các trường khác giữ nguyên giá trị đang có).
 */
function useFormCt(d: Dong) {
  const ct = d.loai === 'ct' ? d.ct : null;
  const ft = d.loai === 'ft';
  const moi = d.loai === 'moi';
  const thuong = moi || ct?.scoringMode === 'ratio';
  const coGiuaKhoa = !!ct && moc(ct, 'progress') !== null;
  /* OV-11b (QT-7): chương trình mới (chưa lưu) hoặc Quản trị tạo chưa có lớp → sửa như lúc tạo — thêm / bỏ Progress, Số tuần ↔ Liên tục. */
  const suaCauTruc = coCauTruc(d);
  /* MON-CT-1311: Môn sửa được ở mọi chương trình lớp thường, trừ chương trình máy chủ khoá (FT, Pre FOU — lý do ghi tại ô). */
  const suaMon = suaCauTruc || (!!ct && !ct.khoaMon);
  const [f, setF] = useState(() => fCua(d, suaCauTruc));
  const [goc, setGoc] = useState(() => JSON.stringify(f));   // luật I1: đã sửa → "Huỷ thay đổi"
  const [loiMay, setLoiMay] = useState<LoiTruong | null>(null);
  const lf = useLoiForm();
  const doi = (patch: Partial<FormCt>) => { setLoiMay(null); setF({ ...f, ...patch }); };
  const datLai = () => { const x = fCua(d, suaCauTruc); setF(x); setGoc(JSON.stringify(x)); setLoiMay(null); };
  const coSoTuan = suaCauTruc ? !f.lienTuc : !!ct?.weeks;
  const lapDuoc = suaCauTruc ? f.lienTuc : !!ct?.lapMoiTuan;

  const loi: LoiTruong[] = [...dsLoi([{ khoa: 'ten', nhan: t('Tên'), toiThieu: 1 }], { ten: f.ten })];
  if (moi && !/^[A-Z][A-Z0-9]{1,5}$/.test(f.ma)) loi.push({ khoa: 'ma', nhan: t('Mã'), lyDo: t('2–6 chữ in hoa / số, bắt đầu bằng chữ') });
  if (suaMon && !f.mon.length) loi.push({ khoa: 'mon', nhan: t('Môn'), lyDo: t('Chọn ít nhất một môn') });
  const soTuan = soNguyen(f.soTuan);
  if (thuong) {
    const ng = Number(f.nguong.replace(',', '.'));
    if (f.nguong.trim() === '' || !Number.isFinite(ng) || ng < 1 || ng > 100) loi.push({ khoa: 'nguong', nhan: t('Đạt từ'), lyDo: t('Từ 1 đến 100 %') });
  }
  if (ft) {
    const ds = f.mt.map(soNguyen);
    if (ds.some((w) => !Number.isInteger(w) || w < 1 || w > 104)) loi.push({ khoa: 'moc', nhan: t('Mốc Test'), lyDo: t('Tuần học từ 1 đến 104') });
    else if (ds.some((w, i) => i > 0 && w <= ds[i - 1])) loi.push({ khoa: 'moc', nhan: t('Mốc Test'), lyDo: t('MT sau phải ở tuần sau MT trước') });
  } else if (lapDuoc) {
    const n = soNguyen(f.lap);
    if (!Number.isInteger(n) || n < 1 || n > 52) loi.push({ khoa: 'moc', nhan: t('Mốc Test'), lyDo: t('Lặp mỗi 1–52 tuần') });
  } else if (coSoTuan) {
    const p = f.progress.trim() ? soNguyen(f.progress) : null; const fi = soNguyen(f.final);
    const canGiua = suaCauTruc ? p !== null : coGiuaKhoa;
    if (!Number.isInteger(soTuan) || soTuan < 1 || soTuan > 104) loi.push({ khoa: 'so-tuan', nhan: t('Độ dài'), lyDo: t('Từ 1 đến 104 tuần') });
    else if ((canGiua && !(p !== null && p >= 1 && p <= soTuan)) || !(fi >= 1 && fi <= soTuan)) loi.push({ khoa: 'moc', nhan: t('Mốc Test'), lyDo: t('Tuần từ 1 đến {n}', { n: soTuan }) });
    else if (canGiua && p !== null && p >= fi) loi.push({ khoa: 'moc', nhan: t('Mốc Test'), lyDo: t('Progress phải trước Final') });
  }
  if (loiMay) loi.push(loiMay);

  /** Gửi dòng; lỗi máy chủ có `details.o` → báo dưới đúng ô (chữ đã gõ giữ nguyên) rồi ném lại cho nơi gọi. */
  const gui = async () => {
    const [duong, than] = yeuCauLuu(d, f);
    try { await api.put(duong, than); } catch (e) {
      const o = e instanceof ApiError ? (e.details?.o as string | undefined) : undefined;
      if (o && NHAN_O[o]) { lf.bam(); setLoiMay({ khoa: o, nhan: NHAN_O[o], lyDo: (e as Error).message }); }
      throw e;
    }
  };
  return { d, f, doi, datLai, loi, lf, gui, daSua: JSON.stringify(f) !== goc, ct, ft, moi, thuong, coGiuaKhoa, suaCauTruc, suaMon, lapDuoc };
}
type Form = ReturnType<typeof useFormCt>;
type TruongO = 'ma' | 'ten' | 'mon' | 'cach' | 'nguong' | 'so-tuan' | 'moc';

/** Ô MỘT TRƯỜNG của form (panel "+ Chương trình" vẽ đủ; ô sửa tại chỗ vẽ một). */
function TruongCt({ o, form }: { o: TruongO; form: Form }) {
  const { f, doi, loi, lf, ct, ft, moi, thuong, coGiuaKhoa, suaCauTruc, suaMon, lapDuoc } = form;
  const oSo = 'field w-20 tabular-nums';
  const conChon = monConChon(f.mon);
  /* Tên ngắn theo chương trình (FOU: W → G+V, S → P). */
  const tenMon = (k: string) => tenMonNgan(moi ? f.ma || null : ct?.code ?? null, k);
  if (o === 'ma') return (
    <Field label={t('Mã')} required loi={lf.loiCua(loi, 'ma')}>
      <input className="field w-28 uppercase tabular-nums" maxLength={6} autoComplete="off" {...lf.o(loi, 'ma')} value={f.ma}
        onChange={(e) => doi({ ma: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })} />
    </Field>
  );
  if (o === 'ten') return (
    <Field label={t('Tên')} required loi={lf.loiCua(loi, 'ten')}>
      <input className="field w-full" maxLength={200} {...lf.o(loi, 'ten')} value={f.ten} onChange={(e) => doi({ ten: e.target.value })} />
    </Field>
  );
  if (o === 'mon') return suaMon ? (
    <Field as="div" label={t('Môn')} required loi={lf.loiCua(loi, 'mon')}>
      <span className="flex flex-wrap items-center gap-1.5" {...lf.o(loi, 'mon')}>
        {f.mon.map((k, i) => (
          <span key={k} className="inline-flex items-center">
            {/* MON-CT-1311: đổi thứ tự — đưa môn lên trước một bậc (thứ tự cột Nhập điểm, báo cáo). */}
            {i > 0 && (
              <button type="button" className="btn btn-sm btn-ghost min-h-[44px] px-2 sm:min-h-0" aria-label={t('Đưa {mon} lên trước', { mon: tenMon(k) })}
                onClick={() => doi({ mon: f.mon.map((x, j) => (j === i - 1 ? k : j === i ? f.mon[i - 1] : x)) })}>‹</button>
            )}
            <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" aria-label={t('Bỏ môn {mon}', { mon: tenMon(k) })}
              onClick={() => doi({ mon: f.mon.filter((x) => x !== k) })}>{tenMon(k)} <span aria-hidden className="text-slate-400">×</span></button>
          </span>
        ))}
        {conChon.length > 0 && (
          <OChonThuong aria-label={t('Thêm môn')} value="" onChange={(e) => e.target.value && doi({ mon: [...f.mon, e.target.value] })}>
            <option value="">{t('+ Môn')}</option>
            {conChon.map((k) => <option key={k} value={k}>{tenMon(k)}</option>)}
          </OChonThuong>
        )}
      </span>
    </Field>
  ) : (
    <dl className="m-0 grid grid-cols-[max-content_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
      <dt className="text-slate-400">{t('Môn')}</dt>
      <dd className="m-0 text-slate-200">{ct ? boMon(ct) : 'L · R · W · S'}
        {ct?.khoaMon && <span className="block text-xs text-slate-400">{dich(ct.khoaMon)}</span>}</dd>
    </dl>
  );
  if (o === 'cach') return moi ? (
    <Field as="div" label={t('Cách chấm')}>
      <PhanDoan nhan={t('Cách chấm')} giaTri="ratio" onChon={() => {}}
        muc={[{ v: 'ratio', nhan: t('Đúng / tổng') }, { v: 'band', nhan: 'Band IELTS', tat: true, title: t('Chỉ FT') }]} />
    </Field>
  ) : (
    <dl className="m-0 grid grid-cols-[max-content_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
      <dt className="text-slate-400">{t('Cách chấm')}</dt><dd className="m-0 text-slate-200">{thuong ? t('Đúng / tổng') : 'Band IELTS'}</dd>
    </dl>
  );
  if (o === 'nguong') return thuong ? (
    <Field label={t('Đạt từ')} loi={lf.loiCua(loi, 'nguong')}>
      <span className="flex items-center gap-2">
        <input inputMode="decimal" className={oSo} {...lf.o(loi, 'nguong')} value={f.nguong} onChange={(e) => doi({ nguong: e.target.value })} />
        <span className="text-slate-400">%</span>
      </span>
    </Field>
  ) : null;
  if (o === 'so-tuan') {
    if (suaCauTruc) return (
      <Field as="div" label={t('Độ dài')} loi={lf.loiCua(loi, 'so-tuan')}>
        <span className="flex flex-wrap items-center gap-2">
          <PhanDoan nhan={t('Độ dài')} giaTri={f.lienTuc ? 'lien-tuc' : 'so-tuan'} onChon={(v) => doi({ lienTuc: v === 'lien-tuc' })}
            muc={[{ v: 'so-tuan', nhan: t('Số tuần') }, { v: 'lien-tuc', nhan: t('Liên tục') }]} />
          {!f.lienTuc && (
            <span className="flex items-center gap-2">
              <input inputMode="numeric" aria-label={t('Số tuần')} className={oSo} {...lf.o(loi, 'so-tuan')} value={f.soTuan}
                onChange={(e) => doi({ soTuan: e.target.value, final: f.final === f.soTuan ? e.target.value : f.final })} />
              <span className="text-slate-400">{t('tuần')}</span>
            </span>
          )}
        </span>
      </Field>
    );
    if (ct?.weeks) return (
      <Field label={t('Độ dài')} loi={lf.loiCua(loi, 'so-tuan')}>
        <span className="flex items-center gap-2">
          <input inputMode="numeric" className={oSo} {...lf.o(loi, 'so-tuan')} value={f.soTuan}
            /* Final đang = số tuần thì đi theo số tuần mới (10 → 12 thì Final cũng 12). */
            onChange={(e) => doi({ soTuan: e.target.value, final: f.final === f.soTuan ? e.target.value : f.final })} />
          <span className="text-slate-400">{t('tuần')}</span>
        </span>
      </Field>
    );
    if (ct?.lapMoiTuan) return (
      <dl className="m-0 grid grid-cols-[max-content_minmax(0,1fr)] gap-x-4 text-sm">
        <dt className="text-slate-400">{t('Độ dài')}</dt><dd className="m-0 text-slate-200">{t('Liên tục')}</dd>
      </dl>
    );
    return ft && f.mt.length > 0
      ? <p className="m-0 text-sm text-slate-400">{t('Độ dài')} <span className="tabular-nums text-slate-200">{t('{n} tuần', { n: f.mt.at(-1) || '—' })}</span> {t('· tới MT cuối')}</p> : null;
  }
  /* o === 'moc' */
  if (!(ft || ct?.weeks || lapDuoc || suaCauTruc)) return null;
  return (
    <Field as="div" label={t('Mốc Test')} loi={lf.loiCua(loi, 'moc')}>
      {suaCauTruc && (
        <span className="mb-2 block">
          <PhanDoan nhan={t('Mốc Test')} giaTri={f.lienTuc ? 'lap' : 'co-dinh'} onChon={(v) => doi({ lienTuc: v === 'lap' })}
            muc={[{ v: 'co-dinh', nhan: t('Tuần cố định') }, { v: 'lap', nhan: t('Lặp mỗi n tuần') }]} />
        </span>
      )}
      {ft ? (
        <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {f.mt.map((w, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className="text-slate-400">{t('MT{i} tuần', { i: i + 1 })}</span>
              <input inputMode="numeric" aria-label={t('Tuần học của MT{i}', { i: i + 1 })} className="field w-16 tabular-nums" {...(i === 0 ? lf.o(loi, 'moc') : {})}
                aria-invalid={!!lf.loiCua(loi, 'moc')} value={w} onChange={(e) => doi({ mt: f.mt.map((x, k) => (k === i ? e.target.value : x)) })} />
            </span>
          ))}
          <span className="flex items-center gap-1">
            {f.mt.length < MT_TOI_DA && (
              <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0"
                onClick={() => doi({ mt: [...f.mt, String((Number(f.mt.at(-1)) || 0) + 4)] })}>+ MT</button>
            )}
            {f.mt.length > 1 && (
              <button type="button" className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0" aria-label={t('Bỏ MT{n}', { n: f.mt.length })}
                onClick={() => doi({ mt: f.mt.slice(0, -1) })}>{t('Bỏ MT{n}', { n: f.mt.length })}</button>
            )}
          </span>
        </span>
      ) : lapDuoc ? (
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-slate-200">Checkpoint</span><span className="text-slate-400">{t('mỗi')}</span>
          <input inputMode="numeric" aria-label={t('Checkpoint mỗi bao nhiêu tuần')} className="field w-16 tabular-nums" {...lf.o(loi, 'moc')}
            value={f.lap} onChange={(e) => doi({ lap: e.target.value })} />
          <span className="text-slate-400">{t('tuần')}</span>
        </span>
      ) : (
        <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {(coGiuaKhoa || suaCauTruc) && (
            <span className="flex items-center gap-1.5">
              <span className="text-slate-400">{t('Progress tuần')}</span>
              <input inputMode="numeric" aria-label={t('Tuần Progress Test')} className="field w-16 tabular-nums" {...lf.o(loi, 'moc')}
                placeholder={suaCauTruc ? '—' : undefined} value={f.progress} onChange={(e) => doi({ progress: e.target.value })} />
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="text-slate-400">{t('Final tuần')}</span>
            <input inputMode="numeric" aria-label={t('Tuần Final Test')} className="field w-16 tabular-nums" {...(coGiuaKhoa || suaCauTruc ? {} : lf.o(loi, 'moc'))}
              aria-invalid={!!lf.loiCua(loi, 'moc')} value={f.final} onChange={(e) => doi({ final: e.target.value })} />
          </span>
        </span>
      )}
    </Field>
  );
}

/** Câu hậu quả (đầu panel cũ → ngay trên nút Lưu của hộp, mockup K2). */
const cauApDung = (n: number) => <>{t('Áp cho lớp mở sau khi lưu ·')} <span className="tabular-nums">{n}</span> {t('lớp đang chạy giữ lịch cũ')}</>;

/**
 * PANEL "+ CHƯƠNG TRÌNH" (OV-6b2, GIỮ panel — [XM-3]: tạo mới cần Mã + Tên + Môn + Độ dài + Mốc cùng lúc). Sửa dòng có sẵn: tại ô (`OCt`).
 */
function ThemChuongTrinh({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const form = useFormCt({ loai: 'moi' });
  const [busy, setBusy] = useState(false);
  const luu = async () => {
    form.lf.bam();
    if (form.loi.length > 0 || busy) return;
    setBusy(true);
    try {
      await form.gui();
      toast.push('ok', t('Đã thêm {ma} — tạo lớp {ma} được ngay', { ma: form.f.ma }));
      onDone();
    } catch (e) { if (!(e instanceof ApiError && e.details?.o)) toast.push('error', (e as Error).message); } finally { setBusy(false); }
  };
  return (
    <KhungPanel tieuDe={form.f.ma ? t('{ma} · chương trình mới', { ma: form.f.ma }) : t('Chương trình mới')} onDong={onClose}
      ngCanh={<span className="text-xs text-slate-400">{t('Tạo lớp được ngay sau khi lưu')}</span>}
      chan={{
        daSua: form.daSua, huy: { onClick: onClose, disabled: busy },
        conThieu: form.lf.conThieu(form.loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={luu} disabled={busy}>{busy ? t('Đang lưu…') : t('Lưu')}</button>,
      }}>
      <div className="space-y-4 pt-3">
        {(['ma', 'ten', 'mon', 'cach', 'nguong', 'so-tuan', 'moc'] as const).map((o) => <TruongCt key={o} o={o} form={form} />)}
      </div>
    </KhungPanel>
  );
}

/**
 * Ô SỬA TẠI CHỖ (GD-17b, mockup ⑩ K2 — cùng mẫu Chi nhánh / Tài khoản `SuaTaiDong`): ô có viền = bấm là sửa; hộp neo dưới ô (điện thoại: panel toàn màn)
 * với đúng một trường + Huỷ thay đổi · Lưu; bấm ra ngoài khi đã gõ → hỏi một lần. Lưu xong toast Hoàn tác (gửi lại dòng như trước khi sửa).
 */
function OCt({ d, o, mat, onDaLuu }: { d: DongCo; o: TruongO; mat: ReactNode; onDaLuu: () => void }) {
  const toast = useToast();
  const form = useFormCt(d);
  const truoc = useRef<FormCt>(form.f);
  return (
    <SuaTaiDong vien nhan={NHAN_O[o] ?? o} tieuDe={NHAN_O[o] ?? o} ten={tenDong(d)} mat={mat} daDoi={form.daSua}
      loiTruoc={false}
      phu={o === 'moc' || o === 'so-tuan' ? <p className="m-0 rounded-md px-3 py-2 text-[13px] text-dim surface-2">{cauApDung(soLop(d))}</p> : undefined}
      onMo={() => { form.datLai(); truoc.current = fCua(d, form.suaCauTruc); }}
      onLuu={async () => {
        form.lf.bam();
        if (form.loi.length) throw new Error(form.loi[0].lyDo ?? form.loi[0].nhan);
        await form.gui();
        onDaLuu();
        const [duong, than] = yeuCauLuu(d, truoc.current);
        toast.hoanTac(t('Đã lưu {ten} — áp cho lớp mở sau', { ten: tenDong(d) }), async () => {
          try { await api.put(duong, than); onDaLuu(); toast.push('ok', t('Đã hoàn tác')); } catch (e) { toast.push('error', (e as Error).message); }
        }, { key: `ct:${khoaDong(d)}:${o}` });
      }}>
      <TruongCt o={o} form={form} />
    </SuaTaiDong>
  );
}

/** Công tắc CÒN DÙNG tại dòng (GD-17b, mockup K2 — cùng dáng công tắc Quyền): bấm là lưu ngay + toast Hoàn tác (bấm lại). */
function CongTacConDung({ d, onDaLuu }: { d: DongCo; onDaLuu: () => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const bat = conDung(d);
  const dat = async (gt: boolean, hoanTac: boolean) => {
    const f = { ...fCua(d, coCauTruc(d)), conDung: gt };
    const [duong, than] = yeuCauLuu(d, f);
    await api.put(duong, than);
    onDaLuu();
    if (!hoanTac) toast.hoanTac(gt ? t('Đã bật lại {ten}', { ten: tenDong(d) }) : t('Đã ngừng dùng {ten}', { ten: tenDong(d) }),
      async () => { try { await dat(!gt, true); toast.push('ok', t('Đã hoàn tác')); } catch (e) { toast.push('error', (e as Error).message); } }, { key: `ct-dung:${khoaDong(d)}` });
  };
  return (
    <button type="button" role="switch" aria-checked={bat} disabled={busy} aria-label={`${t('Còn dùng')} · ${tenDong(d)}: ${bat ? t('Có') : t('Không')}`}
      onClick={async () => { setBusy(true); try { await dat(!bat, false); } catch (e) { toast.push('error', (e as Error).message); } finally { setBusy(false); } }}
      className={`inline-flex min-h-[44px] cursor-pointer items-center gap-2 border-0 bg-transparent text-[13px] font-semibold sm:min-h-[34px] ${bat ? 'text-slate-100' : 'text-slate-400'}`}>
      <span aria-hidden className={`relative h-[22px] w-[38px] shrink-0 rounded-full border transition-colors ${bat ? 'border-[color:var(--accent)] bg-[color:var(--accent)]' : 'border-[color:var(--line-strong)] bg-[color:var(--surface-2)]'}`}>
        <span className={`absolute left-0 top-[2px] h-4 w-4 rounded-full transition-transform ${bat ? 'translate-x-[18px] bg-[color:var(--bg)]' : 'translate-x-[2px] bg-slate-400'}`} />
      </span>
      {bat ? t('Có') : t('Không')}
    </button>
  );
}
