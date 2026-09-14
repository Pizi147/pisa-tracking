import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { Card, Empty, ErrorState, Info, Level, Skeleton, Task } from '../../ui/ui.tsx';
import { BranchFilter } from '../../ui/Filters.tsx';
import { fmtDate, skillShort } from '../../lib/format.ts';
import { CaseBoard } from '../cases/CaseBoardPage.tsx';
import { BranchPulse } from './BranchPulse.tsx';
import { WorkList, type WorkGroup, type WorkItem } from './WorkList.tsx';

type Work = {
  summary: { total: number; overdue: number; today: number; approval: number; mine: number };
  items: WorkItem[];
  groups: WorkGroup[];
  scopeEmpty: boolean;
};
type ClassRow = {
  id: number; code: string; branchName: string; studentCount: number;
  needScores: number; needDates: number; openCases: number; mySkills: string[];
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
export default function OverviewPage() {
  const { session } = useSession();
  const [params, setParams] = useSearchParams();
  /*
   * HAI CÂU HỎI KHÁC NHAU, KHÔNG PHẢI HAI MÀN HÌNH KHÁC NHAU.
   *   Toàn cảnh công việc — tôi phải làm gì bây giờ?
   *   Thực trạng         — cả chi nhánh đang thế nào?
   * Quản lý cần cả hai, nhưng không cần cùng lúc; nhét chung một trang là cách chắc chắn
   * nhất để việc của mình chìm trong số liệu của người khác. Tab nằm trên URL nên Back
   * giữ đúng chỗ và gửi đường dẫn cho người khác vẫn ra đúng màn.
   */
  const canSeeBoard = !!session?.nav?.academic;
  /*
   * CỘT PHẢI ĐỔI THEO VAI.
   *
   * "Lớp của bạn" đúng với giáo viên và với Quản lý còn đi dạy. Với Admin chi nhánh thì sai
   * tên: nó đang hiện TOÀN BỘ lớp của chi nhánh, không phải lớp họ dạy — và họ cũng không
   * dạy lớp nào. Với Quản trị hệ thống thì vô nghĩa: năm chi nhánh trộn chung một danh sách.
   */
  const roles = session?.roles ?? [];
  const showClasses = !(roles.length === 1 && roles[0] === 'system_admin');
  const classTitle = roles.includes('branch_admin') && !roles.includes('teacher')
    ? 'Lớp của chi nhánh' : 'Lớp của bạn';
  /*
   * TAB "BÁO CÁO TUẦN" ĐÃ BỎ (mục 12) — owner nói "chưa cần thiết ở giai đoạn này".
   *
   * Chức năng Quản lý giao việc cho giáo viên thì GIỮ, và chuyển sang tab Thực trạng: nó là
   * việc làm hằng ngày, còn báo cáo tuần là một nghi thức họp. Địa chỉ cũ `?tab=bao-cao` đưa
   * về Toàn cảnh công việc thay vì báo lỗi — đường dẫn cũ ai đó đã gửi cho nhau vẫn mở được.
   */
  const tabParam = params.get('tab');
  const tab = !canSeeBoard ? 'work' : tabParam === 'tinh-hinh' ? 'board' : 'work';
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
  const classes = useApi<{ rows: ClassRow[] }>(`/classes${branchId ? `?branchId=${branchId}` : ''}`, [branchId]);

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;

  return (
    <div className="page space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-100 m-0">Tổng quan</h1>
          <p className="text-xs text-slate-500 mt-0.5 mb-0">
            {tab === 'board'
              ? 'Học viên đang yếu ở đâu — cả case sinh từ điểm và case giáo viên báo.'
              : `Việc của bạn, tính đến ${fmtDate(session?.demoDate)}.`}
          </p>
        </div>
        <BranchFilter branchId={branchId} onBranch={setBranchId} />
      </div>

      {canSeeBoard && (
        <div className="flex flex-wrap gap-1 border-b pb-2" style={{ borderColor: 'var(--line)' }}>
          <TabButton active={tab === 'work'} onClick={() => {
            const next = new URLSearchParams(params); next.delete('tab'); setParams(next);
          }}>Toàn cảnh công việc</TabButton>
          <TabButton active={tab === 'board'} onClick={() => {
            const next = new URLSearchParams(params); next.set('tab', 'tinh-hinh'); setParams(next);
          }}>Thực trạng</TabButton>
        </div>
      )}

      {tab === 'board' && <CaseBoard embedded />}

      {/* Khối riêng của Quản lý, nằm ngay trên việc của chính họ. */}
      {tab === 'work' && canSeeBoard && <BranchPulse branchId={branchId} />}

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
        <div className="space-y-4">
          {/*
            Dải tóm tắt: đếm theo TỪNG LOẠI VIỆC chứ không chỉ một con số tổng, và nằm
            NGUYÊN MỘT HÀNG trên cùng — nhét vào cột trái thì mỗi ô bị bóp lại, chữ xuống
            dòng, nhìn không ra là đang đếm cái gì. Bấm vào một ô là nhảy xuống đúng nhóm đó.
          */}
          {/*
            DẢI TÓM TẮT giữ nguyên vị trí trên đầu (mục 5.3 điểm 1), nhưng nay BẤM LÀ LỌC
            chứ không phải nhảy xuống một cái hộp khác. Con số nào thì ra đúng danh sách tạo
            nên con số đó — điểm 4 của mục 5.3.
          */}
          <div className="flex flex-wrap gap-2">
            {data.groups.map((g) => {
              const active = workGroup === g.key;
              return (
                <button key={g.key}
                  className="flex-1 min-w-[9.5rem] rounded-lg border px-3 py-2.5 text-left hover:bg-white/5 transition-colors"
                  style={{
                    borderColor: active ? 'var(--accent)'
                      : g.overdue ? 'rgba(242,161,161,.35)' : 'var(--line)',
                    background: active ? 'var(--accent-soft)' : undefined,
                  }}
                  aria-pressed={active}
                  onClick={() => setWorkGroup(active ? null : g.key)}>
                  <div className="text-[11px] text-slate-500">{g.label}</div>
                  <div className="text-2xl tabular-nums text-slate-100 leading-none mt-1">{g.items.length}</div>
                  <div className="text-[11px] mt-1 h-4">
                    {g.overdue > 0 ? <span className="text-rose-200">{g.overdue} quá hạn</span>
                      : g.today > 0 ? <span className="text-amber-200">{g.today} tới hạn hôm nay</span>
                      : <span className="text-slate-600">chưa tới hạn</span>}
                  </div>
                </button>
              );
            })}
          </div>

          <div className={`grid gap-4 items-start ${showClasses
            ? 'lg:grid-cols-[minmax(0,1fr)_28%] 2xl:grid-cols-[minmax(0,1fr)_26%]' : ''}`}>
            <div className="min-w-0">
              {/*
                MỘT khu vực Việc cần làm, thay cho bảy cái hộp mở đồng thời của bản trước.
                `key` gắn với nhóm đang chọn để bấm một ô ở dải trên là danh sách nhảy về
                đúng bộ lọc đó, kể cả khi người dùng đã tự đổi bộ lọc bằng tay.
              */}
              <WorkList key={workGroup ?? 'all'} data={data} defaultGroup={workGroup} />
            </div>

            {/*
              Cột phải: LỚP CỦA BẠN. Không phải một bảng chỉ số — đây là lối vào thứ hai,
              vì nhiều việc làm theo cả lớp một lượt chứ không theo từng em. Cố tình để hẹp
              hơn cột việc: đây là chỗ tra cứu, không phải chỗ làm việc.
            */}
            {/*
              Cột tra cứu CUỘN RIÊNG. Trước đây nó dính theo cuộn của cả trang, nên ở lớp
              nhiều dòng thì phải cuộn hết danh sách việc mới thấy được lớp cuối cùng.
              `max-h` tính theo chiều cao màn hình, không phải một con số cố định.
            */}
            {showClasses && <Card title={classTitle} bodyClass="p-0"
              className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-7rem)] lg:flex lg:flex-col">
              {classes.loading && <div className="p-4"><Skeleton rows={3} /></div>}
              {classes.data && classes.data.rows.length === 0 && (
                <div className="p-4"><Empty title="Bạn chưa được phân công lớp nào" /></div>
              )}
              <ul className="divide-y list-none p-0 m-0 box-scroll lg:min-h-0" style={{ borderColor: 'var(--line)' }}>
                {(classes.data?.rows ?? []).map((c) => (
                  <li key={c.id}>
                    <Link to={`/hoc-vien?open=${c.id}`}
                      className="block px-4 py-2.5 no-underline hover:bg-white/5">
                      <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className="text-sm text-slate-100 font-medium">{c.code}</span>
                        <span className="text-[11px] text-slate-500">{c.studentCount} em</span>
                      </span>
                      <span className="flex flex-wrap gap-1.5 mt-1.5">
                        {c.mySkills?.length > 0 && <Info title="Kỹ năng bạn dạy ở lớp này">{c.mySkills.map(skillShort).join(' ')}</Info>}
                        {c.openCases > 0 && <Level tone={c.openCases >= 5 ? 'warn' : 'info'}>{c.openCases} em cần hỗ trợ</Level>}
                        {c.needScores > 0 && <Task>Nhập điểm · {c.needScores}</Task>}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="px-4 py-3 shrink-0 border-t" style={{ borderColor: 'var(--line)' }}>
                <Link className="link text-xs" to="/hoc-vien">Xem tất cả lớp →</Link>
              </div>
            </Card>}
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
        active
          ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)] border-[color:var(--accent-line)]'
          : 'text-slate-300 border-transparent hover:bg-white/5'
      }`}>
      {children}
    </button>
  );
}
