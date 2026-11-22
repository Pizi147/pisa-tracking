import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { HangCon, HangNhom } from '../../../ui/HangNhom.tsx';
import { Nhan } from '../../../ui/Nhan.tsx';
import { Han } from '../../../ui/Han.tsx';
import { CHAM_CHEO, chuOChuaLuu, duongDotTest, tenMonNgan } from '@shared/domain/index.ts';
import { khoaHang, type LichTest, type LopLichTest } from './kieu.ts';
import { LuoiNhung } from './LuoiNhung.tsx';
import { Skeleton } from '../../../ui/ui.tsx';
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

/**
 * "Đinh Thu Hằng (L R) · Phạm Thu Trang (W1 W2) · chấm chéo S" — ai còn chờ chấm (máy chủ `gvMon`, đã bỏ phần của người xem).
 * LICH-TEST-GON (chủ SP 19/11: "bỏ cột Còn chờ"): không còn cột — hiện MỘT dòng nhỏ "Còn chờ: …" BÊN TRONG phần lớp khi mở ra (`DongConCho`; điện thoại không có tooltip). Đủ tên, không cắt.
 */
export function chuConCho(gvMon: Readonly<Record<string, readonly string[]>> | undefined, ct: string | null): string {
  return Object.entries(gvMon ?? {}).map(([ten, kn]) => {
    const mon = kn.map((k) => tenMonNgan(ct, k)).join(' ');
    return dich(ten) === CHAM_CHEO ? t('chấm chéo {mon}', { mon }) : `${dich(ten)} (${mon})`;
  }).join(' · ');
}

/** Thẻ "n bài chờ duyệt dời" (⑦ A1 `.tag.doi`: vắng lần 2 chờ Quản lý duyệt dời) — nằm cạnh Tiến độ. */
export const TheChoDoi = ({ n }: { n: number }) => (n > 0 ? <span className="lt-tag-doi">{t('{n} bài chờ duyệt dời', { n })}</span> : null);

/** Tiến độ "2 / 27 bài" (⑦ `.td`: số Inter 600, chữ "bài" nhỏ mờ). NHẸ HƠN (v23 L1 `.tdo`): `ti` (0–1) → vạch xám mảnh sau số, không màu. */
export const TienDo = ({ so, title, ti }: { so: ReactNode; title?: string; ti?: number }) => (
  <span className="lt-td" title={title}>{so} <small>{t('bài')}</small>{ti !== undefined && <i aria-hidden style={{ '--p': `${Math.round(Math.min(1, Math.max(0, ti)) * 100)}%` } as CSSProperties} />}</span>
);

/**
 * CỘT CHUNG của Lịch Test (v23 L1: mũi tên + Lớp 256 · Đợt giãn · Hạn chấm 140 · Tiến độ 180 · Trạng thái / nút 180 — NHẸ HƠN bỏ cột Môn) — hàng Quá hạn chấm và hàng lớp
 * cùng một bộ cột để thẳng hàng. LICH-TEST-GON (chủ SP 19/11): bỏ cột "Còn chờ"; cột Đợt giãn, Tiến độ rộng đủ chỗ cho thẻ "n bài chờ duyệt dời".
 */
export const COT_LICH_TEST = [256, null, 140, 180, 180] as const;
export const ColLichTest = () => <colgroup>{COT_LICH_TEST.map((w, i) => <col key={i} style={w ? { width: w } : undefined} />)}</colgroup>;
/** Hàng tiêu đề cột chung (v23 L1: MỌI nhóm có đầu cột, cùng chữ) — khối Quá hạn chấm đổi cột 4 thành "Còn lại" (chỉ biết số bài còn nợ). */
export const DauCotLichTest = ({ cot4 = t('Tiến độ') }: { cot4?: string }) => (
  <thead>
    <tr className="lt-cot">
      <th>{t('Lớp')}</th><th>{t('Đợt')}</th><th>{t('Hạn chấm')}</th><th>{cot4}</th><th>{t('Trạng thái')}</th>
    </tr>
  </thead>
);

/**
 * LICH-TEST-GON (chủ SP 19/11: "chữ MT# nhìn rối"): ĐỢT CHÍNH của lớp (đông em nhất) ghi MỘT lần — "MT3 · 5 em"; lượt khác (MT cũ, vắng dời) chỉ một dòng phụ
 * "+ MT1 · 1 em". Lưới bên dưới không lặp "MT3 ›" ở mọi em (`LuotChinhContext`). `luot` đã sắp đông em trước (máy chủ / `gopNoTheoLop`).
 */
