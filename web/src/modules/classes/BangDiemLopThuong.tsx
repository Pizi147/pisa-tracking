import { ChipXetLaiDong } from './PanelXetLai.tsx';
import type { NguCanhDs, NhanYThucEm } from '@shared/domain/index.ts';
import { Fragment, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useThamSoUrl } from '../../lib/quayLai.ts';
import { ODiem } from '../../ui/ODiem.tsx';
import { NganCase } from '../students/NganCaseLuoi.tsx';
import { ChipLoc, KHOI, MUC_H, TenEm, bamHang } from './BangHoSoLop.tsx';
import type { CanHoTro, CaseCua } from './BangCanHoTro.tsx';
import { useApi } from '../../lib/useApi.ts';
import { Empty, Skeleton, TargetText } from '../../ui/ui.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { Nhan, QuaHan } from '../../ui/Nhan.tsx';
import { TheDong, useDienThoai } from '../../ui/TheDong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { MissingBadge } from '../students/MissingBadge.tsx';
import { CanhBaoYThuc } from './CanhBaoYThuc.tsx';
import { nhapDiemCua, useThaoTacDongHocVien, type QuyenDong } from './thaoTacDongHocVien.tsx';
import { OChon, OChonTatCa, type ChonNhieu } from '../students/chonNhieuHocVien.tsx';
import { ATTEMPT_KIND_SHORT, CHUONG_TRINH_KHONG_CHIA_MON, GIAI_THICH_KCK, KCK, duongHoSoHocVien, dongTabHocVien, khoaBai, nhanBai, viecTiepCuaEm, tenMon, tenMonNgan, tuanLich, type AttemptKind, type LienHe } from '@shared/domain/index.ts';
import { OPhuHuynh } from '../students/HocVienTheoVai.tsx';
import { dich, t } from '@shared/i18n/index.ts';

type ODiem = { score: number | null; total: number | null; outcome: string };
type LuotThuong = {
  id: number; kind: string; kindLabel: string; myPending: string[]; overdueSkills: number; attemptNo: number;
  ratios: Record<string, ODiem> | null; tuanMon: Record<string, string | null> | null;
};
type DongThuong = {
  id: number; studentCode: string; fullName: string; status: string; archived: boolean; moiVao?: boolean; skills: string[] | null;
  /** Số Case đang mở (roster) — chip lọc "Có Case", không đọc thêm. */
  openCases: number;
  missing: { key: string; label: string; who: string }[];
  canhBaoYThuc: NhanYThucEm | null;
  /** PR-DH (04/10): Target của lớp thường (PR-NT) — chỉ để theo dõi, không so với điểm. PR-OV3a: bỏ cột Dự kiến thi. */
  cycle: { target: number | null; khongCamKet?: boolean } | null;
  timeline: LuotThuong[];
  /** "Kết thúc vì" (Q18/Q22) — chỉ có ở bảng lớp ĐÃ KẾT THÚC. */
  ketThucVi?: string | null;
  /** GV-CU-BO-TRO: em đã chuyển, người xem đang dạy PA Bổ trợ miễn phí của em (máy chủ) — chip "Đã chuyển · đang bổ trợ ›" về hồ sơ HV. */
  dangBoTro?: { lopMoi: string | null } | null;
  /** GV-CU-BO-TRO [XM-2]: `false` = người xem (người dạy bổ trợ, chỉ xem lớp) không mở được hồ sơ em này — tên không link. */
  xemHoSo?: boolean;
  /** PR-UXF-a K2-12: % tổng Cuối khoá — cùng hàm với panel Chuyển lớp (`cuoiKhoaTheoHocVien`). */
  cuoiKhoa?: { tyLe: number | null } | null;
  /** PR-OV3a: hướng Quản lý ĐÃ CHỐT (máy chủ `loTrinhDaChot`) — nháp / đề xuất GVCN / gợi ý tự tính không có ở đây. */
  loTrinhChot?: { nhan: string; boTro: string | null; lopDich: string | null; tuan: string | null } | null;
  /** OV-10b: cột Phụ huynh (TVV / CX / Admin). */
  lienHe?: LienHe;
  /** TVV của em (cùng `/roster` với FT) — dòng dưới tên chỉ khi khác TVV chính của lớp (`tvvChinhCuaLop`, như FT). */
  tvv?: string | null;
};
type LoTrinhChot = NonNullable<DongThuong['loTrinhChot']>;
const TIEU_DE_LO_TRINH = t('Hướng Quản lý đã chốt (+ bổ trợ nếu có). Chưa chốt thì để trống — xem gợi ý ở panel Lộ trình tiếp theo.');

/** Hồ sơ lớp cũ chưa gửi mốc: Giữa khoá + Cuối khoá như trước. */
const MOC_MAC_DINH = ['progress', 'final'];
type Loc = 'tat-ca' | 'chua-dat' | 'case';
type MoNgan = { caseId: number; paId?: number; viec?: 'ghi-ket-qua' | 'xac-nhan' | 'xac-nhan-pa'; em: string };

