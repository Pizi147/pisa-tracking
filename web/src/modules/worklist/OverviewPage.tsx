import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { BranchFilter } from '../../ui/Filters.tsx';
import { CaseBoard } from '../cases/CaseBoardPage.tsx';
import { BranchPulse } from './BranchPulse.tsx';
import { Highlights } from './Highlights.tsx';
import { MetricTiles } from './MetricTiles.tsx';
import { WorkList, type WorkGroup, type WorkItem } from './WorkList.tsx';
import { YThucReminders } from '../yThuc/YThucReminders.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { TAB_TONG_QUAN_LABEL, ngay, type TabTongQuan } from '@shared/domain/index.ts';

type Work = {
  summary: { total: number; overdue: number; today: number; approval: number; mine: number };
  items: WorkItem[];
  groups: WorkGroup[];
  scopeEmpty: boolean;
};
/**
 * TỔNG QUAN — việc của CHÍNH người đang xem.
 *
 * Màn cũ là bốn ô số theo tuần, và giáo viên với quản lý mở ra thấy y hệt nhau. Số tổng là
 * ngôn ngữ của báo cáo; người đi dạy cần biết "em nào đang cần mình", không cần biết cả chi
 * nhánh có bao nhiêu case.
 *
 * Nên ở đây mỗi dòng là MỘT HỌC VIÊN: tên em, một câu lý do, một nút bấm được. Việc nào
 * người xem không có quyền làm thì không xuất hiện — máy chủ lọc trước khi trả về.
 *
 * Chia nhóm theo loại việc để làm xong nhóm này rồi sang nhóm khác, nhưng việc GẤP tách
 * hẳn lên đầu bất kể thuộc nhóm nào.
 */
