import { Link } from 'react-router-dom';
import { HangNhom } from '../../../ui/HangNhom.tsx';
import { Nhan } from '../../../ui/Nhan.tsx';
import { Han } from '../../../ui/Han.tsx';
import { chuOChuaLuu, tenMon, tenMonNgan } from '@shared/domain/index.ts';
import { TONE_NHAN_LOP, khoaHang, type LichTest, type LopLichTest, type PhanCuaBan } from './kieu.ts';
import { LuoiNhung } from './LuoiNhung.tsx';
import { dich, t } from '@shared/i18n/index.ts';

/**
 * OV-1b (3.5, mockup overhaul-1 §4): GV thấy "phần của bạn" tách với phần GV khác — "Quá hạn" đỏ chỉ khi ô của chính mình (`quaHan`).
 * OV-11e (TE-7): khối 1 dùng chung. Chữ tắt kỹ năng, tên đủ ở `title`.
 */
export function OPhan({ phan, ct, quaHan }: { phan: PhanCuaBan; ct: string | null; quaHan: boolean }) {
  const mon = (ds: string[]) => ds.map((k) => tenMonNgan(ct, k)).join(', ');
  const du = (ds: string[]) => ds.map((k) => tenMon(ct, k)).join(', ');
  const { toi, khac } = phan;
  return (
    <span className="flex flex-col gap-0.5 text-[13px] font-normal leading-tight">
      {toi && (toi.con === 0
        ? <span className="font-semibold text-ok" title={du(toi.kyNang)}>✓ {mon(toi.kyNang)}{' '}{t('của bạn xong')}</span>
        : (
          <span className="flex flex-wrap items-center gap-1.5">
            {quaHan && <Nhan tone="late">{t('Quá hạn')}</Nhan>}
            <span className="font-semibold text-slate-200" title={du(toi.kyNang)}>{mon(toi.kyNang)}{' '}{t('của bạn: còn {con} bài', { con: toi.con })}</span>
          </span>
        ))}
      {khac && (
        <span className="text-slate-500" title={du(khac.kyNang)}>
          {mon(khac.kyNang)}{t(': GV khác')}{khac.quaHanNgay !== null && <> · <b className="font-semibold text-late">{t('⚠ quá hạn {quaHanNgay} ngày', { quaHanNgay: khac.quaHanNgay })}</b></>}
        </span>
      )}
    </span>
  );
}

/**
 * Một badge cho hàng lớp (N-3; UI-LICH-TUAN theo dieu-chinh-cuoi khu a: Đang chấm · Chưa chấm · Đã chấm). Còn ô lưu hỏng trong lưới của lớp
 * thì badge là "n ô chưa lưu" (đỏ) — việc gấp hơn "của ai", và nhãn máy chủ tính trên điểm ĐÃ lưu nên không nói được điều này.
 */
function NhanLop({ l, chuaLuu = 0 }: { l: LopLichTest; chuaLuu?: number }) {
  if (chuaLuu > 0) return <Nhan tone="bad" title={t('Ô viền đỏ chưa lưu được — bấm Lưu lại ở ô đó.')}>{chuOChuaLuu(chuaLuu)}</Nhan>;
  /* Người không chấm (Quản lý): "Chờ chấm" tách theo tiến độ — đã có bài chấm = Đang chấm, chưa bài nào = Chưa chấm (mockup). */
  const choCham = l.nhan.loai === 'cho-cham';
  return (
    <>
      {l.phan && (l.phan.toi || l.phan.khac) ? <OPhan phan={l.phan} ct={l.chuongTrinh} quaHan={l.quaHan} /> : (
        <Nhan tone={choCham && l.daCham > 0 ? 'doing' : TONE_NHAN_LOP[l.nhan.loai]}>
          {choCham ? (l.daCham > 0 ? t('Đang chấm') : t('Chưa chấm')) : dich(l.nhan.chu)}
        </Nhan>
      )}
    </>
  );
}

/**
 * "22 HV · MT3 20 · MT2 1 · L R W S" (UI-LICH-TUAN): số em theo lượt CỦA TỪNG EM — không giả định cả lớp cùng MT. Lớp thường (một bài một hàng)
 * chỉ ghi tên bài. Kỹ năng: bộ môn của lớp, môn không làm bài tuần này mờ (tooltip tên đủ, G-7).
 */
