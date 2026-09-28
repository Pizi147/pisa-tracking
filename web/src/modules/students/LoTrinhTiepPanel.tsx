import { useEffect, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Hang2, Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ChonThang } from '../../ui/ChonNgay.tsx';
import { dsLoi, huongTiepKhaDung, nhanHuong, type Huong } from '@shared/domain/index.ts';

type LoTrinhTiepData = {
  lop: { id: number; code: string; ma: string | null; maKe: string | null; laLopThuong: boolean; dangHoc: boolean } | null;
  banGhi: { huong: Huong; lopDuKienId: number | null; mucTieu: number | null; thangThi: string | null; ghiChu: string | null } | null;
  lopDuKien: { id: number; code: string; ma: string | null; ft: boolean }[];
  coTheGhi: boolean;
};

/** Một dòng nghĩa (≤ 60 ký tự) dưới mỗi hướng — để người chọn khỏi đoán "Học lại" hay "Bảo lưu" là gì. */
const NGHIA_HUONG: Record<Huong, string> = {
  len_lop: 'Học tiếp chương trình kế của lớp thường',
  fast_track: 'Chuyển sang lộ trình luyện thi Fast Track',
  hoc_lai: 'Học lại chương trình đang học',
  bao_luu: 'Tạm nghỉ, giữ chỗ để quay lại sau',
  dung_hoc: 'Em thôi học sau lớp này',
  chua_ro: 'Chưa biết, hệ thống sẽ nhắc lại sau',
  xep_sau: 'Sắp xếp sau, chưa có dự định',
};

/**
 * LỘ TRÌNH TIẾP THEO (mockup 11-1, §3.9.1; PR-UX3 mockup 15 §8) — dự định cho một em SAU lớp đang học, ghi trước khi thật sự chuyển. Chỉ lớp
 * thường. MỘT panel `KhungPanel`: khối **Hướng đi** là danh sách dọc (nhãn đầy đủ + một dòng nghĩa), khối **Chi tiết** (lớp dự kiến ·
 * Fast Track: mục tiêu band + tháng thi 2 ô một hàng · ghi chú). Câu "Chỉ là dự định, chưa đổi lớp" nằm ở ⓘ.
 */
export function LoTrinhTiepPanel({ open, onClose, studentId, studentName, lop, onDone }: {
  open: boolean; onClose: () => void; studentId: number; studentName?: string; lop?: string | null; onDone?: () => void;
}) {
  if (!open) return null;
  return <NoiDungLoTrinhTiep onClose={onClose} studentId={studentId} studentName={studentName} lop={lop} onDone={onDone} />;
}