type LuotHang = { dot: string; soHv: number; attemptId?: number; kind?: string | null };
export function chuDot(luot: readonly LuotHang[]) {
  const chu = (x: LuotHang) => `${dich(x.dot)} · ${t('{n} em', { n: x.soHv })}`;
  return { phu: luot.slice(1).map((x) => `+ ${chu(x)}`).join(' '), nhanChinh: luot[0]?.dot ?? null };
}
/**
 * "MT3 · 5 em": tên đợt là LINK mở lượt của em đầu tiên trong đợt (cùng `duongDotTest` như "MT3 ›" cũ cạnh tên em — PTA rà #1859: không mất đường vào trang lượt);
 * `kind` / `classId` để lớp thường mở đúng trang bài. Không có `attemptId` thì chữ thường.
 */
export function DotChinh({ luot, classId, kind }: { luot: LuotHang | undefined; classId: number; kind?: string | null }) {
  if (!luot) return null;
  const ten = dich(luot.dot);
  const k = (luot.kind ?? kind ?? '').split(':')[0] || null;
  return (
    <>
      {luot.attemptId ? <Link to={duongDotTest({ id: luot.attemptId, kind: k, classId })} className="lt-ma-dot" title={t('Mở {dot}', { dot: ten })}>{ten}</Link> : ten}
      {' · '}{t('{n} em', { n: luot.soHv })}
    </>
  );
}
export const ODot = ({ luot, classId, kind }: { luot: readonly LuotHang[]; classId: number; kind?: string | null }) => {
  const { phu } = chuDot(luot);
  return <span className="lt-dot"><span><DotChinh luot={luot[0]} classId={classId} kind={kind} /></span>{phu && <small>{phu}</small>}</span>;
};

/** LT-DONG-GV (v23 L1 `.gv`): "GV A · B" dưới mã lớp (GV đang dạy, máy chủ `gvLop`); > 2 người → "GV A · B +n", đủ tên ở tooltip. Không phân công thì không vẽ. */
/* Hai tên dài hơn ~27 ký tự thì không vừa cột Lớp (256, chữ 12) một dòng → chỉ tên đầu + "+n" (không để "…" nuốt mất "+n"). */
const VUA_HAI_TEN = 27;
function soTenHien(ds: readonly string[]): number {
  return ds.length > 1 && ds.slice(0, 2).join(' · ').length > VUA_HAI_TEN ? 1 : Math.min(2, ds.length);
}
export function chuGvLop(ds: readonly string[] | undefined): string {
  if (!ds?.length) return '';
  const n = soTenHien(ds);
  return t('GV {ten}', { ten: ds.slice(0, n).join(' · ') + (ds.length > n ? ` +${ds.length - n}` : '') });
}
export const DongGv = ({ ds }: { ds: readonly string[] | undefined }) => {
  const chu = chuGvLop(ds);
  return chu ? <small className="lt-gv" title={ds!.length > soTenHien(ds!) ? ds!.join(' · ') : undefined}>{chu}</small> : null;
};

/** Dòng nhỏ "Còn chờ: GV (môn) · …" ở ĐẦU phần lớp đã mở (1440 và 375). Rỗng thì không vẽ. */
export const DongConCho = ({ ds }: { ds: string }) => (ds ? <p className="m-0 px-4 pt-2.5 text-[13px] leading-snug text-dim">{t('Còn chờ: {ds}', { ds })}</p> : null);

/**
 * GIAM-COMPUTE C1 (chủ SP 21/11 "Làm C1"): lưới hàng lớp đang mở chỉ gắn (gọi `/classes/:id/cham`) khi tới gần khung nhìn — lề một màn trên / dưới. "Mở tất cả lớp"
 * trước bắn mọi lưới song song (mỗi request một máy Netlify → khởi động lạnh). Đã gắn thì giữ (cuộn đi không mất dữ liệu / ô đang gõ); `ngay` (hàng mở tay / theo
 * đường dẫn — con trỏ vào ô trống) gắn liền. Trang cuộn trong `<main id="noi-dung">` nên lấy nó làm gốc (lề tính theo gốc). Khung chờ = khung chờ của `LuoiNhung`.
 */
function KhiToiGan({ ngay, children }: { ngay: boolean; children: ReactNode }) {
  const [gan, setGan] = useState(ngay);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (gan) return undefined;
    const el = ref.current;
    if (ngay || !el || typeof IntersectionObserver === 'undefined') { setGan(true); return undefined; }
    const o = new IntersectionObserver((ds) => { if (ds.some((d) => d.isIntersecting)) setGan(true); },
      { root: el.closest('#noi-dung'), rootMargin: '100% 0px' });
    o.observe(el);
    return () => o.disconnect();
  }, [gan, ngay]);
  return gan ? <>{children}</> : <div ref={ref} className="py-1"><Skeleton rows={4} /></div>;
}