/**
 * TAB HỌC VIÊN · CHẾ ĐỘ ĐIỂM · LỚP THƯỜNG (đặc tả §3.7, mockup 10b phương án A).
 * Nhóm cột theo MỐC của chương trình (FOU/BE/ELE Giữa khoá | Cuối khoá; Pre FOU chỉ Cuối khoá — K2-12), mỗi nhóm là bộ môn của
 * lớp, tên theo chương trình (FOU L R G+V P; Pre FOU một cột Tổng hợp + cột % — MH7). Ô `đúng/tổng`, đỏ nếu chưa đạt (dưới 70%). Chưa có điểm mà đã có lịch thì ghi
 * tuần thi (`W3 SEP`, G-6); chưa có lịch thì gạch. Thiếu điểm KHÁC chưa đạt: không tô đỏ.
 * PR-OV3a (M2 §3, cách xem "Tổng hợp"): bỏ cột Dự kiến thi; cột cuối "Lộ trình tiếp theo" = hướng Quản lý đã chốt, chưa chốt → "Chưa chốt".
 * Chủ SP 04/11 (theo U03 FT): bỏ cách xem "Cần hỗ trợ" — chip lọc Tất cả · Chưa đạt · Có Case trên thẻ bảng; ô điểm "✓ / ✗ 14/20" (`ODiem` ti-le);
 * bấm tên → mở ngay dưới hàng: Case đang mở của em (dòng Case cũ của Cần hỗ trợ: trạng thái · PA · việc tiếp → panel Case) + "Hồ sơ HV ›" · "+ Case".
 * Chi tiết Case chỉ đọc khi mở em đầu tiên (một `/classes/:id/can-ho-tro`, dùng lại cho các em khác).
 */