function NoiDungLoTrinhTiep({ onClose, studentId, studentName, lop, onDone }: {
  onClose: () => void; studentId: number; studentName?: string; lop?: string | null; onDone?: () => void;
}) {
  const toast = useToast();
  const info = useApi<LoTrinhTiepData>(`/students/${studentId}/lo-trinh-tiep`, [studentId]);
  const [huong, setHuong] = useState<Huong | ''>('');
  const [lopDuKienId, setLopDuKienId] = useState<number | ''>('');
  const [mucTieu, setMucTieu] = useState('');
  const [thangThi, setThangThi] = useState('');
  const [ghiChu, setGhiChu] = useState('');
  const lf = useLoiForm();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const bg = info.data?.banGhi;
    setHuong(bg?.huong ?? '');
    setLopDuKienId(bg?.lopDuKienId ?? '');
    setMucTieu(bg?.mucTieu != null ? String(bg.mucTieu) : '');
    setThangThi(bg?.thangThi ?? '');
    setGhiChu(bg?.ghiChu ?? '');
  }, [info.data]);

  const data = info.data;
  const thongBao = info.loading ? 'Đang tải…'
    : !data?.lop ? 'Học viên không đang học lớp nào.'
    : !data.lop.laLopThuong ? 'Lộ trình tiếp theo chỉ áp dụng cho lớp thường.'
    : !data.coTheGhi ? 'Bạn không có quyền ghi lộ trình tiếp theo cho học viên này.'
    : null;
  if (thongBao || !data?.lop) {
    return <KhungPanel tieuDe="Lộ trình tiếp theo" hocVien={studentName} lop={lop} onDong={onClose}><p className="mt-3 text-sm text-slate-400">{thongBao}</p></KhungPanel>;
  }
  const lopHoc = data.lop;

  const cacHuong = huongTiepKhaDung(lopHoc.ma as any);
  const lopHopLe = data.lopDuKien.filter((l) => (
    huong === 'fast_track' ? l.ft
      : huong === 'hoc_lai' ? !l.ft && l.ma === lopHoc.ma
      : !l.ft && l.ma === lopHoc.maKe
  ));

  const loi = dsLoi([{ khoa: 'huong', nhan: 'Hướng đi', chon: true }], { huong });
  const luu = async () => {
    lf.bam();
    if (loi.length > 0) return;
    setBusy(true);
    try {
      await api.put(`/students/${studentId}/lo-trinh-tiep`, {
        huong, lopDuKienId: lopDuKienId || null,
        mucTieu: huong === 'fast_track' && mucTieu ? Number(mucTieu) : null,
        thangThi: huong === 'fast_track' && thangThi ? thangThi : null,
        ghiChu: ghiChu || null,
      });
      invalidate('/students'); invalidate('/classes'); invalidate('/hoc-vien-lop'); invalidate('/my-work');
      toast.push('ok', 'Đã ghi lộ trình tiếp theo');
      onDone?.(); onClose();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe="Lộ trình tiếp theo" hocVien={studentName} lop={lop} onDong={onClose}
      chan={{
        conThieu: lf.conThieu(loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={luu} disabled={busy}>Lưu</button>,
      }}>
      <Khoi tieuDe="Hướng đi" luat="Chỉ là dự định, chưa đổi lớp. Ghi trước để người kế nhiệm biết em sẽ đi đâu sau lớp này.">
        <div {...lf.o(loi, 'huong')} tabIndex={-1} role="radiogroup" aria-label="Hướng đi" className="space-y-1.5 outline-none">
          {cacHuong.map((h) => {
            const chon = huong === h;
            return (
              <button key={h} type="button" role="radio" aria-checked={chon}
                onClick={() => { setHuong(h); setLopDuKienId(''); }}
                className={`flex w-full items-start gap-2.5 rounded-md border px-2.5 py-2 text-left ${
                  chon ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)]' : 'border-[color:var(--line)] hover:border-[color:var(--line-strong)]'}`}
                style={{ background: chon ? undefined : 'transparent' }}>
                <span aria-hidden className={`mt-[3px] inline-block h-3 w-3 shrink-0 rounded-full border ${chon ? 'border-[color:var(--accent)] bg-[color:var(--accent)]' : 'border-slate-500'}`} />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-100">{nhanHuong(h, { ma: lopHoc.ma as any, maKe: lopHoc.maKe as any })}</span>
                  <span className="block text-[11px] text-slate-500">{NGHIA_HUONG[h]}</span>
                </span>
              </button>
            );
          })}
        </div>
        {lf.loiCua(loi, 'huong') && <span className="block text-[11px] text-late">{lf.loiCua(loi, 'huong')}</span>}
      </Khoi>

      {huong && (
        <Khoi tieuDe="Chi tiết">
          <Truong nhan="Lớp dự kiến" tuyChon phu="Chưa biết thì để trống">
            <select className="field w-full" value={lopDuKienId} onChange={(e) => setLopDuKienId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">Chưa chọn</option>
              {lopHopLe.map((l) => <option key={l.id} value={l.id}>{l.code}</option>)}
            </select>
          </Truong>
          {huong === 'fast_track' && (
            <Hang2>
              <Truong nhan="Mục tiêu band" tuyChon>
                <input className="field w-full" type="number" step="0.5" min={0} max={9} value={mucTieu} onChange={(e) => setMucTieu(e.target.value)} />
              </Truong>
              <Truong nhan="Tháng dự kiến thi" tuyChon>
                <ChonThang value={thangThi} onChange={setThangThi} chuaChon="Chưa chọn" />
              </Truong>
            </Hang2>
          )}
          <Truong nhan="Ghi chú" tuyChon>
            <textarea className="field w-full" rows={2} value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} />
          </Truong>
        </Khoi>
      )}
    </KhungPanel>
  );
}

