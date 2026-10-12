import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { taiTruoc, useApi } from '../../lib/useApi.ts';
import { invalidate } from '../../lib/api.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { usePeriods } from '../../ui/Filters.tsx';
import { ClassYThucCard } from '../yThuc/ClassYThucCard.tsx';
import { QuickReport } from '../cases/QuickReport.tsx';
import { IntakePanel } from '../students/IntakePanel.tsx';
import { SuaCaLopPanel } from '../students/SuaCaLopPanel.tsx';
import { KetThucLopPanel, MoLaiLopPanel, XoaLopPanel } from './XoaKetThucLopPanel.tsx';
import { TransitionPanel } from './TransitionPanel.tsx';
import { PanelCuoiKhoa } from './PanelCuoiKhoa.tsx';
import { PanelKyVong } from './PanelKyVong.tsx';
import { BanGiaoPanel } from './BanGiaoPanel.tsx';
import { ChuyenLopNhieuEm } from '../students/ChuyenLopPanel.tsx';
import { DauTrangLop, type HoSoLop, type ViecDauTrang } from './DauTrangLop.tsx';
import { ThongTinLopPanel } from './ThongTinLopPanel.tsx';
import { NganXuatMt } from '../test/NganXuatMt.tsx';
import { TabHocVienLop } from './TabHocVienLop.tsx';
import { DiemTheoLop } from '../cham/DiemTheoLop.tsx';
import { duongDiemTheoLuot, type DanhSachLuot } from '../cham/LuoiChamLop.tsx';
import { MuiTen } from '../cases/SkillBoard.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { PhanTichLopTab } from './PhanTichLopTab.tsx';
import { DOT_XUAT_FT, DOT_XUAT_THUONG, TAB_HO_SO_LOP_NHAN, ngay, tabHienCuaLop, tabMacDinhLop, type TabHoSoLop } from '@shared/domain/index.ts';
import { TabTongKetLop } from './TabTongKetLop.tsx';

/**
 * HỒ SƠ LỚP (đặc tả §3.7; mockup 06 menu dòng A, 06c §1, 10b; OV M2 §1–3) — đầu trang nút cố định + ⋯, ba tab
 * Học viên · Ý thức & Phối hợp · Phân tích lớp (bỏ tab Giáo viên: phân công ở ⋯ › Thông tin lớp), bảng điểm cả lớp cuối trang mở sẵn.
 * Tab và chế độ xem nằm trên URL (`?tab=`, `?che-do=`). Một panel một lúc (G-8): `viec` giữ đúng MỘT việc đang mở.
 */
