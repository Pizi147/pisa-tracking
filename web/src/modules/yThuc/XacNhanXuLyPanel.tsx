import { useEffect, useMemo, useRef, useState } from 'react';
import { api, ApiError } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Hang2, KhungPanel, Truong, useNhap, useXoaNhap } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { ChipHan } from '../../ui/Nhan.tsx';
import { LOP_DA_LUU, NutVaTiep, TrangThaiLuu, dauViec } from '../../ui/KhuonViec.tsx';
import { TepCho, taiTepCho, type TepChoMuc } from '../../ui/TepCho.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { OKhac } from '../../ui/OKhac.tsx';
import { BoLocDoan, ErrorState, NutChon } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import {
  CHU_TOI_THIEU, KHAC_TOI_THIEU, MEASURE_KIND_LABEL, addDaysIso, mondayOfDate, QUY_CHE_KHONG_XU_LY, bacDu, bacKhongNgat, luuRoiTiep, hanBaoPh, hanDuyetNgay, THANG, dsLoi, hanTheoNgay, kiemGhiRoKhac, ngay, nguoiThanhPayload, nguoiThieu, quyCheXuLy, type NguoiChon,
} from '@shared/domain/index.ts';
import { MuiTenGap, NhanViPham } from './NhanViPham.tsx';
import { DUONG_LAM_MOI_Y_THUC, lamMoiYThucTheo, type ViPhamV4, type XuLyView, type YThucHocVien } from './kieu.ts';
import { chuMoc } from './BangLan.tsx';
import { DongViPham } from './DongViPham.tsx';
import { dich, t } from '@shared/i18n/index.ts';
import { KhoiTuyen } from './KhoiTuyen.tsx';
import { ChipRadio } from '../../ui/ChipRadio.tsx';
import type { BuocTuyen, Tuyen } from './kieu.ts';
import { KhoiGiaoViec, dongLichSuGiao, useGiaoViec } from '../congViec/KhoiGiaoViec.tsx';
import { MucViecCon } from '../congViec/MucViecCon.tsx';
import { DsLichSu, LichSuGap } from '../../ui/LichSuThayDoi.tsx';
import { lucVn } from '../congViec/gioVn.ts';

/**
 * TUYEN-1 (mockup v27 T1-375): GVCN chọn cách KHÁC mặc định (chưa lưu) → Tuyến xem trước thêm bước ○ "Head duyệt" (N1) sau bước Xử lý đang ở; các bước sau
 * chờ "sau khi duyệt". Chỉ là bước chưa tới lượt (không việc, không số — N72 ③); người = tên Head máy chủ trả (`tuyen.head`, `headCua` N74) — web không tự đoán.
 */
function quaHeadDuyet(tuyen: Tuyen | null | undefined, soNgay: number): Tuyen | null | undefined {
  const i = tuyen?.buoc.findIndex((b) => b.khoa === 'xu_ly' && b.trangThai === 'dang') ?? -1;
  if (!tuyen || i < 0) return tuyen;
  const head: BuocTuyen = { khoa: 'duyet-du-kien', ten: t('Head duyệt'), trangThai: 'cho', chiTiet: t('{n} ngày sau khi gửi', { n: soNgay }), nguoi: tuyen.head ?? t('Head chi nhánh'), laToi: false,
    ngay: null, han: null, cha: null, cungLuc: false, coNoiDung: false, khongQuyen: false };
  /* Sau Head duyệt: "Đã thực hiện" (người đang giữ bước Xử lý) và "Báo PH" chạy cùng lúc — như máy chủ dựng khi đã gửi (mockup v27 T1-375 · T2). */
  const xl = tuyen.buoc[i];
  const thucHien: BuocTuyen = { ...head, khoa: 'thuc-hien-du-kien', ten: t('Đã thực hiện'), chiTiet: t('sau khi duyệt'), nguoi: xl.nguoi, laToi: xl.laToi, cungLuc: true };
  const sau = tuyen.buoc.slice(i + 1).map((b) => (b.trangThai === 'cho' && !b.cha ? { ...b, chiTiet: t('sau khi duyệt'), cungLuc: true } : b));
  return { ...tuyen, buoc: [...tuyen.buoc.slice(0, i + 1), head, thucHien, ...sau], tong: tuyen.tong + 2 };
}

/** Đề xuất 9 (S4): một ngưỡng với máy chủ (`MO_TA_MIN` = `CHU_TOI_THIEU`, xuLy.ts). */
const MO_TA_MIN = CHU_TOI_THIEU;
/** Mockup v20 D1 (bộ đếm "78 / 500") + N35: Mô tả / Lý do ≤ 500 — máy chủ kiểm cùng trần (`moTa`, xuLy.ts). */
const MO_TA_TOI_DA = 500;
/** LG-12: lý do "Không xử lý" — cùng ngưỡng máy chủ (`khongXuLy`). */
const LY_DO_KHONG_TOI_THIEU = CHU_TOI_THIEU;   // N50 (6), cùng máy chủ

/** Loại cần QL duyệt (V4-9): WL 3 chỉ khi là bậc kế (Q11) — thứ tự bày theo độ nặng. */
const LOAI_DE_XUAT = ['wl_3', 'meeting_cx', 'suspension', 'other'] as const;
/** LUAT-5: loại ngoài thang mới bắt tệp bằng chứng; "không tăng bậc" (bậc thang ≤ bậc hiện tại) chỉ cần lý do. */
const canTep = (loai: string) => (LOAI_DE_XUAT as readonly string[]).includes(loai);
/** TINH-HINH (mockup v20 D, chủ SP 12/11): bốn cách xử lý chọn tại chỗ — Nâng 1 bậc (mặc định, lưu ngay) · ba cách còn lại gửi QL duyệt (5 ngày, hết hạn giữ quyết định GVCN). */
type Cach = 'nang' | 'giu' | 'vuot' | 'ngoai';

