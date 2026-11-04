import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { api, invalidate } from '../../lib/api.ts';
import { BoLocDoan, Card, Empty, ErrorState, LoiTaiNho, Skeleton } from '../../ui/ui.tsx';
import { Menu } from '../../ui/Menu.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { ngay, type NhomEm } from '@shared/domain/index.ts';
import { usePanelYThuc, type PanelYThuc } from './panelYThuc.tsx';
import { ChiTietViPham } from './ChiTietViPham.tsx';
import { PhoiHopSosSection, type CoordTurn } from './PhoiHopSosSection.tsx';
import { NhanViPham } from './NhanViPham.tsx';
import { ThangYThuc } from './ThangYThuc.tsx';
import { BadgeViec, BangLichSu, BaoPhEm, ChipLoc, CanLamEm, DsViPhamCho, LanTruoc, TAG, type DongLs } from './khoiYThuc.tsx';
import { DUONG_LAM_MOI_Y_THUC, type BangLo, type BangYThucLop, type DongEm, type KqEm, type ViPhamV4, type XuLyView, type YThucHocVien } from './kieu.ts';
import { CO_LO, LoYThucPanel, guiTheoLo, type ViecLo } from './LoYThucPanel.tsx';
import { OChon, ThanhChonNhieu, useChonNhieu, type ChonNhieu } from '../students/chonNhieuHocVien.tsx';
import { PanelBaoPhTvv, gioVnNay, lucVn } from '../congViec/PanelBaoPhTvv.tsx';
import { PanelDuyet } from '../duyet/HopChoDuyet.tsx';
import type { WorkItem } from '../worklist/WorkList.tsx';
import { NutChu } from '../../ui/KhuonViec.tsx';
import { dich, dichChu, t } from '@shared/i18n/index.ts';

/**
 * TAB `Ý THỨC & PHỐI HỢP` CỦA HỒ SƠ LỚP — UI-2 (mockup `thiet-ke/audit-0311/u10-y-thuc.html` K1 · K2 · K4 · K6 · K8, chủ SP duyệt 03/11;
 * cùng thành phần với tab hồ sơ HV — `khoiYThuc.tsx`, chủ SP 03/11: hai tab đồng bộ).
 *
 *   Đầu thẻ: phân đoạn `Vi phạm | Phối hợp SOS` · trong Vi phạm `Cần làm | Lịch sử` · phải: Điểm Mock Test › · + Ghi vi phạm · Khai / sửa cấp bậc · Chọn nhiều.
 *   Cần làm: bảng 6 cột (Học viên · Vi phạm chờ · Cần làm · Bậc · Báo PH (TVV) · Việc) theo nhóm Bắt buộc xử lý › Mới, chưa xem › Chờ QL duyệt
 *     (đề xuất + xin thu hồi) › Chờ TVV báo PH › Đã xử lý · 7 ngày. Cột Việc MỘT nút chính (+ nút chữ phụ). Chi tiết em mở NGAY dưới hàng:
 *     Vi phạm của lần này · Lần xử lý (Thang ›) · Báo PH. Sau "Đã xem" hàng ở lại (Hoàn tác · Xem lại); sau Xác nhận xử lý hàng sáng xanh.
 *     Khung < 1220 px: mỗi em một thẻ (K2).
 *   Lịch sử (K6): lọc Đã xem · Đã xử lý · Đã thu hồi (có số) · phạm vi Lộ trình | Cả lịch sử (X08) · tìm em · nhóm vi phạm.
 *   Phối hợp SOS (K8): mọi lượt, đầu lượt một dòng.
 *
 * Việc / thông báo mở `?tab=y-thuc&hv={id}&mo=xu-ly` (hoặc `mo=khai`, `mo=da-thuc-hien&xl={id}`, `mo=cap-bac&em=…`) → mở sẵn hàng em + panel (một lần);
 * `?sub=phoi-hop` mở phân đoạn Phối hợp. GVBM (K2-39): đọc được, không nút xử lý; vẫn có `+ Ghi vi phạm`.
 */
