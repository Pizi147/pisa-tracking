import { useEffect, useRef, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ErrorState, NutChon, Skeleton } from '../../ui/ui.tsx';
import { ChonNguoi, type NguoiTrongDs } from '../../ui/PeoplePicker.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { OTuan } from '../classes/TransitionPanel.tsx';
import {
  CHU_CHUYEN_LOP, TOI_DA_NHIEU_EM, canHoiTarget, chonGuiNhieuEm, docOTarget, chuTuanHoc, chuTyLeXetLai, dsLoi, hanBanGiao, kyHieuLop, ngay, phuLopDich, tomTatChuyenEm,
  tuanChonDuoc, tuanLich, type LoiTruong, type LuatTruong,
} from '@shared/domain/index.ts';

type LopDich = {
  id: number; code: string; chiNhanhId: number; branchCode: string | null; ma: string | null; ft: boolean; route: string | null;
  tenChuongTrinh: string | null; tuan: string | null; gvcn: string | null; siSo?: number;
};
type LopDichData = { lop: LopDich[]; nguon: { ft: boolean; tuCuoiKhoa: boolean } };
type LenhCho = { id: number; huong: string; lopDichId: number | null; tuan: string; mucTieu: number | 'KCK' | null; lyDo: string | null; loi: string | null };
type XemChuyenLopData = {
  hienTai: { lop: { id: number; code: string }; ma: string | null; ft: boolean; chiNhanhId: number; route: string | null; tuanHoc: { tuan: number | null; tong: number | null; dangDung: boolean } | null };
  lenh: LenhCho | null; tuanChon: string[]; today: string;
  /** PR-CL (B3): null khi chưa chọn lớp. */
  huong: string | null; targetSan: number | 'KCK' | null; khiChuyen: string[]; canhBao: boolean; tuLopThuong: string | null;
};

/** Thẻ Đề xuất chuyển lớp đang được duyệt: panel mở điền sẵn, nút chính `Duyệt và quyết định` (mockup 20 — thẻ Chờ duyệt → D). */
export type DuyetDeXuat = { id: number; lopDichId: number | null; tuan: string | null; lyDo: string | null };

/** Ô gõ tên lớp: gợi ý "mã lớp · FT LT1 · CP · 9 em" (GVCN đề xuất: không sĩ số — máy chủ không trả `siSo`). */
const dsLopDich = (lop: readonly LopDich[]): NguoiTrongDs[] => lop.map((l) => ({ id: l.id, ten: l.code, phu: phuLopDich(l, 'siSo' in l) }));
/** Mockup phần 2: "Còn thiếu: Lý do" ở chân (lý do từng ô vẫn nằm dưới ô); có ô ghi sai (Target 12) → "Cần sửa: …". */
const conThieuChu = (daBam: boolean, loi: readonly LoiTruong[]) => (daBam && loi.length
  ? [{ nhan: 'Còn thiếu', lyDo: `${loi.every((l) => l.lyDo.startsWith('Chưa')) ? 'Còn thiếu' : 'Cần sửa'}: ${loi.map((l) => l.nhan).join(', ')}` }] : undefined);
const loiMayChu = (e: any) => e?.message ?? 'Không lưu được — thử lại.';
const khoiVang = { borderColor: 'rgb(var(--soon-line-rgb))', background: 'rgb(var(--soon-bg-rgb))' };

/** Ô "Lớp chuyển đến": chưa chọn → gõ tên lớp; đã chọn → "mã · dòng phụ" + ✕ (mockup phần 2, như hàng nhóm của Lộ trình tiếp theo). */
function OLopDich({ ds, value, onChange, ariaLabel, id, invalid, onBlur, disabled }: {
  ds: NguoiTrongDs[]; value: number | null; onChange: (id: number | null) => void; ariaLabel: string; id?: string; invalid?: boolean; onBlur?: () => void; disabled?: boolean;
}) {
  const chon = value === null ? null : ds.find((l) => l.id === value) ?? null;
  /* Bỏ chọn bằng ✕ → nút biến mất: đưa focus về ô gõ (mở danh sách) thay vì rơi về <body>. */
  const [vuaBo, setVuaBo] = useState(false);
  if (chon || (value !== null && disabled)) {
    return (
      <div className="field flex items-center justify-between gap-2">
        <span className="min-w-0 truncate"><span className="text-slate-100">{chon?.ten ?? '—'}</span>{chon?.phu && <span className="text-xs text-slate-500"> · {chon.phu}</span>}</span>
        {!disabled && <button id={id} type="button" className="btn btn-sm btn-ghost -my-1 h-7 shrink-0 justify-center !py-0 max-sm:-my-2 max-sm:h-11 max-sm:min-h-0 max-sm:w-11"
          aria-label={`Bỏ chọn ${chon?.ten ?? ''} · ${ariaLabel}`} onClick={() => { setVuaBo(true); onChange(null); }}>✕</button>}
      </div>
    );
  }
  return (
    <ChonNguoi value={null} nhom="nhan_vien" choToi={false} choNgoai={false} ds={ds} placeholder="Gõ tên lớp…" ariaLabel={ariaLabel} disabled={disabled} tuMo={vuaBo}
      id={id} invalid={invalid} onBlur={onBlur} khongKhop={(go) => `Không có lớp khớp “${go}”`}
      onChange={(v) => v?.kieu === 'tai_khoan' && onChange(v.id)} />
  );
}