/**
 * XÁC NHẬN XỬ LÝ — MỘT BƯỚC (V4-7, mockup M6) + chế độ ĐỀ XUẤT QL DUYỆT (V4-9, V4-10).
 *
 * Xác nhận xử lý: bậc TỰ ĐIỀN (chỉ đọc — máy chủ quyết, `bacDaThay` lệch → 409), vi phạm tick theo `macDinhTick` (K3-36, nhóm
 * "Cũ hơn" gập), ngày ≤ hôm nay, người thực hiện (nhận tên ngoài), mô tả bắt buộc. Lưu xong ở lại panel để đính kèm tệp (tuỳ chọn).
 * Đề xuất (#6, mockup #1346 — MỘT màn): loại · vi phạm · lý do · bằng chứng (chọn trong form, BẮT BUỘC với loại ngoài thang) → `Gửi QL duyệt`.
 * Đóng panel khi nháp chưa gửi thì xoá nháp (Q10). Bậc kế cần QL (WL 3) hoặc hết thang → mở thẳng chế độ Đề xuất.
 * OV-12e (mockup v3 §8): khuôn panel v3 — đầu "Xác nhận xử lý" + chip hạn / tên em (link) · lớp · Ý thức; MỘT khối Cần làm (Bậc xử lý tự điền · vi phạm đưa vào
 * · Ngày * (ô ngày gõ được) · Người * · Mô tả * · nút chính; "Đề xuất QL duyệt" là nút chữ); Bối cảnh: Lần trước · Bậc tiếp theo; chân trạng thái lưu.
 */
