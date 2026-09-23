import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Card, Empty, ErrorState, Skeleton, Th } from '../../ui/ui.tsx';
import { LOAI_BO_QUEN_LABEL, duongHoSoHocVien, thamSoCt, type ChuongTrinh, type LoaiBoQuen } from '@shared/domain/index.ts';

/**
 * BỘ LỌC "HỌC VIÊN CẦN CHÚ Ý" Ở DANH SÁCH CASE (PR-UX4, Q19) — hai việc "bỏ quên" của "Chưa ai nhận" cũ: HV cần hỗ trợ 2 lần Test liền mà
 * chưa có Case mở, và HV bị Bỏ qua tín hiệu mà lần Test sau vẫn chưa đạt. Cùng tập với hai dòng Cần xử lý ở Tổng quan QL (một hàm
 * `boQuen` ở máy chủ — G-10): số ở tiêu đề = số dòng bảng.
 */
type Dong = { studentId: number; ten: string; lop: string | null; kyNang: string; chiTiet: string; tu: string };
type Data = { n: number; rows: Dong[] };

const TEN_KY_NANG: Record<string, string> = { L: 'Listening', R: 'Reading', W: 'Writing', S: 'Speaking' };

export function DanhSachBoQuen({ loai, branchId, ct, onBoLoc }: { loai: LoaiBoQuen; branchId: number | null; ct: ChuongTrinh; onBoLoc: () => void }) {
  const q = new URLSearchParams({ loai });
  if (branchId) q.set('branchId', String(branchId));
  const url = `/phan-tich/bo-quen?${q.toString()}${thamSoCt(ct)}`;
  const { data, loading, error, reload } = useApi<Data>(url, [url]);
  const nhan = LOAI_BO_QUEN_LABEL[loai];
  return (
    <Card bodyClass="p-0"
      title={<span>{nhan} {data && <span className="font-normal text-slate-500">({data.n})</span>}</span>}
      action={(
        <button type="button" onClick={onBoLoc} title="Bỏ lọc, về Danh sách Case"
          className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs text-slate-300 cursor-pointer bg-transparent hover:text-white" style={{ borderColor: 'var(--line)' }}>
          Đang lọc: {nhan} <span aria-hidden>✕</span>
        </button>
      )}>
      {error ? <div className="p-4"><ErrorState message={error.message} hint={error.hint} onRetry={reload} /></div>
        : loading || !data ? <div className="p-4"><Skeleton rows={5} /></div>
        : data.rows.length === 0 ? <div className="p-4"><Empty title="Không có học viên nào" /></div>
        : (
          <div className="table-scroll">
            <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: 640 }}>
              <colgroup><col style={{ width: '24%' }} /><col style={{ width: 110 }} /><col style={{ width: 80 }} /><col /><col style={{ width: 84 }} /></colgroup>
              <thead>
                <tr>
                  <Th className="sticky-col">Học viên</Th><Th>Lớp</Th><Th hint="L = Listening · R = Reading · W = Writing · S = Speaking">Kỹ năng</Th>
                  <Th>Chi tiết</Th><Th hint="Tuần của lần Test mới nhất tính vào việc này">Từ</Th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.studentId} className="row-hover">
                    <td className="td sticky-col"><Link to={duongHoSoHocVien(r.studentId)} className="link font-semibold">{r.ten}</Link></td>
                    <td className="td text-slate-300">{r.lop ?? ''}</td>
                    <td className="td">
                      {r.kyNang.split(', ').map((k, i) => (
                        <Fragment key={k}>{i > 0 && ', '}<abbr title={TEN_KY_NANG[k] ?? k} className="no-underline">{k}</abbr></Fragment>
                      ))}
                    </td>
                    <td className="td"><span className="block truncate text-slate-300" title={r.chiTiet}>{r.chiTiet}</span></td>
                    <td className="td tabular-nums text-slate-300">{r.tu}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </Card>
  );
}