/** `thuong`: lớp thường — "Phối hợp" (không có chữ SOS); lớp FT: "Phối hợp SOS" (chủ sản phẩm 02/10). `onDiemMt`: sang tab Học viên, mở bảng điểm (#29). */
export function ClassYThucCard({ classId, thuong = false, onDiemMt }: { classId: number; thuong?: boolean; onDiemMt?: () => void }) {
  const { homNay } = useNgayNghiepVu();
  const toast = useToast();
  const toi = useSession().session?.user?.id ?? null;
  const [params, setParams] = useSearchParams();
  /* Phạm vi Lịch sử (X08) lọc tại trình duyệt theo cờ `trongChuoi` — đổi không đọc lại bảng lớp. */
  const [phamVi, setPhamVi] = useState<'chuoi' | 'tat-ca'>('chuoi');
  const board = useApi<BangYThucLop>(`/classes/${classId}/y-thuc`, [classId], { giuCu: true });
  const roster = useApi<any[]>(`/classes/${classId}/roster`);
  const [includeDone, setIncludeDone] = useState(false);
  const coord = useApi<{ rows: CoordTurn[]; pendingCount: number }>(`/classes/${classId}/phoi-hop-sos${includeDone ? '?includeDone=1' : ''}`, [classId, includeDone]);
  /* Phân đoạn ghi vào địa chỉ (`sub`, `doan`) — sang hồ sơ em rồi Quay lại về đúng chỗ. */
  const phan: 'vi-pham' | 'phoi-hop' = params.get('sub') === 'phoi-hop' ? 'phoi-hop' : 'vi-pham';
  const doan: 'can-lam' | 'lich-su' = params.get('doan') === 'lich-su' ? 'lich-su' : 'can-lam';
  const doiDoan = (o: { phan?: 'vi-pham' | 'phoi-hop'; doan?: 'can-lam' | 'lich-su' }) => {
    const q = new URLSearchParams(params);
    if (o.phan) { if (o.phan === 'phoi-hop') q.set('sub', 'phoi-hop'); else q.delete('sub'); }
    if (o.doan) { if (o.doan === 'lich-su') q.set('doan', 'lich-su'); else q.delete('doan'); }
    setParams(q, { replace: true });
  };
  const setPhan = (p: 'vi-pham' | 'phoi-hop') => doiDoan({ phan: p });
  const setDoan = (x: 'can-lam' | 'lich-su') => doiDoan({ doan: x });
  const [loc, setLoc] = useState<LocLs>('tat-ca');
  const [tim, setTim] = useState('');
  /* "Lịch sử của em ›": lọc đúng một em (theo id, không theo chuỗi tên). */
  const [lsEm, setLsEm] = useState<{ id: number; ten: string } | null>(null);
  const [moHv, setMoHv] = useState<number | null>(() => Number(params.get('hv')) || null);
  const [moLsId, setMoLsId] = useState<number | null>(null);
  const chonN = useChonNhieu();
  const lo = useApi<BangLo>(chonN.bat ? `/classes/${classId}/y-thuc/lo` : null, [chonN.bat, classId]);
  const [loMo, setLoMo] = useState<{ viec: ViecLo; ids: number[] | null } | null>(null);
  const [ghiNhanKq, setGhiNhanKq] = useState<KqEm[] | null>(null);
  const [busyLo, setBusyLo] = useState(false);
  const [baoPh, setBaoPh] = useState<DongEm | null>(null);
  const [duyet, setDuyet] = useState<{ id: number; thuHoi: boolean; moSan: 'duyet' | 'tu-choi' } | null>(null);
  const [lanTai, setLanTai] = useState(0);
  const [dangGhi, setDangGhi] = useState<number | null>(null);
  /* F03 (mockup K1): em vừa "Đã xem" — hàng ở lại nhóm Mới (Hoàn tác · Xem lại), không chỉ toast. */
  const [vuaXem, setVuaXem] = useState<Record<number, { x: DongEm; ids: number[]; luc: string }>>({});
  /* Dòng Lịch sử vừa thao tác (đến từ "Xem lại") — sáng + "vừa xong". */
  const [lsVua, setLsVua] = useState<number[]>([]);
  /* Em vừa Xác nhận xử lý (K1 Trung Anh): hàng sáng xanh, Cần làm "Đã xử lý hh:mm · vừa lưu". */
  const [vuaLuu, setVuaLuu] = useState<{ sid: number; luc: string } | null>(null);
  const dangXuLy = useRef<number | null>(null);

  const lamMoi = () => { board.reload(); lo.reload(); setLanTai((x) => x + 1); };
  const { mo: moPanel, panels } = usePanelYThuc({
    maLop: board.data?.classCode ?? null,
    onDone: () => { if (dangXuLy.current) setVuaLuu({ sid: dangXuLy.current, luc: gioVnNay() }); lamMoi(); },
    roster: (roster.data ?? []).map((r: any) => ({ id: r.id, name: r.fullName, code: r.studentCode ?? null })),
  });
  /* Chỉ Xác nhận xử lý (không phải Đề xuất) làm hàng sáng "vừa lưu". */
  const mo = (p: PanelYThuc) => { dangXuLy.current = p?.loai === 'xu-ly' && p.cheDo !== 'de-xuat' ? p.studentId : null; moPanel(p); };

  /* Việc / thông báo: `?hv=` mở sẵn hàng em, `?mo=` mở panel đúng một lần rồi gỡ khỏi địa chỉ (quay lại không mở lại). */
  useEffect(() => {
    const hv = Number(params.get('hv')) || null;
    const moGi = params.get('mo');
    if (hv) setMoHv(hv);
    if (hv && moGi === 'xu-ly') mo({ loai: 'xu-ly', studentId: hv });
    if (hv && moGi === 'khai') mo({ loai: 'khai', studentId: hv });   // PR-VAI-a (K1-15): việc "Xác nhận cấp bậc vi phạm HV cũ"
    const xl = Number(params.get('xl')) || null;
    if (moGi === 'da-thuc-hien' && xl) mo({ loai: 'da-thuc-hien', id: xl });
    /* Rà #408 (5): đúng các em của việc "Xác nhận cấp bậc" (em mới vào web) — không phải mọi em chưa xác nhận của lớp. */
    if (moGi === 'cap-bac') {
      /* KHAI-BAC-LO: không kèm `em` → mọi em của lớp (nút "Khai / sửa cấp bậc"). */
      const em = (params.get('em') ?? '').split(',').map(Number).filter((x) => x > 0);
      setLoMo({ viec: 'cap-bac', ids: em.length ? em : null });
    }
    if (moGi || params.get('loc')) {
      const p = new URLSearchParams(params); p.delete('mo'); p.delete('xl'); p.delete('loc'); p.delete('em');
      setParams(p, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.get('hv'), params.get('mo')]);

  const d = board.data;
  /* Mở từ việc: cuộn tới hàng em khi bảng đã có. */
  const daCuon = useRef(false);
  useEffect(() => {
    if (!d || daCuon.current) return;
    daCuon.current = true;
    if (moHv) cuonToi(document.getElementById(`yt-em-${moHv}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d]);

  const nhomHang = useMemo(() => {
    if (!d) return null;
    const gan = (ds: DongEm[], k: KieuHang) => ds.map((x) => ({ x, k }));
    const conMoi = new Set(d.nhom.moi.map((x) => x.studentId));
    /* Em vừa "Đã xem" đã rời nhóm Mới ở máy chủ — giữ hàng (bản chụp) đúng chỗ, xếp theo tên như mockup. */
    const vua = Object.entries(vuaXem).filter(([sid]) => !conMoi.has(Number(sid))).map(([, v]) => ({ x: v.x, k: 'vua_xem' as KieuHang }));
    return {
      batBuoc: [...gan(d.nhom.qua_han, 'qua_han'), ...gan(d.nhom.bat_buoc, 'bat_buoc')],
      moi: [...gan(d.nhom.moi, 'moi'), ...vua].sort((a, b) => a.x.ten.localeCompare(b.x.ten, 'vi')),
      /* K4: xin thu hồi (chờ QL) vào nhóm Chờ QL duyệt — cả em vừa xử lý trong 7 ngày. */
      choDuyet: [...gan(d.nhom.cho_duyet, 'cho_duyet'), ...gan([...d.nhom.da_xu_ly.filter((x) => x.thuHoi?.cho), ...d.choThuHoi], 'thu_hoi')],
      choBaoPh: gan(d.choBaoPh, 'cho_bao_ph'),
      daXuLy: gan(d.nhom.da_xu_ly.filter((x) => !x.thuHoi?.cho), 'da_xu_ly'),
    };
  }, [d, vuaXem]);
  if (board.error && !d) return <ErrorState message={board.error.message} hint={board.error.hint} status={board.error.status} onRetry={board.reload} />;
  if (!d || !nhomHang) return <Card title={t('Ý thức & Phối hợp')}><Skeleton rows={4} /></Card>;

  /* OV-13d: em chưa có vi phạm nhưng còn phải xác nhận cấp bậc (em mới vào web) — chỉ hiện khi Chọn nhiều. */
  const chuaKhai = (lo.data?.em ?? []).filter((x) => !x.nhom && x.capBac.duoc && x.capBac.khai === null);
  const daChon = (lo.data?.em ?? []).filter((x) => chonN.chon.has(x.studentId));
  const dem = (v: ViecLo) => daChon.filter((x) => (v === 'xu-ly' ? x.xuLy : v === 'ghi-nhan' ? x.ghiNhan : x.capBac).duoc).length;
  /* Đã xem theo lô là việc ngắn: làm ngay từ thanh, không panel; Hoàn tác = Bỏ xem đúng các vi phạm vừa xem. */
  const ghiNhanLo = async () => {
    setBusyLo(true);
    const tatCa: KqEm[] = [];
    try {
      await guiTheoLo(daChon.filter((x) => x.ghiNhan.duoc).map((x) => x.studentId), CO_LO['ghi-nhan'],
        (lo) => api.post<{ em: KqEm[] }>(`/classes/${classId}/y-thuc/lo/ghi-nhan`, { studentIds: lo }), (em) => { tatCa.push(...em); setGhiNhanKq([...tatCa]); });
    } catch (e: any) { toast.push('error', e.message); } finally {
      setBusyLo(false);
      const loi = tatCa.filter((x) => !x.ok);
      if (loi.length) toast.push('error', loi.map((x) => `${x.ten}: ${x.loi ? dichChu(x.loi) : ''}`).join(' · '));
      DUONG_LAM_MOI_Y_THUC.forEach((x) => invalidate(x));
      lamMoi();
    }
  };
  const hoanTacGhiNhan = async () => {
    const ok = (ghiNhanKq ?? []).filter((x) => x.ok && x.ids?.length);
    setBusyLo(true);
    const r = await Promise.allSettled(ok.map((x) => api.post(`/students/${x.studentId}/y-thuc/bo-ghi-nhan`, { violationIds: x.ids })));
    setBusyLo(false);
    if (r.some((x) => x.status === 'rejected')) toast.push('error', t('{n} em chưa hoàn tác được — thử lại.', { n: r.filter((x) => x.status === 'rejected').length }));
    setGhiNhanKq(null);
    DUONG_LAM_MOI_Y_THUC.forEach((x) => invalidate(x));
    lamMoi();
  };
  const okGhiNhan = (ghiNhanKq ?? []).filter((x) => x.ok);

  /* Đã xem / Bỏ xem (N34 — trước là "Ghi nhận"; OV-7a: bấm nhầm → vi phạm về Mới) — một hoặc nhiều vi phạm của MỘT em; nút của em đang gửi bị khoá. */
  const daXem = async (x: DongEm | null, studentId: number, ids: number[], bo = false) => {
    setDangGhi(studentId);
    try {
      await api.post(`/students/${studentId}/y-thuc/${bo ? 'bo-ghi-nhan' : 'ghi-nhan'}`, { violationIds: ids });
      DUONG_LAM_MOI_Y_THUC.forEach((p) => invalidate(p));
      setVuaXem((c) => {
        const { [studentId]: _cu, ...con } = c;
        return bo || !x ? con : { ...con, [studentId]: { x: { ...x, viPhamCho: x.viPhamCho.filter((v) => ids.includes(v.id)) }, ids, luc: gioVnNay() } };
      });
      if (bo) { toast.push('ok', t('Đã bỏ xem')); setLsVua((c) => c.filter((id) => !ids.includes(id))); }
      lamMoi();
    } catch (e: any) { toast.push('error', e.message); }
    finally { setDangGhi(null); }
  };
  const xemLai = (ids: number[]) => { doiDoan({ phan: 'vi-pham', doan: 'lich-su' }); setLoc('da-xem'); setTim(''); setLsEm(null); setLsVua(ids); };
  const lichSuEm = (x: DongEm) => { doiDoan({ phan: 'vi-pham', doan: 'lich-su' }); setLoc('tat-ca'); setTim(''); setLsEm({ id: x.studentId, ten: x.ten }); };

  /* ---------------- Lịch sử (mockup K6) — cùng loại dòng với tab HV ---------------- */
  const moiNhatXong = new Map<number, number>();
  for (const x of d.dongThoiGian) if (x.loai === 'xu-ly' && x.status === 'done' && !moiNhatXong.has(x.studentId)) moiNhatXong.set(x.studentId, x.id);
  const timChu = tim.trim().toLocaleLowerCase('vi');
  const dongLs: DongLs[] = d.dongThoiGian
    .filter((x) => (x.loai === 'xu-ly' || x.trangThai === 'da_ghi_nhan') && (phamVi === 'tat-ca' || x.trongChuoi !== false) && (!lsEm || x.studentId === lsEm.id))
    /* Ô "Tìm em" (K6) khớp tên em, tên vi phạm / lần xử lý và tên nhóm — thay ô chọn nhóm của Nhật ký cũ (mockup không vẽ). */
    .filter((x) => !timChu || [x.ten, x.loai === 'vi-pham' ? `${x.viPham} ${dich(x.nhom)}` : dich(x.nhan)].join(' ').toLocaleLowerCase('vi').includes(timChu))
    .map((x): DongLs => {
      const ten = <Link to={`/hoc-vien/${x.studentId}?tab=y-thuc`} className="no-underline hover:text-[color:var(--accent)] hover:underline">{x.ten}</Link>;
      if (x.loai === 'xu-ly') {
        const xong = x.status === 'done', thuHoi = x.status === 'thu_hoi';
        const thuHoiDuoc = d.canManage && xong && moiNhatXong.get(x.studentId) === x.id;
        return {
          key: `x${x.id}`, ngay: x.ngay, ten, tong: xong ? 'xong' : thuHoi ? 'xam' : 'dang', loai: xong ? t('Đã xử lý') : thuHoi ? t('Đã thu hồi') : dich(x.statusLabel),
          kieu: xong ? 'xu-ly' : thuHoi ? 'thu-hoi' : 'khac', tieuDe: dich(x.nhan), ai: x.nguoi, luc: null,
          truong: [
            [t('Vi phạm'), x.tenViPham.length ? x.tenViPham.join(', ') : t('{soViPham} vi phạm', { soViPham: x.soViPham })],
            ...(x.baoPh ? [[t('Báo PH'), x.baoPh.trangThai === 'xong' ? (x.baoPh.ngay ? t('đã báo {ngay}', { ngay: ngay(x.baoPh.ngay, homNay) }) : t('Đã báo PH'))
              : x.baoPh.trangThai === 'bo' ? (thuHoi ? t('đã bỏ theo thu hồi') : t('đã bỏ')) : t('chưa báo')] as [string, string]] : []),
            ...(x.soTep ? [[t('Bằng chứng'), t('{soTep} tệp', { soTep: x.soTep })] as [string, string]] : []),
          ],
          /* Mockup K6: lần mới nhất của em (còn thu hồi được) ghi "Thu hồi…" — cùng mở Xem lần xử lý, nơi có nút Thu hồi (máy chủ quyết). */
          cuoi: <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" aria-label={`${thuHoiDuoc ? t('Thu hồi…') : t('Xem lần xử lý')} · ${x.ten} · ${dich(x.nhan)}`}
            onClick={() => mo({ loai: 'xem', id: x.id })}>{thuHoiDuoc ? t('Thu hồi…') : t('Xem')}</button>,
        };
      }
      return {
        key: `v${x.id}`, ngay: x.ngay, ten, tong: 'xam', loai: t('Đã xem'), kieu: 'xem', tieuDe: x.viPham,
        mo: moLsId === x.id, onMo: () => setMoLsId((c) => (c === x.id ? null : x.id)),
        chiTiet: <ChiTietViPham violationId={x.id} onSua={(vv) => mo({ loai: 'sua', v: vv, studentName: x.ten })} onDaXoa={() => { setMoLsId(null); lamMoi(); }} onMoXuLy={(id) => mo({ loai: 'xem', id })} />,
        truong: [],   // K6: dòng Đã xem chỉ tên vi phạm — nhóm, người ghi xem khi mở dòng
        ai: x.xemBoi, luc: x.xemLuc ? lucVn(x.xemLuc) : null, vua: lsVua.includes(x.id),
        cuoi: d.canManage ? <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={dangGhi === x.studentId} aria-label={`${t('Bỏ xem')} · ${x.ten} · ${x.viPham}`}
          onClick={() => void daXem(null, x.studentId, [x.id], true)}>{t('Bỏ xem')}</button> : null,
      };
    });
  const soLs = { 'da-xem': dongLs.filter((x) => x.kieu === 'xem').length, 'da-xu-ly': dongLs.filter((x) => x.kieu === 'xu-ly').length, 'thu-hoi': dongLs.filter((x) => x.kieu === 'thu-hoi').length };
  const hienLs = dongLs.filter((x) => loc === 'tat-ca' || x.kieu === KIEU_LOC[loc]);
  /* Đếm Lịch sử của một em (chi tiết em: "Đã xử lý n · Đã xem n") — từ dòng thời gian đã nạp, không thêm request. */
  const demEm = (sid: number) => ({
    xuLy: d.dongThoiGian.filter((x) => x.studentId === sid && x.loai === 'xu-ly' && x.status === 'done').length,
    xem: d.dongThoiGian.filter((x) => x.studentId === sid && x.loai === 'vi-pham' && x.trangThai === 'da_ghi_nhan').length,
  });

  const ctx: NguCanh = { homNay, canManage: d.canManage, coTheDuyet: d.coTheDuyet, gvcn: d.gvcn, chonN, dangGhi, vuaLuu, mo, onDaXem: (x, ids) => void daXem(x, x.studentId, ids), onBaoPh: setBaoPh, onDuyet: setDuyet,
    onHoanTac: (sid) => { const v = vuaXem[sid]; if (v) void daXem(null, sid, v.ids, true); }, onXemLai: xemLai };
  const hang = (ds: { x: DongEm; k: KieuHang }[]) => ds.map(({ x, k }) => (
    <HangEm key={`${k}${x.studentId}`} x={x} k={k} c={ctx} vua={vuaXem[x.studentId]}
      mo={moHv === x.studentId && k !== 'vua_xem'} onMo={() => setMoHv((c) => (c === x.studentId ? null : x.studentId))}
      chiTiet={moHv === x.studentId && k !== 'vua_xem' ? (
        <ChiTietEm x={x} k={k} lanTai={lanTai} c={ctx} dem={demEm(x.studentId)} toi={toi} onLamMoi={lamMoi} onLichSu={() => lichSuEm(x)} />
      ) : null} />
  ));
  const soVp = (ds: { x: DongEm }[]) => ds.reduce((s, { x }) => s + x.viPhamCho.length, 0);
  const soCanLam = nhomHang.batBuoc.length + nhomHang.moi.length + nhomHang.choDuyet.length + nhomHang.choBaoPh.length;
  const coHang = soCanLam + nhomHang.daXuLy.length > 0;
  const tenPhoiHop = thuong ? t('Phối hợp') : t('Phối hợp SOS');
  const nutGhi = d.canRecord && <button type="button" className="btn btn-primary h-9 max-sm:h-11 max-sm:flex-1" onClick={() => mo({ loai: 'ghi', studentId: 0 })}>{t('+ Ghi vi phạm')}</button>;
  const batChon = () => { chonN.batTat(); setGhiNhanKq(null); };

  return (
    <Card bodyClass="p-0 [container-type:inline-size]">
      <h2 className="sr-only">{t('Ý thức & Phối hợp')}</h2>
      {/* Mockup K1 `.cong-cu`: phân đoạn trái · thao tác phải; 375 (K2): + Ghi vi phạm rộng + ⋯, phân đoạn mỗi cái một hàng. */}
      <div className="flex flex-wrap items-center gap-2.5 border-b px-4 py-3 max-sm:px-3" style={{ borderColor: 'var(--line)' }}>
        <BoLocDoan v8 giuSo ariaLabel={t('Phần')} value={phan} onChange={setPhan}
          muc={[{ key: 'vi-pham', nhan: t('Vi phạm') }, { key: 'phoi-hop', nhan: tenPhoiHop, so: coord.data?.pendingCount ?? null }]} />
        {phan === 'vi-pham' && (
          <BoLocDoan v8 giuSo ariaLabel={t('Vi phạm')} value={doan} onChange={setDoan}
            muc={[{ key: 'can-lam', nhan: t('Cần làm'), so: t('{n} HV', { n: soCanLam }) }, { key: 'lich-su', nhan: t('Lịch sử'), so: dongLs.length }]} />
        )}
        {phan === 'vi-pham' && doan === 'lich-su' && (
          <ChipLoc ariaLabel={t('Lọc lịch sử')} value={loc} onChange={setLoc}
            muc={[{ key: 'tat-ca', nhan: t('Tất cả'), so: dongLs.length }, { key: 'da-xem', nhan: t('Đã xem'), so: soLs['da-xem'] },
              { key: 'da-xu-ly', nhan: t('Đã xử lý'), so: soLs['da-xu-ly'] }, { key: 'thu-hoi', nhan: t('Đã thu hồi'), so: soLs['thu-hoi'] }]} />
        )}
        <span className="ml-auto flex flex-wrap items-center gap-2 max-sm:order-first max-sm:ml-0 max-sm:w-full">
          {phan === 'phoi-hop' ? (
            <>
              {/* X08: Phối hợp luôn là mọi lượt (không theo phạm vi Lịch sử). */}
              <span className="text-[13px] text-slate-400">{t('mọi lượt')}</span>
              <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setIncludeDone((v) => !v)}>
                {includeDone ? t('Chỉ hiện lượt chưa xong') : t('Hiện cả lượt đã xong')}
              </button>
            </>
          ) : doan === 'lich-su' ? (
            <>
              <BoLocDoan v8 ariaLabel={t('Phạm vi')} value={phamVi} onChange={setPhamVi}
                muc={[{ key: 'chuoi', nhan: thuong ? t('Lớp thường') : t('Lộ trình') }, { key: 'tat-ca', nhan: t('Cả lịch sử') }]} />
              {lsEm ? (
                <button type="button" className="btn h-9 max-sm:h-11" aria-label={`${t('Bỏ lọc em')} · ${lsEm.ten}`} onClick={() => setLsEm(null)}>{lsEm.ten} ×</button>
              ) : (
                <input type="search" className="field h-9 w-[200px] py-1 max-sm:h-11 max-sm:w-auto max-sm:flex-1" aria-label={t('Tìm em')} placeholder={t('Tìm em')} value={tim} onChange={(e) => setTim(e.target.value)} />
              )}
            </>
          ) : (
            <>
              {onDiemMt && <button type="button" className="link appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold max-sm:hidden" onClick={onDiemMt}>{thuong ? t('Điểm Test ›') : t('Điểm Mock Test ›')}</button>}
              {nutGhi}
              {d.canManage && (
                <>
                  {/* KHAI-BAC-LO: một panel mọi em của lớp — không cần Chọn nhiều trước. */}
                  <button type="button" className="btn h-9 max-sm:hidden" onClick={() => setLoMo({ viec: 'cap-bac', ids: null })}>{t('Khai / sửa cấp bậc')}</button>
                  <button type="button" aria-pressed={chonN.bat} onClick={batChon}
                    className={`btn h-9 max-sm:hidden ${chonN.bat ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent)]' : ''}`}>
                    {chonN.bat ? '✓ ' : ''}{t('Chọn nhiều')}
                  </button>
                  <span className="sm:hidden">
                    <Menu label="⋯" ariaLabel={t('Thêm thao tác')} className="btn h-11 min-w-[44px]" items={[
                      ...(onDiemMt ? [{ label: thuong ? t('Điểm Test ›') : t('Điểm Mock Test ›'), onClick: onDiemMt }] : []),
                      { label: t('Khai / sửa cấp bậc'), onClick: () => setLoMo({ viec: 'cap-bac', ids: null }) },
                      { label: chonN.bat ? t('Tắt chọn nhiều') : t('Chọn nhiều'), onClick: batChon },
                    ]} />
                  </span>
                </>
              )}
            </>
          )}
        </span>
      </div>

      {phan === 'phoi-hop' ? (
        <div className="px-4 pb-4 pt-3 max-sm:px-3">
          {coord.error ? <LoiTaiNho chu={t('Không tải được Phối hợp.')} onRetry={coord.reload} className="px-0 py-1" />
            : <PhoiHopSosSection turns={coord.data?.rows ?? null} loading={coord.loading} cot1="hocVien" xanh onChanged={() => { coord.reload(); }} />}
        </div>
      ) : doan === 'lich-su' ? (
        <BangLichSu dong={hienLs} coTen homNay={homNay}
          rong={<div className="p-4"><Empty title={loc === 'tat-ca' && !timChu ? t('Chưa có gì trong lịch sử') : t('Không có dòng nào khớp bộ lọc')} /></div>} />
      ) : !coHang && !(chonN.bat && chuaKhai.length) ? (
        <div className="p-4"><Empty title={t('Không em nào cần xử lý Ý thức')} hint={t('Vi phạm mới, việc bắt buộc và đề xuất chờ QL sẽ hiện ở đây.')} /></div>
      ) : (
        <div>
          <div aria-hidden className={`hidden border-b px-4 py-2 text-[13px] font-semibold text-slate-400 [@container(min-width:1220px)]:grid ${COT}`} style={{ borderColor: 'var(--line)' }}>
            <span>{t('Học viên')}</span><span>{t('Vi phạm chờ')}</span><span>{t('Cần làm')}</span><span>{t('Bậc')}</span><span>{t('Báo PH (TVV)')}</span><span>{t('Việc')}</span>
          </div>
          {nhomHang.batBuoc.length > 0 && (
            <NhomHang tong="bb" chu={t('Bắt buộc xử lý')} dem={t('{n} HV · {so} vi phạm', { n: nhomHang.batBuoc.length, so: soVp(nhomHang.batBuoc) })}
              luat={t('3 vi phạm trong tuần này + tuần trước — phải xử lý')}
              i={<NutLuat label={t('Luật bắt buộc xử lý')}>{t('≥ 3 vi phạm trong tuần này + tuần trước → phải xử lý; "Đã xem" không còn.')}</NutLuat>}>
              {hang(nhomHang.batBuoc)}
            </NhomHang>
          )}
          {nhomHang.moi.length > 0 && (
            <NhomHang chu={t('Mới, chưa xem')} dem={t('{n} HV · {so} vi phạm', { n: nhomHang.moi.length, so: soVp(nhomHang.moi) })} luat={t('chưa cần xử lý — xem trước hạn')}
              i={<NutLuat label={t('Đã xem là gì')}>{t('Đã xem: không lên bậc; vi phạm vẫn nằm trong 3 vi phạm / 2 tuần. Vi phạm nghiêm trọng: Xác nhận xử lý ngay.')}</NutLuat>}>
              {hang(nhomHang.moi)}
            </NhomHang>
          )}
          {nhomHang.choDuyet.length > 0 && (
            <NhomHang chu={t('Chờ QL duyệt')} dem={t('{n} HV', { n: nhomHang.choDuyet.length })}
              luat={d.coTheDuyet ? t('GVCN đề xuất hoặc xin thu hồi') : t('đã gửi QL — QL quyết')}>{hang(nhomHang.choDuyet)}</NhomHang>
          )}
          {nhomHang.choBaoPh.length > 0 && <NhomHang chu={t('Chờ TVV báo PH')} dem={t('{n} HV', { n: nhomHang.choBaoPh.length })} luat={t('việc của TVV')}>{hang(nhomHang.choBaoPh)}</NhomHang>}
          {chonN.bat && chuaKhai.length > 0 && (
            <NhomHang chu={t('Chưa xác nhận cấp bậc')} dem={t('{n} HV', { n: chuaKhai.length })}>
              {chuaKhai.map((x) => (
                <div key={x.studentId} className="flex min-h-[44px] items-center gap-2 border-b px-4" style={{ borderColor: 'var(--line)' }}>
                  <OChon chon={chonN} id={x.studentId} ten={x.ten} />
                  <span className="min-w-0 flex-1 truncate py-2.5 text-sm font-semibold text-slate-100">{x.ten}</span>
                </div>
              ))}
            </NhomHang>
          )}
          {nhomHang.daXuLy.length > 0 && <NhomHang tong="gap" chu={t('Đã xử lý · 7 ngày')} dem={t('{n} HV', { n: nhomHang.daXuLy.length })}>{hang(nhomHang.daXuLy)}</NhomHang>}
        </div>
      )}

      <ThanhChonNhieu chon={chonN}
        viec={[
          { key: 'xu-ly', nhan: t('Xác nhận xử lý · {n}', { n: dem('xu-ly') }), chinh: true, tat: !dem('xu-ly') },
          { key: 'ghi-nhan', nhan: t('Đã xem · {n}', { n: dem('ghi-nhan') }), tat: !dem('ghi-nhan') || busyLo },
          { key: 'cap-bac', nhan: t('Xác nhận cấp bậc · {n}', { n: dem('cap-bac') }), tat: !dem('cap-bac') },
        ]}
        onViec={(k) => (k === 'ghi-nhan' ? void ghiNhanLo() : setLoMo({ viec: k as ViecLo, ids: [...chonN.chon] }))}
        dongTren={okGhiNhan.length ? (
          <>
            <span className="font-semibold text-ok">✓ {t('Đã xem {so} vi phạm · {n} em', { so: okGhiNhan.reduce((s, x) => s + (x.ids?.length ?? 0), 0), n: okGhiNhan.length })}</span>
            <span className="flex-1" />
            <NutChu disabled={busyLo} onClick={() => void hoanTacGhiNhan()}>{t('Hoàn tác')}</NutChu>
          </>
        ) : undefined} />
      {loMo && (
        <LoYThucPanel classId={classId} lop={d.classCode} viec={loMo.viec} studentIds={loMo.ids}
          onClose={() => setLoMo(null)} onDone={lamMoi} />
      )}
      {baoPh?.baoPh && (
        /* Báo PH tại chỗ (TVV / QL) — cùng panel với Công việc; việc dựng từ hàng em. */
        <PanelBaoPhTvv key={baoPh.baoPh.id}
          it={{ viecId: baoPh.baoPh.id, studentId: baoPh.studentId, studentName: baoPh.ten, due: baoPh.baoPh.han, classCode: d.classCode } as WorkItem}
          onDong={() => setBaoPh(null)} onDaLam={lamMoi} onTiep={null} />
      )}
      {duyet && <PanelDuyetXuLy {...duyet} onDong={() => setDuyet(null)} onXong={(chu) => { if (chu) toast.push('ok', dich(chu)); setDuyet(null); DUONG_LAM_MOI_Y_THUC.forEach((x) => invalidate(x)); lamMoi(); }} />}
      {panels}
    </Card>
  );
}

