import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { HangCon, HangNhom } from '../../../ui/HangNhom.tsx';
import { ChipHan, ChipKy, Nhan } from '../../../ui/Nhan.tsx';
import { CHAM_CHEO, chuOChuaLuu, tenMonNgan } from '@shared/domain/index.ts';
import { khoaHang, type LichTest, type LopLichTest } from './kieu.ts';
import { LuoiNhung } from './LuoiNhung.tsx';
import { dich, t } from '@shared/i18n/index.ts';



/**
 * TRẠNG THÁI của hàng lớp (⑦ A1 `.vien`: viên viền cùng tông, chữ ngắn) — Chờ bạn chấm (vàng) · Chờ GV khác / Chưa chấm (xám) · Đang chấm (xanh dương) ·
 * ✓ Đã chấm (xanh lá, ✓ trong chip — #1695). Còn ô lưu hỏng trong lưới → "n ô chưa lưu" (đỏ): việc gấp hơn, nhãn máy chủ tính trên điểm ĐÃ lưu.
 */
function NhanLop({ l, chuaLuu = 0 }: { l: LopLichTest; chuaLuu?: number }) {
  if (chuaLuu > 0) return <Nhan tone="bad" title={t('Ô viền đỏ chưa lưu được — bấm Lưu lại ở ô đó.')}>{chuOChuaLuu(chuaLuu)}</Nhan>;
  if (l.phan && (l.phan.toi || l.phan.khac)) {
    const { toi, khac } = l.phan;
    if (toi && toi.con > 0) return <Vien muc="cho">{t('Chờ bạn chấm')}</Vien>;
    if (khac && khac.con > 0) return <Vien muc="mo">{t('Chờ GV khác')}</Vien>;
    return <Vien muc="xong">{t('Đã chấm')}</Vien>;
  }
  /* Người không chấm (Quản lý): "Chờ chấm" tách theo tiến độ — đã có bài chấm = Đang chấm, chưa bài nào = Chưa chấm (⑦ A3). */
  if (l.nhan.loai === 'cho-cham') return l.daCham > 0 ? <Vien muc="dang">{t('Đang chấm')}</Vien> : <Vien muc="mo">{t('Chưa chấm')}</Vien>;
  if (l.nhan.loai === 'da-cham') return <Vien muc="xong">{t('Đã chấm')}</Vien>;
  return <Vien muc={l.nhan.loai === 'cho-ban' ? 'cho' : 'mo'}>{dich(l.nhan.chu)}</Vien>;
}

/** Viên trạng thái ⑦ `.vien` (CSS `.lt-vien` ở index.css): `xong` có ✓ trong chip, các mức khác chấm tròn đầu. */
export const Vien = ({ muc, children }: { muc: 'cho' | 'dang' | 'xong' | 'mo'; children: ReactNode }) => <span className="lt-vien" data-muc={muc}>{children}</span>;

/** Chip môn ⑦ `.ky` — tên ngắn theo chương trình ("L", "W1", "G+V", "Tổng hợp"). */
export const ChipMon = ({ ct, ds }: { ct: string | null; ds: readonly string[] }) => (
  <span className="flex flex-wrap gap-1">{ds.map((k) => <ChipKy key={k} k={tenMonNgan(ct, k)} />)}</span>
);

/** "Đinh Thu Hằng (L R) · Phạm Thu Trang (W1 W2) · chấm chéo S" — ô còn chờ theo người (máy chủ `gvMon`, đã bỏ phần của người xem). */
export function chuConCho(gvMon: Readonly<Record<string, readonly string[]>> | undefined, ct: string | null): string {
  return Object.entries(gvMon ?? {}).map(([ten, kn]) => {
    const mon = kn.map((k) => tenMonNgan(ct, k)).join(' ');
    return dich(ten) === CHAM_CHEO ? t('chấm chéo {mon}', { mon }) : `${dich(ten)} (${mon})`;
  }).join(' · ');
}

