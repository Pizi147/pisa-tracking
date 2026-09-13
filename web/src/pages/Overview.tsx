import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../lib/useApi.ts';
import { useSession } from '../lib/session.tsx';
import { Card, Empty, ErrorState, Info, Level, Skeleton, Task } from '../components/ui.tsx';
import { BranchFilter } from '../components/Filters.tsx';
import { fmtDate, skillShort } from '../lib/format.ts';
import { CaseBoard } from './Academic.tsx';
import { BranchPulse } from '../components/BranchPulse.tsx';

type WorkItem = {
  key: string; group: string; urgency: 'overdue' | 'today' | 'normal';
  studentId: number | null; studentName: string;
  classId: number | null; classCode: string | null;
  attemptId: number | null; attemptNo: number | null; caseId: number | null;
  level: { tone: 'ok' | 'info' | 'warn' | 'danger'; text: string } | null;
  reason: string; actionLabel: string; overdueLabel: string | null; href: string;
};
type WorkGroup = {
  key: string; label: string; hint: string;
  items: WorkItem[]; overdue: number; today: number;
};
type Work = {
  summary: { total: number; overdue: number; today: number };
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
  const navigate = useNavigate();
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
          <div className="flex flex-wrap gap-2">
            {data.groups.map((g) => (
              <button key={g.key}
                className="flex-1 min-w-[9.5rem] rounded-lg border px-3 py-2.5 text-left hover:bg-white/5 transition-colors"
                style={{ borderColor: g.overdue ? 'rgba(242,161,161,.35)' : 'var(--line)' }}
                onClick={() => document.getElementById(`nhom-${g.key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                <div className="text-[11px] text-slate-500">{g.label}</div>
                <div className="text-2xl tabular-nums text-slate-100 leading-none mt-1">{g.items.length}</div>
                <div className="text-[11px] mt-1 h-4">
                  {g.overdue > 0 ? <span className="text-rose-200">{g.overdue} quá hạn</span>
                    : g.today > 0 ? <span className="text-amber-200">{g.today} tới hạn hôm nay</span>
                    : <span className="text-slate-600">chưa tới hạn</span>}
                </div>
              </button>
            ))}
          </div>

          {/*
            CỘT PHẢI RỘNG 25–30% (mục 1). Bản trước cố định 17rem, nên trên màn hình rộng nó
            teo lại thành một dải hẹp mà mã lớp phải xuống dòng, còn cột việc thì dài quá
            tầm mắt. Dùng phần trăm để hai cột cùng lớn lên theo màn hình.
          */}
          <div className={`grid gap-4 items-start ${showClasses
            ? 'lg:grid-cols-[minmax(0,1fr)_28%] 2xl:grid-cols-[minmax(0,1fr)_26%]' : ''}`}>
            <div className="space-y-4 min-w-0">
              {data.groups.map((g) => (
                <Card key={g.key} className="scroll-mt-4"
                  title={
                    <span className="flex flex-wrap items-baseline gap-2">
                      {g.label}
                      <span className="text-slate-500 font-normal">({g.items.length})</span>
                    </span>
                  }
                  bodyClass="p-0">
                  <div id={`nhom-${g.key}`} />
                  {/* Một dòng nói rõ nhóm này nghĩa là gì — không bắt người đọc tự đoán. */}
                  <p className="px-4 pt-3 pb-1 text-xs text-slate-500 m-0">{g.hint}</p>
                  <ul className="divide-y list-none p-0 m-0" style={{ borderColor: 'var(--line)' }}>
                    {g.items.map((it) => (
                      <li key={it.key}>
                        <button
                          className="w-full text-left px-4 py-3 hover:bg-white/5 flex flex-wrap items-center gap-x-3 gap-y-1.5"
                          onClick={() => navigate(it.href)}>
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="text-sm text-slate-100 font-medium">{it.studentName}</span>
                              {it.classCode && <Info>{it.classCode}</Info>}
                              {/* Nhãn MỨC ĐỘ: nền đặc, tách hẳn khỏi nhãn việc bên phải. */}
                              {it.level && <Level tone={it.level.tone}>{it.level.text}</Level>}
                              {/*
                                Nhãn quá hạn nói rõ QUÁ HẠN CÁI GÌ. "Quá hạn" trơ trọi thì
                                phải đọc tiếp cả dòng mới biết, mà cùng một màn hình đang có
                                năm loại hạn khác nhau.
                              */}
                              {it.overdueLabel && (
                                <Task tone={it.urgency === 'overdue' ? 'danger' : 'warn'}>{it.overdueLabel}</Task>
                              )}
                            </span>
                            <span className="block text-xs text-slate-400 mt-0.5">{it.reason}</span>
                          </span>
                          {/*
                            Nhãn VIỆC: luôn trung tính. Màu gấp đã nằm ở nhãn quá hạn bên
                            trái — tô thêm ở đây thì một dòng có hai chỗ đỏ, mất trọng tâm.
                          */}
                          <Task>{it.actionLabel}</Task>
                        </button>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
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