function LuotLop({ l }: { l: LopLichTest }) {
  const motBai = l.mode === 'ratio' || l.kind === 'mt0';
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-slate-400">
      <span className="tabular-nums">{t('{n} HV', { n: l.soHv })}</span>
      {l.luot.map((x) => (
        <span key={x.dot} className="whitespace-nowrap">· <b className="font-semibold text-slate-100">{dich(x.dot)}</b>{motBai ? '' : <span className="tabular-nums"> {x.soHv}</span>}</span>
      ))}
      <span aria-hidden>·</span>
      <span className="inline-flex gap-1">
        {l.boMon.map((k) => {
          const co = l.kyNangTuan.includes(k);
          const ten = tenMon(l.chuongTrinh, k);
          return (
            <span key={k} title={co ? ten : t('{ten} — không làm bài tuần này', { ten })}
              className={`inline-flex h-[22px] min-w-[22px] items-center justify-center rounded px-1 text-xs font-bold ${co ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent)]' : 'text-slate-500'}`}>
              {tenMonNgan(l.chuongTrinh, k)}
            </span>
          );
        })}
      </span>
      {/* PR-MT (YC-13.1): bài vắng tuần này đang chờ Quản lý duyệt dời lần 2 — chữ nhạt cuối dòng lượt, không phải việc chấm. */}
      {l.choDuyetDoi > 0 && (
        <span className="whitespace-nowrap text-xs text-muted" title={t('Đề nghị dời do vắng (từ lần 2) đang chờ Quản lý trả lời')}>
          · {l.choDuyetDoi > 1 ? t('{choDuyetDoi} bài ', { choDuyetDoi: l.choDuyetDoi }) : ''}{t('vắng · chờ Quản lý duyệt dời')}
        </span>
      )}
    </span>
  );
}

const TienDo = ({ l }: { l: LopLichTest }) => (
  <span className="whitespace-nowrap tabular-nums text-slate-400" title={t('Đã chấm {daCham} trong {tong} bài', { daCham: l.daCham, tong: l.tong })}>
    <b className="font-bold text-slate-100">{l.daCham}</b>/{l.tong} {t('bài')}
  </span>
);

/** Hạn của hàng — `<Han>` (hạn dd/mm, ⚠ khi ô của người xem quá hạn — OV-1b). Hàng đã chấm xong không còn hạn. */
const HanHang = ({ l }: { l: LopLichTest }) => (l.conBai === 0
  ? <span className="text-slate-500">—</span>
  : <Han loai="nhap-diem" han={l.han} boTinHieu={!!l.phan && !l.quaHan} />);

/** E5 (PR-HSM): độ rộng ba cột đầu (Lớp · Đợt · Kỹ năng) — dùng chung với bảng khối 1 (`KhoiNo`) để các bảng thẳng cột. */
export const COT_DAU_LICH_TEST = [190, 120, 110] as const;

/**
 * HÀNG LỚP của Lịch tuần (UI-LICH-TUAN, dieu-chinh-cuoi khu a): MỘT DÒNG gọn, không hàng tiêu đề cột —
 *   ▾ MB FT 101 · 22 HV · MT3 20 · MT2 1 · L R W S · 64/86 bài · hạn 23/09 · Đang chấm · ↗ (hồ sơ lớp)
 * Mở ra là bảng từng HV làm Test trong tuần (lưới chấm tại chỗ đúng tuần thi của hàng, kèm cột S Ex). Màn hẹp: ▾ mã · x/y · hạn.
 */
