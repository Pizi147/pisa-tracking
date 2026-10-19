import { useEffect, useState, type ReactNode } from 'react';
import type { KetQuaTutorChon } from '../../ui/PeoplePicker.tsx';
import { BuoiTutorO } from './BuoiTutorO.tsx';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { Hang2, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ChipHan } from '../../ui/Nhan.tsx';
import { BoiCanh, CanLam, NutChu, TrangThaiLuu, dauViec } from '../../ui/KhuonViec.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { BoLocDoan, ErrorState, NutChon, Skeleton } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { FormPa, KhoaNho, VachBuoi } from './FormPa.tsx';
import { nhapKetQua } from './GhiNhanh.tsx';
import { FormDoiPa, useDoiPa } from './DoiPa.tsx';
import type { DaLuuPanel } from '../../ui/KhuonViec.tsx';
import {
  FOLLOWUP_OUTCOMES, INTERVENTION_KIND_LABEL,
  GOI_Y_KET_QUA_PA, NUT_LUU_KET_QUA, PLAN_DECISION_NGAN, nhomQuyetDinh, quyetDinhChoPa,
  decisionBlockedReason, decisionNeedsReason, interventionKindsFor, nhanTuanGhiKetQua, outcomeLabelFor,
  type NguoiChon, type PlanDecision, dsLoi, type LuatTruong,
  canBuoiTutor, TIEU_CHI_TUTOR, coNguoiDay, coSoBuoi, coSoBuoiKy, demSauKetQua, kiemSoBuoiTuan, soBuoiTu, type BuoiTutor, giaTriCuaPa, loiFormPa, loiKetQuaTuan, nguoiCuaPa, paMoi, paPayload, tachKhac, thanKetQuaTuan, thanSuaPa,
  type GiaTriPa,
} from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/**
 * GHI KẾT QUẢ CỦA MỘT PA — khuôn panel v3 (OV-12e, mockup `mockup-ov12-panel-v3-2026-10-14.html` §5): đầu "Kết quả PA · W1–W2 SEP" (EN-e: tên việc ở Công việc) + chip hạn / em ↗ ·
 * lớp · PA; MỘT khối Cần làm: Tiến triển (2 tuần) * (5 mức) · Nhận xét * (Tutor: n dòng Tutor · Nhận xét buổi, không ô chung) · Số buổi kỳ này +
 * Người dạy (+ vạch "Đã dạy 3/10 → sau khi lưu 5/10") · Quyết định 3 nút Giữ nguyên (mặc định) · Điều chỉnh · Kết thúc PA — "Thay PA", "Xin hỗ trợ QL"
 * mở BÊN TRONG Điều chỉnh (`nhomQuyetDinh`, chủ SP 14/10 tối) · Ngày ghi · một nút chính; Bối cảnh ≤ 3 dòng; chân trạng thái lưu. Bỏ ô
 * "Vấn đề còn tồn / Ghi chú" — chữ cũ không xoá: sửa lần ghi cũ gửi lại nguyên giá trị, lịch sử vẫn đọc. Luật giữ nguyên (máy chủ kiểm lại); nút chính
 * luôn bấm được, bấm khi thiếu mới hiện lỗi dưới ô + "Còn thiếu n ô" ở chân.
 */

export type PaCanCapNhat = {
  id: number; kind: string; description: string | null; performer: string | null;
  actionDue: string | null; cycleNo?: number | null;
  /** Tài khoản người làm hiện tại — giá trị đầu của ô người khi Điều chỉnh (Q15) và của "Người dạy tuần này". */
  performerUserId?: number | null;
  /** PR-SOS (T22, T63): PA theo quy chế · lần ghi này là "Kết quả cuối" · chữ mốc (`đến MT2 · W2 OCT`). */
  batBuoc?: boolean; lanCuoi?: boolean; mocChu?: string | null;
  /** PR-PA (§8): Số buổi của PA (null = không đếm) · Đã dạy (tổng Số buổi tuần này các lần trước). */
  soBuoi?: number | null; daDay?: number;
  /** OV-13b: PA mặc định (quy chế · Bổ trợ) — Điều chỉnh có "Đề xuất PA khác"; `doiPaCho` = đã có đề xuất chờ QL (ẩn lựa chọn). */
  laMacDinh?: boolean; doiPaCho?: boolean;
};

