import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Card, Empty, ErrorState, Skeleton, Th } from '../../ui/ui.tsx';
import { HangCon, HangNhom } from '../../ui/HangNhom.tsx';
import { CHIP_SOS, Nhan, lopSos } from '../../ui/Nhan.tsx';
import { TyLe } from '../../ui/TyLe.tsx';
import { PhanTrang, usePhanTrang } from '../../ui/PhanTrang.tsx';
import { DINH_TRAI, DaiChiSo, DauThe, SoO as OSo, VaoHangLoc, thamSoLoc, type PhamViPhanTich } from './dungChung.tsx';
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

export function HieuQuaPa(props: PhamViPhanTich) {
  const [params, setParams] = useSearchParams();
  const them: Record<string, string> = {};
  if (params.get('gv')) them.gv = params.get('gv')!;
  const query = thamSoLoc(props, them);
  const { data, loading, error, reload } = useApi<HieuQuaPaKetQua>(`/phan-tich/hieu-qua-pa?${query}`, [query]);
  const dongQc = data ? phangQuyChe(data.quyChe.hang) : [];
  const ptGv = usePhanTrang(data?.gvThem.hang.length ?? 0, query, 'vấn đề');
  const ptQc = usePhanTrang(dongQc.length, query, 'dòng');
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
  const doiMo = (khoa: string) => setMo((cu) => { const n = new Set(cu); if (n.has(khoa)) n.delete(khoa); else n.add(khoa); return n; });

  const goiY = (d: DongHieuQuaPa) => (d.nenDung ? t('Nên dùng') : d.itDuLieu && d.khoa !== 'chua-phan-loai' ? t('Ít dữ liệu') : null);
  /** Có cải thiện: 1440 vạch tỷ lệ + n / N · %; 375 n + %. */
  const caiThien = (d: DongHieuQuaPa, ten: string) => {
    const v = rateView(d.caiThien, d.soPa);
    if (v.kind !== 'value') return <TyLe n={d.caiThien} N={d.soPa} />;
    return (
      <span className="inline-flex items-center gap-2 tabular-nums">
        <span aria-hidden className="h-1.5 w-16 shrink-0 overflow-hidden rounded-[3px] border max-sm:hidden" style={{ background: 'var(--surface-2)', borderColor: 'var(--line)' }}>
          <i className="block h-full" style={{ width: `${v.percent}%`, background: 'var(--ok)' }} />
        </span>
        <OSo giaTri={d.caiThien} nguon={nguon(d.khoa, 'cai-thien')} tieuDe={`${ten} · có cải thiện`} />
        <span className="text-[color:var(--text-faint)] max-sm:text-xs"><span className="max-sm:hidden">/ {v.N} · </span>{v.percent} %</span>
      </span>
    );
  };
  const oSo = (d: DongHieuQuaPa, ten: string, coGoiY: boolean) => {
    const g = coGoiY ? goiY(d) : null;
    return (
      <>
        <td className="td text-center tabular-nums"><OSo giaTri={d.soPa} nguon={nguon(d.khoa, 'pa')} tieuDe={`${ten} · PA có kết quả`} /></td>
        <td className="td text-center tabular-nums"><OSo giaTri={d.hocVien} nguon={nguon(d.khoa, 'hv')} tieuDe={`${ten} · học viên`} /></td>
        <td className="td max-sm:text-center">{caiThien(d, ten)}</td>
        <td className="td text-center tabular-nums max-sm:hidden">{d.tvTuan !== null ? t('{n} tuần', { n: d.tvTuan }) : <span className="text-[color:var(--text-faint)]">—</span>}</td>
        <td className="td max-sm:hidden">
          {g && <Nhan tone={d.nenDung ? 'ok' : 'muted'} title={d.nenDung ? 'Cải thiện từ 70%, đủ mẫu và cao nhất trong vấn đề này' : `Dưới ${NGUONG_IT_DU_LIEU} PA có kết quả — chưa đủ để so sánh`}>{g}</Nhan>}
        </td>
      </>
    );
  };

  /** Ô đầu: tên + (P9b) "k PA chạy cùng PA khác" + (375) dòng phụ thời gian · Nên dùng. */
  const tenDong = (d: DongHieuQuaPa, ten: ReactNode = d.nhan) => {
    const phu375 = [d.tvTuan !== null ? t('{n} tuần', { n: d.tvTuan }) : null, goiY(d)].filter(Boolean).join(' · ');
    return (
      <span className="block min-w-0">
        <span className="block sm:truncate">{ten}</span>
        {d.dongThoi > 0 && <span className="block text-xs font-normal tabular-nums text-[color:var(--text-faint)]">{d.dongThoi} PA chạy cùng PA khác</span>}
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
        <col className="w-[43%] sm:w-[34%]" /><col className="w-[15%] sm:w-[90px]" /><col className="w-[14%] sm:w-[90px]" />
        <col className="w-[28%] sm:w-[240px]" /><col className="w-0 sm:w-[160px]" /><col className="w-0 sm:w-auto" />
      </colgroup>
      <thead>
        <tr>
          <Th className="sticky-col">{cotDau}</Th>
          <Th align="center">{t('Số PA')}</Th>
          <Th align="center">{t('HV')}</Th>
          <Th className="max-sm:text-center"><span className="max-sm:hidden">{t('Có cải thiện')}</span><span className="sm:hidden">{t('Cải thiện')}</span></Th>
          <Th align="center" className="max-sm:hidden">{t('Thời gian thường mất')}</Th>
          <Th className="max-sm:hidden">{coGoiY ? t('Gợi ý') : ' '}</Th>
        </tr>
      </thead>
    </>
  );
  const BANG = 'w-full table-fixed text-sm sm:min-w-[700px]';

  const khoang = nhanKhoang(props.khoang).chinh;
  const tongPa = data ? data.gvThem.tomTat.paCoKetQua + data.quyChe.tomTat.paCoKetQua : 0;
  const tongCt = data ? data.gvThem.tomTat.caiThien + data.quyChe.tomTat.caiThien : 0;
  const pctCt = rateView(tongCt, tongPa);
  const chuaTinh = (giaTri: number, dong: string, cot: string, chu: string) => (
    <span><b className="mr-1 text-[15px] font-bold tabular-nums text-[color:var(--text)]"><OSo giaTri={giaTri} nguon={nguon(dong, cot)} tieuDe={chu} /></b>{chu}</span>
  );
  const cachDoc = (
    <>
      <p className="m-0">"Có cải thiện" = Tiến bộ rõ + Tiến bộ một phần, trên PA đã kết thúc có kết quả xác định. PA huỷ vì "không cần theo dõi" không tính. Học viên: một em nhiều PA chỉ tính một lần.</p>
      <p className="m-0">Dưới {NGUONG_IT_DU_LIEU} PA ghi "Ít dữ liệu". "Thời gian thường mất" = trung vị từ ngày bắt đầu đến ngày có kết quả của PA có cải thiện, chỉ hiện khi từ {NGUONG_IT_DU_LIEU} PA.</p>
    </>
  );

  return (
    <div className="space-y-3">
      {params.get('gv') && (
        <VaoHangLoc o="giua">
          {data?.loc.gv ? (
            <button type="button" onClick={() => boLoc('gv')} title="Bỏ lọc giáo viên" className="nut-loc nut-loc-dang text-[color:var(--text)]">
              {t('GV: {ten}', { ten: data.loc.gv.ten })} <span aria-hidden>✕</span>
            </button>
          ) : data && (
            <button type="button" onClick={() => boLoc('gv')} className="btn h-9">Không xem được giáo viên này — bỏ lọc</button>
          )}
        </VaoHangLoc>
      )}
      {error ? <Card><ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} /></Card>
        : loading || !data ? <Card><Skeleton rows={8} /></Card>
        : data.scopeEmpty ? <Card><Empty title="Bạn chưa được cấp phạm vi nào" /></Card>
        : (
          <>
            {/* Thẻ chỉ số — cùng số với đầu hai thẻ bảng (tóm tắt máy chủ). "Chưa tính" = ba số "Để số liệu đủ tin" cũ ở chân bảng. */}
            <DaiChiSo ds={[
              { ten: t('PA có kết quả'), ky: t('trong kỳ'), gt: tongPa, mau: t('GV thêm {a} · quy chế {b}', { a: data.gvThem.tomTat.paCoKetQua, b: data.quyChe.tomTat.paCoKetQua }) },
              { ten: t('Có cải thiện'), gt: tongCt, nho: pctCt.kind === 'value' ? `${pctCt.percent} %` : undefined, mau: t('tiến bộ rõ + một phần') },
              {
                ten: t('Chưa tính'), rong2: true,
                gt: (
                  <span className="mt-1 grid w-full gap-1 text-[13px] font-normal leading-normal text-[color:var(--text-dim)] [font-family:inherit]">
                    {chuaTinh(data.chuaGhiKetQua, 'chua-ghi-ket-qua', 'pa', 'PA chờ kết quả')}
                    {chuaTinh(data.caseChuaPhanLoai, 'case-chua-phan-loai', 'case', 'Case chưa chọn nhóm nguyên nhân')}
                    <span title="PA có kết quả nhưng chưa có lần ghi danh nào cho biết em học ở đâu lúc làm PA — không tính vào bảng nào">
                      {chuaTinh(data.chuaRoNguon, 'chua-ro-nguon', 'pa', 'PA chưa rõ nơi học lúc làm PA')}
                    </span>
                  </span>
                ),
              },
            ]} />

            {/* ---------------------------------------------------------------- 1. PA do giáo viên thêm */}
            <Card bodyClass="p-0">
              <DauThe ten={t('PA do GV thêm')} dem={t('{n} PA', { n: data.gvThem.tomTat.paCoKetQua })}
                phu={data.gvThem.tomTat.paCoKetQua ? t('{n} có cải thiện', { n: data.gvThem.tomTat.caiThien }) : undefined}
                cachTinh={(
                  <>
                    {cachDoc}
                    <p className="m-0">Tính theo nơi em học lúc làm PA. "Nên dùng" = từ {NGUONG_IT_DU_LIEU} PA, cải thiện từ 70% và cao nhất trong vấn đề.</p>
                  </>
                )} />
              {data.gvThem.hang.length === 0 && !data.gvThem.gom
                ? <p className="m-0 px-4 py-3 text-sm text-[color:var(--text-dim)]">Chưa có PA do giáo viên thêm có kết quả trong {khoang}. Số có khi PA kết thúc có kết quả — thử khoảng thời gian dài hơn.</p>
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
                              <HangNhom mo={mo.has('gom')} onMo={() => doiMo('gom')} nhan="vấn đề khác" soCotDau={6} className={HANG_LON}
                                tieuDe={(
                                  <span className="block min-w-0">
                                    <span className="block truncate">{t('{n} vấn đề khác', { n: data.gvThem.gom.soVanDe })}</span>
                                    <span className="block text-xs font-normal text-[color:var(--text-faint)]">{t('mỗi vấn đề ≤ 2 PA có kết quả')}</span>
                                  </span>
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
            </Card>

            {/* ---------------------------------------------------------------- 2. PA theo quy chế */}
            <Card bodyClass="p-0">
              <DauThe ten={t('PA theo quy chế')} dem={t('{n} PA', { n: data.quyChe.tomTat.paCoKetQua })} phu={t('bắt buộc · không so, không xếp hạng')}
                cachTinh={(
                  <>
                    {cachDoc}
                    {props.ct === 'ft' && <p className="m-0">Xếp theo mức SOS hiện tại của Case: Case trượt lại thì PA cũ hiện ở hàng mức mới.</p>}
                  </>
                )} />
              {dongQc.length === 0
                ? <p className="m-0 px-4 py-3 text-sm text-[color:var(--text-dim)]">Chưa có PA theo quy chế có kết quả trong {khoang}. Số có khi PA kết thúc có kết quả — thử khoảng thời gian dài hơn.</p>
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
            </Card>
          </>
        )}
    </div>
  );
}
