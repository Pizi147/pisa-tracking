import { useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { DongQuyChe, KhungTrongThe, Truong, useBaoDangSua } from '../../ui/KhungPanel.tsx';
import { NhatKyPa, VachBuoi } from './FormPa.tsx';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { ApiError, api, invalidate } from '../../lib/api.ts';
import { hoanTacXoa } from '../../lib/thungRac.ts';
import { useSession } from '../../lib/session.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { NutChon, Outcome } from '../../ui/ui.tsx';
import { BangChung } from '../../ui/BangChung.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { LinkLuot, MuiTen, NhanTamDung, type LuotCase } from './SkillBoard.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { ONgay } from '../../ui/ONgay.tsx';
import { fmtBand, skillLabel } from '../../lib/format.ts';
import { ChipSos } from '../../ui/ChipSos.tsx';
import {
  CASE_OUTCOMES, CASE_OUTCOME_LABEL, FOLLOWUP_OUTCOMES, INTERVENTION_KIND_LABEL, KHAC_TOI_THIEU, LY_DO_KET_THUC_PA_TOI_THIEU, CHU_TOI_THIEU_CASE, NEXT_STEP_LABEL, OUTCOME_MARK, OUTCOME_TONE, TRAN_CHU,
  chuAiLamDuoc, chuKhoangPa, coNguoiDay, datLaiNguoi, deadlineView, demBuoi, giaTriCuaPa, issuesForTopic, laKhac, laPaMacDinh, loiFormPa, nhanNguoiDay, nutDongPa, outcomeLabelFor,
  tenMon, thanSuaPa, toiKyGhi, tuanLich,
  type GiaTriPa, type TrangThai,
} from '@shared/domain/index.ts';
import { DongXinYKien } from './DongXinYKien.tsx';
import { DongBuoiTutor } from './BuoiTutorO.tsx';
import type { BuoiTutor, TheYeuCauDto } from '@shared/domain/index.ts';
import { quyCheMoTaCase, quyCheXacNhanS } from '@shared/domain/index.ts';
import { FormDoiPa, useDoiPa } from './DoiPa.tsx';
import { CanLam, NUT_MO, NutChu, type DaLuuPanel } from '../../ui/KhuonViec.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { KhongTheoDoiForm, XacNhanCasePanel, XacNhanPaPanel, ketQuaGanNhat, type PaQuyChe } from '../yThuc/CaseSosControls.tsx';
import { GhiKetQuaPanel, SuaKetQuaPanel } from './CapNhatTuan.tsx';
import { HoanThanhCasePanel, ThemPaPanel } from './ThaoTacCase.tsx';
import { ChonNhom } from '../fasttrack/NhanXet.tsx';
import { OKhac } from '../../ui/OKhac.tsx';
import { TheYeuCau } from '../duyet/TheYeuCau.tsx';
import { BaoLuuCase, DaDoi, DaiDaXoa, GiaTriSua, LyDoChan, NutXoa, OGoTuLuu, gioLuu } from './TaiCho.tsx';
import { dich, dichDu, t } from '@shared/i18n/index.ts';
import { ChuDich } from '../../ui/ChuDich.tsx';

/**
 * MỘT VẤN ĐỀ HỌC VỤ (PR-UX3, N-4, mockup 15 §3) — kể theo hai câu người đọc cần: VẤN ĐỀ gì, và ĐÃ LÀM GÌ (các PA, mỗi PA một
 * thẻ; kết quả các tuần trước ở "Lịch sử cập nhật" thu gọn).
 *
 * Phần THÂN (`ThanCase`) dùng chung cho mọi lối vào: ngăn Case (`NganCase`, một panel đổi nội dung theo `view`) — cả trang riêng
 * `/hoc-thuat/case/:id` (`CaseRoutePage`) cũng mở ngăn này. Các thao tác (Ghi kết quả · Thêm PA · Hoàn thành · Trả lời)
 * KHÔNG còn hộp thoại đè lên ngăn — ngăn Case đổi nội dung và có dòng "← Case Listening" để về.
 */

/** Khối `boTro` như `GET /cases/:id` trả (xem `BoTroDto` ở máy chủ) — chỉ các trường giao diện cần. */
export type BoTro = {
  nhom: string; buoiMoiTuan: number; chung: boolean;
  mon: { caseId: number; mon: string; tenMon: string }[];
};

export type CaseDetail = {
  id: number; originKind: string;
  /** SV-NX-CASE: mốc phiên bản (409 khi Case vừa đổi) — Sửa Case · Mô tả Case. */
  capNhatLuc?: string | null;
  /** Còn thiếu gì để hoàn thành case. Rỗng = đủ điều kiện đóng (mục 7.7 [5]). */
  closeBlockers: string[];
  /** PR-SOS (K3-09): `an` = ẩn nút Hoàn thành (PA theo quy chế chưa khép), `dong` = câu mờ thay nút. */
  hoanThanh?: { an: boolean; dong: string | null; ly_do: string[] } | null;
  /** PR-SOS: trạng thái Case SOS, tên ba phần, MỘT nhãn + MỘT việc tiếp, thẻ Không cần theo dõi đang chờ. */
  sos?: { fromSos: boolean; hasCause: boolean; awaitingCause: boolean; dueOn: string | null;
    /** OV-12c: Case MT (nguyên nhân = nhận xét của bài) · Case MT cũ bài chưa nhận xét. */
    laMt?: boolean; choNhanXet?: boolean;
    /** OV-13a (Q2): Case tạm — lượt chưa chốt SOS. */
    tam?: boolean;
    choDuyetKhongTheoDoi: { hanDuyet: string | null } | null; coPaChoXacNhan: boolean } | null;
  tenSos?: { mt: number | null; giua: string; sos: number | null; kck?: boolean } | null;
  /** PR-LT2a: khối PA Bổ trợ Giữa khoá (nhóm, môn) — null nếu Case không có PA bổ trợ. */
  boTro?: BoTro | null;
  trangThaiV4?: { k: string; t: TrangThai; chu: string; han: string | null };
  /** PR-VAI-b (T65): em đang Tạm dừng → ngày dừng; "quá hạn" thành nhãn vàng. */
  tamDungTu?: string | null;
  viecTiep?: { chu: string; loaiHan: string | null; han: string | null; paId?: number } | null;
  yeuCauCase?: any;
  topic?: string | null;
  student: { id: number; code: string; name: string; status: string; phuHuynh?: { parentName: string | null; parentRelation: string | null; parentPhone: string | null } } | null;
  cycle: { id: number; seq: number; route: string | null; target_score: number | null } | null;
  classId: number | null; attemptId: number | null; attemptNo: number | null;
  /** VIEW-CASE-LUOT: lượt của Case — chip lượt đầu khối Case là link tới trang lượt. */
  luot?: LuotCase | null;
  sosLevel: number | null; urgency: string | null;
  summary: string | null; headline: string; detectedAt: string; reportedBy: string | null;
  status: string; disposition: string | null; dispositionNote: string | null; closedAt: string | null;
  /** Tên Case tự sinh theo mốc mới nhất, ví dụ "MT2 - Listening dưới kỳ vọng". */
  title: string | null;
  /** Hạng mục — đơn vị của Case từ vòng 4. */
  category: string | null; categoryLabel: string | null;
  /** Mã chương trình lộ trình Case (MH2). */
  chuongTrinh?: string | null;
  /** Người phụ trách chính (mục 2.3) · R1-NO-CU (D17): nút "Đổi người…" — quyền + ứng viên do máy chủ tính. */
  ownerUserId?: number | null; owner?: string | null;
  doiChu?: { duoc: boolean; ungVien: { id: number; ten: string | null }[] };
  /** Case mở song song có chủ ý với một Case khác cùng hạng mục. */
  parallel: boolean;
  /** Lớp chấm điểm đạt/tổng (Normal) hay band 0–9 (Fast Track). */
  ratio: boolean;
  /** Các hạng mục hợp lệ để ghi điểm giáo viên tự chấm. */
  categories: { code: string; label: string }[];
  note: string | null;
  /** Hạn BÁO KẾT QUẢ của cả Case — khác hạn ghi kết quả từng phương án. */
  followUntil: string | null; followOverdue: boolean;
  /** Kết quả chung đã chốt. */
  outcome: string | null; outcomeLabel: string | null;
  outcomeNote: string | null; outcomeDecision: string | null; outcomeAt: string | null;
  /** Case bị PR-LT tự đóng khi em chuyển khỏi lớp/khoá (S16/S17) — không phải GV kết luận. */
  systemCloseReason?: string | null; systemCloseLabel: string | null;
  /** Mọi phương án đã có kết quả chưa — điều kiện để chốt kết quả chung. */
  canFinish: boolean;
  /** Các mốc trong vòng đời case. Giao diện xếp MỚI NHẤT LÊN ĐẦU (mục 4.3). */
  milestones: any[];
  issues: any[]; interventions: any[]; followups: any[]; history: any[];
  /** OV-12c (P5): Case MT — nguyên nhân theo từng lượt (nhận xét + nhóm của bài lượt đó). */
  nguyenNhanTheoLuot?: { attemptId: number; luot: string; nhanXet: string | null; nhanXetPhuTrach?: string | null; nhom: { code: string; label: string }[] }[];
  /** SV-NX-CASE (N8 ③): nhận xét Speaking chấm chéo chờ GV phụ trách xác nhận Case (null = không chờ). */
  choXacNhanS?: { nhanXet: string | null; nguoiCham: string | null; luot: string; han: string | null; coTheXacNhan: boolean } | null;
  viewer: { canEdit: boolean; canClose: boolean; canApprove: boolean; /** OV-12c: Xác nhận Case Progress (GVCN lớp đang học làm được). */ coTheXacNhanCase?: boolean;
    /** PR-LUI-a2: Mở lại (Case đã hoàn thành, QL/QT) · Sửa Case · Xoá Case / câu chặn · Kỹ năng khoá · tên để sửa. */
    coTheMoLai?: boolean; coTheSua?: boolean; xoa?: 'ngay' | 'xin' | null; choXoa?: boolean; khoaKyNang?: boolean; tenSua?: string | null;
    /** OV-13a (C): ⋯ "Kết thúc PA" cho PA theo quy chế đang chạy — GVCN lớp đang học · Quản lý. */
    coTheKetThucPa?: boolean;
    /** CASE-PA-UI (XM1): thẻ xin xoá Case đang chờ — người gửi Rút lại, QL duyệt tại chỗ. */
    theXoa?: TheYeuCauDto | null; tuChoiXoa?: { lyDo: string | null; luc: string | null } | null };
};

/** Nội dung của ngăn Case: một `KhungPanel` đổi nội dung theo view, không chồng panel. */
export type ViewCase = { loai: 'case' } | { loai: 'ghi-ket-qua'; paId: number } | { loai: 'them-pa' } | { loai: 'hoan-thanh' }
  /* PR-SOS (Q28-3): Xác nhận Case → Xác nhận PA theo quy chế. */
  | { loai: 'xac-nhan' } | { loai: 'xac-nhan-pa'; paId: number }
  /* MO-TA-CASE (N8): Case MT chưa có mô tả → Mô tả Case (mô tả + nhóm ghi thẳng vào Case). */
  | { loai: 'ghi-nhan-xet' }
  /* SV-NX-CASE (N8 ③): Speaking chấm chéo — GV phụ trách chọn mô tả Case. */
  | { loai: 'xac-nhan-s' }
  /* PR-LUI-a2: Sửa Case (+ Xoá Case ở chân). */
  | { loai: 'sua' }
  /* PR-PA (§8): Sửa PA — cùng form Thêm PA; mở từ ⋯ của dòng PA. */
  | { loai: 'sua-pa'; paId: number }
  /* OV-7b: sửa lần ghi Kết quả gần nhất của PA — cùng form Kết quả, điền sẵn. */
  | { loai: 'sua-ket-qua'; followupId: number };

/** "Case Listening" — tên ngắn của Case cho tiêu đề ngăn và dòng "← Case Listening". */
export function tenNganCase(d: { categoryLabel: string | null; category: string | null; chuongTrinh?: string | null }): string {
  /* MH2: máy chủ đã gửi `categoryLabel` theo chương trình ("Case G+V" đọc là "Case Grammar + Vocabulary"). */
  const kn = d.categoryLabel ?? (d.category ? tenMon(d.chuongTrinh ?? null, d.category) : null);
  return kn ? `Case ${kn}` : 'Case';
}

const daBatDau = (iv: any) => iv.status === 'planned' || iv.status === 'started';

/** Số ngày từ `tu` đến `den` (ISO), `null` khi thiếu. */
function soNgayGiua(tu: string | null | undefined, den: string | null | undefined): number | null {
  if (!tu || !den) return null;
  const a = Date.parse(`${tu.slice(0, 10)}T00:00:00Z`);
  const b = Date.parse(`${den.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(a) || Number.isNaN(b) ? null : Math.round((b - a) / 86_400_000);
}

/** M6 6b-2 (Q1): PA vừa thêm / vừa ghi kết quả — thẻ PA viền nhấn + "✓ {chu} · Hoàn tác" (đường đảo của form, 10 giây). */
export type VuaDoiPa = { paId: number; chu: string; hoanTac?: () => Promise<void> };

/** Đích khi mở panel Case (v16 i1 · i2): một panel cho mọi lối vào, cuộn tới đúng phần, thẻ đích viền nhấn — form việc mở sẵn. */
export type DichCase =
  | { loai: 'mo-ta' } | { loai: 'xac-nhan' } | { loai: 'them-pa' } | { loai: 'hoan-thanh' }
  | { loai: 'pa'; paId: number } | { loai: 'ghi-ket-qua'; paId: number } | { loai: 'xac-nhan-pa'; paId: number };

/** Form đang mở trong một thẻ PA (thay view riêng cũ — [XM3]). */
type FormThe = 'xac-nhan' | 'ghi' | 'ket-thuc' | { suaKq: number };
const tenForm = (f: FormThe) => (f === 'xac-nhan' ? t('Xác nhận PA') : f === 'ghi' ? t('Kết quả PA') : f === 'ket-thuc' ? t('Kết thúc PA') : t('Sửa kết quả'));

/** Báo nơi mở (chân panel): form nào đang mở (chưa lưu) và lần lưu vừa xong (Hoàn tác theo sang việc kế). */
export type BaoThanCase = { formMo: (ten: string | null) => void; daLuu: (x: DaLuuPanel) => void };

/**
 * THÂN CASE MỘT TUYẾN (CASE-PA-UI, mockup v16 a–k, chủ SP 06/11): Case (Phụ trách · Điểm · Nguyên nhân · Mô tả — bấm thẳng giá trị để sửa) → Phương án (thẻ PA bấm
 * mở tại chỗ: xem đủ, sửa, xác nhận, ghi / sửa / xoá kết quả, nhật ký) → Kết luận (Hoàn thành Case + lý do chặn cạnh nút, form ngay trong mục) → Lịch sử · Bằng chứng
 * → Xoá Case. Không view riêng, không ⋯, không panel lồng panel. Dùng chung: panel Case (mọi lối vào) và khối Case trong cột hồ sơ HV (N33 ①).
 */
export function ThanCase({ data, setData, reload, onChanged, dich: dichMo = null, bao, onDaXoaCase, kyNangTiep = null }: {
  data: CaseDetail; setData: (d: CaseDetail) => void; reload: () => void; onChanged?: () => void;
  dich?: DichCase | null; bao?: BaoThanCase;
  /** Xoá Case xong (vào Thùng rác) — nơi gọi vẽ dải Hoàn tác thay thân Case. */
  onDaXoaCase: (x: { thungRacId: number | null; ten: string; soPa: number }) => void;
  kyNangTiep?: { ten: string; di: () => void } | null;
}) {
  const { homNay, ngan } = useNgayNghiepVu();
  const toast = useToast();
  const toi = useSession().session?.user?.id ?? null;
  const vw = data.viewer;
  const canDong = data.status !== 'done';
  const primary = data.issues.find((i) => i.role === 'primary') ?? null;
  const context = data.issues.filter((i) => i.role === 'context');
  const laMt = !!data.sos?.laMt;
  /* Đang chạy lên trên, đã khép xuống dưới; mới nhất trước. PA mới của đề xuất đổi PA đang chờ / bị từ chối nằm ở thẻ PA gốc. */
  const dsPa = [...(data.interventions ?? [])].filter((x) => !(x.laPaDoi && (x.approvalState === 'pending' || x.approvalState === 'declined'))).sort((a, b) =>
    Number(daBatDau(b)) - Number(daBatDau(a)) || (b.id as number) - (a.id as number));
  const lichSu = buildLichSu(data, ngan);
  const bc = useApi<{ rows: unknown[] }>(`/attachments?ownerType=sos_case&ownerId=${data.id}`, [data.id]);
  const box = useRef<HTMLDivElement>(null);

  /* Thẻ mở · form trong thẻ · thẻ vừa đổi (viền nhấn + "✓ … · Hoàn tác" 10 giây) · dải đã xoá PA. Đích mở sẵn theo lối vào. */
  const dauForm = (): [number, FormThe] | null => {
    if (!dichMo) return null;
    if (dichMo.loai === 'ghi-ket-qua') return [dichMo.paId, 'ghi'];
    if (dichMo.loai === 'xac-nhan-pa') return [dichMo.paId, 'xac-nhan'];
    return null;
  };
  const [mo, setMo] = useState<Record<number, boolean>>(() => {
    const id = dichMo && 'paId' in dichMo ? dichMo.paId : null;
    return id ? { [id]: true } : {};
  });
  const [form, setForm] = useState<Record<number, FormThe | undefined>>(() => { const f = dauForm(); return f ? { [f[0]]: f[1] } : {}; });
  const [vuaDoi, setVuaDoi] = useState<VuaDoiPa | null>(null);
  const [daXoaPa, setDaXoaPa] = useState<{ paId: number; ten: string; thungRacId: number | null; viTri: number } | null>(null);
  const [themPa, setThemPa] = useState(dichMo?.loai === 'them-pa');
  const [hoanThanh, setHoanThanh] = useState(dichMo?.loai === 'hoan-thanh');
  const [ktd, setKtd] = useState(false);   // RKC-2c ④: "Không cần theo dõi…" khi Case SOS đã có PA chạy (máy chủ hỏi nêu PA sẽ dừng)
  const dichPa = dichMo && 'paId' in dichMo ? dichMo.paId : null;
  /* Thẻ PA tự mở form Xác nhận khi `mo` + PA chờ xác nhận (ThePa `formHien`) — cùng điều kiện, đọc dữ liệu đã nạp. */
  const formXacNhanMo = Object.values(form).includes('xac-nhan') || (!!data.viewer.canEdit && !!data.sos?.hasCause && data.status !== 'done'
    && (data.interventions ?? []).some((iv: any) => iv.awaitingConfirmation && mo[iv.id] && !form[iv.id]));
  const tenFormMo = themPa ? t('PA mới') : hoanThanh ? t('Hoàn thành Case')
    : (() => { const k = Object.entries(form).find(([, f]) => f); return k ? tenForm(k[1]!) : null; })();
  useEffect(() => { bao?.formMo(tenFormMo); }, [tenFormMo]);   // eslint-disable-line react-hooks/exhaustive-deps
  /* Cuộn tới phần đích một lần khi mở (Mô tả · thẻ PA · form). */
  useEffect(() => {
    const sel = dichPa ? `[data-pa-id="${dichPa}"]` : dichMo?.loai === 'them-pa' ? '[data-pa-moi]' : dichMo?.loai === 'hoan-thanh' ? '[data-ket-luan]' : null;
    if (sel) box.current?.querySelector<HTMLElement>(sel)?.scrollIntoView({ block: 'nearest' });
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  const lamMoi = () => { reload(); onChanged?.(); };
  /* Lưu tại chỗ (Case / một PA): máy chủ trả đúng Case vừa đổi → thay dữ liệu, không tải lại cả Case; danh sách việc làm mới. */
  const nhan = (d: CaseDetail) => { setData(d); invalidate('/my-work'); invalidate('/students'); onChanged?.(); };
  const xongForm = (paId: number) => (x?: DaLuuPanel) => {
    setForm((f) => ({ ...f, [paId]: undefined })); setMo((m) => ({ ...m, [paId]: false }));
    setVuaDoi({ paId: x?.paId ?? paId, chu: x?.chu ?? t('Đã lưu'), hoanTac: x?.hoanTac });
    if (x) bao?.daLuu(x);
    lamMoi();
  };

  /* ─── Case: Phụ trách · Điểm · Nguyên nhân · Mô tả */
  const suaCase = !!vw.coTheSua;   // RKC-2a: Case đã hoàn thành sửa thẳng (có lịch sử)
  const [nhomNhap, setNhomNhap] = useState<string[]>([]);   // Case MT chưa mô tả: nhóm lưu CÙNG mô tả (một lần ghi, như Mô tả Case cũ)
  const choNhanXet = data.trangThaiV4?.k === 'cho-nhan-xet';
  const choXacNhan = data.trangThaiV4?.k === 'cho-nguyen-nhan' && !!vw.coTheXacNhanCase && canDong;
  const s = data.choXacNhanS?.coTheXacNhan && canDong ? data.choXacNhanS : null;
  const viecMoTa = (choNhanXet && !!vw.canEdit) || !!s;
  const nguoiViec = data.ownerUserId && data.ownerUserId !== toi ? data.owner : null;
  const hanViec = data.viecTiep?.han ? ngan(data.viecTiep.han) : null;
  const nhanViec = viecMoTa ? <span className="nhan-viec">{nguoiViec ? t('việc của {ten}', { ten: nguoiViec }) : t('việc của bạn')}{hanViec ? ` · ${t('hạn {ngay}', { ngay: hanViec })}` : ''}</span> : null;

  const caseMuc = choXacNhan ? (
    /* Progress Test: Xác nhận Case MỘT bước (nhóm + mô tả + PA Bổ trợ) — form cũ đủ trường, đặt ngay trong mục Case. */
    <div className="muc"><p className="muc-h">Case</p>
      <KhungTrongThe.Provider value>
        <XacNhanCasePanel data={data} onClose={() => {}} onXong={lamMoi} />
      </KhungTrongThe.Provider>
    </div>
  ) : (
    <div className="muc">
      <p className="muc-h">Case</p>
      {data.yeuCauCase && vw.canApprove && <div className="pb-2"><TheYeuCau gon yc={data.yeuCauCase} onXong={lamMoi} /></div>}
      <dl className="fld">
        <dt>{t('Phụ trách')}</dt>
        <dd><PhuTrach data={data} toi={toi} onDoi={nhan} reload={reload} /></dd>
        {ketQuaGanNhat(data) && <>
          <dt>{t('Điểm')}</dt>
          <dd><span>{ketQuaGanNhat(data)}</span>{data.luot && <LinkLuot luot={data.luot} kn={data.topic} />}</dd>
        </>}
        <dt>{t('Nguyên nhân')}</dt>
        <dd><NguyenNhan data={data} sua={suaCase && !s} nhap={!primary && laMt ? { v: nhomNhap, dat: setNhomNhap } : null} onDoi={nhan} /></dd>
        <dt>{t('Mô tả')}</dt>
        <dd>
          <MoTaCase data={data} sua={suaCase || !!s} viec={nhanViec} tuMo={dichMo?.loai === 'mo-ta' || (dichMo === null && viecMoTa)} nhomNhap={nhomNhap} onDoi={nhan} onXong={lamMoi} />
          {/* GD-4b Q13: việc Mô tả Case (Case MT chưa có mô tả) — dòng quy chế ngay dưới ô (ô tự lưu, không hàng nút). */}
          {choNhanXet && !!vw.canEdit && !s && <div className="basis-full"><DongQuyChe px="px-0" qc={quyCheMoTaCase(hanViec)} /></div>}
          {primary?.observation && (primary.moTaTuMt || primary.byName) && (
            <span className="nguon basis-full">{(primary.moTaTuMt ? [t('theo nhận xét {mt}', { mt: primary.moTaTuMt })] : [primary.byName, primary.createdAt ? ngan(primary.createdAt) : null]).filter(Boolean).join(' · ')}</span>
          )}
          {primary?.nhanXetPhuTrach && (
            <span className="basis-full text-[13px] text-slate-300"><span className="text-slate-400">{t('Nhận xét GV phụ trách')}:</span> “<ChuDich chu={primary.nhanXetPhuTrach} nguon={data.attemptId ? { bang: 'assessment_scores', id: data.attemptId, cot: 'nhan_xet_phu_trach', kyNang: 'speaking' } : null} />”</span>
          )}
          {data.note && <span className="basis-full text-[13px] text-slate-400"><ChuDich chu={data.note} nguon={{ bang: 'sos_cases', id: data.id, cot: 'note' }} /></span>}
        </dd>
        {context.length > 0 && <>
          <dt>{t('Bối cảnh')}</dt>
          <dd>{context.map((i) => <Nhan key={i.id} tone="muted" dut title={i.observation ?? undefined}>{i.label}</Nhan>)}</dd>
        </>}
      </dl>
    </div>
  );

  /* ─── Phương án */
  /* RKC-2a / 2b: Case đã hoàn thành, chờ duyệt "Không cần theo dõi" → vẫn hiện; máy chủ hỏi (Mở lại Case / rút đề nghị). */
  /* SOS-TAM-PA (chủ SP 11/11): Case tạm (SOS chưa chốt) thêm PA được — chưa có hạn ghi kết quả tới khi chốt. */
  const themPaDuoc = !!vw.canEdit && !(data.sos?.awaitingCause || data.sos?.choNhanXet);
  const coPaBatBuoc = (data.interventions ?? []).some((x: any) => x.batBuoc && (x.status === 'planned' || x.status === 'started'));
  const the = (iv: any) => (
    <ThePa key={iv.id} iv={iv} data={data} homNay={homNay} ngan={ngan} toi={toi}
      mo={!!mo[iv.id]} setMo={(v) => setMo((m) => ({ ...m, [iv.id]: v }))}
      form={form[iv.id] ?? null} setForm={(f) => { setForm((x) => ({ ...x, [iv.id]: f ?? undefined })); if (f) setMo((m) => ({ ...m, [iv.id]: true })); }}
      dich={dichPa === iv.id} vua={vuaDoi?.paId === iv.id ? vuaDoi : null} onHoanTac={() => { setVuaDoi(null); lamMoi(); }}
      onXongForm={xongForm(iv.id)} onDoi={nhan} lamMoi={lamMoi} kyNangTiep={kyNangTiep}
      onDaXoa={(x) => { setDaXoaPa({ ...x, paId: iv.id, viTri: dsPa.indexOf(iv) }); lamMoi(); }} />
  );
  const theXoa = daXoaPa && (
    <DaiDaXoa key={`xoa-${daXoaPa.paId}`} chu={<>{t('Đã xoá PA')} <b>{daXoaPa.ten}</b></>} thungRacId={daXoaPa.thungRacId}
      onKhoiPhuc={() => { setDaXoaPa(null); lamMoi(); toast.push('ok', t('Đã khôi phục')); }} onHet={() => setDaXoaPa(null)} />
  );
  const dsThe = dsPa.filter((x) => x.id !== daXoaPa?.paId).map(the);
  if (theXoa) dsThe.splice(Math.min(daXoaPa!.viTri, dsThe.length), 0, theXoa);
  const paMuc = (
    <div className="muc">
      <p className="muc-h">{t('Phương án')}{dsPa.length > 0 && <span className="dem">{dsPa.length}</span>}
        {themPaDuoc && !themPa && (
          <span className="phai-h"><button type="button" className={`btn btn-sm min-h-[44px] sm:min-h-0 ${dsPa.length ? '' : 'btn-primary'}`} onClick={() => setThemPa(true)}>{t('+ Thêm PA')}</button></span>
        )}
      </p>
      <div className="ds-pa">
        {themPa && (
          <div className="the-pa mo moi-doi" data-pa-moi>
            <div className="pa-dau" style={{ gridTemplateColumns: 'minmax(0,1fr)' }}><span className="ten-pa py-1 text-[15px] font-semibold">{t('PA mới')}</span></div>
            <div className="pa-than">
              <KhungTrongThe.Provider value>
                <ThemPaPanel caseId={data.id} studentId={data.student?.id} coPaBatBuoc={coPaBatBuoc} onClose={() => setThemPa(false)}
                  hanLapPa={canDong && data.viecTiep?.loaiHan === 'lap-pa' && data.viecTiep.han ? ngan(data.viecTiep.han) : dsPa.length ? null : undefined}
                  onSaved={(x) => { setThemPa(false); if (x?.paId) setVuaDoi({ paId: x.paId, chu: x.chu, hoanTac: x.hoanTac }); if (x) bao?.daLuu(x); lamMoi(); }} />
              </KhungTrongThe.Provider>
            </div>
          </div>
        )}
        {dsPa.length === 0 && !themPa && !theXoa && (
          <div className="rong-pa"><span>{t('Chưa có PA.')}{canDong && data.viecTiep?.loaiHan === 'lap-pa' && data.viecTiep.han ? <> {t('Case cần ít nhất 1 PA trước')} <b>{t('hạn {ngay}', { ngay: ngan(data.viecTiep.han) })}</b>.</> : null}</span></div>
        )}
        {dsThe}
      </div>
    </div>
  );

  /* ─── Kết luận: Hoàn thành Case luôn thấy với người có quyền ([XM5]); bị chặn = mờ + lý do cạnh nút + ⓘ (thay dòng khoá đỏ). */
  const ht = data.hoanThanh ?? null;
  const chan = data.closeBlockers ?? [];
  const paBatBuoc = ht?.an ? (data.interventions ?? []).find((x: any) => x.batBuoc && (x.status === 'planned' || x.status === 'started')) ?? null : null;
  const lyNgan = ht?.an && ht.dong
    ? (paBatBuoc ? t('chờ PA {ten} · {moc}', { ten: dich(INTERVENTION_KIND_LABEL[paBatBuoc.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? paBatBuoc.kind), moc: dich(paBatBuoc.mocChu ?? '') }).replace(/ · $/, '') : dich(ht.dong))
    : chan.length ? lyDoNgan(chan[0]) : null;
  const toiPa = (id: number) => { setMo((m) => ({ ...m, [id]: true })); box.current?.querySelector<HTMLElement>(`[data-pa-id="${id}"]`)?.scrollIntoView({ block: 'center' }); };
  const hienHoanThanh = canDong && !!vw.canClose && !data.sos?.tam;
  const ketLuan = !canDong ? (
    <div className="muc" data-ket-luan>
      <p className="muc-h">{t('Kết luận')}</p>
      <dl className="fld">
        <dt>{t('Cả Case')}</dt>
        <dd>{data.outcomeLabel ? <span className={`ket ${LOP_KET[OUTCOME_TONE[data.outcome as keyof typeof OUTCOME_TONE] ?? 'muted'] ?? 'cd'}`}>{dich(data.outcomeLabel)}</span> : <span>{t('Đã kết luận')}</span>}
          <span className="text-[13px] text-slate-300">{data.outcomeNote ? `“${data.outcomeNote}”` : ''}{data.closedAt ? ` · ${t('kết thúc theo dõi {tuanLich}', { tuanLich: tuanLich(data.closedAt, homNay) })}` : ''}</span></dd>
      </dl>
      <MoLaiCase data={data} onXong={lamMoi} />
    </div>
  ) : hoanThanh ? (
    <div className="muc" data-ket-luan>
      <p className="muc-h">{t('Hoàn thành Case')}</p>
      <KhungTrongThe.Provider value>
        <HoanThanhCasePanel caseId={data.id} category={data.category} categoryLabel={data.categoryLabel} ratio={!!data.ratio}
          paGanNhat={(() => { const f = (data.followups ?? []).find((x: any) => x.outcome); return f ? outcomeLabelFor(f.outcome) : null; })()}
          ketLuanSan={(data.followups ?? []).find((x: any) => x.outcome && x.note)?.note ?? null}
          soPaChay={(data.interventions ?? []).filter((x: any) => x.status === 'planned' || x.status === 'started').length}
          onClose={() => setHoanThanh(false)} onSaved={() => { setHoanThanh(false); lamMoi(); }} />
      </KhungTrongThe.Provider>
    </div>
  ) : hienHoanThanh ? (
    <div className="muc" data-ket-luan>
      <p className="muc-h">{t('Kết luận')}</p>
      <div className="ket-luan">
        {lyNgan ? (
          <LyDoChan id={`ly-kl-${data.id}`} nut={t('Hoàn thành Case')} ngan={lyNgan} onBam={() => setHoanThanh(true)} chiTiet={<>
            {ht?.an && ht.dong && <p className="m-0">{dich(ht.dong)}</p>}
            {chan.map((x) => <p key={x} className="m-0">{dich(x)}</p>)}
            <p className="m-0">{t('Hoàn thành Case sẽ kết thúc các PA còn mở — Mở lại Case trả lại các PA đó.')}</p>
            {paBatBuoc && <button type="button" className="link-nho mt-1.5" onClick={() => toiPa(paBatBuoc.id)}>{t('Tới PA {ten} ↑', { ten: dich(INTERVENTION_KIND_LABEL[paBatBuoc.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? paBatBuoc.kind) })}</button>}
          </>} />
        ) : <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={() => setHoanThanh(true)}>{t('Hoàn thành Case')}</button>}
        {/* G2-10: form Xác nhận PA đang mở đã có "Không cần theo dõi…" — không hiện nút thứ hai cùng việc. */}
        {data.sos?.fromSos && !data.sos?.choDuyetKhongTheoDoi && !ktd && !formXacNhanMo && (
          <button type="button" className={NUT_MO} onClick={() => setKtd(true)}>{t('Không cần theo dõi…')}</button>
        )}
      </div>
      {ktd && <KhongTheoDoiForm caseId={data.id} onClose={() => setKtd(false)} onDone={() => { setKtd(false); lamMoi(); }} />}
    </div>
  ) : null;

  return (
    <div ref={box} className="cs-than">
      {!vw.canEdit && canDong && !s && <p className="bao-chi-xem m-0 mt-4">{chuAiLamDuoc(data.owner)}</p>}
      {data.status !== 'done' && (() => { const od = [...(data.milestones ?? [])].reverse().find((m) => m.kind === 'overall_dat'); return od ? (
        <p className="m-0 mt-3 rounded-lg bg-ok-bg px-3 py-2 text-[13px] text-ok">{t('Overall {x} đã đạt — xem và Hoàn thành Case', { x: od.dot ?? (od.attemptNo ? `MT${od.attemptNo}` : '') })}</p>
      ) : null; })()}
      {caseMuc}
      {paMuc}
      {ketLuan}
      <div className="muc !pt-2">
        {lichSu.length > 0 && (
          <details className="group">
            <summary className="dong-gap cursor-pointer list-none"><span>{t('Lịch sử')} · {lichSu.length}</span>
              <span className="phai link-nho">{t('Xem')} <span aria-hidden className="inline-flex transition-transform group-open:rotate-90"><MuiTen mo={false} /></span></span></summary>
            <ol className="m-0 mt-2 list-none space-y-2 border-l p-0 pl-3" style={{ borderColor: 'var(--line)' }}>
              {lichSu.map((m) => (
                <li key={m.key} className="text-[13px]">
                  <span className="block text-xs tabular-nums text-slate-400">{ngan(m.on)}{m.dot ? <> · {m.dotHref ? <Link to={m.dotHref} className="link">{m.dot}</Link> : m.dot}</> : ''}</span>
                  <span className="flex items-start gap-1.5 text-slate-200">
                    <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">{m.tieuDe}{m.badge}</span>
                    {m.xoaKq && <NutXoaKetQua f={m.xoaKq.f} onXong={lamMoi} />}
                  </span>
                  {m.than}
                  {m.suaXemLai && <SuaXemLai f={m.suaXemLai} />}
                </li>
              ))}
            </ol>
          </details>
        )}
        <div className="border-t pt-1" style={{ borderColor: lichSu.length ? 'var(--line)' : 'transparent' }}>
          <BangChung ownerType="sos_case" ownerId={data.id} canEdit={vw.canEdit} tieuDe={`${t('Bằng chứng')} · ${bc.data?.rows.length || t('chưa có')}`} onChanged={bc.reload} />
        </div>
      </div>
      <XoaCase data={data} toi={toi} onXong={lamMoi} onDaXoa={onDaXoaCase} />
    </div>
  );
}

/** Lý do ngắn cạnh nút từ câu chặn của máy chủ (`closeBlockers`) — không tính lại luật. */
function lyDoNgan(x: string): string {
  if (/^Case chưa có phương án/.test(x)) return t('cần ít nhất 1 PA');
  const a = /^(\d+) phương án đang chờ Quản lý duyệt/.exec(x);
  if (a) return t('{n} PA chờ QL duyệt', { n: a[1] });
  const b = /^(\d+) phương án chưa cập nhật kết quả cuối/.exec(x);
  if (b) return t('{n} PA chưa có kết quả cuối', { n: b[1] });
  return dich(x);
}

/** Phụ trách (v16 c1 · c2): QL + GVCN lớp em (`doiChu`) bấm tên → hộp chọn ngay dưới, lưu ngay, "✓ Đã đổi · Hoàn tác"; người khác thấy chữ thường. */
function PhuTrach({ data, toi, onDoi, reload }: { data: CaseDetail; toi: number | null; onDoi: (d: CaseDetail) => void; reload: () => void }) {
  const [moHop, setMoHop] = useState(false);
  const [daDoi, setDaDoi] = useState<{ cu: number | null; ten: string } | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const bao = useContext(BaoLuuCase);
  const duoc = !!data.doiChu?.duoc;   // RKC-2b: Case đã đóng cũng đổi người được (máy chủ quyết)
  const ten = data.owner ?? t('Chưa có');
  const ds = (data.doiChu?.ungVien ?? []).map((u) => ({ id: u.id, ten: u.ten ?? '—' }));
  const doi = async (id: number, cu: number | null) => {
    setLoi(null); bao({ tt: 'dang' });
    const d = await api.post<CaseDetail>(`/cases/${data.id}/nguoi-phu-trach`, { ownerId: id, ownerCu: cu });
    bao({ tt: 'da', luc: gioLuu() });
    if (d && (d as any).id) onDoi(d); else { reload(); invalidate('/my-work'); }
  };
  const chon = async (id: number) => {
    const cu = data.ownerUserId ?? null;
    setMoHop(false);
    if (id === cu) return;
    try { await doi(id, cu); setDaDoi({ cu, ten: ds.find((u) => u.id === id)?.ten ?? '' }); }
    catch (e: any) { bao({ tt: 'loi' }); setLoi(e?.message ?? t('Không lưu được')); if (e instanceof ApiError && e.status === 409) reload(); }
  };
  return (
    <>
      <GiaTriSua kieu="chon" nhan={t('Đổi người phụ trách')} sua={duoc} mo={moHop} onClick={() => setMoHop(!moHop)}>
        {ten}{data.ownerUserId && data.ownerUserId === toi ? <span className="ban"> ({t('bạn')})</span> : null}
      </GiaTriSua>
      {daDoi && !moHop && <DaDoi key={daDoi.ten} chu={t('Đã đổi')} hoanTac={daDoi.cu ? () => doi(daDoi.cu!, data.ownerUserId ?? null) : undefined} onXong={() => setDaDoi(null)} />}
      {loi && <span role="alert" className="basis-full text-[13px] text-bad">⚠ {loi}</span>}
      {moHop && (
        <div className="w-full basis-full"><div className="sm:max-w-[340px]">
          <ChonNguoi nhom="giao_vien" choToi={false} choNgoai={false} tuMo ariaLabel={t('Người phụ trách')} ds={ds}
            value={data.ownerUserId ? { kieu: 'tai_khoan', id: data.ownerUserId, ten } : null}
            onChange={(v) => { if (v?.kieu === 'tai_khoan') void chon(v.id); else setMoHop(false); }} />
        </div></div>
      )}
    </>
  );
}

/**
 * Nguyên nhân (v16 n1): thẻ nhóm (chính trước); người sửa được Case bấm → chọn nhóm ngay dưới (thứ tự chọn — 1 = chính), lưu khi chọn; "Khác" (Case không phải MT)
 * mở ô Ghi rõ. Case MT chưa có mô tả: nhóm giữ tạm, lưu CÙNG mô tả (`nhap`).
 */
function NguyenNhan({ data, sua, nhap, onDoi }: { data: CaseDetail; sua: boolean; nhap: { v: string[]; dat: (v: string[]) => void } | null; onDoi: (d: CaseDetail) => void }) {
  const bao = useContext(BaoLuuCase);
  const [moHop, setMoHop] = useState(false);
  const goc = [...data.issues.filter((i) => i.role === 'primary'), ...data.issues.filter((i) => i.role === 'secondary')];
  const [v, setV] = useState<string[]>(() => nhap?.v.length ? nhap.v : goc.map((x) => x.code));
  const chinh = data.issues.find((i) => i.role === 'primary') ?? null;
  const [ghiRo, setGhiRo] = useState(chinh?.observation ?? '');
  const [loi, setLoi] = useState<string | null>(null);
  const laMt = !!data.sos?.laMt;
  const canGhiRo = !laMt && !!v[0] && laKhac(v[0]);
  const luu = async (nhom: string[], ro: string) => {
    if (nhap) { nhap.dat(nhom); return; }
    if (!nhom.length || (!laMt && laKhac(nhom[0]) && ro.trim().length < KHAC_TOI_THIEU)) return;
    setLoi(null); bao({ tt: 'dang' });
    try {
      const d = await api.patch<CaseDetail>(`/cases/${data.id}`, { luc: data.capNhatLuc, nhom, ...(!laMt && laKhac(nhom[0]) ? { observation: ro.trim() } : {}) });
      bao({ tt: 'da', luc: gioLuu() }); onDoi(d);
    } catch (e: any) { bao({ tt: 'loi' }); setLoi(e?.message ?? t('Không lưu được')); }
  };
  const nhanCua = (code: string) => issuesForTopic(data.topic ?? '', data.chuongTrinh ?? null).find((i) => i.code === code)?.label ?? code;
  const hien = nhap ? nhap.v.map((c) => ({ code: c, label: nhanCua(c) })) : goc.map((x) => ({ code: x.code, label: x.label }));
  return (
    <>
      {/* Chủ SP 06/11 (xem PR a): mỗi nhóm đã chọn MỘT hộp riêng (chính trước) — không hộp lồng thẻ; bấm hộp nào cũng mở chọn nhóm. Không quyền: chữ thường. */}
      {!hien.length ? <GiaTriSua kieu="chon" nhan={t('Sửa nguyên nhân')} sua={sua} mo={moHop} onClick={() => setMoHop(!moHop)}><span className="text-faint">{t('Chưa có')}</span></GiaTriSua>
        : !sua ? <span>{hien.map((x) => dich(x.label)).join(' · ')}</span>
        : hien.map((x, i) => (
          <GiaTriSua key={x.code} kieu="chon" nhan={t('Sửa nguyên nhân')} mo={moHop} khongDau={i < hien.length - 1} onClick={() => setMoHop(!moHop)}>{dich(x.label)}</GiaTriSua>
        ))}
      {nhap && nhap.v.length > 0 && <span className="text-[13px] text-faint">{t('lưu cùng Mô tả')}</span>}
      {chinh?.observation && !laMt && laKhac(chinh.code) && !moHop && <span className="basis-full text-[13px] text-slate-300">{t('Khác')}: {chinh.observation}</span>}
      {moHop && (
        <div className="w-full basis-full"><div className="flex flex-col gap-2 rounded-[10px] border p-3 sm:max-w-[420px]" style={{ borderColor: 'var(--line-strong)', background: 'var(--surface)' }}>
          <span className="text-xs font-semibold text-faint">{t('{kn} · chọn một hoặc nhiều (chọn trước = chính)', { kn: data.categoryLabel ?? '' })}</span>
          <ChonNhom skill={data.topic ?? ''} ct={data.chuongTrinh ?? null} value={v} onChange={(x) => { setV(x); if (!(!laMt && x[0] && laKhac(x[0]))) void luu(x, ghiRo); }} />
          <OKhac hien={canGhiRo} value={ghiRo} onChange={setGhiRo} goiY={t('Ví dụ: Chưa quen dạng bài mới')} onBlur={() => void luu(v, ghiRo)} />
          {canGhiRo && ghiRo.trim().length < KHAC_TOI_THIEU && <span className="text-[13px] text-soon">{t('Ghi rõ ít nhất {n} ký tự để lưu', { n: KHAC_TOI_THIEU })}</span>}
          {loi && <span role="alert" className="text-[13px] text-bad">⚠ {loi}</span>}
          <span className="flex justify-end"><button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => { if (canGhiRo) void luu(v, ghiRo); setMoHop(false); }}>{t('Xong')}</button></span>
        </div></div>
      )}
    </>
  );
}

/**
 * Mô tả (v16 a · b1 · b2 · b3 · k1): trống = ô trông như ô nhập (viền nhấn + "việc của bạn · hạn" khi là việc đang làm, con trỏ sẵn trong ô); có chữ = đoạn bấm được
 * (bút) → ô gõ tự lưu 15–300 / MT ≥ 10 (N35). Case MT: mô tả = quan sát của nhóm chính; Case khác: tóm tắt Case. S chấm chéo (N8 ③): nhận xét chấm chéo ngay dưới —
 * "Dùng nhận xét này" (1 bấm) hoặc gõ mô tả của mình (= Xác nhận Case, cách "viết").
 */
function MoTaCase({ data, sua, viec, tuMo, nhomNhap, onDoi, onXong }: {
  data: CaseDetail; sua: boolean; viec: ReactNode; tuMo: boolean; nhomNhap: string[]; onDoi: (d: CaseDetail) => void; onXong: () => void;
}) {
  const laMt = !!data.sos?.laMt;
  const chinh = data.issues.find((i) => i.role === 'primary') ?? null;
  const s = data.choXacNhanS?.coTheXacNhan && data.status !== 'done' ? data.choXacNhanS : null;
  const chu = (laMt ? chinh?.observation : data.summary) ?? (chinh?.observation || '');
  const [go, setGo] = useState(() => tuMo && sua && (typeof window === 'undefined' || !window.matchMedia?.('(pointer: coarse)').matches));
  const [daXn, setDaXn] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const toiThieu = CHU_TOI_THIEU_CASE;   // #4 ngưỡng chung (trước 15) · Case MT / S cũng 8 (chủ SP 14/11, trước 10)
  const luu = async (x: string) => {
    if (s) { await api.post(`/cases/${data.id}/xac-nhan-s`, { cach: 'viet', moTa: x }); setDaXn(t('Đã xác nhận Case')); onXong(); return; }
    const body = laMt ? { luc: data.capNhatLuc, observation: x, ...(!chinh ? { nhom: nhomNhap } : {}) } : { luc: data.capNhatLuc, summary: x };
    const d = await api.patch<CaseDetail>(`/cases/${data.id}`, body);
    onDoi(d);
  };
  const xacNhanS = async (cach: 'dung' | 'giu') => {
    setBusy(true); setLoi(null);
    try { await api.post(`/cases/${data.id}/xac-nhan-s`, { cach }); setDaXn(t('Đã xác nhận Case')); onXong(); }
    catch (e: any) { setLoi(e?.message ?? t('Không lưu được')); } finally { setBusy(false); }
  };
  const hoanTacS = async () => { await api.post(`/cases/${data.id}/hoan-tac-xac-nhan-s`); onXong(); };
  const o = go ? (
    <OGoTuLuu dau={s ? '' : chu} toiThieu={toiThieu} toiDa={TRAN_CHU.moTaCase} nhan={t('Mô tả')} placeholder={t('Em vướng gì ở {kn}? Gõ ở đây', { kn: data.categoryLabel ?? '' })}
      chan={laMt && !chinh && !s && !nhomNhap.length ? t('Chọn Nguyên nhân ở trên để lưu') : null} goiY={viec} luu={luu} onDong={() => setGo(false)} />
  ) : chu && !s ? (
    sua ? <GiaTriSua kieu="chu" nhan={t('Sửa mô tả')} onClick={() => setGo(true)}><ChuDich chu={chu} nguon={laMt && chinh ? { bang: 'case_issues', id: chinh.id, cot: 'observation' } : { bang: 'sos_cases', id: data.id, cot: 'summary' }} /></GiaTriSua>
      : <MoTaGon dai={chu.length > 180}><ChuDich chu={chu} nguon={laMt && chinh ? { bang: 'case_issues', id: chinh.id, cot: 'observation' } : { bang: 'sos_cases', id: data.id, cot: 'summary' }} /></MoTaGon>
  ) : sua ? (
    <button type="button" className={`o-trong ${viec ? 'viec-toi' : ''}`} onClick={() => setGo(true)}>
      <span>{t('Em vướng gì ở {kn}? Gõ ở đây', { kn: data.categoryLabel ?? '' })}</span>{viec}
    </button>
  ) : <span className="text-faint">{t('Chưa có')}</span>;
  return (
    <>
      {o}
      {daXn && <DaDoi chu={daXn} hoanTac={hoanTacS} onXong={() => setDaXn(null)} />}
      {s && (
        <div className="flex basis-full flex-col gap-2 rounded-lg border p-3" style={{ borderColor: 'var(--line-strong)', background: 'var(--surface-2)' }}>
          <span className="text-[13px] font-semibold">{t('Nhận xét chấm chéo · {ai} · {luot}', { ai: s.nguoiCham ?? '—', luot: s.luot })}</span>
          {s.nhanXet && <span className="text-sm leading-relaxed">“<ChuDich chu={s.nhanXet} nguon={data.attemptId ? { bang: 'assessment_scores', id: data.attemptId, cot: 'comment', kyNang: 'speaking' } : null} />”</span>}
          {/* GD-4b Q28 / Q29: dùng nhận xét người chấm (mặc định) · đang gõ mô tả của mình = viết khác. */}
          <DongQuyChe px="px-0" qc={quyCheXacNhanS(go || !s.nhanXet, s.nguoiCham, toiThieu)} />
          <span className="flex flex-wrap items-center gap-2">
            {s.nhanXet && <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void xacNhanS('dung')}>{t('Dùng nhận xét này')}</button>}
            {chinh?.observation && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void xacNhanS('giu')}>{t('Giữ mô tả đang có')}</button>}
            <span className="text-[13px] text-faint">{t('hoặc gõ mô tả của bạn ở ô trên')}</span>
          </span>
          {chinh?.observation && <span className="text-[13px] text-slate-300">{t('Mô tả đang có')}: “{chinh.observation}”</span>}
          {loi && <span role="alert" className="text-[13px] text-bad">⚠ {loi}</span>}
        </div>
      )}
    </>
  );
}

/** Mở lại Case đã hoàn thành (v16 h3) — QL / QT / người đã hoàn thành; Case hệ thống đóng nói đường mở. */
function MoLaiCase({ data, onXong }: { data: CaseDetail; onXong: () => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const moLai = async () => {
    setBusy(true);
    try { await api.post(`/cases/${data.id}/mo-lai`); invalidate('/cases'); invalidate('/my-work'); invalidate('/students'); toast.push('ok', t('Đã mở lại Case')); onXong(); }
    catch (e: any) { toast.push('error', e?.message ?? t('Không mở lại được')); } finally { setBusy(false); }
  };
  if (data.viewer.coTheMoLai) return <div className="ket-luan"><button type="button" className="btn min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void moLai()}>{busy ? t('Đang mở lại…') : t('Mở lại')}</button></div>;
  if (data.systemCloseLabel && data.viewer.canApprove) {
    return <p className="m-0 pt-1 text-[13px] text-slate-400">{
      data.systemCloseReason === 'course_ended' ? t('Hệ thống đóng — Hoàn tác Kết thúc học để mở')
        : data.systemCloseReason === 'cho_chot_sos' ? t('Hệ thống đóng — Case mới tạo khi chốt lượt')
        : data.systemCloseReason === 'overall_dat' ? t('Hệ thống đóng — Overall đã đạt')
        : t('Hệ thống đóng · {lyDoHeThong}', { lyDoHeThong: dich(data.systemCloseLabel) })}</p>;
  }
  return null;
}

/**
 * Xoá Case (v16 f3 · g2, N37) — hàng riêng cuối thân. 'ngay': Case còn PA → hỏi MỘT lần tại chỗ nêu đúng các PA; chưa có PA → xoá luôn; xong → dải Hoàn tác (nơi gọi).
 * 'xin' (Case SOS / còn PA quy chế): "Đề nghị QL xoá Case" 1 bấm gửi → "Chờ QL duyệt xoá Case · Rút lại" (người gửi); QL mở Case: duyệt tại chỗ.
 */
function XoaCase({ data, toi, onXong, onDaXoa }: { data: CaseDetail; toi: number | null; onXong: () => void; onDaXoa: (x: { thungRacId: number | null; ten: string; soPa: number }) => void }) {
  const toast = useToast();
  const [hoi, setHoi] = useState(false);
  const [busy, setBusy] = useState(false);
  const vw = data.viewer;
  const pas = data.interventions ?? [];
  const tenCase = (() => { const x = data.title ?? tenNganCase(data); const kn = data.categoryLabel; return kn && !x.startsWith(kn) ? `${kn} — ${x}` : x; })();
  /* P1 G2-01: sau khi Case đã xoá thật chỉ tải lại danh sách Case (`/cases?`) — `/cases/:id` của chính Case vừa xoá trả 404. */
  const lamMoi = (daXoa = false) => { invalidate(daXoa ? '/cases?' : '/cases'); invalidate('/students'); invalidate('/my-work'); invalidate('/tong-quan'); invalidate('/yeu-cau'); };
  const gui = async () => {
    setBusy(true);
    try {
      const r = await api.del<{ thungRacId?: number; choDuyet?: boolean }>(`/cases/${data.id}`);
      setHoi(false);
      if (r?.choDuyet) { lamMoi(); onXong(); return; }
      onDaXoa({ thungRacId: r?.thungRacId ?? null, ten: tenCase, soPa: pas.length });
      lamMoi(true);
    } catch (e: any) { toast.push('error', e?.message ?? t('Không xoá được')); } finally { setBusy(false); }
  };
  const the = vw.theXoa ?? null;
  if (the) {
    return (
      <div className="cuoi-case">
        {vw.canApprove ? <div className="w-full"><TheYeuCau gon yc={the} onXong={onXong} /></div> : (
          <div className="cho-xoa w-full"><span><b>{t('Chờ QL duyệt xoá Case')}</b> · {t('gửi {ngay}', { ngay: (the.taoLuc ?? '').slice(8, 10) + '/' + (the.taoLuc ?? '').slice(5, 7) })}</span>
            {the.nguoiXinId === toi && <span className="phai"><RutLai id={the.id} onXong={onXong} /></span>}</div>
        )}
      </div>
    );
  }
  if (!vw.xoa) return null;
  return (
    <div className="cuoi-case">
      {!hoi && <NutXoa busy={busy} onClick={() => (vw.xoa === 'ngay' && pas.length > 0 ? setHoi(true) : void gui())}>{vw.xoa === 'xin' ? t('Đề nghị QL xoá Case') : t('Xoá Case')}</NutXoa>}
      {/* G2-14: lý do chặn đặt tại nút — QL đã từ chối lần xin trước. */}
      {!hoi && vw.xoa === 'xin' && vw.tuChoiXoa && (
        <span className="text-[13px] text-slate-400">{vw.tuChoiXoa.lyDo ? t('QL từ chối xoá · {lyDo}', { lyDo: vw.tuChoiXoa.lyDo }) : t('QL từ chối xoá')}</span>
      )}
      {hoi && (
        <div className="hoi-xoa" role="alertdialog" aria-label={t('Xoá Case')}>
          <span>{t('Xoá Case')} <b>{tenCase}</b> {t('và')} <b>{t('{n} PA', { n: pas.length })}</b> ({pas.map((x: any) => dichDu(x.description) || dich(INTERVENTION_KIND_LABEL[x.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? x.kind)).join(', ')})? {t('Vào Thùng rác, khôi phục được.')}</span>
          <span className="hang">
            <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => setHoi(false)}>{t('Đóng')}</button>
            <button type="button" className="btn btn-sm nut-do min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void gui()}>{busy ? t('Đang xoá…') : t('Xoá Case + {n} PA', { n: pas.length })}</button>
          </span>
        </div>
      )}
    </div>
  );
}

/** "Rút lại" đề nghị xoá (XM1) — người gửi, thẻ QL chưa trả lời (`POST /yeu-cau/:id/rut`, máy chủ kiểm đúng người gửi). */
function RutLai({ id, onXong }: { id: number; onXong: () => void }) {
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const rut = async () => {
    setBusy(true); setLoi(null);
    try { await api.post(`/yeu-cau/${id}/rut`); invalidate('/cases'); invalidate('/yeu-cau'); invalidate('/my-work'); onXong(); }
    catch (e: any) { setLoi(e?.message ?? t('Không lưu được')); setBusy(false); }
  };
  return <>{loi && <span role="alert" className="text-[13px] text-bad">⚠ {loi}</span>}<button type="button" className="link-nho" disabled={busy} onClick={() => void rut()}>{busy ? t('Đang lưu…') : t('Rút lại')}</button></>;
}

/** "Xoá kết quả" (v16 d2 · n5) — cờ máy chủ `f.xoa`: 'ngay' vào Thùng rác + toast Hoàn tác; 'xin' (PA quy chế) gửi QL duyệt. Bị chặn → câu máy chủ. */
function NutXoaKetQua({ f, onXong }: { f: { id: number; xoa: 'ngay' | 'xin' | null }; onXong: () => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  if (!f.xoa) return null;
  const lamMoi = () => { invalidate('/cases'); invalidate('/students'); invalidate('/my-work'); invalidate('/yeu-cau'); invalidate('/tong-quan'); onXong(); };
  const xoa = async () => {
    setBusy(true);
    try {
      const r = await api.del<{ thungRacId?: number; choDuyet?: boolean }>(`/followups/${f.id}`);
      lamMoi();
      if (r?.choDuyet) toast.push('ok', t('Đã gửi QL duyệt xoá kết quả PA'));
      else hoanTacXoa(toast, r?.thungRacId, t('Đã xoá kết quả PA'), lamMoi);
    } catch (e: any) { toast.push('error', e?.message ?? t('Không xoá được')); } finally { setBusy(false); }
  };
  return <NutXoa busy={busy} onClick={() => void xoa()}>{f.xoa === 'xin' ? t('Đề nghị QL xoá kết quả') : t('Xoá kết quả')}</NutXoa>;
}

/** U02 dòng 7 (N35, `00` 21 "Mô tả dài"): mô tả = đoạn trích vạch trái (`.trich`); dài ≤ 3 dòng + "Xem đầy đủ" tại chỗ — không cắt dữ liệu lưu; nút Dịch nằm trong chữ (ChuDich) như cũ. */
function MoTaGon({ dai, children }: { dai: boolean; children: ReactNode }) {
  const [du, setDu] = useState(false);
  return (
    <>
      <p className={`trich ${dai && !du ? 'trich-3' : ''}`}>{children}</p>
      {dai && (
        <button type="button" className="link appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold max-sm:min-h-[44px]" aria-expanded={du} onClick={() => setDu(!du)}>
          {du ? t('Thu gọn') : t('Xem đầy đủ')}
        </button>
      )}
    </>
  );
}

const IC_PA = <svg viewBox="0 0 16 16" aria-hidden><path d="M4 6l4 4 4-4" /></svg>;

/**
 * THẺ PA (v16 d1 · d2 · e1–e3 · f1 · g1 · g2 · j2 · j3 · n3–n5): đầu thẻ là MỘT nút (aria-expanded) — tên · dòng phụ (quy chế · mốc · người dạy · buổi · KQ) · trạng thái
 * là NÚT LÀM VIỆC (Xác nhận PA / Ghi kết quả) khi tới việc của người xem · ▾. Thẻ mở = xem đủ + sửa từng trường tại chỗ (Nội dung ≤ 200 · Số buổi ≥ đã dạy · Người dạy ·
 * Bắt đầu khoá khi đã có kết quả; Loại không sửa — ⓘ), Kết quả gần nhất (bấm để sửa · Xoá kết quả), Nhật ký. PA chờ xác nhận: thẻ mở CHÍNH LÀ form xác nhận.
 * Chân thẻ: Xoá PA / Đề nghị QL xoá PA (+ Rút lại) · Kết thúc sớm… · Mở lại PA · Ghi kết quả / Cập nhật trước hạn. Không ⋯, không panel lồng panel.
 */
function ThePa({ iv, data, homNay, ngan, toi, mo, setMo, form, setForm, dich: laDich, vua, onHoanTac, onXongForm, onDoi, lamMoi, onDaXoa, kyNangTiep }: {
  iv: any; data: CaseDetail; homNay: string; ngan: (d: string | null | undefined) => string; toi: number | null;
  mo: boolean; setMo: (v: boolean) => void; form: FormThe | null; setForm: (f: FormThe | null) => void;
  dich: boolean; vua: VuaDoiPa | null; onHoanTac: () => void; onXongForm: (x?: DaLuuPanel) => void;
  onDoi: (d: CaseDetail) => void; lamMoi: () => void; onDaXoa: (x: { ten: string; thungRacId: number | null }) => void;
  kyNangTiep: { ten: string; di: () => void } | null;
}) {
  const toast = useToast();
  const bao = useContext(BaoLuuCase);
  const [sua, setSua] = useState<'noiDung' | 'buoi' | 'nguoi' | 'batDau' | null>(null);
  useEffect(() => { if (!mo) setSua(null); }, [mo]);   // gập thẻ = thôi ô đang sửa (chữ đã tự lưu)
  const [busyXoa, setBusyXoa] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const vw = data.viewer;
  const caseXong = data.status === 'done';
  const nut = nutDongPa(iv, { caseXong, coTheKetThucPa: vw.coTheKetThucPa });
  const tenLoai = dich(INTERVENTION_KIND_LABEL[iv.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? iv.kind);
  const tenPa = dichDu(iv.description) || tenLoai;
  const ketQua = data.followups ?? [];
  const fGan = ketQua.find((f: any) => f.interventionId === iv.id && f.outcome) ?? null;
  const fSua = ketQua.find((f: any) => f.interventionId === iv.id && f.nextStep && f.suaDuoc) ?? null;
  const coKetQua = ketQua.some((f: any) => f.interventionId === iv.id);
  const dangChay = iv.status === 'started' || iv.status === 'planned';
  const choDuyet = iv.approvalState === 'pending';
  const xacNhanDuoc = !!(vw.canEdit && iv.awaitingConfirmation && data.sos?.hasCause) && !caseXong;
  const hanGhi = iv.actionDue && dangChay ? deadlineView({ kind: 'cap-nhat-pa', due: iv.actionDue, today: homNay }) : null;
  const toiKy = toiKyGhi(iv.actionDue, homNay);
  const ghiDuoc = nut.ketQua && !iv.awaitingConfirmation && !iv.chuaChay && iv.ghiDuoc !== false;
  const theXoa = iv.theXoa ?? null;
  const dem = iv.soBuoi != null ? demBuoi(iv.daDay ?? 0, iv.soBuoi) : null;
  const all: any[] = data.interventions ?? [];
  const thayBang = iv.supersededBy && iv.closedReason ? all.find((x) => x.id === iv.supersededBy) ?? null : null;
  const thayCho = all.find((x) => x.supersededBy === iv.id && x.closedReason) ?? null;
  const tenCua = (x: any) => dichDu(x.description) || dich(INTERVENTION_KIND_LABEL[x.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? x.kind);
  /* Thẻ PA chờ xác nhận mở = form xác nhận (điền sẵn). */
  const formHien: FormThe | null = form ?? (mo && xacNhanDuoc ? 'xac-nhan' : null);

  const phu = [iv.preset ? [t('Theo quy chế'), iv.mocChu ? dich(iv.mocChu) : null].filter(Boolean).join(' · ') : null,
    coNguoiDay(iv.kind) ? (iv.performer ? `${nhanNguoiDay(iv.kind) === 'Người dạy' ? t('người dạy') : t('thực hiện')} ${iv.performer}` : t('chưa chọn người dạy')) : null,
    dem ? t('{da}/{tong} buổi', { da: dem.da, tong: dem.tong }) : null,
    fGan ? t('KQ {tuan}', { tuan: tuanLich(fGan.observedOn, homNay) }) : null,
    !dangChay && iv.startedDate && iv.completedDate ? chuKhoangPa({ startedOn: iv.startedDate, completedOn: iv.completedDate }, homNay) : null].filter(Boolean).join(' · ');

  /* Trạng thái = nút làm việc khi tới việc của người xem; còn lại viên xám + chấm màu (V4 ③). */
  const vien = (chu: string, cham: string) => <span className="tt-pa" style={{ ['--cham' as any]: cham }}>{chu}</span>;
  const trangThai = theXoa ? vien(t('Chờ QL duyệt xoá'), 'rgb(var(--soon-rgb))')
    : formHien === 'ghi' ? vien(t('Đang ghi kết quả'), 'rgb(var(--soon-rgb))')
    : iv.awaitingConfirmation ? (xacNhanDuoc && !mo ? <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setForm('xac-nhan')}>{iv.chonPa ? t('Chọn PA') : t('Xác nhận PA')}</button> : vien(iv.chonPa ? t('Chờ chọn PA') : t('Chờ xác nhận'), 'rgb(var(--doing-rgb))'))
    : choDuyet || (iv.preset && !iv.confirmedAt && iv.status === 'planned' && iv.doiPa?.trangThai === 'cho') ? vien(t('Chờ Quản lý duyệt'), 'rgb(var(--soon-rgb))')   // PA quy chế chưa chạy chờ QL duyệt đổi / giữ PA GV
    : iv.chuaChay ? vien(t('Chưa bắt đầu'), 'var(--text-faint)')
    : dangChay ? (ghiDuoc && toiKy && !mo
      ? <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setForm('ghi')}>{iv.lanCuoi ? t('Ghi kết quả cuối') : t('Ghi kết quả')}</button>
      : data.tamDungTu && hanGhi ? <NhanTamDung tu={data.tamDungTu} />
      : hanGhi?.tone === 'overdue' ? vien(`⚠ ${hanGhi.quaHan ?? ''}`, 'rgb(var(--bad-rgb))')
      : vien(hanGhi ? t('Đang chạy · KQ hạn {ngay}', { ngay: ngan(iv.actionDue) }) : t('Đang chạy'), 'var(--accent)'))
    : fGan ? <span className={`ket ${LOP_KET[OUTCOME_TONE[fGan.outcome as keyof typeof OUTCOME_TONE]] ?? 'cd'}`}>{dich(outcomeLabelFor(fGan.outcome))}</span>
    : vien(t('Đã khép'), 'var(--text-faint)');

  /* Sửa một trường PA tại chỗ — chỉ gửi trường đó (`thanSuaPa`), máy chủ trả Case → thay dữ liệu, không tải lại cả Case. */
  const goc = giaTriCuaPa(iv);
  const luuTruong = async (p: Partial<GiaTriPa>, ngay?: string) => {
    const v = { ...goc, ...p };
    const loiPa = loiFormPa(v, { daDay: iv.daDay ?? 0, goc });
    if (loiPa.length) throw new Error(loiPa[0].lyDo ?? loiPa[0].nhan);
    const body = thanSuaPa(v, goc, { moi: ngay ?? '', cu: iv.startedDate ?? null });
    if (!Object.keys(body).length) return;
    const d = await api.patch<CaseDetail>(`/interventions/${iv.id}`, body);
    onDoi(d);
  };
  const luuNgay = async (fn: () => Promise<void>) => {
    setLoi(null); bao({ tt: 'dang' });
    try { await fn(); bao({ tt: 'da', luc: gioLuu() }); setSua(null); } catch (e: any) { bao({ tt: 'loi' }); setLoi(e?.message ?? t('Không lưu được')); }
  };

  const xoaPa = async () => {
    setBusyXoa(true);
    try {
      const r = await api.del<{ thungRacId?: number; choDuyet?: boolean }>(`/interventions/${iv.id}`);
      invalidate('/students'); invalidate('/my-work'); invalidate('/yeu-cau'); invalidate('/tong-quan');
      if (r?.choDuyet) lamMoi(); else onDaXoa({ ten: tenPa, thungRacId: r?.thungRacId ?? null });
    } catch (e: any) { toast.push('error', e?.message ?? t('Không xoá được')); } finally { setBusyXoa(false); }
  };
  const moLaiPa = async () => {
    try { await api.post(`/interventions/${iv.id}/hoan-tac-ket-thuc`); toast.push('ok', t('Đã mở lại PA')); lamMoi(); }
    catch (e: any) { toast.push('error', e?.message ?? t('Chưa hoàn tác được — thử lại.')); }
  };

  const chung = { hocVien: data.student?.name ?? null, lop: null, onClose: () => { setForm(null); if (iv.awaitingConfirmation) setMo(false); } };
  const formThan = !formHien ? null : (
    <KhungTrongThe.Provider value>
      {formHien === 'xac-nhan' ? <XacNhanPaPanel key="xn" {...chung} pa={iv as PaQuyChe} data={data} onXong={onXongForm} onGhiKetQua={iv.kind === 'tutor' && iv.soBuoi == null ? undefined : () => setForm('ghi')} />   /* RKC-2b ③: Tutor chưa có Số buổi — xác nhận ở form (máy chủ đòi Số buổi) */
        : formHien === 'ghi' ? (
          <GhiKetQuaPanel key="ghi" {...chung} onSaved={onXongForm} vuotLuat={!!data.viewer.canApprove}
            hoanThanhCase={paCuoiHoanThanh(data, iv.id) ? { caseId: data.id } : null}
            tiep={kyNangTiep ? { ten: kyNangTiep.ten, lam: (x) => { toast.push('ok', x?.chu ?? t('Đã lưu')); lamMoi(); kyNangTiep.di(); } } : undefined} chuTiep={t('Lưu · kỹ năng tiếp ›')}
            boiCanh={[[t('Kết quả kỳ trước'), fGan ? <><b className="font-semibold text-slate-300">{dich(outcomeLabelFor(fGan.outcome))}</b> · {tuanLich(fGan.observedOn, homNay)}</> : t('chưa có')], [t('Điểm'), ketQuaGanNhat(data)]]}
            pa={{
              id: iv.id, kind: iv.kind, description: iv.description ?? null, performer: iv.performer ?? null, performerUserId: iv.performerUserId ?? null,
              actionDue: iv.actionDue ?? null, miniTestHan: iv.miniTestHan ?? null, cycleNo: iv.cycleNo ?? null,
              batBuoc: !!iv.batBuoc, lanCuoi: !!iv.lanCuoi, mocChu: iv.mocChu ?? null, soBuoi: iv.soBuoi ?? null, daDay: iv.daDay ?? 0,
              laMacDinh: laPaMacDinh(iv), doiPaCho: iv.doiPa?.trangThai === 'cho', choXacNhan: !!iv.awaitingConfirmation,
              nhap: iv.nhapKetQua ?? null,
            }} />
        ) : formHien === 'ket-thuc' ? <KetThucSom iv={iv} hoanThanhCase={paCuoiHoanThanh(data, iv.id) ? { caseId: data.id } : null} onThoi={() => setForm(null)} onXong={() => { setForm(null); lamMoi(); }} />
        : <SuaKetQuaPanel key={`sua-${formHien.suaKq}`} followupId={formHien.suaKq} {...chung} onSaved={onXongForm} />}
    </KhungTrongThe.Provider>
  );

  const tt = (ma: typeof sua) => sua === ma;
  const fld = (
    <dl className="fld">
      <dt>{t('Loại')}</dt>
      <dd><span>{tenLoai}</span>{iv.preset && <span className="the-phu nhat">{t('theo quy chế')}{iv.mocChu ? ` · ${dich(iv.mocChu)}` : ''}</span>}
        {nut.sua && <NutLuat label={t('Đổi loại PA')}>{iv.preset ? t('Loại không sửa được. PA quy chế: Đề xuất PA khác.') : t('Loại không sửa được. Đổi loại: Ghi kết quả › Điều chỉnh › Thay PA.')}</NutLuat>}</dd>
      <dt>{t('Nội dung')}</dt>
      <dd>{tt('noiDung')
        ? <OGoTuLuu dau={iv.description ?? ''} toiThieu={CHU_TOI_THIEU_CASE} toiDa={TRAN_CHU.noiDungPa} nhan={t('Nội dung PA')} luu={(x) => luuTruong({ description: x })} onDong={() => setSua(null)} />
        : iv.description
          ? <GiaTriSua kieu="chu" nhan={t('Sửa nội dung PA')} sua={nut.sua} onClick={() => setSua('noiDung')}><ChuDich chu={iv.description} nguon={{ bang: 'case_interventions', id: iv.id, cot: 'description' }} /></GiaTriSua>
          : <GiaTriSua kieu="chu" nhan={t('Sửa nội dung PA')} sua={nut.sua} onClick={() => setSua('noiDung')}><span className="text-faint">{t('Chưa có')}</span></GiaTriSua>}</dd>
      {iv.soBuoi != null && <>
        <dt>{t('Số buổi')}</dt>
        <dd>{tt('buoi')
          ? <OGoTuLuu mot dau={String(iv.soBuoi)} toiThieu={1} toiDa={3} nhan={t('Số buổi')} luu={(x) => luuTruong({ soBuoi: x })} onDong={() => setSua(null)} />
          : <GiaTriSua kieu="go" nhan={t('Sửa số buổi')} sua={nut.sua} onClick={() => setSua('buoi')}><span className="tabular-nums">{t('{n} buổi', { n: iv.soBuoi })}</span></GiaTriSua>}
          {dem && <span className="flex items-center gap-2 text-[13px] text-slate-300"><VachBuoi da={dem.da} tong={dem.tong} tt={dem.tt} />{t('đã dạy {da}', { da: dem.da })}{dem.tt === 'du' ? ` · ${t('đủ buổi')}` : dem.tt === 'vuot' ? ` · ${t('vượt {x}', { x: dem.da - dem.tong })}` : ` · ${t('còn {n}', { n: dem.con })}`}</span>}</dd>
      </>}
      {coNguoiDay(iv.kind) && <>
        <dt>{nhanNguoiDay(iv.kind) === 'Người dạy' ? t('Người dạy') : t('Thực hiện')}</dt>
        <dd>
          {/* G2-09: PA không dạy (Tăng cường bài tập, Xếp tự học…) — "người thực hiện", không "người dạy". */}
          <GiaTriSua kieu="chon" nhan={nhanNguoiDay(iv.kind) === 'Người dạy' ? t('Đổi người dạy') : t('Đổi người thực hiện')} sua={nut.sua} mo={tt('nguoi')} onClick={() => setSua(tt('nguoi') ? null : 'nguoi')}>
            {iv.performer ? <>{iv.performer}{iv.byProxy && iv.recordedBy ? <span className="ban"> {t('({recordedBy} nhập hộ)', { recordedBy: iv.recordedBy })}</span> : null}</> : <span className="font-semibold text-soon">{t('Chưa chọn')}</span>}
          </GiaTriSua>
          {tt('nguoi') && (
            <div className="w-full basis-full"><div className="sm:max-w-[340px]">
              <ChonNguoi nhom="giao_vien" studentId={data.student?.id} value={null} tuMo ariaLabel={dich(nhanNguoiDay(iv.kind))} placeholder={t('Gõ tên để tìm')}
                onChange={(x) => void luuNgay(async () => { const d = await api.patch<CaseDetail>(`/interventions/${iv.id}`, datLaiNguoi(x)); onDoi(d); })} />
            </div></div>
          )}
        </dd>
      </>}
      <dt>{t('Bắt đầu')}</dt>
      {/* RKC-2b: đổi Ngày bắt đầu cả khi đã có kết quả — máy chủ chỉ chặn ngày SAU lần ghi đầu (câu báo tại ô). */}
      <dd>{!nut.sua
        ? <span className="tabular-nums">{iv.startedDate ? (iv.completedDate ? chuKhoangPa({ startedOn: iv.startedDate, completedOn: iv.completedDate }, homNay) : `${tuanLich(iv.startedDate, homNay)} · ${ngan(iv.startedDate)}`) : '—'}</span>
        : tt('batDau')
          ? <ONgay kieu="ngay" value={iv.startedDate ?? ''} ariaLabel={t('Bắt đầu')} onChange={(x) => { if (x && x !== iv.startedDate) void luuNgay(() => luuTruong({}, x)); }} />
          : <GiaTriSua kieu="go" nhan={t('Đổi ngày bắt đầu')} onClick={() => setSua('batDau')}><span className="tabular-nums">{iv.startedDate ? `${tuanLich(iv.startedDate, homNay)} · ${ngan(iv.startedDate)}` : t('Chưa đặt')}</span></GiaTriSua>}</dd>
      {!iv.awaitingConfirmation && <>
        <dt>{t('Kết quả')}</dt>
        <dd>{fGan ? <>
          <GiaTriSua kieu="go" nhan={t('Sửa kết quả {tuan}', { tuan: tuanLich(fGan.observedOn, homNay) })} sua={!!fSua && fSua.id === fGan.id} onClick={() => setForm({ suaKq: fGan.id })}>   {/* RKC-2b: Case xong vẫn sửa (đổi lựa chọn: máy chủ hỏi Mở lại) */}
            <span className={`ket ${LOP_KET[OUTCOME_TONE[fGan.outcome as keyof typeof OUTCOME_TONE]] ?? 'cd'}`}>{dich(outcomeLabelFor(fGan.outcome))}</span>
            <span className="text-[13px] text-slate-300">{tuanLich(fGan.observedOn, homNay)}{fGan.note ? <> · “<ChuDich chu={fGan.note} nguon={{ bang: 'case_followups', id: fGan.id, cot: 'note' }} />”</> : null}</span>
          </GiaTriSua>
          <NutXoaKetQua f={fGan} onXong={lamMoi} />
        </> : <span className="text-slate-300">{t('Chưa có')}{hanGhi ? ` · ${t('hạn {ngay}', { ngay: ngan(iv.actionDue) })}` : ''}</span>}</dd>
      </>}
      <dt>{t('Nhật ký')}</dt>
      <dd><NhatKyPa pa={iv} ketQua={ketQua} /></dd>
    </dl>
  );

  const xoaNut = theXoa ? (
    <span className="cho-xoa w-full"><span><b>{t('Chờ QL duyệt xoá PA')}</b> · {t('gửi {ngay}', { ngay: ngan(theXoa.taoLuc) })} · {t('PA vẫn chạy')}</span>
      {theXoa.nguoiXinId === toi && <span className="phai"><RutLai id={theXoa.id} onXong={lamMoi} /></span>}</span>
  ) : nut.xoa ? <NutXoa busy={busyXoa} onClick={() => void xoaPa()}>{iv.xoa === 'xin' ? t('Đề nghị QL xoá PA') : t('Xoá PA')}</NutXoa> : null;
  const chanThe = formHien || (!xoaNut && !nut.ketThuc && !iv.coTheHoanTacKetThuc && !ghiDuoc) ? null : (
    <div className="pa-chan">
      <span className="trai">{!(theXoa && vw.canApprove) && xoaNut}
        {nut.ketThuc && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setForm('ket-thuc')}>{t('Kết thúc sớm…')}</button>}</span>
      {iv.coTheHoanTacKetThuc && <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={() => void moLaiPa()}>{t('Mở lại PA')}</button>}
      {ghiDuoc && (toiKy
        ? <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={() => setForm('ghi')}>{iv.lanCuoi ? t('Ghi kết quả cuối') : t('Ghi kết quả')}</button>
        : <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={() => setForm('ghi')}>{t('Cập nhật trước hạn')}</button>)}
    </div>
  );

  return (
    <div className={`the-pa ${mo ? 'mo' : ''} ${vua || laDich ? 'moi-doi' : ''}`} data-pa-id={iv.id} style={dangChay || choDuyet || vua || mo ? undefined : { opacity: 0.85 }}>
      <div className="pa-dau">
        <button type="button" className="pa-bam" aria-expanded={mo} onClick={() => { setMo(!mo); if (mo) setForm(null); }}>
          <span className="ten-pa">{tenLoai}</span>
          {phu && <span className="phu-pa">{phu}</span>}
        </button>
        <span className="pa-tt">{trangThai}</span>
        <button type="button" className="mui-pa" aria-expanded={mo} aria-label={mo ? t('Gập PA {ten}', { ten: tenLoai }) : t('Mở PA {ten}', { ten: tenLoai })}
          onClick={() => { setMo(!mo); if (mo) setForm(null); }}>{IC_PA}</button>
      </div>
      {/* Chủ SP 13/11: lưu kết quả xong không Hoàn tác — "Sửa" mở ngay form Sửa kết quả (lần ghi gần nhất sửa được). */}
      {vua && !mo && <div className="px-3.5 pb-2"><DaiVuaDoi x={vua} onHoanTac={onHoanTac} onSua={fSua ? () => { setMo(true); setForm({ suaKq: fSua.id }); } : undefined} /></div>}
      {!mo && <DongDoiPaGon iv={iv} data={data} ngan={ngan} onDoi={lamMoi} />}
      {mo && (
        <div className="pa-than">
          {formHien && iv.description && <p className="m-0 pt-2.5 text-sm text-slate-300">{dichDu(iv.description)}</p>}
          {formThan}
          {!formHien && <>
            {theXoa && vw.canApprove && <div className="pt-2.5"><TheYeuCau gon yc={theXoa} onXong={lamMoi} /></div>}
            {vw.canApprove && iv.yeuCau && (iv.yeuCau.loai === 'de_xuat_pa' || iv.yeuCau.loai === 'giu_pa_gv') && <div className="pt-2.5"><TheYeuCau gon yc={iv.yeuCau} onXong={lamMoi} /></div>}
            <div className="pt-1"><DongDoiPa iv={iv} data={data} ngan={ngan} onDoi={lamMoi} /></div>
            {fld}
            {loi && <p role="alert" className="m-0 text-[13px] text-bad">⚠ {loi}</p>}
            {choDuyet && !(vw.canApprove && iv.yeuCau) && (
              <p className="m-0 text-xs text-slate-400">{t('Đang chờ Quản lý trả lời{x} — thời gian chờ tính cho Quản lý.', { x: iv.approvalDue ? t(' · hạn {ngan}', { ngan: ngan(iv.approvalDue) }) : '' })}</p>
            )}
            {iv.approvalNote && <p className="m-0 border-l pl-3 text-xs text-slate-300" style={{ borderColor: 'var(--line)' }}>{t('Quản lý{x}: {approvalNote}', { x: iv.approvedBy ? ` (${iv.approvedBy})` : '', approvalNote: iv.approvalNote })}</p>}
            <DongXinYKien x={iv.xinYKien} ngan={ngan} />
            {iv.kind === 'bo_tro' && data.boTro?.chung && data.boTro.mon.length > 1 && <p className="m-0 text-xs text-slate-400">{t('PA chung · {x}', { x: data.boTro.mon.map((m) => m.tenMon).join(', ') })}</p>}
            {(thayCho || thayBang) && <p className="m-0 text-xs text-slate-400">{[thayCho && t('Thay cho: {tenPA}', { tenPA: tenCua(thayCho) }), thayBang && t('Được thay bằng: {tenPA}', { tenPA: tenCua(thayBang) })].filter(Boolean).join(' · ')}</p>}
          </>}
        </div>
      )}
      {mo && chanThe}
    </div>
  );
}

/** Thẻ gập: đề xuất đổi PA đang chờ vẫn thấy ("Chờ duyệt đổi PA → …") — mở thẻ thấy đủ + Rút. */
function DongDoiPaGon({ iv, ngan }: { iv: any; data: CaseDetail; ngan: (d: string | null | undefined) => string; onDoi: () => void }) {
  const d = iv.doiPa as { trangThai: 'cho' | 'tu_choi'; loaiMoi: string; guiLuc: string; giuPaGv?: boolean } | null;
  if (!d) return null;
  const tenMoi = dich(INTERVENTION_KIND_LABEL[d.loaiMoi as keyof typeof INTERVENTION_KIND_LABEL] ?? d.loaiMoi);
  return (
    <p className="m-0 px-3.5 pb-2 text-[13px] text-slate-300">
      {d.trangThai === 'cho' ? <>{d.giuPaGv ? t('Chờ QL duyệt PA của GV') : t('Chờ duyệt đổi PA')} → <b className="font-semibold text-slate-100">{tenMoi}</b> · {t('gửi {ngay}', { ngay: ngan(d.guiLuc) })}</>
        : <b className="font-semibold text-late">{t('QL từ chối đổi PA')}</b>}
    </p>
  );
}

/**
 * #3 (G2-05): PA `paId` là PA CUỐI còn chạy của Case (không PA planned / started nào khác), Case chưa xong, người xem hoàn thành được Case (cùng điều kiện
 * nút Hoàn thành Case: `canClose`, không Case tạm SOS).
 */
function paCuoiHoanThanh(data: CaseDetail, paId: number): boolean {
  /* `hoanThanh.an` (PA quy chế chưa khép) không xét: PA đó chính là PA đang kết thúc ở form này (đã đòi không còn PA nào khác chạy). */
  if (data.status === 'done' || !data.viewer.canClose || data.sos?.tam) return false;
  return !(data.interventions ?? []).some((x: any) => x.id !== paId && (x.status === 'planned' || x.status === 'started'));
}

/**
 * "Kết thúc sớm…" (v16 j3, OV-13a C): lý do ≥ 10 ngay trong thẻ → Kết thúc PA · toast Hoàn tác (như cũ) + "Mở lại PA" về sau.
 * Rà 11/11 (việc để sau của #3): PA quy chế là PA cuối còn chạy và người xem hoàn thành được Case → ô "Hoàn thành Case" như form Kết thúc PA
 * (mức chọn — kết thúc sớm không có Tiến triển để gợi; kết luận điền sẵn lý do, sửa được). Hoàn tác đảo cả hai bước.
 */
function KetThucSom({ iv, hoanThanhCase, onThoi, onXong }: { iv: any; hoanThanhCase?: { caseId: number } | null; onThoi: () => void; onXong: () => void }) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const [lyDo, setLyDo] = useState('');
  const [thu, setThu] = useState(false);
  const [busy, setBusy] = useState(false);
  const [htCase, setHtCase] = useState(false);
  const [htMuc, setHtMuc] = useState<string>('');
  const [htNote, setHtNote] = useState<string | null>(null);
  const ngan = lyDo.trim().length < LY_DO_KET_THUC_PA_TOI_THIEU;
  const coHt = !!hoanThanhCase && htCase;
  const noteHt = htNote ?? lyDo;
  const loiMuc = coHt && !htMuc ? t('Chọn mức') : null;
  const loiKetLuan = coHt && noteHt.trim().length < CHU_TOI_THIEU_CASE ? t('Ít nhất {n} ký tự', { n: CHU_TOI_THIEU_CASE }) : null;
  useBaoDangSua(!!lyDo.trim());
  const key = `ket-thuc-pa-${iv.id}`;
  const lamMoi = () => { invalidate('/cases'); invalidate('/students'); invalidate('/my-work'); invalidate('/yeu-cau'); invalidate('/tong-quan'); };
  const ketThuc = async () => {
    setThu(true);
    if (ngan || loiMuc || loiKetLuan) return;
    setBusy(true);
    try {
      await api.post(`/interventions/${iv.id}/ket-thuc`, { lyDo: lyDo.trim() });
      /* PA đã kết thúc → hoàn thành Case cùng lần bấm. Lỗi bước này không mất bước trước: nói rõ "chưa hoàn thành Case" (nút Hoàn thành Case vẫn ở Case). */
      let daHt = false;
      if (coHt && hoanThanhCase) {
        try { await api.post(`/cases/${hoanThanhCase.caseId}/outcome`, { outcome: htMuc, note: noteHt.trim(), closedOn: homNay || undefined }); daHt = true; }
        catch (e: any) { toast.push('error', t('Đã kết thúc PA · chưa hoàn thành Case: {loi}', { loi: e?.message ?? t('Không lưu được') })); }
      }
      lamMoi();
      toast.hoanTac(daHt ? t('Đã kết thúc PA · đã hoàn thành Case') : t('Đã kết thúc PA'), async () => {
        try {
          if (daHt && hoanThanhCase) await api.post(`/cases/${hoanThanhCase.caseId}/mo-lai`);
          await api.post(`/interventions/${iv.id}/hoan-tac-ket-thuc`);
          lamMoi(); toast.push('ok', t('Đã mở lại PA'), { key });
        } catch (e: any) { toast.push('error', e?.message ?? t('Chưa hoàn tác được — thử lại.'), { key }); }
      }, { key });
      onXong();
    } catch (e: any) { toast.push('error', e?.message ?? t('Không lưu được')); } finally { setBusy(false); }   // lỗi: giữ chữ đang gõ
  };
  return (
    <div className="flex flex-col gap-3 pt-3">
      <p className="muc-h m-0">{t('Kết thúc PA sớm')}</p>
      <Truong nhan={t('Lý do')} batBuoc loi={thu && ngan ? t('Ít nhất {n} ký tự', { n: LY_DO_KET_THUC_PA_TOI_THIEU }) : null}>
        <textarea className="field w-full" rows={2} maxLength={500} value={lyDo} onChange={(e) => setLyDo(e.target.value)} autoFocus />
      </Truong>
      {hoanThanhCase && (
        <div className="flex flex-col gap-2.5">
          <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-[13px] font-semibold text-slate-200 sm:min-h-0">
            <input type="checkbox" className="h-4 w-4" checked={htCase} disabled={busy} onChange={(e) => setHtCase(e.target.checked)} />
            {t('Hoàn thành Case')}
          </label>
          {htCase && (
            <div className="ml-1 space-y-3 border-l-2 pl-3" style={{ borderColor: 'var(--accent-line)' }}>
              <Truong nhan={t('Sau cả đợt hỗ trợ, em tiến bộ đến đâu?')} batBuoc as="div" loi={thu ? loiMuc : null}>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group">
                  {CASE_OUTCOMES.map((x) => (
                    <NutChon key={x} nho chon={htMuc === x} className="justify-center" onClick={() => setHtMuc(x)}>{CASE_OUTCOME_LABEL[x]}</NutChon>
                  ))}
                </div>
              </Truong>
              <Truong nhan={t('Kết luận')} batBuoc loi={thu ? loiKetLuan : null} dem={{ co: noteHt.trim().length, can: CHU_TOI_THIEU_CASE }}>
                <textarea className="field w-full" rows={2} maxLength={500} value={noteHt} readOnly={busy} onChange={(e) => setHtNote(e.target.value)} />
              </Truong>
            </div>
          )}
        </div>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" className="btn min-h-[44px] sm:min-h-0" disabled={busy} onClick={onThoi}>{t('Đóng')}</button>
        <button type="button" className="btn nut-do min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void ketThuc()}>{busy ? t('Đang lưu…') : t('Kết thúc PA')}</button>
      </div>
    </div>
  );
}

/** Mockup `.ket`: tone kết quả (OUTCOME_TONE) → lớp chip — tiến bộ rõ xanh · một phần / không đổi vàng · kém hơn đỏ · chưa đủ dữ liệu xám. */
const LOP_KET: Record<string, string> = { ok: 'tb', warn: 'mp', danger: 'ko', muted: 'cd' };

/** "✓ Đã thêm PA · Hoàn tác" ngay trong thẻ PA vừa đổi (Q1) — Hoàn tác 10 giây, gọi đường đảo của form (máy chủ kiểm lại quyền + thời gian). */
function DaiVuaDoi({ x, onHoanTac, onSua }: { x: VuaDoiPa; onHoanTac?: () => void; onSua?: () => void }) {
  const [con, setCon] = useState(!!x.hoanTac);
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  useEffect(() => {
    if (!con) return undefined;
    const h = setTimeout(() => setCon(false), 10_000);
    return () => clearTimeout(h);
  }, [con]);
  const bam = async () => {
    setBusy(true); setLoi(null);
    try { await x.hoanTac!(); onHoanTac?.(); } catch (e: any) { setLoi(e?.message ?? t('Không lưu được')); setBusy(false); }
  };
  return (
    <p role="status" className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 border-t pt-2 text-[13px]" style={{ borderColor: 'var(--line)' }}>
      <b className="font-semibold text-ok">✓ {x.chu}</b>
      {con && <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 font-semibold sm:min-h-0" disabled={busy} onClick={() => void bam()}>{busy ? t('Đang lưu…') : t('Hoàn tác')}</button>}
      {!con && onSua && <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 font-semibold sm:min-h-0" onClick={onSua}>{t('Sửa')}</button>}
      {loi && <span role="alert" className="text-bad">⚠ {loi}</span>}
    </p>
  );
}

/**
 * OV-13b (mockup OV-13 §8): dòng "Đề xuất PA khác" dưới PA gốc — chờ: "Chờ duyệt đổi PA → Tăng cường bài tập · PA gốc vẫn chạy · gửi … · QL hạn …" +
 * Rút (người gửi) / thẻ duyệt tại chỗ (QL); bị từ chối: "QL từ chối đổi PA: “…”" + Đề xuất lại (form ngay dưới).
 */
function DongDoiPa({ iv, data, ngan, onDoi }: { iv: any; data: CaseDetail; ngan: (d: string | null | undefined) => string; onDoi?: () => void }) {
  const d = iv.doiPa as { trangThai: 'cho' | 'tu_choi'; paMoiId: number; loaiMoi: string; guiLuc: string; hanDuyet: string | null; lyDoTuChoi: string | null; yeuCauId: number; laNguoiGui: boolean;
    /** SOS-TAM-PA: GV giữ PA của mình khác PA quy chế — quá hạn QL chưa trả lời thì chốt theo GV. */ giuPaGv?: boolean; lyDo?: string } | null;
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [lai, setLai] = useState(false);
  if (!d) return null;
  const tenMoi = dich(INTERVENTION_KIND_LABEL[d.loaiMoi as keyof typeof INTERVENTION_KIND_LABEL] ?? d.loaiMoi);
  const rut = async () => {
    setBusy(true); setLoi(null);
    try { await api.post(`/yeu-cau/${d.yeuCauId}/rut`); invalidate('/cases'); invalidate('/my-work'); invalidate('/yeu-cau'); onDoi?.(); } catch (e: any) { setLoi(e?.message ?? t('Không lưu được')); } finally { setBusy(false); }
  };
  if (d.trangThai === 'cho') {
    const the = data.viewer.canApprove && !d.giuPaGv ? (data.interventions ?? []).find((x: any) => x.id === d.paMoiId)?.yeuCau ?? null : null;   // giữ PA GV: thẻ nằm ở chính PA quy chế (`iv.yeuCau`)
    return (
      <div className="flex flex-col gap-1.5">
        <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-slate-300">
          <Nhan tone="muted">{d.giuPaGv ? t('Chờ QL duyệt PA của GV') : t('Chờ duyệt đổi PA')}</Nhan>
          <span>→ <b className="font-semibold text-slate-100">{tenMoi}</b></span>
          <span className="text-slate-400">· {d.giuPaGv ? t('PA của GV vẫn chạy') : iv.status === 'started' ? t('PA gốc vẫn chạy') : t('chưa chạy')} · {t('gửi {ngay}', { ngay: ngan(d.guiLuc) })}{d.hanDuyet ? ` · ${d.giuPaGv ? t('quá {ngay} tự chốt theo GV', { ngay: ngan(d.hanDuyet) }) : t('QL hạn {ngay}', { ngay: ngan(d.hanDuyet) })}` : ''}</span>
          {d.laNguoiGui && <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 font-semibold sm:min-h-0" disabled={busy} onClick={() => void rut()}>{busy ? t('Đang lưu…') : t('Rút')}</button>}
          {loi && <span role="alert" className="text-bad">⚠ {loi}</span>}
          {/* GD-3: lý do "Giữ PA của tôi" (mockup v21 K4b) hiện lại tại PA. */}
          {d.giuPaGv && d.lyDo && <span className="basis-full text-slate-400">{t('Lý do')}: “{d.lyDo}”</span>}
        </p>
        {the && <TheYeuCau gon yc={the} onXong={() => onDoi?.()} />}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <p className="m-0 text-[13px] text-slate-300">
        <b className="font-semibold text-late">{t('QL từ chối đổi PA')}</b>{d.lyDoTuChoi ? `: “${d.lyDoTuChoi}”` : ''}
        {iv.status === 'started' && iv.ghiDuoc && !lai && <> · <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 font-semibold sm:min-h-0" onClick={() => setLai(true)}>{t('Đề xuất lại')}</button></>}
      </p>
      {lai && <DeXuatLai iv={iv} studentId={data.student?.id} onHuy={() => setLai(false)} onXong={() => { setLai(false); onDoi?.(); }} />}
    </div>
  );
}

/** "Đề xuất lại" sau khi QL từ chối (PA gốc đang chạy) — cùng form `FormDoiPa`, gửi `POST …/de-xuat-doi-pa`. */
function DeXuatLai({ iv, studentId, onHuy, onXong }: { iv: any; studentId?: number | null; onHuy: () => void; onXong: () => void }) {
  const d = useDoiPa(iv.kind);
  const lf = useLoiForm();
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const gui = async () => {
    lf.bam();
    if (d.loi.length) return;
    setBusy(true); setLoi(null);
    try { await api.post(`/interventions/${iv.id}/de-xuat-doi-pa`, d.payload()); invalidate('/cases'); invalidate('/my-work'); invalidate('/yeu-cau'); onXong(); }
    catch (e: any) { setLoi(e?.message ?? t('Không lưu được')); } finally { setBusy(false); }
  };
  return (
    <CanLam>
      <FormDoiPa d={d} lf={lf} studentId={studentId} chuNgay={t('ngày QL duyệt')} />
      {loi && <p role="alert" className="m-0 text-[13px] font-semibold text-bad">⚠ {loi}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-[36px]" disabled={busy} onClick={() => void gui()}>{busy ? t('Đang gửi…') : t('Gửi Quản lý duyệt')}</button>
        <NutChu onClick={onHuy}>{t('Đóng')}</NutChu>
      </div>
    </CanLam>
  );
}

// ==================================================================== lịch sử cập nhật (thu gọn)

type MucLichSu = { key: string; on: string; dot: string | null; dotHref?: string | null; tieuDe: ReactNode; badge: ReactNode; than: ReactNode; suaXemLai?: any;
  /** VIEC-SAU-LOGIC (N37): dòng Kết quả PA xoá được — ⋯ "Xoá" (`MenuKetQua`). */ xoaKq?: { f: any; ten: string } };

const MILESTONE_TITLE: Record<string, string> = {
  repeat: t('Trượt lại'),
  recurrence: t('Tái phát sau khi đã chốt kết thúc'),
  passed: t('Đã đạt kỳ vọng'),
  closed: t('Chốt kết thúc'),
  extended: t('Chốt đợt này, kéo dài theo dõi'),
  route_changed: t('Sang lộ trình mới'),
  /* PR-SOS (K3-21): Xác nhận Case + ba mốc của thẻ Không cần theo dõi (lý do ở dòng ghi chú). */
  xac_nhan_case: t('Xác nhận Case'),
  xin_khong_theo_doi: t('Xin không theo dõi'),
  ql_duyet_khong_theo_doi: t('Quản lý duyệt không theo dõi'),
  ql_tu_choi_khong_theo_doi: t('Quản lý từ chối không theo dõi'),
  /* PR-LT2a (K3-21): kế hoạch bổ trợ lớp thường — PR-CT2 bỏ bước này, nhãn giữ để đọc lịch sử Case cũ. */
  nop_ke_hoach: t('Nộp kế hoạch bổ trợ'),
  ke_hoach_duyet: t('Quản lý duyệt kế hoạch'),
  ke_hoach_tu_choi: t('Quản lý từ chối kế hoạch'),
  /* PR-LUI-a2: Quản lý mở lại Case đã hoàn thành. */
  reopened: t('Mở lại'),
  /* OV-1c: Overall ≥ kỳ vọng sau khi kỹ năng dời có điểm — Case đã có người làm giữ, GV tự đóng. */
  overall_dat: t('Overall đã đạt'),
  /* OV-13a (C): GVCN / QL kết thúc sớm PA theo quy chế — lý do ở dòng ghi chú. */
  ket_thuc_pa: t('Kết thúc PA'),
};

/** OV-7b: sửa "Xem lại sau hỗ trợ" lần mới nhất TẠI CHỖ — kết quả quan sát + ghi chú; Đóng trả về chữ đã lưu, lỗi thì giữ chữ đang gõ. */
function SuaXemLai({ f }: { f: any }) {
  const toast = useToast();
  const [mo, setMo] = useState(false);
  const [outcome, setOutcome] = useState<string>(f.outcome ?? '');
  const [note, setNote] = useState<string>(f.note ?? '');
  const [busy, setBusy] = useState(false);
  if (!mo) {
    return <button type="button" className="btn btn-sm mt-1 min-h-[44px] sm:min-h-0" aria-label={t('Sửa lần xem lại này')} onClick={() => setMo(true)}>{t('Sửa')}</button>;
  }
  const huy = () => { setOutcome(f.outcome ?? ''); setNote(f.note ?? ''); setMo(false); };
  const luu = async () => {
    setBusy(true);
    try {
      await api.patch(`/followups/${f.id}`, { outcome: outcome || null, note });
      invalidate('/cases'); invalidate('/students');
      toast.push('ok', t('Đã sửa lần xem lại'));
      setMo(false);
    } catch (e: any) { toast.push('error', e?.message ?? t('Không lưu được')); } finally { setBusy(false); }
  };
  return (
    <div className="mt-1.5 flex flex-col gap-2">
      <select className="field w-full sm:w-auto" aria-label={t('Kết quả quan sát')} value={outcome} onChange={(e) => setOutcome(e.target.value)}>
        <option value="">{t('Chưa chọn kết quả')}</option>
        {FOLLOWUP_OUTCOMES.map((o) => <option key={o} value={o}>{outcomeLabelFor(o)}</option>)}
      </select>
      <textarea className="field w-full" rows={2} aria-label={t('Ghi chú lần xem lại')} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="flex gap-2">
        <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void luu()}>{busy ? t('Đang lưu…') : t('Lưu')}</button>
        <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={busy} onClick={huy}>{t('Đóng')}</button>
      </div>
    </div>
  );
}

/** Điểm cô tự chấm: LUÔN có chữ "cô chấm" — một con số 6.5 đứng trơ sẽ bị đọc nhầm thành điểm mock. */
function MetricPills({ metrics, ct = null }: {
  ct?: string | null;
  metrics?: { skill: string; component?: string | null; score: number; total: number | null }[] | null;
}) {
  if (!metrics?.length) return null;
  return (
    <span className="mt-1 flex flex-wrap gap-1">
      {metrics.map((m) => (
        <Nhan key={`${m.skill}:${m.component ?? ''}`} tone="muted">
          {t('cô chấm {x} {x2}', { x: m.component ?? tenMon(ct, m.skill), x2: m.total ? `${m.score}/${m.total}` : fmtBand(m.score) })}
        </Nhan>
      ))}
    </span>
  );
}

/** Mốc của Case + mọi lần ghi kết quả, MỚI NHẤT LÊN ĐẦU (mục 4.3). Phương án đã nằm ở khối trên nên không lặp ở đây. */
function buildLichSu(data: CaseDetail, ngan: (d: string | null | undefined) => string): MucLichSu[] {
  const out: MucLichSu[] = [];
  for (const m of data.milestones ?? []) {
    if (m.kind === 'opened') continue;   // ngày mở và người tạo đã ở khối Vấn đề
    out.push({
      key: `m${m.id}`, on: m.occurredOn, dot: m.attemptNo ? (m.dot ?? `MT${m.attemptNo}`) : null, dotHref: m.href ?? null,
      tieuDe: (m.kind === 'reopened' || m.kind === 'ket_thuc_pa') && m.actorName ? `${MILESTONE_TITLE[m.kind]} · ${m.actorName}` : MILESTONE_TITLE[m.kind] ?? m.kind,
      badge: (
        <>
          {m.band !== null && m.band !== undefined && (
            <Outcome tone={m.expectation === null ? 'dat' : m.band < m.expectation ? 'danger' : m.band > m.expectation ? 'ok' : 'dat'}>
              {fmtBand(m.band)}{m.expectation !== null ? t(' · kỳ vọng {fmtBand}', { fmtBand: fmtBand(m.expectation) }) : ''}
            </Outcome>
          )}
          {m.sosLevel ? <ChipSos muc={m.sosLevel} dot={m.attemptNo ? (m.dot ?? `MT${m.attemptNo}`) : null} /> : null}
        </>
      ),
      than: m.note ? <span className="block text-slate-400">{m.note}</span> : null,
    });
  }
  const tenPa = (id: number | null) => {
    const iv = (data.interventions ?? []).find((x: any) => x.id === id);
    return iv ? (dichDu(iv.description) || INTERVENTION_KIND_LABEL[iv.kind as keyof typeof INTERVENTION_KIND_LABEL] || iv.kind) : null;
  };
  for (const f of data.followups ?? []) {
    const tre = f.late ? soNgayGiua(f.cycleDue, f.observedOn) : null;
    out.push({
      key: `f${f.id}`, on: f.observedOn, dot: f.cycleNo ? t('Đợt {cycleNo}', { cycleNo: f.cycleNo }) : null,
      tieuDe: f.interventionId ? (tenPa(f.interventionId) ?? t('Kết quả PA')) : (f.metrics?.length ? t('Điểm giáo viên tự chấm') : t('Theo dõi chung')),
      badge: (
        <>
          {f.outcome && (
            <Outcome tone={OUTCOME_TONE[f.outcome] ?? 'muted'} mark={OUTCOME_MARK[f.outcome]}>{outcomeLabelFor(f.outcome)}</Outcome>
          )}
          {f.late && <span className="text-xs text-slate-500">{t('ghi trễ{x}', { x: tre && tre > 0 ? t(' {tre} ngày', { tre }) : '' })}</span>}
        </>
      ),
      than: (
        <>
          {(f.nextStep || f.observerName) && (
            <span className="block text-xs text-slate-500">
              {f.nextStep && <>→ {NEXT_STEP_LABEL[f.nextStep as keyof typeof NEXT_STEP_LABEL] ?? f.nextStep}</>}
              {f.nextStep && f.observerName && ' · '}
              {f.observerName && t('{ten} ghi', { ten: f.observerName })}
            </span>
          )}
          {f.note && <span className="block text-slate-300"><ChuDich chu={f.note} nguon={{ bang: 'case_followups', id: f.id, cot: 'note' }} /></span>}
          {f.nguoiDay && <span className="block text-xs text-slate-400">{t('Người dạy: {nguoiDay}', { nguoiDay: f.nguoiDay })}</span>}
          {/* OV-12h: Kết quả PA Tutor theo buổi. */}
          {f.buoi?.length > 0 && (
            <ol className="m-0 mt-0.5 list-none space-y-1.5 p-0 text-xs text-slate-400" aria-label={t('Các buổi tutor')}>
              {/* TU-a (mockup tutor-1 §8): hình thức + 3 dấu ✓ / ✗ + sao + nhận xét về tutor. */}
              {f.buoi.map((b: BuoiTutor, i: number) => <DongBuoiTutor key={i} b={b} i={i} />)}
            </ol>
          )}
          {f.remainingIssue && <span className="block text-xs text-slate-400">{t('Còn tồn / Ghi chú')}: <ChuDich chu={f.remainingIssue} nguon={{ bang: 'case_followups', id: f.id, cot: 'remaining_issue' }} /></span>}
          {f.decisionNote && (
            <span className="block text-xs text-slate-400">{f.nextStep === 'adjust' || f.nextStep === 'propose' ? t('Lý do') : t('Ghi chú')}: <ChuDich chu={f.decisionNote} nguon={{ bang: 'case_followups', id: f.id, cot: 'decision_note' }} /></span>
          )}
          <MetricPills metrics={f.metrics} ct={data.chuongTrinh ?? null} />
        </>
      ),
      suaXemLai: !f.nextStep && f.suaDuoc ? f : undefined,
      xoaKq: f.interventionId && f.xoa ? { f, ten: `${tenPa(f.interventionId) ?? t('Kết quả PA')} · ${ngan(f.observedOn)}` } : undefined,
    });
  }
  out.sort((a, b) => (b.on ?? '').localeCompare(a.on ?? '') || b.key.localeCompare(a.key));
  return out;
}

export { skillLabel };
