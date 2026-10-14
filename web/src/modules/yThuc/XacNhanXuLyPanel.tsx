import { useEffect, useMemo, useState } from 'react';
import { api, ApiError, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Hang2, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { ChipHan } from '../../ui/Nhan.tsx';
import { BoiCanh, CanLam, NutChu, TrangThaiLuu, dauViec } from '../../ui/KhuonViec.tsx';
import { BangChung } from '../../ui/BangChung.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { OKhac } from '../../ui/OKhac.tsx';
import { NutChon } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import {
  KHAC_TOI_THIEU, MEASURE_KIND_LABEL, dsLoi, kiemGhiRoKhac, ngay, nguoiThanhPayload, nguoiThieu, type NguoiChon,
} from '@shared/domain/index.ts';
import { MuiTenGap, NhanViPham } from './NhanViPham.tsx';
import { DUONG_LAM_MOI_Y_THUC, type ViPhamV4, type XuLyView, type YThucHocVien } from './kieu.ts';
import { t } from '@shared/i18n/index.ts';

const MO_TA_MIN = 10;
const lamMoi = () => DUONG_LAM_MOI_Y_THUC.forEach((d) => invalidate(d));

/** Loại cần QL duyệt (V4-9): WL 3 chỉ khi là bậc kế (Q11) — thứ tự bày theo độ nặng. */
const LOAI_DE_XUAT = ['wl_3', 'meeting_cx', 'suspension', 'other'] as const;

/**
 * XÁC NHẬN XỬ LÝ — MỘT BƯỚC (V4-7, mockup M6) + chế độ ĐỀ XUẤT QL DUYỆT (V4-9, V4-10).
 *
 * Xác nhận xử lý: bậc TỰ ĐIỀN (chỉ đọc — máy chủ quyết, `bacDaThay` lệch → 409), vi phạm tick theo `macDinhTick` (K3-36, nhóm
 * "Cũ hơn" gập), ngày ≤ hôm nay, người thực hiện (nhận tên ngoài), mô tả bắt buộc. Lưu xong ở lại panel để đính kèm tệp (tuỳ chọn).
 * Đề xuất: loại · vi phạm · mô tả → `Tiếp: đính kèm bằng chứng` tạo NHÁP (chủ của tệp) → bằng chứng BẮT BUỘC → `Gửi QL duyệt`.
 * Đóng panel khi nháp chưa gửi thì xoá nháp (Q10). Bậc kế cần QL (WL 3) hoặc hết thang → mở thẳng chế độ Đề xuất.
 * OV-12e (mockup v3 §8): khuôn panel v3 — đầu "Xác nhận xử lý" + chip hạn / em ↗ · lớp · Ý thức; MỘT khối Cần làm (Bậc xử lý tự điền · vi phạm đưa vào
 * · Ngày * (ô ngày gõ được) · Người * · Mô tả * · nút chính; "Đề xuất QL duyệt" là nút chữ); Bối cảnh: Lần trước · Bậc tiếp theo; chân trạng thái lưu.
 */
export function XacNhanXuLyPanel({ studentId, cheDo: cheDoMo = 'xu-ly', lop, onClose, onDone, onKhai }: {
  studentId: number | null; cheDo?: 'xu-ly' | 'de-xuat';
  /** Mã lớp ở dòng 2 đầu panel (nơi gọi biết). */
  lop?: string | null;
  onClose: () => void; onDone?: () => void;
  /** Mở panel Xác nhận cấp bậc vi phạm (Q7): chuỗi chưa có lần xử lý nào và em chưa từng xác nhận. */
  onKhai?: (studentId: number) => void;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const { data: d, reload } = useApi<YThucHocVien>(studentId ? `/students/${studentId}/y-thuc` : null, [studentId]);
  const [cheDo, setCheDo] = useState<'xu-ly' | 'de-xuat'>(cheDoMo);
  const [chon, setChon] = useState<Set<number>>(new Set());
  const [moCu, setMoCu] = useState(false);
  const [ngayTh, setNgayTh] = useState(homNay);
  const [nguoi, setNguoi] = useState<NguoiChon | null>({ kieu: 'toi' });
  const [moTa, setMoTa] = useState('');
  const [loai, setLoai] = useState<string>('');
  const [tenKhac, setTenKhac] = useState('');
  const [busy, setBusy] = useState(false);
  const [loiLuu, setLoiLuu] = useState<string | null>(null);
  /** Sau khi lưu: lần xử lý vừa tạo (bước đính kèm tệp tuỳ chọn) hoặc NHÁP đề xuất (bước bằng chứng bắt buộc). */
  const [daLuu, setDaLuu] = useState<{ id: number; loai: 'xu-ly' | 'nhap'; nhan: string } | null>(null);
  const lf = useLoiForm();
  const idempotencyKey = useMemo(() => `xu-ly:${studentId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`, [studentId]);
  const nhap = useApi<XuLyView>(daLuu?.loai === 'nhap' ? `/y-thuc/xu-ly/${daLuu.id}` : null, [daLuu?.id]);

  useEffect(() => {
    if (!d) return;
    setChon(new Set(d.macDinh.tick));
    setNgayTh(homNay); setNguoi({ kieu: 'toi' }); setMoTa(''); setLoai(''); setTenKhac(''); setDaLuu(null); setMoCu(false); lf.datLai();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d?.studentId]);

  if (!studentId) return null;
  const tieuDe = cheDo === 'de-xuat' ? 'Đề xuất QL duyệt' : 'Xác nhận xử lý';
  if (!d) return <KhungPanel tieuDe={tieuDe} onDong={onClose}><p className="mt-3 text-sm text-slate-400">Đang tải…</p></KhungPanel>;
  const dau = (han: boolean) => dauViec({ han: han ? <ChipHan loai="xu-ly-vi-pham" han={d.han} /> : null, em: { id: d.studentId, ten: d.ten }, lop, ngCanh: t('Ý thức') });

  const theoId = new Map(d.viPham.map((v) => [v.id, v]));
  const tick = d.macDinh.tick.map((id) => theoId.get(id)).filter((v): v is ViPhamV4 => !!v);
  const cuHon = d.macDinh.cuHon.map((id) => theoId.get(id)).filter((v): v is ViPhamV4 => !!v);
  const doi = (id: number) => setChon((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const loi = dsLoi([
    { khoa: 'vi-pham', nhan: 'Vi phạm', chon: true },
    ...(cheDo === 'de-xuat' ? [{ khoa: 'loai', nhan: 'Loại', chon: true }] : []),
    ...(cheDo === 'de-xuat' && loai === 'other' ? [{ khoa: 'ghi-ro', nhan: 'Ghi rõ', toiThieu: KHAC_TOI_THIEU }] : []),
    { khoa: 'mo-ta', nhan: 'Mô tả', toiThieu: MO_TA_MIN },
  ], { 'vi-pham': chon.size ? 'co' : '', loai, 'ghi-ro': tenKhac, 'mo-ta': moTa });
  const loiNguoi = cheDo === 'xu-ly' ? nguoiThieu(nguoi, true) : null;

  /** Đóng: nháp chưa gửi thì xoá (không để nháp mồ côi); lần xử lý đã lưu thì báo nơi gọi làm mới. */
  const dong = async () => {
    if (daLuu?.loai === 'nhap') {
      try { await api.del(`/y-thuc/xu-ly/${daLuu.id}`); } catch { /* nháp đã gửi hoặc đã xoá — không có gì để dọn */ }
    }
    onClose();
  };

  const luuXuLy = async () => {
    lf.bam();
    if (loi.length || loiNguoi) return;
    setBusy(true);
    setLoiLuu(null);
    try {
      const m = await api.post<XuLyView>(`/students/${studentId}/y-thuc/xu-ly`, {
        violationIds: [...chon], performedOn: ngayTh, ...nguoiThanhPayload(nguoi), note: moTa.trim(), idempotencyKey, bacDaThay: d.bac,
      });
      /* OV-11c (CV-7): báo nơi gọi TRƯỚC khi làm mới — Công việc giữ chỗ dòng (mờ + gạch) và panel ở lại bước "Đã lưu · Tệp hoặc liên kết". */
      onDone?.();
      lamMoi();
      setDaLuu({ id: m.id, loai: 'xu-ly', nhan: m.nhan });
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 409) {
        toast.push('error', 'Bậc vừa đổi — đã mở lại với bậc mới.');
        reload();
      } else setLoiLuu(e.message);
    } finally { setBusy(false); }
  };

  const taoNhap = async () => {
    lf.bam();
    if (loi.length) return;
    setBusy(true);
    try {
      const m = await api.post<{ id: number; nhan: string }>(`/students/${studentId}/y-thuc/de-xuat`, {
        kind: loai, customName: loai === 'other' ? tenKhac.trim() : undefined, violationIds: [...chon], note: moTa.trim(),
      });
      setDaLuu({ id: m.id, loai: 'nhap', nhan: m.nhan });
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  const gui = async () => {
    if (!daLuu) return;
    setBusy(true);
    try {
      await api.post(`/y-thuc/xu-ly/${daLuu.id}/gui`);
      lamMoi();
      toast.push('ok', `Đã gửi QL duyệt ${daLuu.nhan} cho ${d.ten}. QL trả lời trong 5 ngày.`);
      onClose(); onDone?.();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  /* ---------------------------------------------------------------- bước 2: đã lưu */
  if (daLuu?.loai === 'xu-ly') {
    /* Mockup v3 §7–§8: Cần làm thành khối "Đã xác nhận" (vẫn đính thêm tệp được), nút chính "Xong". */
    const xong = <button type="button" className="btn btn-primary min-h-[40px] px-4 font-bold" onClick={dong}>Xong</button>;
    return (
      <KhungPanel tieuDe="Xác nhận xử lý" hocVien={d.ten} onDong={dong} dau={dau(false)}
        chan={{ v3: true, chinh: xong, dongTren: <span className="font-semibold text-ok">✓ {t('Đã lưu')}</span> }}>
        <div className="flex flex-col gap-5 pt-4">
          <div className="flex flex-col gap-2 rounded-[10px] border px-4 py-3.5" style={{ background: 'var(--surface-2)', borderColor: 'var(--line)' }}>
            <span className="text-sm font-bold text-ok">✓ {t('Đã xác nhận')}</span>
            <p className="m-0 text-sm text-slate-200">{daLuu.nhan} · {chon.size} vi phạm · {ngay(ngayTh, homNay)}</p>
            <BangChung ownerType="discipline_measure" ownerId={daLuu.id} canEdit tieuDe="" />
          </div>
          <div className="max-sm:hidden">{xong}</div>
        </div>
      </KhungPanel>
    );
  }
  if (daLuu?.loai === 'nhap') {
    const soTep = nhap.data?.soTep ?? 0;
    const nutGui = <button type="button" className="btn btn-primary min-h-[40px] px-4 font-bold" disabled={busy}
      onClick={() => { lf.bam(); if (soTep > 0) void gui(); }}>Gửi Quản lý duyệt · trả lời trong 5 ngày</button>;
    return (
      <KhungPanel tieuDe="Đề xuất QL duyệt" hocVien={d.ten} onDong={dong} dau={dau(false)}
        chan={{ v3: true, chinh: nutGui, conThieu: soTep === 0 && lf.daBam ? [{ nhan: 'Bằng chứng', lyDo: 'Cần đính kèm tệp hoặc liên kết' }] : undefined }}>
        <div className="flex flex-col gap-5 pt-4">
          <CanLam>
            <p className="m-0 text-sm font-bold text-slate-100">{daLuu.nhan} · {chon.size} vi phạm</p>
            <div>
              <span className="mb-1 block text-[13px] font-semibold text-slate-300">Bằng chứng<span aria-hidden className="text-bad"> *</span></span>
              <BangChung ownerType="discipline_measure" ownerId={daLuu.id} canEdit tieuDe="" onChanged={nhap.reload} />
            </div>
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="max-sm:hidden">{nutGui}</span>
              <NutChu mo onClick={() => void dong()}>Huỷ đề xuất</NutChu>
            </div>
          </CanLam>
        </div>
      </KhungPanel>
    );
  }

  /* ---------------------------------------------------------------- bước 1 */
  const bacKe = d.keTiep;
  const dongVp = (v: ViPhamV4) => (
    <li key={v.id}>
      {/* Cả dòng là nhãn của ô tick — bấm vào chữ cũng chọn (vùng chạm ≥ 44px trên điện thoại). */}
      <label className="flex min-h-[44px] cursor-pointer items-start gap-2 py-1 sm:min-h-0">
        <input type="checkbox" className="mt-1" checked={chon.has(v.id)} onChange={() => doi(v.id)}
          aria-label={`${ngay(v.occurredOn, homNay)} ${v.categoryLabel}: ${v.ten}`} />
        <span className="w-11 shrink-0 pt-0.5 text-xs tabular-nums text-slate-500">{ngay(v.occurredOn, homNay)}</span>
        <span className="min-w-0 flex-1 text-sm text-slate-200">
          {v.ten}
          <span className="block text-xs text-slate-500">{v.categoryLabel}{v.reportedByName ? ` · ${v.reportedByName} ghi` : ''}</span>
        </span>
        <NhanViPham t={v.trangThai} nhan={v.nhanTrangThai} />
      </label>
    </li>
  );

  /* Bối cảnh ≤ 3 dòng (mockup v3 §8): lần xử lý trước · bậc sau bậc này. */
  const truoc = d.dongThoiGian.filter((x): x is Extract<typeof x, { loai: 'xu-ly' }> => x.loai === 'xu-ly').sort((a, b) => b.ngay.localeCompare(a.ngay))[0];
  const iNay = d.dongThang.findIndex((x) => x.trangThai === 'lan-nay');
  const bacSau = iNay >= 0 ? d.dongThang[iNay + 1]?.nhan ?? null : null;
  const nutChinh = cheDo === 'xu-ly'
    ? <button type="button" className="btn btn-primary min-h-[40px] px-4 font-bold" disabled={busy} onClick={luuXuLy}>{busy ? 'Đang lưu…' : 'Xác nhận xử lý'}</button>
    : <button type="button" className="btn btn-primary min-h-[40px] px-4 font-bold" disabled={busy} onClick={taoNhap}>Tiếp: đính kèm bằng chứng</button>;
  const nhanO = (chu: string, batBuoc = false) => <span className="mb-1.5 block text-[13px] font-semibold text-slate-300">{chu}{batBuoc && <span aria-hidden className="text-bad"> *</span>}</span>;
  return (
    <KhungPanel tieuDe={tieuDe} hocVien={d.ten} onDong={onClose} dau={dau(cheDo === 'xu-ly')}
      chan={{
        v3: true, chinh: nutChinh, daSua: !!moTa.trim(),
        conThieu: lf.conThieu(loi) ?? (lf.daBam && loiNguoi ? [{ nhan: 'Người thực hiện', lyDo: loiNguoi }] : undefined),
        dongTren: busy || loiLuu ? <TrangThaiLuu tt={busy ? 'dang' : 'loi'} loi={loiLuu} onThuLai={() => void luuXuLy()} /> : undefined,
      }}>
      <div className="flex flex-col gap-5 pt-4">
        <CanLam>
          {cheDo === 'xu-ly' && bacKe ? (
            <div>
              {nhanO(t('Bậc xử lý'))}
              <p className="m-0 text-[15px] font-bold text-slate-100">{bacKe.nhan}</p>
              {d.chuoi.soXuLy === 0 && !d.khai && d.coTheKhai && onKhai && (
                <p className="m-0 mt-1 text-xs text-slate-300">
                  Đã có mức độ vi phạm từ trước?{' '}
                  <button type="button" className="link inline-flex min-h-[44px] items-center appearance-none border-0 bg-transparent p-0 sm:min-h-0" onClick={() => onKhai(d.studentId)}>Xác nhận cấp bậc vi phạm trước</button>
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {nhanO('Loại cần QL duyệt', true)}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" id={lf.oId('loai')}>
                {LOAI_DE_XUAT.map((k) => (
                  <NutChon key={k} chon={loai === k} onClick={() => setLoai(k)}>
                    {MEASURE_KIND_LABEL[k]}
                  </NutChon>
                ))}
              </div>
              {lf.loiCua(loi, 'loai') && <p className="m-0 text-xs text-late">{lf.loiCua(loi, 'loai')}</p>}
              <OKhac hien={loai === 'other'} value={tenKhac} onChange={setTenKhac} goiY="Ví dụ: Gặp phụ huynh tại trung tâm"
                id={lf.oId('ghi-ro')} onBlur={lf.roi('ghi-ro')} loi={lf.hien('ghi-ro') ? kiemGhiRoKhac(tenKhac) : null} />
              {bacKe && <p className="m-0 text-xs text-slate-300">Duyệt đề xuất ngoài thang không đổi bậc — bậc kế vẫn là {bacKe.nhan}.</p>}
            </div>
          )}

          <div>
            {nhanO(`Vi phạm đưa vào · ${chon.size}`)}
            {tick.length + cuHon.length === 0 ? (
              <p className="m-0 text-sm text-slate-300">Em không còn vi phạm nào chưa xử lý.</p>
            ) : (
              <div id={lf.oId('vi-pham')} tabIndex={-1}>
                <ul className="m-0 list-none divide-y p-0" style={{ borderColor: 'var(--line)' }}>{tick.map(dongVp)}</ul>
                {cuHon.length > 0 && (
                  <>
                    <button type="button" className="mt-1 inline-flex min-h-[44px] items-center gap-1 appearance-none border-0 bg-transparent p-0 text-xs text-slate-300 hover:text-slate-100 sm:min-h-0"
                      aria-expanded={moCu} onClick={() => setMoCu((x) => !x)}>
                      Cũ hơn · Đã ghi nhận ({cuHon.length}) <MuiTenGap mo={moCu} />
                    </button>
                    {moCu && <ul className="m-0 list-none divide-y p-0" style={{ borderColor: 'var(--line)' }}>{cuHon.map(dongVp)}</ul>}
                  </>
                )}
                {lf.loiCua(loi, 'vi-pham') && <p className="m-0 mt-1 text-xs text-late">Chọn ít nhất một vi phạm.</p>}
              </div>
            )}
          </div>

          {cheDo === 'xu-ly' && (
            <Hang2>
              <Truong nhan={t('Ngày')} batBuoc>
                <ONgay kieu="ngay" value={ngayTh} onChange={setNgayTh} toiDa={homNay} />
              </Truong>
              <Truong nhan={t('Người')} batBuoc as="div" loi={lf.daBam ? loiNguoi : null}>
                <ChonNguoi nhom="nhan_vien" value={nguoi} onChange={setNguoi} studentId={studentId} />
              </Truong>
            </Hang2>
          )}
          <Truong nhan={cheDo === 'xu-ly' ? 'Mô tả' : 'Lý do đề xuất'} batBuoc loi={lf.loiCua(loi, 'mo-ta')} dem={{ co: moTa.trim().length, can: MO_TA_MIN }}>
            <textarea className="field w-full" {...lf.o(loi, 'mo-ta')} rows={3} value={moTa} onChange={(e) => setMoTa(e.target.value)}
              placeholder={cheDo === 'xu-ly' ? 'Ví dụ: Đã gửi Report cho PH qua Zalo'
                : 'Ví dụ: Vi phạm lần 4 sau WL 2, đã báo PH'} />
          </Truong>
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="max-sm:hidden">{nutChinh}</span>
            {/* Chủ sản phẩm 02/10 → mockup v3 §8: "Đề xuất QL duyệt" là nút chữ đứng sau nút chính. */}
            {cheDo === 'xu-ly' && d.canManage && (
              <NutChu disabled={busy} title="Cần xử lý nặng hơn: Meeting CX/GĐCN, WL 3, Đình chỉ…" onClick={() => { setCheDo('de-xuat'); lf.datLai(); }}>Đề xuất QL duyệt</NutChu>
            )}
            {cheDo === 'de-xuat' && <NutChu onClick={() => { setCheDo('xu-ly'); lf.datLai(); }}>← Quay lại Xác nhận xử lý</NutChu>}
          </div>
        </CanLam>
        <BoiCanh dong={[
          [t('Lần trước'), truoc ? [truoc.nhan, ngay(truoc.ngay, homNay), truoc.nguoi].filter(Boolean).join(' · ') : null],
          [t('Bậc tiếp theo'), cheDo === 'xu-ly' ? bacSau : null],
        ]} />
      </div>
    </KhungPanel>
  );
}
