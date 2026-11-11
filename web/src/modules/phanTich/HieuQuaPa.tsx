import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Card, ErrorState, Skeleton, Th } from '../../ui/ui.tsx';
import { HangCon, HangNhom } from '../../ui/HangNhom.tsx';
import { CHIP_SOS, Nhan, lopSos } from '../../ui/Nhan.tsx';
import { TyLe } from '../../ui/TyLe.tsx';
import { PhanTrang, usePhanTrang } from '../../ui/PhanTrang.tsx';
import { DINH_TRAI, DaiChiSo, DauThe, NutXemToanBo, RongDau, SoO as OSo, VaoHangLoc, thamSoLoc, type PhamViPhanTich } from './dungChung.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { t } from '@shared/i18n/index.ts';
import {
  NGUONG_IT_DU_LIEU, nhanKhoang, rateView, type DongHieuQuaPa, type HieuQuaPaKetQua,
} from '@shared/domain/index.ts';

/**
 * HIỆU QUẢ PA (PR-UX4, mockup 16 §4; PR-Pb2-a T61, K1-23, P9, P9b, P12; V8-PT khung A5 / C3) — thẻ chỉ số + hai thẻ bảng CÙNG LƯỚI CỘT:
 *   1. PA do giáo viên thêm: vấn đề (nhóm nguyên nhân chính) → loại PA; "Nên dùng" chỉ ở loại PA đủ mẫu, cải thiện ≥ 70% và cao nhất trong vấn đề.
 *   2. PA theo quy chế: dòng PHẲNG (FT: chip SOS n + loại PA; lớp thường: Bổ trợ Giữa khoá / sau Cuối khoá) — thứ tự cố định, không so, không xếp hạng.
 * Lọc `gv` (người phụ trách Case) đến từ URL (Hợp đồng a↔b: link từ hồ sơ GV / bảng giáo viên) → chip "GV: … ✕" trên hàng lọc; tên GV lấy từ máy chủ.
 * 375: bảng giữ ≤ 4 cột số — thời gian + Nên dùng xuống dòng phụ dưới tên.
 */
type DongQc = { d: DongHieuQuaPa; cha: DongHieuQuaPa | null };
/** FT: mỗi (mức SOS, loại PA) một dòng; lớp thường: mỗi loại bổ trợ một dòng. */
const phangQuyChe = (hang: DongHieuQuaPa[]): DongQc[] => hang.flatMap((h): DongQc[] => (h.con?.length ? h.con.map((d) => ({ d, cha: h })) : [{ d: h, cha: null }]));