export function HangLop({ lop, moCua, onMo, onLopTiep, coChiNhanh, hep, urlClassId, urlKn, conTro, onDaLuu, chuaLuu, baoChuaLuu, sEx }: {
  lop: LopLichTest[];
  moCua: (l: LopLichTest) => boolean;
  onMo: (l: LopLichTest) => void;
  /** R1-LUU-TIEP: hết bài của người xem ở lớp đang chấm → "Lớp tiếp: {mã} ›" mở lớp kế trong tuần còn bài của người xem. */
  onLopTiep: (cu: LopLichTest, ke: LopLichTest) => void;
  coChiNhanh: boolean; hep: boolean;
  urlClassId: number | null; urlKn: string | null;
  /** Hàng được đặt con trỏ khi mở (mở bằng tay, hoặc lớp trên đường dẫn) — hàng tự mở thì không, trang khỏi nhảy. Khoá `khoaHang`. */
  conTro: ReadonlySet<string>;
  onDaLuu: () => void;
  /** Số ô lưu hỏng theo hàng (`khoaHang`); hàng còn ô hỏng mà bị thu thì lưới vẫn giữ (ẩn) để không mất giá trị đã gõ. */
  chuaLuu: Readonly<Record<string, number>>;
  baoChuaLuu: (khoa: string, n: number) => void;
  /** SV-S-EXPERT: lượt S Ex của tuần — cột S Ex trong lưới FT. */
  sEx: LichTest['sEx'];
}) {
  const cot = hep ? [null, 92, 96] : [174, null, ...(coChiNhanh ? [110] : []), 110, 180, 140, 44];   // hạn quá: "hạn 26/08 ⚠ quá hạn n ngày"
  const soCot = cot.length;
  /* Lớp kế (sau lớp này, vòng lên) còn bài của người xem — cùng số "… của bạn: còn n bài" ở hàng lớp. */
  const onHet = (l: LopLichTest) => () => {
    const i = lop.indexOf(l);
    const ke = [...lop.slice(i + 1), ...lop.slice(0, i)].find((x) => khoaHang(x) !== khoaHang(l) && (x.phan ? x.conBaiCuaToi : x.conBai) > 0);
    return ke ? { nhan: t('Lớp tiếp: {lop} ›', { lop: ke.classCode }), onClick: () => onLopTiep(l, ke) } : null;
  };

  /* R1-PHAN-CAP-TEST (M2 A2): MỖI LỚP MỘT <table> cùng colgroup cố định (cột vẫn thẳng giữa các lớp) — hàng lớp đang mở dính dưới mép trên
     <main> chỉ trong khối của chính nó (dính trong một bảng chung thì hàng lớp trên đè lên các lớp dưới). */
  return (
    <>
      {lop.map((l) => {
        const k = khoaHang(l);
        const mo = moCua(l);
        return (
          <table key={k} className={`lich-lop w-full text-sm bang-dinh ${mo ? 'mb-1.5' : ''}`} style={{ tableLayout: 'fixed' }}>
            <colgroup>{cot.map((w, i) => <col key={i} style={w ? { width: w } : undefined} />)}</colgroup>
            <tbody>
              <HangNhom mo={mo} onMo={() => onMo(l)} nhan={t('lớp {classCode}', { classCode: l.classCode })} className={mo ? 'dang-mo' : ''}
                tieuDe={<span className="ten-lop block truncate text-[15px] font-bold text-slate-100" title={l.classCode}>{l.classCode}</span>}>
                {hep ? (
                  <>
                    <td className="px-2 text-right"><TienDo l={l} /></td>
                    <td className="whitespace-nowrap px-2 font-normal">{(chuaLuu[k] ?? 0) > 0 ? <NhanLop l={l} chuaLuu={chuaLuu[k]} /> : <HanHang l={l} />}</td>
                  </>
                ) : (
                  <>
                    <td className="px-3 py-2 font-normal"><LuotLop l={l} /></td>
                    {coChiNhanh && <td className="truncate px-3 font-normal text-slate-400" title={l.branchName}>{l.branchName}</td>}
                    <td className="px-3 font-normal"><TienDo l={l} /></td>
                    <td className="whitespace-nowrap px-3 font-normal"><HanHang l={l} /></td>
                    <td className="px-3 font-normal"><NhanLop l={l} chuaLuu={chuaLuu[k]} /></td>
                    <td className="px-1 text-center">
                      <Link to={`/hoc-vien/lop/${l.classId}`} title={t('Hồ sơ lớp')} aria-label={t('Hồ sơ lớp {classCode}', { classCode: l.classCode })}
                        className="inline-flex h-8 w-8 items-center justify-center font-normal text-slate-400 no-underline hover:text-slate-100">↗</Link>
                    </td>
                  </>
                )}
              </HangNhom>
              {(mo || (chuaLuu[k] ?? 0) > 0) && (
                /* Lưới nằm thẳng trên nền thẻ (bỏ nền hàng con); còn ô lưu hỏng mà lớp bị thu thì lưới giữ (ẩn), không mất giá trị đã gõ. */
                <tr className={mo ? '' : 'hidden'}>
                  <td colSpan={soCot} className="lich-luoi p-0">
                    <LuoiNhung classId={l.classId} periodId={l.mode === 'ielts_band' ? l.periodId : null} kind={l.kind}
                      tuanDangXem={l.weekStart} kn={l.classId === urlClassId ? urlKn : null} hrefDayDu={l.hrefDayDu}
                      datConTro={conTro.has(k)} onDaLuu={onDaLuu} coLinkRieng sEx={l.mode === 'ielts_band' ? sEx.filter((x) => x.classId === l.classId) : undefined}
                      onSoOChuaLuu={(n) => baoChuaLuu(k, n)} onHet={onHet(l)} 
                      nhanTrai={`${t('{n} học viên', { n: l.soHv })} · ${l.mode === 'ielts_band' && l.kind !== 'mt0' ? 'Fast Track' : t('Lớp thường')}`} />
                  </td>
                </tr>
              )}
              {mo && (
                /* ĐÁY KHỐI: "▴ Thu lớp" = chính thao tác thu của hàng lớp (lớp dài khỏi cuộn ngược) + số cùng nguồn hàng lớp. */
                <tr>
                  <td colSpan={soCot} className="p-0">
                    <div className="day-khoi flex flex-wrap items-center gap-x-4 gap-y-1 py-1.5 pl-7 pr-4 text-[13px] text-slate-400">
                      <button type="button" aria-expanded
                        className="link inline-flex min-h-[32px] items-center appearance-none border-0 bg-transparent p-0 font-semibold no-underline max-sm:min-h-[44px]"
                        onClick={(e) => {
                          const bang = e.currentTarget.closest('table');
                          onMo(l);
                          requestAnimationFrame(() => bang?.scrollIntoView({ block: 'nearest' }));
                        }}>
                        ▴ {t('Thu lớp {classCode}', { classCode: l.classCode })}
                      </button>
                      <span className="tabular-nums">{t('{daCham}/{tong} bài · {n} HV', { daCham: l.daCham, tong: l.tong, n: l.soHv })}</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        );
      })}
    </>
  );
}
