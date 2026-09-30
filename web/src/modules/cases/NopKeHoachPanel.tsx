import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { dsLoi, mocChuBoTro, nguoiThanhPayload, type NguoiChon } from '@shared/domain/index.ts';

/**
 * KẾ HOẠCH BÀI GIẢNG BỔ TRỢ (PR-LT2a, N2, K3-28): `KhoiKeHoach` là khối dùng chung của form Xác nhận Case (người dạy xác nhận + gửi kế hoạch
 * một lần) và `NopKeHoachPanel` (nộp sau, cho cả nhóm PA — GVCN FOU nộp kế hoạch chung). Nộp xong → MỘT thẻ Chờ duyệt · Học thuật cho Quản lý.
 */

/** Khối `boTro` như `GET /cases/:id` trả (xem `BoTroDto` ở máy chủ) — chỉ các trường giao diện cần. */
export type BoTro = {
  nhom: string; buoiMoiTuan: 1 | 2; chung: boolean;
  mon: { caseId: number; mon: string; tenMon: string; coNguyenNhan: boolean; moTa: string | null }[];
  nguoiDay: { userId: number | null; ten: string | null } | null;
  keHoach: { trangThai: 'cho' | 'duyet' | 'tu_choi'; noiDungYeu: string; keHoach: string; lyDoTuChoi: string | null; hanDuyet: string | null } | null;
  hanKeHoach: string | null; coTheNop: boolean; phaiGuiKem: boolean; denKhi: string | null;
};

export const invalidateKeHoach = () => { invalidate('/cases'); invalidate('/students'); invalidate('/overview'); invalidate('/my-work'); invalidate('/yeu-cau'); };

/** Người dạy bổ trợ mặc định = người máy đã gán (GVCN với FOU, GVBM với BE/ELE). */
export const nguoiDayMacDinh = (b: BoTro | null): NguoiChon | null =>
  b?.nguoiDay?.userId ? { kieu: 'tai_khoan', id: b.nguoiDay.userId, ten: b.nguoiDay.ten ?? '' } : { kieu: 'toi' };

export type KeHoachForm = { noiDungYeu: string; keHoach: string; nguoi: NguoiChon | null };

/** Hai ô bắt buộc ≥ 15 ký tự — cùng luật `kiemKeHoach` ở máy chủ. */
export const luatKeHoach = (f: Pick<KeHoachForm, 'noiDungYeu' | 'keHoach'>) => dsLoi([
  { khoa: 'noi-dung-yeu', nhan: 'Nội dung yếu', toiThieu: 15 },
  { khoa: 'ke-hoach', nhan: 'Kế hoạch', toiThieu: 15 },
], { 'noi-dung-yeu': f.noiDungYeu, 'ke-hoach': f.keHoach });

export const bodyKeHoach = (f: KeHoachForm) => ({ noiDungYeu: f.noiDungYeu.trim(), keHoach: f.keHoach.trim(), ...nguoiThanhPayload(f.nguoi) });

/** Khối "Kế hoạch bài giảng": Nội dung yếu · Kế hoạch · Người dạy bổ trợ · dòng chỉ đọc số buổi và mốc. */
export function KhoiKeHoach({ boTro, f, dat, lf, loi, studentId }: {
  boTro: BoTro; f: KeHoachForm; dat: (p: Partial<KeHoachForm>) => void;
  lf: ReturnType<typeof useLoiForm>; loi: ReturnType<typeof luatKeHoach>; studentId?: number | null;
}) {
  const { homNay } = useNgayNghiepVu();
  return (
    <Khoi tieuDe="Kế hoạch bài giảng" luat="Quản lý duyệt kế hoạch trong 3 ngày. Duyệt xong, phương án Bổ trợ mới bắt đầu chạy.">
      <Truong nhan="Nội dung yếu" batBuoc phu="Kiến thức, kỹ năng em đang yếu" loi={lf.loiCua(loi, 'noi-dung-yeu')} dem={{ co: f.noiDungYeu.trim().length, can: 15 }}>
        <textarea className="field w-full" rows={3} {...lf.o(loi, 'noi-dung-yeu')} value={f.noiDungYeu} maxLength={2000}
          onChange={(e) => dat({ noiDungYeu: e.target.value })} placeholder="Ví dụ: Chưa dùng đúng thì quá khứ và mạo từ" />
      </Truong>
      <Truong nhan="Kế hoạch" batBuoc phu="Buổi nào dạy gì, trọng tâm, bài tập" loi={lf.loiCua(loi, 'ke-hoach')} dem={{ co: f.keHoach.trim().length, can: 15 }}>
        <textarea className="field w-full" rows={4} {...lf.o(loi, 'ke-hoach')} value={f.keHoach} maxLength={2000}
          onChange={(e) => dat({ keHoach: e.target.value })} placeholder="Ví dụ: Buổi 1: thì quá khứ; buổi 2: mạo từ; trọng tâm: viết câu; bài tập: 2 đoạn ngắn mỗi buổi" />
      </Truong>
      <Truong nhan="Người dạy bổ trợ" as="div">
        <ChonNguoi nhom="giao_vien" studentId={studentId} value={f.nguoi} onChange={(nguoi) => dat({ nguoi })} />
      </Truong>
      <p className="m-0 text-xs text-slate-400">
        Bổ trợ {boTro.buoiMoiTuan} buổi/tuần · {mocChuBoTro(boTro.denKhi, homNay)} · trừ buổi Free
      </p>
    </Khoi>
  );
}

