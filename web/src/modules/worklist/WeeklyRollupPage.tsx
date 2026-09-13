import { useSearchParams } from 'react-router-dom';
import { WeeklyBoard } from './WeeklyBoard.tsx';

/**
 * Trang riêng của bảng tổng hợp theo tuần.
 *
 * Từ vòng 4 bảng này là CHẾ ĐỘ XEM THỨ HAI của màn Thực trạng (mục 10.5), nên trang riêng
 * chỉ còn là một cái vỏ quanh đúng component đó. Giữ lại địa chỉ cũ để đường dẫn ai đó đã
 * gửi cho nhau vẫn mở được; hai bản cài đặt cho cùng một bảng mới là thứ phải tránh.
 */
export default function WeeklyRollupPage() {
  const [params] = useSearchParams();
  const branchId = params.get('branchId') ? Number(params.get('branchId')) : null;
  return (
    <div className="page space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-100">Tổng hợp theo tuần</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Tự tính từ điểm đã nhập và các case đang theo dõi. Không có ô nào phải nhập tay ở đây.
        </p>
      </div>
      <WeeklyBoard branchId={branchId} />
    </div>
  );
}