/** Thẻ "n bài chờ duyệt dời" (⑦ A1 `.tag.doi`: vắng lần 2 chờ Quản lý duyệt dời). */
export const TheChoDoi = ({ n }: { n: number }) => (n > 0 ? <span className="lt-tag-doi">{t('{n} bài chờ duyệt dời', { n })}</span> : null);

/** Tiến độ "2 / 27 bài" (⑦ `.td`: số Inter 600 15, chữ "bài" nhỏ mờ). */
export const TienDo = ({ so, title }: { so: ReactNode; title?: string }) => (
  <span className="lt-td" title={title}>{so} <small>{t('bài')}</small></span>
);

/**
 * CỘT CHUNG của Lịch Test (⑦ A1 `.hl`: mũi tên + Lớp · Đợt · Môn · Hạn chấm · Còn chờ · Tiến độ · Trạng thái / nút) — hàng Quá hạn chấm và hàng lớp
 * cùng một bộ cột để thẳng hàng. Cột "Còn chờ" giãn.
 */
export const COT_LICH_TEST = [198, 172, 184, 150, null, 104, 178] as const;
export const ColLichTest = () => <colgroup>{COT_LICH_TEST.map((w, i) => <col key={i} style={w ? { width: w } : undefined} />)}</colgroup>;

/** Đợt: tên đợt (600 14) + số em mỗi đợt dòng phụ ("MT3 · MT1" / "5 em · 1 em"). */
export const ODot = ({ dot, phu }: { dot: string; phu: string }) => (
  <span className="lt-dot"><span className="truncate">{dot}</span><small className="truncate">{phu}</small></span>
);

/**
 * HÀNG LỚP của Lịch tuần (GD-11a, ⑦ A1 / A3 / A6): ghi THẲNG trên hàng — Lớp (link hồ sơ) · Đợt (+ số em) · Môn của bạn (QL: Môn) · hạn chấm (chip,
 * lớp xong thì trống) · thẻ "n bài chờ duyệt dời" (QL: + "Còn chờ: GV (môn)") · tiến độ · trạng thái; một hàng tiêu đề cột mảnh ở đầu.
 * Mở ra là lưới chấm tại chỗ đúng tuần thi của hàng (KHÔNG đổi). < 1024 px: mỗi lớp một thẻ (mã · tiến độ / đợt · môn / hạn · chờ dời · trạng thái).
 */
