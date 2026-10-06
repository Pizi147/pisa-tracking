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
import {
  URGENCY_LEVELS, URGENCY_LABEL, issuesForTopic, FOLLOWUP_OUTCOMES, GOI_Y_MO_TA_PA, outcomeLabelFor,
  CASE_OUTCOMES, CASE_OUTCOME_LABEL, CHU_THEM_PA, tenMon, tenMonNgan,
  categoryOf, componentsFor, componentsAreCounts,
  nguoiThanhPayload, nguoiThieu, tuanLich, type NguoiChon, dsLoi, type LuatTruong, laKhac, kiemGhiRoKhac, KHAC_TOI_THIEU,
} from '@shared/domain/index.ts';

type DaLuu = { id: number; tieuDe: string; gop: boolean; canEdit: boolean; viecTiep?: { chu: string; han: string | null } | null };
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
  open, onClose, studentId, studentName, lop, cycleId, onDone, students, onPickStudent, onMoCase,
}: {
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
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  /* I2 (PR-SL): không chọn sẵn mức độ — người báo tự chọn (ô bắt buộc). */
  const [urgency, setUrgency] = useState('');
  const [topic, setTopic] = useState('');
  const [primaryCode, setPrimaryCode] = useState('');
  /* Phân loại "Khác" (T13): ô Ghi rõ ngay dưới, lưu ở `case_issues.observation` (Q9). Đổi phân loại vẫn giữ chữ đã gõ. */
  const [ghiRo, setGhiRo] = useState('');
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
  const chuDe = useApi<{ ratio: boolean; topics: string[]; chuongTrinh: string | null;
    choNguyenNhan?: Record<string, { caseId: number; mt: number | null; sos: number | null; dot?: string | null }> }>(
    open && studentId ? `/students/${studentId}/case-topics${cycleId ? `?cycleId=${cycleId}` : ''}` : null,
    [open, studentId, cycleId],
  );
  const topics: readonly string[] = chuDe.data?.topics ?? [];
  const topicsKey = topics.join('|');
  /* Đổi học viên (trang lớp): bộ kỹ năng đổi theo — kỹ năng/phân loại cũ không còn hợp lệ thì bỏ, không giữ lại một lựa chọn sai chương trình. */
  useEffect(() => {
    if (topic && !topics.includes(topic)) { setTopic(''); setPrimaryCode(''); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicsKey]);

  const ct = chuDe.data?.chuongTrinh ?? null;
  const topicLabel = (k: string) => tenMon(ct, k);
  const causes = topic ? issuesForTopic(topic, ct) : [];
  /* Nút kỹ năng một hàng chia đều: viết tắt L R W W1 W2 S, FOU G+V/P, Pre FOU Tổng hợp (tooltip là tên đầy đủ). */
  const topicShort = (k: string) => tenMonNgan(ct, k);
  const nguoiNhan = (n: NguoiChon | null) => (!n || n.kieu === 'toi' ? 'tôi' : n.ten);

  const reset = () => {
    setSummary(''); setUrgency(''); setTopic('');
    setTitle(''); setPrimaryCode(''); setDetectedAt(''); setDup(null); lf.datLai(); setMoSua([0]);
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
   * CẢNH BÁO CASE TRÙNG — mục 7.13.
   *
   * Máy chủ từ chối lần gửi đầu và trả về CHÍNH Case đang vướng, nên pop-up dựng được ngay
   * mà không phải hỏi lại thêm một vòng mạng. Hai lựa chọn chỉ khác nhau đúng một cờ, và
   * nội dung người dùng vừa gõ được giữ nguyên ở cả hai đường — không bắt gõ lại.
   */
  const [dup, setDup] = useState<any | null>(null);

  const send = async (extra: Record<string, unknown> = {}) => {
    setBusy(true);
    try {
      const res = await api.post<any>('/cases/report', {
        studentId, cycleId: cycleId ?? undefined, title: title.trim() || null, summary, urgency,
        topic,
        primaryCode: primaryCode || undefined,
        observation: laKhac(primaryCode) ? ghiRo.trim() : undefined,
        detectedAt: detectedAt || undefined,
        idempotencyKey,
        ...extra,
      });
      setDup(null);
      await xongLuu({ id: res.id, tieuDe: res.title, gop: !!extra.mergeIntoExisting,
        /* Người tạo Case đính kèm được vào Case mình vừa tạo (máy chủ `caseOwner`); gộp vào Case đang có thì theo quyền sửa Case đó. */
        canEdit: !!res.viewer?.canEdit || !extra.mergeIntoExisting, viecTiep: res.viecTiep ?? null });
    } catch (e: any) {
      const d = e?.details?.duplicateCase;
      if (d) { setDup(d); return; }
      // Lỗi giữ nguyên nội dung đang gõ để người dùng thử lại, không bắt gõ lại từ đầu.
      toast.push('error', e.message);
    } finally { setBusy(false); }
  };

  /**
   * Case đã lưu: tải tệp chờ vào Case (một request mỗi tệp). Hết lỗi → đóng panel + toast `Đã lưu Case «…»` (nút `Thêm PA` khi đó là việc tiếp);
   * còn tệp lỗi → ở lại bước "Đã lưu" đúng chỗ tệp lỗi + `Thử lại` (Case đã lưu, không gửi lại).
   */
  const xongLuu = async (d: DaLuu) => {
    invalidate('/cases'); invalidate('/students'); invalidate('/tong-quan');
    const kq = tep.length ? await taiTepCho(tep, { ownerType: 'sos_case', ownerIds: [d.id] }) : tep;
    setTep(kq);
    if (kq.some((m) => !m.xong)) { setDaLuu(d); return; }
    const themPa = d.canEdit && !d.gop && onMoCase && d.viecTiep?.chu === CHU_THEM_PA;
    toast.push('ok', d.gop ? `Đã ghi vào Case đang có «${d.tieuDe}»` : `Đã lưu Case «${d.tieuDe}»`,
      themPa ? { hanhDong: { nhan: 'Thêm PA', onBam: () => onMoCase!(d.id, 'them-pa') }, ms: 7000 } : undefined);
    reset(); onClose(); onDone?.(d.id);
  };
  const thuLaiTep = async () => {
    if (!daLuu) return;
    setBusy(true);
    try { setTep(await taiTepCho(tep, { ownerType: 'sos_case', ownerIds: [daLuu.id] })); } finally { setBusy(false); }
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
      await xongLuu({ id: res.id, tieuDe: res.title, gop: false, canEdit: true });
    } catch (e: any) {
      const d = e?.details?.duplicateBackfill;
      if (d) { setBfDup(d); return; }
      toast.push('error', e.message);
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
      if (a.description.trim().length < 3) { errors[i] = 'Phải nói rõ đã làm gì.'; return; }
      const thieuNguoi = nguoiThieu(a.nguoi, true);
      if (thieuNguoi) { errors[i] = thieuNguoi; return; }
      if (!a.ketQua) { errors[i] = `Dòng PA ${i + 1}: chọn Kết quả PA.`; return; }
      const tu = a.fromDate || bfFrom;
      const den = a.toDate || bfTo;
      if (tu > den) { errors[i] = 'Từ tuần phải trước Đến tuần.'; return; }
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
  const LUAT: LuatTruong[] = [
    ...(students ? [{ khoa: 'hoc-vien', nhan: 'Học viên', chon: true }] : []),
    { khoa: 'ky-nang', nhan: 'Kỹ năng', chon: true }, { khoa: 'phan-loai', nhan: 'Nhóm nguyên nhân', chon: true },
    ...(mode === 'now' ? [{ khoa: 'muc-do', nhan: 'Mức độ', chon: true }] : []),
    /* PR-NEN (T13): phân loại "Khác" → ô Ghi rõ ≥ 3 ký tự ngay dưới (OKhac); Mô tả chỉ còn luật 15 ký tự. */
    ...(laKhac(primaryCode) ? [{ khoa: 'ghi-ro', nhan: 'Ghi rõ', toiThieu: KHAC_TOI_THIEU }] : []),
    { khoa: 'ten', nhan: 'Tên Case', toiThieu: 6 },
    { khoa: 'mo-ta', nhan: 'Mô tả', toiThieu: 15 },
    ...(mode === 'backfill' ? [{ khoa: 'tu-tuan', nhan: 'Từ tuần', chon: true }, { khoa: 'den-tuan', nhan: 'Đến tuần', chon: true },
      { khoa: 'ket-qua', nhan: 'Kết quả cuối', chon: true }, { khoa: 'vi-sao', nhan: 'Vì sao kết luận vậy', toiThieu: 10 }] : []),
  ];
  const loi = dsLoi(LUAT, { 'hoc-vien': studentId, 'ky-nang': topic, 'phan-loai': primaryCode, 'ghi-ro': ghiRo, 'muc-do': urgency, ten: title, 'mo-ta': summary,
    'tu-tuan': bfFrom, 'den-tuan': bfTo, 'ket-qua': bfOutcome, 'vi-sao': bfNote });
  if (mode === 'backfill' && bfFrom && bfTo && bfFrom > bfTo) loi.push({ khoa: 'den-tuan', nhan: 'Đến tuần', lyDo: 'Không được trước Từ tuần' });
  if (mode === 'backfill' && !bfActions.some((a) => a.description.trim())) loi.push({ khoa: 'pa-0', nhan: 'PA đã áp dụng', lyDo: 'Chưa có PA nào' });
  /* Tệp chọn sai (loại / quá 4 MB) chặn Lưu — bỏ dòng đó hoặc chọn tệp khác. */
  const tepSai = tep.find((m) => m.loi && !m.daGui);
  if (tepSai) loi.push({ khoa: 'tep', nhan: 'Bằng chứng', lyDo: tepSai.loi! });
  const thieu = loi.map((l) => l.nhan);
  const oLoi = lf.conThieu(loi);
  const loiCua = (khoa: string) => lf.loiCua(loi, khoa);
  const o = (khoa: string) => lf.o(loi, khoa);

  if (!open) return null;
  const cnn = mode === 'now' && topic ? chuDe.data?.choNguyenNhan?.[topic] ?? null : null;

  const tieuDe = 'Tạo Case';
  const tenChon = (students ?? []).find((st) => st.id === studentId)?.name ?? studentName;
  const nhanTuan = (iso: string) => (iso ? tuanLich(iso, homNay) : '');
  /* Luật S3 (I1): đã gõ / chọn ô nào → nút trái "Huỷ thay đổi". Chọn học viên (trang lớp) không tính là sửa. */
  const daSua = !!(title.trim() || summary.trim() || topic || primaryCode || ghiRo.trim() || detectedAt || urgency || tep.length
    || bfFrom || bfTo || bfOutcome || bfNote.trim() || bfActions.some((a) => a.description.trim()));

  /* ─────────────── bước "Đã lưu" (chỉ khi có tệp lỗi — PR-LUI-a2): tệp lỗi + `Thử lại`, tệp đã tải ở Bằng chứng; chân chỉ còn "Xong". */
  if (daLuu) {
    return (
      <KhungPanel tieuDe={tieuDe} hocVien={tenChon} lop={lop} onDong={dong} chan={{ huy: { nhan: 'Xong', onClick: dong } }}>
        <Khoi tieuDe="Đã lưu">
          <p className="m-0 text-sm text-slate-200">
            {daLuu.gop ? <>✓ Đã ghi vào Case đang có «{daLuu.tieuDe}»</> : <>✓ Đã lưu Case «{daLuu.tieuDe}»</>}
          </p>
          {/* K3-24: nói luôn việc tiếp của Case vừa tạo + lối tắt Thêm PA. */}
          {daLuu.viecTiep && (
            <p className="m-0 flex flex-wrap items-center gap-2 text-xs text-slate-300">
              Việc tiếp: {daLuu.viecTiep.chu}{daLuu.viecTiep.han ? ` · hạn ${ngan(daLuu.viecTiep.han)}` : ''}
              {daLuu.canEdit && onMoCase && daLuu.viecTiep.chu === CHU_THEM_PA && (
                <button type="button" className="btn btn-sm" onClick={() => { const id = daLuu.id; reset(); onClose(); onMoCase(id, 'them-pa'); }}>+ Thêm PA</button>
              )}
            </p>
          )}
        </Khoi>
        <Khoi tieuDe="Bằng chứng">
          {tep.some((m) => !m.xong) && <TepCho value={tep.filter((m) => !m.xong)} onChange={(v) => setTep([...tep.filter((m) => m.xong), ...v])} khoa={busy} onThuLai={() => void thuLaiTep()} />}
          {daLuu.canEdit ? (
            <BangChung ownerType="sos_case" ownerId={daLuu.id} canEdit={daLuu.canEdit} tieuDe="" />
          ) : (
            /* GVCN mở Case môn mình không dạy — không đính kèm được ở đây; nói rõ ai sẽ thêm, không vẽ khối trống. */
            <p className="m-0 text-xs text-slate-500">Bạn không có quyền đính kèm cho Case môn này. GV dạy môn đó hoặc Quản lý sẽ thêm.</p>
          )}
        </Khoi>
      </KhungPanel>
    );
  }

  return (
    <KhungPanel tieuDe={tieuDe} hocVien={tenChon} lop={lop} onDong={dong}
      tabs={(
        <HangTab cap="con" ariaLabel="Loại Case" value={mode} onChange={(k) => { setMode(k); lf.datLai(); }}
          tabs={[{ key: 'now', label: 'Đang gặp vấn đề' }, { key: 'backfill', label: 'Đã xong từ trước' }]} />
      )}
      chan={{
        daSua,
        conThieu: lf.daBam && !cnn ? oLoi : undefined,
        chinh: cnn ? undefined : (
          <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={mode === 'now' ? submit : submitBackfill}>
            {mode === 'now' ? 'Tạo Case' : 'Ghi lại Case đã xong'}
          </button>
        ),
      }}>
      <Khoi tieuDe="Vấn đề"
        luat={mode === 'backfill'
          ? 'Nhập bù không có hạn và không tính vào tỷ lệ hiệu quả: đây là trí nhớ, không phải PA đang chạy. Không tạo bài đánh giá, không có mức SOS.'
          : 'Hệ thống chỉ đọc được con số. Phần này là quan sát của bạn: em sai ở đâu, bài hay buổi nào.'}>
        {/* CHỌN HỌC VIÊN — chỉ khi mở từ trang lớp (mục 13.1); ở hồ sơ một em thì không hỏi lại. */}
        {students && (
          <Truong nhan="Học viên" batBuoc loi={loiCua('hoc-vien')}>
            <select className="field w-full" {...o('hoc-vien')} value={studentId || ''} onChange={(e) => onPickStudent?.(Number(e.target.value) || 0)}>
              <option value="">Chọn học viên</option>
              {students.map((st) => <option key={st.id} value={st.id}>{st.name}{st.code ? ` · ${st.code}` : ''}</option>)}
            </select>
          </Truong>
        )}

        {/* Kỹ năng BẮT BUỘC: không có nó, vấn đề rơi vào "chưa phân loại" và biến mất khỏi bảng tổng hợp theo kỹ năng. */}
        <Truong nhan="Kỹ năng" batBuoc as="div" loi={loiCua('ky-nang')}>
          <div {...o('ky-nang')} tabIndex={-1} className="outline-none">
          {!studentId ? (
            /* I2: chưa chọn học viên thì chưa biết chương trình (FT W1/W2, lớp thường W) — không vẽ hàng nút giả. */
            <p className="m-0 text-xs text-slate-400">Chọn học viên trước</p>
          ) : chuDe.loading && !chuDe.data ? (
            <div className="h-[34px] animate-pulse rounded-md" style={{ background: 'var(--surface-2)' }} />
          ) : (
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.max(topics.length, 1)}, minmax(0, 1fr))` }}>
              {topics.map((k) => (
                <NutChon key={k} chon={topic === k} title={topicLabel(k)}
                  className="justify-center px-1"
                  onClick={() => { setTopic(k); setPrimaryCode(''); }}>
                  {topicShort(k)}
                  {chuDe.data?.choNguyenNhan?.[k] && (
                    <span className="ml-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'rgb(var(--soon-rgb))' }}
                      title="Đang có Case chờ xác nhận nguyên nhân" aria-label="đang có Case chờ xác nhận nguyên nhân" />
                  )}
                </NutChon>
              ))}
            </div>
          )}
          </div>
        </Truong>

        {/* K3-23: kỹ năng đang có Case chờ xác nhận nguyên nhân — không tạo Case thứ hai; dẫn sang form Xác nhận Case. */}
        {cnn ? (
          <div className="space-y-2">
            <p className="m-0 text-sm text-slate-200">
              {topicLabel(topic)} đang có Case chờ xác nhận nguyên nhân
              {cnn.mt || cnn.sos ? ` (${[cnn.mt ? (cnn.dot ?? `MT${cnn.mt}`) : null, cnn.sos ? `SOS ${cnn.sos}` : null].filter(Boolean).join(' · ')})` : ''}.
            </p>
            {onMoCase && (
              <button type="button" className="btn btn-primary btn-sm min-h-[44px] sm:min-h-0" onClick={() => { onClose(); onMoCase(cnn.caseId, 'xac-nhan'); }}>
                Mở form Xác nhận Case
              </button>
            )}
          </div>
        ) : (<>
        {/* Phân loại BẮT BUỘC (máy chủ cần `primaryCode`): select ≥ 5 lựa chọn, gợi ý của lựa chọn nằm ở `title` (Q6). */}
        {/* OKhac là <label> riêng → đặt ngay SAU Truong (không lồng label), cùng một khối để sát ô chọn. */}
        <div>
          <Truong nhan="Nhóm nguyên nhân" batBuoc loi={loiCua('phan-loai')}>
            <select className="field w-full" {...o('phan-loai')} value={primaryCode} disabled={!topic}
              title={causes.find((i) => i.code === primaryCode)?.hint}
              onChange={(e) => setPrimaryCode(e.target.value)}>
              <option value="">{topic ? 'Chọn nhóm' : 'Chọn kỹ năng trước'}</option>
              {causes.map((i) => <option key={i.code} value={i.code} title={i.hint}>{i.label}</option>)}
            </select>
          </Truong>
          <OKhac hien={laKhac(primaryCode)} value={ghiRo} onChange={setGhiRo} goiY="Ví dụ: Chưa quen dạng bài mới"
            id={lf.oId('ghi-ro')} onBlur={lf.roi('ghi-ro')} loi={lf.hien('ghi-ro') ? kiemGhiRoKhac(ghiRo) : null} />
        </div>

        {/* Nhập bù là chuyện ĐÃ XONG — không còn "mức độ" để xin. */}
        {mode === 'now' && (
          <Truong nhan="Mức độ" batBuoc phu="Nhận định của người báo, không phải mức SOS" as="div" loi={loiCua('muc-do')}>
            <div className="grid grid-cols-2 gap-2 outline-none" {...o('muc-do')} tabIndex={-1}>
              {URGENCY_LEVELS.map((u) => (
                <NutChon key={u} chon={urgency === u} className="justify-center" onClick={() => setUrgency(u)}>
                  {URGENCY_LABEL[u]}
                </NutChon>
              ))}
            </div>
          </Truong>
        )}

        {/* TÊN CASE DO NGƯỜI TẠO ĐẶT (mục 7.3): Case tạo tay không có gì để suy, hệ thống không được tự gán "… dưới kỳ vọng". */}
        <Truong nhan="Tên Case" batBuoc loi={loiCua('ten')}>
          <input className="field w-full" {...o('ten')} value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Ví dụ: Reading — sai dạng True/False/Not Given" />
        </Truong>
        <Truong nhan="Mô tả và dẫn chứng" batBuoc phu="Sai ở đâu, bài hay buổi nào" loi={loiCua('mo-ta')}
          dem={{ co: summary.trim().length, can: 15 }}>
          <textarea className="field w-full" {...o('mo-ta')} rows={3} value={summary} onChange={(e) => setSummary(e.target.value)}
            placeholder="Ví dụ: Giữa khoá sai 4/5 câu Not Given" />
        </Truong>
        </>)}
      </Khoi>

      {mode === 'now' && !cnn && (
        <Khoi tieuDe="Theo dõi">
          <Truong nhan="Bắt đầu theo dõi">
            {/* I2: theo tuần (mã tuần), không theo ngày; trống = tuần này. Máy chủ nhận Thứ Hai của tuần chọn. */}
            <ChonTuan moc="dau" lui={26} toi={0} value={detectedAt} onChange={setDetectedAt} chuaChon="Tuần này" ariaLabel="Bắt đầu theo dõi" />
          </Truong>
        </Khoi>
      )}

      {/* TAB "ĐÃ XONG TỪ TRƯỚC" (mục 10.3) — chỗ DUY NHẤT được nhập thời gian quá khứ; tuần thay ngày (Q7). */}
      {mode === 'backfill' && (
        <>
          <Khoi tieuDe="Đã áp dụng">
            <Hang2>
              <Truong nhan="Từ tuần" batBuoc loi={loiCua('tu-tuan')}>
                <ChonTuan moc="dau" lui={26} toi={0} value={bfFrom} onChange={setBfFrom} chuaChon="Chọn tuần" ariaLabel="Từ tuần"
                  id={lf.oId('tu-tuan')} onBlur={lf.roi('tu-tuan')} invalid={!!loiCua('tu-tuan')} />
              </Truong>
              <Truong nhan="Đến tuần" batBuoc loi={loiCua('den-tuan')}>
                <ChonTuan moc="cuoi" lui={26} toi={0} value={bfTo} onChange={setBfTo} chuaChon="Chọn tuần" ariaLabel="Đến tuần"
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
                        <input className="field w-full" {...(i === 0 ? o('pa-0') : {})} aria-label="PA đã áp dụng"
                          placeholder={GOI_Y_MO_TA_PA} value={a.description}
                          onChange={(e) => setBfActions(bfActions.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} />
                        {/* YC-12.5.3: kết quả của PA này — hàng PA hiện kết quả thay "Chưa có kết quả". */}
                        <div role="group" aria-label={`Kết quả PA ${i + 1} (bắt buộc)`}>
                          <span className="mb-1 block text-[11px] text-slate-400">Kết quả PA <span aria-hidden className="text-bad">*</span></span>
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
                          <ChonTuan moc="dau" lui={26} toi={0} value={a.fromDate} onChange={doiKhoang('fromDate')} chuaChon="Từ tuần: như trên" ariaLabel="Từ tuần" />
                          <ChonTuan moc="cuoi" lui={26} toi={0} value={a.toDate} onChange={doiKhoang('toDate')} chuaChon="Đến tuần: như trên" ariaLabel="Đến tuần" />
                        </Hang2>
                        <span className="flex gap-2">
                          {a.description.trim() && (
                            <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setMoSua(moSua.filter((x) => x !== i))}>Xong</button>
                          )}
                          {bfActions.length > 1 && (
                            <button type="button" className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0" onClick={() => {
                              setBfActions(bfActions.filter((_, j) => j !== i));
                              setMoSua(moSua.filter((x) => x !== i).map((x) => (x > i ? x - 1 : x)));
                              setBfErrors({});
                            }}>Xoá</button>
                          )}
                        </span>
                      </div>
                    ) : (
                      <p className="m-0 flex flex-wrap items-baseline gap-x-1.5 text-xs text-slate-300">
                        <span className="min-w-0 truncate text-slate-100" title={a.description}>{a.description}</span>
                        <span className="text-slate-500">· {nguoiNhan(a.nguoi)}</span>
                        {a.ketQua && <span className="text-slate-500">· {outcomeLabelFor(a.ketQua)}</span>}
                        {tu && den && <span className="text-slate-500">· {nhanTuan(tu)} → {nhanTuan(den)}</span>}
                        <button type="button" className="link appearance-none border-0 bg-transparent p-0" onClick={() => setMoSua([...moSua, i])}>Sửa</button>
                      </p>
                    )}
                    {(bfErrors[i] || (i === 0 && loiCua('pa-0'))) && <p className="m-0 mt-1 text-[11px] text-late">{bfErrors[i] || loiCua('pa-0')}</p>}
                  </div>
                );
              })}
              <button type="button" className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0"
                onClick={() => { setMoSua([...moSua, bfActions.length]); setBfActions([...bfActions, { description: '', nguoi: { kieu: 'toi' }, fromDate: '', toDate: '', ketQua: '' }]); }}>
                + Thêm PA đã áp dụng
              </button>
            </div>
          </Khoi>

          <Khoi tieuDe="Kết quả">
            <Truong nhan="Kết quả cuối" batBuoc as="div" loi={loiCua('ket-qua')}>
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
                value={bfMetrics} onChange={setBfMetrics} buttonLabel="+ Điểm chi tiết theo kỹ năng" />
            )}
            <Truong nhan="Vì sao kết luận vậy" batBuoc loi={loiCua('vi-sao')}>
              <textarea className="field w-full" {...o('vi-sao')} rows={2} value={bfNote} onChange={(e) => setBfNote(e.target.value)}
                placeholder="Ví dụ: MT3 Listening lên 6.0" />
            </Truong>
          </Khoi>
        </>
      )}

      {/* PR-LUI-a2: bằng chứng ngay trong form (không bắt buộc) — tải lên khi bấm Lưu, sau khi Case có id. */}
      {!cnn && (
        <Khoi tieuDe="Bằng chứng · không bắt buộc">
          <div id={lf.oId('tep')} tabIndex={-1}><TepCho value={tep} onChange={setTep} khoa={busy} /></div>
        </Khoi>
      )}

      {/* CẢNH BÁO CASE TRÙNG (mục 7.13) — MỘT khối vàng, hai nút, ngay trong thân; chữ vừa gõ vẫn còn. */}
      {mode === 'backfill' && bfDup && (
        <div className="mt-3.5 rounded-lg border p-3" style={{ borderColor: 'rgb(var(--soon-line-rgb))', background: 'rgb(var(--soon-bg-rgb))' }}>
          <p className="m-0 text-sm text-slate-100">
            Đã có Case nhập bù <strong>“{bfDup.title}”</strong> trùng khoảng {tuanLich(bfDup.from, homNay)} → {tuanLich(bfDup.to, homNay)}. Cùng một lần?
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => sendBackfill({ confirmDuplicate: true })}>Lần khác, vẫn ghi riêng</button>
          </div>
        </div>
      )}
      {mode === 'now' && dup && (
        <div className="mt-3.5 rounded-lg border p-3" style={{ borderColor: 'rgb(var(--soon-line-rgb))', background: 'rgb(var(--soon-bg-rgb))' }}>
          <p className="m-0 text-sm text-slate-100">
            Đã có Case <strong>“{dup.title}”</strong> chưa xử lý xong ở {dup.categoryLabel}.
            <span className="text-slate-400"> Mở {tuanLich(dup.detectedAt, homNay)}{dup.interventionCount > 0 ? ` · ${dup.interventionCount} PA` : ' · chưa có PA'}.</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary btn-sm min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => send({ mergeIntoExisting: true })}>Ghi vào Case đang có</button>
            <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => send({ parallel: true })}>Vấn đề khác, mở Case riêng</button>
          </div>
        </div>
      )}
    </KhungPanel>
  );
}