/**
 * OV-7b: điền sẵn của `GET /followups/:id/sua` — PA như NGAY TRƯỚC lần ghi (`pa`), giá trị đã ghi (`giaTri`), `chan` = vì sao không đổi được lựa chọn
 * (PA thay thế đã chạy, Quản lý đã trả lời) — khi đó chỉ sửa chữ.
 */
export type SuaKetQua = {
  followupId: number; caseId: number; chan: string | null; pa: PaCanCapNhat;
  giaTri: {
    outcome: string; note: string; remainingIssue: string; decision: PlanDecision | null; decisionNote: string; observedOn: string;
    completedOn: string | null; soBuoi: number | null; nguoiDay: { userId: number | null; ten: string } | null;
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
  ask_manager: t('Đã gửi Quản lý — PA vẫn chạy'),
};

export function GhiKetQuaPanel({ pa, sua, hocVien, lop, em, ngCanh, boiCanh, quayLai, onClose, onSaved, onThemPa }: {
  pa: PaCanCapNhat; hocVien?: string | null; lop?: string | null;
  /** OV-12e: đầu panel v3 — em (link hồ sơ) · ngữ cảnh ("Tăng cường bài tập · L"); Bối cảnh ≤ 3 dòng (Nguyên nhân · Kết quả kỳ trước). */
  em?: { id: number; ten: string } | null; ngCanh?: string | null; boiCanh?: [string, ReactNode][];
  /** OV-7b: sửa lần ghi gần nhất — form điền sẵn, lưu qua `POST /followups/:id/sua`. */
  sua?: SuaKetQua;
  /** PA theo quy chế cần thêm hỗ trợ → mở Thêm PA (T63, K3-12). */
  onThemPa?: () => void;
  quayLai?: { nhan: string; onClick: () => void };
  /** OV-13b: lưu xong — nơi gọi giữ panel, vẽ "✓ Đã lưu · …" (+ Hoàn tác khi ghi mới). */
  onClose: () => void; onSaved: (x?: DaLuuPanel) => void;
}) {
  const { homNay, ngan } = useNgayNghiepVu();
  const g = sua?.giaTri;
  const [dau] = useState(() => giaTriDau(pa, sua, homNay));
  /* OV-13b: chữ đã gõ ở dòng ghi nhanh mang sang ("Điều chỉnh / Kết thúc…"). */
  const [nhap] = useState(() => { const x = sua ? undefined : nhapKetQua.get(pa.id); nhapKetQua.delete(pa.id); return x; });
  const [outcome, setOutcome] = useState(g?.outcome ?? nhap?.outcome ?? '');
  const [progress, setProgress] = useState(g?.note ?? nhap?.note ?? '');
  /* OV-13b: Hoàn tác ở panel trả về ĐỦ nháp (quyết định, lý do, Điều chỉnh, buổi Tutor, đề xuất PA khác…). */
  const k = nhap?.khac;
  /* OV-13b (mockup §8): PA mặc định — Điều chỉnh › "Đề xuất PA khác": kết quả kỳ lưu như Giữ nguyên + đề xuất gửi QL, MỘT nút. */
  const [deXuat, setDeXuat] = useState<boolean>(k?.deXuat ?? false);
  const doi = useDoiPa(pa.kind, k?.doi);
  const coDoi = !!pa.laMacDinh && !pa.doiPaCho && !sua;
  /* Chủ SP 14/10 tối: bỏ ô "Vấn đề còn tồn / Ghi chú" — lần ghi cũ có chữ thì sửa vẫn gửi lại nguyên giá trị (không mất dữ liệu). */
  const remaining = g?.remainingIssue ?? '';
  /* Mockup v3 §5: Giữ nguyên là mặc định (lần cuối PA quy chế không có Quyết định). */
  const [decision, setDecision] = useState<PlanDecision | ''>(k?.decision ?? g?.decision ?? (pa.lanCuoi ? '' : 'keep'));
  const [chanQd, setChanQd] = useState<string | null>(null);
  const [loiLuu, setLoiLuu] = useState<string | null>(null);
  const [reason, setReason] = useState<string>(k?.reason ?? g?.decisionNote ?? '');
  const [on, setOn] = useState<string>(k?.on ?? g?.observedOn ?? homNay);
  const [endOn, setEndOn] = useState<string>(k?.endOn ?? g?.completedOn ?? homNay);
  /* Điều chỉnh: cùng form PA (Nội dung · Số buổi · Người dạy), giá trị đầu = bản hiện tại (sửa: bản trước lần ghi); gửi ô đã đổi như Sửa PA (`thanSuaPa`). */
  const gocDc = dau.goc;
  const [dc, setDc] = useState<GiaTriPa>(k?.dc ?? dau.dc);
  /* PR-PA (§8): khối đếm — Số buổi tuần này (PA có Số buổi; mặc định 1) · Người dạy tuần này (điền sẵn người của PA; lưu ở cột phụ trách cũ). */
  const coDem = pa.soBuoi != null;
  const [tuan, setTuan] = useState<string>(k?.tuan ?? dau.tuan);
  /*
   * OV-12h (chủ SP 14/10): PA Tutor — Số buổi n → n dòng [Tên tutor · Nhận xét buổi], bắt buộc. Mảng giữ cả dòng vượt n: giảm rồi tăng số buổi không mất
   * chữ đã gõ; chỉ gửi n dòng đầu.
   */
  /* OV-12h: MỌI PA Tutor có ô Số buổi kỳ này + dòng buổi; chỉ sửa lần ghi cũ chưa có số buổi (`cu`) là giữ như trước. */
  const paKq = { ...pa, cu: !!g && g.soBuoi == null };
  const coO = coSoBuoiKy(paKq);
  const coBuoi = canBuoiTutor(paKq);
  const [buoi, setBuoi] = useState<BuoiTutor[]>(k?.buoi ?? g?.buoi ?? []);
  const soDong = coBuoi && !kiemSoBuoiTuan(tuan) ? soBuoiTu(tuan)! : 0;
  const datBuoi = (i: number, p: Partial<BuoiTutor>) => setBuoi((ds) => {
    const moi = [...ds];
    while (moi.length <= i) moi.push({ tutor: '', nhanXet: '' });
    moi[i] = { ...moi[i], ...p };
    return moi;
  });
  /* TU-a: chọn tutor ở buổi i → các buổi sau còn trống tutor điền theo (buổi n = buổi n − 1). */
  const datTutorBuoi = (i: number, p: Partial<BuoiTutor>) => {
    datBuoi(i, p);
    if (!p.tutor?.trim()) return;
    for (let j = i + 1; j < soDong; j += 1) {
      if (buoi[j]?.tutor.trim()) break;
      datBuoi(j, { tutorId: p.tutorId ?? null, tutor: p.tutor, hinhThuc: p.hinhThuc ?? null });
    }
  };
  /* TU-a (đặc tả Tutor mục 5, 11): lần ghi có dòng buổi từ trước TU-a (3 ô trống) — Sửa không bắt 3 ô (cùng luật máy chủ). */
  const cu3 = !!g?.buoi?.length && g.buoi.some((b) => b.chuanBi == null);
  /* Điền sẵn (ghi mới): buổi 1 = tutor của Người dạy PA hoặc buổi cuối lần ghi trước (`dienSan`), buổi n > 1 = buổi n − 1. Chỉ dòng chưa có tutor. */
  const dienSan = useApi<KetQuaTutorChon>(coBuoi && !sua ? `/tutors/chon?paId=${pa.id}` : null).data?.dienSan ?? null;
  useEffect(() => {
    if (sua || !soDong) return;
    setBuoi((ds) => {
      const moi = [...ds];
      let doi = false;
      for (let i = 0; i < soDong; i += 1) {
        if (moi[i]?.tutor.trim()) continue;
        const tu = i === 0 ? (dienSan ? { tutorId: dienSan.tutorId, tutor: dienSan.ten, hinhThuc: dienSan.hinhThuc } : null)
          : moi[i - 1]?.tutor.trim() ? { tutorId: moi[i - 1].tutorId ?? null, tutor: moi[i - 1].tutor, hinhThuc: moi[i - 1].hinhThuc ?? null } : null;
        if (!tu) continue;
        while (moi.length <= i) moi.push({ tutor: '', nhanXet: '' });
        moi[i] = { ...moi[i], ...tu };
        doi = true;
      }
      return doi ? moi : ds;
    });
  }, [soDong, dienSan, sua]);
  const [nguoiDay, setNguoiDay] = useState<NguoiChon | null>(k ? k.nguoiDay ?? null : dau.nguoiDay);
  /* Thay PA: PA mới dùng một form PA (PR-PA §8) — không có Ngày bắt đầu (PA mới chạy từ Ngày ghi). */
  const [paThay, setPaThay] = useState<GiaTriPa>(k?.paThay ?? dau.thay);
  /* OV-7b: PA thay thế đã chạy / Quản lý đã trả lời → chỉ sửa chữ: khoá kết quả, quyết định, ngày. */
  const khoaLuaChon = !!sua?.chan;
  const lf = useLoiForm();
  const [busy, setBusy] = useState(false);

  const pickOutcome = (o: string) => {
    if (khoaLuaChon) return;
    setOutcome(o);
    setChanQd(null);
    if (decision && decisionBlockedReason(o, decision)) setDecision('');
  };
  /* PR-SOS: lần CUỐI của PA theo quy chế — không khối Quyết định; "Chưa đủ dữ liệu" được, kèm Lý do (K3-13). */
  const lanCuoi = !!pa.lanCuoi;
  /* PR-LT2b (M-05): lần ghi cuối của PA Bổ trợ miễn phí bắt buộc kèm Mini Test — một lần cho cả nhóm PA của em. */
  const coMiniTest = lanCuoi && pa.kind === 'bo_tro_mien_phi';
  const [mtTyLe, setMtTyLe] = useState<string>(k?.mtTyLe ?? dau.mtTyLe);
  const [mtNgay, setMtNgay] = useState<string>(k?.mtNgay ?? dau.mtNgay);
  /* T63, K3-12: PA theo quy chế chỉ có Giữ nguyên / Điều chỉnh / Xin hỗ trợ — Thay và Kết thúc ẨN (không mờ). */
  const dsQuyetDinh = quyetDinhChoPa({ preset: !!pa.batBuoc }, lanCuoi);
  /* Ba nút trên cùng; Điều chỉnh = Sửa PA này · Thay PA · Xin hỗ trợ QL (cái nào PA được phép) — chức năng giữ đủ. */
  const { tren: dsTren, dieuChinh: dsDc } = nhomQuyetDinh(dsQuyetDinh);
  const trongDc = deXuat || dsDc.includes(decision as PlanDecision);
  const needReason = !!decision && decisionNeedsReason(decision);
  const daDay = pa.daDay ?? 0;
  /* Chủ SP 14/10 tối: PA Tutor có buổi — nhận xét nằm ở từng buổi, không ô Nhận xét chung; máy chủ nhận nhận xét các buổi ghép lại làm ghi chú. */
  const nhanXetTheoBuoi = coBuoi && soDong > 0;
  const ghepBuoi = Array.from({ length: soDong }, (_, i) => (buoi[i]?.nhanXet ?? '').trim()).filter(Boolean).map((x, i) => `Buổi ${i + 1}: ${x}`).join(' · ');
  const dem = coDem ? demSauKetQua(daDay, pa.soBuoi!, tuan) : null;
  const thanDc = thanSuaPa(dc, gocDc, { moi: '', cu: null });

  /* Ô lỗi (YC-12.5.2): lý do dưới ô, chân chỉ đếm "n ô cần sửa ↑". Luật giữ như bản cũ. */
  const LUAT: LuatTruong[] = [
    { khoa: 'ket-qua', nhan: t('Tiến triển (2 tuần)'), chon: true },
    /* Chủ SP 14/10 tối: PA Tutor có buổi — nhận xét nằm ở từng buổi, không ô Nhận xét chung (máy chủ nhận nhận xét buổi ghép làm ghi chú). */
    ...(nhanXetTheoBuoi ? [] : [{ khoa: 'tien-trien', nhan: t('Nhận xét'), toiThieu: 8 }]),
    ...(lanCuoi ? [] : [{ khoa: 'quyet-dinh', nhan: t('Quyết định'), chon: true }]),
    ...(lanCuoi && outcome === 'insufficient' ? [{ khoa: 'ly-do', nhan: t('Lý do chưa đủ dữ liệu'), toiThieu: 1 }] : []),
    ...(needReason ? [{ khoa: 'ly-do', nhan: decision === 'adjust' ? t('Lý do điều chỉnh') : t('Lý do thay'), toiThieu: 1 }] : []),
    ...(decision === 'ask_manager' ? [{ khoa: 'ly-do', nhan: t('Cần Quản lý giúp gì'), toiThieu: 8 }] : []),
  ];
  const loi = dsLoi(LUAT, { 'ket-qua': outcome, 'tien-trien': progress, 'quyet-dinh': decision, 'ly-do': reason });
  if (decision === 'replace') loi.push(...loiFormPa(paThay, { tienTo: 'moi-' }));   // khoá riêng: không đụng ô Số buổi tuần này
  if (coMiniTest) {
    const so = Number(mtTyLe.replace(',', '.'));
    if (mtTyLe.trim() === '' || !Number.isFinite(so) || so < 0 || so > 100) loi.push({ khoa: 'mt-ty-le', nhan: 'Mini Test (%)', lyDo: t('Nhập số từ 0 đến 100') });
    if (!mtNgay) loi.push({ khoa: 'mt-ngay', nhan: t('Ngày làm'), lyDo: t('Chọn ngày làm Mini Test') });
  }
  loi.push(...loiKetQuaTuan(paKq, tuan, nguoiDay));
  for (let i = 0; i < soDong; i += 1) {
    if (!buoi[i]?.tutor.trim()) loi.push({ khoa: `buoi-${i}-tutor`, nhan: t('Tên tutor buổi {x}', { x: i + 1 }), lyDo: t('Chưa điền') });
    if (!buoi[i]?.nhanXet.trim()) loi.push({ khoa: `buoi-${i}-nx`, nhan: t('Nhận xét buổi {x}', { x: i + 1 }), lyDo: t('Chưa điền') });
    /* TU-a: 3 ô "Tutor buổi này" bắt buộc (trừ lần ghi cũ) — lỗi ngay dòng thiếu, chân đếm "n ô còn thiếu". */
    if (!cu3) {
      for (const { k: o, ngan } of TIEU_CHI_TUTOR) {
        if (buoi[i]?.[o] == null) loi.push({ khoa: `buoi-${i}-${o}`, nhan: t('Buổi {x} · {o}', { x: i + 1, o: ngan }), lyDo: t('Chọn Có hoặc Không') });
      }
    }
  }
  if (nhanXetTheoBuoi && !loi.some((l) => l.khoa.startsWith('buoi-')) && ghepBuoi.replace(/^Buổi \d+: /, '').length < 8) {
    loi.push({ khoa: 'buoi-0-nx', nhan: t('Nhận xét buổi {n}', { n: 1 }), lyDo: t('Ghi rõ hơn — ít nhất 8 ký tự') });
  }
  if (deXuat) loi.push(...doi.loi);
  if (decision === 'adjust') {
    /* Số buổi mới ≥ đã dạy SAU tuần này (máy chủ kiểm cùng luật). */
    loi.push(...loiFormPa(dc, { goc: gocDc, daDay: dem?.da ?? daDay, tienTo: 'dc-' }));
    if (!Object.keys(thanDc).length) loi.push({ khoa: 'dc-noi-dung', nhan: t('Nội dung'), lyDo: t('Đổi ít nhất một ô: nội dung, số buổi hoặc người') });
  }
  const thieu = loi.map((l) => l.nhan);
  const loiCua = (khoa: string) => lf.loiCua(loi, khoa);
  const o = (khoa: string) => lf.o(loi, khoa);

  const luu = async () => {
    lf.bam();
    if (thieu.length > 0 || (!decision && !lanCuoi)) return;
    setBusy(true);
    setLoiLuu(null);
    try {
      const body: Record<string, unknown> = {
        decision: lanCuoi ? undefined : decision, outcome, note: nhanXetTheoBuoi ? ghepBuoi : progress, observedOn: on || undefined,
        remainingIssue: remaining.trim() || undefined,
        /* Lý do chỉ gửi khi có ô lý do thật — ô "Ghi chú" riêng đã gộp vào "Vấn đề còn tồn / Ghi chú" (PR-LUI-a2). */
        decisionNote: (needReason || decision === 'ask_manager' || (lanCuoi && outcome === 'insufficient')) ? reason.trim() || undefined : undefined,
        ...thanKetQuaTuan(paKq, tuan, nguoiDay),
        ...(coBuoi ? { buoi: Array.from({ length: soDong }, (_, i) => ({ ...buoi[i], tutor: buoi[i].tutor.trim(), nhanXet: buoi[i].nhanXet.trim() })) } : {}),
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
      const ct = await api.post<any>(sua ? `/followups/${sua.followupId}/sua` : `/interventions/${pa.id}/result`, body);
      const lamMoi = () => { invalidate('/cases'); invalidate('/my-work'); invalidate('/students'); invalidate('/tong-quan'); invalidate('/followups'); invalidate('/yeu-cau'); };
      lamMoi();
      /* OV-13b: ở lại panel — "✓ Đã lưu · {quyết định}" + kết quả · hạn kế; Hoàn tác (ghi mới) = bỏ lần ghi này, chữ trả về form. */
      const f = sua ? null : (ct?.followups ?? []).find((x: any) => x.interventionId === pa.id) ?? null;
      const hanKe = (ct?.interventions ?? []).find((x: any) => x.id === pa.id)?.actionDue ?? null;
      onSaved({
        chu: sua ? t('Đã sửa kết quả') : lanCuoi ? t('Đã lưu kết quả cuối — PA theo quy chế kết thúc') : deXuat ? t('Đã lưu · gửi Quản lý duyệt đổi PA') : DA_LUU[decision as PlanDecision],
        phu: [dich(outcomeLabelFor(outcome)), hanKe && !lanCuoi ? t('hạn kế {ngay}', { ngay: ngan(hanKe) }) : null].filter(Boolean).join(' · '),
        hoanTac: f ? async () => {
          await api.post(`/followups/${f.id}/hoan-tac`); lamMoi();
          nhapKetQua.set(pa.id, { outcome, note: progress, khac: { deXuat, decision, reason, on, endOn, dc, tuan, buoi, nguoiDay, paThay, mtTyLe, mtNgay, doi: { v: doi.v, lyDo: doi.lyDo } } });
        } : undefined,
      });
    } catch (e: any) {
      /* Chân v3: lỗi một dòng + Thử lại; chữ đã gõ giữ nguyên. */
      setLoiLuu(e?.message ?? t('Không lưu được'));
    } finally { setBusy(false); }
  };

  /* K3-17 → OV-12a: kỳ đang ghi ("Kết quả PA · W3–W4 SEP"); trễ nhiều kỳ thì khoảng + "(ghi bù n kỳ)". Tên việc ở đầu panel: "Kết quả PA · W3–W4 SEP". */
  const tuanGhi = nhanTuanGhiKetQua(pa.actionDue ?? null, homNay).tieuDe;
  const tenLoai = dich(INTERVENTION_KIND_LABEL[pa.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? pa.kind);
  /* PR-PA (§7): PA có Số buổi → "Học Tutor · 10 buổi"; còn lại giữ nội dung PA. */
  const tenPa = coDem ? t('{tenLoai} · {soBuoi} buổi', { tenLoai, soBuoi: pa.soBuoi }) : pa.description || tenLoai;

  /* Khối đếm (mockup §7): hai ô cùng hàng khi PA có Số buổi; PA không Số buổi chỉ có Người dạy (không bắt buộc). */
  const oBuoi = coO && (
    <Truong nhan={t('Số buổi kỳ này')} batBuoc loi={loiCua('so-buoi-tuan')}>
      <input className="field w-24 tabular-nums" inputMode="numeric" maxLength={2} {...o('so-buoi-tuan')} value={tuan} onChange={(e) => setTuan(e.target.value)} />
    </Truong>
  );
  /* PR-CT2: không bắt buộc ở mọi trường hợp (cùng `loiKetQuaTuan` và máy chủ). OV-12e: bỏ chữ "tuần" (kết quả ghi theo kỳ hai tuần). */
  const oNguoi = coNguoiDay(pa.kind) && (
    <Truong nhan={t('Người dạy')} as="div" loi={loiCua('nguoi-day')}>
      {/* TU-a (mục 6): PA Tutor — nhóm "Tutor" đầu danh sách, chọn tutor lưu như người ngoài; buổi 1 chưa có tutor thì điền theo. */}
      <ChonNguoi nhom="nhan_vien" value={nguoiDay} choTrong={t('Để trống')} placeholder={t('Chưa chọn · gõ tên để tìm')}
        tutor={pa.kind === 'tutor' ? { paId: pa.id } : undefined}
        onChange={(v, tu) => { setNguoiDay(v); if (tu && !buoi[0]?.tutor.trim()) datBuoi(0, { tutorId: tu.id, tutor: tu.ten, hinhThuc: tu.hinhThuc }); }}
        ariaLabel={t('Người dạy')} id={lf.oId('nguoi-day')} onBlur={lf.roi('nguoi-day')} invalid={!!loiCua('nguoi-day')} />
    </Truong>
  );

  /* Khối con mở NGAY DƯỚI Quyết định (thụt, vạch trái): Điều chỉnh (Sửa PA này · Thay PA · Xin hỗ trợ QL) / Kết thúc PA. */
  const khoiCon = (d: PlanDecision) => {
    if (d === 'adjust') {
      return (
        <div className="space-y-3">
          <FormPa phang tienTo="dc-" v={dc} dat={(p) => setDc((x) => ({ ...x, ...p }))} lf={lf} loi={loi} daDay={dem?.da ?? daDay} />
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
          <Truong nhan={t('Cần Quản lý giúp gì')} batBuoc loi={loiCua('ly-do')}>
            <textarea className="field w-full" {...o('ly-do')} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Truong>
          <p className="m-0 text-xs text-slate-400">{t('Gửi Quản lý · trả lời trong 5 ngày · xem ở Yêu cầu của tôi')}</p>
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
      <p className="m-0 text-xs text-slate-400">{t('PA hiện tại chạy tới khi Quản lý duyệt')}</p>
    </div>
  ) : null;
  /* Quyết định bị chặn theo kết quả (vd "Chưa đủ dữ liệu" thì chưa Kết thúc) — bấm thì nói lý do ngay dưới, không chọn. */
  const chanCua = (x: PlanDecision) => (khoaLuaChon && decision !== x ? sua!.chan : outcome ? decisionBlockedReason(outcome, x) : null);
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

  const nhanNut = busy ? t('Đang lưu…') : sua ? t('Lưu') : lanCuoi ? t('Lưu kết quả cuối') : deXuat ? t('Lưu kết quả · gửi QL duyệt') : dich(NUT_LUU_KET_QUA[decision || 'keep']);
  const nut = <button type="button" className="btn btn-primary min-h-[40px] px-4 font-bold" disabled={busy} onClick={luu}>{nhanNut}</button>;
  const daSua = !!(outcome || progress.trim() || buoi.some((b) => b.tutor.trim() || b.nhanXet.trim()) || (decision && decision !== 'keep') || doi.daSua);
  const tieuDe = sua ? (lanCuoi ? t('Sửa kết quả cuối') : t('Sửa kết quả')) : lanCuoi ? t('Kết quả cuối') : tuanGhi.replace(/\b(W\d) ([A-Z]{3})\b/g, '$1\u00a0$2');   // mã tuần không tách dòng

  return (
    <KhungPanel tieuDe={tieuDe} hocVien={hocVien} lop={lop} quayLai={quayLai} onDong={onClose}
      /* Sửa: hạn của lần đã ghi không còn là việc phải làm — không chip hạn. */
      dau={dauViec({ han: !sua && pa.actionDue ? <ChipHan loai="cap-nhat-pa" han={pa.actionDue} /> : null, em: em ?? null, lop, ngCanh: ngCanh ?? tenPa })}
      chan={{
        v3: true, chinh: nut, daSua, conThieu: lf.conThieu(loi),
        dongTren: busy || loiLuu || daSua ? <TrangThaiLuu tt={busy ? 'dang' : loiLuu ? 'loi' : 'nhap'} loi={loiLuu} onThuLai={() => void luu()} /> : undefined,
      }}>
      <div className="flex flex-col gap-5 pt-4">
        {sua?.chan && (
          <p className="m-0 flex items-start gap-1.5 text-[12.5px] text-slate-300">
            <span className="mt-0.5 text-slate-400"><KhoaNho /></span><span>{sua.chan}</span>
          </p>
        )}
        <CanLam>
          {lanCuoi && !sua && (
            <p className="m-0 text-[13px] text-slate-300">{t('Kỳ này chạm mốc quy chế{moc} — lưu là PA kết thúc.', { moc: pa.mocChu ? ` (${dich(pa.mocChu)})` : '' })}</p>
          )}
          <div>
            <span id={`tt-${pa.id}`} className="mb-1.5 block text-[13px] font-semibold text-slate-300">{t('Tiến triển (2 tuần)')}<span aria-hidden className="text-bad"> *</span></span>
            {/* 5 mức một hàng chip (xuống dòng khi hẹp); "Chưa đủ dữ liệu" là mức thứ năm. */}
            <div {...o('ket-qua')} tabIndex={-1} className="flex flex-wrap gap-1.5 outline-none" role="group" aria-labelledby={`tt-${pa.id}`}>
              {FOLLOWUP_OUTCOMES.map((x) => (
                <NutChon key={x} nho chon={outcome === x} disabled={khoaLuaChon && outcome !== x} onClick={() => pickOutcome(x)} className="rounded-full px-3">
                  {dich(outcomeLabelFor(x))}
                </NutChon>
              ))}
            </div>
            {loiCua('ket-qua') && <span className="mt-1 block text-xs text-late">{loiCua('ket-qua')}</span>}
          </div>
          {!nhanXetTheoBuoi && (
            <Truong nhan={t('Nhận xét')} batBuoc loi={loiCua('tien-trien')} dem={{ co: progress.trim().length, can: 8 }}>
              <textarea className="field w-full" {...o('tien-trien')} rows={2} value={progress} onChange={(e) => setProgress(e.target.value)}
                placeholder={dich(GOI_Y_KET_QUA_PA)} />
            </Truong>
          )}
          {(coO || coNguoiDay(pa.kind)) && (
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
              {soDong > 0 && (
                <ol className="m-0 list-none space-y-3 p-0" aria-label={t('Các buổi tutor')}>
                  {Array.from({ length: soDong }, (_, i) => (
                    <li key={i} className="border-t border-dashed pt-3" style={{ borderColor: 'var(--line-strong)' }}>
                      <BuoiTutorO i={i} b={buoi[i]} dat={(p) => datTutorBuoi(i, p)} paId={pa.id} lf={lf} loi={loi} cu3={cu3} />
                    </li>
                  ))}
                </ol>
              )}
              {!coDem && coSoBuoi(pa.kind) && <span className="text-xs text-slate-400">{t('PA chưa có Số buổi — thêm ở ⋯ › Sửa PA nếu muốn đếm.')}</span>}
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
          {!lanCuoi && (
            <div {...o('quyet-dinh')} tabIndex={-1} className="flex flex-col gap-2 outline-none">
              <span className="block text-[13px] font-semibold text-slate-300">{t('Quyết định')}</span>
              <BoLocDoan ariaLabel={t('Quyết định')} value={(trongDc ? 'adjust' : decision || '') as PlanDecision}
                muc={dsTren.map((d) => ({ key: d, nhan: dich(PLAN_DECISION_NGAN[d]) }))} onChange={chonQd} />
              {chanQd && <p className="m-0 text-xs text-late" role="alert">{chanQd}</p>}
              {pa.batBuoc && (
                <p className="m-0 flex flex-wrap items-center gap-x-1.5 text-xs text-slate-400">
                  {t('PA theo quy chế — không thay; GVCN / QL kết thúc sớm ở ⋯. Cần thêm hỗ trợ?')}
                  {onThemPa && <NutChu onClick={onThemPa}>{t('+ Thêm PA')}</NutChu>}
                </p>
              )}
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
          )}
          <Truong nhan={t('Ngày ghi')}><ONgay kieu="ngay" value={on} onChange={setOn} toiDa={homNay} disabled={khoaLuaChon} /></Truong>
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5 max-sm:hidden">{nut}</div>
        </CanLam>
        <BoiCanh dong={boiCanh ?? [[t('Phương án'), [tenPa, pa.performer, pa.mocChu && dich(pa.mocChu)].filter(Boolean).join(' · ')]]} />
      </div>
    </KhungPanel>
  );
}

/** OV-7b: SỬA lần ghi Kết quả gần nhất — tải điền sẵn (`GET /followups/:id/sua`) rồi mở ĐÚNG form Kết quả; bị chặn thì nói lý do. */
export function SuaKetQuaPanel({ followupId, ...rest }: { followupId: number } & Omit<Parameters<typeof GhiKetQuaPanel>[0], 'pa' | 'sua'>) {
  const { data, error, reload } = useApi<SuaKetQua>(`/followups/${followupId}/sua`);
  if (!data) {
    return (
      <KhungPanel tieuDe={t('Sửa kết quả')} hocVien={rest.hocVien} lop={rest.lop} quayLai={rest.quayLai} onDong={rest.onClose}>
        {error ? <ErrorState message={error.message} hint={error.hint} onRetry={reload} /> : <div className="pt-3"><Skeleton rows={6} /></div>}
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