/**
 * NỘP KẾ HOẠCH (từ việc "Nộp kế hoạch bổ trợ" hoặc hàng PA): mỗi môn của nhóm một đoạn `G+V — {Mô tả người xác nhận}` (môn chưa xác nhận: mờ),
 * lý do Quản lý từ chối lần trước (nếu có), rồi khối Kế hoạch. Không có ô ngày — hạn nộp do máy tính.
 */
export function NopKeHoachPanel({ ivId, boTro, studentId, onXong, ...chung }: {
  ivId: number; boTro: BoTro; studentId?: number | null; onXong: () => void;
  hocVien?: string | null; lop?: string | null;
  quayLai?: { nhan: string; onClick: () => void }; onClose: () => void;
}) {
  const toast = useToast();
  const { ngan } = useNgayNghiepVu();
  const cu = boTro.keHoach;
  const moTaMon = boTro.mon.filter((m) => m.coNguyenNhan && m.moTa).map((m) => m.moTa!).join('\n');
  const [f, setF] = useState<KeHoachForm>({ noiDungYeu: cu?.noiDungYeu ?? moTaMon, keHoach: cu?.keHoach ?? '', nguoi: nguoiDayMacDinh(boTro) });
  const [busy, setBusy] = useState(false);
  const lf = useLoiForm();
  const loi = luatKeHoach(f);

  const gui = async () => {
    lf.bam();
    if (loi.length > 0) return;
    setBusy(true);
    try {
      await api.post(`/bo-tro/${ivId}/ke-hoach`, bodyKeHoach(f));
      invalidateKeHoach();
      toast.push('ok', 'Đã gửi Quản lý duyệt — xem ở Yêu cầu của tôi');
      onXong();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe="Nộp kế hoạch bổ trợ" {...chung} onDong={chung.onClose}
      chan={{
        conThieu: lf.conThieu(loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={gui}>Gửi Quản lý duyệt</button>,
      }}>
      {cu?.trangThai === 'tu_choi' && cu.lyDoTuChoi && (
        <div className="mt-3 rounded-lg border p-3 text-xs" style={{ borderColor: 'rgb(var(--soon-line-rgb))', background: 'rgb(var(--soon-bg-rgb))' }} role="note">
          <b className="text-soon">Quản lý không duyệt lần trước.</b>
          <span className="mt-0.5 block text-slate-200">{cu.lyDoTuChoi}</span>
          {boTro.hanKeHoach && <span className="mt-0.5 block text-slate-400">Nộp lại trước {ngan(boTro.hanKeHoach)}.</span>}
        </div>
      )}
      <Khoi tieuDe="Nguyên nhân từng môn">
        <ul className="m-0 list-none space-y-1.5 p-0 text-sm">
          {boTro.mon.map((m) => (
            <li key={m.caseId} className={m.coNguyenNhan ? 'text-slate-200' : 'text-slate-500'}>
              <b>{m.tenMon}</b> — {m.coNguyenNhan ? (m.moTa ?? 'Đã xác nhận nguyên nhân') : 'Giáo viên bộ môn chưa xác nhận nguyên nhân'}
            </li>
          ))}
        </ul>
      </Khoi>
      <KhoiKeHoach boTro={boTro} f={f} dat={(p) => setF((x) => ({ ...x, ...p }))} lf={lf} loi={loi} studentId={studentId} />
    </KhungPanel>
  );
}