/**
 * HÀNG LỚP của Lịch tuần (GD-11a, ⑦ A1 / A3 / A6): ghi THẲNG trên hàng — Lớp (link hồ sơ) · Đợt chính "MT3 · 5 em" (+ "+ MT1 · 1 em" nếu có lượt khác)
 * · hạn chấm (ngày tô màu theo luật hạn, lớp xong thì trống) · tiến độ (kèm thẻ "n bài chờ duyệt dời"; tooltip có "còn chờ: GV (môn)") · trạng thái; một hàng tiêu đề cột mảnh ở đầu.
 * Mở ra là lưới chấm tại chỗ đúng tuần thi của hàng (KHÔNG đổi). < 1024 px: mỗi lớp một thẻ (mã · tiến độ / đợt · môn / hạn · chờ dời · trạng thái).
 */
export function HangLop({ lop, gvLop, moCua, onMo, onLopTiep, coChiNhanh, gon, urlClassId, urlKn, conTro, onDaLuu, chuaLuu, baoChuaLuu, sEx }: {
  lop: LopLichTest[];
  /** LT-DONG-GV: classId → GV đang dạy (`LichTest.gvLop`). */
  gvLop: LichTest['gvLop'];
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
      {!gon && <DauCotLichTest />}
      {lop.map((l) => {
        const k = khoaHang(l);
        const mo = moCua(l);
        /* Việc xong không nơi nào còn báo hạn: hạn chỉ khi còn bài (người có phân công: bài của mình). */
        const con = l.phan ? l.conBaiCuaToi : l.conBai;
        const han = con > 0 ? <Han loai="nhap-diem" han={l.han} trongBang={!gon} khongDau /> : null;
        const { phu: dotPhu, nhanChinh } = chuDot(l.luot);
        const conCho = l.phan ? '' : chuConCho(l.gvMon, l.chuongTrinh);
        const tienDo = <TienDo so={`${l.daCham} / ${l.tong}`} title={t('Đã chấm {daCham} trong {tong} bài', { daCham: l.daCham, tong: l.tong })} ti={l.tong ? l.daCham / l.tong : 0} />;
        const maLop = (
          <span className="block min-w-0 flex-1">
            <Link to={`/hoc-vien/lop/${l.classId}`} className="lt-ma" title={t('Hồ sơ lớp {classCode}', { classCode: l.classCode })}>{l.classCode}</Link>
            {!gon && <DongGv ds={gvLop[l.classId]} />}
            {coChiNhanh && <small className="block truncate text-xs font-normal text-dim">{l.branchName}</small>}
          </span>
        );
        return (
          <tbody key={k}>
            <HangNhom mo={mo} onMo={() => onMo(l)} nhan={t('lớp {classCode}', { classCode: l.classCode })} className={`lt-hang ${mo ? 'dang-mo' : ''}`}
              tieuDe={gon ? (
                /* ⑦ A6: thẻ ba dòng — mã · tiến độ / đợt / hạn · chờ dời · trạng thái. */
                <span className="lt-the">
                  <span className="h1">{maLop}{tienDo}</span>
                  <DongGv ds={gvLop[l.classId]} />
                  <span className="h2"><b><DotChinh luot={l.luot[0]} classId={l.classId} kind={l.kind} /></b>{dotPhu && <span className="text-xs text-dim">{dotPhu}</span>}</span>
                  <span className="h3">{han}<TheChoDoi n={l.choDuyetDoi} /><NhanLop l={l} chuaLuu={chuaLuu[k]} /></span>
                </span>
              ) : maLop}>
              {!gon && (
                <>
                  <td><ODot luot={l.luot} classId={l.classId} kind={l.kind} /></td>
                  <td>{han}</td>
                  <td><span className="lt-td-cell">{tienDo}<TheChoDoi n={l.choDuyetDoi} /></span></td>
                  <td><NhanLop l={l} chuaLuu={chuaLuu[k]} /></td>
                </>
              )}
            </HangNhom>
            {(mo || (chuaLuu[k] ?? 0) > 0) && (
              <HangCon className={mo ? '' : 'hidden'}>
                <td colSpan={soCot} className="lt-luoi !p-0">
                  <DongConCho ds={conCho} />
                  <KhiToiGan ngay={conTro.has(k)}>
                    <LuoiNhung classId={l.classId} periodId={l.mode === 'ielts_band' ? l.periodId : null} kind={l.kind}
                      tuanDangXem={l.weekStart} kn={l.classId === urlClassId ? urlKn : null} hrefDayDu={l.hrefDayDu}
                      datConTro={conTro.has(k)} onDaLuu={onDaLuu} coLinkRieng sEx={l.mode === 'ielts_band' ? sEx.filter((x) => x.classId === l.classId) : undefined}
                      onSoOChuaLuu={(n) => baoChuaLuu(k, n)} onHet={onHet(l)} luotChinh={nhanChinh} />
                  </KhiToiGan>
                </td>
              </HangCon>
            )}
          </tbody>
        );
      })}
    </table>
  );
}
