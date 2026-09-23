import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { invalidate } from '../../lib/api.ts';
import { useSession } from '../../lib/session.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { usePeriods } from '../../ui/Filters.tsx';
import { ClassYThucCard } from '../yThuc/ClassYThucCard.tsx';
import { QuickReport } from '../cases/QuickReport.tsx';
import { IntakePanel } from '../students/IntakePanel.tsx';
import { TeacherAssignDialog } from './TeacherAssignPanel.tsx';
import { ClassProgressPanel } from './ClassProgressPanel.tsx';
import { TransitionPanel } from './TransitionPanel.tsx';
import { DauTrangLop, type HoSoLop, type ViecDauTrang } from './DauTrangLop.tsx';
import { SuaThongTinLopPanel } from './SuaThongTinLopPanel.tsx';
import { TabHocVienLop } from './TabHocVienLop.tsx';
import { PhanTichLopTab } from './PhanTichLopTab.tsx';
import { TAB_HO_SO_LOP, TAB_HO_SO_LOP_NHAN, tabHoSoLop, type TabHoSoLop } from '@shared/domain/index.ts';

/**
 * HỒ SƠ LỚP (đặc tả §3.7; mockup 06 menu dòng A, 06c §1, 10b) — đầu trang có sẵn các nút hành động, ba tab
 * Học viên · Ý thức & Phối hợp · Phân tích lớp (bỏ tab Giáo viên: phân công ở ⋮ › Sửa phân công).
 * Tab và chế độ xem nằm trên URL (`?tab=`, `?che-do=`). Một panel một lúc (G-8): `viec` giữ đúng MỘT việc đang mở.
 */
export default function ClassOverviewPage() {
  const { classId } = useParams();
  const { session } = useSession();
  const [params, setParams] = useSearchParams();
  const tab = tabHoSoLop(params.get('tab'));
  const cheDo: 'diem' | 'can-ho-tro' = params.get('che-do') === 'can-ho-tro' ? 'can-ho-tro' : 'diem';
  const periods = usePeriods();
  const [periodId, setPeriodId] = useState<number | null>(null);
  const [viec, setViec] = useState<ViecDauTrang | null>(null);
  const [caseFor, setCaseFor] = useState(0);
  const { data, loading, error, reload } = useApi<HoSoLop>(classId ? `/classes/${classId}/overview` : null);
  /* Danh sách em cho ô chọn học viên của "+ Case" — chỉ nạp khi mở. */
  const roster = useApi<any[]>(classId && viec === 'case' ? `/classes/${classId}/roster` : null, [classId, viec]);

  useEffect(() => {
    if (periodId === null && periods.data?.length && session) {
      const cur = periods.data.find((p) => p.weekStart <= session.demoDate && p.weekEnd >= session.demoDate);
      setPeriodId(cur?.id ?? periods.data[0].id);
    }
  }, [periods.data, periodId, session]);

  /*
   * LỐI VÀO TỪ VIỆC ĐỎ / BADGE "Hết khoá" (PR-LT): `?viec=chuyen-tiep` mở panel Chuyển tiếp
   * lớp MỘT LẦN rồi xoá tham số khỏi URL — không mở lại nếu người dùng tự đóng rồi tải lại.
   */
  useEffect(() => {
    if (data && params.get('viec') === 'chuyen-tiep' && data.viewer.coTheChuyenTiep) {
      setViec('chuyen-tiep');
      doiThamSo({ viec: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const doiThamSo = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) { if (v === null) next.delete(k); else next.set(k, v); }
    setParams(next, { replace: true });
  };

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={8} />;

  const thuong = data.programme?.scoringMode === 'ratio';
  const dong = () => setViec(null);
  const xong = () => { invalidate('/classes'); invalidate('/hoc-vien-lop'); reload(); };

  return (
    <div className="page space-y-4">
      <DauTrangLop data={data} periodId={periodId} onViec={setViec}
        onCheDoCanHoTro={() => doiThamSo({ tab: null, 'che-do': 'can-ho-tro' })} />

      <HangTab ariaLabel="Hồ sơ lớp" value={tab}
        onChange={(k: TabHoSoLop) => doiThamSo({ tab: k === 'hoc-vien' ? null : k })}
        tabs={TAB_HO_SO_LOP.map((k) => ({ key: k, label: TAB_HO_SO_LOP_NHAN[k], canhBao: k === 'y-thuc' && data.canhBaoYThuc > 0 }))} />

      {tab === 'hoc-vien' && (
        <TabHocVienLop lop={data} cheDo={cheDo} onCheDo={(m) => doiThamSo({ 'che-do': m === 'diem' ? null : m })}
          onDoi={xong} onThemHocVien={() => setViec('hoc-vien')} />
      )}
      {tab === 'y-thuc' && <ClassYThucCard classId={data.id} />}
      {tab === 'phan-tich' && <PhanTichLopTab classId={data.id} />}

      {viec === 'tien-do' && (
        <ClassProgressPanel classId={data.id} classCode={data.code} tieuDe={thuong ? 'Lịch kiểm tra' : 'Lộ trình lớp'}
          onClose={dong} onDone={xong} />
      )}
      <TransitionPanel classId={data.id} open={viec === 'chuyen-tiep'} onClose={dong} onDone={xong} />
      <TeacherAssignDialog open={viec === 'phan-cong'} onClose={dong} classId={data.id} classCode={data.code} onDone={xong} />
      {viec === 'thong-tin' && (
        <SuaThongTinLopPanel onClose={dong} onDone={xong}
          lop={{ id: data.id, code: data.code, route: data.route, note: data.note,
            programmeCode: data.programme?.code ?? null, soHocVien: data.summary?.studentCount ?? 0 }} />
      )}
      {viec === 'hoc-vien' && (
        <IntakePanel defaultClass={{ id: data.id, code: data.code }} onClose={dong} onDone={xong} />
      )}
      <QuickReport open={viec === 'case'} onClose={() => { dong(); setCaseFor(0); }} studentId={caseFor}
        students={(roster.data ?? []).filter((r: any) => !r.archived).map((r: any) => ({ id: r.id, name: r.fullName, code: r.studentCode ?? null }))}
        onPickStudent={setCaseFor} onDone={() => { dong(); setCaseFor(0); xong(); }} />
    </div>
  );
}
