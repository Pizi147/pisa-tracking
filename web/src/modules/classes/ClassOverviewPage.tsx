import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { invalidate } from '../../lib/api.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { usePeriods } from '../../ui/Filters.tsx';
import { ClassYThucCard } from '../yThuc/ClassYThucCard.tsx';
import { QuickReport } from '../cases/QuickReport.tsx';
import { IntakePanel } from '../students/IntakePanel.tsx';
import { SuaCaLopPanel } from '../students/SuaCaLopPanel.tsx';
import { TeacherAssignPanel } from './TeacherAssignPanel.tsx';
import { KetThucLopPanel, XoaLopPanel } from './XoaKetThucLopPanel.tsx';
import { ClassProgressPanel } from './ClassProgressPanel.tsx';
import { TransitionPanel } from './TransitionPanel.tsx';
import { BanGiaoPanel } from './BanGiaoPanel.tsx';
import { DauTrangLop, type HoSoLop, type ViecDauTrang } from './DauTrangLop.tsx';
import { SuaThongTinLopPanel } from './SuaThongTinLopPanel.tsx';
import { NganXuatMt } from '../test/NganXuatMt.tsx';
import { TabHocVienLop } from './TabHocVienLop.tsx';
import { PhanTichLopTab } from './PhanTichLopTab.tsx';
import { DOT_XUAT_FT, DOT_XUAT_THUONG, TAB_HO_SO_LOP, TAB_HO_SO_LOP_NHAN, tabHoSoLop, type TabHoSoLop } from '@shared/domain/index.ts';

/**
 * HỒ SƠ LỚP (đặc tả §3.7; mockup 06 menu dòng A, 06c §1, 10b) — đầu trang có sẵn các nút hành động, ba tab
 * Học viên · Ý thức & Phối hợp · Phân tích lớp (bỏ tab Giáo viên: phân công ở ⋮ › Sửa phân công).
 * Tab và chế độ xem nằm trên URL (`?tab=`, `?che-do=`). Một panel một lúc (G-8): `viec` giữ đúng MỘT việc đang mở.
 */
