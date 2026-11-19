import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { KetQuaTutorChon } from '../../ui/PeoplePicker.tsx';
import { DongTutorO } from './BuoiTutorO.tsx';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { DongQuyChe, Hang2, KhungPanel, Truong, useBaoDangSua, useNhap } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ChipHan } from '../../ui/Nhan.tsx';
import { baoNhapPa } from '../../lib/nhapPa.ts';
import { BoiCanh, CanLam, NutChu, NutDongPanel, NutVaTiep, TrangThaiLuu, dauViec, type TiepViec } from '../../ui/KhuonViec.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { BoLocDoan, ErrorState, NutChon, Skeleton } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { FormPa, KhoaNho, VachBuoi } from './FormPa.tsx';
import { FormDoiPa, useDoiPa } from './DoiPa.tsx';
import type { DaLuuPanel } from '../../ui/KhuonViec.tsx';
import { CHU_TOI_THIEU_CASE, CASE_OUTCOMES, CASE_OUTCOME_LABEL, nhanNguoiDay,
  FOLLOWUP_OUTCOMES, INTERVENTION_KIND_LABEL, KY_HIEU_TIEN_TRIEN,
  GOI_Y_KET_QUA_PA, NUT_LUU_KET_QUA, PLAN_DECISION_NGAN, nhomQuyetDinh, quyetDinhChoPa,
  decisionBlockedReason, decisionNeedsReason, interventionKindsFor, nhanTuanGhiKetQua, outcomeLabelFor,
  type NguoiChon, type PlanDecision, dsLoi, type LuatTruong, TRAN_CHU,
  canBuoiTutor, TIEU_CHI_TUTOR, MOC_QUY_CHE_SOS, coNguoiDay, coSoBuoiKy, coTongBuoi, demSauKetQua, kiemSoBuoiKy, kiemSoBuoiTuan, soBuoiTu, type BuoiTutor, giaTriCuaPa, loiFormPa, loiKetQuaTuan, nguoiCuaPa, paMoi, paPayload, tachKhac, thanKetQuaTuan, thanSuaPa,
  type GiaTriPa,
} from '@shared/domain/index.ts';
import { hanDuyetNgay, hoanThanhCaseBatSan, quyCheGhiKetQua, toiKyGhi } from '@shared/domain/index.ts';
import { dich, dichDu, t } from '@shared/i18n/index.ts';

/**
 * GHI KẾT QUẢ CỦA MỘT PA — khuôn panel v3 (OV-12e, mockup `mockup-ov12-panel-v3-2026-10-14.html` §5): đầu "Kết quả PA · W1–W2 SEP" (EN-e: tên việc ở Công việc) + chip hạn / em (link) ·
 * lớp · PA; MỘT khối Cần làm: Tiến triển (2 tuần) * (5 mức) · Nhận xét * (Tutor: n dòng Tutor · Nhận xét buổi, không ô chung) · Số buổi kỳ này +
 * Người dạy (+ vạch "Đã dạy 3/10 → sau khi lưu 5/10") · Quyết định 3 nút Giữ nguyên (mặc định) · Điều chỉnh · Kết thúc PA — "Thay PA", "Xin hỗ trợ QL"
 * mở BÊN TRONG Điều chỉnh (`nhomQuyetDinh`, chủ SP 14/10 tối) · Ngày ghi · một nút chính; Bối cảnh ≤ 3 dòng; chân trạng thái lưu. Bỏ ô
 * "Vấn đề còn tồn / Ghi chú" — chữ cũ không xoá: sửa lần ghi cũ gửi lại nguyên giá trị, lịch sử vẫn đọc. Luật giữ nguyên (máy chủ kiểm lại); nút chính
 * luôn bấm được, bấm khi thiếu mới hiện lỗi dưới ô + "Còn thiếu n ô" ở chân.
 */

export type PaCanCapNhat = {
  id: number; kind: string; description: string | null; performer: string | null;
  actionDue: string | null; cycleNo?: number | null;
  /** CV-LOI (CV-14): PA bổ trợ miễn phí còn chờ Mini Test — hạn của việc là hạn Mini Test (cùng dòng Công việc). */
  miniTestHan?: string | null;
  /** Tài khoản người làm hiện tại — giá trị đầu của ô người khi Điều chỉnh (Q15) và của "Người dạy tuần này". */
  performerUserId?: number | null;
  /** PR-SOS (T22, T63): PA theo quy chế · lần ghi này là "Kết quả cuối" · chữ mốc (`đến MT2 · W2 OCT`). */
  batBuoc?: boolean; lanCuoi?: boolean; mocChu?: string | null;
  /** PR-PA (§8): Số buổi của PA (null = không đếm) · Đã dạy (tổng Số buổi tuần này các lần trước). */
  soBuoi?: number | null; daDay?: number;
  /** OV-13b: PA mặc định (quy chế · Bổ trợ) — Điều chỉnh có "Đề xuất PA khác"; `doiPaCho` = đã có đề xuất chờ QL (ẩn lựa chọn). */
  laMacDinh?: boolean; doiPaCho?: boolean;
  /** RKC-2b ③: PA quy chế còn chờ xác nhận — lưu lần ghi đầu = Xác nhận PA (máy chủ); dải "Đã lưu kết quả · đã xác nhận PA". */
  choXacNhan?: boolean;
  /** NHAP-KQ-PA (chủ SP 13/11): nháp kỳ đang chạy lưu trên máy chủ (`PUT /interventions/:id/nhap`) — mở form thì điền sẵn; chốt "Lưu" thì máy chủ xoá. */
  nhap?: NhapMayChu | null;
  /** TU11: mốc quy chế SOS (`coTongBuoi` — PA quy chế không đếm "Đã học x / tổng"). */
  mocQuyChe?: string | null;
  /** TU2 (PA Tutor): "b" điền sẵn — b của lần ghi gần nhất; chưa có thì Số buổi cũ của PA quy chế (nhập dưới nhãn "/ 2 tuần"). */
  buoiKy?: number | null;
};
/** NHAP-KQ-PA + TU7: nháp giữ cả phần Tutor — a (`soBuoi`), b (`buoiDuKien`), dòng Tutor (`buoi`). */
export type NhapMayChu = { outcome: string; note: string; luc: string; boi: string; soBuoi?: number | null; buoiDuKien?: number | null; buoi?: BuoiTutor[] };
/** "13/11 14:05" theo giờ máy (mốc lưu là ISO UTC) — giờ để phân biệt nhiều lần lưu trong một ngày (U01). */
const lucNhap = (luc: string) => { const d = new Date(luc); const h = (x: number) => String(x).padStart(2, '0'); return `${h(d.getDate())}/${h(d.getMonth() + 1)} ${h(d.getHours())}:${h(d.getMinutes())}`; };
/** AUDIT-1454: 409 của máy chủ — `nhapMoi` (phiên khác vừa lưu nháp khác; null = đã xoá) · `daChot` (kỳ này đã chốt: chỉ báo, không Thử lại). */
const xungDotCua = (e: any): { moi: NhapMayChu | null } | null => (e?.status === 409 && e.details && 'nhapMoi' in e.details ? { moi: e.details.nhapMoi ?? null } : null);
const daChotCua = (e: any) => e?.status === 409 && !!e.details?.daChot;

/**
 * OV-7b: điền sẵn của `GET /followups/:id/sua` — PA như NGAY TRƯỚC lần ghi (`pa`), giá trị đã ghi (`giaTri`), `chan` = vì sao không đổi được lựa chọn
 * (PA thay thế đã chạy, Quản lý đã trả lời) — khi đó chỉ sửa chữ.
 */
export type SuaKetQua = {
  followupId: number; caseId: number; chan: string | null; pa: PaCanCapNhat;
  giaTri: {
    outcome: string; note: string; remainingIssue: string; decision: PlanDecision | null; decisionNote: string; observedOn: string;
    completedOn: string | null; soBuoi: number | null; buoiDuKien?: number | null; nguoiDay: { userId: number | null; ten: string } | null;
    /** OV-12h: dòng buổi Tutor đã ghi (lần ghi cũ: []). */
    buoi?: BuoiTutor[];
    miniTest: { tyLe: number; ngay: string } | null;
    adjust: { description: string | null; soBuoi: number | null; performerUserId: number | null; performer: string | null } | null;
    newPlan: { kind: string; description: string | null; soBuoi: number | null; performerUserId: number | null; performer: string | null } | null;
  };
};

/** Giá trị đầu của form (ghi mới: trống; sửa: điền sẵn) — tính MỘT lần; "giữ lựa chọn" so với chính các giá trị này. */
function giaTriDau(pa: PaCanCapNhat, sua: SuaKetQua | undefined, homNay: string) {
  const g = sua?.giaTri;
  const goc = giaTriCuaPa(pa);
  const thay = g?.newPlan ? giaTriCuaPa(g.newPlan) : paMoi(interventionKindsFor().selfServe[0]);
  if (g?.newPlan && thay.kind === 'other_proposal') Object.assign(thay, (({ ghiRo, moTa }) => ({ ghiRo, description: moTa }))(tachKhac(thay.description)));
  return {
    goc, thay,
    dc: g?.adjust ? giaTriCuaPa({ kind: pa.kind, ...g.adjust }) : goc,
    nguoiDay: g ? nguoiCuaPa({ performerUserId: g.nguoiDay?.userId, performer: g.nguoiDay?.ten }) : goc.nguoi,
    tuan: g?.soBuoi != null ? String(g.soBuoi) : '1',
    mtTyLe: g?.miniTest ? String(g.miniTest.tyLe) : '', mtNgay: g?.miniTest?.ngay ?? homNay ?? '',
  };
}