/** Lọc Lịch sử (mockup K6): theo DÒNG — Đã xem = vi phạm đã xem · Đã xử lý / Đã thu hồi = lần xử lý. */
type LocLs = 'tat-ca' | 'da-xem' | 'da-xu-ly' | 'thu-hoi';
const KIEU_LOC = { 'da-xem': 'xem', 'da-xu-ly': 'xu-ly', 'thu-hoi': 'thu-hoi' } as const;
/** Kiểu hàng = nhóm của em + hai trạng thái giao diện (xin thu hồi chờ QL · vừa "Đã xem"). */
type KieuHang = NhomEm | 'thu_hoi' | 'cho_bao_ph' | 'vua_xem';
/** Vi phạm "chưa xong": còn chờ GV (Mới · Cần xử lý · Quá hạn) hoặc đang trong đề xuất chờ QL. */
const CHUA_XONG = new Set(['moi', 'can_xu_ly', 'qua_han', 'cho_duyet']);
const TT_KHOI: Partial<Record<KieuHang, string>> = { qua_han: 'qua_han', bat_buoc: 'can_xu_ly', cho_duyet: 'cho_duyet', moi: 'moi' };

/** Cuộn tới hàng — không trượt khi người dùng tắt chuyển động. */
const cuonToi = (el: Element | null | undefined) =>
  el?.scrollIntoView({ block: 'start', behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });

