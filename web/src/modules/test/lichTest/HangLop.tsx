import { Link } from 'react-router-dom';
import { HangCon, HangNhom } from '../../../ui/HangNhom.tsx';
import { ChipHan, Nhan } from '../../../ui/Nhan.tsx';
import { useNgayNghiepVu } from '../../../ui/ngayNghiepVu.ts';
import { chuOChuaLuu, ngay, tenMon, tenMonNgan } from '@shared/domain/index.ts';
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
        /* U06 (PTA 04/11 "không số về GV khác"): chỉ nói môn nào của GV khác, không số ngày quá hạn của họ. */
        <span className="truncate text-slate-500" title={`${du(khac.kyNang)}${t(': GV khác')}`}>{mon(khac.kyNang)}{t(': GV khác')}</span>
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
  /* U06 (mockup V11, PTA 04/11 "không số về GV khác"): người có phân công — MỘT badge "Chờ bạn chấm" / "Chờ GV khác"; phần của mình gạch dưới ở ô môn. */
  if (l.phan && (l.phan.toi || l.phan.khac)) {
    const { toi, khac } = l.phan;
    if (toi && toi.con > 0) return <Nhan tone="soon" title={`${toi.kyNang.map((k) => tenMon(l.chuongTrinh, k)).join(', ')} · ${t('của bạn: còn {con} bài', { con: toi.con })}`}>{t('Chờ bạn chấm')}</Nhan>;
    if (khac && khac.con > 0) return <Nhan tone="muted">{t('Chờ GV khác')}</Nhan>;
    return <Nhan tone="ok">{t('Đã chấm')}</Nhan>;
  }
  /* Người không chấm (Quản lý): "Chờ chấm" tách theo tiến độ — đã có bài chấm = Đang chấm, chưa bài nào = Chưa chấm (mockup). */
  const choCham = l.nhan.loai === 'cho-cham';
  return (
    <>
      <Nhan tone={choCham && l.daCham > 0 ? 'doing' : TONE_NHAN_LOP[l.nhan.loai]}>
        {choCham ? (l.daCham > 0 ? t('Đang chấm') : t('Chưa chấm')) : dich(l.nhan.chu)}
      </Nhan>
    </>
  );
}

/**
 * LT-GON (chủ SP 05/11: "thanh lớp quá nhiều thông tin, dày đặc quá"): dải lớp chỉ còn mã lớp · x/y bài · MỘT viên. Đợt / kỹ năng (môn của bạn) / hạn /
 * bài chờ duyệt dời KHÔNG thành chữ trên dải — rê chuột hàng (`title`) hoặc mở lưới (lưới vẫn ghi vắng / dời từng em — màn Test).
 */
function goiYHang(l: LopLichTest, homNay: string): string {
  const cuaToi = new Set(l.phan?.toi?.kyNang ?? []);
  const mon = l.boMon.filter((k) => l.kyNangTuan.includes(k)).map((k) => `${tenMon(l.chuongTrinh, k)}${cuaToi.has(k) ? ` (${t('của bạn')})` : ''}`).join(', ');
  return [
    l.luot.map((x) => dich(x.dot)).join(', '), mon,
    l.conBai > 0 && l.han ? t('hạn {ngay}', { ngay: ngay(l.han, homNay) }) : null,
    l.choDuyetDoi > 0 ? t('{n} bài vắng chờ Quản lý duyệt dời', { n: l.choDuyetDoi }) : null,
  ].filter(Boolean).join(' · ');
}

const TienDo = ({ l }: { l: LopLichTest }) => (
  <span className="whitespace-nowrap tabular-nums text-slate-400" title={t('Đã chấm {daCham} trong {tong} bài', { daCham: l.daCham, tong: l.tong })}>
    {/* LT-GON (M1): một chữ đậm mỗi hàng lớp = mã lớp — số đã chấm chữ sáng 500, không đậm. */}
    <span className="font-medium text-slate-100">{l.daCham}</span>/{l.tong} {t('bài')}
  </span>
);

/** LT-GON: MỘT viên của hàng — ô chưa lưu (đỏ) > quá hạn của người xem (viên ⚠ như Công việc) > nhãn tiến độ (Đang chấm / Chờ bạn chấm…). */
const VienHang = ({ l, chuaLuu = 0 }: { l: LopLichTest; chuaLuu?: number }) => (chuaLuu === 0 && l.conBai > 0 && l.quaHan
  ? <ChipHan vien loai="nhap-diem" han={l.han} /> : <NhanLop l={l} chuaLuu={chuaLuu} />);

/** E5 (PR-HSM): độ rộng ba cột đầu (Lớp · Đợt · Kỹ năng) — dùng chung với bảng khối 1 (`KhoiNo`) để các bảng thẳng cột.
 *  SUA-375-2: "MT1 · W1 SEP" / "L, R, W1, W2, S" cần 98 px + đệm 24 → một dòng; Lớp (mã ~70–100 px) nhường bớt. Tổng giữ 410. */
