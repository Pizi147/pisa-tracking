import { useEffect, useMemo, useState } from 'react';
import { api, ApiError, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Hang2, Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ChonNgayGan } from '../../ui/ChonNgay.tsx';
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

const MO_TA_MIN = 10;
const lamMoi = () => DUONG_LAM_MOI_Y_THUC.forEach((d) => invalidate(d));

/** Loại cần QL duyệt (V4-9): WL 3 chỉ khi là bậc kế (Q11) — thứ tự bày theo độ nặng. */
const LOAI_DE_XUAT = ['meeting_cx', 'wl_3', 'suspension', 'other'] as const;

/**
 * XÁC NHẬN XỬ LÝ — MỘT BƯỚC (V4-7, mockup M6) + chế độ ĐỀ XUẤT QL DUYỆT (V4-9, V4-10).
 *
 * Xác nhận xử lý: bậc TỰ ĐIỀN (chỉ đọc — máy chủ quyết, `bacDaThay` lệch → 409), vi phạm tick theo `macDinhTick` (K3-36, nhóm
 * "Cũ hơn" gập), ngày ≤ hôm nay, người thực hiện (nhận tên ngoài), mô tả bắt buộc. Lưu xong ở lại panel để đính kèm tệp (tuỳ chọn).
 * Đề xuất: loại · vi phạm · mô tả → `Tiếp: đính kèm bằng chứng` tạo NHÁP (chủ của tệp) → bằng chứng BẮT BUỘC → `Gửi QL duyệt`.
 * Đóng panel khi nháp chưa gửi thì xoá nháp (Q10). Bậc kế cần QL (WL 3) hoặc hết thang → mở thẳng chế độ Đề xuất.
 */