/** Lưới 6 cột của bảng (mockup K1 `.byt`) — chỉ khi KHUNG ≥ 1220 px; hẹp hơn mỗi em một thẻ (K2). Lớp viết đủ chữ (Tailwind). */
const COT = '[@container(min-width:1220px)]:grid-cols-[190px_minmax(130px,1fr)_180px_220px_190px_170px] [@container(min-width:1220px)]:gap-x-5';

type NguCanh = {
  homNay: string; canManage: boolean; coTheDuyet: boolean; gvcn: string | null; chonN: ChonNhieu; dangGhi: number | null;
  vuaLuu: { sid: number; luc: string } | null;
  mo: (p: PanelYThuc) => void; onDaXem: (x: DongEm, ids: number[]) => void; onBaoPh: (x: DongEm) => void;
  onDuyet: (v: { id: number; thuHoi: boolean; moSan: 'duyet' | 'tu-choi' }) => void;
  onHoanTac: (sid: number) => void; onXemLai: (ids: number[]) => void;
};

/** Tiêu đề nhóm (mockup `.nhom-h`): chữ 15 đậm · đếm · một câu luật · ⓘ. Bắt buộc: nền vàng, chữ vàng; Đã xử lý: nền thẻ. */
function NhomHang({ chu, dem, luat, i, tong, children }: { chu: string; dem: ReactNode; luat?: string; i?: ReactNode; tong?: 'bb' | 'gap'; children: ReactNode }) {
  return (
    <section aria-label={chu}>
      <div className={`flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 border-b px-4 py-2.5 max-sm:px-3 ${tong === 'bb' ? 'bg-soon-bg' : ''}`}
        style={{ borderColor: 'var(--line)', background: tong === 'bb' ? undefined : tong === 'gap' ? 'var(--surface)' : 'var(--surface-2)' }}>
        <h3 className={`m-0 text-[15px] font-bold ${tong === 'bb' ? 'text-soon' : 'text-slate-100'}`}>{chu}</h3>
        <span className="text-[13px] font-semibold tabular-nums text-slate-400">{dem}</span>
        {luat && <span className="text-[13px] text-slate-400">{luat}</span>}
        {i && <span className="-ml-1 self-center">{i}</span>}
      </div>
      {children}
    </section>
  );
}

