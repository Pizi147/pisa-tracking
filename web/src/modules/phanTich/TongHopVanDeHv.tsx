import { Fragment, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Card, Empty, ErrorState, Skeleton, Th } from '../../ui/ui.tsx';
import { HangCon, HangNhom } from '../../ui/HangNhom.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { DINH_TRAI, DongTomTat, MAU_SO_VOI_TRUOC, NutMoDanhSach, SoO as SoLieuO, thamSoLoc, type PhamViPhanTich } from './dungChung.tsx';
import { KHOANG_LABEL, nhanSoVoiTruoc, type DongVanDeHv, type VanDeHvKetQua } from '@shared/domain/index.ts';

/**
 * TỔNG HỢP VẤN ĐỀ HV (PR-UX4, mockup 16 §3/§3b) — đếm HỌC VIÊN theo LOẠI LỖI của Case (lỗi chính + phụ), hàng lớn kỹ năng → hàng con loại
 * lỗi; công tắc "Gộp theo loại lỗi chung" đổi hàng lớn thành loại lỗi chung (Ngữ pháp, Từ vựng…), hàng con thành "Kỹ năng · loại lỗi".
 * Mọi số mở đúng danh sách bằng `/phan-tich/van-de-hv/o` (cùng hàm sinh ra số — G-10); không có nút giao việc (G-12).
 */