export function HangLop({ lop, moCua, onMo, onLopTiep, coChiNhanh, gon, urlClassId, urlKn, conTro, onDaLuu, chuaLuu, baoChuaLuu, sEx }: {
  lop: LopLichTest[];
  moCua: (l: LopLichTest) => boolean;
  onMo: (l: LopLichTest) => void;
  /** R1-LUU-TIEP: hết bài của người xem ở lớp đang chấm → "Lớp tiếp: {mã} ›" mở lớp kế trong tuần còn bài của người xem. */
  onLopTiep: (cu: LopLichTest, ke: LopLichTest) => void;
  coChiNhanh: boolean;
  /** < 1024 px: thẻ lớp (⑦ A6). */
  gon: boolean;
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
  /* Người có phân công: cột "Môn của bạn", không cột "Còn chờ" (phần GV khác đã ở trạng thái); Quản lý / Quản trị: "Môn" + "Còn chờ" (⑦ A3). */
  const coPhan = lop.some((l) => !!l.phan);
  const soCot = gon ? 1 : COT_LICH_TEST.length;
  /* Lớp kế (sau lớp này, vòng lên) còn bài của người xem. */
  const onHet = (l: LopLichTest) => () => {
    const i = lop.indexOf(l);
    const ke = [...lop.slice(i + 1), ...lop.slice(0, i)].find((x) => khoaHang(x) !== khoaHang(l) && (x.phan ? x.conBaiCuaToi : x.conBai) > 0);
    return ke ? { nhan: t('Lớp tiếp: {lop} ›', { lop: ke.classCode }), onClick: () => onLopTiep(l, ke) } : null;
  };

  return (
    <table className="lt-bang w-full text-sm bang-dinh" style={{ tableLayout: 'fixed' }}>
      {gon ? <colgroup><col /></colgroup> : <ColLichTest />}
      {!gon && (
        <thead>
          <tr className="lt-cot">
            <th>{t('Lớp')}</th><th>{t('Đợt')}</th><th>{coPhan ? t('Môn của bạn') : t('Môn')}</th><th>{t('Hạn chấm')}</th>
            <th>{coPhan ? '' : t('Còn chờ')}</th><th className="text-right">{t('Tiến độ')}</th><th className="text-right">{t('Trạng thái')}</th>
          </tr>
        </thead>
      )}
      {lop.map((l) => {
        const k = khoaHang(l);
        const mo = moCua(l);
        /* Việc xong không nơi nào còn báo hạn: hạn chỉ khi còn bài (người có phân công: bài của mình). */
        const con = l.phan ? l.conBaiCuaToi : l.conBai;
        const han = con > 0 ? <ChipHan vien loai="nhap-diem" han={l.han} /> : null;
        /* QL: môn của lượt theo Ô NHẬP — FT ghi W1 W2 như lưới (⑦ A3). */
        const monLuot = l.mode === 'ielts_band' ? l.kyNangTuan.flatMap((x) => (x === 'writing' ? ['writing1', 'writing2'] : [x])) : l.kyNangTuan;
        const mon = <ChipMon ct={l.chuongTrinh} ds={l.phan ? l.phan.toi?.kyNang ?? [] : monLuot} />;
        const dot = l.luot.map((x) => dich(x.dot)).join(' · ');
        const soEm = l.luot.map((x) => t('{n} em', { n: x.soHv })).join(' · ');
        const conCho = l.phan ? '' : chuConCho(l.gvMon, l.chuongTrinh);
        const tienDo = <TienDo so={`${l.daCham} / ${l.tong}`} title={t('Đã chấm {daCham} trong {tong} bài', { daCham: l.daCham, tong: l.tong })} />;
        const maLop = (
          <span className="block min-w-0">
            <Link to={`/hoc-vien/lop/${l.classId}`} className="lt-ma" title={t('Hồ sơ lớp {classCode}', { classCode: l.classCode })}>{l.classCode}</Link>
            {coChiNhanh && <small className="block truncate text-xs font-normal text-dim">{l.branchName}</small>}
          </span>
        );
        return (
          <tbody key={k}>
            <HangNhom mo={mo} onMo={() => onMo(l)} nhan={t('lớp {classCode}', { classCode: l.classCode })} className={`lt-hang ${mo ? 'dang-mo' : ''}`}
              tieuDe={gon ? (
                /* ⑦ A6: thẻ ba dòng — mã · tiến độ / đợt · môn / hạn · chờ dời · trạng thái. */
                <span className="lt-the">
                  <span className="h1">{maLop}{tienDo}</span>
                  <span className="h2"><b>{dot}</b>{mon}</span>
                  <span className="h3">{han}<TheChoDoi n={l.choDuyetDoi} />{conCho && <span className="text-xs text-dim">{conCho}</span>}<NhanLop l={l} chuaLuu={chuaLuu[k]} /></span>
                </span>
              ) : maLop}>
              {!gon && (
                <>
                  <td><ODot dot={dot} phu={soEm} /></td>
                  <td>{mon}</td>
                  <td>{han}</td>
                  <td className="lt-gc" title={conCho || undefined}><span className="inline-flex max-w-full items-center gap-2"><TheChoDoi n={l.choDuyetDoi} />{conCho && <span className="min-w-0 truncate">{conCho}</span>}</span></td>
                  <td className="text-right">{tienDo}</td>
                  <td className="text-right"><NhanLop l={l} chuaLuu={chuaLuu[k]} /></td>
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