/** Vi phạm chờ trên hàng; còn lại "+n vi phạm" (mở chi tiết để xem đủ). */
const VP_TREN_HANG = 3;
const DsVpHang = ({ ds, homNay }: { ds: { id: number; ngay: string; ten: string }[]; homNay: string }) => ds.length ? (
  <ul className="m-0 grid list-none gap-1 p-0">
    {ds.slice(0, VP_TREN_HANG).map((v) => (
      <li key={v.id} className="grid grid-cols-[44px_minmax(0,1fr)] gap-2 text-sm text-slate-100">
        <span className="text-[13px] font-semibold tabular-nums text-slate-400">{ngay(v.ngay, homNay)}</span><span className="min-w-0 break-words">{v.ten}</span>
      </li>
    ))}
    {ds.length > VP_TREN_HANG && <li className="pl-[52px] text-[13px] text-slate-400">{t('+{n} vi phạm', { n: ds.length - VP_TREN_HANG })}</li>}
  </ul>
) : <span className="text-slate-500">—</span>;

/** Nút cột Việc (mockup `.c-viec`): nút chính rộng cả cột · nút chữ phụ bên dưới. 375: 44 px. */
const NUT_CHINH = 'btn btn-primary w-full justify-center max-sm:h-11';
const NUT_VIEN = 'btn w-full justify-center max-sm:h-11';
/** Nút chữ nhỏ (mockup `.link-nho`): 30 px · 375: 44 px. */
const NUT_LINK = 'link min-h-[30px] appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold max-sm:min-h-[44px]';
/* Nút chữ phụ rộng đều cột, chữ giữa (mockup `.c-viec .nut { width:100% }` · `.duoi2`). */
const NUT_CHU = 'link min-h-[30px] flex-1 appearance-none border-0 bg-transparent px-1 text-center text-[13px] font-semibold max-sm:min-h-[44px]';

