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
import { BanGiaoPanel } from './BanGiaoPanel.tsx';
import { BanGiaoGvPanel } from './BanGiaoGvPanel.tsx';
import { PanelXetLai, XetLaiCtx, duongXetLai, type EmXetLai } from './PanelXetLai.tsx';
import { DauTrangLop, type HoSoLop, type ViecDauTrang } from './DauTrangLop.tsx';
import { ThongTinLopPanel } from './ThongTinLopPanel.tsx';
import { NganXuatMt } from '../test/NganXuatMt.tsx';
import { TabHocVienLop, type CheDoHocVien } from './TabHocVienLop.tsx';
import { DiemTheoLop } from '../cham/DiemTheoLop.tsx';
import { duongDiemTheoLuot, type DanhSachLuot } from '../cham/LuoiChamLop.tsx';
import { MuiTen } from '../cases/SkillBoard.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { PhanTichLopTab } from './PhanTichLopTab.tsx';
import { DOT_XUAT_FT, DOT_XUAT_THUONG, TAB_HO_SO_LOP_NHAN, ngay, tabHienCuaLop, tabMacDinhLop, vaiXemHocVien, type TabHoSoLop } from '@shared/domain/index.ts';
import { useSession } from '../../lib/session.tsx';
import { TabTongKetLop } from './TabTongKetLop.tsx';
import { ThanhViecLop } from './ThanhViecLop.tsx';
import { CuoiKhoaLop } from './CuoiKhoaLop.tsx';
import { LichSuThayDoi } from '../../ui/LichSuThayDoi.tsx';
import { dich, t } from '@shared/i18n/index.ts';

/**
 * HỒ SƠ LỚP (đặc tả §3.7; mockup 06 menu dòng A, 06c §1, 10b; OV M2 §1–3) — đầu trang nút cố định + ⋯, ba tab
 * Học viên · Ý thức & Phối hợp · Phân tích lớp (bỏ tab Giáo viên: phân công ở ⋯ › Thông tin lớp), bảng điểm cả lớp cuối trang mở sẵn.
 * Tab và chế độ xem nằm trên URL (`?tab=`, `?che-do=`). Một panel một lúc (G-8): `viec` giữ đúng MỘT việc đang mở.
 */