export default function OverviewPage({ tab: tabProp = 'tong-quan' }: { tab?: TabTongQuan } = {}) {
  const { session } = useSession();
  const [params, setParams] = useSearchParams();
  /*
   * HAI CÂU HỎI KHÁC NHAU, KHÔNG PHẢI HAI MÀN HÌNH KHÁC NHAU.
   *   Tổng quan — tôi phải làm gì bây giờ?
   *   Phân tích — cả chi nhánh đang thế nào?
   * Quản lý cần cả hai, nhưng không cần cùng lúc; nhét chung một trang là cách chắc chắn
   * nhất để việc của mình chìm trong số liệu của người khác. Tab nằm trên ĐƯỜNG DẪN
   * (`/` và `/phan-tich`), không phải tham số `?tab=`, nên Back giữ đúng chỗ và gửi đường
   * dẫn cho người khác vẫn ra đúng màn.
   */
  const canSeeBoard = !!session?.nav?.analysis;
  /*
   * TAB "BÁO CÁO TUẦN" ĐÃ BỎ (mục 12) — owner nói "chưa cần thiết ở giai đoạn này".
   *
   * Chức năng Quản lý giao việc cho giáo viên thì GIỮ, và chuyển sang tab Phân tích: nó là
   * việc làm hằng ngày, còn báo cáo tuần là một nghi thức họp. Địa chỉ cũ `?tab=tinh-hinh`
   * do `duongMoi` chuyển hướng sang `/phan-tich` — đường dẫn cũ ai đó đã gửi cho nhau vẫn mở
   * được.
   */
  const tab = canSeeBoard && tabProp === 'phan-tich' ? 'board' : 'work';
  const navigate = useNavigate();
  const goTab = (k: TabTongQuan) => {
    const cn = params.get('cn');
    navigate(`${k === 'phan-tich' ? '/phan-tich' : '/'}${cn ? `?cn=${cn}` : ''}`);
  };
  /*
   * CHI NHÁNH ĐANG CHỌN NẰM TRÊN ĐỊA CHỈ TRANG, KHÔNG NẰM TRONG BỘ NHỚ CỦA RIÊNG MÀN NÀY.
   *
   * Lỗi owner báo 12/09: chọn Hải Dương mà bảng không đổi. Nguyên nhân là màn này giữ chi
   * nhánh trong state riêng, còn bảng vấn đề bên dưới (`CaseBoard`) đọc tham số `cn` trên
   * địa chỉ — HAI bộ lọc chi nhánh độc lập trên cùng MỘT màn hình. Nay chỉ còn một nguồn:
   * tham số `cn`. Đổi ở đâu thì cả trang đổi theo, và gửi đường dẫn cho người khác vẫn ra
   * đúng chi nhánh đó.
   */
  /*
   * LOẠI VIỆC ĐANG LỌC nằm trên địa chỉ trang, cùng chỗ với chi nhánh. Bấm một con số ở dải
   * tóm tắt là đổi tham số này, nên gửi đường dẫn cho người khác vẫn ra đúng danh sách đó
   * (mục 5.3 điểm 4).
   */
  const workGroup = params.get('viec');
  const setWorkGroup = (g: string | null) => {
    const next = new URLSearchParams(params);
    if (g) next.set('viec', g); else next.delete('viec');
    setParams(next, { replace: true });
  };
  const branchId = params.get('cn') ? Number(params.get('cn')) : null;
  const setBranchId = (id: number | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set('cn', String(id)); else next.delete('cn');
    setParams(next);
  };
  const { data, loading, error, reload } = useApi<Work>(
    `/my-work${branchId ? `?branchId=${branchId}` : ''}`, [branchId],
  );

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;

  return (
    <div className="page space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-100 m-0">Tổng quan</h1>
          <p className="text-xs text-slate-500 mt-0.5 mb-0">
            {tab === 'board'
              ? 'Học viên đang yếu ở đâu — cả case sinh từ điểm và case giáo viên báo.'
              : `Việc của bạn, tính đến ${ngay(session?.demoDate, session?.demoDate)}.`}
          </p>
        </div>
        <BranchFilter branchId={branchId} onBranch={setBranchId} />
      </div>

      {canSeeBoard && (
        <HangTab ariaLabel="Tổng quan" value={tabProp} onChange={goTab}
          tabs={(['tong-quan', 'phan-tich'] as const).map((k) => ({ key: k, label: TAB_TONG_QUAN_LABEL[k] }))} />
      )}

      {tab === 'board' && <CaseBoard embedded />}

      {/*
        BỐN TẦNG, ĐÚNG THỨ TỰ (mục 3.1):
          1. bộ chọn chi nhánh — nằm ở đầu trang, dùng chung cho cả hai tab;
          2. sự kiện nổi bật — thu gọn sẵn, liếc là biết tuần này có gì;
          3. MỘT bảng tổng hợp — chi nhánh/lớp đang tắc ở đâu;
          4. MỘT khu Việc cần làm — thanh lọc + danh sách + Xem thêm.

        Bản trước bày thêm một dải thẻ số lặp lại đúng những con số đã có trong thanh lọc
        của danh sách, và một cột "Lớp của bạn" ở bên phải. Ba chỗ cùng nói một chuyện thì
        người đọc phải tự đối chiếu xem chúng có khớp nhau không — và đó là việc của phần
        mềm, không phải của người dùng. Danh sách lớp đã có nguyên một mục Học viên.
      */}
      {/* Bốn ô số — mỗi ô đi qua <SoLieu>: tự giải thích được và bấm ra đúng tập tạo nên nó. */}
      {tab === 'work' && canSeeBoard && <MetricTiles branchId={branchId} />}

      {tab === 'work' && <Highlights branchId={branchId} />}

      {/* Ý THỨC & PHỐI HỢP (§7.10, plan.md K6): nhắc mềm của GVCN, không phải WorkItem có hạn. */}
      {tab === 'work' && <YThucReminders />}

      {/* Bảng tổng hợp của Quản lý. Bấm một con số trong bảng là LỌC danh sách bên dưới. */}
      {tab === 'work' && canSeeBoard && (
        <BranchPulse branchId={branchId} activeGroup={workGroup} onGroup={setWorkGroup} />
      )}

      {tab === 'work' && loading && <Skeleton rows={8} />}

      {tab === 'work' && data && (data.scopeEmpty || data.summary.total === 0) && (
        <Card>
          <Empty
            title={data.scopeEmpty ? 'Bạn chưa được cấp phạm vi nào' : 'Không có việc nào đang chờ bạn'}
            hint={data.scopeEmpty ? undefined : 'Điểm đã nhập đủ, và những em đang theo dõi đều đã có người làm.'}
            action={<Link className="btn no-underline" to="/hoc-vien">Mở danh sách lớp</Link>}
          />
        </Card>
      )}

      {tab === 'work' && data && data.summary.total > 0 && (
        /*
          `key` gắn với nhóm đang chọn: bấm một con số ở bảng tổng hợp là danh sách nhảy về
          đúng bộ lọc đó, kể cả khi người dùng vừa tự đổi bộ lọc bằng tay.
        */
        <WorkList key={workGroup ?? 'all'} data={data}
          defaultGroup={workGroup} onGroup={setWorkGroup} />
      )}
    </div>
  );
}
