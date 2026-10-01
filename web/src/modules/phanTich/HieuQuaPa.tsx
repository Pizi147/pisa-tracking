import { Fragment, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { Card, Empty, ErrorState, Skeleton, Th } from '../../ui/ui.tsx';
import { HangCon, HangNhom } from '../../ui/HangNhom.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { TyLe } from '../../ui/TyLe.tsx';
import { DINH_TRAI, DongTomTat, SoO as SoLieuO, thamSoLoc, type PhamViPhanTich } from './dungChung.tsx';
import {
  CHUONG_TRINH_LABEL, KHOANG_LABEL, NGUONG_IT_DU_LIEU, mondayOfDate, tuanLich, type DongHieuQuaPa, type HieuQuaPaKetQua,
} from '@shared/domain/index.ts';

/**
 * HIỆU QUẢ PA (PR-UX4, mockup 16 §4; PR-Pb2-a T61, K1-23, P9, P9b, P12) — hai khối:
 *   1. PA do giáo viên thêm: vấn đề (nhóm nguyên nhân chính) → loại PA; "Nên dùng" chỉ ở loại PA đủ mẫu, cải thiện ≥ 70% và cao nhất trong vấn đề.
 *   2. PA theo quy chế: FT theo SOS 1 · 2 · 3, lớp thường theo Bổ trợ Giữa khoá / sau Cuối khoá — thứ tự cố định, không so, không xếp hạng.
 * Lọc `gv` (người phụ trách Case) và khoảng `tu`/`den` đến từ URL (Hợp đồng a↔b: link từ hồ sơ GV / bảng giáo viên); tên GV lấy từ máy chủ.
 */
export function HieuQuaPa(props: PhamViPhanTich) {
  const [params, setParams] = useSearchParams();
  const { homNay } = useNgayNghiepVu();
  const them: Record<string, string> = {};
  for (const k of ['gv', 'tu', 'den'] as const) { const v = params.get(k); if (v) them[k] = v; }
  const query = thamSoLoc(props, them);
  const { data, loading, error, reload } = useApi<HieuQuaPaKetQua>(`/phan-tich/hieu-qua-pa?${query}`, [query]);
  const branches = useApi<any[]>('/ref/branches');
  const nguon = (dong: string, cot: string) => `/phan-tich/hieu-qua-pa/o?${query}&dong=${encodeURIComponent(dong)}&cot=${encodeURIComponent(cot)}`;
  const boLoc = (...khoa: string[]) => {
    const next = new URLSearchParams(params);
    for (const k of khoa) next.delete(k);
    setParams(next, { replace: false });
  };

  /* Mở sẵn hàng lớn đủ dữ liệu (≥ 5 PA); nhóm "vấn đề khác" luôn đóng. */
  const [mo, setMo] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!data) return;
    setMo(new Set([...data.gvThem.hang, ...data.quyChe.hang].filter((h) => !h.itDuLieu).map((h) => h.khoa)));
  }, [data]);
  const doiMo = (khoa: string) => setMo((cu) => { const n = new Set(cu); if (n.has(khoa)) n.delete(khoa); else n.add(khoa); return n; });

  const oSo = (d: DongHieuQuaPa, coNenDung: boolean) => (
    <>
      <td className="text-right tabular-nums"><SoLieuO giaTri={d.soPa} nguon={nguon(d.khoa, 'pa')} tieuDe={`${d.nhan} · PA có kết quả`} /></td>
      <td className="text-right tabular-nums"><SoLieuO giaTri={d.hocVien} nguon={nguon(d.khoa, 'hv')} tieuDe={`${d.nhan} · học viên`} /></td>
      <td className="pl-5 text-[12px]">
        <TyLe n={d.caiThien} N={d.soPa}
          soN={<SoLieuO giaTri={d.caiThien} nguon={nguon(d.khoa, 'cai-thien')} tieuDe={`${d.nhan} · có cải thiện`} />} />
      </td>
      <td className="pr-4 text-right tabular-nums text-[12px]">{d.tvTuan !== null ? `${d.tvTuan} tuần` : <span className="text-faint">—</span>}</td>
      {coNenDung && (
        <td>
          {d.nenDung ? <Nhan tone="ok" title="Cải thiện từ 70%, đủ mẫu và cao nhất trong vấn đề này">Nên dùng</Nhan>
            : d.itDuLieu && d.khoa !== 'chua-phan-loai' ? <Nhan tone="muted" title={`Dưới ${NGUONG_IT_DU_LIEU} PA có kết quả — chưa đủ để so sánh`}>Ít dữ liệu</Nhan> : null}
        </td>
      )}
    </>
  );

  /** Ô đầu: tên + (P9b) chữ nhỏ "k PA chạy cùng PA khác". */
  const tenDong = (d: DongHieuQuaPa) => (
    <span className="block min-w-0">
      <span className="block truncate">{d.nhan}</span>
      {d.dongThoi > 0 && <span className="block text-[11px] text-slate-500 tabular-nums">{d.dongThoi} PA chạy cùng PA khác</span>}
    </span>
  );
  const hangLon = (d: DongHieuQuaPa, coNenDung: boolean) => (
    <Fragment key={d.khoa}>
      {d.con?.length ? (
        <HangNhom mo={mo.has(d.khoa)} onMo={() => doiMo(d.khoa)} nhan={d.nhan} tieuDe={tenDong(d)} className={DINH_TRAI}>{oSo(d, coNenDung)}</HangNhom>
      ) : (
        /* PR-S6F-a Q20: hàng "Case chưa chọn nhóm nguyên nhân" mờ — PA có thật nhưng chưa biết thuộc vấn đề nào. */
        <tr className={`hang-lon ${DINH_TRAI}${d.khoa === 'chua-phan-loai' ? ' text-slate-400' : ''}`}><td className="px-3">{tenDong(d)}</td>{oSo(d, coNenDung)}</tr>
      )}
      {mo.has(d.khoa) && d.con?.map((c) => (
        <HangCon key={c.khoa} className={DINH_TRAI}><td>{tenDong(c)}</td>{oSo(c, coNenDung)}</HangCon>
      ))}
    </Fragment>
  );

  const dauBang = (cotDau: string, coNenDung: boolean) => (
    <>
      <colgroup>
        <col style={{ width: coNenDung ? '32%' : '38%' }} /><col style={{ width: 72 }} /><col style={{ width: 84 }} />
        <col style={{ width: 170 }} /><col style={{ width: 120 }} />{coNenDung && <col style={{ width: 96 }} />}
      </colgroup>
      <thead>
        <tr>
          <Th className="sticky-col">{cotDau}</Th>
          <Th align="right" hint="PA đã kết thúc có kết quả xác định">Số PA</Th>
          <Th align="right" hint="Học viên khác nhau của các PA trong dòng — một em nhiều PA chỉ tính một lần">Học viên</Th>
          <Th className="pl-5" hint="Tiến bộ rõ + Tiến bộ một phần, trên số PA của dòng">Có cải thiện</Th>
          <Th align="right" className="pr-4" hint={`Trung vị số tuần từ ngày bắt đầu đến ngày ghi kết quả, chỉ PA có cải thiện; hiện khi từ ${NGUONG_IT_DU_LIEU} PA`}>Thời gian thường mất</Th>
          {coNenDung && <Th>{' '}</Th>}
        </tr>
      </thead>
    </>
  );

  /* Dòng ngữ cảnh (P9): {khung} · {chi nhánh} · {khoảng}. Khoảng theo URL `tu`/`den` hiện bằng mã tuần. */
  const tenChiNhanh = props.branchId ? branches.data?.find((b) => b.id === props.branchId)?.name ?? '' : 'Tất cả chi nhánh';
  const khoang = data?.loc.theoKhoang
    ? `${tuanLich(data.loc.tu, homNay)} – ${tuanLich(data.loc.den ?? mondayOfDate(homNay), homNay)}`
    : KHOANG_LABEL[props.tg];

  return (
    <Card bodyClass="p-0">
      {error ? <div className="p-4"><ErrorState message={error.message} hint={error.hint} onRetry={reload} /></div>
        : loading || !data ? <div className="p-4"><Skeleton rows={8} /></div>
        : data.scopeEmpty ? <div className="p-4"><Empty title="Bạn chưa được cấp phạm vi nào" /></div>
        : (
          <>
            <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2 text-xs text-slate-400" style={{ borderColor: 'var(--line)' }}>
              <span>{[props.ct ? CHUONG_TRINH_LABEL[props.ct] : null, tenChiNhanh, khoang].filter(Boolean).join(' · ')}</span>
              {data.loc.gv && (
                <button type="button" onClick={() => boLoc('gv')} title="Bỏ lọc giáo viên"
                  className="inline-flex min-h-[44px] sm:min-h-[28px] items-center gap-1 rounded-full border px-2.5 text-xs text-slate-200"
                  style={{ borderColor: 'var(--accent-line)', background: 'var(--accent-soft)' }}>
                  Giáo viên: {data.loc.gv.ten} <span aria-hidden>✕</span>
                </button>
              )}
              {params.get('gv') && !data.loc.gv && (
                <button type="button" onClick={() => boLoc('gv')} className="btn btn-sm">Không xem được giáo viên này — bỏ lọc</button>
              )}
              {data.loc.theoKhoang && (
                <button type="button" onClick={() => boLoc('tu', 'den')} title="Bỏ lọc khoảng tuần"
                  className="inline-flex min-h-[44px] sm:min-h-[28px] items-center gap-1 rounded-full border px-2.5 text-xs text-slate-200 tabular-nums"
                  style={{ borderColor: 'var(--accent-line)', background: 'var(--accent-soft)' }}>
                  {khoang} <span aria-hidden>✕</span>
                </button>
              )}
            </div>

            {/* ---------------------------------------------------------------- 1. PA do giáo viên thêm */}
            <DongTomTat
              chinh={`PA do giáo viên thêm · ${data.gvThem.tomTat.paCoKetQua} PA có kết quả`}
              phu={data.gvThem.tomTat.paCoKetQua ? `${data.gvThem.tomTat.caiThien} có cải thiện · ${data.gvThem.tomTat.vanDeDuDuLieu} vấn đề đủ dữ liệu` : undefined}
              luat={(
                <NutLuat label="Cách đọc">
                  <p className="m-0">"Có cải thiện" = Tiến bộ rõ + Tiến bộ một phần, trên PA đã kết thúc có kết quả xác định. PA huỷ vì "không cần theo dõi" không tính.</p>
                  <p className="m-0">Dưới {NGUONG_IT_DU_LIEU} PA ghi "Ít dữ liệu". "Thời gian thường mất" = trung vị từ ngày bắt đầu đến ngày ghi kết quả của PA có cải thiện, chỉ hiện khi từ {NGUONG_IT_DU_LIEU} PA.</p>
                  <p className="m-0">Tính theo nơi em học lúc làm PA. "Nên dùng" = từ {NGUONG_IT_DU_LIEU} PA, cải thiện từ 70% và cao nhất trong vấn đề.</p>
                </NutLuat>
              )} />
            {data.gvThem.hang.length === 0 && !data.gvThem.gom
              ? <p className="m-0 px-4 pb-3 text-sm text-slate-400">Chưa có PA do giáo viên thêm có kết quả trong {khoang}.</p>
              : (
                <div className="table-scroll">
                  <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: 700 }}>
                    {dauBang('Vấn đề / loại PA', true)}
                    <tbody>
                      {data.gvThem.hang.map((d) => hangLon(d, true))}
                      {data.gvThem.gom && (
                        <Fragment>
                          <HangNhom mo={mo.has('gom')} onMo={() => doiMo('gom')} nhan="vấn đề khác"
                            tieuDe={<span className="block truncate text-slate-300">{data.gvThem.gom.soVanDe} vấn đề khác, mỗi vấn đề ≤ 2 PA có kết quả</span>}
                            soCotDau={6} className={DINH_TRAI} />
                          {mo.has('gom') && data.gvThem.gom.hang.map((d) => (
                            <HangCon key={d.khoa} className={DINH_TRAI}><td>{tenDong(d)}</td>{oSo(d, true)}</HangCon>
                          ))}
                        </Fragment>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

            {/* ---------------------------------------------------------------- 2. PA theo quy chế */}
            <div className="border-t" style={{ borderColor: 'var(--line)' }}>
              <DongTomTat
                chinh={`PA theo quy chế · ${data.quyChe.tomTat.paCoKetQua} PA có kết quả`}
                phu={`${data.quyChe.tomTat.paCoKetQua ? `${data.quyChe.tomTat.caiThien} có cải thiện · ` : ''}PA bắt buộc theo quy chế — không so, không xếp hạng`}
                luat={props.ct === 'ft' ? (
                  <NutLuat label="Cách đọc">
                    <p className="m-0">Xếp theo mức SOS hiện tại của Case: Case trượt lại thì PA cũ hiện ở hàng mức mới.</p>
                  </NutLuat>
                ) : undefined} />
              {data.quyChe.hang.length === 0
                ? <p className="m-0 px-4 pb-3 text-sm text-slate-400">Chưa có PA theo quy chế có kết quả trong {khoang}.</p>
                : (
                  <div className="table-scroll">
                    <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: 620 }}>
                      {dauBang(props.ct === 'thuong' ? 'Loại bổ trợ' : 'Mức SOS / loại PA', false)}
                      <tbody>{data.quyChe.hang.map((d) => hangLon(d, false))}</tbody>
                    </table>
                  </div>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t px-4 py-2.5 text-xs text-slate-400" style={{ borderColor: 'var(--line)' }}>
              <span>Để số liệu đủ tin:</span>
              <span><b className="font-semibold text-slate-100"><SoLieuO giaTri={data.chuaGhiKetQua} nguon={nguon('chua-ghi-ket-qua', 'pa')} tieuDe="PA chờ ghi kết quả" /></b> PA đã xong chưa ghi kết quả</span>
              <span><b className="font-semibold text-slate-100"><SoLieuO giaTri={data.caseChuaPhanLoai} nguon={nguon('case-chua-phan-loai', 'case')} tieuDe="Case chưa chọn nhóm nguyên nhân" /></b> Case chưa chọn nhóm nguyên nhân</span>
              <span title="PA có kết quả nhưng chưa có lần ghi danh nào cho biết em học ở đâu lúc làm PA — không tính vào bảng nào">
                <b className="font-semibold text-slate-100"><SoLieuO giaTri={data.chuaRoNguon} nguon={nguon('chua-ro-nguon', 'pa')} tieuDe="PA chưa rõ nơi học lúc làm PA" /></b> PA chưa rõ nơi học lúc làm PA
              </span>
            </div>
          </>
        )}
    </Card>
  );
}