function HangEm({ x, k, c, vua, mo, onMo, chiTiet }: {
  x: DongEm; k: KieuHang; c: NguCanh; vua?: { ids: number[]; luc: string }; mo: boolean; onMo: () => void; chiTiet: ReactNode;
}) {
  const { homNay } = c;
  const vuaLuu = c.vuaLuu?.sid === x.studentId;
  /* Vi phạm của hàng (máy chủ): chờ · đang trong đề xuất · của lần đang xin thu hồi. */
  const dsVp = x.viPhamCho;
  const idsMoi = x.viPhamCho.filter((v) => v.trangThai === 'moi').map((v) => v.id);
  const batBuoc = k === 'qua_han' || k === 'bat_buoc';
  const dangGhi = c.dangGhi === x.studentId;

  /* ---- Cột Việc: MỘT nút chính đúng việc người xem phải làm tiếp + nút chữ phụ ---- */
  let chinh: ReactNode = null; const phu: ReactNode[] = [];
  const nutChu = (key: string, chu: string, onClick: () => void) => <button key={key} type="button" className={NUT_CHU} aria-label={`${chu} · ${x.ten}`} onClick={onClick}>{chu}</button>;
  if (k === 'vua_xem') { /* cột Việc riêng (Hoàn tác · Xem lại) */ }
  else if (c.canManage && batBuoc && !x.deXuat) {
    chinh = <button type="button" className={NUT_CHINH} aria-label={`${t('Xác nhận xử lý')} · ${x.ten}`} onClick={() => c.mo({ loai: 'xu-ly', studentId: x.studentId })}>{t('Xác nhận xử lý')}</button>;
    phu.push(nutChu('dx', t('Đề xuất QL duyệt'), () => c.mo({ loai: 'xu-ly', studentId: x.studentId, cheDo: 'de-xuat' })));
  } else if (c.canManage && k === 'moi' && idsMoi.length) {
    chinh = (
      <button type="button" className={NUT_VIEN} style={{ borderColor: 'var(--accent)', color: 'var(--accent)', background: 'transparent' }} disabled={dangGhi}
        aria-label={`${t('Đã xem · {n}', { n: idsMoi.length })} · ${x.ten}`} title={t('Đã xem, chưa cần xử lý')} onClick={() => c.onDaXem(x, idsMoi)}>
        {dangGhi ? t('Đang lưu…') : t('Đã xem · {n}', { n: idsMoi.length })}
      </button>
    );
    phu.push(nutChu('xl', t('Xác nhận xử lý'), () => c.mo({ loai: 'xu-ly', studentId: x.studentId })));
  } else if (x.baoPh?.coTheGhi && x.baoPh.trangThai === 'mo' && !c.canManage) {
    /* TVV: việc của mình là Báo PH — đứng trước nút xem đề xuất / thu hồi. */
    chinh = <button type="button" className={x.baoPh.quaHan ? NUT_CHINH : NUT_VIEN} aria-label={`${t('Ghi kết quả báo PH')} · ${x.ten}`} onClick={() => c.onBaoPh(x)}>{t('Ghi kết quả báo PH')}</button>;
  } else if (k === 'thu_hoi' && x.thuHoi) {
    const id = x.thuHoi.id;
    if (c.coTheDuyet) {
      chinh = <button type="button" className={NUT_CHINH} aria-label={`${t('Duyệt thu hồi')} · ${x.ten}`} onClick={() => c.onDuyet({ id, thuHoi: true, moSan: 'duyet' })}>{t('Duyệt thu hồi')}</button>;
      phu.push(nutChu('tc', t('Từ chối…'), () => c.onDuyet({ id, thuHoi: true, moSan: 'tu-choi' })), nutChu('xem', t('Xem'), () => c.mo({ loai: 'xem', id })));
    } else chinh = <button type="button" className={NUT_VIEN} aria-label={`${t('Xem lần xử lý')} · ${x.ten}`} onClick={() => c.mo({ loai: 'xem', id })}>{t('Xem lần xử lý')}</button>;
  } else if (x.deXuat) {
    const id = x.deXuat.id;
    if (x.deXuat.status === 'da_duyet' && c.canManage) {
      chinh = <button type="button" className={NUT_CHINH} aria-label={`${t('Đánh dấu đã thực hiện')} · ${x.ten}`} onClick={() => c.mo({ loai: 'da-thuc-hien', id })}>{t('Đánh dấu đã thực hiện')}</button>;
      phu.push(nutChu('xem', t('Xem'), () => c.mo({ loai: 'xem', id })));
    } else if (x.deXuat.status === 'cho_duyet' && c.coTheDuyet) {
      chinh = <button type="button" className={NUT_CHINH} aria-label={`${t('Duyệt')} · ${x.ten}`} onClick={() => c.onDuyet({ id, thuHoi: false, moSan: 'duyet' })}>{t('Duyệt')}</button>;
      phu.push(nutChu('tc', t('Từ chối…'), () => c.onDuyet({ id, thuHoi: false, moSan: 'tu-choi' })), nutChu('xem', t('Xem'), () => c.mo({ loai: 'xem', id })));
    } else chinh = <button type="button" className={NUT_VIEN} aria-label={`${t('Xem đề xuất')} · ${x.ten}`} onClick={() => c.mo({ loai: 'xem', id })}>{t('Xem đề xuất')}</button>;
  } else if (k === 'da_xu_ly' && x.xuLyGanNhat) {
    const id = x.xuLyGanNhat.id;
    chinh = <button type="button" className={NUT_VIEN} aria-label={`${t('Xem lần xử lý')} · ${x.ten}`} onClick={() => c.mo({ loai: 'xem', id })}>{t('Xem lần xử lý')}</button>;
  }

  /* ---- Ô Cần làm ---- */
  const canLam = (duoi: boolean) => k === 'thu_hoi' && x.thuHoi
    ? <BadgeViec tong="dang">{t('Xin thu hồi {nhan}', { nhan: dich(x.thuHoi.nhan) })}</BadgeViec>
    : k === 'da_xu_ly' ? (
      <span className="flex flex-col items-start gap-1.5">
        <BadgeViec tong="xong">{vuaLuu ? t('Đã xử lý {gio}', { gio: c.vuaLuu!.luc }) : x.xuLyGanNhat ? t('Đã xử lý {ngay}', { ngay: ngay(x.xuLyGanNhat.ngay, homNay) }) : t('Đã xử lý')}</BadgeViec>
        {vuaLuu && duoi && <span className="text-xs text-slate-500">{t('vừa lưu')}</span>}
      </span>
    ) : k === 'cho_bao_ph' ? <span className="text-slate-500">—</span>
    : <CanLamEm x={{ ...x, nhom: k === 'vua_xem' ? null : (k as NhomEm) }} homNay={homNay} hanDuoi={duoi} laQl={c.coTheDuyet} />;

  /* ---- Ô Bậc (mockup `.bac`): Đã tới · Lần này / Bậc kế / Đề xuất ---- */
  const daToi = x.bacNhan
    ? <dd className="m-0 font-semibold text-slate-100">{dich(x.bacNhan)}{x.xuLyGanNhat && <span className="font-medium tabular-nums text-slate-400"> · {ngay(x.xuLyGanNhat.ngay, homNay)}</span>}</dd>
    : <dd className="m-0 font-medium text-slate-400">{t('chưa có')}</dd>;
  const bac2: [string, ReactNode, boolean] | null = x.deXuat ? [t('Đề xuất'), dich(x.deXuat.nhan), false]
    : k === 'thu_hoi' ? null
    : batBuoc ? [t('Lần này'), dich(x.keTiep.nhan), false] : [t('Bậc kế'), dich(x.keTiep.nhan), true];
  const oBac = (
    <dl className="m-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-2.5 gap-y-[3px] text-sm">
      <dt className="whitespace-nowrap text-xs font-medium leading-[1.6] text-slate-500">{t('Đã tới')}</dt>{daToi}
      {bac2 && <><dt className="whitespace-nowrap text-xs font-medium leading-[1.6] text-slate-500">{bac2[0]}</dt><dd className={`m-0 ${bac2[2] ? 'font-medium text-slate-400' : 'font-semibold text-slate-100'}`}>{bac2[1]}</dd></>}
    </dl>
  );
  const oBaoPh = <BaoPhEm b={x.baoPh} homNay={homNay} onMo={x.baoPh?.coTheGhi ? () => c.onBaoPh(x) : undefined} />;
  const oTen = (
    <span className="min-w-0">
      <Link className="block text-[15px] font-semibold text-slate-100 no-underline hover:text-[color:var(--accent)] hover:underline max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center" to={`/hoc-vien/${x.studentId}?tab=y-thuc`}>{x.ten}</Link>
      {/* K1: TVV của em · K4 (người duyệt, nhóm Chờ QL duyệt): GVCN — người đề xuất / xin thu hồi. */}
      {c.coTheDuyet && (k === 'cho_duyet' || k === 'thu_hoi') && c.gvcn
        ? <span className="mt-0.5 block text-xs text-slate-500">{t('GVCN {ten}', { ten: c.gvcn })}</span>
        : x.tvv && <span className="mt-0.5 block text-xs text-slate-500">{t('TVV {ten}', { ten: x.tvv })}</span>}
    </span>
  );
  const nutMo = k !== 'vua_xem' && (
    <button type="button" aria-expanded={mo} onClick={onMo} aria-label={`${mo ? t('Thu gọn') : t('Chi tiết')} · ${x.ten}`}
      className="link mt-1.5 inline-flex min-h-[24px] items-center appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold max-sm:min-h-[44px]">
      {mo ? `▴ ${t('Thu gọn')}` : `▾ ${t('Chi tiết')}`}
    </button>
  );
  const nen = mo ? 'bg-[color:var(--accent-soft)]' : k === 'vua_xem' || vuaLuu ? 'bg-ok-bg' : '';
  const daXemChu = vua && <b className="text-sm font-semibold text-ok">✓ {t('Đã xem {n} vi phạm · {gio}', { n: vua.ids.length, gio: vua.luc })}</b>;
  const nutVuaXem = (lop: string) => vua && (
    <>
      <button type="button" className={lop} disabled={dangGhi} aria-label={`${t('Hoàn tác')} · ${x.ten}`} onClick={() => c.onHoanTac(x.studentId)}>{t('Hoàn tác')}</button>
      <button type="button" className={lop} aria-label={`${t('Xem lại')} · ${x.ten}`} onClick={() => c.onXemLai(vua.ids)}>{t('Xem lại')}</button>
    </>
  );

  /* Thẻ 375 (K2): Bậc một ô · Báo PH một ô (chữ màu), nút rộng cả thẻ. */
  const bac375 = batBuoc ? [t('Bậc · lần này'), dich(x.keTiep.nhan)] : [t('Bậc · đã tới'), x.bacNhan ? dich(x.bacNhan) : t('chưa có')];
  const b = x.baoPh;
  const baoPh375 = !b ? <b className="font-semibold text-slate-500">—</b>
    : b.trangThai === 'xong' ? <b className="font-semibold text-ok">✓ {b.ngayXong ? t('Đã báo {ngay}', { ngay: ngay(b.ngayXong, homNay) }) : t('Đã báo PH')}</b>
    : b.trangThai === 'bo' ? <b className="font-semibold text-slate-500">{t('Đã bỏ')}</b>
    : b.coTheGhi ? (
      <button type="button" className={`inline-flex min-h-[44px] items-center appearance-none border-0 bg-transparent p-0 text-left font-semibold underline underline-offset-2 ${b.quaHan ? 'text-late' : 'text-soon'}`}
        aria-label={`${t('Ghi kết quả báo PH')} · ${x.ten}`} onClick={() => c.onBaoPh(x)}>{dich(b.nhanTrangThai)} · {t('hạn {ngay}', { ngay: ngay(b.han, homNay) })} ›</button>
    ) : <b className={`font-semibold ${b.quaHan ? 'text-late' : 'text-soon'}`}>{dich(b.nhanTrangThai)} · {t('hạn {ngay}', { ngay: ngay(b.han, homNay) })}</b>;

  return (
    <div id={k === 'vua_xem' ? undefined : `yt-em-${x.studentId}`} className="scroll-mt-24">
      {/* ≥ 1220 px: hàng bảng 6 cột */}
      <div className={`hidden border-b px-4 py-3 [@container(min-width:1220px)]:grid ${COT} ${nen}`}
        style={{ borderColor: 'var(--line)', boxShadow: mo ? 'inset 3px 0 0 var(--accent)' : undefined }}>
        <div className="flex min-w-0 items-start gap-2">
          {c.chonN.bat && k !== 'vua_xem' && <OChon chon={c.chonN} id={x.studentId} ten={x.ten} />}
          <span className="min-w-0">{oTen}{nutMo}</span>
        </div>
        <div className="min-w-0"><span className="sr-only">{t('Vi phạm chờ')}: </span><DsVpHang ds={dsVp} homNay={homNay} /></div>
        {k === 'vua_xem' ? (
          <div className="col-span-3 min-w-0" role="status">{daXemChu}</div>
        ) : (
          <>
            <div className="min-w-0"><span className="sr-only">{t('Cần làm')}: </span>{canLam(true)}</div>
            <div className="min-w-0"><span className="sr-only">{t('Bậc')}: </span>{oBac}</div>
            <div className="min-w-0"><span className="sr-only">{t('Báo PH (TVV)')}: </span>{oBaoPh}</div>
          </>
        )}
        <div className="min-w-0">
          {k === 'vua_xem' ? <span className="flex gap-3.5">{nutVuaXem(NUT_LINK)}</span> : (
            <>
              {chinh}
              {phu.length > 0 && <span className="mt-1 flex gap-2">{phu}</span>}
            </>
          )}
        </div>
      </div>
      {/* < 1220 px: thẻ em (K2) */}
      <div className={`grid gap-2.5 border-b px-3 py-3 [@container(min-width:1220px)]:hidden ${nen}`} style={{ borderColor: 'var(--line)' }}>
        <div className="flex items-start gap-2">
          {c.chonN.bat && k !== 'vua_xem' && <OChon chon={c.chonN} id={x.studentId} ten={x.ten} />}
          {oTen}
          {k !== 'vua_xem' && <span className="ml-auto pt-2.5">{canLam(false)}</span>}
        </div>
        {k === 'vua_xem' ? (
          <>
            <span role="status">{daXemChu}</span>
            <span className="grid grid-cols-2 gap-2">{nutVuaXem('btn h-11 justify-center')}</span>
          </>
        ) : (
          <>
            <DsVpHang ds={dsVp} homNay={homNay} />
            <div className="grid grid-cols-2 gap-2">
              <span className="grid gap-0.5"><span className="text-xs font-medium text-slate-500">{bac375[0]}</span><b className="text-sm font-semibold text-slate-100">{bac375[1]}</b></span>
              <span className="grid gap-0.5"><span className="text-xs font-medium text-slate-500">{b ? t('Báo PH · lần {nhan}', { nhan: dich(b.nhan) }) : t('Báo PH')}</span><span className="text-sm">{baoPh375}</span></span>
            </div>
            {chinh}
            {phu.length > 0 && <span className="grid gap-0.5">{phu}</span>}
            {nutMo}
          </>
        )}
      </div>
      {mo && chiTiet}
    </div>
  );
}

