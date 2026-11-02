import { useEffect, useMemo, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Hang2, Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { ChonTuan } from '../../ui/ChonNgay.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { BangChung } from '../../ui/BangChung.tsx';
import { TepCho, taiTepCho, type TepChoMuc } from '../../ui/TepCho.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { OKhac } from '../../ui/OKhac.tsx';
import { NutChon } from '../../ui/ui.tsx';
import { ComponentsField, componentsPayload } from './ChiTietKyNang.tsx';
import { TenCase } from './SkillBoard.tsx';
import {
  URGENCY_LEVELS, URGENCY_LABEL, issuesForTopic, FOLLOWUP_OUTCOMES, GOI_Y_MO_TA_PA, outcomeLabelFor,
  CASE_OUTCOMES, CASE_OUTCOME_LABEL, CHU_THEM_PA, tenMon, tenMonNgan,
  categoryOf, componentsFor, componentsAreCounts,
  nguoiThanhPayload, nguoiThieu, tuanLich, type NguoiChon, dsLoi, type LuatTruong, laKhac, kiemGhiRoKhac, KHAC_TOI_THIEU,
} from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/** `ids`: các Case nhận tệp (người xem sửa được); `chu`: câu báo khi lưu nhiều Case một lần (CASE-NHIEU). */
type DaLuu = { id: number; tieuDe: string; gop: boolean; canEdit: boolean; viecTiep?: { chu: string; han: string | null } | null; ids: number[]; boTep?: boolean; chu?: string };
/** Một thẻ kỹ năng. Phân loại "Khác" (T13): ô Ghi rõ lưu ở `case_issues.observation` (Q9); đổi phân loại vẫn giữ chữ đã gõ. `gop`: kỹ năng có Case mở cùng hạng mục. */
type The = { primaryCode: string; ghiRo: string; title: string; summary: string; gop: 'ghi-vao' | 'rieng' };
const THE_TRONG: The = { primaryCode: '', ghiRo: '', title: '', summary: '', gop: 'ghi-vao' };
type DangMo = { id: number; title: string; detectedAt: string; soPa: number };
/** YC-12.5.3: mỗi PA nhập bù có Kết quả PA (bắt buộc). */
type BfAction = { description: string; nguoi: NguoiChon; fromDate: string; toDate: string; ketQua: string };

/**
 * BÁO NHANH MỘT VẤN ĐỀ.
 *
 * Giáo viên thấy vấn đề trên lớp từ nhiều tuần trước khi có điểm Mock. Trước đây không có
 * chỗ nào để nói ra, nên đến khi hệ thống "biết" thì đã muộn hai tháng.
 *
 * TỐI THIỂU CHỈ CẦN MỘT CÂU và MỘT CHỖ CẤT. Nguyên nhân cụ thể, mức độ gấp, ghi chú đều là
 * tuỳ chọn — bắt điền đủ thì giáo viên bỏ qua, và một form không ai điền thì không có dữ
 * liệu nào cả.
 *
 * Nhưng kỹ năng thì BẮT BUỘC: không có nó, vấn đề rơi vào "chưa phân loại" và biến mất khỏi
 * mọi bảng tổng hợp theo kỹ năng — đúng thứ vòng 3 sinh ra để sửa. Đổi lại, chọn nó chỉ mất
 * một lần bấm: em vướng kỹ năng nào.
 *
 * Từ 21/09/2026 form này CHỈ dành cho vấn đề học thuật. Chuyện ý thức (BTVN, chuyên cần, thái
 * độ…) là Vi phạm — có form riêng ở phần Ý thức, không đi qua cửa case.
 */
export function QuickReport({
  open, onClose, studentId, studentName, lop, cycleId, onDone, students, onPickStudent, onMoCase, kyNangDau = null,
}: {
  /** CV-LOI (X-74): mở từ "+ Case cho {kỹ năng}" — category cần chọn sẵn khi danh sách kỹ năng tải xong. */
  kyNangDau?: string | null;
  /** PR-SOS (K3-23, K3-24): mở Ngăn Case của Case có sẵn — Xác nhận Case (kỹ năng đang chờ nguyên nhân) / Thêm PA (Case vừa tạo). */
  onMoCase?: (caseId: number, viec: 'xac-nhan' | 'them-pa') => void;
  open: boolean; onClose: () => void;
  /** Mã lớp hiện ở đầu ngăn (`Tạo Case · Tên HV · MB FOU 12`); không có thì bỏ phần lớp. */
  lop?: string | null;
  studentId: number; studentName?: string; cycleId?: number | null;
  onDone?: (caseId: number) => void;
  /**
   * MỞ TỪ TRANG LỚP (mục 13.1): chọn học viên ngay ở đầu form, rồi mọi thứ còn lại giữ
   * nguyên — cùng một form, cùng quy tắc, cùng quyền. Dựng một form thứ hai cho trang lớp
   * là cách chắc chắn nhất để hai chỗ dần khác nhau về luật.
   */
  students?: { id: number; name: string; code?: string | null }[];
  onPickStudent?: (id: number) => void;
}) {
  const toast = useToast();
  /*
   * HAI TAB (mục 10.3): "Đang gặp vấn đề" (đường thường) và "Đã xong từ trước" (nhập bù).
   * Cùng bốn trường đầu (nhóm/kỹ năng/phân loại/mô tả) — chỉ khác NHỮNG GÌ hỏi thêm sau đó,
   * nên dùng chung state của bốn trường đó thay vì dựng một bộ state thứ hai.
   */
  const [mode, setMode] = useState<'now' | 'backfill'>('now');
  /*
   * CASE-NHIEU (05 mục 7.1b): chip kỹ năng chọn NHIỀU (tab ghi bù: một) — mỗi kỹ năng một thẻ riêng (nguyên nhân, tên, mô tả), lưu một lần ra n Case.
   * Chữ giữ theo kỹ năng: bỏ chip thì thẻ ẩn, chữ còn tới khi đóng panel. Thẻ khoá '' = chưa chọn kỹ năng nào (chữ gõ trước sang kỹ năng chọn đầu).
   */
  const [chon, setChon] = useState<string[]>([]);
  const [the, setThe] = useState<Record<string, The>>({});
  /* Lỗi máy chủ trả về theo kỹ năng (`details.kyNang`) — hiện đầu đúng thẻ. */
  const [loiThe, setLoiThe] = useState<Record<string, string>>({});
  /* I2 (PR-SL): không chọn sẵn mức độ — người báo tự chọn (ô bắt buộc). */
  const [urgency, setUrgency] = useState('');
  const [detectedAt, setDetectedAt] = useState('');
  const [busy, setBusy] = useState(false);
  /* YC-12.5.2: lỗi hiện dưới ô khi rời ô; sau khi bấm nút chính, chân có thêm "n ô cần sửa ↑". */
  const lf = useLoiForm();
  /* Các dòng PA đã áp dụng đang mở để sửa. YC-12.5.1: dòng chỉ gọn lại khi bấm Xong (không tự đóng khi vừa có chữ). */
  const [moSua, setMoSua] = useState<number[]>([0]);
  const { homNay, ngan } = useNgayNghiepVu();

  /* PR-LUI-a2: bằng chứng chọn ngay trong form, tải SAU khi Case có id. Lưu xong đóng panel + toast; bước "Đã lưu" chỉ còn khi có tệp lỗi. */
  const [daLuu, setDaLuu] = useState<DaLuu | null>(null);
  const [tep, setTep] = useState<TepChoMuc[]>([]);

  /* NHẬP BÙ (mục 10.3) — chỉ dùng khi mode === 'backfill'. */
  const [bfFrom, setBfFrom] = useState('');
  const [bfTo, setBfTo] = useState('');
  const [bfActions, setBfActions] = useState<BfAction[]>([
    { description: '', nguoi: { kieu: 'toi' }, fromDate: '', toDate: '', ketQua: '' },
  ]);
  const [bfErrors, setBfErrors] = useState<Record<number, string>>({});
  const [bfOutcome, setBfOutcome] = useState<string>('');
  const [bfNote, setBfNote] = useState('');
  const [bfMetrics, setBfMetrics] = useState<Record<string, { score: string; total: string }>>({});
  const [bfDup, setBfDup] = useState<any | null>(null);

  /*
   * Khoá chống trùng sinh MỘT LẦN cho mỗi lần mở hộp thoại. Bấm hai lần, mạng chập chờn
   * rồi thử lại — tất cả cùng một khoá nên chỉ tạo đúng một vấn đề.
   */
  const idempotencyKey = useMemo(
    () => `report:${studentId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    [studentId, open],
  );

  /* Mở lại hộp thoại cho một lần báo mới thì bước "Đã lưu" của lần trước không còn ý nghĩa. */
  useEffect(() => { if (open) setDaLuu(null); }, [open]);

  /*
   * F07 — KỸ NĂNG THEO ĐÚNG CHƯƠNG TRÌNH EM ĐANG HỌC.
   *
   * Hồ sơ học viên, trang lớp hỏi máy chủ: lớp thường bốn ô L·R·W·S, Fast Track năm ô L·R·W1·W2·S
   * (Q8) — form không tự đoán chương trình.
   */
  /* Cần mã chương trình để gọi đúng tên môn và bộ nguyên nhân (FOU G+V / P, Pre FOU Tổng hợp — T57). */
  const chuDe = useApi<{ ratio: boolean; topics: string[]; chuongTrinh: string | null; ghiBuDuoc?: string[];
    choNguyenNhan?: Record<string, { caseId: number; mt: number | null; sos: number | null; dot?: string | null }>;
    /* CASE-NHIEU: Case mở cùng hạng mục + người phụ trách gợi ý, theo kỹ năng. */
    dangMo?: Record<string, DangMo>; phuTrach?: Record<string, { id: number; ten: string | null } | null> }>(
    open && studentId ? `/students/${studentId}/case-topics${cycleId ? `?cycleId=${cycleId}` : ''}` : null,
    [open, studentId, cycleId],
  );
  const topics: readonly string[] = chuDe.data?.topics ?? [];
  const topicsKey = topics.join('|');
  /* OV-11d (HV-19): "Đã xong từ trước" — kỹ năng không ghi bù được (C02: chỉ môn mình dạy) mờ, không bấm; máy chủ trả danh sách theo cùng quyền. */
  const khongGhiBu = (k: string) => mode === 'backfill' && !!chuDe.data?.ghiBuDuoc && !chuDe.data.ghiBuDuoc.includes(k);
  /* Ghi bù giữ MỘT kỹ năng (05 mục 7.1b): sang tab ghi bù thì giữ chip đầu ghi bù được. */
  useEffect(() => {
    if (mode === 'backfill' && (chon.length > 1 || chon.some(khongGhiBu))) setChon(chon.filter((k) => !khongGhiBu(k)).slice(0, 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, chon.join('|'), topicsKey]);
  /* Đổi học viên (trang lớp): bộ kỹ năng đổi theo — kỹ năng cũ không còn hợp lệ thì bỏ, không giữ lại một lựa chọn sai chương trình. */
  useEffect(() => {
    if (chon.some((k) => !topics.includes(k))) setChon(chon.filter((k) => topics.includes(k)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicsKey]);
  /* CV-LOI (X-74): mở từ "+ Case cho {kỹ năng}" → chọn sẵn kỹ năng đó khi danh sách tải xong (chỉ khi chưa chọn gì, kỹ năng có trong chương trình). */
  useEffect(() => {
    if (!open || !kyNangDau || chon.length) return;
    const k = topics.find((x) => x === kyNangDau || categoryOf(x) === kyNangDau);
    if (k && !khongGhiBu(k)) chonChip(k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, kyNangDau, topicsKey]);

  const ct = chuDe.data?.chuongTrinh ?? null;
  const topicLabel = (k: string) => tenMon(ct, k);
  /* Nút kỹ năng một hàng chia đều: viết tắt L R W W1 W2 S, FOU G+V/P, Pre FOU Tổng hợp (tooltip là tên đầy đủ). */
  const topicShort = (k: string) => tenMonNgan(ct, k);
  const nguoiNhan = (n: NguoiChon | null) => (!n || n.kieu === 'toi' ? t('tôi') : n.ten);

  /* Thẻ của kỹ năng `kn` ('' = chưa chọn kỹ năng). Một kỹ năng / ghi bù đọc thẳng thẻ đầu — các ô bên dưới viết như trước. */
  const cua = (kn: string): The => the[kn] ?? THE_TRONG;
  const sua = (kn: string, v: Partial<The>) => setThe((x) => ({ ...x, [kn]: { ...(x[kn] ?? THE_TRONG), ...v } }));
  const topic = chon[0] ?? '';
  const { primaryCode, ghiRo, title, summary } = cua(topic);
  /* Bấm chip: ghi bù chọn một; còn lại bật / tắt, giữ thứ tự chip. Chọn chip đầu tiên thì chữ đã gõ trước (thẻ '') sang kỹ năng đó. */
  const chonChip = (k: string) => {
    if (!chon.length && the[''] && !the[k]) setThe((x) => ({ ...x, [k]: { ...x[''], primaryCode: '' } }));
    if (mode === 'backfill') { setChon([k]); return; }
    setChon(topics.filter((x) => (x === k ? !chon.includes(k) : chon.includes(x))));
  };

  const reset = () => {
    setChon([]); setThe({}); setLoiThe({}); setUrgency('');
    setDetectedAt(''); lf.datLai(); setMoSua([0]);
    setMode('now'); setBfFrom(''); setBfTo('');
    setBfActions([{ description: '', nguoi: { kieu: 'toi' }, fromDate: '', toDate: '', ketQua: '' }]);
    setBfErrors({}); setBfOutcome(''); setBfNote(''); setBfMetrics({}); setBfDup(null);
    setDaLuu(null); setTep([]);
  };

  /*
   * BƯỚC "ĐÃ LƯU" DÙNG CHUNG cho ✕ / Esc / bấm nền của Modal VÀ nút Xong (Q7):
   *   · Đã lưu → panel đóng THẬT SỰ, và onDone chỉ chạy lúc này (nơi gọi đóng panel trong onDone).
   *   · Chưa lưu → đóng như trước, không có gì để báo lại.
   */
  const dong = () => {
    if (daLuu) {
      const id = daLuu.id;
      reset();
      onClose();
      onDone?.(id);
    } else {
      onClose();
    }
  };

  /*
   * TRÙNG / CHỜ XÁC NHẬN BIẾT NGAY KHI CHỌN CHIP (CASE-NHIEU, mục 7.13 · K3-23): `case-topics` trả Case mở cùng hạng mục (`dangMo`) và Case
   * chờ xác nhận (`choNguyenNhan`) theo kỹ năng — thẻ hỏi "Ghi vào / mở riêng" trước khi gửi, không còn vòng lỗi 400. Kỹ năng chờ xác nhận không vào lô.
   */
  const dm = (kn: string): DangMo | null => (mode === 'now' ? chuDe.data?.dangMo?.[kn] ?? null : null);
  const choXn = (kn: string) => (mode === 'now' ? chuDe.data?.choNguyenNhan?.[kn] ?? null : null);
  const ghiVao = (kn: string) => !!dm(kn) && cua(kn).gop === 'ghi-vao';
  const lo = chon.filter((kn) => !choXn(kn));
  const nhieu = mode === 'now' && chon.length > 1;

  /* Một lần gửi = một lô (máy chủ một giao dịch: lưu cả hoặc không gì); khoá chống gửi đôi của lần mở panel, máy chủ ghép thêm kỹ năng. */
  const send = async () => {
    setBusy(true); setLoiThe({});
    try {
      const res = await api.post<{ cases: { id: number; title: string; topic: string; gop: boolean; canEdit: boolean; viecTiep: DaLuu['viecTiep'] }[] }>('/cases/report', {
        studentId, cycleId: cycleId ?? undefined, urgency, detectedAt: detectedAt || undefined, idempotencyKey,
        kyNang: lo.map((kn) => {
          const v = cua(kn);
          return { topic: kn, primaryCode: v.primaryCode || undefined, observation: laKhac(v.primaryCode) ? v.ghiRo.trim() : undefined,
            title: ghiVao(kn) ? null : v.title.trim() || null, summary: v.summary, gop: dm(kn) ? v.gop : undefined };
        }),
      });
      const ds = res.cases;
      const moi = ds.filter((c) => !c.gop);
      const dau = moi[0] ?? ds[0];
      const ten = ds.map((c) => topicLabel(c.topic)).join(', ');
      await xongLuu({ id: dau.id, tieuDe: dau.title, gop: dau.gop, canEdit: dau.canEdit, viecTiep: dau.viecTiep ?? null,
        /* Người tạo Case đính kèm được vào Case mình vừa tạo (máy chủ `caseOwner`); gộp vào Case đang có thì theo quyền sửa Case đó. */
        ids: ds.filter((c) => c.canEdit).map((c) => c.id), boTep: ds.some((c) => !c.canEdit),
        chu: ds.length < 2 ? undefined : !moi.length ? t('Đã ghi thêm {g} Case · {ten}', { g: ds.length, ten })
          : moi.length < ds.length ? t('Đã tạo {n} Case · ghi thêm {g} · {ten}', { n: moi.length, g: ds.length - moi.length, ten })
          : t('Đã tạo {n} Case · {ten}', { n: moi.length, ten }) });
    } catch (e: any) {
      /* Lỗi giữ nguyên nội dung đang gõ để thử lại; lỗi của một kỹ năng hiện đầu đúng thẻ. Ai đó vừa mở Case cùng hạng mục / Case vừa chuyển
       * chờ xác nhận → tải lại `case-topics` để thẻ hỏi lại. */
      const kn = e?.details?.kyNang;
      if (kn) setLoiThe({ [kn]: e.message });
      if (e?.details?.duplicateCase || e?.details?.caseChoNguyenNhan) chuDe.reload();
      toast.push('error', e.message);
    } finally { setBusy(false); }
  };

  /**
   * Case đã lưu: tải tệp chờ vào Case (một request mỗi tệp; nhiều Case: tệp vào Case đầu rồi chép dòng cho Case kia). Hết lỗi → đóng panel + toast
   * `Đã lưu Case «…»` (nút `Thêm PA` khi đó là việc tiếp); còn tệp lỗi → ở lại bước "Đã lưu" đúng chỗ tệp lỗi + `Thử lại` (Case đã lưu, không gửi lại).
   */
  const xongLuu = async (d: DaLuu) => {
    invalidate('/cases'); invalidate('/students'); invalidate('/tong-quan');
    /* Rà #229: ghi vào Case đang có mà không có quyền sửa Case đó → không tải vào Case đó (máy chủ 403, panel kẹt) — nói rõ trong toast. */
    const boTep = !!d.boTep && tep.length > 0;
    const kq = tep.length && d.ids.length ? await taiTepCho(tep, { ownerType: 'sos_case', ownerIds: d.ids }) : tep;
    setTep(kq);
    if (d.ids.length && kq.some((m) => !m.xong)) { setDaLuu(d); return; }
    const themPa = d.canEdit && !d.gop && onMoCase && d.viecTiep?.chu === CHU_THEM_PA;
    const x = boTep ? t(' · bằng chứng không đính kèm (Case môn khác)') : '';
    toast.push('ok', d.chu ? d.chu + x : d.gop ? t('Đã ghi vào Case đang có «{tieuDe}»{x}', { tieuDe: d.tieuDe, x }) : t('Đã lưu Case «{tieuDe}»', { tieuDe: d.tieuDe }),
      themPa ? { hanhDong: { nhan: t('Thêm PA'), onBam: () => onMoCase!(d.id, 'them-pa') }, ms: 7000 } : undefined);
    reset(); onClose(); onDone?.(d.id);
  };
  const thuLaiTep = async () => {
    if (!daLuu) return;
    setBusy(true);
    try { setTep(await taiTepCho(tep, { ownerType: 'sos_case', ownerIds: daLuu.ids })); } finally { setBusy(false); }
  };

  /* Bấm nút chính: còn ô lỗi thì chỉ hiện lỗi dưới ô + "n ô cần sửa ↑" (không toast, không gửi). Đủ rồi mới gửi; máy chủ vẫn kiểm lại. */
  const submit = async () => {
    lf.bam();
    if (thieu.length > 0) return;
    await send();
  };

  const sendBackfill = async (extra: Record<string, unknown> = {}) => {
    setBusy(true);
    try {
      const category = categoryOf(topic);
      const res = await api.post<any>('/cases/backfill', {
        studentId, cycleId: cycleId ?? undefined,
        topic, primaryCode: primaryCode || undefined,
        observation: laKhac(primaryCode) ? ghiRo.trim() : undefined,
        title: title.trim() || null, summary,
        fromDate: bfFrom, toDate: bfTo,
        actions: bfActions.map((a) => ({
          description: a.description.trim(), ...nguoiThanhPayload(a.nguoi),
          fromDate: a.fromDate || bfFrom, toDate: a.toDate || bfTo, ketQua: a.ketQua,
        })),
        outcome: bfOutcome, note: bfNote,
        /* PR-Dọn Q3: cùng khoá chống gửi đôi của lần mở form — bấm Lưu hai lần chỉ ra một Case. */
        idempotencyKey,
        /* S5 — điểm giáo viên tự chấm theo kỹ năng, luôn TUỲ CHỌN. */
        metrics: componentsPayload(category, bfMetrics, componentsAreCounts(category)),
        ...extra,
      });
      setBfDup(null);
      await xongLuu({ id: res.id, tieuDe: res.title, gop: false, canEdit: true, ids: [res.id] });
    } catch (e: any) {
      const d = e?.details?.duplicateBackfill;
      if (d) { setBfDup(d); return; }
      toast.push('error', e.hint ? `${e.message} ${e.hint}` : e.message);   // OV-11d (HV-19): 403 nói lý do (`details.hint`)
    } finally { setBusy(false); }
  };

  const submitBackfill = async () => {
    lf.bam();
    if (thieu.length > 0) return;
    /*
     * F-3 (§22.4): mỗi thẻ kiểm RIÊNG, lỗi hiện NGAY DƯỚI thẻ đó. Thẻ chưa gõ gì (mô tả rỗng) thì bỏ qua. Khoảng tuần của thẻ
     * mặc định là khoảng chung (Q7); ô người thực hiện phải đủ.
     */
    const filled = bfActions.filter((a) => a.description.trim());
    const errors: Record<number, string> = {};
    bfActions.forEach((a, i) => {
      if (!a.description.trim()) return;
      if (a.description.trim().length < 3) { errors[i] = t('Phải nói rõ đã làm gì.'); return; }
      const thieuNguoi = nguoiThieu(a.nguoi, true);
      if (thieuNguoi) { errors[i] = thieuNguoi; return; }
      if (!a.ketQua) { errors[i] = t('Dòng PA {x}: chọn Kết quả PA.', { x: i + 1 }); return; }
      const tu = a.fromDate || bfFrom;
      const den = a.toDate || bfTo;
      if (tu > den) { errors[i] = t('Từ tuần phải trước Đến tuần.'); return; }
    });
    if (Object.keys(errors).length) { setBfErrors(errors); setMoSua([...new Set([...moSua, ...Object.keys(errors).map(Number)])]); return; }
    setBfErrors({});
    setBfActions(filled);
    setMoSua([]);
    await sendBackfill();
  };

  const category = categoryOf(topic);
  const bfComponents = componentsFor(category, chuDe.data?.ratio ? 'ratio' : 'band');
  const bfCounts = componentsAreCounts(category);

  /* Ô lỗi (YC-12.5.2): lý do dưới ô khi rời ô; chân chỉ đếm "n ô cần sửa ↑" sau khi bấm nút chính — không toast trước khi gửi. */
  /*
   * CASE-NHIEU: luật ô theo thẻ — một kỹ năng khoá như cũ ('phan-loai'…); nhiều kỹ năng khoá `${kỹ năng}:phan-loai`, nhãn chân thêm tên ngắn kỹ năng.
   * Kỹ năng chờ xác nhận không có ô; "Ghi vào Case đang có" không đặt tên mới. Chưa chọn kỹ năng: luật của thẻ '' (như trước).
   */
  const tienCua = (kn: string) => (nhieu ? `${kn}:` : '');
  const theKiem = lo.length ? lo : choXn(topic) ? [] : [topic];
  const luatDau = (kn: string): LuatTruong[] => {
    const tien = tienCua(kn);
    return [{ khoa: `${tien}phan-loai`, nhan: t('Nhóm nguyên nhân') + (nhieu ? ` · ${topicShort(kn)}` : ''), chon: true }];
  };
  const luatSau = (kn: string): LuatTruong[] => {
    const tien = tienCua(kn);
    const s = nhieu ? ` · ${topicShort(kn)}` : '';
    return [
      /* PR-NEN (T13): phân loại "Khác" → ô Ghi rõ ≥ 3 ký tự ngay dưới (OKhac); Mô tả chỉ còn luật 15 ký tự. */
      ...(laKhac(cua(kn).primaryCode) ? [{ khoa: `${tien}ghi-ro`, nhan: t('Ghi rõ') + s, toiThieu: KHAC_TOI_THIEU }] : []),
      ...(ghiVao(kn) ? [] : [{ khoa: `${tien}ten`, nhan: t('Tên Case') + s, toiThieu: 6 }]),
      { khoa: `${tien}mo-ta`, nhan: t('Mô tả') + s, toiThieu: 15 },
    ];
  };
  const LUAT: LuatTruong[] = [
    ...(students ? [{ khoa: 'hoc-vien', nhan: t('Học viên'), chon: true }] : []),
    { khoa: 'ky-nang', nhan: t('Kỹ năng'), chon: true },
    ...(nhieu ? [] : theKiem.flatMap(luatDau)),
    ...(mode === 'now' ? [{ khoa: 'muc-do', nhan: t('Mức độ'), chon: true }] : []),
    ...theKiem.flatMap((kn) => (nhieu ? [...luatDau(kn), ...luatSau(kn)] : luatSau(kn))),
    ...(mode === 'backfill' ? [{ khoa: 'tu-tuan', nhan: t('Từ tuần'), chon: true }, { khoa: 'den-tuan', nhan: t('Đến tuần'), chon: true },
      { khoa: 'ket-qua', nhan: t('Kết quả cuối'), chon: true }, { khoa: 'vi-sao', nhan: t('Vì sao kết luận vậy'), toiThieu: 10 }] : []),
  ];
  const giaTri: Record<string, unknown> = { 'hoc-vien': studentId, 'ky-nang': topic, 'muc-do': urgency,
    'tu-tuan': bfFrom, 'den-tuan': bfTo, 'ket-qua': bfOutcome, 'vi-sao': bfNote };
  for (const kn of theKiem) {
    const v = cua(kn);
    const tien = tienCua(kn);
    Object.assign(giaTri, { [`${tien}phan-loai`]: v.primaryCode, [`${tien}ghi-ro`]: v.ghiRo, [`${tien}ten`]: v.title, [`${tien}mo-ta`]: v.summary });
  }
  const loi = dsLoi(LUAT, giaTri);
  if (mode === 'backfill' && bfFrom && bfTo && bfFrom > bfTo) loi.push({ khoa: 'den-tuan', nhan: t('Đến tuần'), lyDo: t('Không được trước Từ tuần') });
  if (mode === 'backfill' && !bfActions.some((a) => a.description.trim())) loi.push({ khoa: 'pa-0', nhan: t('PA đã áp dụng'), lyDo: t('Chưa có PA nào') });
  /* Tệp chọn sai (loại / quá 4 MB) chặn Lưu — bỏ dòng đó hoặc chọn tệp khác. */
  const tepSai = tep.find((m) => m.loi && !m.daGui);
  if (tepSai) loi.push({ khoa: 'tep', nhan: t('Bằng chứng'), lyDo: tepSai.loi! });
  const thieu = loi.map((l) => l.nhan);
  const oLoi = lf.conThieu(loi);
  const loiCua = (khoa: string) => lf.loiCua(loi, khoa);
  const o = (khoa: string) => lf.o(loi, khoa);

  if (!open) return null;
  /* Một kỹ năng đang chờ xác nhận: cả form nhường chỗ cho lối sang Xác nhận Case (như trước). Mọi kỹ năng đã chọn đều chờ: không có gì để gửi. */
  const cnn = !nhieu && topic ? choXn(topic) : null;
  const khongGui = chon.length > 0 && !lo.length;
  const soGhi = lo.filter(ghiVao).length;
  const soMoi = lo.length - soGhi;
  const nhanNut = !nhieu ? (ghiVao(topic) ? t('Ghi vào Case đang có') : t('Tạo Case'))
    : !soMoi ? t('Ghi thêm {g}', { g: soGhi }) : soGhi ? t('Tạo {n} Case · ghi thêm {g}', { n: soMoi, g: soGhi }) : t('Tạo {n} Case', { n: soMoi });
  const tieuDeThe = (kn: string) => {
    const ten = chuDe.data?.phuTrach?.[kn]?.ten;
    return ten ? t('{mon} · phụ trách: {ten}', { mon: topicLabel(kn), ten }) : topicLabel(kn);
  };

  /* K3-23: kỹ năng đang có Case chờ xác nhận (Progress) — không tạo Case thứ hai; dẫn sang form Xác nhận Case. */
  const khoiChoXn = (kn: string) => {
    const c = choXn(kn)!;
    return (
      <div className="space-y-2">
        <p className="m-0 text-sm text-slate-200">
          {t('{topicLabel} đang có Case chờ xác nhận{x}.', { topicLabel: topicLabel(kn), x: c.mt || c.sos ? ` (${[c.mt ? (c.dot ?? `MT${c.mt}`) : null, c.sos ? `SOS ${c.sos}` : null].filter(Boolean).join(' · ')})` : '' })}
        </p>
        {onMoCase && (
          <button type="button" className="btn btn-primary btn-sm min-h-[44px] sm:min-h-0" onClick={() => { onClose(); onMoCase(c.caseId, 'xac-nhan'); }}>
            {t('Mở form Xác nhận Case')}
          </button>
        )}
      </div>
    );
  };
  /* CẢNH BÁO CASE TRÙNG (mục 7.13) — MỘT khối vàng ngay đầu thẻ, hỏi trước khi gửi; mặc định ghi vào Case đang có. */
  const khoiTrung = (kn: string) => {
    const d = dm(kn)!;
    const gop = cua(kn).gop;
    return (
      <div className="rounded-lg border p-3" style={{ borderColor: 'rgb(var(--soon-line-rgb))', background: 'rgb(var(--soon-bg-rgb))' }}>
        <p className="m-0 text-sm text-slate-100">
          {t('Đã có Case')} <strong className="inline-flex max-w-full align-bottom"><TenCase c={{ title: d.title, tenSos: tachTenSos(d.title) }} /></strong> {t('chưa xử lý xong ở {categoryLabel}.', { categoryLabel: topicLabel(kn) })}
          <span className="text-slate-400"> {t('Mở {tuanLich}{x}.', { tuanLich: tuanLich(d.detectedAt, homNay), x: d.soPa > 0 ? ` · ${d.soPa} PA` : t(' · chưa có PA') })}</span>
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2" role="group" aria-label={t('Case đang có')}>
          <NutChon chon={gop === 'ghi-vao'} className="justify-center" onClick={() => sua(kn, { gop: 'ghi-vao' })}>{t('Ghi vào Case đang có')}</NutChon>
          <NutChon chon={gop === 'rieng'} className="justify-center" onClick={() => sua(kn, { gop: 'rieng' })}>{t('Vấn đề khác, mở Case riêng')}</NutChon>
        </div>
      </div>
    );
  };
  /* Phân loại BẮT BUỘC (máy chủ cần `primaryCode`): select ≥ 5 lựa chọn, gợi ý của lựa chọn nằm ở `title` (Q6). */
  /* OKhac là <label> riêng → đặt ngay SAU Truong (không lồng label), cùng một khối để sát ô chọn. */
  const oNguyenNhan = (kn: string) => {
    const tien = tienCua(kn);
    const k = (s: string) => tien + s;
    const v = cua(kn);
    const causes = kn ? issuesForTopic(kn, ct) : [];
    return (
      <div>
        <Truong nhan={t('Nhóm nguyên nhân')} batBuoc loi={loiCua(k('phan-loai'))}>
          <select className="field w-full" {...o(k('phan-loai'))} value={v.primaryCode} disabled={!kn}
            title={causes.find((i) => i.code === v.primaryCode)?.hint}
            onChange={(e) => sua(kn, { primaryCode: e.target.value })}>
            <option value="">{kn ? t('Chọn nhóm') : t('Chọn kỹ năng trước')}</option>
            {causes.map((i) => <option key={i.code} value={i.code} title={i.hint}>{i.label}</option>)}
          </select>
        </Truong>
        <OKhac hien={laKhac(v.primaryCode)} value={v.ghiRo} onChange={(x) => sua(kn, { ghiRo: x })} goiY={t('Ví dụ: Chưa quen dạng bài mới')}
          id={lf.oId(k('ghi-ro'))} onBlur={lf.roi(k('ghi-ro'))} loi={lf.hien(k('ghi-ro')) ? kiemGhiRoKhac(v.ghiRo) : null} />
      </div>
    );
  };
  const oTenMoTa = (kn: string) => {
    const k = (s: string) => tienCua(kn) + s;
    const v = cua(kn);
    return (<>
      {/* TÊN CASE DO NGƯỜI TẠO ĐẶT (mục 7.3): Case tạo tay không có gì để suy, hệ thống không được tự gán "… dưới kỳ vọng". Ghi vào Case đang có: giữ tên Case đó. */}
      {!ghiVao(kn) && (
        <Truong nhan={t('Tên Case')} batBuoc loi={loiCua(k('ten'))}>
          <input className="field w-full" {...o(k('ten'))} value={v.title} onChange={(e) => sua(kn, { title: e.target.value })}
            placeholder={t('Ví dụ: Reading — sai dạng True/False/Not Given')} />
        </Truong>
      )}
      <Truong nhan={t('Mô tả và dẫn chứng')} batBuoc phu={t('Sai ở đâu, bài hay buổi nào')} loi={loiCua(k('mo-ta'))}
        dem={{ co: v.summary.trim().length, can: 15 }}>
        <textarea className="field w-full" {...o(k('mo-ta'))} rows={3} value={v.summary} onChange={(e) => sua(kn, { summary: e.target.value })}
          placeholder={t('Ví dụ: Progress Test sai 4/5 câu Not Given')} />
      </Truong>
    </>);
  };
  /* Nhập bù là chuyện ĐÃ XONG — không còn "mức độ" để xin. Nhiều kỹ năng: một mức cho cả lô (khác thì sửa từng Case sau). */
  const mucDo = mode === 'now' && (
    <Truong nhan={t('Mức độ')} batBuoc phu={t('Nhận định của người báo, không phải mức SOS')} as="div" loi={loiCua('muc-do')}>
      <div className="grid grid-cols-2 gap-2 outline-none" {...o('muc-do')} tabIndex={-1}>
        {URGENCY_LEVELS.map((u) => (
          <NutChon key={u} chon={urgency === u} className="justify-center" onClick={() => setUrgency(u)}>
            {URGENCY_LABEL[u]}
          </NutChon>
        ))}
      </div>
    </Truong>
  );

  const tieuDe = t('Tạo Case');
  const tenChon = (students ?? []).find((st) => st.id === studentId)?.name ?? studentName;
  const nhanTuan = (iso: string) => (iso ? tuanLich(iso, homNay) : '');
  /* Luật S3 (I1): đã gõ / chọn ô nào → nút trái "Huỷ thay đổi". Chọn học viên (trang lớp) không tính là sửa. */
  const daSua = !!(chon.length || Object.values(the).some((v) => v.title.trim() || v.summary.trim() || v.primaryCode || v.ghiRo.trim()) || detectedAt || urgency || tep.length
    || bfFrom || bfTo || bfOutcome || bfNote.trim() || bfActions.some((a) => a.description.trim()));

  /* ─────────────── bước "Đã lưu" (chỉ khi có tệp lỗi — PR-LUI-a2): tệp lỗi + `Thử lại`, tệp đã tải ở Bằng chứng; chân chỉ còn "Xong". */
  if (daLuu) {
    return (
      <KhungPanel tieuDe={tieuDe} hocVien={tenChon} lop={lop} onDong={dong} chan={{ huy: { nhan: t('Xong'), onClick: dong } }}>
        <Khoi tieuDe={t('Đã lưu')}>
          <p className="m-0 text-sm text-slate-200">
            {daLuu.gop ? <>{t('✓ Đã ghi vào Case đang có «{tieuDe}»', { tieuDe: daLuu.tieuDe })}</> : <>{t('✓ Đã lưu Case «{tieuDe}»', { tieuDe: daLuu.tieuDe })}</>}
          </p>
          {/* K3-24: nói luôn việc tiếp của Case vừa tạo + lối tắt Thêm PA. */}
          {daLuu.viecTiep && (
            <p className="m-0 flex flex-wrap items-center gap-2 text-xs text-slate-300">
              {t('Việc tiếp: {chu}{x}', { chu: daLuu.viecTiep.chu, x: daLuu.viecTiep.han ? t(' · hạn {ngan}', { ngan: ngan(daLuu.viecTiep.han) }) : '' })}
              {daLuu.canEdit && onMoCase && daLuu.viecTiep.chu === CHU_THEM_PA && (
                <button type="button" className="btn btn-sm" onClick={() => { const id = daLuu.id; reset(); onClose(); onMoCase(id, 'them-pa'); }}>{t('+ Thêm PA')}</button>
              )}
            </p>
          )}
        </Khoi>
        <Khoi tieuDe={t('Bằng chứng')}>
          {tep.some((m) => !m.xong) && <TepCho value={tep.filter((m) => !m.xong)} onChange={(v) => setTep([...tep.filter((m) => m.xong), ...v])} khoa={busy} onThuLai={() => void thuLaiTep()} />}
          {daLuu.canEdit ? (
            <BangChung ownerType="sos_case" ownerId={daLuu.id} canEdit={daLuu.canEdit} tieuDe="" />
          ) : (
            /* GVCN mở Case môn mình không dạy — không đính kèm được ở đây; nói rõ ai sẽ thêm, không vẽ khối trống. */
            <p className="m-0 text-xs text-slate-500">{t('Bạn không có quyền đính kèm cho Case môn này. GV dạy môn đó hoặc Quản lý sẽ thêm.')}</p>
          )}
        </Khoi>
      </KhungPanel>
    );
  }

  return (
    <KhungPanel tieuDe={tieuDe} hocVien={tenChon} lop={lop} onDong={dong}
      vungTab={{ id: 'qr-vung', nhan: mode === 'now' ? t('Đang gặp vấn đề') : t('Đã xong từ trước') }}
      tabs={(
        <HangTab cap="con" panelId="qr-vung" ariaLabel={t('Loại Case')} value={mode} onChange={(k) => { setMode(k); lf.datLai(); }}
          tabs={[{ key: 'now', label: t('Đang gặp vấn đề') }, { key: 'backfill', label: t('Đã xong từ trước') }]} />
      )}
      chan={{
        daSua,
        conThieu: lf.daBam && !cnn ? oLoi : undefined,
        chinh: khongGui ? undefined : (
          <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={mode === 'now' ? submit : submitBackfill}>
            {mode === 'now' ? nhanNut : t('Ghi lại Case đã xong')}
          </button>
        ),
      }}>
      <Khoi tieuDe={t('Vấn đề')}
        luat={mode === 'backfill'
          ? t('Nhập bù không có hạn và không tính vào tỷ lệ hiệu quả: đây là trí nhớ, không phải PA đang chạy. Không tạo bài đánh giá, không có mức SOS.')
          : t('Hệ thống chỉ đọc được con số. Phần này là quan sát của bạn: em sai ở đâu, bài hay buổi nào.')}>
        {/* CHỌN HỌC VIÊN — chỉ khi mở từ trang lớp (mục 13.1); ở hồ sơ một em thì không hỏi lại. */}
        {students && (
          <Truong nhan={t('Học viên')} batBuoc loi={loiCua('hoc-vien')}>
            {/* PR-O-CHON: gõ tên rồi chọn ở danh sách bên dưới, như mọi ô chọn người — chỉ học viên của lớp. */}
            <ChonNguoi id={o('hoc-vien').id} onBlur={o('hoc-vien').onBlur} invalid={!!loiCua('hoc-vien')} nhom="nhan_vien" choToi={false} choNgoai={false}
              ariaLabel={t('Học viên')} placeholder={t('Gõ tên học viên…')}
              ds={students.map((st) => ({ id: st.id, ten: st.name }))}
              value={studentId ? { kieu: 'tai_khoan', id: studentId, ten: tenChon ?? '…' } : null}
              onChange={(v) => onPickStudent?.(v?.kieu === 'tai_khoan' ? v.id : 0)} />
          </Truong>
        )}

        {/* Kỹ năng BẮT BUỘC: không có nó, vấn đề rơi vào "chưa phân loại" và biến mất khỏi bảng tổng hợp theo kỹ năng. */}
        <Truong nhan={t('Kỹ năng')} batBuoc as="div" loi={loiCua('ky-nang')}>
          <div {...o('ky-nang')} tabIndex={-1} className="outline-none">
          {!studentId ? (
            /* I2: chưa chọn học viên thì chưa biết chương trình (FT W1/W2, lớp thường W) — không vẽ hàng nút giả. */
            <p className="m-0 text-xs text-slate-400">{t('Chọn học viên trước')}</p>
          ) : chuDe.loading && !chuDe.data ? (
            <div className="h-[34px] motion-safe:animate-pulse rounded-md" style={{ background: 'var(--surface-2)' }} />
          ) : (
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.max(topics.length, 1)}, minmax(0, 1fr))` }}>
              {topics.map((k) => (
                <NutChon key={k} chon={chon.includes(k)} title={topicLabel(k)} disabled={khongGhiBu(k)}
                  className={`justify-center px-1 ${khongGhiBu(k) ? 'opacity-40' : ''}`}
                  onClick={() => chonChip(k)}>
                  {topicShort(k)}
                  {chuDe.data?.choNguyenNhan?.[k] && (
                    <span className="ml-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'rgb(var(--soon-rgb))' }}
                      title={t('Đang có Case chờ xác nhận')} aria-label={t('đang có Case chờ xác nhận')} />
                  )}
                </NutChon>
              ))}
            </div>
          )}
          {topics.some(khongGhiBu) && <p className="m-0 mt-1.5 text-xs text-slate-400">{t('Chỉ ghi bù Case môn bạn dạy')}</p>}
          </div>
        </Truong>

        {/* Nhiều kỹ năng: khối này chỉ còn phần chung (em, kỹ năng, mức độ); mỗi kỹ năng một khối riêng ngay dưới. Một kỹ năng: y như trước. */}
        {nhieu ? mucDo : cnn ? khoiChoXn(topic) : (<>
          {dm(topic) && khoiTrung(topic)}
          {oNguyenNhan(topic)}
          {mucDo}
          {oTenMoTa(topic)}
        </>)}
      </Khoi>

      {nhieu && chon.map((kn) => (
        <Khoi key={kn} tieuDe={tieuDeThe(kn)}>
          {loiThe[kn] && <p className="m-0 text-xs text-late" role="alert">{loiThe[kn]}</p>}
          {choXn(kn) ? khoiChoXn(kn) : (<>
            {dm(kn) && khoiTrung(kn)}
            {oNguyenNhan(kn)}
            {oTenMoTa(kn)}
          </>)}
        </Khoi>
      ))}

      {mode === 'now' && !khongGui && (
        <Khoi tieuDe={t('Theo dõi')}>
          <Truong nhan={t('Bắt đầu theo dõi')}>
            {/* I2: theo tuần (mã tuần), không theo ngày; trống = tuần này. Máy chủ nhận Thứ Hai của tuần chọn. */}
            <ChonTuan moc="dau" lui={26} toi={0} value={detectedAt} onChange={setDetectedAt} chuaChon={t('Tuần này')} ariaLabel={t('Bắt đầu theo dõi')} />
          </Truong>
        </Khoi>
      )}

      {/* TAB "ĐÃ XONG TỪ TRƯỚC" (mục 10.3) — chỗ DUY NHẤT được nhập thời gian quá khứ; tuần thay ngày (Q7). */}
      {mode === 'backfill' && (
        <>
          <Khoi tieuDe={t('Đã áp dụng')}>
            <Hang2>
              <Truong nhan={t('Từ tuần')} batBuoc loi={loiCua('tu-tuan')}>
                <ChonTuan moc="dau" lui={26} toi={0} value={bfFrom} onChange={setBfFrom} chuaChon={t('Chọn tuần')} ariaLabel={t('Từ tuần')}
                  id={lf.oId('tu-tuan')} onBlur={lf.roi('tu-tuan')} invalid={!!loiCua('tu-tuan')} />
              </Truong>
              <Truong nhan={t('Đến tuần')} batBuoc loi={loiCua('den-tuan')}>
                <ChonTuan moc="cuoi" lui={26} toi={0} value={bfTo} onChange={setBfTo} chuaChon={t('Chọn tuần')} ariaLabel={t('Đến tuần')}
                  id={lf.oId('den-tuan')} onBlur={lf.roi('den-tuan')} invalid={!!loiCua('den-tuan')} />
              </Truong>
            </Hang2>
            <div className="space-y-2">
              {bfActions.map((a, i) => {
                const dangSua = moSua.includes(i);
                const tu = a.fromDate || bfFrom;
                const den = a.toDate || bfTo;
                const doiKhoang = (part: 'fromDate' | 'toDate') => (v: string) =>
                  setBfActions(bfActions.map((x, j) => (j === i ? { ...x, [part]: v } : x)));
                return (
                  <div key={i} className="rounded-lg border px-2.5 py-2" style={{ borderColor: 'var(--line)' }}>
                    {dangSua ? (
                      <div className="space-y-2">
                        <input className="field w-full" {...(i === 0 ? o('pa-0') : {})} aria-label={t('PA đã áp dụng')}
                          placeholder={GOI_Y_MO_TA_PA} value={a.description}
                          onChange={(e) => setBfActions(bfActions.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} />
                        {/* YC-12.5.3: kết quả của PA này — hàng PA hiện kết quả thay "Chưa có kết quả". */}
                        <div role="group" aria-label={t('Kết quả PA {x} (bắt buộc)', { x: i + 1 })}>
                          <span className="mb-1 block text-xs text-slate-400">{t('Kết quả PA')} <span aria-hidden className="text-bad">*</span></span>
                          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                            {FOLLOWUP_OUTCOMES.filter((k) => k !== 'insufficient').map((k) => (
                              <NutChon key={k} nho chon={a.ketQua === k} className="justify-center"
                                onClick={() => setBfActions(bfActions.map((x, j) => (j === i ? { ...x, ketQua: k } : x)))}>
                                {outcomeLabelFor(k)}
                              </NutChon>
                            ))}
                          </div>
                        </div>
                        <ChonNguoi nhom="giao_vien" studentId={studentId} value={a.nguoi}
                          onChange={(v) => setBfActions(bfActions.map((x, j) => (j === i ? { ...x, nguoi: v ?? { kieu: 'toi' } } : x)))} />
                        <Hang2>
                          <ChonTuan moc="dau" lui={26} toi={0} value={a.fromDate} onChange={doiKhoang('fromDate')} chuaChon={t('Từ tuần: như trên')} ariaLabel={t('Từ tuần')} />
                          <ChonTuan moc="cuoi" lui={26} toi={0} value={a.toDate} onChange={doiKhoang('toDate')} chuaChon={t('Đến tuần: như trên')} ariaLabel={t('Đến tuần')} />
                        </Hang2>
                        <span className="flex gap-2">
                          {a.description.trim() && (
                            <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setMoSua(moSua.filter((x) => x !== i))}>{t('Xong')}</button>
                          )}
                          {bfActions.length > 1 && (
                            <button type="button" className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0" onClick={() => {
                              setBfActions(bfActions.filter((_, j) => j !== i));
                              setMoSua(moSua.filter((x) => x !== i).map((x) => (x > i ? x - 1 : x)));
                              setBfErrors({});
                            }}>{t('Xoá')}</button>
                          )}
                        </span>
                      </div>
                    ) : (
                      <p className="m-0 flex flex-wrap items-baseline gap-x-1.5 text-xs text-slate-300">
                        <span className="min-w-0 truncate text-slate-100" title={a.description}>{a.description}</span>
                        <span className="text-slate-500">· {nguoiNhan(a.nguoi)}</span>
                        {a.ketQua && <span className="text-slate-500">· {outcomeLabelFor(a.ketQua)}</span>}
                        {tu && den && <span className="text-slate-500">· {nhanTuan(tu)} → {nhanTuan(den)}</span>}
                        <button type="button" className="link appearance-none border-0 bg-transparent p-0" onClick={() => setMoSua([...moSua, i])}>{t('Sửa')}</button>
                      </p>
                    )}
                    {(bfErrors[i] || (i === 0 && loiCua('pa-0'))) && <p className="m-0 mt-1 text-xs text-late">{bfErrors[i] || loiCua('pa-0')}</p>}
                  </div>
                );
              })}
              <button type="button" className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0"
                onClick={() => { setMoSua([...moSua, bfActions.length]); setBfActions([...bfActions, { description: '', nguoi: { kieu: 'toi' }, fromDate: '', toDate: '', ketQua: '' }]); }}>
                {t('+ Thêm PA đã áp dụng')}
              </button>
            </div>
          </Khoi>

          <Khoi tieuDe={t('Kết quả')}>
            <Truong nhan={t('Kết quả cuối')} batBuoc as="div" loi={loiCua('ket-qua')}>
              <div {...o('ket-qua')} tabIndex={-1} className="grid grid-cols-2 gap-2 outline-none sm:grid-cols-4">
                {CASE_OUTCOMES.map((o) => (
                  <NutChon key={o} chon={bfOutcome === o} className="justify-center" onClick={() => setBfOutcome(o)}>
                    {CASE_OUTCOME_LABEL[o]}
                  </NutChon>
                ))}
              </div>
            </Truong>
            {/* S5 — điểm giáo viên tự chấm theo đúng kỹ năng của Case, luôn TUỲ CHỌN. */}
            {bfComponents.length > 0 && (
              <ComponentsField label={topicLabel(topic)} components={bfComponents} counts={bfCounts}
                value={bfMetrics} onChange={setBfMetrics} buttonLabel={t('+ Điểm chi tiết theo kỹ năng')} />
            )}
            <Truong nhan={t('Vì sao kết luận vậy')} batBuoc loi={loiCua('vi-sao')}>
              <textarea className="field w-full" {...o('vi-sao')} rows={2} value={bfNote} onChange={(e) => setBfNote(e.target.value)}
                placeholder={t('Ví dụ: MT3 Listening lên 6.0')} />
            </Truong>
          </Khoi>
        </>
      )}

      {/* PR-LUI-a2: bằng chứng ngay trong form (không bắt buộc) — tải lên khi bấm Lưu, sau khi Case có id. */}
      {!khongGui && (
        <Khoi tieuDe={t('Bằng chứng · không bắt buộc')}>
          <div id={lf.oId('tep')} tabIndex={-1}><TepCho value={tep} onChange={setTep} khoa={busy} /></div>
        </Khoi>
      )}

      {/* CẢNH BÁO CASE TRÙNG (mục 7.13) — MỘT khối vàng, hai nút, ngay trong thân; chữ vừa gõ vẫn còn. */}
      {mode === 'backfill' && bfDup && (
        <div className="mt-3.5 rounded-lg border p-3" style={{ borderColor: 'rgb(var(--soon-line-rgb))', background: 'rgb(var(--soon-bg-rgb))' }}>
          <p className="m-0 text-sm text-slate-100">
            {t('Đã có Case nhập bù')} <strong>“{bfDup.title}”</strong> {t('trùng khoảng {tuanLich} → {tuanLich2}. Cùng một lần?', { tuanLich: tuanLich(bfDup.from, homNay), tuanLich2: tuanLich(bfDup.to, homNay) })}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => sendBackfill({ confirmDuplicate: true })}>{t('Lần khác, vẫn ghi riêng')}</button>
          </div>
        </div>
      )}
    </KhungPanel>
  );
}

/** OV-11d (HV-22): tên Case hệ thống dạng chữ `[MT2] Listening mất điểm [SOS 1]` (máy chủ `tenCaseSos`) → chip như bảng kỹ năng; tên thường → null. */
function tachTenSos(ten: string | null | undefined): { mt: number | null; giua: string; sos: number | null; kck: boolean } | null {
  const m = /^(?:\[MT(\d+)\]\s*)?(.*?)\s*\[(?:SOS (\d)|(KCK))\]$/.exec(String(ten ?? '').trim());
  return m ? { mt: m[1] ? Number(m[1]) : null, giua: m[2], sos: m[3] ? Number(m[3]) : null, kck: !!m[4] } : null;
}