export function XacNhanXuLyPanel({ studentId, cheDo: cheDoMo = 'xu-ly', tickThem, lop, dau: dauTai, classId, onClose, onDone, onKhai, onTiep }: {
  studentId: number | null; cheDo?: 'xu-ly' | 'de-xuat';
  /** Rà 11/11 G3-6: mở từ dòng Đã xem — vi phạm đó tick sẵn (cùng tick mặc định), nằm ở "Cũ hơn" thì mở sẵn nhóm đó. */
  tickThem?: readonly number[];
  /** Mã lớp ở dòng 2 đầu panel (nơi gọi biết). */
  lop?: string | null;
  /** R4 P10: đầu panel dựng từ dòng việc cho lúc tải / lỗi (đầu không trống). */
  dau?: Parameters<typeof KhungPanel>[0]['dau'];
  /** S5: lớp của em (nơi gọi biết) — lưu xong chỉ làm mới phần Ý thức của lớp đó; không truyền = mọi `/classes`. */
  classId?: number | null;
  onClose: () => void; onDone?: () => void;
  /** Mở panel Xác nhận cấp bậc vi phạm (Q7): chuỗi chưa có lần xử lý nào và em chưa từng xác nhận. */
  onKhai?: (studentId: number) => void;
  /** GD-4d (lời 36, ⑤ D1a): mở từ danh sách còn việc kế — chân "Đóng · {nút việc} · Lưu · việc tiếp ›" (chính); lưu xong gọi `onDone` rồi `onTiep`. */
  onTiep?: (() => void) | null;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const { data: d, error: loiTai, reload } = useApi<YThucHocVien>(studentId ? `/students/${studentId}/y-thuc` : null, [studentId]);
  /* TUYEN-1 (N72 ⑥, 4.6): khối Phụ trách · Hạn · Theo dõi của việc Xử lý vi phạm (id = em) — một GET song song; tuyến đi cùng `/students/:id/y-thuc`. */
  const gv = useGiaoViec('xu_ly', studentId);
  const lamMoi = () => lamMoiYThucTheo(DUONG_LAM_MOI_Y_THUC, { classId, studentIds: [studentId] });
  /* Một form (bỏ chế độ "Đề xuất QL duyệt" riêng): `cheDo` suy từ cách — Nâng 1 bậc = Xác nhận xử lý, cách khác = Đề xuất. */
  const [cach, setCach] = useState<Cach>(cheDoMo === 'de-xuat' ? 'ngoai' : 'nang');
  const cheDo: 'xu-ly' | 'de-xuat' = cach === 'nang' ? 'xu-ly' : 'de-xuat';
  const [chon, setChon] = useState<Set<number>>(new Set());
  const [moCu, setMoCu] = useState(false);
  const [ngayTh, setNgayTh] = useState(homNay);
  const [nguoi, setNguoi] = useState<NguoiChon | null>({ kieu: 'toi' });
  const [moTa, setMoTa] = useNhap('xu-ly-mo-ta', '');
  const xoaNhap = useXoaNhap();
  const daNapEm = useRef<number | null>(null);
  const [loai, setLoai] = useState<string>('');
  const [tenKhac, setTenKhac] = useState('');
  const [busy, setBusy] = useState(false);
  const [bam, setBam] = useState<'luu' | 'tiep' | null>(null);
  /** [XM 5] (chủ SP 11/11): tệp chọn NGAY trong form (như Ghi vi phạm), tải sau khi lưu — không tệp / tải xong thì panel tự đóng, không bước "Xong". */
  const [tep, setTep] = useState<TepChoMuc[]>([]);
  const [loiLuu, setLoiLuu] = useState<string | null>(null);
  /** Sau khi lưu xử lý mà tệp tải lỗi: lần xử lý vừa tạo (ở lại để Thử lại tệp). */
  const [daLuu, setDaLuu] = useState<{ id: number; loai: 'xu-ly'; nhan: string } | null>(null);
  /** #6: nháp đề xuất đã tạo nhưng chưa gửi (tệp lỗi) — đóng panel thì xoá. */
  const nhapDo = useRef<number | null>(null);
  const lf = useLoiForm();
  /** GD-19 (mockup ⑪ K6): vi phạm ĐƯỢC YÊU CẦU → hai lối "Xác nhận xử lý │ Không xử lý"; lối Không xử lý chỉ cần lý do ≥ 8 ký tự (gửi người ghi). */
  const [loiDi, setLoiDi] = useState<'xac-nhan' | 'khong'>('xac-nhan');
  const [lyDo, setLyDo] = useState('');
  const idempotencyKey = useMemo(() => `xu-ly:${studentId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`, [studentId]);

  useEffect(() => {
    if (!d) return;
    const them = (tickThem ?? []).filter((id) => d.macDinh.tick.includes(id) || d.macDinh.cuHon.includes(id));
    setChon(new Set([...d.macDinh.tick, ...them]));
    if (daNapEm.current !== null) setMoTa('');   // NEN-PANEL: lần nạp đầu giữ nháp (K12); đổi em thì bỏ chữ của em trước
    daNapEm.current = d.studentId;
    setTep([]); setNgayTh(homNay); setNguoi({ kieu: 'toi' }); setLoai(''); setTenKhac(''); setDaLuu(null); setMoCu(them.some((id) => d.macDinh.cuHon.includes(id))); lf.datLai();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d?.studentId]);

  if (!studentId) return null;
  /* TUYEN-1 (N72 · 4.4, mockup v27 T1): một khái niệm một tên — đầu panel = tên nhóm việc / tên bước trong Tuyến. */
  const tieuDe = t('Xử lý vi phạm');
  if (loiTai) return <KhungPanel hd="xu-ly-vi-pham" tieuDe={tieuDe} dau={dauTai} onDong={onClose}><ErrorState message={loiTai.message} hint={loiTai.hint} status={loiTai.status} onRetry={reload} /></KhungPanel>;
  if (!d) return <KhungPanel hd="xu-ly-vi-pham" tieuDe={tieuDe} dau={dauTai} onDong={onClose}><p className="mt-3 text-sm text-slate-400">{t('Đang tải…')}</p></KhungPanel>;
  /* Mockup v20 D1: dòng loại "Việc · Ý thức & Phối hợp"; dòng 2 tên em · lớp · chip hạn (chỉ khi Xác nhận — việc có hạn). */
  const dau = (han: boolean) => {
    const x = dauViec({ em: { id: d.studentId, ten: d.ten }, lop });
    /* TUYEN-1 (mockup v27 khung base): hạn chỉ ở khối Phụ trách · Hạn — đầu panel không lặp ngày (còn chip khi khối không tải được). */
    return { ...x, loai: t('Việc · Ý thức & Phối hợp'), dong2: [...x.dong2, han && d.han && !gv.g ? <ChipHan loai="xu-ly-vi-pham" han={d.han} /> : null] };
  };

  const theoId = new Map(d.viPham.map((v) => [v.id, v]));
  /* GD-19: vi phạm được yêu cầu, còn bắt buộc (chưa "Không xử lý", chưa xử lý) — có thì panel là "Xử lý vi phạm" hai lối. */
  const yc = d.viPham.filter((v) => v.yeuCauXuLy && !v.khongXuLy && (v.trangThai === 'can_xu_ly' || v.lyDoQuaHan === 'xu-ly'));
  const tuHai = addDaysIso(mondayOfDate(homNay), -7);
  const soHaiTuan = d.viPham.filter((v) => !v.dung && v.occurredOn >= tuHai && v.trangThai !== 'da_xu_ly' && v.trangThai !== 'cho_duyet').length;   // Lưu trữ (26/11): bỏ vi phạm Dừng
  const nguoiYc = [...new Set(yc.map((v) => v.reportedByName).filter(Boolean))].join(', ');
  const khoiYc = yc.length > 0 && (
    <div className="flex flex-col gap-1.5 rounded-[10px] px-3.5 py-3 text-[13px]" style={{ background: 'var(--surface-2)' }}>
      {yc.map((v) => (
        <div key={v.id} className="grid gap-1">
          <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-400">
            <span className="rounded-md border border-[color:var(--accent)] px-1.5 text-xs font-semibold leading-5 text-[color:var(--accent)]">{t('Yêu cầu xử lý')}</span>
            {v.reportedByName && <span><b className="font-semibold text-slate-100">{v.reportedByName}</b> {t('ghi')} · {ngay(v.reportedOn, homNay)}</span>}
            <span className="ml-auto tabular-nums">{t('Trong 2 tuần:')} <b className="font-semibold text-slate-100">{soHaiTuan}</b> / 3 {t('vi phạm')}</span>
          </p>
          <ul className="m-0 list-none p-0 text-sm text-slate-100"><li><DongViPham v={v} ngay={ngay(v.occurredOn, homNay)} moSan /></li></ul>
        </div>
      ))}
    </div>
  );
  const chonLoi = yc.length > 0 && (
    <BoLocDoan v8 ariaLabel={t('Cách xử lý')} value={loiDi} onChange={(k) => { setLoiDi(k); lf.datLai(); }}
      muc={[{ key: 'xac-nhan', nhan: t('Xác nhận xử lý') }, { key: 'khong', nhan: t('Không xử lý') }]} />
  );
  const tick = d.macDinh.tick.map((id) => theoId.get(id)).filter((v): v is ViPhamV4 => !!v);
  const cuHon = d.macDinh.cuHon.map((id) => theoId.get(id)).filter((v): v is ViPhamV4 => !!v);
  const doi = (id: number) => setChon((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const loi = dsLoi([
    { khoa: 'vi-pham', nhan: t('Vi phạm'), chon: true },
    ...(cheDo === 'de-xuat' ? [{ khoa: 'loai', nhan: t('Loại'), chon: true }] : []),
    ...(cheDo === 'de-xuat' && loai === 'other' ? [{ khoa: 'ghi-ro', nhan: t('Ghi rõ'), toiThieu: KHAC_TOI_THIEU }] : []),
    /* N56 ③ (chủ SP 20/11): xử lý ĐÚNG BẬC KẾ — Mô tả để trống được (máy ghi "{BẬC} · {vi phạm}"); có chữ thì ≥ 8. Đề xuất (khác mặc định) giữ bắt buộc. */
    { khoa: 'mo-ta', nhan: t('Mô tả'), toiThieu: cheDo === 'xu-ly' && !moTa.trim() ? undefined : MO_TA_MIN, toiDa: MO_TA_TOI_DA },
  ], { 'vi-pham': chon.size ? 'co' : '', loai, 'ghi-ro': tenKhac, 'mo-ta': moTa }).concat(
    tep.some((m) => m.loi && !m.daGui) ? [{ khoa: 'tep', nhan: t('Tệp'), lyDo: t('Bỏ tệp lỗi') }]
      /* #6: đề xuất loại ngoài thang bắt bằng chứng (V4-10, LUAT-5) — báo ngay khi bấm Gửi, không gọi máy chủ. */
      : cheDo === 'de-xuat' && canTep(loai) && !tep.length ? [{ khoa: 'tep', nhan: t('Bằng chứng'), lyDo: t('Cần đính kèm tệp hoặc liên kết') }] : []);
  const loiNguoi = cheDo === 'xu-ly' ? nguoiThieu(nguoi, true) : null;

  /** Đóng: đề xuất dở (tệp tải lỗi, chưa gửi) thì xoá nháp máy chủ — chữ đang gõ vẫn ở nháp của panel. */
  const dong = async () => {
    if (nhapDo.current) {
      try { await api.del(`/y-thuc/xu-ly/${nhapDo.current}`); } catch { /* nháp đã gửi hoặc đã xoá — không có gì để dọn */ }
    }
    onClose();
  };

  /** `diTiep`: lưu xong sang việc kế (nơi gọi thay nội dung panel) — không tự đóng. Trả `false` khi chưa xong (lỗi / tệp lỗi) để `luuRoiTiep` ở lại. */
  const luuXuLy = async (diTiep = false): Promise<boolean> => {
    lf.bam();
    if (loi.length || loiNguoi) return false;
    setBusy(true);
    setLoiLuu(null);
    try {
      const m = await api.post<XuLyView>(`/students/${studentId}/y-thuc/xu-ly`, {
        violationIds: [...chon], performedOn: ngayTh, ...nguoiThanhPayload(nguoi), note: moTa.trim(), idempotencyKey, bacDaThay: d.bac,
      });
      /* OV-11c (CV-7): báo nơi gọi TRƯỚC khi làm mới — Công việc giữ chỗ dòng (mờ + gạch) và panel ở lại bước "Đã lưu · Tệp hoặc liên kết". */
      const traNhap = xoaNhap();
      onDone?.();
      lamMoi();
      return await xongTep(m.id, m.nhan, tep, traNhap, diTiep);
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 409) {
        toast.push('error', t('Bậc vừa đổi — đã mở lại với bậc mới.'));
        reload();
      } else setLoiLuu(e.message);
      return false;
    } finally { setBusy(false); }
  };

  const cauXong = (nhan: string) => t('Đã xác nhận {nhan} cho {ten}.', { nhan: bacDu(dich(nhan)), ten: d.ten });
  /** Tải tệp chờ vào lần xử lý vừa lưu; xong hết (hoặc không có tệp) → toast + đóng panel. Tệp lỗi → ở lại chỗ tệp, `Thử lại` (lần xử lý đã lưu). */
  /** [XM 5] (PTA 11/11 duyệt): Hoàn tác ở toast = xoá hẳn lần vừa lưu (máy chủ chỉ nhận khi người vừa lưu, TVV chưa ghi, chưa có lần sau); chữ Mô tả trả lại nháp. */
  const hoanTac = async (id: number, traNhap?: () => void) => {
    try {
      await api.post(`/y-thuc/xu-ly/${id}/hoan-tac`);
      traNhap?.(); lamMoi(); onDone?.();
      toast.push('ok', t('Đã hoàn tác — vi phạm về như trước.'));
    } catch (e: any) { toast.push('error', e.message); }
  };
  const xongTep = async (id: number, nhan: string, ds: TepChoMuc[], traNhap?: () => void, diTiep = false): Promise<boolean> => {
    const kq = ds.some((x) => !x.xong) ? await taiTepCho(ds, { ownerType: 'discipline_measure', ownerIds: [id] }) : ds;
    setTep(kq);
    if (kq.every((x) => x.xong)) {
      toast.hoanTac(cauXong(nhan), () => void hoanTac(id, traNhap));
      /* Chữ đã lưu — xoá khỏi ô rồi mới đóng (đóng lúc ô còn chữ thì khung hỏi "Bỏ chữ đang gõ?"). Sang việc kế: nơi gọi thay panel, không đóng. */
      setMoTa(''); if (!diTiep) setTimeout(onClose, 0);
      return true;
    }
    setDaLuu({ id, loai: 'xu-ly', nhan });
    return false;
  };

  /**
   * #6 (mockup #1346 K1–K2): MỘT nút "Gửi QL duyệt" = tạo nháp (chủ của tệp) → tải tệp chờ → gửi. Tệp lỗi → chưa gửi (QL chưa thấy gì), ở lại, chữ giữ;
   * Thử lại = làm lại từ đầu (máy chủ dọn nháp cũ của cùng người · cùng em, tải lại mọi tệp) — form có thể đã sửa giữa hai lần.
   */
  const guiDeXuat = async (diTiep = false): Promise<boolean> => {
    lf.bam();
    if (loi.length) return false;
    setBusy(true); setLoiLuu(null);
    try {
      const m = await api.post<{ id: number; nhan: string }>(`/students/${studentId}/y-thuc/de-xuat`, {
        kind: loai, customName: loai === 'other' ? tenKhac.trim() : undefined, violationIds: [...chon], note: moTa.trim(),
      });
      nhapDo.current = m.id;
      const kq = await taiTepCho(tep.map((x) => ({ ...x, xong: undefined, tuId: undefined, loi: undefined, daGui: undefined })), { ownerType: 'discipline_measure', ownerIds: [m.id] });
      setTep(kq);
      const loiTep = kq.filter((x) => !x.xong).length;
      if (loiTep) { setLoiLuu(t('Chưa gửi — {n} tệp tải lỗi', { n: loiTep })); return false; }
      await api.post(`/y-thuc/xu-ly/${m.id}/gui`);
      nhapDo.current = null;
      xoaNhap(); setMoTa(''); lamMoi(); onDone?.();
      /* MA-QL-VIEC: QL / Quản trị áp thẳng (máy chủ chốt ngay) — sai thì Thu hồi ở lần xử lý. */
      toast.push('ok', d.qlApThang ? cauXong(m.nhan) : t('Đã gửi Head duyệt {nhan} cho {ten}. Head trả lời trong {n} ngày.', { nhan: bacDu(dich(m.nhan)), ten: d.ten, n: hanDuyetNgay(homNay) }));
      if (!diTiep) setTimeout(onClose, 0);
      return true;
    } catch (e: any) { setLoiLuu(e.message); return false; } finally { setBusy(false); }
  };

  /* ---------------------------------------------------------------- bước 2: đã lưu */
  if (daLuu?.loai === 'xu-ly') {
    /* [XM 5]: chỉ còn khi tệp tải lỗi — lần xử lý ĐÃ lưu; Thử lại tải phần dở, Đóng = bỏ tệp lỗi (thêm sau ở panel lần xử lý). */
    const thuLai = async () => { setBusy(true); try { await xongTep(daLuu.id, daLuu.nhan, tep); } finally { setBusy(false); } };
    const xong = <button type="button" className="btn btn-primary min-h-[40px] px-4 font-bold" disabled={busy} onClick={() => void thuLai()}>{t('Thử lại')}</button>;
    return (
      <KhungPanel hd="xu-ly-vi-pham" tieuDe={tieuDe} hocVien={d.ten} onDong={() => { toast.push('ok', cauXong(daLuu.nhan)); onClose(); }} dau={dau(false)}
        chan={{ v3: true, chinh: xong, dongTren: <span className={`font-semibold ${LOP_DA_LUU}`}>✓ {t('Đã lưu')}</span> }}>
        <div className="flex flex-col gap-5 pt-4">
          <div className="flex flex-col gap-2 rounded-[10px] border px-4 py-3.5" style={{ background: 'var(--surface-2)', borderColor: 'var(--line)' }}>
            <span className="text-sm font-bold text-ok">✓ {t('Đã xác nhận')}</span>
            <p className="m-0 text-sm text-slate-200">{bacDu(dich(daLuu.nhan))} · {t('{n} vi phạm', { n: chon.size })} · {ngay(ngayTh, homNay)}</p>
            <TepCho value={tep} onChange={setTep} khoa={busy} onThuLai={() => void thuLai()} />
          </div>
          <div className="max-sm:hidden">{xong}</div>
        </div>
      </KhungPanel>
    );
  }
  /* ---------------------------------------------------------------- GD-19: lối "Không xử lý" (mockup ⑪ K6a–c) */
  if (yc.length > 0 && loiDi === 'khong') {
    const loiKx = lyDo.trim().length < LY_DO_KHONG_TOI_THIEU ? [{ khoa: 'ly-do', nhan: t('Lý do'), lyDo: t('Ít nhất {n} ký tự', { n: LY_DO_KHONG_TOI_THIEU }) }] : [];
    const hoanTacKx = async (ids: number[]) => {
      let hong = 0;
      for (const id of ids) { try { await api.post(`/violations/${id}/khong-xu-ly/hoan-tac`); } catch { hong++; } }
      lamMoi(); onDone?.();
      toast.push(hong ? 'error' : 'ok', hong ? t('Chưa hoàn tác được — thử lại.') : t('Đã hoàn tác'), { key: 'khong-xu-ly' });
    };
    const luuKx = async (diTiep: boolean): Promise<boolean> => {
      lf.bam();
      if (loiKx.length) return false;
      setBusy(true); setLoiLuu(null);
      const da: number[] = [];
      try {
        for (const v of yc) { await api.post(`/violations/${v.id}/khong-xu-ly`, { lyDo: lyDo.trim() }); da.push(v.id); }
        lamMoi(); onDone?.(); setLyDo('');
        toast.hoanTac(t('Đã lưu · Không xử lý · {ten}', { ten: d.ten }), () => void hoanTacKx(da), { key: 'khong-xu-ly' });
        if (!diTiep) setTimeout(onClose, 0);
        return true;
      } catch (e: any) {
        if (da.length) { lamMoi(); onDone?.(); }
        setLoiLuu(e.message); return false;
      } finally { setBusy(false); }
    };
    const luuK = (diTiep: boolean) => { setBam(diTiep ? 'tiep' : 'luu'); void (diTiep && onTiep ? luuRoiTiep(() => luuKx(true), onTiep) : luuKx(false)); };
    return (
      <KhungPanel hd="xu-ly-vi-pham" tieuDe={t('Xử lý vi phạm')} hocVien={d.ten} onDong={() => onClose()} dau={{ ...dau(true), dong2: [...dau(true).dong2, nguoiYc ? t('{x} yêu cầu', { x: nguoiYc }) : null] }}
        quyChe={QUY_CHE_KHONG_XU_LY}
        chan={{
          huy: null, daSua: !!lyDo.trim(), conThieu: lf.conThieu(loiKx),
          chinh: <NutVaTiep busy={busy} bam={bam} luu={luuK} tiep={onTiep ? { ten: null, lam: () => {} } : undefined} chuTiep={t('Lưu · việc tiếp ›')} chu={t('Lưu không xử lý')} />,
          trai: busy || loiLuu ? <TrangThaiLuu tt={busy ? 'dang' : 'loi'} loi={loiLuu} onThuLai={() => void luuKx(false)} /> : <span className="text-slate-400">{t('Chưa lưu')}</span>,
        }}>
        <div className="flex flex-col gap-4 pt-4">
          {khoiYc}
          <div>{chonLoi}</div>
          <Truong nhan={t('Lý do')} phuNhan={t('gửi {x}', { x: nguoiYc || t('người ghi') })} batBuoc loi={lf.loiCua(loiKx, 'ly-do')}>
            <textarea className="field w-full" {...lf.o(loiKx, 'ly-do')} rows={3} value={lyDo} readOnly={busy} maxLength={500} onChange={(e) => setLyDo(e.target.value)} />
          </Truong>
        </div>
      </KhungPanel>
    );
  }

  /* ---------------------------------------------------------------- bước 1 */
  const bacKe = d.keTiep;
  /* "Chèn" và chữ máy tự ghi khi Mô tả trống (N56 ③, `moTaTuDong` máy chủ) — cùng một câu: bậc kế · các vi phạm đang chọn. */
  const cauChen = chon.size ? [bacKe ? bacDu(dich(bacKe.nhan)) : null, [...new Set([...chon].map((id) => theoId.get(id)?.ten).filter(Boolean))].join(', ')].filter(Boolean).join(' · ') : '';
  const dongVp = (v: ViPhamV4) => (
    <li key={v.id} className="min-h-[44px] px-3 py-2 text-sm text-slate-200">
      {/* VI-PHAM-MO: ô tick CHỈ chọn (vùng chạm ≥ 44px); bấm TÊN mở mô tả tại chỗ — cùng một kiểu mở với mọi danh sách vi phạm. */}
      <DongViPham v={v} ngay={ngay(v.occurredOn, homNay)}
        truoc={<label className="-m-3 shrink-0 cursor-pointer p-3"><input type="checkbox" className="mt-0.5 block" checked={chon.has(v.id)} onChange={() => doi(v.id)}
          aria-label={`${ngay(v.occurredOn, homNay)} ${dich(v.categoryLabel)}: ${v.ten}`} /></label>}
        duoi={<>{dich(v.categoryLabel)}{v.reportedByName ? ` · ${v.reportedByName} ghi` : ''}</>}
        phu={<NhanViPham t={v.trangThai} nhan={dich(v.nhanTrangThai)} />} />
    </li>
  );

  /* GD-4d (lời 36, ⑤ D1a / D1b): chân = "Đóng" · nút việc · "Lưu · việc tiếp ›" (chính, khi còn việc kế) — dùng lại `NutVaTiep` + `luuRoiTiep`
     (chỉ sang việc kế khi máy chủ đã nhận và tệp tải xong). Không có việc kế: "Đóng" · nút việc (chính) như cũ. "Đóng" ẩn ở 375 (đóng bằng ✕). */
  const hanh = (diTiep: boolean) => (cheDo === 'xu-ly' ? luuXuLy(diTiep) : guiDeXuat(diTiep));
  const luu = (diTiep: boolean) => { setBam(diTiep ? 'tiep' : 'luu'); void (diTiep && onTiep ? luuRoiTiep(() => hanh(true), onTiep) : hanh(false)); };
  const nutChinh = <NutVaTiep busy={busy} bam={bam} luu={luu} tiep={onTiep ? { ten: null, lam: () => {} } : undefined} chuTiep={t('Lưu · việc tiếp ›')}
    chu={cheDo === 'xu-ly' ? (bacKe ? t('Xác nhận · {nhan}', { nhan: bacDu(dich(bacKe.nhan)) }) : t('Xác nhận xử lý')) : d.qlApThang ? t('Lưu xử lý') : t('Gửi Head duyệt')} />;
  /* Lựa chọn bậc của từng cách (máy chủ kiểm lại `deXuatHopLe`). */
  const bacGiu = THANG.slice(0, Math.min(d.bac, THANG.length)).reverse() as string[];
  const bacVuot = THANG.slice(Math.min(d.bac + 1, THANG.length)) as string[];
  const chipCua: Record<Exclude<Cach, 'nang'>, string[]> = { giu: bacGiu, vuot: bacVuot, ngoai: [...LOAI_DE_XUAT] };
  const chonCach = (c: Cach) => { setCach(c); setLoai(c === 'nang' ? '' : chipCua[c][0] ?? ''); lf.datLai(); };
  /* GD-4d (⑤ H5): nút chọn bậc / Bậc kế ở panel quyết — viết đủ, viết hoa ("WARNING LETTER 1"). */
  const tenBac = (k: string) => bacDu(dich(MEASURE_KIND_LABEL[k as keyof typeof MEASURE_KIND_LABEL] ?? k));
  const soNgayQl = hanDuyetNgay(homNay);   // Hạn mặc định › QL trả lời Chờ duyệt — cùng số máy chủ dùng (`hanDuyetMacDinh`)
  const hanQl = hanTheoNgay(homNay, soNgayQl);
  const CACH: { k: Cach; ten: string; phu: string; tat?: boolean }[] = [
    { k: 'nang', ten: t('Nâng 1 bậc'), phu: bacKe ? `${d.bacNhan ? bacDu(dich(d.bacNhan)) : t('Chưa có')} → ${bacDu(dich(bacKe.nhan))}` : '' },
    { k: 'giu', ten: t('Không nâng'), phu: d.bacNhan ? t('Giữ {nhan}', { nhan: bacDu(dich(d.bacNhan)) }) : t('Chưa có bậc'), tat: !bacGiu.length },
    { k: 'vuot', ten: t('Vượt bậc'), phu: bacVuot.length ? t('Lên {nhan} trở lên', { nhan: tenBac(bacVuot[0]) }) : '—', tat: !bacVuot.length },
    { k: 'ngoai', ten: t('Ngoài thang'), phu: t('WL 3 · Meeting · Đình chỉ · Khác') },
  ];
  const onDong = () => void dong();
  const nhanO = (chu: string, batBuoc = false) => <span className="mb-1.5 block text-[13px] font-semibold text-slate-300">{chu}{batBuoc && <span aria-hidden className="text-bad"> *</span>}</span>;
  return (
    <KhungPanel hd="xu-ly-vi-pham" rong="rong" tieuDe={tieuDe} hocVien={d.ten} onDong={onDong}
      dau={yc.length && nguoiYc ? { ...dau(true), dong2: [...dau(true).dong2, t('{x} yêu cầu', { x: nguoiYc })] } : dau(cheDo === 'xu-ly')}
      /* TUYEN-1: bước sau (TVV báo PH · Head duyệt) nay ở khối Tuyến — chỉ giữ câu hậu quả khi Head / Quản trị áp thẳng. */
      quyChe={d.qlApThang && cach !== 'nang' ? quyCheXuLy(cach, { tvv: d.tvv ?? null, han: ngay(hanBaoPh(homNay), homNay), soNgay: soNgayQl, qlAp: true }) : null}
      chan={{
        /* Mockup v20 D1 · ⑤ D1a: chân lưu chung — trái trạng thái lưu, phải "Đóng" (NutVaTiep) + nút việc + "Lưu · việc tiếp ›". `huy: null`: không vẽ "Đóng" thứ hai. */
        huy: null, chinh: nutChinh, daSua: !!moTa.trim(),
        conThieu: lf.conThieu(loi) ?? (lf.daBam && loiNguoi ? [{ nhan: t('Người thực hiện'), lyDo: loiNguoi }] : undefined),
        trai: busy || loiLuu ? <TrangThaiLuu tt={busy ? 'dang' : 'loi'} loi={loiLuu} onThuLai={() => void (cheDo === 'xu-ly' ? luuXuLy() : guiDeXuat())} />
          : <span className="text-slate-400">{t('Chưa lưu')}</span>,
      }}>
      <div className="flex flex-col gap-4 pt-4">
        {/* TUYEN-1 (mockup v27 T1): khối việc → Tuyến → nội dung → Việc con → Lịch sử. */}
        {gv.g && <KhoiGiaoViec g={gv.g} dat={gv.dat} reload={gv.reload} onDaDoi={onDone} />}
        <KhoiTuyen tuyen={cach !== 'nang' && !d.qlApThang ? quaHeadDuyet(d.tuyen, soNgayQl) : d.tuyen} />
        {khoiYc}
        {chonLoi && <div>{chonLoi}</div>}
        {/* GD-4d (⑤ D1a): khối bối cảnh nền lặng "Bậc hiện tại · Bậc kế · TVV" (viết đủ, viết hoa; TVV chỉ khi em có) + hàng "Thang xử lý" dạng vạch. */}
        <div className="flex flex-col gap-3">
          <p className="m-0 flex flex-wrap gap-x-[18px] gap-y-1.5 rounded-lg px-3 py-2.5 text-[13px] text-slate-400" style={{ background: 'var(--surface-2)' }}>
            <span>{t('Bậc hiện tại')} <b className="font-semibold text-slate-100">{chuMoc(d.bac, d.viPham.length > 0)}</b></span>
            {bacKe && <span>{t('Bậc kế')} <b className="font-semibold text-slate-100">{bacDu(dich(bacKe.nhan))}</b></span>}
            {d.tvv && <span>{t('TVV')} <b className="font-semibold text-slate-100">{d.tvv}</b></span>}
          </p>
          {/* TUYEN-1 (mockup v27 T1): bỏ dòng "Thang xử lý" (vạch) — bậc hiện tại · bậc kế ở dòng trên, thang đủ ở hồ sơ HV › Ý thức. */}
        </div>
          <div>
            {nhanO(t('{n} vi phạm đưa vào', { n: chon.size }))}
            {tick.length + cuHon.length === 0 ? (
              <p className="m-0 text-sm text-slate-300">{t('Em không còn vi phạm nào chưa xử lý.')}</p>
            ) : (
              <div id={lf.oId('vi-pham')} tabIndex={-1}>
                <ul className="m-0 list-none divide-y divide-[color:var(--line)] rounded-[10px] border border-[color:var(--line-strong)] p-0">{tick.map(dongVp)}</ul>
                {cuHon.length > 0 && (
                  <>
                    <button type="button" className="mt-1 inline-flex min-h-[44px] items-center gap-1 appearance-none border-0 bg-transparent p-0 text-xs text-slate-300 hover:text-slate-100 sm:min-h-0"
                      aria-expanded={moCu} onClick={() => setMoCu((x) => !x)}>
                      {t('Cũ hơn · Đã ghi nhận ({n})', { n: cuHon.length })} <MuiTenGap mo={moCu} />
                    </button>
                    {moCu && <ul className="m-0 list-none divide-y divide-[color:var(--line)] rounded-[10px] border border-[color:var(--line-strong)] p-0">{cuHon.map(dongVp)}</ul>}
                  </>
                )}
                {lf.loiCua(loi, 'vi-pham') && <p className="m-0 mt-1 text-xs text-late">{t('Chọn ít nhất một vi phạm.')}</p>}
              </div>
            )}
          </div>

          {/* Mockup v20 D: cách xử lý chọn tại chỗ — 4 ô, "Nâng 1 bậc" mặc định. */}
          <div className="flex flex-col gap-2">
            {nhanO(t('Cách xử lý'))}
            {/* TUYEN-1 (mockup v27 T1): bốn cách là một hàng CHIP tròn (thay 4 thẻ cao) — "Nâng 1 bậc · mặc định" trước; bậc hiện tại → kế đã ở dòng bối cảnh trên, chữ phụ của từng cách ở title. */}
            <ChipRadio nhan={t('Cách xử lý')} value={cach} onChange={chonCach} disabled={busy}
              muc={CACH.map((c) => ({ k: c.k, tat: c.tat, title: c.phu ? bacKhongNgat(c.phu) : undefined, chu: c.k === 'nang' ? t('{ten} · mặc định', { ten: c.ten }) : c.ten }))} />
            {d.chuoi.soXuLy === 0 && !d.khai && d.coTheKhai && onKhai && (
              <p className="m-0 text-xs text-slate-300">
                <button type="button" title={t('Đã có mức độ vi phạm từ trước?')} className="link inline-flex min-h-[44px] items-center appearance-none border-0 bg-transparent p-0 sm:min-h-0" onClick={() => onKhai(d.studentId)}>{t('Khai cấp bậc')}</button>
              </p>
            )}
          </div>
          {cach !== 'nang' && (
            <div className="flex flex-col gap-2">
              {cach !== 'giu' || chipCua.giu.length > 1 ? (
                <>
                  {nhanO(cach === 'vuot' ? t('Lên bậc') : cach === 'giu' ? t('Giữ bậc') : t('Loại'), true)}
                  <div className="flex flex-wrap gap-1.5" id={lf.oId('loai')}>
                    {chipCua[cach].map((k) => <NutChon key={k} chon={loai === k} onClick={() => setLoai(k)}>{tenBac(k)}</NutChon>)}
                  </div>
                </>
              ) : null}
              {lf.loiCua(loi, 'loai') && <p className="m-0 text-xs text-late">{lf.loiCua(loi, 'loai')}</p>}
              <OKhac hien={loai === 'other'} value={tenKhac} onChange={setTenKhac} goiY={t('Ví dụ: Gặp phụ huynh tại trung tâm')}
                id={lf.oId('ghi-ro')} onBlur={lf.roi('ghi-ro')} loi={lf.hien('ghi-ro') ? kiemGhiRoKhac(tenKhac) : null} />
              {/* Hậu quả đặt ngay dưới lựa chọn (chủ SP 12/11) — không chỉ bằng màu: có ⚠ + chữ. */}
              <p role="note" className="m-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-2.5 rounded-lg border border-soon-line bg-soon-bg px-3 py-2.5 text-sm leading-snug text-slate-100">
                <span aria-hidden className="font-bold text-soon">⚠</span>
                {/* TUYEN-1: bỏ ⓘ "Sau khi chốt" — bước sau (○ Head duyệt · Đã thực hiện · Báo PH) hiện trong khối Tuyến. */}
                <span><b className="font-semibold">{t('Khác mặc định → sẽ gửi Head duyệt.')}</b> {t('Head có {n} ngày (tới {ngay}); hết hạn giữ quyết định của bạn: {nhan}.', { n: soNgayQl, ngay: ngay(hanQl, homNay), nhan: loai ? (loai === 'other' && tenKhac.trim() ? tenKhac.trim() : tenBac(loai)) : '—' })}</span>
              </p>
            </div>
          )}

          {cheDo === 'xu-ly' && (
            <Hang2>
              <Truong nhan={t('Ngày')} batBuoc>
                <ONgay kieu="ngay" value={ngayTh} onChange={setNgayTh} toiDa={homNay} />
              </Truong>
              <Truong nhan={t('Người thực hiện')} batBuoc as="div" loi={lf.daBam ? loiNguoi : null}>
                <ChonNguoi nhom="nhan_vien" value={nguoi} onChange={setNguoi} studentId={studentId} />
              </Truong>
            </Hang2>
          )}
          <div className="grid gap-1">
            <Truong nhan={cheDo === 'xu-ly' ? t('Mô tả') : t('Lý do')} batBuoc={cheDo !== 'xu-ly'} tuyChon={cheDo === 'xu-ly'} loi={lf.loiCua(loi, 'mo-ta')}>
              {/* NT-SUA P1-3 (PTA chốt): Mô tả = ghi nhận việc đã làm (đầu ra của xử lý) → nói lý do ngay tại ô, không điền sẵn chữ mẫu. */}
              <textarea className="field w-full" {...lf.o(loi, 'mo-ta')} rows={3} value={moTa} readOnly={busy} onChange={(e) => setMoTa(e.target.value)}
                placeholder={cheDo === 'xu-ly' ? (cauChen ? t('Để trống: máy ghi "{cau}"', { cau: cauChen }) : t('Ghi việc đã làm, vd đã nhắc em trước lớp, đã báo PH')) : undefined} />
            </Truong>
            <span className="flex items-center gap-2">
              {/* AUDIT-1611 B3-06: "Chèn" (cùng kiểu bàn giao, lời 47–48) — điền bậc + các vi phạm đang chọn vào ô, sửa được; không điền sẵn (NT-SUA P1-3 giữ). */}
              {cheDo === 'xu-ly' && chon.size > 0 && !busy && (
                <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" aria-label={t('Chèn bậc và vi phạm vào Mô tả')}
                  onClick={() => setMoTa(moTa.trim() ? `${moTa.trimEnd()} ${cauChen}` : cauChen)}>
                  {t('Chèn')}</button>
              )}
              <span className={`ml-auto text-xs tabular-nums ${moTa.trim().length > MO_TA_TOI_DA ? 'font-semibold text-bad' : 'text-slate-500'}`} aria-live="polite">{moTa.trim().length} / {MO_TA_TOI_DA}</span>
            </span>
          </div>
          {/* [XM 5] / #6: bằng chứng chọn NGAY trong form — tải sau khi lưu / khi Gửi. Đề xuất loại ngoài thang: bắt buộc. */}
          <Truong nhan={t('Bằng chứng')} batBuoc={cheDo === 'de-xuat' && canTep(loai)} tuyChon={!(cheDo === 'de-xuat' && canTep(loai))} as="div" loi={lf.loiCua(loi, 'tep')}>
            <div id={lf.oId('tep')} tabIndex={-1}><TepCho value={tep} onChange={setTep} khoa={busy} /></div>
          </Truong>
          {gv.g && <MucViecCon g={gv.g} onDoi={gv.reload} />}
          {gv.g && (() => { const ls = dongLichSuGiao(gv.g, homNay ?? ''); return (
            <LichSuGap so={ls.length}><DsLichSu dong={ls.reverse().map((l, i) => ({ key: i, gio: lucVn(l.luc), ai: l.nguoi, viec: l.tieu, phu: l.phu }))} /></LichSuGap>
          ); })()}
      </div>
    </KhungPanel>
  );
}