/** Khối có nhãn trong chi tiết em (mockup `.ct .k`). */
function Khoi({ tieuDe, dem, phai, children }: { tieuDe: string; dem?: number; phai?: ReactNode; children: ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2.5 rounded-[10px] border px-3.5 py-3" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
      <div className="flex flex-wrap items-center gap-2.5">
        <h4 className="m-0 text-[15px] font-bold text-slate-100">{tieuDe}</h4>
        {dem != null && <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded border px-[7px] text-xs font-semibold text-slate-100" style={{ borderColor: 'var(--line-strong)' }}>{dem}</span>}
        {phai && <span className="ml-auto flex items-center gap-2">{phai}</span>}
      </div>
      {children}
    </div>
  );
}
/** Trường nhãn | giá trị (mockup `.fld`): 375 xếp dọc. */
const Fld = ({ ds }: { ds: [string, ReactNode][] }) => (
  <dl className="m-0 grid grid-cols-[minmax(0,1fr)] sm:grid-cols-[8.5rem_minmax(0,1fr)]">
    {ds.map(([n, g], i) => (
      <div key={n} className="contents">
        <dt className={`py-2.5 text-[13px] font-medium leading-snug text-slate-500 max-sm:pb-0 ${i ? 'border-t' : ''}`} style={{ borderColor: 'var(--line)' }}>{n}</dt>
        <dd className={`m-0 min-w-0 py-[9px] text-[15px] text-slate-100 max-sm:pt-0.5 ${i ? 'sm:border-t' : ''}`} style={{ borderColor: 'var(--line)' }}>{g}</dd>
      </div>
    ))}
  </dl>
);

/**
 * CHI TIẾT EM — mở dưới hàng (mockup K1 `.mo-ct`): trái "Vi phạm của lần này" (chỉ vi phạm chờ; mở dòng → mô tả, bằng chứng, Sửa · Xoá,
 * Đã xem một vi phạm) · "Lịch sử của em ›"; phải "Lần xử lý" (lần này · hạn, lần trước → Xem; Thang › mở tại chỗ + Khai cấp bậc) và "Báo PH".
 */
function ChiTietEm({ x, k, lanTai, c, dem, toi, onLamMoi, onLichSu }: {
  x: DongEm; k: KieuHang; lanTai: number; c: NguCanh; dem: { xuLy: number; xem: number }; toi: number | null;
  onLamMoi: () => void; onLichSu: () => void;
}) {
  const { homNay } = c;
  const hvY = useApi<YThucHocVien>(`/students/${x.studentId}/y-thuc`, [x.studentId, lanTai]);
  const [moVp, setMoVp] = useState<number | null>(null);
  const [thang, setThang] = useState(false);
  const hv = hvY.data;
  const khung = (n: ReactNode) => <div className="border-b px-4 pb-4 pt-0 max-sm:px-3" style={{ borderColor: 'var(--line)', background: 'var(--accent-soft)' }}>{n}</div>;
  /* PR-S3F #12: lỗi tải hồ sơ Ý thức của em không xoay mãi. */
  if (hvY.error) return khung(<ErrorState message={hvY.error.message} hint={hvY.error.hint} status={hvY.error.status} onRetry={hvY.reload} />);
  if (!hv) return khung(<Skeleton rows={3} />);
  const batBuoc = k === 'qua_han' || k === 'bat_buoc';
  const coXem = (v: ViPhamV4) => hv.canManage && (v.trangThai === 'moi' || (v.trangThai === 'qua_han' && v.lyDoQuaHan === 'xem'));
  const chuaXong = hv.viPham.filter((v) => CHUA_XONG.has(v.trangThai)).sort((a, b) => a.occurredOn.localeCompare(b.occurredOn) || a.id - b.id);
  const xemIds = chuaXong.filter(coXem).map((v) => v.id);
  const ttKhoi = TT_KHOI[k] ?? '';
  const chiTiet = (v: ViPhamV4) => (
    <div className="space-y-2">
      <ChiTietViPham violationId={v.id} onSua={(vv) => c.mo({ loai: 'sua', v: vv, studentName: x.ten })}
        onDaXoa={() => { setMoVp(null); onLamMoi(); }} onMoXuLy={(id) => c.mo({ loai: 'xem', id })} />
      {coXem(v) && xemIds.length > 1 && !batBuoc && (
        <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={c.dangGhi === x.studentId} onClick={() => c.onDaXem(x, [v.id])}>{t('Đã xem vi phạm này')}</button>
      )}
    </div>
  );
  const lanXuLy: [string, ReactNode][] = [
    ...(x.deXuat ? [[t('Đề xuất'), <span className="flex flex-wrap items-center gap-2"><b className="font-semibold">{dich(x.deXuat.nhan)}</b><LinkXem onClick={() => c.mo({ loai: 'xem', id: x.deXuat!.id })} /></span>] as [string, ReactNode]]
      : batBuoc && hv.han ? [[t('Lần này · hạn'), <b className="font-semibold tabular-nums">{ngay(hv.han, homNay)}</b>] as [string, ReactNode]]
      : batBuoc ? [[t('Lần này'), <b className="font-semibold">{dich(x.keTiep.nhan)}</b>] as [string, ReactNode]]
      : [[t('Bậc kế'), <span className="text-slate-300">{dich(x.keTiep.nhan)}</span>] as [string, ReactNode]]),
    ...(x.thuHoi || x.tuChoi ? [[t('Lần trước'), <LanTruoc x={x} homNay={homNay} onXem={(id) => c.mo({ loai: 'xem', id })} />] as [string, ReactNode]]
      : x.xuLyGanNhat ? [[t('Lần trước'), (
        <span className="flex flex-wrap items-center gap-2"><b className="font-semibold">{dich(x.xuLyGanNhat.nhan)}</b>
          <span className="text-[13px] tabular-nums text-slate-400">{ngay(x.xuLyGanNhat.ngay, homNay)}</span><LinkXem onClick={() => c.mo({ loai: 'xem', id: x.xuLyGanNhat!.id })} /></span>
      )] as [string, ReactNode]] : []),
  ];
  const baoPh: [string, ReactNode][] = [
    ...(x.baoPh ? [[t('Lần {nhan}', { nhan: dich(x.baoPh.nhan) }), <BaoPhEm b={x.baoPh} homNay={homNay} coLan={false} onMo={x.baoPh.coTheGhi ? () => c.onBaoPh(x) : undefined} />] as [string, ReactNode],
      [t('Người giữ'), x.tvv ? t('TVV {ten}', { ten: x.tvv }) : '—'] as [string, ReactNode]] : []),
    ...(chuaXong.length && !x.deXuat ? [[t('Lần này'), <span className="text-slate-300">{t('có việc khi lưu xử lý')}</span>] as [string, ReactNode]] : []),
  ];
  return khung(
    <div className="grid gap-3.5 [@container(min-width:1220px)]:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <Khoi tieuDe={t('Vi phạm của lần này')} dem={chuaXong.length}
        phai={batBuoc && hv.canManage && <><b className="text-[13px] font-semibold text-soon">{t('Không có "Đã xem"')}</b>
          <NutLuat label={t('Vì sao không có Đã xem')}>{t('≥ 3 vi phạm trong tuần này + tuần trước → phải xử lý; "Đã xem" không còn.')}</NutLuat></>}>
        {chuaXong.length === 0 ? <p className="m-0 text-[13px] text-slate-400">{t('Không còn vi phạm chờ')}</p> : (
          <DsViPhamCho ds={chuaXong} homNay={homNay} moId={moVp} onMo={(id) => setMoVp((m) => (m === id ? null : id))} chiTiet={chiTiet} nguoiGhi
            nhanRieng={(v) => (
              <span className="flex items-center gap-2">
                {v.trangThai !== ttKhoi && <NhanViPham t={v.trangThai} nhan={dich(v.nhanTrangThai)} />}
                {!hv.canManage && v.reportedBy === toi && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" aria-label={`${t('Sửa')} · ${v.ten}`}
                  onClick={() => c.mo({ loai: 'sua', v: { id: v.id, studentId: v.studentId, category: v.category, skill: v.skill, occurredOn: v.occurredOn, ten: v.ten, moTa: v.moTa }, studentName: x.ten })}>{t('Sửa')}</button>}
              </span>
            )} />
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2.5" style={{ borderColor: 'var(--line)' }}>
          <span className="flex flex-wrap gap-1.5">
            <span className={TAG}>{t('Đã xử lý')}&nbsp;<b className="text-slate-200">{dem.xuLy}</b></span>
            <span className={TAG}>{t('Đã xem')}&nbsp;<b className="text-slate-200">{dem.xem}</b></span>
          </span>
          <button type="button" className={NUT_LINK} onClick={onLichSu}>{t('Lịch sử của em ›')}</button>
        </div>
      </Khoi>
      <div className="grid content-start gap-3.5">
        <Khoi tieuDe={t('Lần xử lý')}
          phai={<button type="button" aria-expanded={thang} className={NUT_LINK} onClick={() => setThang((v) => !v)}>{thang ? t('Thang ‹') : t('Thang ›')}</button>}>
          <Fld ds={lanXuLy} />
          {/* Thang đủ mở tại chỗ (chỉ xem + Khai cấp bậc) — nút xử lý ở cột Việc của hàng (U10.2). */}
          {thang && <ThangYThuc d={hv} homNay={homNay} onKhai={hv.canManage ? () => c.mo({ loai: 'khai', studentId: hv.studentId }) : undefined} />}
        </Khoi>
        <Khoi tieuDe={t('Báo PH')}>
          {baoPh.length ? <Fld ds={baoPh} /> : <span className="text-[13px] text-slate-500">—</span>}
        </Khoi>
      </div>
    </div>,
  );
}

const LinkXem = ({ onClick }: { onClick: () => void }) => (
  <button type="button" className={NUT_LINK} onClick={onClick}>
    <span className="sr-only">{t('Xem lần xử lý')} </span>{t('Xem ›')}
  </button>
);

/**
 * K4: QL Duyệt / Từ chối đề xuất hoặc xin thu hồi NGAY tab lớp — cùng panel duyệt của Hộp duyệt (`PanelDuyet`); thẻ lấy từ lần xử lý
 * (`GET /y-thuc/xu-ly/:id` — `the` = đề xuất, `thuHoi` = xin thu hồi). Máy chủ kiểm quyền duyệt.
 */
function PanelDuyetXuLy({ id, thuHoi, moSan, onDong, onXong }: { id: number; thuHoi: boolean; moSan: 'duyet' | 'tu-choi'; onDong: () => void; onXong: (chu?: string) => void }) {
  const { data, error } = useApi<XuLyView>(`/y-thuc/xu-ly/${id}`, [id]);
  const toast = useToast();
  const yc = thuHoi ? data?.thuHoi : data?.the;
  useEffect(() => {
    if (error) { toast.push('error', error.message); onDong(); }
    else if (data && (!yc || yc.trangThai !== 'cho')) { toast.push('error', t('Yêu cầu này đã được xử lý.')); onXong(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, data]);
  if (!yc || yc.trangThai !== 'cho') return null;
  return <PanelDuyet yc={yc} moSan={moSan} onDong={onDong} onXong={(_id, chu) => onXong(chu)} />;
}