export default function ClassOverviewPage() {
  const { classId } = useParams();
  const { homNay } = useNgayNghiepVu();
  const [params, setParams] = useSearchParams();
  const cheDo: 'diem' | 'can-ho-tro' = params.get('che-do') === 'can-ho-tro' ? 'can-ho-tro' : 'diem';
  const periods = usePeriods();
  const [periodId, setPeriodId] = useState<number | null>(null);
  const [viec, setViec] = useState<ViecDauTrang | null>(null);
  const [xetLai, setXetLai] = useState(false);
  /** PR-DL → PR-OV3a: khối "Điểm Test của lớp" cuối trang — mở sẵn, vẫn thu gọn được. */
  const [moDiem, setMoDiem] = useState(true);
  /** PR-CT: panel Bàn giao mở kèm môn (GVBM) và/hoặc đúng một lệnh (từ hồ sơ HV). */
  const [bg, setBg] = useState<{ mon: string | null; lenhId: number | null; lop: number | null }>({ mon: null, lenhId: null, lop: null });
  const [caseFor, setCaseFor] = useState(0);
  /*
   * PR-TD2-c: tab Học viên (mặc định của lớp đang chạy) cần roster + danh sách lượt điểm — bắt đầu tải CÙNG LÚC với `/overview`
   * thay vì chờ nó xong mới gắn bảng (bớt một tầng chờ). Khối con dùng lại bản tải trước (`useApi`: dangBay / bản vừa xem).
   */
  const tabUrl = params.get('tab');
  useEffect(() => {
    if (!classId || (tabUrl && tabUrl !== 'hoc-vien')) return;
    taiTruoc(`/classes/${classId}/roster`);
    taiTruoc(duongDiemTheoLuot(Number(classId)));
  }, [classId]); // eslint-disable-line react-hooks/exhaustive-deps
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
   * `?viec=phan-cong` (PR-LOP, K1-05): việc "lớp thiếu GV môn" mở Thông tin lớp, phần Phân công đang sửa (PR-OV3a).
   */
  useEffect(() => {
    const v = params.get('viec');
    /* PR-LCb: lớp thường — `?viec=lo-trinh-ca-lop` (việc QL "Chốt lộ trình · lớp") và `?viec=chuyen-tiep` (badge, Lịch Test, thẻ duyệt) cùng mở
       panel "Lộ trình tiếp theo" cho Quản lý và GVCN; lớp FT `chuyen-tiep` vẫn panel Chuyển lớp (chỉ Quản lý). */
    const thuongV = data?.programme?.scoringMode === 'ratio';
    const moLtt = !!data && thuongV && (v === 'chuyen-tiep' || v === 'lo-trinh-ca-lop') && (data.viewer.coTheChuyenTiep || data.viewer.canAddStudents);
    /* PR-KV: việc QL "Kỳ vọng đầu ra · lớp" → `?viec=ky-vong` (máy chủ trả 403 cho người không phải Quản lý). */
    if (data && (moLtt || v === 'ky-vong' || (v === 'chuyen-tiep' && !thuongV && data.viewer.coTheChuyenTiep) || (v === 'phan-cong' && (data.viewer.canAssign || data.viewer.canAssignSubject)))) {
      setViec(v);
      doiThamSo({ viec: null });
    } else if (data && v === 'xet-lai') {
      /* PR-CL: việc QL "Xét lại lộ trình · {lớp} · n em" → Chuyển lớp NHIỀU em, chọn sẵn các em. Trang này là lớp HIỆN TẠI của em
         (QL chi nhánh lớp này); máy chủ lọc theo quyền sửa lớp, người không có quyền thấy "Không còn em cần xét lại." */
      setXetLai(true);
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

  /* PR-TK: lớp đã kết thúc có thêm tab "Tổng kết" — đứng đầu và là tab mở mặc định (tab khác phải ghi rõ trên URL). */
  const daKetThuc = data.status === 'finished';
  const tab = tabMacDinhLop(params.get('tab'), daKetThuc);
  const tabMacDinh = tabMacDinhLop(null, daKetThuc);

  const thuong = data.programme?.scoringMode === 'ratio';
  const dong = () => setViec(null);
  const xong = () => { invalidate('/classes'); invalidate('/hoc-vien-lop'); reload(); };

  return (
    <div className="page space-y-4">
      <DauTrangLop data={data} onViec={setViec}
        onBanGiao={(o) => { setBg({ mon: o.mon ?? null, lenhId: null, lop: o.lop ?? null }); setViec('ban-giao'); }} />

      <HangTab ariaLabel="Hồ sơ lớp" value={tab}
        onChange={(k: TabHoSoLop) => doiThamSo({ tab: k === tabMacDinh ? null : k })}
        tabs={tabHienCuaLop(daKetThuc).map((k) => ({ key: k, label: TAB_HO_SO_LOP_NHAN[k], canhBao: k === 'y-thuc' && data.canhBaoYThuc > 0 }))} />

      {tab === 'tong-ket' && <TabTongKetLop classId={data.id} />}
      {tab === 'hoc-vien' && (
        <TabHocVienLop lop={data} cheDo={cheDo} onCheDo={(m) => doiThamSo({ 'che-do': m === 'diem' ? null : m })}
          onDoi={xong} onThemHocVien={() => setViec('hoc-vien')}
          onSuaThongTin={data.viewer.canAddStudents && (data.summary?.studentCount ?? 0) > 0 ? () => setViec('sua-hoc-vien') : undefined} />
      )}
      {tab === 'y-thuc' && <ClassYThucCard classId={data.id} thuong={thuong} />}
      {tab === 'phan-tich' && <PhanTichLopTab classId={data.id} />}

      {data.viewer.coTheXemDiem && <KhoiDiemLop key={data.id} classId={data.id} thuong={thuong} mo={moDiem} onDoi={() => setMoDiem((m) => !m)} />}

      <TransitionPanel classId={data.id} open={viec === 'chuyen-tiep' && !thuong} onClose={dong} onDone={xong} />
      {(viec === 'lo-trinh-ca-lop' || (viec === 'chuyen-tiep' && thuong)) && <PanelCuoiKhoa classId={data.id} onClose={dong} onDone={xong} />}
      {viec === 'ky-vong' && <PanelKyVong classId={data.id} onClose={dong} onDone={xong} />}
      {xetLai && <ChuyenLopNhieuEm classId={data.id} onClose={() => setXetLai(false)} onDone={xong} />}
      {viec === 'ban-giao' && <BanGiaoPanel classId={bg.lop ?? data.id} mon={bg.mon} lenhId={bg.lenhId} onClose={dong} onDone={xong} />}
      {(viec === 'thong-tin' || viec === 'phan-cong') && (
        <ThongTinLopPanel lop={data} phan={viec === 'phan-cong' ? 'phan-cong' : null} onClose={dong} onDone={xong}
          onChuyenTiep={data.viewer.coTheChuyenTiep ? () => setViec('chuyen-tiep') : undefined} />
      )}
      {viec === 'xuat-mt' && (
        <NganXuatMt khung={thuong ? 'thuong' : 'ft'} lop={{ id: data.id, ma: data.code }} chiNhanh={data.branchId}
          thoiGianMacDinh={{ kieu: 'dot', dot: [...(thuong ? DOT_XUAT_THUONG : DOT_XUAT_FT)] }} onDong={dong} />
      )}
      {viec === 'xoa-lop' && <XoaLopPanel classId={data.id} classCode={data.code} onClose={dong} />}
      {viec === 'ket-thuc-lop' && <KetThucLopPanel classId={data.id} classCode={data.code} onClose={dong} onDone={xong} />}
      {viec === 'mo-lai-lop' && (
        <MoLaiLopPanel classId={data.id} classCode={data.code} chiNhanh={data.branchName} ketThuc={data.finishedAt ? ngay(data.finishedAt) : null} onClose={dong} onDone={xong} />
      )}
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

/**
 * KHỐI "ĐIỂM MOCK TEST CỦA LỚP" (PR-DL, mockup `mockup-diem-theo-lop-2026-10-04.html` #v-lop) — cuối hồ sơ lớp, MỞ SẴN (PR-OV3a, M2 §1):
 * hàng tiêu đề + MỘT chip "MT2 còn 3 ô trống" (lượt mở sẵn của `danhSachLuot`), bấm để thu gọn. Bảng `DiemTheoLop gon` tải khi khối mở.
 */
function KhoiDiemLop({ classId, thuong, mo, onDoi }: { classId: number; thuong: boolean; mo: boolean; onDoi: () => void }) {
  const ds = useApi<DanhSachLuot>(duongDiemTheoLuot(classId), [classId]);
  const l = ds.data?.luot.find((x) => x.ma === ds.data?.macDinh);
  /* Đã mở một lần thì giữ bảng gắn, thu gọn chỉ ẩn — gỡ bảng sẽ mất ô đang gõ / hộp lý do đang mở. */
  const [daMo, setDaMo] = useState(mo);
  if (mo && !daMo) setDaMo(true);
  return (
    <section className="card">
      <h2 className="m-0 text-[15px] font-semibold text-slate-100">
        <button id="khoi-diem-lop-nut" type="button" aria-expanded={mo} aria-controls="khoi-diem-lop-bang" onClick={onDoi}
          className="flex w-full min-h-[44px] scroll-mt-4 flex-wrap items-center gap-x-2.5 gap-y-1 rounded-xl px-3 py-3 text-left sm:px-4">
          <span className="text-slate-400"><MuiTen mo={mo} /></span>
          <span>{thuong ? 'Điểm Test của lớp' : 'Điểm Mock Test của lớp'}</span>
          {l && l.oTrong > 0 && <Nhan tone="wait">{`${l.nhan} còn ${l.oTrong} ô trống`}</Nhan>}
          <span className="flex-1" />
          <span className="text-xs font-normal text-slate-500 max-sm:hidden">{mo ? 'bấm để thu gọn' : 'bấm để mở'}</span>
        </button>
      </h2>
      <div id="khoi-diem-lop-bang" hidden={!mo} className="px-3 pb-3 sm:px-4 sm:pb-4">
        {daMo && <DiemTheoLop classId={classId} gon />}
      </div>
    </section>
  );
}
