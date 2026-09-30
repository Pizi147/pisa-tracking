import { thamSoCt, type ChuongTrinh } from '@shared/domain/index.ts';
import { useApi } from '../../lib/useApi.ts';
import { Empty, ErrorState, Skeleton, Th } from '../../ui/ui.tsx';
import { SoLieuO } from '../../ui/SoLieuO.tsx';
import { TenGiaoVien } from '../classes/TenGiaoVien.tsx';

/**
 * BẢNG "THEO GIÁO VIÊN" CỦA MỘT CHI NHÁNH (PR-GV Q11, mockup 21 màn D) — thay bảng cũ ở Tổng quan › Theo lớp.
 * Trả lời "cần nói chuyện với ai", KHÔNG phải "ai chậm nhất": sắp theo TÊN, không nút sắp xếp theo số, không hàng tổng, không màu tốt/xấu cho người
 * (mọi số cùng một màu; chỉ trong hồ sơ, việc quá hạn mới đỏ). Mỗi số là số của hồ sơ người đó trong chi nhánh + khung đang xem, bấm ra đúng danh sách
 * (`/giao-vien/:id/o`, cùng hàm với số). Tên mở hồ sơ giáo viên. Không có cột "Việc quá hạn" tổng: phải tính Công việc từng người (chậm) — xem hồ sơ.
 */
type Hang = { id: number; ten: string; lop: number; hocVien: number; chuaNhap: number; quaHan: number; caseMo: number; caseQuaHan: number };
type Bang = { cn: number; tenChiNhanh: string; ct: ChuongTrinh; hang: Hang[] };

const COT: { key: keyof Omit<Hang, 'id' | 'ten'>; cot: string; nhan: string; goiY?: string; rong: string }[] = [
  { key: 'lop', cot: 'lop', nhan: 'Lớp', goiY: 'Lớp người này đang dạy trong chi nhánh, theo khung đang chọn.', rong: '9%' },
  { key: 'hocVien', cot: 'hoc-vien', nhan: 'Học viên', goiY: 'Học viên đang học ở các lớp trên (một em học hai lớp chỉ đếm một lần).', rong: '11%' },
  { key: 'chuaNhap', cot: 'chua-nhap', nhan: 'Ô điểm chưa nhập', goiY: 'Một ô = một kỹ năng của một bài, tuần thi đã bắt đầu. Cùng số với Lịch Test.', rong: '16%' },
  { key: 'quaHan', cot: 'qua-han', nhan: 'Quá hạn nhập', goiY: 'Trong số ô chưa nhập, phần đã qua hạn nhập điểm.', rong: '14%' },
  { key: 'caseMo', cot: 'case-mo', nhan: 'Case phụ trách', goiY: 'Case đang mở mà người này là NGƯỜI PHỤ TRÁCH chính — không phải mọi Case của lớp họ dạy.', rong: '14%' },
  { key: 'caseQuaHan', cot: 'case-qua-han', nhan: 'Case quá hạn', goiY: 'Trong số Case phụ trách, phần có việc tiếp đã qua hạn.', rong: '14%' },
];

export function BangGiaoVienChiNhanh({ branchId, ct }: { branchId: number | null; ct: ChuongTrinh }) {
  const tham = [branchId ? `cn=${branchId}` : '', ct === 'ca-hai' ? '' : `ct=${ct}`].filter(Boolean).join('&');
  const { data, loading, error, reload } = useApi<Bang>(`/giao-vien${tham ? `?${tham}` : ''}`, [branchId, ct]);
  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <div className="p-4"><Skeleton rows={4} /></div>;
  if (!data.hang.length) return <Empty title="Chưa có giáo viên nào có lớp trong chi nhánh này." />;
  const qua = `cn=${data.cn}${thamSoCt(ct)}`;
  return (
    <>
      <div className="table-scroll">
        <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: '44rem' }}>
          <colgroup><col style={{ width: '22%' }} />{COT.map((c) => <col key={c.key} style={{ width: c.rong }} />)}</colgroup>
          <thead><tr>
            <Th className="sticky-col">Giáo viên</Th>
            {COT.map((c) => <Th key={c.key} align="right" hint={c.goiY}>{c.nhan}</Th>)}
          </tr></thead>
          <tbody>
            {data.hang.map((h) => (
              <tr key={h.id} className="row-hover">
                <td className="td sticky-col whitespace-nowrap"><TenGiaoVien id={h.id} ten={h.ten} /></td>
                {COT.map((c) => (
                  <td key={c.key} className="td text-right tabular-nums">
                    <SoLieuO giaTri={h[c.key]} tieuDe={`${c.nhan} · ${h.ten}`} nguon={`/giao-vien/${h.id}/o?cot=${c.cot}&${qua}`} className="text-slate-100" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="m-0 border-t px-4 py-2.5 text-xs text-slate-500" style={{ borderColor: 'var(--line)' }}>
        Để biết cần nói chuyện với ai — không xếp hạng. Bấm tên để xem hồ sơ và việc của từng người. Sắp theo tên.
      </p>
    </>
  );
}