/** Target + KCK (§7: chỉ khi em chưa có Target nào) — panel một em và hàng nhiều em. */
function OTarget({ value, onChange, ariaLabel, oProps, disabled }: {
  value: string; onChange: (v: string) => void; ariaLabel: string; oProps?: Record<string, unknown>; disabled?: boolean;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <input className="field w-20 tabular-nums" inputMode="decimal" aria-label={ariaLabel} {...oProps} disabled={disabled || value === 'KCK'}
        value={value === 'KCK' ? '' : value} onChange={(e) => onChange(e.target.value)} />
      <NutChon chon={value === 'KCK'} disabled={disabled} title="Không cam kết — không tính SOS" onClick={() => onChange(value === 'KCK' ? '' : 'KCK')}>KCK</NutChon>
    </span>
  );
}

/** "Tuần bắt đầu": 3 mã tuần + "Chọn tuần" → ô tuần (`OTuan`). */
function OTuanBatDau({ tuanChon, tuan, setTuan, homNay, oProps }: {
  tuanChon: string[]; tuan: string; setTuan: (t: string) => void; homNay: string | null; oProps: Record<string, unknown>;
}) {
  const [khac, setKhac] = useState(false);
  const nut = tuanChon.slice(0, 3);
  const ngoai = khac || (!!tuan && !nut.includes(tuan));
  return (
    <>
      <div {...oProps} tabIndex={-1} className="flex flex-wrap gap-1.5 outline-none">
        {nut.map((t) => <NutChon key={t} chon={tuan === t && !khac} onClick={() => { setTuan(t); setKhac(false); }}>{tuanLich(t, homNay)}</NutChon>)}
        <NutChon chon={ngoai} onClick={() => setKhac(true)}>Chọn tuần</NutChon>
      </div>
      {ngoai && (
        <div className="mt-2 max-w-[11rem]">
          <OTuan tuanChon={tuanChon} rong value={tuan} onChange={setTuan} ariaLabel="Tuần bắt đầu khác" chuaChon="Chọn tuần" />
        </div>
      )}
    </>
  );
}

const xongChuyen = () => {
  for (const k of ['/students', '/attempts', '/tong-quan', '/cases', '/classes', '/hoc-vien-lop', '/my-work', '/yeu-cau', '/lenh-chuyen']) invalidate(k);
};

/**
 * CHUYỂN MỘT EM (PR-CT; làm lại PR-CL — mockup cuối khoá 2 phần 2 + đặc tả 08/10 §1, §7) — MỘT panel `KhungPanel`, hai chế độ theo vai:
 *   · `cheDo="lenh"` (Quản lý): MỘT ô gõ tên lớp (mọi chi nhánh, máy chủ đã lọc lớp hợp lệ), Tuần bắt đầu, Lý do → `Quyết định chuyển lớp`.
 *     Khối "Khi chuyển, web sẽ" do máy chủ tính (`dongKhiChuyen`); FT → Thường viền vàng. Target chỉ hỏi khi Lên FT mà em chưa có Target nào (§7).
 *     Em đã có lệnh: sửa (`Lưu quyết định` + `Huỷ quyết định`) — vẫn `POST /transfer` (máy chủ sửa lệnh, tự tính bối cảnh/hướng). Thẻ Đề xuất: `Duyệt và quyết định`.
 *   · `cheDo="de-xuat"` (GVCN): `Đề xuất chuyển lớp` → thẻ Chờ duyệt (5 ngày); gợi ý lớp không có sĩ số.
 * Nằm ở: Hồ sơ học viên › ⋮ · ⋯ cuối dòng học viên trong hồ sơ lớp · thẻ duyệt Đề xuất chuyển lớp.
 */
export function ChuyenLopPanel({ open, onClose, studentId, studentName, lop, onDone, cheDo = 'lenh', duyet }: {
  open: boolean; onClose: () => void; studentId: number; studentName?: string; lop?: string | null; onDone?: () => void;
  cheDo?: 'lenh' | 'de-xuat'; duyet?: DuyetDeXuat;
}) {
  if (!open) return null;
  return <NoiDungChuyenLop onClose={onClose} studentId={studentId} studentName={studentName} lop={lop} onDone={onDone} cheDo={cheDo} duyet={duyet} />;
}