const DA_LUU: Record<PlanDecision, string> = {
  keep: t('Đã lưu kết quả, PA vẫn đang chạy'),
  adjust: t('Đã điều chỉnh PA, bản cũ giữ trong lịch sử'),
  replace: t('Đã thay PA'),
  end: t('Đã kết thúc PA'),
  ask_manager: t('Đã gửi Head — PA vẫn chạy'),
};

export function GhiKetQuaPanel({ pa, sua, hocVien, lop, em, ngCanh, boiCanh, quayLai, onClose, onSaved, onThemPa, tiep, chuTiep, vuotLuat, ketThucSom, hoanThanhCase }: {
  /**
   * #3 bản rà 11/11 (G2-05, chủ SP "chỉ để 'Hoàn thành Case', không có dấu '?'"): PA này là PA CUỐI còn chạy của Case và người xem hoàn thành được Case → kết thúc PA
   * (Kết thúc PA / Kết quả cuối) có ô tick "Hoàn thành Case" ngay trong form: mức theo Tiến triển, kết luận điền sẵn Nhận xét (sửa được).
   */
  hoanThanhCase?: { caseId: number } | null;
  /** AUDIT-1611 P1-13: người xem là GVCN lớp em / QL (`viewer.coTheKetThucPa`) → dòng quy chế PA quy chế nói "kết thúc sớm ở thẻ PA". */
  ketThucSom?: boolean;
  /** RKC-2c: người xem là Quản lý trong phạm vi Case — hiện đủ lựa chọn (máy chủ hỏi xác nhận nêu luật bị vượt). */
  vuotLuat?: boolean;
  /** U03 (mockup A2 chân): "Lưu · kỹ năng tiếp ›" — lưu xong sang Case kỹ năng kế của em (nơi mở quyết việc kế). */
  tiep?: TiepViec; chuTiep?: string;
  pa: PaCanCapNhat; hocVien?: string | null; lop?: string | null;
  /** OV-12e: đầu panel v3 — em (link hồ sơ) · ngữ cảnh ("Tăng cường bài tập · L"); Bối cảnh ≤ 3 dòng (Nguyên nhân · Kết quả kỳ trước). */
  em?: { id: number; ten: string } | null; ngCanh?: string | null; boiCanh?: [string, ReactNode][];
  /** OV-7b: sửa lần ghi gần nhất — form điền sẵn, lưu qua `POST /followups/:id/sua`. */
  sua?: SuaKetQua;
  /** PA theo quy chế cần thêm hỗ trợ → mở Thêm PA (T63, K3-12). */
  onThemPa?: () => void;
  quayLai?: { nhan: string; onClick: () => void };
  /** OV-13b: lưu xong — nơi gọi giữ panel, vẽ "✓ Đã lưu · …" (không Hoàn tác — chủ SP 13/11). */
  onClose: () => void; onSaved: (x?: DaLuuPanel) => void;
}) {
  const { homNay, ngan } = useNgayNghiepVu();
  const g = sua?.giaTri;
  const [dau] = useState(() => giaTriDau(pa, sua, homNay));
  /* NHAP-KQ-PA: nháp máy chủ (Sửa lần ghi cũ không dùng). Chữ đang gõ chưa lưu vẫn nhớ trên trình duyệt (`useNhap`) như cũ. */
  const nhapMc = sua ? null : pa.nhap ?? null;
  const [outcome, setOutcome] = useState(g?.outcome ?? nhapMc?.outcome ?? '');
  /* N03: nháp / chốt ràng vào kỳ LÚC MỞ form (chụp một lần — Case tải lại sau khi phiên khác chốt không được đẩy form cũ sang kỳ mới). Sửa lần ghi cũ không gửi. */
  const [ky] = useState(pa.cycleNo ?? 1);
  /* U04: Sửa lần ghi cũ có khoá nháp trình duyệt riêng — không đọc, không xoá chữ đang gõ của kỳ đang chạy.
     PTA 11/11: nháp trình duyệt khoá theo PA + KỲ (như máy chủ) — chữ chưa lưu của kỳ trước không hiện lại ở kỳ sau; khoá cũ theo PA chuyển một lần. */
  const [progress, setProgress, daLuuO] = useNhap(sua ? `ket-qua-nx:sua-${sua.followupId}` : `ket-qua-nx:${pa.id}:k${ky}`, g?.note ?? nhapMc?.note ?? '',
    sua ? undefined : `ket-qua-nx:${pa.id}`);
  /* `banNhap` = bản máy chủ đã xác nhận: so "Đã lưu nháp", `luc` của nó là bản gốc gửi kèm (N01). */
  const [banNhap, setBanNhap] = useState<NhapMayChu | null>(nhapMc);
  const [loiNhap, setLoiNhap] = useState<{ chu: string; thuLai: boolean } | null>(null);
  const [xungDot, setXungDot] = useState<{ moi: NhapMayChu | null; tu: 'nhap' | 'chot' } | null>(null);
  /* N03: MỘT trạng thái gửi cho cả form — đang lưu nháp thì không chốt, đang chốt thì không lưu nháp (ref chặn bấm đúp trước khi vẽ lại). */
  const [gui, setGui] = useState<'nhap' | 'chot' | null>(null);
  const dangGui = useRef<'nhap' | 'chot' | null>(null);
  const batDauGui = (x: 'nhap' | 'chot') => { if (dangGui.current) return false; dangGui.current = x; setGui(x); return true; };
  const xongGui = () => { dangGui.current = null; setGui(null); };
  const busy = gui === 'chot';
  /* OV-13b (mockup §8): PA mặc định — Điều chỉnh › "Đề xuất PA khác": kết quả kỳ lưu như Giữ nguyên + đề xuất gửi QL, MỘT nút. */
  const [deXuat, setDeXuat] = useState(false);
  const doi = useDoiPa(pa.kind);
  const coDoi = !!pa.laMacDinh && !pa.doiPaCho && !sua;
  /* Chủ SP 14/10 tối: bỏ ô "Vấn đề còn tồn / Ghi chú" — lần ghi cũ có chữ thì sửa vẫn gửi lại nguyên giá trị (không mất dữ liệu). */
  const remaining = g?.remainingIssue ?? '';
  /* Mockup v3 §5: Giữ nguyên là mặc định (lần cuối PA quy chế không có Quyết định). */
  const [decision, setDecision] = useState<PlanDecision | ''>(g?.decision ?? (pa.lanCuoi ? '' : 'keep'));
  const [chanQd, setChanQd] = useState<string | null>(null);
  const [loiLuu, setLoiLuu] = useState<{ chu: string; thuLai: boolean } | null>(null);
  const [reason, setReason] = useState<string>(g?.decisionNote ?? '');
  const [on, setOn] = useState<string>(g?.observedOn ?? homNay);
  const [moNgay, setMoNgay] = useState(false);
  const [endOn, setEndOn] = useState<string>(g?.completedOn ?? homNay);
  /* #3: ô "Hoàn thành Case" · mức (null = theo Tiến triển) · kết luận (null = theo Nhận xét). GD-20d: `htTay` null = bật sẵn theo `hoanThanhCaseBatSan`; GV bấm thì theo GV. */
  const [htTay, setHtTay] = useState<boolean | null>(null);
  const [htMuc, setHtMuc] = useState<string | null>(null);
  const [htNote, setHtNote] = useState<string | null>(null);
  /* Điều chỉnh: cùng form PA (Nội dung · Số buổi · Người dạy), giá trị đầu = bản hiện tại (sửa: bản trước lần ghi); gửi ô đã đổi như Sửa PA (`thanSuaPa`). */
  const gocDc = dau.goc;
  const [dc, setDc] = useState<GiaTriPa>(dau.dc);
  /* PR-PA (§8): khối đếm "Đã dạy x / tổng" — TU11: chỉ PA có Tổng số buổi và KHÔNG có mốc quy chế SOS (`coTongBuoi`). */
  const coDem = coTongBuoi(pa);
  /* OV-12h: MỌI PA Tutor có ô Số buổi + dòng Tutor; chỉ sửa lần ghi cũ chưa có số buổi (`cu`) là giữ như trước. */
  const paKq = { ...pa, cu: !!g && g.soBuoi == null };
  const coO = coSoBuoiKy(paKq);
  const coBuoi = canBuoiTutor(paKq);
  /* TU2 (PA Tutor): "a / b" — a kỳ đầu trống (GV gõ), b điền sẵn (nháp → kỳ trước). Sửa lần ghi cũ không có b: b = a (XM-3). */
  const [tuan, setTuan] = useState<string>(() => (coBuoi && !g ? (nhapMc?.soBuoi != null ? String(nhapMc.soBuoi) : '') : dau.tuan));
  const [duKien, setDuKien] = useState<string>(() => {
    const b0 = g ? g.buoiDuKien ?? (g.soBuoi || null) : nhapMc?.buoiDuKien ?? pa.buoiKy ?? null;
    return b0 == null ? '' : String(b0);
  });
  /*
   * TU3 (chủ SP 19/11): MỘT dòng Tutor gộp cả kỳ; "+ Tutor khác" thêm dòng (khác tutor / nội dung), mỗi dòng có ô số buổi nhỏ, tổng = a. a = 0 → không dòng.
   * Mảng giữ chữ khi a về 0 rồi gõ lại (chỉ gửi khi a ≥ 1). Nháp máy chủ / Sửa: điền đúng dữ liệu (lần ghi cũ mỗi buổi một dòng → n dòng, mỗi dòng 1 buổi).
   */
  const [buoi, setBuoi] = useState<BuoiTutor[]>(() => (g?.buoi?.length ? g.buoi : nhapMc?.buoi?.length ? nhapMc.buoi : [{ tutor: '', nhanXet: '' }]));
  const soA = kiemSoBuoiTuan(tuan) ? null : soBuoiTu(tuan);
  /* a = 0 ẩn Tutor, Nội dung, 3 nút, + Tutor khác (R1.3); a trống / đang gõ vẫn hiện (mockup A1). */
  const coDong = coBuoi && soA !== 0;
  const nhieuDong = buoi.length > 1;
  const datBuoi = (i: number, p: Partial<BuoiTutor>) => setBuoi((ds) => ds.map((x, j) => (j === i ? { ...x, ...p } : x)));
  /* "+ Tutor khác": dòng 1 lộ ô số buổi (a − 1, ít nhất 1), dòng mới 1 buổi. "Bỏ dòng" còn một dòng → ô số buổi ẩn (= a). */
  const themDong = () => setBuoi((ds) => [...(ds.length === 1 ? [{ ...ds[0], soBuoi: Math.max(1, (soA ?? 2) - 1) }] : ds), { tutor: '', nhanXet: '', soBuoi: 1 }]);
  const boDong = (i: number) => setBuoi((ds) => { const moi = ds.filter((_, j) => j !== i); return moi.length === 1 ? [{ ...moi[0], soBuoi: null }] : moi; });
  /* Thân gửi của các dòng: một dòng → số buổi = a; nhiều dòng → số buổi từng dòng. Bỏ khoảng trắng đầu / cuối. */
  const dongGui = (a: number | null) => buoi.map((x) => ({ ...x, tutor: x.tutor.trim(), nhanXet: x.nhanXet.trim(), soBuoi: nhieuDong ? x.soBuoi ?? null : a }));
  const tongDong = buoi.reduce((n, x) => n + (x.soBuoi ?? 0), 0);
  /* TU4: kỳ sau điền sẵn tutor của lần ghi gần nhất (`dienSan`) vào dòng 1 còn trống (ghi mới, chưa có nháp dòng). */
  const dienSan = useApi<KetQuaTutorChon>(coBuoi && !sua && !nhapMc?.buoi?.length ? `/tutors/chon?paId=${pa.id}` : null).data?.dienSan ?? null;
  useEffect(() => {
    if (!dienSan) return;
    setBuoi((ds) => (ds[0]?.tutor.trim() ? ds : [{ ...ds[0], tutorId: dienSan.tutorId, gvId: null, tutor: dienSan.ten, hinhThuc: null }, ...ds.slice(1)]));
  }, [dienSan]);
  /* TU7: phần Tutor của nháp — a, b (số hợp lệ, không thì trống), các dòng có chữ (cùng dạng máy chủ lưu `phanTutorNhap` để so "Đã lưu nháp"). */
  const soHoacTrong = (v: string, tu: number) => { const n = soBuoiTu(v); return n !== null && Number.isInteger(n) && n >= tu && n <= 60 ? n : null; };
  const chuanDong = (x: BuoiTutor): BuoiTutor => ({
    tutorId: x.tutorId ?? null, gvId: x.gvId ?? null, soBuoi: x.soBuoi ?? null, tutor: x.tutor.trim(), nhanXet: x.nhanXet.trim(),
    hinhThuc: x.hinhThuc ?? null, chuanBi: x.chuanBi ?? null, taiLieu: x.taiLieu ?? null, feedbackGv: x.feedbackGv ?? null, danhGia: x.danhGia ?? null,
    nhanXetTutor: x.nhanXetTutor?.trim() || null,
  });
  const coChu = (x: BuoiTutor) => JSON.stringify(chuanDong({ ...x, soBuoi: null })) !== JSON.stringify(chuanDong({ tutor: '', nhanXet: '' }));
  const tutorNhap = (): Pick<NhapMayChu, 'soBuoi' | 'buoiDuKien' | 'buoi'> => (!coBuoi ? {} : {
    soBuoi: soHoacTrong(tuan, 0), buoiDuKien: soHoacTrong(duKien, 1),
    buoi: buoi.filter(coChu).map((x) => chuanDong({ ...x, soBuoi: nhieuDong ? x.soBuoi ?? null : null })),
  });
  const chupNhap = (n: Partial<NhapMayChu>) => JSON.stringify([n.outcome ?? '', (n.note ?? '').trim(), n.soBuoi ?? null, n.buoiDuKien ?? null, (n.buoi ?? []).map(chuanDong)]);
  /* Mức + chữ + phần Tutor đúng bằng bản máy chủ đã xác nhận → "Đã lưu nháp" (N02: gõ tiếp lúc đang gửi thì không). */
  const trungNhap = !!banNhap && chupNhap({ outcome, note: coBuoi ? '' : progress, ...tutorNhap() }) === chupNhap(banNhap);
  /* Form đã bằng bản máy chủ (vừa lưu nháp, Dùng bản mới…) → bỏ nháp trình duyệt của ô Nhận xét (N02: gõ tiếp lúc đang gửi thì không bằng → giữ). */
  useEffect(() => { if (trungNhap) daLuuO(progress); }, [trungNhap]);   // eslint-disable-line react-hooks/exhaustive-deps
  const [nguoiDay, setNguoiDay] = useState<NguoiChon | null>(dau.nguoiDay);
  /* Thay PA: PA mới dùng một form PA (PR-PA §8) — không có Ngày bắt đầu (PA mới chạy từ Ngày ghi). */
  const [paThay, setPaThay] = useState<GiaTriPa>(dau.thay);
  /* OV-7b: PA thay thế đã chạy / Quản lý đã trả lời → chỉ sửa chữ: khoá kết quả, quyết định, ngày. */
  const khoaLuaChon = !!sua?.chan;
  const lf = useLoiForm();

  const pickOutcome = (o: string) => {
    if (khoaLuaChon) return;
    setOutcome(o);
    setChanQd(null);
    if (decision && !vuotLuat && decisionBlockedReason(o, decision)) setDecision('');
  };
  /* PR-SOS: lần CUỐI của PA theo quy chế — không khối Quyết định; "Chưa đủ dữ liệu" được, kèm Lý do (K3-13). */
  const lanCuoi = !!pa.lanCuoi;
  /* PR-LT2b (M-05): lần ghi cuối của PA Bổ trợ miễn phí bắt buộc kèm Mini Test — một lần cho cả nhóm PA của em. */
  const coMiniTest = lanCuoi && pa.kind === 'bo_tro_mien_phi';
  const [mtTyLe, setMtTyLe] = useState<string>(dau.mtTyLe);
  const [mtNgay, setMtNgay] = useState<string>(dau.mtNgay);
  /* T63, K3-12: PA theo quy chế chỉ có Giữ nguyên / Điều chỉnh / Xin hỗ trợ — Thay và Kết thúc ẨN (không mờ). */
  const dsQuyetDinh = quyetDinhChoPa({ preset: !!pa.batBuoc && !vuotLuat }, lanCuoi);   // RKC-2c: QL thấy cả Thay / Kết thúc
  /* Ba nút trên cùng; Điều chỉnh = Sửa PA này · Thay PA · Xin hỗ trợ QL (cái nào PA được phép) — chức năng giữ đủ. */
  const { tren: dsTren, dieuChinh: dsDc } = nhomQuyetDinh(dsQuyetDinh);
  const trongDc = deXuat || dsDc.includes(decision as PlanDecision);
  const needReason = !!decision && decisionNeedsReason(decision);
  const daDay = pa.daDay ?? 0;
  /* PA Tutor: không ô Nhận xét chung — Nội dung ở từng dòng; ghi chú lưu máy chủ = Nội dung (nhiều dòng: "{tutor}: {nội dung}" nối " · "); a = 0 → trống (TU6). */
  const nhanXetTheoBuoi = coBuoi;
  const ghepBuoi = !coDong ? '' : nhieuDong ? buoi.map((x) => `${x.tutor.trim()}: ${x.nhanXet.trim()}`).join(' · ') : buoi[0].nhanXet.trim();
  const dem = coDem ? demSauKetQua(daDay, pa.soBuoi!, tuan) : null;
  const thanDc = thanSuaPa(dc, gocDc, { moi: '', cu: null });

  /* Ô lỗi (YC-12.5.2): lý do dưới ô, chân chỉ đếm "n ô cần sửa ↑". Luật giữ như bản cũ. */
  const LUAT: LuatTruong[] = [
    { khoa: 'ket-qua', nhan: t('Tiến triển (2 tuần)'), chon: true },
    /* Chủ SP 14/10 tối: PA Tutor có buổi — nhận xét nằm ở từng buổi, không ô Nhận xét chung (máy chủ nhận nhận xét buổi ghép làm ghi chú). */
    /* N35: nhận xét kết quả ≤ 200 khi chữ ĐÃ ĐỔI (sửa lần ghi cũ dài vẫn sửa được ô khác); PA Tutor ghép theo buổi — không áp. */
    ...(nhanXetTheoBuoi ? [] : [{ khoa: 'tien-trien', nhan: t('Nhận xét'), toiThieu: CHU_TOI_THIEU_CASE, toiDa: progress.trim() !== (sua?.giaTri.note ?? '').trim() ? TRAN_CHU.ketQuaPa : undefined }]),
    ...(lanCuoi ? [] : [{ khoa: 'quyet-dinh', nhan: t('Quyết định'), chon: true }]),
    ...(lanCuoi && outcome === 'insufficient' ? [{ khoa: 'ly-do', nhan: t('Lý do chưa đủ dữ liệu'), toiThieu: 1 }] : []),
    ...(needReason ? [{ khoa: 'ly-do', nhan: decision === 'adjust' ? t('Lý do điều chỉnh') : t('Lý do thay'), toiThieu: 1 }] : []),
    ...(decision === 'ask_manager' ? [{ khoa: 'ly-do', nhan: t('Cần Head giúp gì'), toiThieu: CHU_TOI_THIEU_CASE }] : []),
  ];
  const loi = dsLoi(LUAT, { 'ket-qua': outcome, 'tien-trien': progress, 'quyet-dinh': decision, 'ly-do': reason });
  if (decision === 'replace') loi.push(...loiFormPa(paThay, { tienTo: 'moi-' }));   // khoá riêng: không đụng ô Số buổi tuần này
  if (coMiniTest) {
    const so = Number(mtTyLe.replace(',', '.'));
    if (mtTyLe.trim() === '' || !Number.isFinite(so) || so < 0 || so > 100) loi.push({ khoa: 'mt-ty-le', nhan: 'Mini Test (%)', lyDo: t('Nhập số từ 0 đến 100') });
    if (!mtNgay) loi.push({ khoa: 'mt-ngay', nhan: t('Ngày làm'), lyDo: t('Chọn ngày làm Mini Test') });
  }
  loi.push(...loiKetQuaTuan(paKq, tuan, nguoiDay));
  /* TU2: b — ghi mới bắt buộc (máy chủ nhận trống cho web cũ); Sửa lần ghi cũ không bắt (dữ liệu cũ không có b). */
  if (coBuoi) {
    const lb = !sua && !duKien.trim() ? t('Nhập số buổi dự kiến') : duKien.trim() ? kiemSoBuoiKy('0', duKien) : null;
    if (lb) loi.push({ khoa: 'so-buoi-du-kien', nhan: t('Số buổi dự kiến'), lyDo: lb });
  }
  /* TU3, TU6: mỗi dòng — Tutor + Nội dung (≥ 8 ký tự); nhiều dòng: số buổi từng dòng ≥ 1, tổng = a (câu ở ô đã học, viền đỏ ô dòng). 3 nút tuỳ chọn (TU5). */
  if (coDong) {
    buoi.forEach((x, i) => {
      if (nhieuDong && !(x.soBuoi && x.soBuoi >= 1)) loi.push({ khoa: `buoi-${i}-so`, nhan: t('Số buổi dòng {n}', { n: i + 1 }), lyDo: t('Từ 1 buổi') });
      if (!x.tutor.trim()) loi.push({ khoa: `buoi-${i}-tutor`, nhan: nhieuDong ? t('Tutor dòng {n}', { n: i + 1 }) : t('Tutor'), lyDo: t('Chọn hoặc gõ tên tutor') });
    });
    /* S2 (từ rà #1875, cùng luật máy chủ `chuCu`): SỬA lần ghi cũ — Nội dung cũ giữ nguyên (trước luật ≥ 8 ký tự) không bị chặn; dòng mới / chữ đã sửa vẫn kiểm. */
    const chuCu = new Set(sua ? (g?.buoi ?? []).map((x) => x.nhanXet.trim()).filter(Boolean) : []);
    loi.push(...dsLoi(buoi.flatMap((x, i) => (chuCu.has(x.nhanXet.trim()) ? []
      : [{ khoa: `buoi-${i}-nx`, nhan: nhieuDong ? t('Nội dung dòng {n}', { n: i + 1 }) : t('Nội dung'), toiThieu: CHU_TOI_THIEU_CASE }])),
      Object.fromEntries(buoi.map((x, i) => [`buoi-${i}-nx`, x.nhanXet]))));
    if (nhieuDong && soA != null && tongDong !== soA) {
      loi.push({ khoa: 'buoi-tong', nhan: t('Số buổi các dòng'), lyDo: t('Tổng {tong}, đã học {a}', { tong: tongDong, a: soA }) });
    }
  }
  if (deXuat) loi.push(...doi.loi);
  if (decision === 'adjust') {
    /* Số buổi mới ≥ đã dạy SAU tuần này (máy chủ kiểm cùng luật). */
    loi.push(...loiFormPa(dc, { goc: gocDc, daDay: dem?.da ?? daDay, tienTo: 'dc-' }));
    if (!Object.keys(thanDc).length) loi.push({ khoa: 'dc-noi-dung', nhan: t('Nội dung'), lyDo: t('Đổi ít nhất một ô: nội dung, số buổi hoặc người') });
  }
  /* #3: hiện ô khi lần ghi này kết thúc PA (Kết thúc PA / Kết quả cuối của PA quy chế) — không ở Sửa kết quả. */
  const ketThucPa = !sua && (lanCuoi || decision === 'end');
  /* GD-20d: bật sẵn khi kết thúc PA cuối + kỳ này đạt (Tiến bộ rõ; Bổ trợ miễn phí: Mini Test ≥ ngưỡng chung). Tay GV thắng. */
  const batSan = !!hoanThanhCase && hoanThanhCaseBatSan({ ketThuc: ketThucPa,outcome, boTroMienPhi: coMiniTest, mtTyLe: mtTyLe.trim() === '' ? null : Number(mtTyLe.replace(',', '.')) / 100, mtNgay: mtNgay || null });
  const htCase = htTay ?? batSan;
  const coHt = !!hoanThanhCase && ketThucPa && htCase;
  const mucHt = htMuc ?? CASE_OUTCOMES.find((x) => CASE_OUTCOME_LABEL[x] === outcomeLabelFor(outcome)) ?? '';
  const noteHt = htNote ?? (nhanXetTheoBuoi ? ghepBuoi : progress);
  if (coHt) loi.push(...dsLoi([{ khoa: 'ht-muc', nhan: t('Em tiến bộ đến đâu'), chon: true }, { khoa: 'ht-ket-luan', nhan: t('Kết luận'), toiThieu: CHU_TOI_THIEU_CASE }],
    { 'ht-muc': mucHt, 'ht-ket-luan': noteHt }));
  const thieu = loi.map((l) => l.nhan);
  const loiCua = (khoa: string) => lf.loiCua(loi, khoa);
  const o = (khoa: string) => lf.o(loi, khoa);

  const [bam, setBam] = useState<'luu' | 'tiep' | null>(null);
  const luu = async (diTiep = false, coSo = banNhap?.luc ?? null) => {
    lf.bam();
    setBam(diTiep ? 'tiep' : 'luu');
    if (thieu.length > 0 || (!decision && !lanCuoi)) return;
    if (!batDauGui('chot')) return;
    setLoiLuu(null); setXungDot(null);
    const noteGui = progress;
    try {
      const body: Record<string, unknown> = {
        decision: lanCuoi ? undefined : decision, outcome, note: nhanXetTheoBuoi ? ghepBuoi : progress, observedOn: on || undefined,
        remainingIssue: remaining.trim() || undefined,
        /* Lý do chỉ gửi khi có ô lý do thật — ô "Ghi chú" riêng đã gộp vào "Vấn đề còn tồn / Ghi chú" (PR-LUI-a2). */
        decisionNote: (needReason || decision === 'ask_manager' || (lanCuoi && outcome === 'insufficient')) ? reason.trim() || undefined : undefined,
        ...thanKetQuaTuan(paKq, tuan, nguoiDay),
        ...(coBuoi ? { buoiDuKien: soBuoiTu(duKien), buoi: coDong ? dongGui(soA) : [] } : {}),
      };
      if (decision === 'end') body.completedOn = endOn || undefined;
      /* OV-7b: sửa mà giữ lựa chọn + không đổi Điều chỉnh / PA thay / Mini Test → không gửi ba khối đó: máy chủ chỉ sửa chữ, không đảo gì. */
      const giuLuaChon = !!g && outcome === g.outcome && (decision || null) === g.decision && on === g.observedOn
        && (decision !== 'end' || endOn === g.completedOn) && JSON.stringify([dc, paThay, mtTyLe, mtNgay]) === JSON.stringify([dau.dc, dau.thay, dau.mtTyLe, dau.mtNgay]);
      if (coMiniTest && !giuLuaChon) body.miniTest = { tyLe: Number(mtTyLe.replace(',', '.')), ngay: mtNgay };
      /* Chỉ ô đã đổi; đổi người gửi đủ ba khoá (cả ba trống = xoá người). */
      if (decision === 'adjust' && !giuLuaChon) body.adjust = thanDc;
      if (decision === 'replace' && !giuLuaChon) body.newPlan = paPayload(paThay);
      if (deXuat) { body.decision = 'keep'; body.deXuatPa = doi.payload(); }
      if (!sua) { body.ky = ky; body.nhapCoSo = coSo; }
      const ct = await api.post<any>(sua ? `/followups/${sua.followupId}/sua` : `/interventions/${pa.id}/result`, body);
      const lamMoi = () => { invalidate('/cases'); invalidate('/my-work'); invalidate('/students'); invalidate('/tong-quan'); invalidate('/followups'); invalidate('/yeu-cau'); };
      /* #3: kết quả đã lưu → hoàn thành Case cùng lần bấm. Lỗi ở bước này không mất kết quả: nói rõ "chưa hoàn thành Case", nút Hoàn thành Case vẫn ở Case. */
      let daHt = false;
      let loiHt: string | null = null;
      if (coMiniTest && batSan) daHt = true;   // GD-20d: Mini Test đạt → máy chủ đã hoàn thành Case khi lưu (PR-LT2b) — không gọi lần hai
      else if (coHt && hoanThanhCase) {
        try { await api.post(`/cases/${hoanThanhCase.caseId}/outcome`, { outcome: mucHt, note: noteHt.trim(), closedOn: (decision === 'end' ? endOn : on) || undefined }); daHt = true; }
        catch (e: any) { loiHt = e?.message ?? t('Không lưu được'); }
      }
      lamMoi();
      daLuuO(noteGui);
      /* OV-13b: ở lại panel — "✓ Đã lưu · {quyết định}" + kết quả · hạn kế. Chủ SP 13/11: không Hoàn tác — sai thì "Sửa kết quả" ở thẻ PA. */
      const hanKe = (ct?.interventions ?? []).find((x: any) => x.id === pa.id)?.actionDue ?? null;
      (diTiep && tiep ? tiep.lam : onSaved)({
        chu: daHt ? t('Đã lưu kết quả · đã hoàn thành Case') : loiHt ? t('Đã lưu kết quả · chưa hoàn thành Case: {loi}', { loi: loiHt }) : sua ? t('Đã sửa kết quả') : lanCuoi ? t('Đã lưu kết quả cuối — PA theo quy chế kết thúc') : deXuat ? t('Đã lưu · gửi Head duyệt đổi PA') : pa.choXacNhan && decision === 'keep' ? t('Đã lưu kết quả · đã xác nhận PA') : DA_LUU[decision as PlanDecision],
        phu: [dich(outcomeLabelFor(outcome)), hanKe && !lanCuoi ? t('hạn kế {ngay}', { ngay: ngan(hanKe) }) : null].filter(Boolean).join(' · '),
      });
    } catch (e: any) {
      /* Chân v3: lỗi một dòng + Thử lại; chữ đã gõ giữ nguyên. N03: phiên khác vừa lưu nháp khác → cho xem bản đó trước khi chốt (chưa ghi gì).
         Kỳ đã chốt (gửi lại, tab cũ): chỉ báo, không Thử lại. */
      const xd = xungDotCua(e);
      if (xd) setXungDot({ ...xd, tu: 'chot' }); else setLoiLuu({ chu: e?.message ?? t('Không lưu được'), thuLai: !daChotCua(e) });
    } finally { xongGui(); }
  };

  /* K3-17 → OV-12a: kỳ đang ghi ("Kết quả PA · W3–W4 SEP"); trễ nhiều kỳ thì khoảng + "(ghi bù n kỳ)". Tên việc ở đầu panel: "Kết quả PA · W3–W4 SEP". */
  const tuanGhi = nhanTuanGhiKetQua(pa.actionDue ?? null, homNay).tieuDe;
  /* TU2-4 (XM-5): PA chưa tới hạn ghi kết quả (mở từ khối "PA đang chạy") — Lưu nháp giữ tới hạn, Lưu là chốt. */
  const sapToiHan = !sua && !!pa.actionDue && !toiKyGhi(pa.actionDue, homNay);
  const tenLoai = dich(INTERVENTION_KIND_LABEL[pa.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? pa.kind);
  /* PR-PA (§7): PA có Số buổi → "Học Tutor · 10 buổi"; còn lại giữ nội dung PA. */
  const tenPa = coDem ? t('{tenLoai} · {soBuoi} buổi', { tenLoai, soBuoi: pa.soBuoi }) : dichDu(pa.description) || tenLoai;

  /* Khối đếm (mockup §7): hai ô cùng hàng khi PA có Số buổi; PA không Số buổi chỉ có Người dạy (không bắt buộc). */
  const oBuoi = coO && (
    <Truong nhan={t('Số buổi kỳ này')} batBuoc loi={loiCua('so-buoi-tuan')}>
      <input className="field w-24 tabular-nums" inputMode="numeric" maxLength={2} {...o('so-buoi-tuan')} value={tuan} onChange={(e) => setTuan(e.target.value)} />
    </Truong>
  );
  /* TU2 (mockup Ⓣ1 A1–A8): PA Tutor — "Số buổi *" = hai ô [a] / [b] một hàng, nhãn nhỏ "đã học" / "dự kiến" dưới ô (XM-10); lỗi tổng dòng nói ở đây. */
  const loiAb = loiCua('so-buoi-tuan') ?? loiCua('so-buoi-du-kien') ?? loiCua('buoi-tong');
  const oSo = (khoa: string, v: string, dat: (x: string) => void, nhan: string, aria: string, loiThem = false) => (
    <label className="flex flex-col items-center gap-1">
      <input className={`field h-10 w-[84px] text-center text-[15px] font-semibold tabular-nums max-sm:w-[72px] ${loiThem || loiCua(khoa) ? '!border-late ring-1 ring-late/40' : ''}`}
        inputMode="numeric" autoComplete="off" maxLength={2} {...o(khoa)} aria-label={aria} value={v} readOnly={busy}
        onChange={(e) => dat(e.target.value.replace(/\D/g, ''))} />
      <span className="text-xs text-slate-400">{nhan}</span>
    </label>
  );
  const oAb = coBuoi && (
    <div role="group" aria-labelledby={`sb-${pa.id}`} className="flex flex-col gap-1.5">
      <span id={`sb-${pa.id}`} className="block text-[13px] font-semibold text-slate-300">{t('Số buổi')}<span aria-hidden className="text-bad"> *</span><span className="sr-only"> {t('(bắt buộc)')}</span></span>
      <div className="flex flex-wrap items-start gap-x-2 gap-y-2">
        {oSo('so-buoi-tuan', tuan, setTuan, t('đã học'), t('Số buổi đã học'), !!loiCua('buoi-tong'))}
        <span aria-hidden className="mt-2 text-[17px] font-medium text-slate-500">/</span>
        {oSo('so-buoi-du-kien', duKien, setDuKien, t('dự kiến'), t('Số buổi dự kiến'))}
        {dem && <span className="ml-3 mt-2.5 whitespace-nowrap text-[13px] text-slate-300">{t('Đã học')} <b className="font-semibold text-slate-100 tabular-nums">{dem.da} / {dem.tong}</b>
          {dem.tt === 'vuot' && <span className="font-semibold text-late"> {t('· vượt {vuot} buổi', { vuot: dem.vuot })}</span>}</span>}
      </div>
      {loiAb && <span role="alert" className="block text-xs text-late">{loiAb}</span>}
    </div>
  );
  const dongTutor = coDong && (
    <div className="flex flex-col gap-2.5">
      <div {...o('buoi-tong')} tabIndex={-1} className="flex flex-col gap-2.5 outline-none">
        {buoi.map((x, i) => (
          <DongTutorO key={i} i={i} b={x} dat={(p) => datBuoi(i, p)} paId={pa.id} lf={lf} loi={loi} nhieu={nhieuDong}
            onBo={nhieuDong && i > 0 ? () => boDong(i) : undefined} loiTong={!!loiCua('buoi-tong')} />
        ))}
      </div>
      <span><button type="button" className="btn btn-sm min-h-[44px] font-semibold sm:min-h-[32px]" onClick={themDong} disabled={busy || buoi.length >= 60}>{t('+ Tutor khác')}</button></span>
    </div>
  );
  /* PR-CT2: không bắt buộc ở mọi trường hợp (cùng `loiKetQuaTuan` và máy chủ). OV-12e: bỏ chữ "tuần" (kết quả ghi theo kỳ hai tuần). */
  const oNguoi = coNguoiDay(pa.kind) && (
    <Truong nhan={dich(nhanNguoiDay(pa.kind))} as="div" loi={loiCua('nguoi-day')}>
      {/* TU1: PA Tutor không còn ô này (`coNguoiDay`) — ai dạy ghi ở ô Tutor của dòng. */}
      <ChonNguoi nhom="nhan_vien" value={nguoiDay} choTrong={t('Để trống')} placeholder={t('Chưa chọn · gõ tên để tìm')}
        onChange={(v) => setNguoiDay(v)}
        ariaLabel={dich(nhanNguoiDay(pa.kind))} id={lf.oId('nguoi-day')} onBlur={lf.roi('nguoi-day')} invalid={!!loiCua('nguoi-day')} />
    </Truong>
  );

  /* Khối con mở NGAY DƯỚI Quyết định (thụt, vạch trái): Điều chỉnh (Sửa PA này · Thay PA · Xin hỗ trợ QL) / Kết thúc PA. */
  const khoiCon = (d: PlanDecision) => {
    if (d === 'adjust') {
      return (
        <div className="space-y-3">
          {/* S2 (từ S1, TU11): PA Tutor có mốc quy chế SOS không đếm tổng (`coTongBuoi`) → Điều chỉnh (kể cả mở lại từ `g.adjust`) không có ô "Tổng số buổi";
              cờ `xacNhan` của FormPa đúng việc này (ẩn ô Tổng số buổi của PA Tutor). */}
          <FormPa phang tienTo="dc-" v={dc} dat={(p) => setDc((x) => ({ ...x, ...p }))} lf={lf} loi={loi} daDay={dem?.da ?? daDay}
            xacNhan={(MOC_QUY_CHE_SOS as readonly (string | null | undefined)[]).includes(pa.mocQuyChe)} />
          <Truong nhan={t('Lý do điều chỉnh')} batBuoc loi={loiCua('ly-do')}>
            <input className="field w-full" {...o('ly-do')} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Truong>
        </div>
      );
    }
    if (d === 'replace') {
      return (
        <div className="space-y-3">
          <FormPa phang chonLoai tienTo="moi-" v={paThay} dat={(p) => setPaThay((x) => ({ ...x, ...p }))} lf={lf} loi={loi} />
          <Truong nhan={t('Lý do thay')} batBuoc loi={loiCua('ly-do')}>
            <input className="field w-full" {...o('ly-do')} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Truong>
        </div>
      );
    }
    if (d === 'ask_manager') {
      return (
        <div className="space-y-2">
          <Truong nhan={t('Cần Head giúp gì')} batBuoc loi={loiCua('ly-do')}>
            <textarea className="field w-full" {...o('ly-do')} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Truong>
          <p className="m-0 text-xs text-slate-400">{t('Gửi Head · trả lời trong {n} ngày · xem ở Yêu cầu của tôi', { n: hanDuyetNgay() })}</p>
        </div>
      );
    }
    if (d === 'end') {
      return <Truong nhan={t('Ngày kết thúc')}><ONgay kieu="ngay" value={endOn} onChange={setEndOn} toiDa={homNay} /></Truong>;
    }
    return null;
  };
  const khoiDoi = deXuat ? (
    <div className="space-y-2">
      <FormDoiPa d={doi} lf={lf} />
      <p className="m-0 text-xs text-slate-400">{t('PA hiện tại chạy tới khi Head duyệt')}</p>
    </div>
  ) : null;
  /* Quyết định bị chặn theo kết quả (vd "Chưa đủ dữ liệu" thì chưa Kết thúc) — bấm thì nói lý do ngay dưới, không chọn. */
  const chanCua = (x: PlanDecision) => (khoaLuaChon && decision !== x ? sua!.chan : outcome && !vuotLuat ? decisionBlockedReason(outcome, x) : null);
  const chonQd = (d: PlanDecision) => {
    setDeXuat(false);
    if (d === 'adjust') {
      if (trongDc) return;
      const dau = dsDc.find((x) => !chanCua(x));
      if (dau) { setDecision(dau); setChanQd(null); } else setChanQd(chanCua(dsDc[0]));
      return;
    }
    const ly = chanCua(d);
    if (ly) { setChanQd(ly); return; }
    setDecision(d); setChanQd(null);
  };

  /*
   * NHAP-KQ-PA: lưu tạm — không kiểm đủ ô, không chốt; việc / hạn không đổi. Lỗi: chữ giữ nguyên, chân báo + Thử lại.
   * AUDIT-1454: gửi bản chụp + bản gốc + kỳ. Xong: bỏ nháp trình duyệt CHỈ khi ô vẫn đúng chữ đã gửi (N02); xung đột → giữ chữ, cho xem bản mới (N01).
   */
  const luuNhap = async (coSo = banNhap?.luc ?? null) => {
    if (!batDauGui('nhap')) return;
    setLoiNhap(null); setXungDot(null);
    const chup = { outcome, note: coBuoi ? '' : progress, ...tutorNhap() };
    try {
      const r = await api.put<{ nhap: NhapMayChu | null }>(`/interventions/${pa.id}/nhap`, { ...chup, ky, coSo });
      setBanNhap(r.nhap);   // trùng chữ đang có → effect trên bỏ nháp trình duyệt
      /* TU2-4: PA chưa tới hạn không có dòng việc — báo tại chỗ cho khối "PA đang chạy", không tải lại `/my-work` (dòng đọc GV sát trần). */
      baoNhapPa(pa.id, r.nhap);
      if (!sapToiHan) invalidate('/my-work');
      invalidate('/cases');
    } catch (e: any) {
      const xd = xungDotCua(e);
      if (xd) setXungDot({ ...xd, tu: 'nhap' }); else setLoiNhap({ chu: e?.message ?? t('Không lưu được'), thuLai: !daChotCua(e) });
    } finally { xongGui(); }
  };
  /* Xung đột: "Dùng bản mới" thay chữ đang gõ bằng bản máy chủ; "Lưu bản của tôi" gửi lại với bản gốc = bản mới (đè có chủ ý). Không tự gộp. */
  const dungBanMoi = () => {
    if (!xungDot?.moi) return;
    const m = xungDot.moi;
    setOutcome(m.outcome); setProgress(m.note); setBanNhap(m); setXungDot(null);
    if (coBuoi) {
      setTuan(m.soBuoi != null ? String(m.soBuoi) : ''); setDuKien(m.buoiDuKien != null ? String(m.buoiDuKien) : '');
      setBuoi(m.buoi?.length ? m.buoi : [{ tutor: '', nhanXet: '' }]);
    }
  };
  const giuBanToi = () => {
    if (!xungDot) return;
    const goc = xungDot.moi?.luc ?? null;
    setBanNhap(xungDot.moi);
    if (xungDot.tu === 'nhap') void luuNhap(goc); else void luu(bam === 'tiep', goc);
  };
  const nutNhap = !sua && (
    /* GD-3 (mockup v21 K4c): "Lưu nháp" là nút phụ đứng trước nút chính. */
    <button type="button" className="btn min-h-[40px] px-4" onClick={() => void luuNhap()} disabled={!!gui}>{gui === 'nhap' ? t('Đang lưu nháp…') : t('Lưu nháp')}</button>
  );
  const nhanNut = busy ? t('Đang lưu…') : sua ? t('Lưu') : lanCuoi ? t('Lưu kết quả cuối') : deXuat ? t('Lưu kết quả · gửi Head duyệt') : dich(NUT_LUU_KET_QUA[decision || 'keep']);
  const nut = tiep && !sua
    ? <NutVaTiep chu={nhanNut} chuTiep={chuTiep ?? t('Lưu · việc tiếp ›')} busy={busy} tat={!!gui} tiep={tiep} bam={bam} luu={(x) => void luu(x)} coDong={false} />
    : <button type="button" className="btn btn-primary min-h-[40px] px-4 font-bold" disabled={!!gui} onClick={() => void luu()}>{nhanNut}</button>;
  /* PTA rà 1454: nháp giữ Tiến triển + Nhận xét (+ TU7: phần Tutor) — ô khác (Quyết định, Lý do, Điều chỉnh, Hoàn thành Case) đổi thì vẫn "đang sửa" dù trùng nháp. */
  const ngoaiNhap = !!((decision && decision !== 'keep') || doi.daSua || reason.trim() || htCase
    || on !== homNay || (!coBuoi && tuan !== dau.tuan) || mtTyLe !== dau.mtTyLe || mtNgay !== dau.mtNgay || JSON.stringify(nguoiDay) !== JSON.stringify(dau.nguoiDay));
  /* F06 (audit 13/11): Sửa lần ghi cũ — form điền sẵn nên "đang sửa" = khác giá trị LÚC MỞ (chụp lần vẽ đầu, mọi ô gửi đi), không phải "có chữ". */
  const chupSua = JSON.stringify([outcome, progress.trim(), decision, reason.trim(), on, endOn, buoi, dc, paThay, tuan, duKien, mtTyLe, mtNgay, nguoiDay]);
  const [gocSua] = useState(chupSua);
  /* Tên tutor điền sẵn (kỳ trước) và b điền sẵn chưa phải "đang sửa". */
  const coTutorGo = coBuoi && !!(tuan.trim() || buoi.length > 1 || (duKien.trim() && duKien !== String(pa.buoiKy ?? ''))
    || buoi.some((x) => x.nhanXet.trim() || x.nhanXetTutor?.trim() || x.danhGia != null || TIEU_CHI_TUTOR.some(({ k }) => x[k] != null)));
  const daSua = sua ? chupSua !== gocSua : (!trungNhap && !!(outcome || (!coBuoi && progress.trim()) || coTutorGo)) || ngoaiNhap;
  /* Form nằm trong panel việc / Ngăn Case: ✕ · Đóng · "‹ Công việc" là của panel ngoài — báo lên để panel hỏi trước khi bỏ chữ / Quyết định / Lý do (chỉ ở state). */
  useBaoDangSua(daSua);
  /* AUDIT-1611 A1-13: mở từ nút "Ghi Mini Test" → tên form cùng động từ của nút. */
  const tieuDe = sua ? (lanCuoi ? t('Sửa kết quả cuối') : t('Sửa kết quả')) : coMiniTest || pa.miniTestHan ? t('Ghi Mini Test') : lanCuoi ? t('Kết quả cuối') : tuanGhi.replace(/\b(W\d) ([A-Z]{3})\b/g, '$1\u00a0$2');   // mã tuần không tách dòng

  /* Khối Quyết định — PA Tutor đứng ngay sau Tiến triển (mockup Ⓣ1 R1.1), PA khác giữ chỗ cũ. */
  const khoiQd = !lanCuoi && (
        <div {...o('quyet-dinh')} tabIndex={-1} className="flex flex-col gap-2 outline-none">
          <span className="block text-[13px] font-semibold text-slate-300">{t('Quyết định')}<span aria-hidden className="text-bad"> *</span></span>
          {/* Chủ SP 14/11 (rà #1563): Quyết định giữ dáng nút đoạn như cũ. */}
          <BoLocDoan ariaLabel={t('Quyết định')} value={(trongDc ? 'adjust' : decision || '') as PlanDecision}
            muc={dsTren.map((d) => ({ key: d, nhan: dich(PLAN_DECISION_NGAN[d]) }))} onChange={chonQd} />
          {chanQd && <p className="m-0 text-xs text-late" role="alert">{chanQd}</p>}
          {/* AUDIT-1611 P1-13: bỏ câu tĩnh trái dòng quy chế; giữ lối "+ Thêm PA" (T63, K3-12). */}
          {pa.batBuoc && onThemPa && <span><NutChu onClick={onThemPa}>{t('+ Thêm PA')}</NutChu></span>}
          {(deXuat || (decision && decision !== 'keep')) && (trongDc ? dsDc.length + Number(coDoi) > 1 || khoiCon(decision as PlanDecision) : khoiCon(decision as PlanDecision)) && (
            <div className="ml-1 space-y-3 border-l-2 pl-3" style={{ borderColor: 'var(--accent-line)' }}>
              {trongDc && dsDc.length + Number(coDoi) > 1 && (
                <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('Cách điều chỉnh')}>
                  {dsDc.map((x) => (
                    <NutChon key={x} nho chon={!deXuat && decision === x} disabled={!!chanCua(x)} title={chanCua(x) ?? undefined} onClick={() => { setDeXuat(false); setDecision(x); setChanQd(null); }}>
                      {x === 'adjust' ? t('Sửa PA này') : dich(PLAN_DECISION_NGAN[x])}
                    </NutChon>
                  ))}
                  {coDoi && <NutChon nho chon={deXuat} onClick={() => { setDeXuat(true); setDecision('keep'); setChanQd(null); }}>{t('Đề xuất PA khác…')}</NutChon>}
                </div>
              )}
              {deXuat ? khoiDoi : khoiCon(decision as PlanDecision)}
            </div>
          )}
          {loiCua('quyet-dinh') && <span className="block text-xs text-late">{loiCua('quyet-dinh')}</span>}
        </div>
  );

  return (
    <KhungPanel hd="ket-qua-pa" tieuDe={tieuDe} hocVien={hocVien} lop={lop} quayLai={quayLai} onDong={onClose}
      /* Sửa: hạn của lần đã ghi không còn là việc phải làm — không chip hạn. */
      dau={dauViec({ han: sua ? null : pa.miniTestHan ? <ChipHan loai="mini-test" han={pa.miniTestHan} /> : pa.actionDue ? <ChipHan loai="cap-nhat-pa" han={pa.actionDue} /> : null, em: em ?? null, lop, ngCanh: ngCanh ?? tenPa })}
      chan={{
        /* U01 — một bộ chữ: ● Chưa lưu → ⟳ Đang lưu nháp… → ✓ Đã lưu nháp · chưa chốt → (Lưu) ✓ Đã lưu kết quả · Sửa (dải sau lưu). */
        v3: true, chinh: <>{nutNhap}{nut}</>, daSua, conThieu: lf.conThieu(loi),
        dongTren: gui ? <TrangThaiLuu tt="dang" chuDang={gui === 'nhap' ? t('Đang lưu nháp…') : undefined} />
          : xungDot ? <span role="alert" className="font-semibold text-bad">⚠ {t('Chưa lưu · có bản nháp mới hơn')}</span>
          : loiLuu ? <TrangThaiLuu tt="loi" loi={loiLuu.chu} onThuLai={loiLuu.thuLai ? () => void luu(bam === 'tiep') : undefined} />
          : loiNhap ? <TrangThaiLuu tt="loi" loi={loiNhap.chu} onThuLai={loiNhap.thuLai ? () => void luuNhap() : undefined} />
          : trungNhap && !ngoaiNhap ? <span role="status" className="font-semibold text-done">✓ {t('Đã lưu nháp · chưa chốt')}</span>
          : daSua ? <TrangThaiLuu tt="nhap" /> : undefined,
      }}>
      <div className="flex flex-col gap-5 pt-4">
        {sua?.chan && (
          <p className="m-0 flex items-start gap-1.5 text-[13px] text-slate-300">
            <span className="mt-0.5 text-slate-400"><KhoaNho /></span><span>{sua.chan}</span>
          </p>
        )}
        {/* TU2-3 (mockup Ⓣ1 A2, R1.9): dải "Nháp · {ai} · {lúc}" đầu form — nền vàng như "✓ Đã lưu nháp" (XM-6). */}
        {banNhap && !xungDot && (
          <p className="m-0 flex min-h-[40px] flex-wrap items-center gap-x-2.5 rounded-lg border px-3 py-1.5 text-[13px] text-slate-300"
            style={{ borderColor: 'rgb(var(--soon-line-rgb))', background: 'rgb(var(--soon-bg-rgb))' }}>
            <b className="font-bold text-soon">{t('Nháp')}</b><span className="tabular-nums">{banNhap.boi} · {lucNhap(banNhap.luc)}</span>
          </p>
        )}
        {/* GD-3 (mockup v21 K4c): bối cảnh (PA · người dạy · kỳ trước) ĐẦU form, trước Tiến triển. */}
        <BoiCanh dong={boiCanh ?? [[t('Phương án'), [tenPa, coNguoiDay(pa.kind) && pa.performer, pa.mocChu && dich(pa.mocChu)].filter(Boolean).join(' · ')]]} />
        <CanLam>
          {xungDot && (
            /* N01 / N03: phiên khác vừa lưu nháp khác (hoặc xoá) — chữ của mình ở nguyên các ô dưới; xem bản mới rồi chọn, không tự gộp. */
            <div role="alert" className="flex flex-col gap-1.5 rounded-lg border px-3 py-2.5 text-[13px]" style={{ borderColor: 'var(--line-strong)' }}>
              <b className="font-semibold text-slate-100">
                {xungDot.moi ? t('Bản nháp mới hơn · {luc} · {ten}', { luc: lucNhap(xungDot.moi.luc), ten: xungDot.moi.boi }) : t('Nháp vừa bị xoá ở phiên khác')}
              </b>
              {xungDot.moi && (
                <p className="m-0 whitespace-pre-wrap break-words text-slate-300">
                  {xungDot.moi.outcome && <b className="font-semibold">{dich(outcomeLabelFor(xungDot.moi.outcome))}{xungDot.moi.note ? ' — ' : ''}</b>}{xungDot.moi.note}
                </p>
              )}
              <span className="text-xs text-slate-400">{t('Bản của bạn chưa lưu, vẫn ở các ô dưới.')}</span>
              <div className="flex flex-wrap items-center gap-x-4">
                {xungDot.moi && <NutChu onClick={dungBanMoi} disabled={!!gui}>{t('Dùng bản mới')}</NutChu>}
                <NutChu onClick={giuBanToi} disabled={!!gui}>{xungDot.tu === 'chot' ? t('Vẫn lưu bản của tôi') : t('Lưu bản của tôi')}</NutChu>
              </div>
            </div>
          )}
          {lanCuoi && !sua && (
            <p className="m-0 text-[13px] text-slate-300">{t('Kỳ này chạm mốc quy chế{moc} — lưu là PA kết thúc.', { moc: pa.mocChu ? ` (${dich(pa.mocChu)})` : '' })}</p>
          )}
          <div>
            <span id={`tt-${pa.id}`} className="mb-1.5 block text-[13px] font-semibold text-slate-300">{t('Tiến triển (2 tuần)')}<span aria-hidden className="text-bad"> *</span></span>
            {/* 5 mức một hàng chip (xuống dòng khi hẹp); "Chưa đủ dữ liệu" là mức thứ năm. */}
            <div {...o('ket-qua')} tabIndex={-1} className="flex flex-wrap gap-1.5 outline-none" role="group" aria-labelledby={`tt-${pa.id}`}>
              {FOLLOWUP_OUTCOMES.map((x) => (
                /* GD-3 (mockup v21 K4c): chip tròn có ký hiệu ✓ ↗ – ↓ ?, chọn = viền nhấn (không dấu ✓ góc). */
                <button key={x} type="button" aria-pressed={outcome === x} disabled={khoaLuaChon && outcome !== x} onClick={() => pickOutcome(x)}
                  className={`btn btn-sm min-h-[44px] whitespace-nowrap rounded-full px-3 sm:min-h-[34px] ${outcome === x ? '!border-[color:var(--accent)] bg-[color:var(--accent-soft)] font-semibold text-slate-100' : ''}`}>
                  <span aria-hidden className="mr-1">{KY_HIEU_TIEN_TRIEN[x]}</span>{dich(outcomeLabelFor(x))}
                </button>
              ))}
            </div>
            {loiCua('ket-qua') && <span className="mt-1 block text-xs text-late">{loiCua('ket-qua')}</span>}
          </div>
          {/* TU2-3 (mockup Ⓣ1 R1.1): PA Tutor — Tiến triển → Quyết định → Số buổi a / b → dòng Tutor → + Tutor khác. PA khác giữ thứ tự cũ. */}
          {coBuoi && <>{khoiQd}{oAb}{dongTutor}</>}
          {!nhanXetTheoBuoi && (
            <Truong nhan={t('Nhận xét')} batBuoc loi={loiCua('tien-trien')} dem={{ co: progress.trim().length, can: CHU_TOI_THIEU_CASE, toiDa: TRAN_CHU.ketQuaPa }}>
              <textarea className="field w-full" {...o('tien-trien')} rows={2} value={progress} readOnly={busy} onChange={(e) => setProgress(e.target.value)}
                placeholder={dich(GOI_Y_KET_QUA_PA)} />
            </Truong>
          )}
          {!coBuoi && (coO || coNguoiDay(pa.kind)) && (
            <div className="flex flex-col gap-2.5">
              {coO && coNguoiDay(pa.kind) ? <Hang2>{oBuoi}{oNguoi}</Hang2> : <>{oBuoi}{oNguoi}</>}
              {dem && (
                <div className="flex flex-wrap items-center gap-2.5 text-[13px] text-slate-300">
                  <VachBuoi da={dem.da} tong={dem.tong} tt={dem.tt} />
                  {/* Đuôi "· còn n" đi cùng "sau khi lưu x/y" (không rớt dòng một mình ở 375). */}
                  <span>{t('Đã dạy')}{' '}<b className="font-semibold text-slate-100 tabular-nums">{dem.truoc}/{dem.tong}</b> → <span className="whitespace-nowrap">{t('sau khi lưu')}{' '}<b className="font-semibold text-slate-100 tabular-nums">{dem.da}/{dem.tong}</b>{' '}
                    {dem.tt === 'du' ? <span className="font-semibold text-ok">{t('· đủ buổi')}</span>
                      : dem.tt === 'vuot' ? <span className="font-semibold text-late">{t('· vượt {vuot} buổi', { vuot: dem.vuot })}</span>
                      : <span>{t('· còn')}{' '}<b className="font-semibold text-slate-100 tabular-nums">{dem.con}</b></span>}</span></span>
                </div>
              )}
            </div>
          )}
          {coMiniTest && (
            <Hang2>
              <Truong nhan="Mini Test (%)" batBuoc loi={loiCua('mt-ty-le')} phu={t('Đạt từ 70%')}>
                <input className="field w-full tabular-nums" inputMode="decimal" {...o('mt-ty-le')} value={mtTyLe} onChange={(e) => setMtTyLe(e.target.value)} placeholder={t('Ví dụ: 72')} />
              </Truong>
              <Truong nhan={t('Ngày làm Mini Test')} batBuoc loi={loiCua('mt-ngay')}>
                <ONgay kieu="ngay" value={mtNgay} onChange={setMtNgay} toiDa={homNay} />
              </Truong>
            </Hang2>
          )}
          {lanCuoi && outcome === 'insufficient' && (
            <Truong nhan={t('Lý do chưa đủ dữ liệu')} batBuoc loi={loiCua('ly-do')}>
              <input className="field w-full" {...o('ly-do')} value={reason} onChange={(e) => setReason(e.target.value)}
                placeholder={t('Ví dụ: Em nghỉ ốm cả tuần cuối, chưa có bài để so')} />
            </Truong>
          )}
          {!coBuoi && khoiQd}
          {hoanThanhCase && ketThucPa && (
            /* #3 (G2-05, G2-07): PA cuối của Case — tick là hoàn thành Case luôn; mức theo Tiến triển, kết luận = Nhận xét (sửa được). */
            /* GD-20d (mockup ⑫ `.ht-case`): thẻ có viền — bật viền đậm, tắt viền nhạt; phần con thụt 28 px ở 1440, sát lề ở 375. */
            <div className="flex flex-col gap-3 rounded-[10px] border px-3.5 py-3" style={{ borderColor: htCase ? 'var(--line-strong)' : 'var(--line)' }}>
              <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 text-sm font-bold text-slate-200 sm:min-h-0">
                <input type="checkbox" className="h-4 w-4" checked={htCase} disabled={busy} onChange={(e) => setHtTay(e.target.checked)} />
                {t('Hoàn thành Case')}
              </label>
              {htCase && (
                <div className="space-y-3 sm:pl-7">
                  <Truong nhan={t('Sau cả đợt hỗ trợ, em tiến bộ đến đâu?')} batBuoc as="div" loi={loiCua('ht-muc')}>
                    <div className="grid grid-cols-2 gap-2 outline-none sm:grid-cols-4" role="group" {...o('ht-muc')} tabIndex={-1}>
                      {CASE_OUTCOMES.map((x) => (
                        <NutChon key={x} nho chon={mucHt === x} className="justify-center" onClick={() => setHtMuc(x)}>{CASE_OUTCOME_LABEL[x]}</NutChon>
                      ))}
                    </div>
                  </Truong>
                  <Truong nhan={t('Kết luận')} batBuoc loi={loiCua('ht-ket-luan')} dem={{ co: noteHt.trim().length, can: CHU_TOI_THIEU_CASE }}>
                    <textarea className="field w-full" rows={2} {...o('ht-ket-luan')} value={noteHt} readOnly={busy} onChange={(e) => setHtNote(e.target.value)} />
                  </Truong>
                </div>
              )}
            </div>
          )}
          {/* Chủ SP 14/11 (rà #1563): Ngày ghi gọn — một dòng "Ghi ngày dd/mm · Đổi"; bấm Đổi mới mở ô ngày (ghi muộn). */}
          {moNgay ? <Truong nhan={t('Ngày ghi')}><ONgay kieu="ngay" value={on} onChange={setOn} toiDa={homNay} disabled={khoaLuaChon} /></Truong> : (
            <p className="m-0 flex items-center gap-1.5 text-[13px] text-slate-400">
              <span>{t('Ghi ngày {ngay}', { ngay: ngan(on) })}</span>
              {!khoaLuaChon && <><span aria-hidden>·</span><NutChu onClick={() => setMoNgay(true)}>{t('Đổi')}</NutChu></>}
            </p>
          )}
          {/* GD-3 / GD-4b: dòng quy chế (mockup v21 K4c) ngay trên hàng nút — chân v3 để nút trong thân; câu đổi theo Quyết định (Q20–Q26). Sửa: không có câu. */}
          {!sua && <DongQuyChe px="px-0" qc={quyCheGhiKetQua({ han: pa.actionDue ? ngan(pa.actionDue) : null, decision, deXuat,
            lanCuoi, batBuoc: !!pa.batBuoc, ketThucSom, sapToi: sapToiHan, miniTest: coMiniTest || !!pa.miniTestHan, htCase: hoanThanhCase && ketThucPa ? htCase : undefined })} />}
          <div className="flex flex-wrap items-center justify-end gap-2 pt-0.5 max-sm:hidden"><NutDongPanel busy={busy} />{nutNhap}{nut}</div>
        </CanLam>
      </div>
    </KhungPanel>
  );
}