export function BangDiemLopThuong({ classId, maLop, quyen, onDoi, chuongTrinh = null, moc = null, chon, lienTuc = false, cachXem, nutChon, daKetThuc = false }: {
  classId: number; maLop?: string; quyen: QuyenDong; onDoi: () => void;
  /** Nút đoạn Cách xem (đầu) + "Chọn nhiều" (cuối) trên hàng chip lọc của thẻ bảng — như FT. */
  cachXem?: ReactNode; nutChon?: ReactNode;
  /** PR-LUI-b: "Chọn nhiều học viên" — bật thì mỗi dòng / thẻ có ô chọn (Quản lý / Quản trị). */
  chon?: ChonNhieu;
  /** Mã chương trình lớp (MH2) và mốc kiểm tra của chương trình (`progress`/`final`). */
  chuongTrinh?: string | null; moc?: string[] | null;
  /** OV-6b2: lớp liên tục (PET, KET…) — cột theo Checkpoint, không Target, không Lộ trình tiếp theo. */
  lienTuc?: boolean;
  /** HSL-LUU-TRU: lớp đã kết thúc — giữ cả em đã lưu trữ (nhãn "Lưu trữ", không ⋯), khớp "n HV" đầu trang + Tổng kết. */
  daKetThuc?: boolean;
}) {
  const { homNay } = useNgayNghiepVu();
  const { data, loading, error, reload } = useApi<DongThuong[]>(`/classes/${classId}/roster`, [classId]);
  const [daMo, setDaMo] = useState(false);
  const chot = useApi<CanHoTro>(daMo ? `/classes/${classId}/can-ho-tro` : null, [classId, daMo]);
  const tai = () => { reload(); if (daMo) chot.reload(); onDoi(); };
  const tt = useThaoTacDongHocVien({ laLopThuong: true, quyen, maLop, classId, onDone: tai });
  const dienThoai = useDienThoai();
  /* Chip lọc trên URL (`?loc=`) — Quay lại / F5 giữ lọc (như FT). */
  const [locUrl, setLoc] = useThamSoUrl('loc', 'tat-ca');
  const loc: Loc = locUrl === 'chua-dat' || locUrl === 'case' ? locUrl : 'tat-ca';
  const [mo, setMo] = useState<number | null>(null);
  const [ngan, setNgan] = useState<MoNgan | null>(null);
  const moTen = (id: number) => { setDaMo(true); setMo(mo === id ? null : id); };

  if (error) return <p className="m-0 text-xs text-rose-200">{error.message}</p>;
  if (loading || !data) return <Skeleton rows={4} />;
  const tatCa = dongTabHocVien(data, daKetThuc);
  if (!tatCa.length) return <Empty title={t('Lớp chưa có học viên')} />;
  const mon = tatCa[0].skills ?? [];
  /* OV-6b2: lớp liên tục — mỗi Checkpoint đã có một nhóm cột (khoá `checkpoint:n`), 4 Checkpoint gần nhất.
     shortcut: chỉ 4 Checkpoint gần nhất ở Tổng hợp (đủ ở Test › Điểm theo lớp), thêm cuộn / chọn khi chủ SP cần xem cả năm. */
  const cp = lienTuc ? [...new Set(tatCa.flatMap((s) => s.timeline.filter((t) => t.kind === 'checkpoint').map((t) => t.attemptNo)))].sort((a, b) => a - b).slice(-4) : [];
  const BAI = lienTuc ? cp.map((n) => ({ kind: khoaBai('checkpoint', n), nhan: nhanBai(khoaBai('checkpoint', n)) }))
    : (moc?.length ? moc : MOC_MAC_DINH).map((kind) => ({ kind, nhan: ATTEMPT_KIND_SHORT[kind as AttemptKind] ?? kind }));
  const luotCua = (s: DongThuong, kind: string) => s.timeline.find((x) => khoaBai(x.kind, x.attemptNo) === kind) ?? null;
  /** P13 KET-PET: cột môn của một mốc = các môn thực có của các lượt mốc đó (lượt đã ghi môn gộp cũ giữ L+S / R+W) — thứ tự: môn lớp trước. */
  const monCua = (kind: string): string[] => {
    const co = new Set(tatCa.flatMap((s) => Object.keys(luotCua(s, kind)?.ratios ?? {})));
    return co.size ? [...mon.filter((k) => co.has(k)), ...[...co].filter((k) => !mon.includes(k))] : mon;
  };
  /* MH7: Pre FOU không chia môn — thêm cột % tổng sau cột Tổng hợp của mỗi mốc. K2-12: nhóm Cuối khoá mọi lớp thường có "% tổng"; Checkpoint cũng có. */
  const coPhanTram = CHUONG_TRINH_KHONG_CHIA_MON.includes(chuongTrinh ?? '');
  const cotPhu = (kind: string) => (coPhanTram || kind === 'final' || kind.startsWith('checkpoint') ? ['%'] : []);
  /** % của một mốc: Cuối khoá đọc % tổng máy chủ (cùng số với panel Chuyển lớp); Checkpoint = Σ điểm / Σ tổng khi đủ mọi môn; Pre FOU từ ô Tổng hợp. */
  const phanTram = (s: DongThuong, kind: string, o: ODiem | null): number | null => {
    if (kind === 'final') return s.cuoiKhoa?.tyLe ?? null;
    if (kind.startsWith('checkpoint')) {
      const ds = Object.values(luotCua(s, kind)?.ratios ?? {});   // P13: môn của chính lượt
      return ds.length > 0 && ds.every((x) => x && x.score !== null && x.total) ? ds.reduce((a, x) => a + x!.score!, 0) / ds.reduce((a, x) => a + x!.total!, 0) : null;
    }
    return o && o.score !== null && o.total ? o.score / o.total : null;
  };

  /** Chưa đạt = mốc mới nhất đã có điểm có môn dưới ngưỡng (outcome máy chủ, cùng ô đỏ ✗). */
  const chuaDat = (s: DongThuong) => {
    for (const b of [...BAI].reverse()) {
      const o = Object.values(luotCua(s, b.kind)?.ratios ?? {});
      if (o.some((x) => x?.score != null)) return o.some((x) => x?.outcome === 'fail');
    }
    return false;
  };
  /* Chip đếm đúng tập của bảng (em đã chuyển còn bổ trợ ở khối riêng dưới bảng). */
  const trongBang = tatCa.filter((s) => !s.dangBoTro);
  const dem: Record<Loc, number> = { 'tat-ca': trongBang.length, 'chua-dat': trongBang.filter(chuaDat).length, case: trongBang.filter((s) => s.openCases > 0).length };
  /* GD-6 (mockup v21 ② K6, R2.6): em đã chuyển còn bổ trợ không nằm lẫn trong bảng — khối gập "Đã chuyển · đang bổ trợ · n em" dưới bảng. */
  const boTro = tatCa.filter((s) => s.dangBoTro);
  const rows = tatCa.filter((s) => !s.dangBoTro && (loc === 'tat-ca' || (loc === 'case' ? s.openCases > 0 : chuaDat(s))));
  const khoiBoTro = boTro.length > 0 && (
    <details className="group/bt border-t" style={{ borderColor: 'var(--line)' }} open>
      <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-2 px-4 text-[15px] font-bold text-slate-100">
        <svg aria-hidden viewBox="0 0 16 16" width="14" height="14" className="shrink-0 -rotate-90 fill-none stroke-current text-dim transition-transform group-open/bt:rotate-0 motion-reduce:transition-none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 6L8 10.5 12.5 6" /></svg>
        {t('Đã chuyển · đang bổ trợ')}
        <span className="inline-flex h-[22px] items-center rounded border px-1.5 text-xs font-bold tabular-nums" style={{ borderColor: 'var(--line-strong)' }}>{t('{n} em', { n: boTro.length })}</span>
      </summary>
      <ul className="m-0 list-none p-0">
        {boTro.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t px-4 py-2.5 text-sm max-sm:gap-x-3" style={{ borderColor: 'var(--line)' }}>
            <span className="min-w-[10rem] font-semibold text-slate-100">{s.fullName}</span>
            {s.dangBoTro?.lopMoi && <span className="text-dim">→ {s.dangBoTro.lopMoi}</span>}
            {s.loTrinhChot?.boTro && <span className="text-slate-100">{dich(s.loTrinhChot.boTro)}</span>}
            {s.xemHoSo !== false && (
              <Link to={duongHoSoHocVien(s.id)} state={{ ds }} className="link ml-auto whitespace-nowrap font-semibold max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center"
                title={s.dangBoTro?.lopMoi ? t('Đang học {lop} — bạn vẫn ghi kết quả bổ trợ và Mini Test', { lop: s.dangBoTro.lopMoi }) : undefined}>{t('Hồ sơ HV ›')}</Link>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
  const ds: NguCanhDs = { loai: 'hoc-vien', ids: rows.map((s) => s.id), nhan: maLop ? t('Lớp {lop}', { lop: maLop }) : t('Lớp') };   // PR-DH: Trước/Sau theo thứ tự bảng
  const thanh = (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5 border-b px-4 py-2.5" style={{ borderColor: 'var(--line)' }}>
      {cachXem}
      {cachXem && <span aria-hidden className="h-6 w-px bg-[color:var(--line-strong)] max-sm:hidden" />}
      {(['tat-ca', 'chua-dat', 'case'] as const).map((k) => (
        <ChipLoc key={k} chon={loc === k} so={dem[k]} onBam={() => { setLoc(k); setMo(null); }}>{k === 'tat-ca' ? t('Tất cả') : k === 'chua-dat' ? t('Chưa đạt') : t('Có Case')}</ChipLoc>
      ))}
      {nutChon && <span className="ml-auto max-sm:ml-0">{nutChon}</span>}
    </div>
  );
  const rongLoc = !rows.length && (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-sm text-dim">
      {t('Không có học viên nào')}
      <button type="button" className="btn btn-sm" onClick={() => setLoc('tat-ca')}>{t('Tất cả')} <b className="tabular-nums">{dem['tat-ca']}</b></button>
    </div>
  );
  const moRong = (s: DongThuong) => (
    <MoRongThuong s={s} mon={mon} chot={chot} ct={chot.data?.ct ?? chuongTrinh} ds={ds} homNay={homNay}
      moc={BAI.map((b) => { const lu = luotCua(s, b.kind); return { kind: b.kind, nhan: b.nhan, tuan: Object.values(lu?.tuanMon ?? {}).find(Boolean) ?? null,
        o: lu?.ratios ?? {}, pt: phanTram(s, b.kind, lu?.ratios?.[mon[0]] ?? null), coPt: cotPhu(b.kind).includes('%') }; })}
      coTheBaoCase={quyen.coTheBaoCase} onThemCase={() => tt.moCase(s.id, s.fullName)} onMo={(n) => setNgan({ ...n, em: s.fullName })} />
  );
  const nganCase = ngan && (
    <NganCase caseId={ngan.caseId} paId={ngan.paId} viec={ngan.viec} hocVien={ngan.em} lop={maLop} onClose={() => { setNgan(null); tai(); }} onChanged={tai} />
  );
  const tenEm = (s: DongThuong) => <TenEm s={s} mo={mo === s.id} onMo={() => moTen(s.id)} ds={ds} />;
  /* HSL-THUONG (như FT `nhanPhu`): dòng dưới tên — TVV khác TVV chính của lớp · "mới vào W3 SEP" chữ mờ · thiếu thông tin · Ý thức · Kết thúc vì. */
  /* GD-6 (lời 25 ý 3): không TVV dưới tên — TVV ở phần mở rộng em. */
  const dongPhu = (s: DongThuong) => {
    if (!s.archived && !s.moiVao && !s.missing.length && !s.canhBaoYThuc && !s.ketThucVi && !s.dangBoTro) return null;
    return (
      <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
        {s.archived && <Nhan tone="muted">{t('Lưu trữ')}</Nhan>}
        {s.moiVao && <span className="whitespace-nowrap text-[12px] text-faint">{t('mới vào')} {tuanLich(homNay, homNay)}</span>}
        <MissingBadge items={s.missing} gon /><CanhBaoYThuc cb={s.canhBaoYThuc} />
        {s.ketThucVi && !s.dangBoTro && <span className="text-xs text-faint">{dich(s.ketThucVi)}</span>}
      </span>
    );
  };
  const oTen = (s: DongThuong) => (
    <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
      {chon?.bat && <OChon chon={chon} id={s.id} ten={s.fullName} />}
      <span className="flex min-w-0 flex-col items-start">{tenEm(s)}<ChipXetLaiDong sid={s.id} />{dongPhu(s)}</span>
    </span>
  );
  const menu = (s: DongThuong, lopNut?: string) => (
    /* GV-CU-BO-TRO: em đã chuyển (dòng "Đã chuyển · đang bổ trợ ›") không còn thao tác ở lớp cũ — chỉ lối vào hồ sơ HV. */
    <MenuDong lopNut={lopNut} muc={s.archived || s.dangBoTro ? [] : tt.mucCua({ id: s.id, ten: s.fullName, dangHoc: s.status === 'active', nhapDiem: nhapDiemCua(classId, true, s.timeline), status: s.status, xuLyYThuc: !!s.canhBaoYThuc })} />
  );
  const lopHang = (s: DongThuong) => `${s.status !== 'active' || s.dangBoTro ? 'row-muted' : ''} ${chon?.chon.has(s.id) ? 'bg-[color:var(--accent-soft)]' : ''}`;

  /*
   * 375 (mockup C, như lưới 5 ô của FT): mỗi em một thẻ — tên (+ dòng phụ) · ⋯ 44 px · LƯỚI cột môn × hàng mốc trên nền phụ (điểm không "/tổng";
   * tổng ở hồ sơ HV) · chân Target · Lộ trình (· Phụ huynh). Chạm thẻ / ▾ → khối Case cuối thẻ.
   */
  if (dienThoai) {
    const cotMon = [...new Set(BAI.flatMap((b) => monCua(b.kind)))];
    const coPt = BAI.some((b) => cotPhu(b.kind).includes('%'));
    const luoi = { gridTemplateColumns: `62px repeat(${cotMon.length}, minmax(0,1fr))${coPt ? ' 40px' : ''}` };
    return (
      <div className="card overflow-hidden">
        {thanh}{rongLoc}
        <div>
        {rows.map((s) => {
          /* Chân thẻ một dòng (mockup C): mỗi trường "nhãn giá trị", cùng thứ tự cột bảng. */
          const chan = [
            ...(lienTuc ? [] : [{ nhan: 'Target', noiDung: <b className="font-semibold text-slate-100"><OTarget c={s.cycle} /></b> },
              { nhan: t('Lộ trình'), noiDung: <OLoTrinh lt={s.loTrinhChot ?? null} homNay={homNay} gon /> }]),
            ...(quyen.theoVai ? [{ nhan: t('Phụ huynh'), noiDung: s.lienHe ? <OPhuHuynh l={s.lienHe} /> : <>—</> }] : []),
          ];
          return (
            <TheDong key={s.id} onClick={bamHang(() => moTen(s.id))} className={`grid cursor-pointer gap-2 !px-3.5 !py-3 ${mo === s.id ? 'dang-mo' : ''} ${lopHang(s)}`}
              dau={<span className="text-[15px]">{oTen(s)}</span>} hanhDong={menu(s, 'btn h-11 w-11 shrink-0 justify-center !px-0 text-[13px] font-bold tracking-wider')} dong={[]}>
              <div className={`grid items-center gap-y-1 rounded-lg px-2 py-1.5 text-center ${mo === s.id ? 'bg-[color:var(--surface)]' : 'bg-[color:var(--surface-2)]'}`} style={luoi}>
                <span />{cotMon.map((k) => <abbr key={k} className="text-xs font-semibold text-faint no-underline" title={tenMon(chuongTrinh, k)}>{tenMonNgan(chuongTrinh, k)}</abbr>)}{coPt && <span className="text-xs font-semibold text-faint">%</span>}
                {BAI.map((b) => {
                  const lu = luotCua(s, b.kind);
                  return (
                    <Fragment key={b.kind}>
                      <span className="text-left text-xs font-semibold text-dim">{b.nhan.replace(/ Test$/, '')}</span>
                      {cotMon.map((k) => <span key={k} className="text-sm"><ODiemThuong o={lu?.ratios?.[k] ?? null} gon /></span>)}
                      {coPt && <span>{cotPhu(b.kind).includes('%') ? <OPhanTram v={phanTram(s, b.kind, lu?.ratios?.[mon[0]] ?? null)} /> : null}</span>}
                    </Fragment>
                  );
                })}
              </div>
              {chan.length > 0 && (
                <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1 text-[13px] font-medium text-faint">
                  {chan.map((d) => <span key={d.nhan} className="inline-flex flex-wrap items-baseline gap-x-1.5">{d.nhan} {d.noiDung}</span>)}
                </div>
              )}
              {mo === s.id && <div id={`mo-${s.id}`}>{moRong(s)}</div>}
            </TheDong>
          );
        })}
        </div>
        {khoiBoTro}
        {tt.panels}{nganCase}
      </div>
    );
  }

  /* Vạch dọc tách nhóm mốc (mockup B `.g`) — đầu mỗi nhóm và cột Lộ trình. */
  const VACH = { boxShadow: 'inset 1px 0 0 var(--line)' };
  const soCot = 1 + (lienTuc ? 0 : 1) + BAI.reduce((n, b) => n + monCua(b.kind).length + cotPhu(b.kind).length, 0) + (lienTuc ? 0 : 1) + (quyen.theoVai ? 1 : 0) + 1;
  return (
    <section className="card overflow-clip">
    {thanh}
    {rongLoc || <div className="table-scroll bang-dinh xl:overflow-clip">
      <table className="w-full min-w-[1040px] table-fixed text-sm">
        <colgroup>
          <col className="w-[19%]" />{!lienTuc && <col className="w-[6%]" />}
          {BAI.flatMap((b) => [...monCua(b.kind), ...cotPhu(b.kind)].map((k) => <col key={`${b.kind}-${k}`} className={k === '%' ? 'w-16' : ''} />))}
          {!lienTuc && <col className="w-[13rem]" />}{quyen.theoVai && <col className="w-[10rem]" />}<col className="w-14" />
        </colgroup>
        <thead>
          <tr>
            <th className="th sticky-col align-bottom" rowSpan={2}>{chon?.bat && <span className="mr-2 inline-flex align-middle"><OChonTatCa chon={chon} ids={rows.map((s) => s.id)} /></span>}{t('Học viên')}</th>
            {!lienTuc && <th className="th text-center align-bottom" rowSpan={2} title={t('Điểm Target của lộ trình em đang học. KCK = không cam kết đầu ra. Lớp thường chỉ để theo dõi.')}>Target</th>}
            {BAI.map((b) => (
              <th key={b.kind} className="th border-b !pb-1 text-center" colSpan={monCua(b.kind).length + cotPhu(b.kind).length} style={{ borderColor: 'var(--line)', ...VACH }}>{b.nhan}</th>
            ))}
            {!lienTuc && <th className="th align-bottom" rowSpan={2} title={TIEU_DE_LO_TRINH} style={VACH}>{t('Lộ trình tiếp theo')}</th>}
            {quyen.theoVai && <th className="th align-bottom" rowSpan={2}>{t('Phụ huynh')}</th>}
            <th className="th" rowSpan={2}><span className="sr-only">{t('Thao tác')}</span></th>
          </tr>
          <tr>
            {BAI.flatMap((b) => [
              ...monCua(b.kind).map((k, i) => (
                <th key={`${b.kind}-${k}`} className="th !pt-1 text-center" style={i === 0 ? VACH : undefined}><abbr className="no-underline" title={tenMon(chuongTrinh, k)}>{tenMonNgan(chuongTrinh, k)}</abbr></th>
              )),
              ...(cotPhu(b.kind).includes('%') ? [<th key={`${b.kind}-%`} className="th !pt-1 text-center" title={t('Điểm đạt / tổng điểm cả bài')}>%</th>] : []),
            ])}
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <Fragment key={s.id}>
            <tr onClick={bamHang(() => moTen(s.id))} className={`row-hover cursor-pointer ${mo === s.id ? 'dang-mo' : ''} ${lopHang(s)}`}>
              {/* 640–1023 px: bảng cuộn ngang TRONG vùng bảng, cột tên dính (mỗi lớp một bảng nên không bám cả trang). */}
              <td className="td sticky-col h-12 !overflow-visible">{oTen(s)}</td>
              {!lienTuc && <td className="td text-center tabular-nums whitespace-nowrap"><OTarget c={s.cycle} /></td>}
              {BAI.flatMap((b) => {
                const lu = luotCua(s, b.kind);
                const o = lu?.ratios?.[mon[0]] ?? null;
                return [
                  ...monCua(b.kind).map((k, i) => (
                    <td key={`${b.kind}-${k}`} className="td text-center tabular-nums" style={i === 0 ? VACH : undefined}>
                      <ODiemThuong o={lu?.ratios?.[k] ?? null} />
                    </td>
                  )),
                  ...(cotPhu(b.kind).includes('%') ? [(
                    <td key={`${b.kind}-%`} className="td text-center"><OPhanTram v={phanTram(s, b.kind, o)} /></td>
                  )] : []),
                ];
              })}
              {!lienTuc && <td className="td" style={VACH}><OLoTrinh lt={s.loTrinhChot ?? null} homNay={homNay} /></td>}
              {quyen.theoVai && <td className="td">{s.lienHe ? <OPhuHuynh l={s.lienHe} /> : '—'}</td>}
              <td className="td text-center">{menu(s)}</td>
            </tr>
            {mo === s.id && (
              /* Như FT: dải mở nền phụ, vạch trái 3 px nối hàng đang mở. */
              <tr className="mo-em"><td id={`mo-${s.id}`} className="td !h-auto !px-4 !pb-3.5 !pt-0 [background:var(--surface-2)]" style={{ boxShadow: 'inset 3px 0 0 var(--accent-strong)' }} colSpan={soCot}>{moRong(s)}</td></tr>
            )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>}
    {khoiBoTro}
    {tt.panels}{nganCase}
    </section>
  );
}

/** Một mốc của em trong phần mở rộng (cũ → mới do nơi gọi xếp): nhãn · tuần · ô theo môn · % (nếu mốc có). */
type MocEm = { kind: string; nhan: string; tuan: string | null; o: Record<string, ODiem | null>; pt: number | null; coPt: boolean };
const KY_VONG_THUONG = 0.7;   // đạt từ 70 % (`outcome` máy chủ, rule book lớp thường) — chỉ để ghi "kỳ vọng 70 %"

/**
 * MỞ RỘNG MỘT EM · LỚP THƯỜNG (GD-6, mockup v21 ② K6, lời 25 ý 2 — CÙNG KHUNG FT `MoRongEm`, đơn vị là MÔN): trái "Điểm theo lượt" (mốc mới nhất đậm,
 * cột môn của chương trình · % · Kỳ vọng 70 %, TVV nhỏ) · phải thẻ Môn (mốc trước → mới nhất · Không Case / Có Case / Có Case · có PA; Case quá hạn tô màu — V22)
 * rồi tóm tắt môn đang chọn: Hồ sơ HV › · Xem chi tiết (panel Case) / + Case · Điểm (chuỗi mốc) · Case · PA (Bổ trợ miễn phí, buổi) · Việc tiếp
 * (cùng nút, cùng panel với dòng Case cũ — không mất thao tác). Thay khối "Case đang mở" 08/11. Case chỉ đọc khi mở em đầu tiên (`can-ho-tro`, như trước).
 */
function MoRongThuong({ s, moc, mon, chot, ct, ds, homNay, coTheBaoCase, onThemCase, onMo }: {
  s: DongThuong; moc: MocEm[]; mon: string[];
  chot: { data: CanHoTro | null | undefined; error: unknown; reload: () => void }; ct: string | null; ds: NguCanhDs; homNay: string;
  coTheBaoCase: boolean; onThemCase: () => void; onMo: (n: Omit<MoNgan, 'em'>) => void;
}) {
  const e = chot.data?.em.find((x) => x.id === s.id);
  const caseMon = (k: string) => (e?.cases ?? []).filter((c) => mon.length === 1 || c.topic === k);
  const coDiem = moc.filter((m) => Object.values(m.o).some((x) => x?.score != null));
  const moi = coDiem[coDiem.length - 1] ?? null;
  /* Môn mặc định: môn có Case quá hạn → môn có Case → môn chưa đạt ở mốc mới nhất → chưa chọn. */
  const macDinh = mon.find((k) => caseMon(k).some((c) => c.quaHan)) ?? mon.find((k) => caseMon(k).length > 0) ?? mon.find((k) => moi?.o[k]?.outcome === 'fail') ?? null;
  const [chonTay, setChon] = useState<string | null>(null);
  const kn = chonTay ?? macDinh;
  const coPt = moc.some((m) => m.coPt);
  const dienThoai = useDienThoai();
  const NUT = 'btn h-[30px] px-2.5 text-[13px] max-sm:h-11 max-sm:flex-1';
  const NH = 'text-xs font-medium text-faint';
  const caKn = kn ? caseMon(kn) : [];
  const c0 = caKn[0] ?? null;
  const nguoiPa = c0?.pas.find((p) => p.nguoi)?.nguoi ?? null;
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <section className={KHOI} style={{ borderColor: 'var(--line)' }} aria-label={t('Điểm theo lượt')}>
        <div className="flex items-center gap-3">
          <h4 className={MUC_H}>{t('Điểm theo lượt')}</h4>
          {/* GD-6 (lời 25 ý 3): TVV của em — chữ nhỏ mờ, chỉ ở đây. */}
          {s.tvv && <span className="ml-auto text-xs font-medium text-faint">TVV {s.tvv}</span>}
        </div>
        {coDiem.length ? (
          <table className="w-full table-fixed text-sm">
            <thead><tr className="text-xs font-medium text-faint">
              <th className="w-[30%] pb-1.5 text-left font-medium">{t('Lượt')}</th>
              {mon.map((k) => <th key={k} className="pb-1.5 text-center font-medium"><abbr className="no-underline" title={tenMon(ct, k)}>{tenMonNgan(ct, k)}</abbr></th>)}
              {coPt && <th className="pb-1.5 text-center font-medium">%</th>}
              <th className="pb-1.5 text-center font-medium max-sm:hidden">{t('Kỳ vọng')}</th>
            </tr></thead>
            <tbody>
              {[...coDiem].reverse().map((m, i) => (
                <tr key={m.kind} className="border-t" style={{ borderColor: 'var(--line)' }}>
                  <td className="py-2">
                    <span className={`block whitespace-nowrap text-slate-100 ${i === 0 ? 'font-bold' : 'font-normal'}`}>{m.nhan}</span>
                    {m.tuan && <small className="block whitespace-nowrap text-xs font-medium text-faint">{tuanLich(m.tuan, homNay)}</small>}
                  </td>
                  {mon.map((k) => <td key={k} className="py-2 text-center"><ODiemThuong o={m.o[k] ?? null} gon={dienThoai} /></td>)}
                  {coPt && <td className="py-2 text-center">{m.coPt ? <OPhanTram v={m.pt} /> : <span className="text-faint">–</span>}</td>}
                  <td className="py-2 text-center text-[13px] tabular-nums text-dim max-sm:hidden">{Math.round(KY_VONG_THUONG * 100)} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="m-0 text-sm text-dim">{t('Chưa có điểm.')}</p>}
      </section>
      <section className={KHOI} style={{ borderColor: 'var(--line)' }} aria-label={t('Môn')}>
        <h4 className={MUC_H}>{t('Môn')}</h4>
        <div className="grid gap-2 max-sm:gap-1" style={{ gridTemplateColumns: `repeat(${Math.max(1, mon.length)}, minmax(0,1fr))` }}>
          {mon.map((k) => {
            const cs = caseMon(k);
            const truoc = coDiem[coDiem.length - 2]?.o[k] ?? null;
            const sau = moi?.o[k] ?? null;
            const qua = cs.some((c) => c.quaHan);
            return (
              <button key={k} type="button" aria-pressed={kn === k} onClick={() => setChon(k)}
                className={`grid gap-1 rounded-lg border px-2.5 py-2 text-left max-sm:justify-items-center max-sm:px-1 max-sm:py-1.5 ${kn === k ? 'bg-[color:var(--accent-soft)] shadow-[inset_0_0_0_1px_var(--accent)] [border-color:var(--accent)]' : 'bg-[color:var(--surface)] [border-color:var(--line)] hover:[border-color:var(--accent)]'}`}>
                <span className={`text-[13px] font-bold ${qua ? 'text-late' : 'text-slate-100'}`} title={tenMon(ct, k)}>{tenMonNgan(ct, k)}{qua && <span className="sr-only"> · {t('quá hạn')}</span>}</span>
                <span className="text-[15px] font-bold tabular-nums">{truoc?.score != null && sau?.score != null && <span className="max-sm:hidden">{truoc.score} → </span>}<ODiemThuong o={sau} /></span>
                <span className={`text-xs max-sm:hidden ${qua ? 'font-semibold text-late' : 'text-dim'}`}>{!e ? (chot.data ? t('Không Case') : '…') : cs.length ? (cs.some((c) => c.pas.length > 0) ? t('Có Case · có PA') : t('Có Case')) : t('Không Case')}</span>
              </button>
            );
          })}
        </div>
        {chot.error ? (
          <div role="alert" className="flex flex-wrap items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm bg-bad-bg border-bad-line">
            <span>{t('Chưa tải được chi tiết Case.')}</span>
            <button type="button" className="btn btn-sm ml-auto" onClick={chot.reload}>{t('Thử lại')}</button>
          </div>
        ) : kn && (
          <div className="grid gap-3 border-t pt-3" style={{ borderColor: 'var(--line)' }}>
            <div className="flex flex-wrap items-center gap-2.5">
              <h5 className="m-0 text-[15px] font-bold text-slate-100">{tenMon(ct, kn)}</h5>
              {nguoiPa && <span className={TAG_PHU} style={{ borderColor: 'var(--line-strong)' }}>{t('phụ trách')} <b>{nguoiPa}</b></span>}
              <span className="ml-auto flex gap-2 max-sm:ml-0 max-sm:w-full">
                <Link className={`${NUT} no-underline`} to={duongHoSoHocVien(s.id)} state={{ ds }}>{t('Hồ sơ HV ›')}</Link>
                {c0 ? <button type="button" className={`${NUT} btn-primary`} onClick={() => onMo({ caseId: c0.id })}>{t('Xem chi tiết')}</button>
                  : coTheBaoCase && <button type="button" className={NUT} onClick={onThemCase}>+ Case</button>}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.3fr)_minmax(0,1fr)] max-sm:gap-2.5">
              <div className="grid content-start gap-1">
                <span className={NH}>{t('Điểm')}</span>
                <div className="flex flex-wrap items-center gap-1">
                  {coDiem.filter((m) => m.o[kn]).map((m, i, a) => (
                    <Fragment key={m.kind}>
                      {i > 0 && <span aria-hidden className="text-[13px] text-faint">→</span>}
                      <span className={`grid min-w-[52px] justify-items-center gap-px rounded-lg border px-2 py-1 ${i === a.length - 1 ? 'bg-[color:var(--surface-2)] [border-color:var(--line-strong)]' : '[border-color:var(--line)]'}`}>
                        <span className="whitespace-nowrap text-xs font-medium text-faint">{m.nhan.replace(/ Test$/, '')}</span>
                        <b className="text-sm font-bold"><ODiemThuong o={m.o[kn]} /></b>
                      </span>
                    </Fragment>
                  ))}
                </div>
                <span className="text-[13px] text-dim">{t('đạt từ {x} %', { x: Math.round(KY_VONG_THUONG * 100) })}</span>
              </div>
              <div className="grid content-start gap-1">
                <span className={NH}>{t('Case · PA')}</span>
                {!e && !chot.data ? <Skeleton rows={1} /> : !c0 ? <span className="text-[15px] font-semibold text-dim">{t('Không có Case')}</span> : caKn.slice(0, 2).map((c) => (
                  <Fragment key={c.id}>
                    <span className="text-[15px] font-semibold text-slate-100">{dich(c.tieuDe)}</span>
                    <span className="text-[13px] text-dim">{dich(c.trangThai.chu)}</span>
                    {c.pas.filter((p) => !p.xong).map((p) => (
                      <span key={p.id} className="grid gap-px">
                        <span className="mt-1 text-[15px] font-semibold text-slate-100">{p.ten.split(' · ')[0]}</span>
                        {p.mocChu && <span className="text-[13px] text-dim">{dich(p.mocChu)}</span>}
                      </span>
                    ))}
                    {!c.pas.some((p) => !p.xong) && <span className="mt-1 text-[13px] text-dim">{t('Chưa có PA')}</span>}
                  </Fragment>
                ))}
              </div>
              <div className="grid content-start gap-1">
                <span className={NH}>{t('Việc tiếp')}</span>
                {!e && !chot.data ? <Skeleton rows={1} /> : caKn.some((c) => c.viecTiep)
                  ? caKn.filter((c) => c.viecTiep).map((c) => <ViecTiepCase key={c.id} c={c} ct={ct} homNay={homNay} onMo={onMo} />)
                  : <span className="text-faint">–</span>}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

const TAG_PHU = 'inline-flex h-[22px] items-center gap-1 whitespace-nowrap rounded-md border px-2 text-xs font-semibold text-dim [&_b]:font-bold [&_b]:text-slate-100';

/** Việc tiếp của một Case (cùng nút + cùng panel với `DongCase` — Xác nhận Case / Xác nhận PA / Ghi kết quả PA / Chờ QL duyệt) + hạn. */
function ViecTiepCase({ c, ct, homNay, onMo }: { c: CaseCua; ct: string | null; homNay: string; onMo: (n: Omit<MoNgan, 'em'>) => void }) {
  const [viec] = viecTiepCuaEm({ nhapDiem: null, cases: [{ caseId: c.id, topic: c.topic, viecTiep: c.viecTiep }], yThuc: null, homNay, chuongTrinh: ct });
  if (!viec) return null;
  const d = viec.dich?.loai === 'case' ? viec.dich : null;
  const goc = c.viecTiep?.chu ?? '';
  const loai = goc.startsWith('Xác nhận Case') || goc.startsWith('Mô tả Case') ? 'xac-nhan' as const
    : goc.startsWith('Xác nhận PA') ? 'xac-nhan-pa' as const : d?.ghiKetQua && d.paId != null ? 'ghi-ket-qua' as const : undefined;
  const choQl = goc.startsWith('Chờ Quản lý duyệt');
  return (
    <span className="grid justify-items-start gap-0.5">
      <button type="button" onClick={() => onMo({ caseId: c.id, viec: loai, paId: d?.paId ?? undefined })} title={viec.title}
        className={choQl ? 'cursor-pointer border-0 bg-transparent p-0 text-left text-[13px] font-medium text-dim hover:text-slate-100 max-sm:min-h-[44px]' : 'btn h-[30px] whitespace-nowrap px-2.5 text-[13px] max-sm:h-11'}>
        {choQl ? t('Chờ Quản lý duyệt') : viec.viec.split(' · ')[0]}
      </button>
      {viec.quaHanNgay != null && viec.quaHanNgay > 0 ? <QuaHan ngay={viec.quaHanNgay} /> : viec.han && <span className="text-xs font-medium tabular-nums text-faint">{viec.han}</span>}
    </span>
  );
}

function OPhanTram({ v }: { v: number | null }) {
  return v === null ? <span className="text-faint">–</span> : <span className="text-sm font-medium tabular-nums text-slate-100">{Math.round(v * 100)}%</span>;
}

/** Target (như FT — AUDIT-UI HSL2): KCK không gạch chấm; chưa có Target thì chỉ "KCK"; nghĩa ở title. */
function OTarget({ c }: { c: DongThuong['cycle'] }) {
  if (c?.khongCamKet) return <span className="whitespace-nowrap text-dim" title={GIAI_THICH_KCK}>{c.target != null && <><TargetText band={c.target} kck={false} /> · </>}{KCK}</span>;
  return <TargetText band={c?.target} kck={false} />;
}

/**
 * Ô "Lộ trình tiếp theo" (M2 §3, HSL-THUONG tách trường): dòng 1 hướng đã chốt (đậm) + thẻ "+ bổ trợ" (chi tiết bổ trợ ở title);
 * dòng 2 lớp đích · tuần vào lớp (mờ, hai trường tách bằng khoảng). `gon` (thẻ 375): một dòng.
 */
function OLoTrinh({ lt, homNay, gon = false }: { lt: LoTrinhChot | null; homNay: string; gon?: boolean }) {
  if (!lt) return <span className="text-[13px] text-faint" title={TIEU_DE_LO_TRINH}>{t('Chưa chốt')}</span>;
  const m = dich(lt.nhan).match(/^(.*?) \+ (.+)$/);
  const tag = (m || lt.boTro) && (
    <span title={lt.boTro ? dich(lt.boTro) : undefined} className="inline-flex h-5 items-center whitespace-nowrap rounded-md bg-[color:var(--accent-soft)] px-1.5 text-xs font-semibold text-[color:var(--accent)]">+ {m?.[2] ?? t('bổ trợ')}</span>
  );
  const phu = [lt.lopDich, lt.tuan ? t('từ {tuan}', { tuan: tuanLich(lt.tuan, homNay) }) : null].filter(Boolean) as string[];
  if (gon) return <span className="inline-flex flex-wrap items-center gap-x-1.5"><b className="font-semibold text-slate-100">{m?.[1] ?? dich(lt.nhan)}</b>{tag}{phu.length > 0 && <span className="tabular-nums">{phu.join(' · ')}</span>}</span>;
  return (
    <span className="grid min-w-0 gap-px">
      <span className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-slate-100"><span className="truncate">{m?.[1] ?? dich(lt.nhan)}</span>{tag}</span>
      {phu.length > 0 && <span className="flex gap-2.5 whitespace-nowrap text-xs font-medium tabular-nums text-faint">{phu.map((x) => <span key={x}>{x}</span>)}</span>}
    </span>
  );
}

function ODiemThuong({ o, gon = false }: { o: ODiem | null; gon?: boolean }) {
  if (o && o.score !== null && o.total !== null) {
    const kq = o.outcome === 'pass' ? 'dat' : o.outcome === 'fail' ? 'duoi' : null;
    /* Chủ SP 04/11 (theo U03): "✓ / ✗ 14/20" — một mẫu ô điểm `ODiem` (dấu + màu, không chỉ màu). 375 (HSL-THUONG): bỏ "/tổng" — cột hẹp. */
    return gon ? <ODiem kieu="gon" so={String(o.score)} kq={kq} /> : <ODiem kieu="ti-le" so={String(o.score)} tong={o.total} kq={kq} />;
  }
  /* HSL-GON (chủ SP 05/11): chưa có điểm → "–" (không ghi tuần Test / "Chưa có điểm" trong ô) — lịch Test và bài chưa nhập chỉ ở màn Test / Công việc. */
  return <span className="text-faint">–</span>;   // audit P3-1: "–" = không có, ≥ 4.5:1
}
