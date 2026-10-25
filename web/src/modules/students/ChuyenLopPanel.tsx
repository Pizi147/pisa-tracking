import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ErrorState, NutChon, OKck, Skeleton } from '../../ui/ui.tsx';
import { ChonLop, type LopChon } from '../../ui/ChonLop.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { KHOI_VANG, NutHomNay, OTuan } from '../classes/TransitionPanel.tsx';
import { t } from '@shared/i18n/index.ts';
import {
  CHU_CHUYEN_LOP, canHoiTarget, chuTargetKck, tachKck, docOTarget, chuTuanHoc, dsLoi, hanBanGiaoLenh, kyHieuLop, laChuyenNgay,
  mondayOfDate, ngay, nhanTuanBatDau, phuLopDich, thuNgay, tuanChonDuoc, tuanLich, type LoiTruong, type LuatTruong, type MucTieuLenh,
} from '@shared/domain/index.ts';

type LopDich = {
  id: number; code: string; chiNhanhId: number; branchCode: string | null; ma: string | null; ft: boolean; route: string | null;
  tenChuongTrinh: string | null; tuan: string | null; gvcn: string | null; siSo?: number;
};
type LopDichData = { lop: LopDich[]; nguon: { ft: boolean; tuCuoiKhoa: boolean } };
type LenhCho = { id: number; huong: string; lopDichId: number | null; tuan: string; mucTieu: MucTieuLenh | null; lyDo: string | null; loi: string | null; hanGvcn?: string | null };
type XemChuyenLopData = {
  hienTai: { lop: { id: number; code: string }; ma: string | null; ft: boolean; chiNhanhId: number; route: string | null; tuanHoc: { tuan: number | null; tong: number | null; dangDung: boolean } | null };
  lenh: LenhCho | null; tuanChon: string[]; today: string; tuanFinal?: string | null; boiCanh?: string | null;
  /** PR-CL (B3): null khi chưa chọn lớp. */
  huong: string | null; targetSan: MucTieuLenh | null; khiChuyen: string[]; canhBao: boolean; tuLopThuong: string | null;
  /** Luật lộ trình của lớp đang chọn — `giu` = cùng chương trình, lộ trình + bài dở đi theo em (OV-13l). */
  luat?: { khoa: 'giu' | 'dong-mo' } | null;
};

/** Thẻ Đề xuất chuyển lớp đang được duyệt: panel mở điền sẵn, nút chính `Duyệt và quyết định` (mockup 20 — thẻ Chờ duyệt → D). */
export type DuyetDeXuat = { id: number; lopDichId: number | null; tuan: string | null; lyDo: string | null };

/** Ô gõ tên lớp: gợi ý "mã lớp · FT LT1 · CP · 9 em" (GVCN đề xuất: không sĩ số — máy chủ không trả `siSo`). */
const dsLopDich = (lop: readonly LopDich[]): LopChon[] => lop.map((l) => ({ id: l.id, ma: l.code, phu: phuLopDich(l, 'siSo' in l) }));
/** Mockup phần 2: "Còn thiếu: Lý do" ở chân (lý do từng ô vẫn nằm dưới ô); có ô ghi sai (Target 12) → "Cần sửa: …". */
const conThieuChu = (daBam: boolean, loi: readonly LoiTruong[]) => (daBam && loi.length
  ? [{ nhan: 'Còn thiếu', lyDo: `${loi.every((l) => l.lyDo.startsWith('Chưa')) ? 'Còn thiếu' : 'Cần sửa'}: ${loi.map((l) => l.nhan).join(', ')}` }] : undefined);
const loiMayChu = (e: any) => e?.message ?? 'Không lưu được — thử lại.';
const khoiVang = KHOI_VANG;

