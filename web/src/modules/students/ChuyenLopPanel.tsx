import { useEffect, useMemo, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { ConfirmDialog } from '../../ui/Drawer.tsx';
import { Hang2, Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { OKhac } from '../../ui/OKhac.tsx';
import { NutChon } from '../../ui/ui.tsx';
import { ChonThang, ChonTuan } from '../../ui/ChonNgay.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import {
  CASE_CATEGORY_LABEL, NO_HANDOVER_NOTE, TRANSFER_REASONS, TRANSFER_REASON_LABEL, mondayOfDate, tuanLich, type NguoiChon,
  dsLoi, type LuatTruong, kiemGhiRoKhac, KHAC_TOI_THIEU,
} from '@shared/domain/index.ts';

type LopDich = { id: number; code: string; chiNhanhId: number; ma: string | null; ft: boolean; tenChuongTrinh: string | null; tuan: string | null; gvcn: string | null };
type LopDichData = { chiNhanh: { id: number; name: string }[]; lop: LopDich[] };
type CaseMo = { id: number; title: string | null; category: string | null; owner: string | null; seDong: boolean; goiY: { id: number; ten: string } | null };
type XemChuyenLopData = {
  hienTai: { lop: { id: number; code: string }; ma: string | null; ft: boolean; chiNhanhId: number };
  caseMo: CaseMo[];
  luat: { khoa: 'giu' | 'dong-mo'; dongCase: 'ft' | 'normal' | null; canMucTieu: boolean; endKind: string } | null;
  canLuuY: boolean; doiChiNhanh: boolean;
};

/**
 * CHUYỂN LỚP MỘT EM (mockup 11-3, §3.9.3, Q3 — mọi chi nhánh; PR-UX3 mockup 15 §8) — MỘT panel `KhungPanel`, dùng chung cho ⋯ dòng HV và
 * ⋮ Hồ sơ HV (mục "Chuyển lớp" của menu mở thẳng panel này, không còn ngăn trung gian).
 *
 * Khối **Lớp mới**: Chi nhánh + `Từ tuần` (tuần này → máy chủ lấy hôm nay như cũ; tuần sau → thứ Hai, không lùi ngày về quá khứ — Q8) ·
 * Lớp · Lý do (4 nút một hàng). Khối **Bàn giao** ⓘ: Ghi chú bàn giao (Q9) + Case đang mở, mỗi Case một dòng chọn người nhận.
 * Chân `Huỷ | Chuyển lớp` → `ConfirmDialog` MỘT câu "Chuyển {tên} sang {mã lớp} từ {W4 SEP}?" → gửi. Lỗi chỉ hiện SAU khi bấm.
 */
export function ChuyenLopPanel({ open, onClose, studentId, studentName, lop, onDone }: {
  open: boolean; onClose: () => void; studentId: number; studentName?: string; lop?: string | null; onDone?: () => void;
}) {
  if (!open) return null;
  return <NoiDungChuyenLop onClose={onClose} studentId={studentId} studentName={studentName} lop={lop} onDone={onDone} />;
}

function NoiDungChuyenLop({ onClose, studentId, studentName, lop, onDone }: {
  onClose: () => void; studentId: number; studentName?: string; lop?: string | null; onDone?: () => void;
}) {
  const toast = useToast();
  const { session } = useSession();
  const { homNay } = useNgayNghiepVu();
  const lopDich = useApi<LopDichData>(`/chuyen-lop/lop-dich?studentId=${studentId}`, [studentId]);
  const [chiNhanhId, setChiNhanhId] = useState<number | null>(null);
  const [toClassId, setToClassId] = useState<number | null>(null);
  const xem = useApi<XemChuyenLopData>(
    toClassId ? `/students/${studentId}/chuyen-lop?toClassId=${toClassId}` : `/students/${studentId}/chuyen-lop`,
    [studentId, toClassId],
  );
  const tuanNay = homNay ? mondayOfDate(homNay) : '';
  const [tuan, setTuan] = useState(tuanNay);
  const [reasonCode, setReasonCode] = useState('');
  const [reasonNote, setReasonNote] = useState('');
  const [luuY, setLuuY] = useState('');
  const [noNote, setNoNote] = useState(false);
  const [mucTieu, setMucTieu] = useState('');
  const [thangThi, setThangThi] = useState('');
  const [nguoiNhan, setNguoiNhan] = useState<Record<number, NguoiChon | null>>({});
  const lf = useLoiForm();
  const [hoiXacNhan, setHoiXacNhan] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (chiNhanhId === null && xem.data) setChiNhanhId(xem.data.hienTai.chiNhanhId);
  }, [xem.data, chiNhanhId]);
  useEffect(() => { if (!tuan && tuanNay) setTuan(tuanNay); }, [tuan, tuanNay]);

  const lopCuaChiNhanh = useMemo(
    () => (lopDich.data?.lop ?? []).filter((l) => l.chiNhanhId === chiNhanhId),
    [lopDich.data, chiNhanhId],
  );
  const lopDich1 = (lopDich.data?.lop ?? []).find((l) => l.id === toClassId) ?? null;

  const caseMo = xem.data?.caseMo ?? [];
  const canLuuY = xem.data?.canLuuY ?? true;
  const luat = xem.data?.luat ?? null;

  const nguoiChonToId = (v: NguoiChon | null): number | null => {
    if (!v) return null;
    if (v.kieu === 'tai_khoan') return v.id;
    if (v.kieu === 'toi') return session?.user?.id ?? null;
    return null;
  };

  /* Ô lỗi (YC-12.5.2): lý do dưới ô khi rời ô; chân "n ô cần sửa ↑" sau khi bấm Chuyển lớp. */
  const LUAT: LuatTruong[] = [
    { khoa: 'lop', nhan: 'Lớp', chon: true },
    { khoa: 'ly-do', nhan: 'Lý do', chon: true },
    ...(reasonCode === 'khac' ? [{ khoa: 'ghi-ro', nhan: 'Ghi rõ lý do', toiThieu: KHAC_TOI_THIEU }] : []),
    ...(luat?.canMucTieu ? [{ khoa: 'muc-tieu', nhan: 'Mục tiêu band', chon: true }] : []),
    ...(!canLuuY || !noNote ? [{ khoa: 'ban-giao', nhan: 'Ghi chú bàn giao', toiThieu: 1 }] : []),
  ];
  const loi = dsLoi(LUAT, { lop: toClassId, 'ly-do': reasonCode, 'ghi-ro': reasonNote, 'muc-tieu': mucTieu, 'ban-giao': luuY });
  const thieu = loi.map((l) => l.nhan);
  const loiCua = (khoa: string) => lf.loiCua(loi, khoa);
  const o = (khoa: string) => lf.o(loi, khoa);

  const bamChuyen = () => {
    lf.bam();
    if (thieu.length > 0) return;
    setHoiXacNhan(true);
  };

  const gui = async () => {
    if (!toClassId) return;
    setBusy(true);
    try {
      const nguoiNhanPayload: Record<number, number> = {};
      for (const c of caseMo) {
        const id = nguoiChonToId(nguoiNhan[c.id] ?? (c.goiY ? { kieu: 'tai_khoan', id: c.goiY.id, ten: c.goiY.ten } : null));
        if (id) nguoiNhanPayload[c.id] = id;
      }
      await api.post(`/students/${studentId}/transfer`, {
        toClassId,
        /* Tuần này → không gửi ngày (máy chủ lấy hôm nay, như cũ); tuần sau → thứ Hai của tuần đó. */
        effectiveDate: tuan && tuan !== tuanNay ? tuan : undefined,
        reasonCode, reasonNote: reasonCode === 'khac' ? reasonNote.trim() : undefined,
        handoverNote: luuY || undefined, noHandoverNote: noNote,
        nguoiNhan: Object.keys(nguoiNhanPayload).length ? nguoiNhanPayload : undefined,
        mucTieu: mucTieu ? Number(mucTieu) : undefined, thangThi: thangThi || undefined,
      });
      invalidate('/students'); invalidate('/attempts'); invalidate('/overview'); invalidate('/cases'); invalidate('/classes'); invalidate('/hoc-vien-lop');
      toast.push('ok', 'Đã chuyển lớp');
      setHoiXacNhan(false);
      onDone?.(); onClose();
    } catch (e: any) { setHoiXacNhan(false); toast.push('error', e.message); } finally { setBusy(false); }
  };

  const cauXacNhan = `Chuyển ${studentName ?? 'học viên'} sang ${lopDich1?.code ?? 'lớp mới'} từ ${tuan ? tuanLich(tuan, homNay) : 'tuần này'}?`;

  return (
    <KhungPanel tieuDe="Chuyển lớp" hocVien={studentName} lop={lop} onDong={onClose}
      chan={{
        conThieu: lf.conThieu(loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={bamChuyen} disabled={busy}>Chuyển lớp</button>,
      }}>
      {lopDich.loading ? <p className="mt-3 text-sm text-slate-500">Đang tải…</p> : (
        <>
          <Khoi tieuDe="Lớp mới">
            <Hang2>
              <Truong nhan="Chi nhánh" batBuoc>
                <select className="field w-full" value={chiNhanhId ?? ''} onChange={(e) => { setChiNhanhId(Number(e.target.value)); setToClassId(null); }}>
                  {(lopDich.data?.chiNhanh ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </Truong>
              <Truong nhan="Từ tuần" batBuoc>
                <ChonTuan moc="dau" lui={0} toi={8} value={tuan} onChange={setTuan} />
              </Truong>
            </Hang2>
            {chiNhanhId !== null && chiNhanhId !== xem.data?.hienTai.chiNhanhId && (
              <p className="m-0 text-xs text-soon">Quản lý chi nhánh và GVCN lớp mới sẽ nhận thông báo.</p>
            )}
            <Truong nhan="Lớp" batBuoc loi={loiCua('lop')}>
              <select className="field w-full" {...o('lop')} value={toClassId ?? ''} onChange={(e) => setToClassId(Number(e.target.value) || null)}>
                <option value="">Chọn lớp</option>
                {lopCuaChiNhanh.map((l) => (
                  <option key={l.id} value={l.id}>
                    {[l.code, l.tenChuongTrinh, l.tuan, `GVCN ${l.gvcn ?? 'chưa có'}`].filter(Boolean).join(' · ')}
                  </option>
                ))}
              </select>
            </Truong>
            <Truong nhan="Lý do" batBuoc as="div" loi={loiCua('ly-do')}>
              <div {...o('ly-do')} tabIndex={-1} className="grid grid-cols-2 gap-2 outline-none sm:grid-cols-4">
                {TRANSFER_REASONS.map((r) => (
                  <NutChon key={r} chon={reasonCode === r} className="justify-center px-1"
                    onClick={() => setReasonCode(r)}>{TRANSFER_REASON_LABEL[r]}</NutChon>
                ))}
              </div>
              <OKhac hien={reasonCode === 'khac'} value={reasonNote} onChange={setReasonNote} nhan="Ghi rõ lý do"
                goiY="Ví dụ: Gia đình chuyển nhà sang quận khác"
                id={lf.oId('ghi-ro')} onBlur={lf.roi('ghi-ro')} loi={lf.hien('ghi-ro') ? kiemGhiRoKhac(reasonNote) : null} />
            </Truong>
            {luat?.canMucTieu && (
              <Hang2>
                <Truong nhan="Mục tiêu band" batBuoc loi={loiCua('muc-tieu')}>
                  <input className="field w-full" {...o('muc-tieu')} type="number" step="0.5" min={0} max={9} value={mucTieu} onChange={(e) => setMucTieu(e.target.value)} />
                </Truong>
                <Truong nhan="Tháng dự kiến thi" tuyChon>
                  <ChonThang value={thangThi} onChange={setThangThi} chuaChon="Chưa chọn" />
                </Truong>
              </Hang2>
            )}
            {luat?.khoa === 'dong-mo' && (
              <p className="m-0 text-xs text-slate-400">
                Lớp mới khác chương trình: máy đóng khoá cũ và mở {luat.dongCase === 'ft' ? 'lộ trình Fast Track' : 'khoá mới'}.
              </p>
            )}
          </Khoi>

          <Khoi tieuDe="Bàn giao"
            luat="Ghi những gì người nhận lớp cần biết. Em còn Case dở thì bắt buộc phải có ghi chú; không có gì cần dặn thì chọn ô bên dưới (chỉ khi em không còn Case).">
            <Truong nhan="Ghi chú bàn giao" batBuoc={!noNote || !canLuuY} loi={loiCua('ban-giao')}>
              <textarea className="field w-full" {...o('ban-giao')} rows={2} value={luuY} disabled={noNote && canLuuY} onChange={(e) => setLuuY(e.target.value)}
                placeholder="Ví dụ: còn dở Case Listening" />
            </Truong>
            {canLuuY && (
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={noNote} onChange={(e) => setNoNote(e.target.checked)} />
                {NO_HANDOVER_NOTE}
              </label>
            )}
            {caseMo.length > 0 && (
              <div className="space-y-2">
                <p className="m-0 text-[11.5px] font-bold text-slate-200">Case đang mở · {caseMo.length}</p>
                {caseMo.map((c) => {
                  const kn = c.category ? CASE_CATEGORY_LABEL[c.category as keyof typeof CASE_CATEGORY_LABEL] ?? c.category : null;
                  return (
                    <div key={c.id} className="space-y-1">
                      <p className="m-0 truncate text-xs text-slate-200" title={c.title ?? undefined}>
                        {c.title ?? kn}
                        {c.seDong && <span className="text-soon"> · tự đóng “Chuyển sang Fast Track”</span>}
                      </p>
                      {!c.seDong && (
                        <>
                          <ChonNguoi
                            value={nguoiNhan[c.id] ?? (c.goiY ? { kieu: 'tai_khoan', id: c.goiY.id, ten: c.goiY.ten } : null)}
                            onChange={(v) => setNguoiNhan((prev) => ({ ...prev, [c.id]: v }))}
                            nhom="giao_vien" choNgoai={false}
                            macDinhTrong={c.owner ? `Giữ nguyên: ${c.owner}` : 'Chưa có người phụ trách'} />
                          {kn && <span className="block text-xs text-slate-400">GV {kn} lớp mới</span>}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Khoi>
        </>
      )}
      <ConfirmDialog open={hoiXacNhan} onClose={() => setHoiXacNhan(false)} onConfirm={gui} title="Chuyển lớp" body={cauXacNhan} confirmLabel="Chuyển lớp" busy={busy} />
    </KhungPanel>
  );
}