export function TongHopVanDeHv(props: PhamViPhanTich) {
  const [params, setParams] = useSearchParams();
  const chiChinh = params.get('loi') === 'chinh';
  const gop = params.get('gop') === '1';
  const datTham = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: false });
  };

  const rieng: Record<string, string> = {};
  if (chiChinh) rieng.loi = 'chinh';
  if (gop) rieng.gop = '1';
  const query = thamSoLoc(props, rieng);
  const { data, loading, error, reload } = useApi<VanDeHvKetQua>(`/phan-tich/van-de-hv?${query}`, [query]);
  const nguon = (dong: string, cot: string) => `/phan-tich/van-de-hv/o?${query}&dong=${encodeURIComponent(dong)}&cot=${encodeURIComponent(cot)}`;

  /* Mở sẵn 3 hàng lớn có nhiều HV nhất (Q8); nhóm "chỉ một kỹ năng" luôn đóng. */
  const [mo, setMo] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!data) return;
    const top = data.hang.filter((h) => h.loai !== 'gom').sort((a, b) => b.soHv - a.soHv).slice(0, 3).map((h) => h.khoa);
    setMo(new Set(top));
  }, [data]);
  const doiMo = (khoa: string) => setMo((cu) => { const n = new Set(cu); if (n.has(khoa)) n.delete(khoa); else n.add(khoa); return n; });

  const cotDau = gop ? 'Loại lỗi chung / kỹ năng' : 'Kỹ năng / loại lỗi';
  const cotCuoi = gop ? 'Kỹ năng nhiều nhất' : 'Lỗi phổ biến';

  const soVoiTruoc = (d: DongVanDeHv) => {
    const v = nhanSoVoiTruoc(d.soVoiTruoc);
    return <span className={`font-semibold tabular-nums ${MAU_SO_VOI_TRUOC[v.tone]}`}>{v.chu}</span>;
  };
  const chipLop = (d: DongVanDeHv) => (
    <span className="flex flex-wrap gap-1">
      {d.top3.map((c) => (
        <span key={c.classId} className="inline-flex items-center gap-1 rounded-md border px-1.5 text-[11px] font-normal leading-5" style={{ borderColor: 'var(--line)' }}>
          {c.ma} · <b className="font-semibold"><SoLieuO giaTri={c.n} nguon={nguon(d.khoa, `lop:${c.classId}`)} tieuDe={`${d.nhan} · ${c.ma}`} /></b>
        </span>
      ))}
    </span>
  );
  const oSo = (d: DongVanDeHv) => (
    <>
      <td className="text-right tabular-nums"><SoLieuO giaTri={d.soHv} nguon={nguon(d.khoa, 'hv')} tieuDe={`${d.nhan} · học viên`} /></td>
      <td className="text-right tabular-nums"><SoLieuO giaTri={d.soLop} nguon={nguon(d.khoa, 'lop')} tieuDe={`${d.nhan} · lớp`} /></td>
      <td>{chipLop(d)}</td>
      <td className="pr-5 text-right">{soVoiTruoc(d)}</td>
      <td className="text-xs font-semibold text-slate-200">
        {d.phu ?? ''}
        {d.goiY && <span className="ml-1 cursor-help text-slate-500" title={d.goiY}>ⓘ</span>}
      </td>
    </>
  );

  const nhanHangLon = (d: DongVanDeHv) => (
    <span className="block min-w-0 truncate">
      {d.nhan}
      {d.loai === 'ky-nang' && d.khoa === 'kn:writing' && (
        <abbr title="Writing Task 1 + Writing Task 2" className="ml-1.5 text-[10.5px] font-normal text-slate-400 no-underline">W1 + W2</abbr>
      )}
      {d.loai === 'chung' && d.goiY && <span className="ml-1 cursor-help font-normal text-slate-500" title={d.goiY}>ⓘ</span>}
    </span>
  );

  const action = (
    <div className="flex flex-wrap items-center gap-2 p-3 pb-0">
      <div role="radiogroup" aria-label="Lỗi chính hay cả lỗi phụ" className="inline-flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--line)' }}>
        {([['', 'Lỗi chính + phụ', 'Vấn đề chính và yếu tố đi kèm của Case'], ['chinh', 'Chỉ lỗi chính', 'Chỉ Vấn đề chính của Case']] as const).map(([v, nhan, tip]) => (
          <button key={v} type="button" role="radio" aria-checked={chiChinh === (v === 'chinh')} title={tip}
            onClick={() => datTham('loi', v || null)}
            className={`px-3 py-1 text-xs border-0 cursor-pointer ${chiChinh === (v === 'chinh') ? 'bg-sky-500/20 text-sky-200 font-semibold' : 'bg-transparent text-slate-400 hover:text-slate-200'}`}>
            {nhan}
          </button>
        ))}
      </div>
      <span className="flex-1" />
      <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-300">
        <input type="checkbox" role="switch" checked={gop} onChange={(e) => datTham('gop', e.target.checked ? '1' : null)} />
        Gộp theo loại lỗi chung
      </label>
    </div>
  );

  return (
    <Card bodyClass="p-0" action={action}>
      {error ? <div className="p-4"><ErrorState message={error.message} hint={error.hint} onRetry={reload} /></div>
        : loading || !data ? <div className="p-4"><Skeleton rows={8} /></div>
        : data.scopeEmpty ? <div className="p-4"><Empty title="Bạn chưa được cấp phạm vi nào" /></div>
        : data.hang.length === 0 && data.chuaPhanLoai.case === 0
          ? <div className="p-4"><Empty title={`Chưa có Case nào đã phân loại lỗi trong ${KHOANG_LABEL[props.tg]}`} /></div>
        : (
          <>
            <DongTomTat
              chinh={`${data.tomTat.hv} học viên có Case đã phân loại lỗi`}
              phu={`${data.tomTat.case} Case · ${data.tomTat.lop} lớp`}
              luat={(
                <NutLuat label="Cách đếm">
                  <p className="m-0">Đếm học viên có Case mang loại lỗi đó, cả lỗi chính lẫn lỗi phụ; một em chỉ tính một lần trong một dòng.</p>
                  <p className="m-0">Writing gộp W1 và W2 vì cùng bộ loại lỗi. Không có ngưỡng "nóng" — chỉ xếp số lớn lên trước.</p>
                  <p className="m-0">Case đang mở và Case đóng trong {KHOANG_LABEL[props.tg]} gần đây. Một em có lỗi ở hai kỹ năng được đếm ở cả hai hàng kỹ năng, nhưng chỉ một lần trong con số tổng.</p>
                </NutLuat>
              )} />
            <div className="table-scroll">
              <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: 830 }}>
                <colgroup>
                  <col style={{ width: '30%' }} /><col style={{ width: 72 }} /><col style={{ width: 72 }} />
                  <col /><col style={{ width: 160 }} /><col style={{ width: 170 }} />
                </colgroup>
                <thead>
                  <tr>
                    <Th className="sticky-col">{cotDau}</Th>
                    <Th align="right" hint="Học viên không trùng">Số HV</Th>
                    <Th align="right">Số lớp</Th>
                    <Th hint="Ba lớp có nhiều HV mắc lỗi này nhất">3 lớp nhiều nhất</Th>
                    <Th align="right" className="pr-5" hint="Số HV có lỗi này trong Case từ lần Test gần nhất của mỗi lớp, so với lần Test ngay trước của chính lớp đó, rồi cộng lại. ↑ = nhiều em hơn">
                      So với lần Test trước ⓘ
                    </Th>
                    <Th hint={gop ? 'Kỹ năng có nhiều HV mắc lỗi này nhất' : 'Loại lỗi nhiều HV nhất trong kỹ năng'}>{cotCuoi}</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.hang.map((h) => (
                    <Fragment key={h.khoa}>
                      <HangNhom mo={mo.has(h.khoa)} onMo={() => doiMo(h.khoa)} nhan={h.nhan} tieuDe={nhanHangLon(h)} className={DINH_TRAI}>
                        {oSo(h)}
                      </HangNhom>
                      {mo.has(h.khoa) && h.con?.map((c) => (
                        <HangCon key={c.khoa} className={DINH_TRAI} title={c.goiY}>
                          <td><span className="block truncate">{c.nhan}</span></td>
                          {oSo({ ...c, phu: null, goiY: undefined })}
                        </HangCon>
                      ))}
                    </Fragment>
                  ))}
                  {data.chuaPhanLoai.case > 0 && (
                    <tr className="bg-soon-bg text-soon font-bold" style={{ boxShadow: 'inset 3px 0 0 rgb(var(--soon-rgb))' }}>
                      <td className="px-3 py-2 sticky-col" style={{ background: 'rgb(var(--soon-bg-rgb))' }}
                        title="Case chưa chọn loại lỗi — không vào được bảng này và Hiệu quả PA">
                        Chưa phân loại: <SoLieuO giaTri={data.chuaPhanLoai.case} nguon={nguon('chua-phan-loai', 'case')} tieuDe="Chưa phân loại · Case" /> Case
                      </td>
                      <td className="text-right tabular-nums"><SoLieuO giaTri={data.chuaPhanLoai.hv} nguon={nguon('chua-phan-loai', 'hv')} tieuDe="Chưa phân loại · học viên" /></td>
                      <td className="text-right tabular-nums"><SoLieuO giaTri={data.chuaPhanLoai.lop} nguon={nguon('chua-phan-loai', 'lop')} tieuDe="Chưa phân loại · lớp" /></td>
                      <td colSpan={3} className="pl-6 text-xs font-normal">
                        <NutMoDanhSach nguon={nguon('chua-phan-loai', 'case')} tieuDe="Chưa phân loại · Case">
                          Mở danh sách Case cần GV phân loại →
                        </NutMoDanhSach>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
    </Card>
  );
}
