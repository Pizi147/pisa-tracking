import { useMemo, useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { Alert, Empty, ErrorState, Skeleton, Status } from '../../ui/ui.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { OSoNho } from '../../ui/OSoNho.tsx';
import { DongThoiGian, type DongThoiGianMuc } from '../../ui/DongThoiGian.tsx';
import { fmtDate } from '../../lib/format.ts';
import {
  VIOLATION_CATEGORIES, VIOLATION_CATEGORY_LABEL, demTheoNhomViPham, trongChuKyHienTai, tuNgayTheoKhoang,
  type ViolationCategory,
} from '@shared/domain/index.ts';
import { usePanelYThuc } from './panelYThuc.tsx';
import { ChiTietViPham } from './ChiTietViPham.tsx';
import { PhoiHopSosSection, type CoordTurn } from './PhoiHopSosSection.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';

type ViolationView = {
  id: number; studentId: number; category: string; categoryLabel: string; skill: string | null; skillLabel: string | null;
  classId: number | null; cycleId: number | null;
  occurredOn: string; description: string; reportedBy: number; reportedByName: string | null; state: string; stateLabel: string;
  ageDays: number; ageLabel: string;
};
type MeasureDetail = {
  id: number; kindLabel: string; kind: string; statusLabel: string; status: string;
  classId: number | null; cycleId: number | null;
  violationCount: number; performedOn: string | null; createdAt: string;
  violations: { category: string }[];
};
type ChuKy = { cycleId: number | null; classId: number | null };

/** Nhãn "Vi phạm" trơn có màu — không dùng `Status` (có biểu tượng ▶ của "đang làm", chủ sản phẩm bỏ 22/09). */
const NHAN_VI_PHAM = (
  <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap bg-sky-300/10 text-sky-200 border-sky-300/30">Vi phạm</span>
);

const RANGES = [
  { key: 'all', label: 'Tất cả thời gian' },
  { key: '7', label: '7 ngày' },
  { key: '30', label: '30 ngày' },
] as const;

/**
 * TAB `Ý THỨC & PHỐI HỢP` CỦA HỒ SƠ HỌC VIÊN — theo prototype v3 `thiet-ke/tham-khao/ho-so-hoc-vien-v3.html`
 * (spec PR-HV §4.3), kế hoạch PR-YT2 Task 7: đầu khối + nút `+ Ghi nhận vi phạm` (A2) · hai tab con (số lượt Phối hợp
 * chưa xong trên nhãn, A5) · ô số nhỏ ĐẾM THEO CHU KỲ HIỆN TẠI (Q14 — FT theo lộ trình, lớp thường theo khoá đang học;
 * dòng thời gian vẫn hiện ĐỦ, không lọc chu kỳ) · dòng thời gian LƯỚI mở TẠI CHỖ (YT-1, như hồ sơ lớp Task 6) · ô tick
 * để gom vi phạm thành phương án (A4). PA đang chuẩn bị `Mở` (sửa tại chỗ, Task 5) · PA đã thực hiện `Xem` (chỉ đọc).
 */
export function StudentYThucSection({ studentId, studentName, canRecordViolation, canManageDiscipline, onGoAcademic, canhBao }: {
  studentId: number; studentName: string; canRecordViolation: boolean; canManageDiscipline: boolean;
  /** Đổi sang tab Học thuật của hồ sơ (link trong thẻ Phối hợp SOS). */
  onGoAcademic?: () => void;
  /**
   * CẢNH BÁO ĐÃ TẢI SẴN Ở TRANG CHA (AN-9) — trang cha cũng cần con số này cho dấu ⚠ trên tab, nên chỉ
   * MỘT nơi được gọi `/violation-warning`. Có truyền prop này (kể cả `null`) thì component KHÔNG tự gọi lại;
   * không truyền (`undefined`) thì tự tải như cũ, cho chỗ khác chưa kịp gom lại vẫn chạy đúng.
   */
  canhBao?: { message: string } | null;
}) {
  const tuTaiCanhBao = canhBao === undefined;
  const warn = useApi<{ message: string }>(tuTaiCanhBao ? `/students/${studentId}/violation-warning` : null, [studentId, tuTaiCanhBao]);
  const warnMessage = tuTaiCanhBao ? warn.data?.message : canhBao?.message;
  const violations = useApi<{ rows: ViolationView[]; chuKy: ChuKy }>(`/students/${studentId}/violations`, [studentId]);
  const measures = useApi<{ rows: MeasureDetail[] }>(`/students/${studentId}/measures`, [studentId]);
  const [sub, setSub] = useState<'violations' | 'coordination'>('violations');
  /* Tải LUÔN (không đợi mở tab con) để nhãn `Phối hợp SOS {n}` có số ngay (A5). */
  const coord = useApi<{ rows: CoordTurn[]; pendingCount: number }>(`/students/${studentId}/phoi-hop-sos`, [studentId]);

  const [category, setCategory] = useState<string | null>(null);
  const [range, setRange] = useState<'7' | '30' | 'all'>('all');
  const [ticked, setTicked] = useState<Set<number>>(new Set());
  /** YT-1/YT-13: một dòng vi phạm mở tại chỗ tại mọi thời điểm. */
  const [moViPhamId, setMoViPhamId] = useState<number | null>(null);
  const { homNay: today } = useNgayNghiepVu();

  const { mo, moPhuongAn, panels } = usePanelYThuc({
    canManage: canManageDiscipline,
    onDone: () => { setTicked(new Set()); reload(); },
  });

  const cutoff = tuNgayTheoKhoang(today, range);

  const reload = () => { violations.reload(); measures.reload(); if (tuTaiCanhBao) warn.reload(); coord.reload(); };

  const vRows = violations.data?.rows ?? [];
  const mRows = measures.data?.rows ?? [];
  const chuKy: ChuKy = violations.data?.chuKy ?? { cycleId: null, classId: null };

  /* Q14: Ô SỐ đếm theo chu kỳ HIỆN TẠI — FT theo lộ trình (`cycleId`), lớp thường theo khoá đang học (`classId`).
     `preparing` (việc đang dở) giữ đếm HẾT, không lọc chu kỳ. Dòng thời gian bên dưới vẫn hiện ĐỦ, không lọc theo đây. */
  const vRowsTrongKy = useMemo(() => vRows.filter((v) => trongChuKyHienTai({ cycleId: v.cycleId, classId: v.classId }, chuKy)), [vRows, chuKy]);
  const mRowsTrongKy = useMemo(() => mRows.filter((m) => trongChuKyHienTai({ cycleId: m.cycleId, classId: m.classId }, chuKy)), [mRows, chuKy]);
  const dem = useMemo(() => demTheoNhomViPham(vRowsTrongKy), [vRowsTrongKy]);
  const preparing = mRows.filter((m) => m.status === 'preparing').length;
  const lastWarning = ['warning_3', 'warning_2', 'warning_1'].find((k) => mRowsTrongKy.some((m) => m.kind === k && m.status === 'done'));
  const ghiChuChuKy = chuKy.cycleId !== null ? 'Tính trong lộ trình hiện tại' : 'Tính trong khoá đang học';

  const timeline = useMemo(() => {
    type Row = { key: string; date: string; kind: 'vp' | 'pa'; v?: ViolationView; m?: MeasureDetail };
    const rows: Row[] = [
      ...vRows.map((v): Row => ({ key: `v${v.id}`, date: v.occurredOn, kind: 'vp', v })),
      ...mRows.map((m): Row => ({ key: `m${m.id}`, date: m.performedOn ?? m.createdAt.slice(0, 10), kind: 'pa', m })),
    ];
    return rows
      /* J7: lọc nhóm — dòng phương án vẫn hiện khi nó chứa ít nhất một vi phạm của nhóm đang lọc. */
      .filter((r) => !category || (r.v ? r.v.category === category : (r.m?.violations ?? []).some((v) => v.category === category)))
      .filter((r) => !cutoff || r.date >= cutoff)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [vRows, mRows, category, cutoff]);

  const toggle = (id: number) => setTicked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const muc: DongThoiGianMuc[] = timeline.map((r) => {
    if (r.v) {
      const v = r.v;
      return {
        key: r.key, ngay: v.occurredOn,
        chon: canManageDiscipline && v.state === 'unhandled'
          ? { checked: ticked.has(v.id), onChange: () => toggle(v.id), nhanDoc: `Chọn vi phạm ${fmtDate(v.occurredOn)}` }
          : null,
        cot2: v.ageLabel ? <Alert tone="danger">Vi phạm</Alert> : NHAN_VI_PHAM,
        tieuDe: v.description,
        dongPhu: [v.categoryLabel, v.skillLabel, v.reportedByName, v.state !== 'unhandled' ? v.stateLabel : null,
          v.ageLabel ? `⚠ đã ${v.ageDays} ngày` : null].filter(Boolean).join(' · '),
        mo: moViPhamId === v.id,
        onMo: () => setMoViPhamId((cur) => (cur === v.id ? null : v.id)),
        chiTiet: (
          <ChiTietViPham violationId={v.id} canManage={canManageDiscipline}
            onSua={(vv) => mo({ loai: 'sua', v: vv })}
            onDaXoa={() => { setMoViPhamId(null); reload(); }}
            onMoPhuongAn={moPhuongAn} />
        ),
      };
    }
    const m = r.m!;
    const dangChuanBi = m.status === 'preparing';
    return {
      key: r.key, ngay: r.date, chon: null,
      cot2: dangChuanBi ? <Status kind="waiting">Phương án</Status> : <Status kind="done">Phương án</Status>,
      tieuDe: m.kindLabel,
      dongPhu: `${m.statusLabel} · gồm ${m.violationCount} vi phạm`,
      cuoi: (
        <button type="button" className={`btn btn-sm ${dangChuanBi && canManageDiscipline ? 'btn-primary' : ''}`} onClick={() => moPhuongAn(m)}>
          {dangChuanBi && canManageDiscipline ? 'Mở' : 'Xem'}
        </button>
      ),
    };
  });

  if (violations.error) return <ErrorState message={violations.error.message} onRetry={reload} />;
  if (violations.loading || measures.loading) return <Skeleton rows={4} />;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-100 m-0">Ý thức & Phối hợp</h2>
          <p className="text-xs text-slate-500 m-0 mt-0.5">Lịch sử của riêng học viên này.</p>
        </div>
        {canRecordViolation && (
          <button className="btn btn-sm btn-primary" onClick={() => mo({ loai: 'ghi', studentId, studentName })}>+ Ghi nhận vi phạm</button>
        )}
      </div>

      <HangTab cap="con" ariaLabel="Ý thức & Phối hợp" value={sub} onChange={setSub}
        tabs={[
          { key: 'violations', label: 'Vi phạm & xử lý' },
          { key: 'coordination', label: 'Phối hợp SOS', so: coord.data?.pendingCount ?? 0 },
        ]} />

      {sub === 'violations' ? (
        <>
          {warnMessage && <Alert tone="warn">{warnMessage.replace(/^⚠\s*/, '')}</Alert>}

          {/* A3 — ô số nhỏ: Vi phạm · từng nhóm có số > 0 · PA đang chuẩn bị (đếm hết) · Thư cảnh cáo gần nhất — bốn ô đầu đếm theo chu kỳ (Q14). */}
          <div className="flex flex-wrap items-center gap-2">
            <OSoNho nhan="Vi phạm" so={dem.tong} />
            {dem.nhom.map((g) => <OSoNho key={g.category} nhan={g.label} so={g.n} />)}
            {preparing > 0 && <OSoNho nhan="PA đang chuẩn bị" so={preparing} tone="warn" />}
            {lastWarning && <OSoNho nhan="Thư cảnh cáo" so={`lần ${lastWarning.slice(-1)}`} />}
            <span className="text-slate-500 text-xs cursor-help" aria-label={ghiChuChuKy} title={ghiChuChuKy}>ⓘ</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1">
              <button className={`btn btn-sm ${!category ? 'btn-primary' : ''}`} onClick={() => setCategory(null)}>Tất cả</button>
              {VIOLATION_CATEGORIES.map((c) => (
                <button key={c} className={`btn btn-sm ${category === c ? 'btn-primary' : ''}`} onClick={() => setCategory(c)}>
                  {VIOLATION_CATEGORY_LABEL[c as ViolationCategory]}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {RANGES.map((r) => (
                <button key={r.key} className={`btn btn-sm ${range === r.key ? 'btn-primary' : ''}`} onClick={() => setRange(r.key)}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <DongThoiGian coCotChon={canManageDiscipline} muc={muc} rong={<Empty title="Chưa có gì trong khoảng này" />} />

          {canManageDiscipline && ticked.size > 0 && (
            <button className="btn btn-sm btn-primary" onClick={() => mo({
              loai: 'tao-pa', studentId, studentName,
              violations: vRows.filter((v) => ticked.has(v.id)).map((v) => ({ id: v.id, occurredOn: v.occurredOn, categoryLabel: v.categoryLabel, description: v.description })),
            })}>
              Tạo phương án từ {ticked.size} vi phạm
            </button>
          )}
        </>
      ) : (
        <PhoiHopSosSection turns={coord.data?.rows ?? null} loading={coord.loading} cot1="luot"
          onGoAcademic={onGoAcademic} onChanged={() => coord.reload()} />
      )}

      {panels}
    </div>
  );
}