/** `onData` (PR-5 Excel): báo dữ liệu đã nạp lên khối SOS để Xuất Excel có bảng PA mà không gọi lại máy chủ. */
export function HieuQuaPa(props: PhamViPhanTich & { onData?: (d: HieuQuaPaKetQua | null) => void }) {
  const [params, setParams] = useSearchParams();
  const them: Record<string, string> = {};
  if (params.get('gv')) them.gv = params.get('gv')!;
  const query = thamSoLoc(props, them);
  const { data, loading, error, reload } = useApi<HieuQuaPaKetQua>(`/phan-tich/hieu-qua-pa?${query}`, [query]);
  const { onData } = props;
  useEffect(() => { onData?.(data ?? null); }, [data, onData]);
  const dongQc = data ? phangQuyChe(data.quyChe.hang) : [];
  const ptGv = usePhanTrang(data?.gvThem.hang.length ?? 0, query, t('vấn đề'));
  const ptQc = usePhanTrang(dongQc.length, query, t('dòng'));
  const nguon = (dong: string, cot: string) => `/phan-tich/hieu-qua-pa/o?${query}&dong=${encodeURIComponent(dong)}&cot=${encodeURIComponent(cot)}`;
  const boLoc = (...khoa: string[]) => {
    const next = new URLSearchParams(params);
    for (const k of khoa) next.delete(k);
    setParams(next, { replace: false });
  };

  /* Mở sẵn vấn đề đủ dữ liệu (≥ 5 PA); nhóm "vấn đề khác" luôn đóng. */
  const [mo, setMo] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!data) return;
    setMo(new Set(data.gvThem.hang.filter((h) => !h.itDuLieu).map((h) => h.khoa)));
  }, [data]);
  /* V2 (PR-3): đến từ link cũ `goc=hieu-qua-pa` → cuộn tới khối này một lần khi đã có số, rồi bỏ `cuon` khỏi URL. */
  useEffect(() => {
    if (!data || params.get('cuon') !== 'pa') return;
    document.getElementById('khoi-pa')?.scrollIntoView({ block: 'start' });
    boLoc('cuon');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);
  const doiMo = (khoa: string) => setMo((cu) => { const n = new Set(cu); if (n.has(khoa)) n.delete(khoa); else n.add(khoa); return n; });

  const goiY = (d: DongHieuQuaPa) => (d.nenDung ? t('Nên dùng') : d.itDuLieu && d.khoa !== 'chua-phan-loai' ? t('Ít dữ liệu') : null);
  /** Có cải thiện: 1440 vạch tỷ lệ + n / N · %; 375 n + %. */
  const caiThien = (d: DongHieuQuaPa, ten: string) => {
    const v = rateView(d.caiThien, d.soPa);
    if (v.kind !== 'value') return <TyLe n={d.caiThien} N={d.soPa} />;
    return (
      /* V2 (khối gọn, hai bảng cạnh nhau): bỏ vạch tỷ lệ — ô hẹp chỉ "n / N · %", một dòng. */
      <span className="inline-flex items-center gap-2 whitespace-nowrap tabular-nums">
        <OSo giaTri={d.caiThien} nguon={nguon(d.khoa, 'cai-thien')} tieuDe={t('{ten} · có cải thiện', { ten })} />
        <span className="text-[color:var(--text-faint)] max-sm:text-xs"><span className="max-sm:hidden">/ {v.N} · </span>{v.percent} %</span>
      </span>
    );
  };
  const oSo = (d: DongHieuQuaPa, ten: string, coGoiY: boolean) => {
    const g = coGoiY ? goiY(d) : null;
    return (
      <>
        <td className="td text-center tabular-nums"><OSo giaTri={d.soPa} nguon={nguon(d.khoa, 'pa')} tieuDe={t('{ten} · PA có kết quả', { ten })} /></td>
        <td className="td text-center tabular-nums"><OSo giaTri={d.hocVien} nguon={nguon(d.khoa, 'hv')} tieuDe={t('{ten} · học viên', { ten })} /></td>
        <td className="td max-sm:text-center">{caiThien(d, ten)}</td>
        <td className="td max-sm:hidden">
          {g && <Nhan tone={d.nenDung ? 'ok' : 'muted'} title={d.nenDung ? t('Cải thiện từ 70%, đủ mẫu và cao nhất trong vấn đề này') : t('Dưới {n} PA có kết quả — chưa đủ để so sánh', { n: NGUONG_IT_DU_LIEU })}>{g}</Nhan>}
        </td>
      </>
    );
  };

  /** Ô đầu: tên + (P9b) "k PA chạy cùng PA khác" + (375) dòng phụ thời gian · Nên dùng. */
  const tenDong = (d: DongHieuQuaPa, ten: ReactNode = d.nhan) => {
    const phu375 = [goiY(d)].filter(Boolean).join(' · ');   // V2: bỏ "Thời gian thường mất"
    return (
      <span className="block min-w-0">
        <span className="block sm:truncate">{ten}</span>
        {d.dongThoi > 0 && <span className="block text-xs font-normal tabular-nums text-[color:var(--text-faint)]">{t('{n} PA chạy cùng PA khác', { n: d.dongThoi })}</span>}
        {phu375 && <span className="block text-xs font-normal text-[color:var(--text-faint)] sm:hidden">{phu375}</span>}
      </span>
    );
  };
  const HANG_LON = `${DINH_TRAI} [&>td]:h-11 [&>td]:text-sm`;   // dòng nhóm 14 / 700, cao 44 (mockup `.bang tr.hang-lon`)
  const HANG_CON = `${DINH_TRAI} [&>td]:h-[38px] [&>td]:text-sm`;
  const hangLon = (d: DongHieuQuaPa) => (
    <Fragment key={d.khoa}>
      {d.con?.length ? (
        <HangNhom mo={mo.has(d.khoa)} onMo={() => doiMo(d.khoa)} nhan={d.nhan} tieuDe={tenDong(d)} className={HANG_LON}>{oSo(d, d.nhan, true)}</HangNhom>
      ) : (
        /* PR-S6F-a Q20: hàng "Case chưa chọn nhóm nguyên nhân" mờ — PA có thật nhưng chưa biết thuộc vấn đề nào. */
        <tr className={`hang-lon ${HANG_LON}${d.khoa === 'chua-phan-loai' ? ' text-slate-400' : ''}`}><td className="td">{tenDong(d)}</td>{oSo(d, d.nhan, true)}</tr>
      )}
      {mo.has(d.khoa) && d.con?.map((c) => (
        <HangCon key={c.khoa} className={HANG_CON}><td className="td">{tenDong(c)}</td>{oSo(c, `${d.nhan} · ${c.nhan}`, true)}</HangCon>
      ))}
    </Fragment>
  );
  /** Dòng quy chế phẳng (mockup `.hang-lon.phang`): 14 / 700, không nền nhóm, không ▸. */
  const hangQc = ({ d, cha }: DongQc) => {
    const muc = cha ? /^qc:sos(\d)$/.exec(cha.khoa)?.[1] : undefined;
    const ten = cha ? `${cha.nhan} · ${d.nhan}` : d.nhan;
    const nhan = muc
      ? <span className="inline-flex items-center gap-2"><span className={`${CHIP_SOS} ${lopSos(Number(muc))}`}>SOS {muc}</span><span className="min-w-0 truncate">{d.nhan}</span></span>
      : ten;
    return <tr key={d.khoa} className={`${DINH_TRAI} font-bold [&>td]:h-11 [&>td]:text-sm`}><td className="td">{tenDong(d, nhan)}</td>{oSo(d, ten, false)}</tr>;
  };

  /* Hai bảng cùng lưới cột (mockup A5): 1440 tên 34 % · 90 · 90 · 240 · 160 · Gợi ý; 375 tên 43 % · 15 % · 14 % · Cải thiện 28 %. */
  const dauBang = (cotDau: string, coGoiY: boolean) => (
    <>
      <colgroup>
        <col className="w-[43%] sm:w-[40%]" /><col className="w-[15%] sm:w-[13%]" /><col className="w-[14%] sm:w-[11%]" />
        <col className="w-[28%] sm:w-[22%]" /><col className="w-0 sm:w-auto" />
      </colgroup>
      <thead>
        <tr>
          <Th className="sticky-col">{cotDau}</Th>
          <Th align="center">{t('Số PA')}</Th>
          <Th align="center">{t('HV')}</Th>
          <Th className="max-sm:text-center"><span className="max-sm:hidden">{t('Có cải thiện')}</span><span className="sm:hidden">{t('Cải thiện')}</span></Th>
          <Th className="max-sm:hidden">{coGoiY ? t('Gợi ý') : ' '}</Th>
        </tr>
      </thead>
    </>
  );
  const BANG = 'w-full table-fixed text-sm';

  const khoang = nhanKhoang(props.khoang).chinh;
  const tongPa = data ? data.gvThem.tomTat.paCoKetQua + data.quyChe.tomTat.paCoKetQua : 0;
  const tongCt = data ? data.gvThem.tomTat.caiThien + data.quyChe.tomTat.caiThien : 0;
  const pctCt = rateView(tongCt, tongPa);
  const chuaTinh = (giaTri: number, dong: string, cot: string, chu: string, giaiThich?: string) => (
    <span className="inline-flex flex-wrap items-center gap-x-1.5"><span><b className="mr-1 text-[15px] font-bold tabular-nums text-[color:var(--text)]"><OSo giaTri={giaTri} nguon={nguon(dong, cot)} tieuDe={chu} /></b>{chu}</span>
      {/* PANEL-RIENG (B6): ⓘ nói vì sao không tính. */}
      {giaiThich && <NutLuat label={giaiThich}>{giaiThich}</NutLuat>}</span>
  );
  const cachDoc = (
    <>
      <p className="m-0">{t('"Có cải thiện" = Tiến bộ rõ + Tiến bộ một phần, trên PA đã kết thúc có kết quả xác định. PA huỷ vì "không cần theo dõi" không tính. Học viên: một em nhiều PA chỉ tính một lần.')}</p>
      <p className="m-0">{t('Dưới {n} PA ghi "Ít dữ liệu".', { n: NGUONG_IT_DU_LIEU })}</p>
    </>
  );

  return (
    <section id="khoi-pa" className="card scroll-mt-4 overflow-clip">
      {params.get('gv') && (
        <VaoHangLoc o="giua">
          {data?.loc.gv ? (
            <button type="button" onClick={() => boLoc('gv')} title={t('Bỏ lọc giáo viên')} className="nut-loc nut-loc-dang text-[color:var(--text)]">
              {t('GV: {ten}', { ten: data.loc.gv.ten })} <span aria-hidden>✕</span>
            </button>
          ) : data && (
            <button type="button" onClick={() => boLoc('gv')} className="btn h-9">{t('Không xem được giáo viên này — bỏ lọc')}</button>
          )}
        </VaoHangLoc>
      )}
      {error ? <div className="p-4"><ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} /></div>
        : loading || !data ? <div className="p-4"><Skeleton rows={6} /></div>
        : data.scopeEmpty ? <RongDau chu={t('Bạn chưa được cấp phạm vi nào')} />
        : (
          <>
            {/* V2 (đặc tả 11, mockup #1400 B1): một khối gọn — đầu khối 2 số (PA có kết quả · Có cải thiện); bỏ "Thời gian thường mất"; "Chưa tính" một dòng nhỏ khi > 0. */}
            <DauThe ten={t('PA nào hiệu quả')}
              phu={<span className="inline-flex flex-wrap items-baseline gap-x-1.5">{t('PA có kết quả')} <b className="text-[17px]"><OSo giaTri={tongPa} nguon={nguon('tong', 'pa')} tieuDe={t('PA có kết quả')} vung="chi-so" /></b>
                · {t('có cải thiện')} <b className="text-[17px]"><OSo giaTri={tongCt} nguon={nguon('tong', 'cai-thien')} tieuDe={t('Có cải thiện')} vung="chi-so" /></b>{pctCt.kind === 'value' && <span className="text-faint">{pctCt.percent} %</span>}</span>}
              cachTinh={cachDoc} />
            {data.chuaGhiKetQua + data.caseChuaPhanLoai + data.chuaRoNguon > 0 && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b px-4 py-2 text-[13px] text-[color:var(--text-dim)]" style={{ borderColor: 'var(--line)' }}>
                <span className="font-semibold">{t('Chưa tính')}:</span>
                {data.chuaGhiKetQua > 0 && chuaTinh(data.chuaGhiKetQua, 'chua-ghi-ket-qua', 'pa', t('PA chưa có kết quả'), t('Không tính vào bảng hiệu quả tới khi có kết quả'))}
                {data.caseChuaPhanLoai > 0 && chuaTinh(data.caseChuaPhanLoai, 'case-chua-phan-loai', 'case', t('Case chưa chọn nhóm nguyên nhân'))}
                {data.chuaRoNguon > 0 && chuaTinh(data.chuaRoNguon, 'chua-ro-nguon', 'pa', t('PA chưa rõ nơi học lúc làm PA'), t('PA có kết quả nhưng chưa có lần ghi danh nào cho biết em học ở đâu lúc làm PA — không tính vào bảng nào'))}
              </div>
            )}
            <div className="grid xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">

            {/* ---------------------------------------------------------------- 1. PA do giáo viên thêm */}
            <div className="min-w-0">
              <DauThe ten={t('PA do GV thêm')} dem={t('{n} PA', { n: data.gvThem.tomTat.paCoKetQua })}
                phu={data.gvThem.tomTat.paCoKetQua ? t('{n} có cải thiện', { n: data.gvThem.tomTat.caiThien }) : undefined}
                cachTinh={(
                  <>
                    {cachDoc}
                    <p className="m-0">{t('Tính theo nơi em học lúc làm PA. "Nên dùng" = từ {n} PA, cải thiện từ 70% và cao nhất trong vấn đề.', { n: NGUONG_IT_DU_LIEU })}</p>
                    {data.gvThem.gom && <p className="m-0">{t('vấn đề khác')}: {t('mỗi vấn đề ≤ 2 PA có kết quả')}</p>}   {/* PT-GON: chạm (375) không có title → câu cũng ở ⓘ */}
                  </>
                )} />
              {data.gvThem.hang.length === 0 && !data.gvThem.gom
                ? <RongDau chu={t('Chưa có PA do giáo viên thêm có kết quả trong {khoang}.', { khoang })} nut={<NutXemToanBo />} />
                : (
                  <>
                    <div ref={ptGv.thanh.dauBang} />
                    <div className="table-scroll">
                      <table className={BANG}>
                        {dauBang(t('Vấn đề / loại PA'), true)}
                        <tbody>
                          {ptGv.cat(data.gvThem.hang).map(hangLon)}
                          {data.gvThem.gom && (
                            <Fragment>
                              <HangNhom mo={mo.has('gom')} onMo={() => doiMo('gom')} nhan={t('vấn đề khác')} soCotDau={5} className={HANG_LON}
                                tieuDe={(
                                  <span className="block min-w-0 truncate" title={t('mỗi vấn đề ≤ 2 PA có kết quả')}>{t('{n} vấn đề khác', { n: data.gvThem.gom.soVanDe })}</span>   /* PT-GON (M4): câu giải thích khi rê */
                                )} />
                              {mo.has('gom') && data.gvThem.gom.hang.map((d) => (
                                <HangCon key={d.khoa} className={HANG_CON}><td className="td">{tenDong(d)}</td>{oSo(d, d.nhan, true)}</HangCon>
                              ))}
                            </Fragment>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="px-3"><PhanTrang {...ptGv.thanh} duoi /></div>
                  </>
                )}
            </div>

            {/* ---------------------------------------------------------------- 2. PA theo quy chế */}
            <div className="min-w-0 border-[color:var(--line-strong)] max-xl:border-t xl:border-l">
              <DauThe ten={t('PA theo quy chế')} dem={t('{n} PA', { n: data.quyChe.tomTat.paCoKetQua })}
                cachTinh={(
                  <>
                    {/* PT-GON (M4): "bắt buộc · không so, không xếp hạng" từ dòng phụ đầu thẻ vào ⓘ. */}
                    <p className="m-0">{t('bắt buộc · không so, không xếp hạng')}</p>
                    {cachDoc}
                    {props.ct === 'ft' && <p className="m-0">{t('Xếp theo mức SOS hiện tại của Case: Case trượt lại thì PA cũ hiện ở hàng mức mới.')}</p>}
                  </>
                )} />
              {dongQc.length === 0
                ? <RongDau chu={t('Chưa có PA theo quy chế có kết quả trong {khoang}.', { khoang })} nut={<NutXemToanBo />} />
                : (
                  <>
                    <div ref={ptQc.thanh.dauBang} />
                    <div className="table-scroll">
                      <table className={BANG}>
                        {dauBang(props.ct === 'thuong' ? t('Loại bổ trợ') : t('Mức SOS / loại PA'), false)}
                        <tbody>{ptQc.cat(dongQc).map(hangQc)}</tbody>
                      </table>
                    </div>
                    <div className="px-3"><PhanTrang {...ptQc.thanh} duoi /></div>
                  </>
                )}
            </div>
            </div>
          </>
        )}
    </section>
  );
}