export default function ClassOverviewPage() {
  const { classId } = useParams();
  const { homNay } = useNgayNghiepVu();
  const [params, setParams] = useSearchParams();
  const tab = tabHoSoLop(params.get('tab'));
  const cheDo: 'diem' | 'can-ho-tro' = params.get('che-do') === 'can-ho-tro' ? 'can-ho-tro' : 'diem';
  const periods = usePeriods();
  const [periodId, setPeriodId] = useState<number | null>(null);
  const [viec, setViec] = useState<ViecDauTrang | null>(null);
  /** PR-CT: panel Bàn giao mở kèm môn (GVBM) và/hoặc đúng một lệnh (từ hồ sơ HV). */
  const [bg, setBg] = useState<{ mon: string | null; lenhId: number | null; lop: number | null }>({ mon: null, lenhId: null, lop: null });
  const [caseFor, setCaseFor] = useState(0);
  const { data, loading, error, reload } = useApi<HoSoLop>(classId ? `/classes/${classId}/overview` : null);
  /* Danh sách em cho ô chọn học viên của "+ Case" — chỉ nạp khi mở. */
  const roster = useApi<any[]>(classId && viec === 'case' ? `/classes/${classId}/roster` : null, [classId, viec]);

  useEffect(() => {
    if (periodId === null && periods.data?.length && homNay) {
      const cur = periods.data.find((p) => p.weekStart <= homNay && p.weekEnd >= homNay);
      setPeriodId(cur?.id ?? periods.data[0].id);
    }
  }, [periods.data, periodId, homNay]);

  /*
   * LỐI VÀO TỪ VIỆC ĐỎ / BADGE "Hết khoá" (PR-LT): `?viec=chuyen-tiep` mở panel Chuyển tiếp
   * lớp MỘT LẦN rồi xoá tham số khỏi URL — không mở lại nếu người dùng tự đóng rồi tải lại.
   * `?viec=phan-cong` (PR-LOP, K1-05): việc "lớp thiếu GV môn" mở thẳng Sửa phân công.
   */
  useEffect(() => {
    const v = params.get('viec');
    if (data && ((v === 'chuyen-tiep' && data.viewer.coTheChuyenTiep) || (v === 'phan-cong' && (data.viewer.canAssign || data.viewer.canAssignSubject)))) {
      setViec(v);
      doiThamSo({ viec: null });
    } else if (data && v === 'ban-giao') {
      /* PR-CT: việc Bàn giao (Công việc) và nút ở hồ sơ HV — `?viec=ban-giao[&mon=][&lenh=]`. Máy chủ chặn người không có quyền đọc phiếu. */
      setBg({ mon: params.get('mon'), lenhId: Number(params.get('lenh')) || null, lop: null });
      setViec('ban-giao');
      doiThamSo({ viec: null, mon: null, lenh: null });
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
        onBanGiao={(o) => { setBg({ mon: o.mon ?? null, lenhId: null, lop: o.lop ?? null }); setViec('ban-giao'); }} />

      <HangTab ariaLabel="Hồ sơ lớp" value={tab}
        onChange={(k: TabHoSoLop) => doiThamSo({ tab: k === 'hoc-vien' ? null : k })}
        tabs={TAB_HO_SO_LOP.map((k) => ({ key: k, label: TAB_HO_SO_LOP_NHAN[k], canhBao: k === 'y-thuc' && data.canhBaoYThuc > 0 }))} />

      {tab === 'hoc-vien' && (
        <TabHocVienLop lop={data} cheDo={cheDo} onCheDo={(m) => doiThamSo({ 'che-do': m === 'diem' ? null : m })}
          onDoi={xong} onThemHocVien={() => setViec('hoc-vien')}
          onSuaThongTin={data.viewer.canAddStudents && (data.summary?.studentCount ?? 0) > 0 ? () => setViec('sua-hoc-vien') : undefined} />
      )}
      {tab === 'y-thuc' && <ClassYThucCard classId={data.id} thuong={thuong} />}
      {tab === 'phan-tich' && <PhanTichLopTab classId={data.id} />}

      {viec === 'tien-do' && (
        <ClassProgressPanel classId={data.id} classCode={data.code} tieuDe={thuong ? 'Lịch Test của lớp' : 'Tuần khai giảng'}
          onClose={dong} onDone={xong} onChuyenTiep={data.viewer.coTheChuyenTiep ? () => setViec('chuyen-tiep') : undefined} />
      )}
      <TransitionPanel classId={data.id} open={viec === 'chuyen-tiep'} onClose={dong} onDone={xong} />
      {viec === 'ban-giao' && <BanGiaoPanel classId={bg.lop ?? data.id} mon={bg.mon} lenhId={bg.lenhId} onClose={dong} onDone={xong} />}
      <TeacherAssignPanel open={viec === 'phan-cong'} onClose={dong} classId={data.id} classCode={data.code} onDone={xong} />
      {viec === 'thong-tin' && (
        <SuaThongTinLopPanel onClose={dong} onDone={xong}
          lop={{ id: data.id, code: data.code, branchCode: data.branchCode, route: data.route, note: data.note,
            programmeCode: data.programme?.code ?? null, soHocVien: data.summary?.studentCount ?? 0 }} />
      )}
      {viec === 'xuat-mt' && (
        <NganXuatMt khung={thuong ? 'thuong' : 'ft'} lop={{ id: data.id, ma: data.code }} chiNhanh={data.branchId}
          thoiGianMacDinh={{ kieu: 'dot', dot: [...(thuong ? DOT_XUAT_THUONG : DOT_XUAT_FT)] }} onDong={dong} />
      )}
      {viec === 'xoa-lop' && <XoaLopPanel classId={data.id} classCode={data.code} onClose={dong} />}
      {viec === 'ket-thuc-lop' && <KetThucLopPanel classId={data.id} classCode={data.code} onClose={dong} onDone={xong} />}
      {viec === 'sua-hoc-vien' && <SuaCaLopPanel classId={data.id} onClose={dong} onDone={xong} />}
      {viec === 'hoc-vien' && (
        <IntakePanel defaultClass={{ id: data.id, code: data.code }} onClose={dong} onDone={xong} />
      )}
      <QuickReport open={viec === 'case'} onClose={() => { dong(); setCaseFor(0); }} studentId={caseFor} lop={data.code}
        students={(roster.data ?? []).filter((r: any) => !r.archived).map((r: any) => ({ id: r.id, name: r.fullName, code: r.studentCode ?? null }))}
        onPickStudent={setCaseFor} onDone={() => { dong(); setCaseFor(0); xong(); }} />
    </div>
  );
}