/** OV-7b: SỬA lần ghi Kết quả gần nhất — tải điền sẵn (`GET /followups/:id/sua`) rồi mở ĐÚNG form Kết quả; bị chặn thì nói lý do. */
export function SuaKetQuaPanel({ followupId, ...rest }: { followupId: number } & Omit<Parameters<typeof GhiKetQuaPanel>[0], 'pa' | 'sua'>) {
  const { data, error, reload } = useApi<SuaKetQua>(`/followups/${followupId}/sua`);
  if (!data) {
    return (
      <KhungPanel hd="ket-qua-pa" tieuDe={t('Sửa kết quả')} hocVien={rest.hocVien} lop={rest.lop} quayLai={rest.quayLai} onDong={rest.onClose}>
        {error ? <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} /> : <div className="pt-3"><Skeleton rows={6} /></div>}
      </KhungPanel>
    );
  }
  return <GhiKetQuaPanel {...rest} pa={data.pa} sua={data} />;
}

type MatPa = { description: string | null; performer: string | null; soBuoi?: number | null; startedDate?: string | null };
/** Một lần sửa PA (Điều chỉnh · sửa khi Xác nhận PA · Sửa PA), cùng hình với máy chủ (`server/src/cases/planRevisions.ts`). */
export type BanDieuChinh = {
  id: number; on: string; source: 'adjust' | 'confirm_edit' | 'sua_pa'; by: string | null; reason: string;
  before: MatPa; after: MatPa;
};
