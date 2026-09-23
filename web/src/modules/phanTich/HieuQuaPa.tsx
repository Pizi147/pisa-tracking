import { Fragment, useEffect, useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { Card, Empty, ErrorState, Skeleton, Th } from '../../ui/ui.tsx';
import { HangCon, HangNhom } from '../../ui/HangNhom.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { SoLieuO } from '../../ui/SoLieuO.tsx';
import { DINH_TRAI, DongTomTat, thamSoLoc, type PhamViPhanTich } from './dungChung.tsx';
import { KHOANG_LABEL, NGUONG_IT_DU_LIEU, type DongHieuQuaPa, type HieuQuaPaKetQua } from '@shared/domain/index.ts';

/**
 * HIỆU QUẢ PA (PR-UX4, mockup 16 §4) — với từng VẤN ĐỀ (loại lỗi chính của Case), loại PA nào giúp em cải thiện. Không có cột "Không cải
 * thiện"; dưới 5 PA ghi "Ít dữ liệu" và không vẽ thanh; "Nên dùng" chỉ ở loại PA đủ mẫu, cải thiện ≥ 70% và cao nhất trong vấn đề.
 * Không có nút "Nhắc GV" (không có đường nhắc hàng loạt — G-12).
 */
export function HieuQuaPa(props: PhamViPhanTich) {
  const query = thamSoLoc(props);
  const { data, loading, error, reload } = useApi<HieuQuaPaKetQua>(`/phan-tich/hieu-qua-pa?${query}`, [query]);
  const nguon = (dong: string, cot: string) => `/phan-tich/hieu-qua-pa/o?${query}&dong=${encodeURIComponent(dong)}&cot=${encodeURIComponent(cot)}`;

  /* Mở sẵn hàng lớn đủ dữ liệu (≥ 5 PA); nhóm "vấn đề khác" luôn đóng. */
  const [mo, setMo] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!data) return;
    setMo(new Set(data.hang.filter((h) => !h.itDuLieu).map((h) => h.khoa)));
  }, [data]);
  const doiMo = (khoa: string) => setMo((cu) => { const n = new Set(cu); if (n.has(khoa)) n.delete(khoa); else n.add(khoa); return n; });

  const oSo = (d: DongHieuQuaPa) => {
    const tyLe = d.soPa > 0 ? Math.round((d.caiThien / d.soPa) * 100) : 0;
    return (
      <>
        <td className="text-right tabular-nums"><SoLieuO giaTri={d.soPa} nguon={nguon(d.khoa, 'pa')} tieuDe={`${d.nhan} · PA có kết quả`} /></td>
        <td>
          <span className="inline-flex items-center gap-2 tabular-nums">
            {!d.itDuLieu && (
              <span className="inline-block h-1.5 w-[60px] overflow-hidden rounded-full align-middle" style={{ background: 'rgb(var(--muted-bg-rgb))' }}
                title={`${tyLe}% có cải thiện`}>
                <i className="block h-full rounded-full bg-ok" style={{ width: `${tyLe}%` }} />
              </span>
            )}
            <span><SoLieuO giaTri={d.caiThien} nguon={nguon(d.khoa, 'cai-thien')} tieuDe={`${d.nhan} · có cải thiện`} /><span className="text-slate-400">/{d.soPa}</span></span>
          </span>
        </td>
        <td className="text-right tabular-nums">{d.tbTuan !== null ? `${d.tbTuan} tuần` : <span className="text-faint">—</span>}</td>
        <td>
          {d.nenDung ? <Nhan tone="ok" title="Cải thiện từ 70%, đủ mẫu và cao nhất trong vấn đề này">Nên dùng</Nhan>
            : d.itDuLieu ? <Nhan tone="muted" title={`Dưới ${NGUONG_IT_DU_LIEU} PA có kết quả — chưa đủ để so sánh`}>Ít dữ liệu</Nhan> : null}
        </td>
      </>
    );
  };

  const nhieuHon = (d: DongHieuQuaPa) => <span className="block min-w-0 truncate">{d.nhan}</span>;
  const hangLon = (d: DongHieuQuaPa) => (
    <Fragment key={d.khoa}>
      <HangNhom mo={mo.has(d.khoa)} onMo={() => doiMo(d.khoa)} nhan={d.nhan} tieuDe={nhieuHon(d)} className={DINH_TRAI}>{oSo(d)}</HangNhom>
      {mo.has(d.khoa) && d.con?.map((c) => (
        <HangCon key={c.khoa} className={DINH_TRAI}><td>{nhieuHon(c)}</td>{oSo(c)}</HangCon>
      ))}
    </Fragment>
  );

  return (
    <Card bodyClass="p-0">
      {error ? <div className="p-4"><ErrorState message={error.message} hint={error.hint} onRetry={reload} /></div>
        : loading || !data ? <div className="p-4"><Skeleton rows={8} /></div>
        : data.scopeEmpty ? <div className="p-4"><Empty title="Bạn chưa được cấp phạm vi nào" /></div>
        : data.hang.length === 0 && !data.gom
          ? <div className="p-4"><Empty title={`Chưa có PA nào có kết quả trong ${KHOANG_LABEL[props.tg]}`} /></div>
        : (
          <>
            <DongTomTat
              chinh={`${data.tomTat.paCoKetQua} PA có kết quả`}
              phu={`${data.tomTat.caiThien} có cải thiện · ${data.tomTat.vanDeDuDuLieu} vấn đề đủ dữ liệu`}
              luat={(
                <NutLuat label="Cách đọc">
                  <p className="m-0">"Có cải thiện" = Tiến bộ rõ + Tiến bộ một phần, trên PA đã kết thúc có kết quả xác định.</p>
                  <p className="m-0">Dưới {NGUONG_IT_DU_LIEU} PA ghi "Ít dữ liệu" và không vẽ thanh. "Thời gian trung bình" = từ ngày bắt đầu đến ngày ghi kết quả của PA có cải thiện, chỉ hiện khi từ {NGUONG_IT_DU_LIEU} PA.</p>
                  <p className="m-0">Tính theo nơi em học lúc làm PA. "Nên dùng" = từ {NGUONG_IT_DU_LIEU} PA, cải thiện từ 70% và cao nhất trong vấn đề.</p>
                </NutLuat>
              )} />
            <div className="table-scroll">
              <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: 640 }}>
                <colgroup><col style={{ width: '36%' }} /><col style={{ width: 80 }} /><col style={{ width: 190 }} /><col style={{ width: 130 }} /><col style={{ width: 100 }} /></colgroup>
                <thead>
                  <tr>
                    <Th className="sticky-col">Vấn đề / loại PA</Th>
                    <Th align="right" hint="PA đã kết thúc có kết quả xác định">Số PA</Th>
                    <Th>Có cải thiện</Th>
                    <Th align="right" hint="Từ ngày bắt đầu đến ngày ghi kết quả, chỉ tính PA có cải thiện">Thời gian trung bình</Th>
                    <Th>{' '}</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.hang.map(hangLon)}
                  {data.gom && (
                    <Fragment>
                      <HangNhom mo={mo.has('gom')} onMo={() => doiMo('gom')} nhan="vấn đề khác"
                        tieuDe={<span className="block truncate text-slate-300">{data.gom.soVanDe} vấn đề khác, mỗi vấn đề ≤ 2 PA có kết quả</span>}
                        soCotDau={5} className={DINH_TRAI} />
                      {mo.has('gom') && data.gom.hang.map((d) => (
                        <HangCon key={d.khoa} className={DINH_TRAI}><td>{nhieuHon(d)}</td>{oSo(d)}</HangCon>
                      ))}
                    </Fragment>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t px-4 py-2.5 text-xs text-slate-400" style={{ borderColor: 'var(--line)' }}>
              <span>Để số liệu đủ tin:</span>
              <span><b className="font-semibold text-slate-100"><SoLieuO giaTri={data.chuaGhiKetQua} nguon={nguon('chua-ghi-ket-qua', 'pa')} tieuDe="PA đã xong, chưa ghi kết quả" /></b> PA đã xong chưa ghi kết quả</span>
              <span><b className="font-semibold text-slate-100"><SoLieuO giaTri={data.caseChuaPhanLoai} nguon={nguon('case-chua-phan-loai', 'case')} tieuDe="Case chưa phân loại lỗi" /></b> Case chưa phân loại lỗi</span>
            </div>
          </>
        )}
    </Card>
  );
}