export const COT_DAU_LICH_TEST = [160, 125, 125] as const;

/**
 * HÀNG LỚP của Lịch tuần (UI-LICH-TUAN, dieu-chinh-cuoi khu a): MỘT DÒNG gọn, không hàng tiêu đề cột —
 *   ▾ MB FT 101 · 22 HV · MT3 20 · MT2 1 · L R W S · 64/86 bài · hạn 23/09 · Đang chấm (mã lớp = link hồ sơ lớp)
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
  const { homNay } = useNgayNghiepVu();
  /* LT-GON: mã lớp · (tên bài khi một lớp có hai hàng) · chi nhánh · x/y bài · một viên — bỏ cột kỹ năng, hạn. */
  const cot = hep ? [null, 80, 132] : [174, null, ...(coChiNhanh ? [110] : []), 110, 170];
  /* Tên bài ("Final Test") chỉ khi cùng lớp có hơn một hàng trong danh sách — để phân biệt hai hàng. */
  const haiHang = new Set(lop.map((x) => x.classId).filter((id, i, a) => a.indexOf(id) !== i));   // U06 (mockup V11): x/y bài · hạn · MỘT badge (bỏ "phần của bạn / GV khác")   // hạn quá: "hạn 26/08 ⚠ quá hạn n ngày" · 220: "P của bạn: còn n bài" một dòng (D8) · 375: hạn "hạn 23/09" 58 px + đệm → 82, nhường tên lớp ("MB Pre FOU 03" 107 px)
  const soCot = cot.length;
  /* Lớp kế (sau lớp này, vòng lên) còn bài của người xem — cùng số "… của bạn: còn n bài" ở hàng lớp. */
  const onHet = (l: LopLichTest) => () => {
    const i = lop.indexOf(l);
    const ke = [...lop.slice(i + 1), ...lop.slice(0, i)].find((x) => khoaHang(x) !== khoaHang(l) && (x.phan ? x.conBaiCuaToi : x.conBai) > 0);
    return ke ? { nhan: t('Lớp tiếp: {lop} ›', { lop: ke.classCode }), onClick: () => onLopTiep(l, ke) } : null;
  };

  return (
    <table className="w-full text-sm bang-dinh" style={{ tableLayout: 'fixed' }}>
      <colgroup>{cot.map((w, i) => <col key={i} style={w ? { width: w } : undefined} />)}</colgroup>
      {lop.map((l) => {
        const k = khoaHang(l);
        const mo = moCua(l);
        return (
          <tbody key={k}>
            <HangNhom mo={mo} onMo={() => onMo(l)} nhan={t('lớp {classCode}', { classCode: l.classCode })} className={mo ? 'dang-mo' : ''} title={goiYHang(l, homNay)}
              tieuDe={<Link to={`/hoc-vien/lop/${l.classId}`} className="ten-ho-so block truncate text-[15px] font-bold" title={t('Hồ sơ lớp {classCode}', { classCode: l.classCode })}>{l.classCode}</Link>}>
              {hep ? (
                <>
                  <td className="px-2 text-right"><TienDo l={l} /></td>
                  <td className="whitespace-nowrap px-2 font-normal"><VienHang l={l} chuaLuu={chuaLuu[k]} /></td>
                </>
              ) : (
                <>
                  <td className="truncate px-3 py-2 font-normal text-dim">{haiHang.has(l.classId) && l.luot.map((x) => dich(x.dot)).join(', ')}</td>
                  {coChiNhanh && <td className="truncate px-3 font-normal text-slate-400" title={l.branchName}>{l.branchName}</td>}
                  <td className="px-3 font-normal"><TienDo l={l} /></td>
                  <td className="px-3 font-normal"><span className="nhan-lop inline-flex">{/* mockup V11: badge có viền cùng tông */}<VienHang l={l} chuaLuu={chuaLuu[k]} /></span></td>
                </>
              )}
            </HangNhom>
            {(mo || (chuaLuu[k] ?? 0) > 0) && (
              <HangCon className={mo ? '' : 'hidden'}>
                <td colSpan={soCot} className="!p-0">
                  <LuoiNhung classId={l.classId} periodId={l.mode === 'ielts_band' ? l.periodId : null} kind={l.kind}
                    tuanDangXem={l.weekStart} kn={l.classId === urlClassId ? urlKn : null} hrefDayDu={l.hrefDayDu}
                    datConTro={conTro.has(k)} onDaLuu={onDaLuu} coLinkRieng sEx={l.mode === 'ielts_band' ? sEx.filter((x) => x.classId === l.classId) : undefined}
                    onSoOChuaLuu={(n) => baoChuaLuu(k, n)} onHet={onHet(l)} />
                </td>
              </HangCon>
            )}
          </tbody>
        );
      })}
    </table>
  );
}
