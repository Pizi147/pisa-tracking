import { Fragment, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { NhomDau } from './NhomDau.tsx';
import { ChipHan, Nhan } from '../../../ui/Nhan.tsx';
import { Han } from '../../../ui/Han.tsx';
import { HangNhom } from '../../../ui/HangNhom.tsx';
import { chuOChuaLuu } from '@shared/domain/index.ts';
import type { DongNoLop } from './kieu.ts';
import { LuoiNhung } from './LuoiNhung.tsx';
import { useManHinh } from '../../../ui/TheDong.tsx';
import { COT_LICH_TEST, ChipMon, ColLichTest, ODot, TienDo, Vien, chuConCho } from './HangLop.tsx';
import { dich, t } from '@shared/i18n/index.ts';

/** OV-11e (TE-7): số bài của người xem — người có phân công chỉ đếm phần của mình (dải số, badge khối, cột Còn cùng số). */
const conCua = (d: DongNoLop) => (d.phan ? d.phan.toi?.con ?? 0 : d.conBai);

/**
 * KHỐI 1 "TEST QUÁ HẠN CHẤM" (PR-LT3 T16–T17) — bài thi đã quá hạn chấm, theo HÔM NAY (đổi tuần xem không đổi khối này).
 *
 * LT-GON (chủ SP 05/11: "đừng phân ra MT mấy MT mấy — HV cùng một lớp thì một hàng rồi bấm vào hiện lên"): MỘT HÀNG MỘT LỚP (`gopNoTheoLop` gộp mọi
 * đợt / MT / kỹ năng / bài của lớp): mã lớp · số bài · viên quá hạn lâu nhất · người chưa chấm (chữ nhỏ mờ) · nút. Bấm hàng (hoặc nút) → lưới ngay
 * DƯỚI HÀNG, chỉ các bài quá hạn của lớp (mọi MT trong MỘT lưới; "MT3 · W1 SEP" là chữ phụ dưới tên em — `luotDuoiTen`). Lớp thường có hai bài
 * quá hạn → mỗi bài một lưới, tên bài nhỏ ở trên.
 *
 * Q14: hàng đang mở mà máy chủ không còn trả (vừa chấm hết) vẫn giữ trên màn, ghi "Đã chấm ✓", tới khi người dùng thu — hàng biến mất giữa lúc gõ
 * là mất ô đang nhập. `dongMo` là bản sao hàng đó, do `LichTestTab` giữ.
 */
export function KhoiNo({ no, mo, onMo, dongMo, onMoDong, hep, onDaLuu, knUrl, chuaLuu, baoChuaLuu }: {
  no: DongNoLop[]; mo: boolean; onMo: () => void;
  dongMo: { d: DongNoLop; viTri: number; conTro: boolean } | null;
  onMoDong: (d: DongNoLop | null, viTri: number) => void;
  hep: boolean; homNay: string; onDaLuu: () => void; knUrl: string | null;
  /** Số ô lưu hỏng theo khoá hàng (đang mở). */
  chuaLuu: Readonly<Record<string, number>>;
  baoChuaLuu: (khoa: string, n: number) => void;
}) {
  const soBai = no.reduce((n, d) => n + conCua(d), 0);

  /* Hàng đang mở mà máy chủ không còn trả thì chèn lại đúng chỗ cũ. */
  const ds = useMemo(() => {
    const out = no.map((d) => ({ d, xong: false }));
    if (!dongMo || no.some((d) => d.key === dongMo.d.key)) return out;
    out.splice(Math.min(dongMo.viTri, out.length), 0, { d: dongMo.d, xong: true });
    return out;
  }, [no, dongMo]);
  const chiAttempt = useMemo(
    () => (dongMo ? new Set(dongMo.d.attemptIds) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- theo danh sách lượt, không theo đối tượng
    [dongMo?.d.attemptIds.join(',')],
  );
  /* Lớp thường hai bài → hai lưới: cộng ô chưa lưu của mọi lưới vào MỘT khoá hàng (đóng hàng còn ô chưa lưu thì hỏi — chống mất chữ). */
  const oLoi = useRef<Record<number, number>>({});
  useEffect(() => { oLoi.current = {}; }, [dongMo?.d.key]);
  const baoLoiLuoi = (khoa: string, i: number, n: number) => {
    oLoi.current[i] = n;
    baoChuaLuu(khoa, Object.values(oLoi.current).reduce((a, b) => a + b, 0));
  };
  /* RA-UI-4 (PTA 29/10): < 1024 px dáng hai cột (lớp · số bài · hạn / người chưa chấm · nút). */
  const gon = useManHinh('(max-width: 1023px)') || hep;

  const tieuDe = t('Quá hạn chấm');
  if (!ds.length) return <div id="lich-test-no"><NhomDau id="lich-test-no-than" rong mo={false} onMo={onMo} tieuDe={tieuDe} phu={t('{n} bài', { n: 0 })} /></div>;
  const soCot = gon ? 1 : COT_LICH_TEST.length;

  return (
    <div id="lich-test-no">
      <NhomDau id="lich-test-no-than" qua={soBai > 0} mo={mo} onMo={onMo} tieuDe={tieuDe} phu={t('{soLop} lớp · {n} bài', { soLop: no.length, n: soBai })}>
        {/* GD-11a (⑦ A1): hàng Quá hạn cùng bộ cột với hàng lớp (Lớp · Đợt · Môn · Hạn · còn chờ · số bài · nút) — các bảng thẳng cột. */}
        <table className="lt-bang w-full text-sm bang-dinh" style={{ tableLayout: 'fixed' }}>
          {gon ? <colgroup><col /></colgroup> : <ColLichTest />}
          <tbody>
            {ds.map(({ d, xong }, i) => {
              const dangMo = dongMo?.d.key === d.key;
              const khoa = `no:${d.key}`;
              const loi = chuaLuu[khoa] ?? 0;
              const doi = () => onMoDong(dangMo ? null : d, i);
              const nut = (
                <button type="button" className={`btn btn-sm w-full justify-center ${gon ? 'min-h-[44px]' : ''}`}
                  aria-expanded={dangMo}
                  title={dangMo ? t('Thu lưới lại') : d.duocCham ? t('Mở lưới ngay dưới dòng, chỉ các em còn nợ') : t('Xem lưới (môn người khác dạy)')}
                  onClick={doi}>
                  {dangMo ? t('Thu gọn') : d.duocCham && !xong ? t('Nhập điểm') : t('Xem')}
                </button>
              );
              const so = xong ? <Vien muc="xong">{t('Đã chấm')}</Vien> : <TienDo so={conCua(d)} />;
              const han = xong ? null : d.phan && !d.quaHan ? <Han loai="nhap-diem" han={d.han} boTinHieu /> : <ChipHan vien loai="nhap-diem" han={d.han} />;
              const canhBao = loi > 0 && <Nhan tone="bad" title={t('Ô viền đỏ chưa lưu được — bấm Lưu lại ở ô đó.')}>{chuOChuaLuu(loi)}</Nhan>;
              const mon = <ChipMon ct={d.chuongTrinh} ds={d.phan ? d.phan.toi?.kyNang ?? [] : d.kyNang} />;
              const conCho = chuConCho(d.gvMon, d.chuongTrinh);
              const chuConChoDong = conCho.chu && t('còn chờ: {ds}', { ds: conCho.chu });
              const chuConChoDu = conCho.du && t('còn chờ: {ds}', { ds: conCho.du });
              const maLop = <Link to={`/hoc-vien/lop/${d.classId}`} className="lt-ma" title={t('Hồ sơ lớp {classCode}', { classCode: d.classCode })}>{d.classCode}</Link>;
              return (
                <Fragment key={d.key}>
                  {gon ? (
                    /* ⑦ A6: thẻ — mã · số bài / đợt · môn / hạn; nút "Nhập điểm" hết bề ngang 44 px. Bấm chỗ trống thẻ = mở / thu lưới. */
                    <tr className="lt-hang" onClick={(e) => { if (!(e.target as HTMLElement).closest('a,button')) doi(); }}>
                      <td className="cursor-pointer">
                        <span className="lt-the">
                          <span className="h1">{maLop}{so}</span>
                          <span className="h2"><b>{dich(d.dotLabel)}</b>{mon}</span>
                          {(han || canhBao) && <span className="h3">{han}{canhBao}</span>}
                          {chuConChoDong && <span className="text-xs text-dim">{chuConChoDong}</span>}
                          {nut}
                        </span>
                      </td>
                    </tr>
                  ) : (
                    <HangNhom mo={dangMo} onMo={doi} nhan={t('lớp {classCode}', { classCode: d.classCode })} className="lt-hang" tieuDe={maLop}>
                      <td><ODot dot={dich(d.dotLabel)} phu={t('{n} em', { n: d.soHv })} /></td>
                      <td>{mon}</td>
                      <td><span className="inline-flex items-center gap-2">{han}{canhBao}</span></td>
                      <td className="lt-gc" title={chuConChoDu || undefined}>{chuConChoDong}</td>
                      <td className="text-right">{so}</td>
                      <td>{nut}</td>
                    </HangNhom>
                  )}
                  {dangMo && (
                    /* Mục con (T17): nền nhạt, thụt + MỘT vạch dọc 1 px — không khung bo, không viền thứ hai. */
                    <tr>
                      <td colSpan={soCot} className="p-0" style={{ background: 'var(--hang-con-bg)' }}>
                        <div className="muc-con ml-2 border-l py-1.5 pl-2.5 sm:ml-5 sm:pl-3.5" style={{ borderColor: 'var(--line-strong)' }}>
                          {d.luoi.map((l, j) => (
                            <Fragment key={l.kind ?? 'ft'}>
                              {d.luoi.length > 1 && <div className="px-1 pt-1.5 text-xs font-medium text-dim">{dich(l.nhan)}</div>}
                              <LuoiNhung classId={d.classId} periodId={null} kind={l.kind} tuanDangXem={null} chiAttempt={chiAttempt}
                                kn={knUrl ?? d.kyNang[0] ?? null} hrefDayDu={d.hrefDayDu} datConTro={dongMo!.conTro && j === 0} coLinkRieng luotDuoiTen
                                onDaLuu={onDaLuu} onSoOChuaLuu={(n) => baoLoiLuoi(khoa, j, n)} />
                            </Fragment>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </NhomDau>
    </div>
  );
}