export function XacNhanXuLyPanel({ studentId, cheDo: cheDoMo = 'xu-ly', onClose, onDone, onKhai }: {
  studentId: number | null; cheDo?: 'xu-ly' | 'de-xuat';
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
  /** Sau khi lưu: lần xử lý vừa tạo (bước đính kèm tệp tuỳ chọn) hoặc NHÁP đề xuất (bước bằng chứng bắt buộc). */
  const [daLuu, setDaLuu] = useState<{ id: number; loai: 'xu-ly' | 'nhap'; nhan: string } | null>(null);
  const lf = useLoiForm();
  const idempotencyKey = useMemo(() => `xu-ly:${studentId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`, [studentId]);
  const nhap = useApi<XuLyView>(daLuu?.loai === 'nhap' ? `/y-thuc/xu-ly/${daLuu.id}` : null, [daLuu?.id]);

  /* Bậc kế cần QL hoặc hết thang → chỉ còn Đề xuất. */
  const chiDeXuat = !!d && (!d.keTiep || d.keTiep.canQl);
  useEffect(() => { if (chiDeXuat) setCheDo('de-xuat'); }, [chiDeXuat]);
  useEffect(() => {
    if (!d) return;
    setChon(new Set(d.macDinh.tick));
    setNgayTh(homNay); setNguoi({ kieu: 'toi' }); setMoTa(''); setLoai(''); setTenKhac(''); setDaLuu(null); setMoCu(false); lf.datLai();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d?.studentId]);

  if (!studentId) return null;
  const tieuDe = cheDo === 'de-xuat' ? 'Đề xuất QL duyệt' : 'Xác nhận xử lý';
  if (!d) return <KhungPanel tieuDe={tieuDe} onDong={onClose}><p className="mt-3 text-sm text-slate-400">Đang tải…</p></KhungPanel>;

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
    const coLuu = daLuu?.loai === 'xu-ly';
    onClose();
    if (coLuu) onDone?.();
  };

  const luuXuLy = async () => {
    lf.bam();
    if (loi.length || loiNguoi) return;
    setBusy(true);
    try {
      const m = await api.post<XuLyView>(`/students/${studentId}/y-thuc/xu-ly`, {
        violationIds: [...chon], performedOn: ngayTh, ...nguoiThanhPayload(nguoi), note: moTa.trim(), idempotencyKey, bacDaThay: d.bac,
      });
      lamMoi();
      setDaLuu({ id: m.id, loai: 'xu-ly', nhan: m.nhan });
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 409) {
        toast.push('error', 'Bậc vừa đổi — đã mở lại với bậc mới.');
        reload();
      } else toast.push('error', e.message);
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
    return (
      <KhungPanel tieuDe="Xác nhận xử lý" hocVien={d.ten} onDong={dong}
        chan={{ huy: { nhan: 'Đóng', onClick: dong }, chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={dong}>Xong</button> }}>
        <Khoi tieuDe="Đã lưu">
          <p className="m-0 text-sm text-slate-200">Đã xử lý {daLuu.nhan} cho {d.ten} · {chon.size} vi phạm.</p>
        </Khoi>
        <Khoi tieuDe="Tệp hoặc liên kết · không bắt buộc">
          <BangChung ownerType="discipline_measure" ownerId={daLuu.id} canEdit tieuDe="" />
        </Khoi>
      </KhungPanel>
    );
  }
  if (daLuu?.loai === 'nhap') {
    const soTep = nhap.data?.soTep ?? 0;
    return (
      <KhungPanel tieuDe="Đề xuất QL duyệt" hocVien={d.ten} onDong={dong}
        ngCanh={<span className="truncate">{daLuu.nhan} · {chon.size} vi phạm</span>}
        chan={{
          huy: { nhan: 'Huỷ đề xuất', onClick: dong },
          conThieu: soTep === 0 && lf.daBam ? [{ nhan: 'Bằng chứng', lyDo: 'Cần đính kèm tệp hoặc liên kết' }] : undefined,
          chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy}
            onClick={() => { lf.bam(); if (soTep > 0) void gui(); }}>Gửi Quản lý duyệt · trả lời trong 5 ngày</button>,
        }}>
        <Khoi tieuDe="Bằng chứng · bắt buộc">
          <p className="m-0 text-xs text-slate-400">Biên bản, thư, ảnh chụp… — QL xem bằng chứng trước khi duyệt.</p>
          <BangChung ownerType="discipline_measure" ownerId={daLuu.id} canEdit tieuDe="" onChanged={nhap.reload} />
        </Khoi>
      </KhungPanel>
    );
  }

  /* ---------------------------------------------------------------- bước 1 */
  const bacKe = d.keTiep;
  const loaiDuoc = LOAI_DE_XUAT.filter((k) => k !== 'wl_3' || bacKe?.kind === 'wl_3');
  const dongVp = (v: ViPhamV4) => (
    <li key={v.id}>
      {/* Cả dòng là nhãn của ô tick — bấm vào chữ cũng chọn (vùng chạm ≥ 44px trên điện thoại). */}
      <label className="flex min-h-[44px] cursor-pointer items-start gap-2 py-1 sm:min-h-0">
        <input type="checkbox" className="mt-1" checked={chon.has(v.id)} onChange={() => doi(v.id)}
          aria-label={`${ngay(v.occurredOn, homNay)} ${v.categoryLabel}: ${v.description}`} />
        <span className="w-11 shrink-0 pt-0.5 text-[11px] tabular-nums text-slate-500">{ngay(v.occurredOn, homNay)}</span>
        <span className="min-w-0 flex-1 text-sm text-slate-200">
          {v.description}
          <span className="block text-[11px] text-slate-500">{v.categoryLabel}{v.reportedByName ? ` · ${v.reportedByName} ghi` : ''}</span>
        </span>
        <NhanViPham t={v.trangThai} nhan={v.nhanTrangThai} />
      </label>
    </li>
  );

  return (
    <KhungPanel tieuDe={tieuDe} hocVien={d.ten} onDong={onClose}
      chan={{
        conThieu: lf.conThieu(loi) ?? (lf.daBam && loiNguoi ? [{ nhan: 'Người thực hiện', lyDo: loiNguoi }] : undefined),
        /* Chủ sản phẩm 02/10: Đề xuất QL duyệt là nút cùng cỡ cạnh Xác nhận xử lý, không phải dòng chữ nhỏ. */
        phu: cheDo === 'xu-ly' && d.canManage
          ? <button type="button" className="btn min-h-[44px] sm:min-h-0" disabled={busy} title="Cần xử lý nặng hơn: Meeting CX/GĐCN, WL 3, Đình chỉ…"
              onClick={() => { setCheDo('de-xuat'); lf.datLai(); }}>Đề xuất QL duyệt</button>
          : undefined,
        chinh: cheDo === 'xu-ly'
          ? <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={luuXuLy}>Xác nhận xử lý</button>
          : <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={taoNhap}>Tiếp: đính kèm bằng chứng</button>,
      }}>
      {cheDo === 'xu-ly' && bacKe ? (
        <Khoi tieuDe="Bậc xử lý">
          <p className="m-0 text-sm text-slate-200">
            <b className="font-bold">{bacKe.nhan}</b>
            <span className="text-slate-400"> · lần xử lý thứ {d.chuoi.soXuLy + 1} trong {d.chuoi.nhan === 'lớp thường' ? 'các khoá lớp thường' : `lộ trình ${d.chuoi.nhan}`}</span>
          </p>
          <p className="m-0 text-[11px] text-slate-500">Bậc tự điền theo thang — không chọn.</p>
          {d.chuoi.soXuLy === 0 && !d.khai && d.coTheKhai && onKhai && (
            <p className="m-0 text-[11.5px] text-slate-400">
              Đã có mức độ vi phạm từ trước?{' '}
              <button type="button" className="link inline-flex items-center appearance-none border-0 bg-transparent p-0 min-h-[44px] sm:min-h-0" onClick={() => onKhai(d.studentId)}>Xác nhận cấp bậc vi phạm trước</button>
            </p>
          )}
        </Khoi>
      ) : (
        <Khoi tieuDe="Loại cần QL duyệt">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" id={lf.oId('loai')}>
            {loaiDuoc.map((k) => (
              <NutChon key={k} chon={loai === k} onClick={() => setLoai(k)}>
                {MEASURE_KIND_LABEL[k]}{k === 'wl_3' ? ' (bậc kế)' : ''}
              </NutChon>
            ))}
          </div>
          {lf.loiCua(loi, 'loai') && <p className="m-0 text-[11px] text-late">{lf.loiCua(loi, 'loai')}</p>}
          <OKhac hien={loai === 'other'} value={tenKhac} onChange={setTenKhac} goiY="Ví dụ: Gặp phụ huynh tại trung tâm"
            id={lf.oId('ghi-ro')} onBlur={lf.roi('ghi-ro')} loi={lf.hien('ghi-ro') ? kiemGhiRoKhac(tenKhac) : null} />
          {bacKe && !chiDeXuat && (
            <p className="m-0 text-[11px] text-slate-500">Duyệt đề xuất ngoài thang không đổi bậc — bậc kế vẫn là {bacKe.nhan}.</p>
          )}
          {!chiDeXuat && (
            <button type="button" className="link appearance-none border-0 bg-transparent p-0 min-h-[44px] sm:min-h-0 text-left text-xs" onClick={() => { setCheDo('xu-ly'); lf.datLai(); }}>
              ← Quay lại Xác nhận xử lý
            </button>
          )}
        </Khoi>
      )}

      <Khoi tieuDe={`Vi phạm đưa vào · ${chon.size}`}>
        {tick.length + cuHon.length === 0 ? (
          <p className="m-0 text-sm text-slate-400">Em không còn vi phạm nào chưa xử lý.</p>
        ) : (
          <div id={lf.oId('vi-pham')} tabIndex={-1}>
            <ul className="m-0 list-none divide-y p-0" style={{ borderColor: 'var(--line)' }}>{tick.map(dongVp)}</ul>
            {cuHon.length > 0 && (
              <>
                <button type="button" className="mt-1 inline-flex items-center gap-1 appearance-none border-0 bg-transparent p-0 min-h-[44px] sm:min-h-0 text-xs text-slate-400 hover:text-slate-200"
                  aria-expanded={moCu} onClick={() => setMoCu((x) => !x)}>
                  Cũ hơn · Đã ghi nhận ({cuHon.length}) <MuiTenGap mo={moCu} />
                </button>
                {moCu && <ul className="m-0 list-none divide-y p-0" style={{ borderColor: 'var(--line)' }}>{cuHon.map(dongVp)}</ul>}
              </>
            )}
            {lf.loiCua(loi, 'vi-pham') && <p className="m-0 mt-1 text-[11px] text-late">Chọn ít nhất một vi phạm.</p>}
          </div>
        )}
      </Khoi>

      <Khoi tieuDe={cheDo === 'xu-ly' ? 'Đã thực hiện' : 'Lý do đề xuất'}>
        {cheDo === 'xu-ly' && (
          <Hang2>
            <Truong nhan="Ngày thực hiện" batBuoc>
              <ChonNgayGan value={ngayTh} onChange={setNgayTh} soNgay={30} />
            </Truong>
            <Truong nhan="Người thực hiện" batBuoc as="div" loi={lf.daBam ? loiNguoi : null}>
              <ChonNguoi nhom="nhan_vien" value={nguoi} onChange={setNguoi} studentId={studentId} />
            </Truong>
          </Hang2>
        )}
        <Truong nhan="Mô tả" batBuoc loi={lf.loiCua(loi, 'mo-ta')} dem={{ co: moTa.trim().length, can: MO_TA_MIN }}>
          <textarea className="field w-full" {...lf.o(loi, 'mo-ta')} rows={3} value={moTa} onChange={(e) => setMoTa(e.target.value)}
            placeholder={cheDo === 'xu-ly' ? 'Ví dụ: Đã gửi Report cho PH qua Zalo'
              : 'Ví dụ: Vi phạm lần 4 sau WL 2, đã báo PH'} />
        </Truong>
        {cheDo === 'xu-ly' && <p className="m-0 text-[11px] text-slate-500">Tệp hoặc liên kết (không bắt buộc) đính kèm sau khi lưu.</p>}
      </Khoi>

    </KhungPanel>
  );
}