function NoiDungChuyenLop({ onClose, studentId, studentName, lop, onDone, cheDo, duyet }: {
  onClose: () => void; studentId: number; studentName?: string; lop?: string | null; onDone?: () => void;
  cheDo: 'lenh' | 'de-xuat'; duyet?: DuyetDeXuat;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const dt = useDienThoai();
  const dx = cheDo === 'de-xuat';
  const lopDich = useApi<LopDichData>(`/chuyen-lop/lop-dich?studentId=${studentId}`, [studentId]);
  const [toClassId, setToClassId] = useState<number | null>(duyet?.lopDichId ?? null);
  /* GVCN không có quyền xem luật ra lệnh (403) — chỉ Quản lý gọi đường xem trước. */
  const xem = useApi<XemChuyenLopData>(dx ? null : (toClassId ? `/students/${studentId}/chuyen-lop?toClassId=${toClassId}` : `/students/${studentId}/chuyen-lop`), [studentId, toClassId, dx]);
  const [tuan, setTuan] = useState(duyet?.tuan ?? '');
  const [lyDo, setLyDo] = useState(duyet?.lyDo ?? '');
  const [mucTieu, setMucTieu] = useState('');
  const [dangHuy, setDangHuy] = useState(false);
  const [lyDoHuy, setLyDoHuy] = useState('');
  const lf = useLoiForm();
  const [busy, setBusy] = useState(false);
  /* Đổi lớp → đường xem trước mới (dữ liệu về null một lúc): phần không theo lớp (đang học, lệnh, tuần) giữ bản đã nạp — không nháy khung. */
  const nenRef = useRef<XemChuyenLopData | null>(null);
  if (xem.data) nenRef.current = xem.data;
  const nen = nenRef.current;
  const lenh = nen?.lenh ?? null;
  const tuanChon = nen?.tuanChon ?? (homNay ? tuanChonDuoc(homNay) : []);

  /* Điền sẵn từ lệnh đang có (chế độ sửa) — một lần khi dữ liệu về. */
  const [daDien, setDaDien] = useState(false);
  useEffect(() => {
    if (daDien || !xem.data) return;
    setDaDien(true);
    const l = xem.data.lenh;
    if (l && !duyet) {
      /* Lệnh đã tới tuần mà chưa chuyển được: điền sẵn tuần hợp lệ gần nhất (PR-S5F-a) — tuần cũ máy chủ không nhận. */
      setToClassId(l.lopDichId); setTuan(l.tuan >= (xem.data.tuanChon[0] ?? '') ? l.tuan : xem.data.tuanChon[0] ?? ''); setLyDo(l.lyDo ?? '');
      setMucTieu(l.mucTieu == null ? '' : String(l.mucTieu));
    } else if (!duyet?.tuan) setTuan(xem.data.tuanChon[0] ?? '');
  }, [xem.data, daDien, duyet]);

  /* Luật I1: "Huỷ thay đổi" thay "Đóng" khi đã sửa. Mốc = giá trị sau khi điền sẵn (lệnh đang có / đề xuất cần duyệt) xong. */
  const hienTai = JSON.stringify([toClassId, tuan, lyDo, mucTieu]);
  const goc = useRef<string | null>(null);
  if ((daDien || dx) && goc.current === null) goc.current = hienTai;
  const daSua = goc.current !== null && hienTai !== goc.current;

  const dich = (lopDich.data?.lop ?? []).find((l) => l.id === toClassId) ?? null;
  const ds = dsLopDich(lopDich.data?.lop ?? []);
  const han = hanBanGiao(nen?.today ?? homNay ?? '2000-01-01');
  const dangHoc = nen?.hienTai;
  /* Xem trước của ĐÚNG lớp đang chọn (đổi lớp → đường mới, dữ liệu cũ không dùng). */
  const xemLop = !dx && toClassId && xem.data?.huong && !xem.loading ? xem.data : null;
  /* §7: Lên FT từ lớp thường mà em chưa có Target nào (GVCN ghi / khoá) → hỏi Target. */
  const oTarget = !!xemLop && canHoiTarget(xemLop.hienTai.ft, !!dich?.ft, xemLop.targetSan);
  /* M1: xem trước của lớp vừa chọn chưa về → chưa biết có cần Target → chưa cho gửi. */
  const choXem = !dx && !!toClassId && !xemLop && !xem.error;

  const LUAT: LuatTruong[] = dx
    ? [{ khoa: 'ly-do', nhan: 'Lý do', toiThieu: 1 }]   // T7 (PR-MTa): không tối thiểu ký tự
    : [
      { khoa: 'lop', nhan: 'Lớp chuyển đến', chon: true },
      { khoa: 'tuan', nhan: 'Tuần bắt đầu', chon: true },
      { khoa: 'ly-do', nhan: 'Lý do', toiThieu: 1 },
    ];
  /* Target: trống "Chưa điền", sai "Gõ band 0–9…" ngay tại ô (cùng luật máy chủ; "6,5" đọc là 6.5). */
  const oT = docOTarget(mucTieu);
  const loi = [...dsLoi(LUAT, { lop: toClassId, tuan, 'ly-do': lyDo }), ...(oTarget && oT.loi ? [{ khoa: 'muc-tieu', nhan: 'Target', lyDo: oT.loi }] : [])];
  /* Không hỏi Target → không gửi: máy chủ lấy Target LTT / khoá; sửa lệnh thì giữ Target + Dự kiến thi của lệnh (R-C3). */
  const mucTieuGui = oTarget ? oT.giaTri : undefined;
  const xong = (chu: string) => { xongChuyen(); toast.push('ok', chu); onDone?.(); onClose(); };

  const gui = async () => {
    lf.bam();
    if (loi.length > 0) return;
    setBusy(true);
    try {
      if (dx) {
        await api.post(`/students/${studentId}/de-xuat-chuyen-lop`, { toClassId: toClassId ?? undefined, tuan: tuan || undefined, lyDo: lyDo.trim() });
        xong('Đã gửi đề xuất — Quản lý sẽ xem trong Chờ duyệt');
      } else if (duyet) {
        await api.post(`/yeu-cau/${duyet.id}/duyet`, { duLieu: { lopDichId: toClassId, tuan, lyDo: lyDo.trim(), mucTieu: mucTieuGui } });
        xong('Đã duyệt và quyết định chuyển lớp');
      } else {
        /* PR-CL (B1, D15): ra mới hoặc sửa lệnh đang chờ — cùng một đường, máy chủ tính bối cảnh + hướng. */
        await api.post(`/students/${studentId}/transfer`, { toClassId, tuan, lyDo: lyDo.trim(), mucTieu: mucTieuGui });
        xong('Đã lưu quyết định chuyển lớp');
      }
    } catch (e: any) { toast.push('error', loiMayChu(e)); } finally { setBusy(false); }
  };
  const huyLenh = async () => {
    if (!lenh || !lyDoHuy.trim()) return;
    setBusy(true);
    try { await api.post(`/lenh-chuyen/${lenh.id}/huy`, { lyDo: lyDoHuy.trim() }); xong('Đã huỷ quyết định chuyển lớp'); } catch (e: any) { toast.push('error', loiMayChu(e)); } finally { setBusy(false); }
  };

  const nhanChinh = dx ? 'Gửi đề xuất' : duyet ? 'Duyệt và quyết định' : lenh ? CHU_CHUYEN_LOP.luu : CHU_CHUYEN_LOP.quyetDinh;
  /* Lỗi nạp lần đầu → cả panel báo lỗi + Thử lại; lỗi xem trước của MỘT lớp → chỉ khối "Khi chuyển" (ô đã nhập giữ nguyên). */
  const loiNap = lopDich.error ?? (dx || nen ? null : xem.error);

  return (
    <KhungPanel tieuDe={dx ? 'Đề xuất chuyển lớp' : 'Chuyển lớp'} hocVien={studentName} lop={dt ? null : lop} onDong={onClose}
      chan={{
        daSua, huy: { onClick: onClose, disabled: busy },
        ...(!dx && lenh && !duyet ? { xoa: { nhan: CHU_CHUYEN_LOP.huy, onClick: () => setDangHuy((v) => !v) } } : {}),
        conThieu: conThieuChu(lf.daBam, loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] max-sm:flex-1 sm:min-h-0" onClick={gui} disabled={busy || !!loiNap || choXem}>{busy ? 'Đang lưu…' : nhanChinh}</button>,
        dongTren: !dx && dangHoc ? (
          <p className="m-0 px-4 pt-2 text-xs text-slate-400">GVCN {dangHoc.lop.code} bàn giao, hạn hết {ngay(han.gvcn, homNay)}.</p>
        ) : undefined,
      }}>
      {loiNap ? <ErrorState message={loiNap.message} hint={loiNap.hint} onRetry={() => { lopDich.reload(); xem.reload(); }} />
        : lopDich.loading || (!dx && !nen) ? <div className="mt-3"><Skeleton rows={5} /></div> : (
        <>
          {!dx && dangHoc && (
            <p className="mb-0 mt-3 text-xs text-slate-400">
              Đang học {[dangHoc.lop.code, dangHoc.ft ? `FT ${dangHoc.route ?? ''}`.trim() : kyHieuLop(dangHoc.ma, null),
                dangHoc.tuanHoc ? chuTuanHoc(dangHoc.tuanHoc.tuan, dangHoc.tuanHoc.tong, dangHoc.tuanHoc.dangDung) : null,
                nen?.tuLopThuong ? `từ ${nen.tuLopThuong}` : null].filter(Boolean).join(' · ')}
            </p>
          )}
          {lenh?.loi && !duyet && <p role="alert" className="mb-0 mt-2 text-xs text-late">Chưa chuyển được: {lenh.loi}</p>}
          {!dx && lenh && !duyet && !lenh.loi && <p className="mb-0 mt-2 text-xs text-slate-400">Em đã có quyết định chuyển lớp bắt đầu {tuanLich(lenh.tuan, homNay)} — sửa hoặc huỷ trước tuần đó.</p>}
          {!dx && lenh?.loi && !duyet && <p className="mb-0 mt-1 text-xs text-slate-400">Chọn tuần hoặc lớp chuyển đến mới rồi lưu, hoặc huỷ quyết định.</p>}
          {dangHuy && (
            <Khoi tieuDe={CHU_CHUYEN_LOP.huy}>
              <Truong nhan="Lý do huỷ" batBuoc>
                <input className="field w-full" value={lyDoHuy} onChange={(e) => setLyDoHuy(e.target.value)} />
              </Truong>
              <button type="button" className="btn btn-danger min-h-[44px] sm:min-h-0" disabled={busy || !lyDoHuy.trim()} onClick={huyLenh}>Xác nhận huỷ quyết định</button>
            </Khoi>
          )}

          <Khoi tieuDe={dx ? 'Đề xuất' : 'Lớp chuyển đến'}>
            <Truong nhan="Lớp chuyển đến" batBuoc={!dx} tuyChon={dx} as="div" loi={lf.loiCua(loi, 'lop')}>
              <OLopDich ds={ds} value={toClassId} onChange={setToClassId} ariaLabel="Lớp chuyển đến"
                id={lf.oId('lop')} onBlur={lf.roi('lop')} invalid={!!lf.loiCua(loi, 'lop')} disabled={busy} />
              {dich && (
                <span className="mt-1 block text-xs text-slate-500">{[`GVCN ${dich.gvcn ?? 'chưa có'}`, dich.tuan ? `tuần học ${dich.tuan.replace(/^W/, '')}` : null].filter(Boolean).join(' · ')}</span>
              )}
            </Truong>
            {!dx && dich && dangHoc && dich.chiNhanhId !== dangHoc.chiNhanhId && (
              <p className="m-0 text-xs text-soon">Quản lý chi nhánh và GVCN lớp mới sẽ nhận thông báo “Sắp nhận”.</p>
            )}
            <Truong nhan={dx ? 'Từ tuần' : 'Tuần bắt đầu'} batBuoc={!dx} tuyChon={dx} as="div" loi={lf.loiCua(loi, 'tuan')}>
              {dx ? <OTuan tuanChon={tuanChon} rong value={tuan} onChange={setTuan} ariaLabel="Từ tuần" chuaChon="Chưa chọn" />
                : <OTuanBatDau tuanChon={tuanChon} tuan={tuan} setTuan={setTuan} homNay={homNay} oProps={lf.o(loi, 'tuan')} />}
            </Truong>
            <Truong nhan="Lý do" batBuoc loi={lf.loiCua(loi, 'ly-do')}>
              <textarea className="field w-full" rows={2} maxLength={2000} {...lf.o(loi, 'ly-do')} value={lyDo} onChange={(e) => setLyDo(e.target.value)}
                placeholder={dx ? 'Ví dụ: Phụ huynh xin chuyển sang lớp khác giờ học' : 'Ghi lý do'} />
            </Truong>
            {oTarget && (
              <Truong nhan="Target" batBuoc as="div" loi={lf.loiCua(loi, 'muc-tieu')} phu="Em chưa có Target · band 0–9 hoặc KCK">
                <OTarget value={mucTieu} onChange={setMucTieu} ariaLabel="Target" oProps={lf.o(loi, 'muc-tieu')} />
              </Truong>
            )}
          </Khoi>

          {dx ? (
            <p className="mb-0 mt-3 text-xs text-slate-400">
              Gửi thành thẻ trong Chờ duyệt của Quản lý (loại Thông tin HV, hạn 5 ngày). Quản lý duyệt = ra quyết định chuyển lớp; Quản lý được sửa lớp và tuần trước khi duyệt.
            </p>
          ) : toClassId && (
            <Khoi tieuDe="Khi chuyển, web sẽ">
              {!xemLop ? <p className="m-0 text-sm text-slate-400">{xem.error ? xem.error.message : 'Đang xem trước…'}</p> : (
                <div className={xemLop.canhBao ? 'rounded-lg border p-3' : ''} style={xemLop.canhBao ? khoiVang : undefined} role={xemLop.canhBao ? 'note' : undefined}>
                  <ul className="m-0 list-disc space-y-1 pl-5 text-sm text-slate-200">{xemLop.khiChuyen.map((c) => <li key={c}>{c}</li>)}</ul>
                </div>
              )}
            </Khoi>
          )}
        </>
      )}
    </KhungPanel>
  );
}

// ---------------------------------------------------------------- Chuyển lớp NHIỀU em (PR-CL C1 — mở từ Công việc "Xét lại lộ trình")

type EmXetLai = { studentId: number; ten: string; huong: 'len_lop' | 'fast_track' | 'hoc_lai'; tyLe: number; lopHienTai: { id: number; code: string } };
type XemEm = { nap: true } | { loi: string } | { nguonFt: boolean; dichFt: boolean; khiChuyen: string[]; canhBao: boolean; hoiTarget: boolean };
const DA_CHOT: Record<EmXetLai['huong'], string> = { len_lop: 'Lên lớp', fast_track: 'Lên FT', hoc_lai: 'Học lại' };
/** 1440: ☑ · Học viên · Final Test · Đang ở · Lớp chuyển đến (mockup phần 2 ④). */
const LUOI_NHIEU = 'grid grid-cols-[28px_minmax(11rem,1.2fr)_5.5rem_8rem_minmax(16rem,1.6fr)] items-start gap-x-3';

/**
 * CHUYỂN LỚP NHIỀU EM — mở từ Công việc QL "Xét lại lộ trình · {lớp} · n em" (`?viec=xet-lai` ở hồ sơ lớp nguồn), đã chọn sẵn các em
 * (`GET /classes/:id/xet-lai-lo-trinh`, cùng tập em với dòng việc). Tuần + Lý do chung, mỗi em một ô lớp; em chưa chọn lớp = bỏ qua.
 * Gửi tuần tự từng em `POST /students/:id/transfer` — em lỗi giữ hàng đỏ + chữ lỗi, em đã chuyển không gửi lại.
 * ponytail: mỗi em một lời gọi (≤ TOI_DA_NHIEU_EM em/lần); cần một lời gọi gộp khi Xét lại > 50 em.
 */
export function ChuyenLopNhieuEm({ classId, onClose, onDone }: { classId: number; onClose: () => void; onDone?: () => void }) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const dt = useDienThoai();
  const { data, loading, error, reload } = useApi<{ lop: { id: number; code: string }; em: EmXetLai[] }>(`/classes/${classId}/xet-lai-lo-trinh`, [classId]);
  const [boChon, setBoChon] = useState<ReadonlySet<number>>(new Set());
  const [lop, setLop] = useState<Record<number, number | null>>({});
  const [xem, setXem] = useState<Record<number, XemEm>>({});
  const [loiEm, setLoiEm] = useState<Record<number, string>>({});
  const [daXong, setDaXong] = useState<ReadonlySet<number>>(new Set());
  const [mucTieu, setMucTieu] = useState<Record<number, string>>({});
  const tuanChon = homNay ? tuanChonDuoc(homNay) : [];
  const [tuan, setTuan] = useState('');
  const [lyDo, setLyDo] = useState('');
  const [busy, setBusy] = useState(false);
  const lf = useLoiForm();
  const moiNhat = useRef<Record<number, number | null>>({});
  useEffect(() => { if (!tuan && tuanChon[0]) setTuan(tuanChon[0]); }, [tuan, tuanChon]);

  const ds = (data?.em ?? []).slice(0, TOI_DA_NHIEU_EM);
  const rows = ds.map((e) => ({ e, chon: !boChon.has(e.studentId), lop: lop[e.studentId] ?? null, xong: daXong.has(e.studentId) }));
  const { gui: canGui, boQua } = chonGuiNhieuEm(rows);
  const LUAT: LuatTruong[] = [{ khoa: 'tuan', nhan: 'Tuần bắt đầu', chon: true }, { khoa: 'ly-do', nhan: 'Lý do', toiThieu: 1 }];
  /* I1 (§7): em Lên FT từ lớp thường mà chưa có Target nào → ô Target ở hàng em; thiếu thì "Còn thiếu: Target · {tên}". */
  const hoiTarget = (sid: number) => { const x = xem[sid]; return !!x && 'hoiTarget' in x && x.hoiTarget; };
  const loi: LoiTruong[] = [...dsLoi(LUAT, { tuan, 'ly-do': lyDo }),
    ...canGui.flatMap((r) => { const l = hoiTarget(r.e.studentId) ? docOTarget(mucTieu[r.e.studentId] ?? '').loi : null;
      return l ? [{ khoa: `muc-tieu-${r.e.studentId}`, nhan: `Target · ${r.e.ten}`, lyDo: l }] : []; })];
  /* M1: còn em đang xem trước → chưa biết có cần Target → chưa cho gửi. */
  const choXem = canGui.some((r) => { const x = xem[r.e.studentId]; return !x || 'nap' in x; });
  const daSua = Object.values(lop).some((v) => v !== null) || !!lyDo.trim();

  const chonLop = (sid: number, id: number | null, dichFt: boolean) => {
    moiNhat.current[sid] = id;
    setLop((m) => ({ ...m, [sid]: id }));
    setLoiEm((m) => { const { [sid]: _, ...con } = m; return con; });
    if (id === null) return;
    setXem((m) => ({ ...m, [sid]: { nap: true } }));
    api.get<XemChuyenLopData>(`/students/${sid}/chuyen-lop?toClassId=${id}`)
      .then((r) => { if (moiNhat.current[sid] === id) setXem((m) => ({ ...m, [sid]: { nguonFt: r.hienTai.ft, dichFt, khiChuyen: r.khiChuyen, canhBao: r.canhBao, hoiTarget: canHoiTarget(r.hienTai.ft, dichFt, r.targetSan) } })); })
      .catch((e: any) => { if (moiNhat.current[sid] === id) setXem((m) => ({ ...m, [sid]: { loi: loiMayChu(e) } })); });
  };

  const gui = async () => {
    lf.bam();
    if (loi.length > 0 || !canGui.length || choXem) return;
    /* M5: đang gửi thì ✕ / Esc / Đóng bị khoá (`dong` bỏ qua khi busy) — vòng gửi chạy hết mọi em rồi mới báo kết quả. */
    setBusy(true);
    const ok: number[] = []; const hong: Record<number, string> = {};
    for (const r of canGui) {
      try {
        await api.post(`/students/${r.e.studentId}/transfer`, {
          toClassId: r.lop, tuan, lyDo: lyDo.trim(), mucTieu: hoiTarget(r.e.studentId) ? docOTarget(mucTieu[r.e.studentId] ?? '').giaTri : undefined,
        });
        ok.push(r.e.studentId);
      } catch (e: any) { hong[r.e.studentId] = loiMayChu(e); }
    }
    setBusy(false);
    if (ok.length) { xongChuyen(); setDaXong((s) => new Set([...s, ...ok])); }
    setLoiEm((m) => ({ ...m, ...hong }));
    const k = Object.keys(hong).length;
    if (!k) { toast.push('ok', `Đã quyết định chuyển lớp ${ok.length} em`); onDone?.(); onClose(); }
    else toast.push('error', `${k} em chưa chuyển được — xem lỗi ở từng hàng`);
  };

  const tieuDe = data ? `Chuyển lớp · ${data.lop.code} · ${ds.length} em` : 'Chuyển lớp';
  const dong = () => { if (!busy) onClose(); };
  if (error) return <KhungPanel tieuDe={tieuDe} onDong={onClose}><ErrorState message={error.message} hint={error.hint} onRetry={reload} /></KhungPanel>;
  if (loading || !data) return <KhungPanel tieuDe={tieuDe} rong="toan" onDong={onClose}><div className="mt-3"><Skeleton rows={6} /></div></KhungPanel>;
  if (!ds.length) {
    return <KhungPanel tieuDe={tieuDe} onDong={onClose} chan={{}}><p className="mt-3 text-sm text-slate-400">Không còn em cần xét lại.</p></KhungPanel>;
  }

  const tomTat = canGui.map((r) => {
    const x = xem[r.e.studentId];
    return !x || 'nap' in x ? { k: r.e.studentId, chu: `${r.e.ten} · đang xem trước…`, vang: false, loi: false }
      : 'loi' in x ? { k: r.e.studentId, chu: `${r.e.ten}: ${x.loi}`, vang: false, loi: true }
        : { k: r.e.studentId, chu: tomTatChuyenEm(r.e.ten, x.nguonFt, x.dichFt, x.khiChuyen), vang: x.canhBao, loi: false };
  });
  const vang = tomTat.some((t) => t.vang);

  return (
    <KhungPanel rong="toan" tieuDe={tieuDe} onDong={dong}
      chan={{
        daSua, huy: { onClick: dong, disabled: busy },
        conThieu: conThieuChu(lf.daBam, loi),
        dongTren: (
          <p className="m-0 px-4 pt-2 text-xs tabular-nums text-slate-400" role="status">
            Chuyển <b className="text-slate-100">{canGui.length}</b> · Bỏ qua <b className="text-slate-100">{boQua}</b> (chưa chọn lớp)
          </p>
        ),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] max-sm:flex-1 sm:min-h-0" onClick={gui} disabled={busy || !canGui.length || choXem}>
          {busy ? 'Đang lưu…' : `${CHU_CHUYEN_LOP.quyetDinh} · ${canGui.length} em`}</button>,
      }}>
      <p className="mb-0 mt-3 text-xs text-slate-400">Kết quả không phù hợp lộ trình — xét lại, không bắt buộc đổi.</p>
      {data.em.length > TOI_DA_NHIEU_EM && <p className="mb-0 mt-1 text-xs text-slate-400">Hiện {TOI_DA_NHIEU_EM}/{data.em.length} em — chuyển xong sẽ hiện tiếp.</p>}

      <div role={dt ? 'list' : 'table'} aria-label={`Chuyển lớp · ${data.lop.code}`} className={dt ? 'mt-3 space-y-2' : 'surface-2 mt-3 overflow-x-auto rounded-lg'}>
        {!dt && (
          <div role="row" className={`${LUOI_NHIEU} min-w-max border-b px-3 py-2 text-[11px] font-extrabold uppercase tracking-[.06em] text-slate-500 lg:min-w-0`} style={{ borderColor: 'var(--line)' }}>
            <span role="columnheader"><span className="sr-only">Chọn</span></span>
            <span role="columnheader">Học viên</span>
            <span role="columnheader">Final Test</span>
            <span role="columnheader">Đang ở</span>
            <span role="columnheader">Lớp chuyển đến</span>
          </div>
        )}
        <div role={dt ? undefined : 'rowgroup'} className={dt ? 'space-y-2' : 'divide-y'} style={dt ? undefined : { borderColor: 'var(--line)' }}>
          {rows.map((r) => (
            <HangNhieuEm key={r.e.studentId} e={r.e} dt={dt} chon={r.chon} xong={r.xong} lop={r.lop} loi={loiEm[r.e.studentId] ?? null} busy={busy}
              hoiTarget={hoiTarget(r.e.studentId)} mucTieu={mucTieu[r.e.studentId] ?? ''} onMucTieu={(v) => setMucTieu((m) => ({ ...m, [r.e.studentId]: v }))}
              loiTarget={lf.daBam ? loi.find((l) => l.khoa === `muc-tieu-${r.e.studentId}`)?.lyDo ?? null : null}
              onChon={(v) => setBoChon((s) => { const n = new Set(s); if (v) n.delete(r.e.studentId); else n.add(r.e.studentId); return n; })}
              onLop={(id, ft) => chonLop(r.e.studentId, id, ft)} />
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Truong nhan="Tuần bắt đầu" batBuoc as="div" loi={lf.loiCua(loi, 'tuan')}>
          <OTuanBatDau tuanChon={tuanChon} tuan={tuan} setTuan={setTuan} homNay={homNay} oProps={lf.o(loi, 'tuan')} />
        </Truong>
        <Truong nhan="Lý do" batBuoc loi={lf.loiCua(loi, 'ly-do')}>
          <textarea className="field w-full" rows={2} maxLength={2000} {...lf.o(loi, 'ly-do')} value={lyDo} onChange={(e) => setLyDo(e.target.value)}
            placeholder="Ví dụ: Xét lại lộ trình sau Final" />
        </Truong>
      </div>

      {tomTat.length > 0 && (
        <Khoi tieuDe="Khi chuyển, web sẽ">
          <div className={vang ? 'rounded-lg border p-3' : ''} style={vang ? khoiVang : undefined} role={vang ? 'note' : undefined}>
            <ul className="m-0 list-disc space-y-1 pl-5 text-sm text-slate-200">
              {tomTat.map((t) => <li key={t.k} className={t.loi ? 'text-late' : t.chu.includes('đang xem trước') ? 'text-slate-400' : ''}>{t.chu}</li>)}
            </ul>
          </div>
        </Khoi>
      )}
    </KhungPanel>
  );
}

/** Một em ở panel nhiều em — 1440 một hàng bảng, 375 một thẻ. Danh sách lớp của TỪNG em (`lop-dich?studentId=`: lọc hợp lệ theo lớp em đang học). */
function HangNhieuEm({ e, dt, chon, xong, lop, loi, busy, onChon, onLop, hoiTarget, mucTieu, onMucTieu, loiTarget }: {
  e: EmXetLai; dt: boolean; chon: boolean; xong: boolean; lop: number | null; loi: string | null; busy: boolean;
  hoiTarget: boolean; mucTieu: string; onMucTieu: (v: string) => void; loiTarget: string | null;
  onChon: (v: boolean) => void; onLop: (id: number | null, dichFt: boolean) => void;
}) {
  const lopDich = useApi<LopDichData>(`/chuyen-lop/lop-dich?studentId=${e.studentId}`, [e.studentId]);
  const dsLop = lopDich.data?.lop ?? [];
  const khoa = busy || xong || !chon;
  const final = <b className={`tabular-nums ${e.tyLe < 0.5 ? 'text-bad' : 'text-slate-100'}`}>{chuTyLeXetLai(e.tyLe)}</b>;
  const oLop = xong ? <span className="text-sm text-ok">Đã quyết định chuyển lớp</span>
    : lopDich.error ? <span className="text-xs text-late">{lopDich.error.message} <button type="button" className="link border-0 bg-transparent p-0" onClick={lopDich.reload}>Thử lại</button></span>
      : lopDich.loading ? <span className="text-xs text-slate-500">Đang tải lớp…</span>
        : <OLopDich ds={dsLopDich(dsLop)} value={lop} onChange={(id) => onLop(id, !!dsLop.find((l) => l.id === id)?.ft)} ariaLabel={`Lớp chuyển đến của ${e.ten}`} disabled={khoa} invalid={!!loi} />;
  const oChon = <input type="checkbox" className="mt-1 h-4 w-4" aria-label={`Chọn ${e.ten}`} checked={chon && !xong} disabled={busy || xong} onChange={(ev) => onChon(ev.target.checked)} />;
  const ten = <span className="block min-w-0"><span className="font-semibold text-slate-100">{e.ten}</span><span className="block text-xs text-slate-400">Đã chốt: {DA_CHOT[e.huong]}</span></span>;
  /* I1: Target gọn dưới ô lớp, chỉ khi em chưa có Target nào (§7). */
  const oTarget = hoiTarget && !xong && (
    <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="text-xs font-bold text-slate-200">Target <span aria-hidden className="text-bad">*</span></span>
      <OTarget value={mucTieu} onChange={onMucTieu} ariaLabel={`Target của ${e.ten}`} disabled={khoa} oProps={{ id: `o-muc-tieu-${e.studentId}`, 'aria-invalid': !!loiTarget }} />
      {loiTarget && <span className="text-xs text-late">{loiTarget === 'Chưa điền' ? 'Em chưa có Target — ghi band hoặc KCK' : loiTarget}</span>}
    </span>
  );
  const chuLoi = loi && <span role="alert" className="mt-1 block text-xs text-late">{loi}</span>;
  const vien = loi ? { background: 'rgb(var(--late-bg-rgb))' } : undefined;   // hàng lỗi máy chủ: nền đỏ nhạt + chữ lỗi (không vạch trái)

  if (dt) {
    return (
      <div role="listitem" className={`surface-2 rounded-lg p-3 ${chon || xong ? '' : 'opacity-60'}`} style={vien}>
        <label className="flex min-h-[44px] items-start gap-2.5">
          {oChon}
          <span className="min-w-0 flex-1">{ten}</span>
          {final}
        </label>
        <p className="mb-2 mt-1 text-xs text-slate-400">Đang ở {e.lopHienTai.code}</p>
        <span className="mb-1 block text-[11.5px] font-bold text-slate-200">Lớp chuyển đến</span>
        {oLop}{oTarget}{chuLoi}
      </div>
    );
  }
  return (
    <div role="row" className={`${LUOI_NHIEU} min-w-max px-3 py-2.5 text-sm lg:min-w-0 ${chon || xong ? '' : 'opacity-60'}`} style={vien}>
      <span role="cell">{oChon}</span>
      <span role="cell">{ten}</span>
      <span role="cell" className="pt-0.5">{final}</span>
      <span role="cell" className="pt-0.5 text-slate-200">{e.lopHienTai.code}</span>
      <span role="cell" className="min-w-0">{oLop}{oTarget}{chuLoi}</span>
    </div>
  );
}