export default function ClassOverviewPage() {
  const { classId } = useParams();
  const { homNay } = useNgayNghiepVu();
  const [params, setParams] = useSearchParams();
  const cheDoUrl = params.get('che-do');
  const cheDo: CheDoHocVien = cheDoUrl === 'can-ho-tro' || cheDoUrl === 'ket-qua' || cheDoUrl === 'thong-tin' ? cheDoUrl : 'diem';
  const vai = vaiXemHocVien(useSession().session?.roles);
  const periods = usePeriods();
  const [periodId, setPeriodId] = useState<number | null>(null);
  const [viec, setViec] = useState<ViecDauTrang | null>(null);
  /** P9a: panel Xét lại lộ trình — `studentId` null = cả lớp (việc), số = một em (chip trên dòng). */
  const [xetLai, setXetLai] = useState<{ studentId: number | null } | null>(null);
  const [moChon, setMoChon] = useState(false);
  /** PR-DL → PR-OV3a: khối "Điểm Test của lớp" cuối trang — mở sẵn, vẫn thu gọn được. UI-HO-SO-LOP: GIỮ vị trí V4 ([XM] truy vết V5 ghi "gập, chỉ tab Học viên"). */
  /* UI-HO-SO-LOP (chủ SP 23/10, [XM] T6): khối điểm GẬP sẵn, nhớ lần mở / gập (máy này). */
  const [moDiem, setMoDiem] = useState(() => { try { return localStorage.getItem('pisa.khoiDiemLop') === '1'; } catch { return false; } });
  useEffect(() => { try { localStorage.setItem('pisa.khoiDiemLop', moDiem ? '1' : '0'); } catch { /* chế độ riêng tư */ } }, [moDiem]);
  /** PR-CT: panel Bàn giao mở kèm môn (GVBM) và/hoặc đúng một lệnh (từ hồ sơ HV). */
  const [bg, setBg] = useState<{ mon: string | null; lenhId: number | null; lop: number | null }>({ mon: null, lenhId: null, lop: null });
  /* PR-B: panel bàn giao khi đổi GV đang mở (id việc). */
  const [bgGv, setBgGv] = useState<number | null>(null);
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
  /* P9a: em có dòng Xét lại → chip "Xét lại" trên dòng em — chỉ gọi khi người xem là QL (`coTheChuyenTiep` = cùng luật ra quyết định) hoặc GVCN lớp này. */
  const xemXl = !!data && (data.viewer.coTheChuyenTiep || data.viewer.isCoreTeacher);
  const xl = useApi<{ em: EmXetLai[] }>(classId && xemXl ? duongXetLai(Number(classId)) : null, [classId, xemXl]);
  const coXetLai = new Set((xl.data?.em ?? []).filter((e) => !e.quyetDinh).map((e) => e.studentId));

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
    /* P9b: lớp thường — link cũ `?viec=lo-trinh-ca-lop | chuyen-tiep | ky-vong`, `?che-do=lo-trinh`, `?tab=dau-ra` → trang con Cuối khoá (`?xem=cuoi-khoa`,
       giữ `&em=`). R5.3: lớp FT không còn panel "Chuyển tiếp lớp" — `?viec=chuyen-tiep` (badge Xếp lớp, Hết khoá, yêu cầu duyệt) mở tab Học viên, bật sẵn chọn nhiều (› Chuyển lớp…). */
    const thuongV = data?.programme?.scoringMode === 'ratio';
    if (data && thuongV && (v === 'chuyen-tiep' || v === 'lo-trinh-ca-lop' || v === 'ky-vong' || params.get('che-do') === 'lo-trinh' || params.get('tab') === 'dau-ra')) {
      doiThamSo({ viec: null, tab: null, 'che-do': null, xem: 'cuoi-khoa' });
    } else if (data && v === 'chuyen-tiep') {
      doiThamSo({ viec: null, tab: null, 'che-do': null });
      setMoChon(true);
    } else if (data && v === 'phan-cong' && (data.viewer.canAssign || data.viewer.canAssignSubject)) {
      setViec(v);
      doiThamSo({ viec: null });
    } else if (data && v === 'xet-lai') {
      /* P9a: việc QL "Xét lại lộ trình · {lớp} · n em" → panel Xét lại cả lớp. Trang này là lớp em ĐANG học (QL chi nhánh lớp này);
         máy chủ lọc theo quyền, người không có quyền thấy "Không còn em cần xét lại." */
      setXetLai({ studentId: null });
      doiThamSo({ viec: null });
    } else if (data && v === 'ban-giao') {
      /* PR-CT: việc Bàn giao (Công việc) và nút ở hồ sơ HV — `?viec=ban-giao[&mon=][&lenh=]`. Máy chủ chặn người không có quyền đọc phiếu. */
      setBg({ mon: params.get('mon'), lenhId: Number(params.get('lenh')) || null, lop: null });
      setViec('ban-giao');
      doiThamSo({ viec: null, mon: null, lenh: null });
    } else if (data && v === 'ban-giao-gv' && Number(params.get('id'))) {
      /* PR-B: việc / thông báo bàn giao khi đổi GV — `?viec=ban-giao-gv&id=`. Máy chủ chặn người không có quyền đọc. */
      setBgGv(Number(params.get('id')));
      doiThamSo({ viec: null, id: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const doiThamSo = (patch: Record<string, string | null>, moi = false) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) { if (v === null) next.delete(k); else next.set(k, v); }
    setParams(next, { replace: !moi });
  };

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={8} />;

  /* PR-TK: lớp đã kết thúc có thêm tab "Tổng kết" — đứng đầu và là tab mở mặc định (tab khác phải ghi rõ trên URL). */
  const daKetThuc = data.status === 'finished';
  const thuong = data.programme?.scoringMode === 'ratio';
  const tab: TabHoSoLop = tabMacDinhLop(params.get('tab'), daKetThuc);
  const tabMacDinh = tabMacDinhLop(null, daKetThuc);
  const dsTab = tabHienCuaLop(daKetThuc);
  const dong = () => setViec(null);
  /* P9b: lớp thường — ⋯ Cuối khoá… / dải nhắc / việc mở trang con Cuối khoá (G5: bảng rộng nhiều cột), không panel. FT không còn Chuyển tiếp lớp (R5.3). */
  const moViec = (v: ViecDauTrang) => {
    if (v === 'lo-trinh-ca-lop' || v === 'chuyen-tiep') { if (thuong) doiThamSo({ tab: null, 'che-do': null, xem: 'cuoi-khoa' }, true); }   // push: ‹ về đúng hồ sơ lớp
    else setViec(v);
  };
  const xong = () => { invalidate('/classes'); invalidate('/hoc-vien-lop'); reload(); xl.reload(); };
  const ctxXetLai = { co: coXetLai, mo: (sid: number) => setXetLai({ studentId: sid }) };
  const panelXetLai = xetLai && <PanelXetLai classId={data.id} studentId={xetLai.studentId} onClose={() => setXetLai(null)} onDone={xong} />;
  if (params.get('xem') === 'cuoi-khoa' && thuong && !data.lienTuc) {
    return (
      <XetLaiCtx.Provider value={ctxXetLai}>
        <CuoiKhoaLop key={data.id} classId={data.id} theoVai={!!vai} emMo={Number(params.get('em')) || null} onDaMoEm={() => doiThamSo({ em: null })} />
        {panelXetLai}
      </XetLaiCtx.Provider>
    );
  }

  return (
    <XetLaiCtx.Provider value={ctxXetLai}>
    <div className="page space-y-4 max-sm:space-y-3">
      <DauTrangLop data={data} onViec={moViec} thanhViec={!daKetThuc && <ThanhViecLop classId={data.id} onDoi={xong} />}
        onBanGiao={(o) => { setBg({ mon: o.mon ?? null, lenhId: null, lop: o.lop ?? null }); setViec('ban-giao'); }} onBanGiaoGv={setBgGv} />

      <HangTab v8 ariaLabel={t('Hồ sơ lớp')} value={tab}
        onChange={(k: TabHoSoLop) => doiThamSo({ tab: k === tabMacDinh ? null : k, 'che-do': null })}
        tabs={dsTab.map((k) => ({ key: k, label: TAB_HO_SO_LOP_NHAN[k], canhBao: k === 'y-thuc' && data.canhBaoYThuc > 0 }))} />

      {tab === 'tong-ket' && <TabTongKetLop classId={data.id} />}
      {tab === 'hoc-vien' && (
        <TabHocVienLop lop={data} cheDo={cheDo} moChon={moChon} onCheDo={(m) => doiThamSo({ 'che-do': m === 'diem' ? null : m, em: null, tuan: null })}
          onDoi={xong} onThemHocVien={() => setViec('hoc-vien')} />
      )}
      {tab === 'y-thuc' && <ClassYThucCard classId={data.id} thuong={thuong} />}
      {tab === 'phan-tich' && <PhanTichLopTab classId={data.id} />}

      {data.viewer.coTheXemDiem && <KhoiDiemLop key={data.id} classId={data.id} thuong={thuong} mo={moDiem} onDoi={() => setMoDiem((m) => !m)} />}

      {panelXetLai}
      {viec === 'lich-su' && <LichSuThayDoi loai="lop" id={data.id} dong2={[data.code]} onClose={dong} />}
      {viec === 'lich-su-gop-y' && <LichSuThayDoi loai="gop-y" id={data.id} dong2={[t('Góp ý hàng tuần'), data.code]} onClose={dong} />}
      {viec === 'ban-giao' && <BanGiaoPanel classId={bg.lop ?? data.id} mon={bg.mon} lenhId={bg.lenhId} onClose={dong} onDone={xong} />}
      {bgGv !== null && <BanGiaoGvPanel id={bgGv} onClose={() => setBgGv(null)} onDone={xong} />}
      {(viec === 'thong-tin' || viec === 'phan-cong') && (
        <ThongTinLopPanel lop={data} phan={viec === 'phan-cong' ? 'phan-cong' : null} onClose={dong} onDone={xong}
          onChuyenTiep={thuong && data.viewer.coTheChuyenTiep ? () => moViec('chuyen-tiep') : undefined} />
      )}
      {viec === 'xuat-mt' && (
        <NganXuatMt khung={thuong ? 'thuong' : 'ft'} lop={{ id: data.id, ma: data.code }} chiNhanh={data.branchId}
          thoiGianMacDinh={{ kieu: 'dot', dot: [...(thuong ? DOT_XUAT_THUONG : DOT_XUAT_FT)] }} onDong={dong} />
      )}
      {viec === 'xoa-lop' && <XoaLopPanel classId={data.id} classCode={data.code} onClose={dong} />}
      {viec === 'ket-thuc-lop' && (
        <KetThucLopPanel classId={data.id} classCode={data.code} onClose={dong} onDone={xong}
          diTiep={thuong && data.viewer.coTheChuyenTiep ? { nhan: t('Cuối khoá…'), onChon: () => { dong(); moViec('chuyen-tiep'); } } : undefined} />
      )}
      {viec === 'mo-lai-lop' && (
        /* HL-17: bỏ `tab=tong-ket` trước khi tải lại — lớp mở lại không còn tab Tổng kết (hết 404 nền). */
        <MoLaiLopPanel classId={data.id} classCode={data.code} chiNhanh={data.branchName} ketThuc={data.finishedAt ? ngay(data.finishedAt) : null} onClose={dong}
          onDone={() => { if (params.get('tab') === 'tong-ket') doiThamSo({ tab: null }); xong(); }} />
      )}
      {viec === 'sua-hoc-vien' && <SuaCaLopPanel classId={data.id} onClose={dong} onDone={xong} />}
      {viec === 'hoc-vien' && (
        <IntakePanel defaultClass={{ id: data.id, code: data.code }} onClose={dong} onDone={xong} />
      )}
      <QuickReport open={viec === 'case'} onClose={() => { dong(); setCaseFor(0); }} studentId={caseFor} lop={data.code}
        students={(roster.data ?? []).filter((r: any) => !r.archived).map((r: any) => ({ id: r.id, name: r.fullName, code: r.studentCode ?? null }))}
        onPickStudent={setCaseFor} onDone={() => { dong(); setCaseFor(0); xong(); }} />
    </div>
    </XetLaiCtx.Provider>
  );
}

/**
 * KHỐI "ĐIỂM MOCK TEST CỦA LỚP" (PR-DL, mockup `mockup-diem-theo-lop-2026-10-04.html` #v-lop) — cuối hồ sơ lớp, GẬP SẴN + nhớ trạng thái (chủ SP 23/10; trước: mở sẵn PR-OV3a):
 * hàng tiêu đề + MỘT chip "MT2 còn 3 ô trống" (lượt mở sẵn của `danhSachLuot`); bấm hàng tiêu đề thu gọn (CA2-10: không ghi chữ "bấm để…"). Bảng `DiemTheoLop gon` tải khi khối mở.
 */
function KhoiDiemLop({ classId, thuong, mo, onDoi }: { classId: number; thuong: boolean; mo: boolean; onDoi: () => void }) {
  const ds = useApi<DanhSachLuot>(duongDiemTheoLuot(classId), [classId]);
  const l = ds.data?.luot.find((x) => x.ma === ds.data?.macDinh);
  /* OV-10b: TVV / CX không nhập điểm — điểm vẫn hiện (chỉ đọc), bỏ chip "còn n ô trống". */
  const vai = vaiXemHocVien(useSession().session?.roles);
  /* Đã mở một lần thì giữ bảng gắn, thu gọn chỉ ẩn — gỡ bảng sẽ mất ô đang gõ / hộp lý do đang mở. */
  const [daMo, setDaMo] = useState(mo);
  if (mo && !daMo) setDaMo(true);
  return (
    <section className="card">
      <h2 className="m-0 text-[15px] font-semibold text-slate-100">
        <button id="khoi-diem-lop-nut" type="button" aria-expanded={mo} aria-controls="khoi-diem-lop-bang" onClick={onDoi}
          className="flex w-full min-h-[44px] scroll-mt-4 flex-wrap items-center gap-x-2.5 gap-y-1 rounded-xl px-3 py-3 text-left sm:px-4">
          <span className="text-slate-400"><MuiTen mo={mo} /></span>
          <span>{thuong ? t('Điểm Test của lớp') : t('Điểm Mock Test của lớp')}</span>
          {l && l.oTrong > 0 && vai !== 'tvv' && vai !== 'cx' && <Nhan tone="muted">{t('{dot} còn {n} ô trống', { dot: dich(l.nhan), n: l.oTrong })}</Nhan>}
        </button>
      </h2>
      <div id="khoi-diem-lop-bang" hidden={!mo} className="px-3 pb-3 sm:px-4 sm:pb-4">
        {daMo && <DiemTheoLop classId={classId} gon />}
      </div>
    </section>
  );
}