/** Target + ô tích KCK (§7: chỉ khi em chưa có Target nào) — panel một em và hàng nhiều em. OV-9: giá trị chữ "6.5" · "6.5 KCK" · "KCK". */
function OTarget({ value, onChange, ariaLabel, oProps, disabled }: {
  value: string; onChange: (v: string) => void; ariaLabel: string; oProps?: Record<string, unknown>; disabled?: boolean;
}) {
  const { so, kck } = tachKck(value);
  const s = String(so ?? '');
  return (
    <span className="flex items-center gap-3">
      <input className="field w-20 tabular-nums" inputMode="decimal" aria-label={ariaLabel} {...oProps} disabled={disabled}
        value={s} onChange={(e) => onChange(chuTargetKck(e.target.value || null, kck))} />
      <OKck chon={kck} disabled={disabled} onChange={(v) => onChange(chuTargetKck(s || null, v))} />
    </span>
  );
}

/** "Tuần bắt đầu": "Ngay hôm nay" (OV-13l) + 3 mã tuần + "Chọn tuần" → ô tuần (`OTuan`). */
export function OTuanBatDau({ tuanChon, tuan, setTuan, homNay, oProps }: {
  tuanChon: string[]; tuan: string; setTuan: (t: string) => void; homNay: string | null; oProps: Record<string, unknown>;
}) {
  const [khac, setKhac] = useState(false);
  const nut = tuanChon.slice(0, 3);
  const ngoai = khac || (!!tuan && !nut.includes(tuan) && tuan !== homNay);
  return (
    <>
      <div {...oProps} tabIndex={-1} className="flex flex-wrap gap-1.5 outline-none">
        <NutHomNay homNay={homNay} chon={!!homNay && tuan === homNay && !khac} onClick={() => { if (homNay) setTuan(homNay); setKhac(false); }} />
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
 *   · `cheDo="de-xuat"` (GVCN): `Đề xuất chuyển lớp` → thẻ Chờ duyệt (5 ngày); gợi ý lớp không có sĩ số. Kèm `duyet` = người gửi Sửa thẻ còn chờ (OV-7a).
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
  /* OV-13l: "Ngay hôm nay" đã thi hành → panel ở trạng thái "Đã chuyển" (không Hoàn tác). */
  const [daChuyen, setDaChuyen] = useState<{ lop: { id: number; code: string }; han: string } | null>(null);
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
    /* OV-13l: GVCN đề xuất "Ngay hôm nay" của một ngày trước → duyệt hôm nay = "Ngay hôm nay" của ngày duyệt (máy chủ cùng luật `tuanDuyet`). */
    else if (duyet.tuan < xem.data.today && mondayOfDate(duyet.tuan) !== duyet.tuan) setTuan(xem.data.today);
  }, [xem.data, daDien, duyet]);

  /* Luật I1: "Huỷ thay đổi" thay "Đóng" khi đã sửa. Mốc = giá trị sau khi điền sẵn (lệnh đang có / đề xuất cần duyệt) xong. */
  const hienTai = JSON.stringify([toClassId, tuan, lyDo, mucTieu]);
  const goc = useRef<string | null>(null);
  if ((daDien || dx) && goc.current === null) goc.current = hienTai;
  const daSua = goc.current !== null && hienTai !== goc.current;

  const dich = (lopDich.data?.lop ?? []).find((l) => l.id === toClassId) ?? null;
  const ds = dsLopDich(lopDich.data?.lop ?? []);
  /* OV-11d (HV-13): CÙNG hạn máy chủ ghi lên lệnh — lệnh đang có giữ hạn đã lưu; lệnh mới `hanBanGiaoLenh` (FT 5 ngày · lớp thường Cuối khoá hết tuần Final). */
  const hanGvcn = lenh?.hanGvcn ?? hanBanGiaoLenh({
    nguonFt: !!nen?.hienTai.ft, boiCanh: xem.data?.boiCanh ?? (lopDich.data?.nguon.tuCuoiKhoa ? 'cuoi-khoa' : 'giua-khoa'),
    tuanFinal: nen?.tuanFinal ?? null, ngay: nen?.today ?? homNay ?? '2000-01-01',
  }).gvcn;
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
  /* OV-13l: ngày máy chủ (cùng ngày `tuanHopLe` kiểm). Chuyển ngay chỉ ở chế độ Quản lý ra lệnh. */
  const homNayMay = nen?.today ?? homNay ?? null;
  const ngayNay = !dx && !!homNayMay && laChuyenNgay(tuan, homNayMay);

  const gui = async () => {
    lf.bam();
    if (loi.length > 0) return;
    setBusy(true);
    try {
      if (dx && duyet) {
        /* OV-7a: người gửi sửa thẻ Đề xuất còn chờ — cùng form, điền sẵn. */
        await api.put(`/yeu-cau/${duyet.id}`, { toClassId: toClassId ?? null, tuan: tuan || null, lyDo: lyDo.trim() });
        xong('Đã lưu đề xuất');
      } else if (dx) {
        await api.post(`/students/${studentId}/de-xuat-chuyen-lop`, { toClassId: toClassId ?? undefined, tuan: tuan || undefined, lyDo: lyDo.trim() });
        xong('Đã gửi đề xuất — Quản lý sẽ xem trong Chờ duyệt');
      } else if (duyet) {
        await api.post(`/yeu-cau/${duyet.id}/duyet`, { duLieu: { lopDichId: toClassId, tuan, lyDo: lyDo.trim(), mucTieu: mucTieuGui } });
        if (ngayNay && dich) { xongChuyen(); setDaChuyen({ lop: { id: dich.id, code: dich.code }, han: hanGvcn }); } else xong('Đã duyệt và quyết định chuyển lớp');
      } else {
        /* PR-CL (B1, D15): ra mới hoặc sửa lệnh đang chờ — cùng một đường, máy chủ tính bối cảnh + hướng. */
        const r = await api.post<{ daChuyen?: number[] }>(`/students/${studentId}/transfer`, { toClassId, tuan, lyDo: lyDo.trim(), mucTieu: mucTieuGui });
        if (r?.daChuyen?.includes(studentId) && dich) { xongChuyen(); setDaChuyen({ lop: { id: dich.id, code: dich.code }, han: hanGvcn }); } else xong('Đã lưu quyết định chuyển lớp');
      }
    } catch (e: any) { toast.push('error', ngayNay ? `${t('Không lưu được — chưa chuyển')} · ${loiMayChu(e)}` : loiMayChu(e)); } finally { setBusy(false); }
  };
  const huyLenh = async () => {
    if (!lenh || !lyDoHuy.trim()) return;
    setBusy(true);
    try { await api.post(`/lenh-chuyen/${lenh.id}/huy`, { lyDo: lyDoHuy.trim() }); xong('Đã huỷ quyết định chuyển lớp'); } catch (e: any) { toast.push('error', loiMayChu(e)); } finally { setBusy(false); }
  };

  const nhanChinh = dx ? (duyet ? 'Lưu' : 'Gửi đề xuất') : ngayNay ? t('Chuyển ngay') : duyet ? 'Duyệt và quyết định' : lenh ? CHU_CHUYEN_LOP.luu : CHU_CHUYEN_LOP.quyetDinh;
  /* OV-13l: khối "Khi chuyển" của chuyển ngay — em sang lớp mới khi lưu; cùng chương trình (lộ trình giữ) thì bài Test đang dở (kể cả điểm đã nhập) đi theo em. */
  const dongNgay = ngayNay && dich && dangHoc ? [t('Em sang {lop} ngay khi lưu', { lop: dich.code }),
    ...(xemLop?.luat?.khoa === 'giu' ? [t('Bài Test đang dở đi theo em sang {moi}; bài đã làm xong ở lại {cu}', { moi: dich.code, cu: dangHoc.lop.code })] : [])] : [];

  if (daChuyen) {
    /* Nơi gọi đóng panel trong `onDone` → chỉ báo xong khi người dùng rời trạng thái "Đã chuyển". */
    const dong = () => { onDone?.(); onClose(); };
    return (
      <KhungPanel tieuDe="Chuyển lớp" hocVien={studentName} lop={dt ? null : lop} onDong={dong}
        chan={{ huy: { onClick: dong }, chinh: <Link className="btn min-h-[44px] max-sm:flex-1 sm:min-h-0" to={`/hoc-vien/lop/${daChuyen.lop.id}`} onClick={dong}>{t('Hồ sơ {lop}', { lop: daChuyen.lop.code })} ›</Link> }}>
        <p role="status" className="mb-0 mt-3 text-sm text-ok">
          ✓ {t('Đã chuyển sang {lop} từ hôm nay {ngay} · bàn giao hạn {han}', { lop: daChuyen.lop.code, ngay: thuNgay(homNayMay ?? '', homNayMay ?? ''), han: ngay(daChuyen.han, homNayMay ?? '') })}
        </p>
      </KhungPanel>
    );
  }
  /* Lỗi nạp lần đầu → cả panel báo lỗi + Thử lại; lỗi xem trước của MỘT lớp → chỉ khối "Khi chuyển" (ô đã nhập giữ nguyên). */
  const loiNap = lopDich.error ?? (dx || nen ? null : xem.error);

  return (
    <KhungPanel tieuDe={dx ? (duyet ? 'Sửa đề xuất chuyển lớp' : 'Đề xuất chuyển lớp') : 'Chuyển lớp'} hocVien={studentName} lop={dt ? null : lop} onDong={onClose}
      chan={{
        daSua, huy: { onClick: onClose, disabled: busy },
        ...(!dx && lenh && !duyet ? { xoa: { nhan: CHU_CHUYEN_LOP.huy, onClick: () => setDangHuy((v) => !v) } } : {}),
        conThieu: conThieuChu(lf.daBam, loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] max-sm:flex-1 sm:min-h-0" onClick={gui} disabled={busy || !!loiNap || choXem}>{busy ? (ngayNay ? t('Đang chuyển…') : 'Đang lưu…') : nhanChinh}</button>,
        dongTren: !dx && dangHoc ? (
          <p className="m-0 px-4 pt-2 text-xs text-slate-400">GVCN {dangHoc.lop.code} bàn giao, hạn hết {ngay(hanGvcn, homNay)}.</p>
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
          {!dx && lenh && !duyet && !lenh.loi && <p className="mb-0 mt-2 text-xs text-slate-400">Em đã có quyết định chuyển lớp bắt đầu {nhanTuanBatDau(lenh.tuan, homNayMay ?? '')} — sửa hoặc huỷ trước tuần đó.</p>}
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
              <ChonLop ds={ds} value={toClassId} onChange={setToClassId} ariaLabel="Lớp chuyển đến"
                id={lf.oId('lop')} onBlur={lf.roi('lop')} invalid={!!lf.loiCua(loi, 'lop')} tat={busy} />
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
              <Truong nhan="Target" batBuoc as="div" loi={lf.loiCua(loi, 'muc-tieu')} phu="Em chưa có Target · band 0–9, hoặc tích KCK">
                <OTarget value={mucTieu} onChange={setMucTieu} ariaLabel="Target" oProps={lf.o(loi, 'muc-tieu')} />
              </Truong>
            )}
          </Khoi>

          {dx ? (
            <p className="mb-0 mt-3 text-xs text-slate-400">
              Gửi thành thẻ trong Chờ duyệt của Quản lý (loại Thông tin HV, hạn 5 ngày). Quản lý duyệt = ra quyết định chuyển lớp; Quản lý được sửa lớp và tuần trước khi duyệt.
            </p>
          ) : toClassId && (
            <Khoi tieuDe={ngayNay ? `⚠ ${t('Khi chuyển, web sẽ — chuyển ngay, không hoàn tác')}` : 'Khi chuyển, web sẽ'}>
              {!xemLop ? <p className="m-0 text-sm text-slate-400">{xem.error ? xem.error.message : 'Đang xem trước…'}</p> : (
                <div className={xemLop.canhBao || ngayNay ? 'rounded-lg border p-3' : ''} style={xemLop.canhBao || ngayNay ? khoiVang : undefined} role={xemLop.canhBao || ngayNay ? 'note' : undefined}>
                  <ul className="m-0 list-disc space-y-1 pl-5 text-sm text-slate-200">{[...dongNgay, ...xemLop.khiChuyen].map((c) => <li key={c}>{c}</li>)}</ul>
                </div>
              )}
            </Khoi>
          )}
        </>
      )}
    </KhungPanel>
  );
}
