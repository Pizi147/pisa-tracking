import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { invalidate } from '../../lib/api.ts';
import { Alert, Card, Empty, ErrorState, Level, NhanTrangThai, SectionNote, Skeleton, Th } from '../../ui/ui.tsx';
import { Nhan, toneNhanTuBadge } from '../../ui/Nhan.tsx';
import { HangNhom } from '../../ui/HangNhom.tsx';
import { attemptHref, caseStatusLabel, sosTone } from '../../lib/format.ts';
import type { Branch } from '../../ui/Filters.tsx';
import { MenuDong, type MucMenu } from '../../ui/MenuDong.tsx';
import { IntakePanel } from './IntakePanel.tsx';
import { ClassCreatePanel } from '../classes/ClassCreatePanel.tsx';
import { TenGiaoVien } from '../classes/TenGiaoVien.tsx';
import { BangHocVienLop } from './BangHocVienLop.tsx';
import {
  LOC_HOC_VIEN, LOC_HOC_VIEN_NHAN, PHAM_VI_NHAN, badgeLop, docThamSoLoc, duongLichTest, lopMoSan, needScoresText, skillShort, trangThaiCaseDong,
  type BadgeLop, type LocHocVien, type PhamVi, type SapXep, type WorkScope,
} from '@shared/domain/index.ts';

/** Một lớp của `GET /hoc-vien-lop` (server/src/classes/hocVienLop.ts → LopHocVienLop). */
export type LopTrenTrang = {
  id: number; code: string; programmeCode: string | null; programmeName: string | null; scoringMode: string | null;
  branchId: number; branchName: string; studentCount: number; needScores: number; workScope: WorkScope;
  phase: string; currentWeek: number | null; totalWeeks: number | null; needsPlacement: boolean;
  missing: { key: string; label: string; who: string }[]; missingSkills: string[];
  gvcn: { id: number; name: string } | null; soCaseMo: number; tuanKetThuc: string | null;
  viewer: { coTheSuaHocVien: boolean; coTheBaoCase: boolean; coTheGhiViPham: boolean; coTheNhapDiem: boolean; coTheChuyenTiep: boolean };
  /** PR-LT: số em thật sự cần xếp lớp tiếp (Q9), số em lớp thường chưa có lộ trình tiếp theo (chỉ hai tuần cuối khoá, Q5). */
  canXepLop: number; soChuaLoTrinhTiep: number; nhacLoTrinh: boolean;
};
type TrangHocVienLop = {
  rows: LopTrenTrang[]; scopeEmpty: boolean;
  phamVi: { coThe: PhamVi[]; dangDung: PhamVi; chiNhanh: number | null };
  dem: Record<LocHocVien, number>;
  hocVien: { id: number; classId: number; loc: LocHocVien[] }[];
  /** Người xem có tạo được lớp MỚI ở chi nhánh nào không — không gắn với lớp đã tồn tại nào (điểm a rà soát cuối). */
  coTheTaoLop: boolean;
  /** Số ở mục ⋯ "Lưu trữ" đầu trang (PR-LT, Q16). */
  demLuuTru: { lop: number; hv: number };
};

/** "Lưu trữ · {n} lớp · {m} HV" — bỏ phần số 0, cả hai 0 thì chỉ "Lưu trữ" (§3.6, G-12). */
function nhanLuuTru(dem: { lop: number; hv: number }): string {
  const phan = [dem.lop > 0 ? `${dem.lop} lớp` : null, dem.hv > 0 ? `${dem.hv} HV` : null].filter(Boolean);
  return phan.length ? `Lưu trữ · ${phan.join(' · ')}` : 'Lưu trữ';
}

/**
 * HỌC VIÊN & LỚP (đặc tả §3.6, mockup 07b phương án A) — một trang, học viên nằm dưới lớp của mình.
 * Điều khiển: một ô tìm · Phạm vi · chi nhánh (khi xem theo chi nhánh và có > 1) · Xếp · chip lọc có số đếm.
 * Mọi trạng thái nằm trên URL: tải lại trang và nút Back giữ đúng chỗ đang đứng.
 */
export default function StudentsPage() {
  const navigate = useNavigate();
  const { can } = useSession();
  const [params, setParams] = useSearchParams();
  const doc = docThamSoLoc(params.get('view'));
  const q = params.get('q') ?? '';
  const branchId = params.get('branchId') ? Number(params.get('branchId')) : null;
  const phamViUrl = params.get('phamVi');
  const sapXep: SapXep = params.get('sx') === 'chu-y' ? 'chu-y' : 'ten';
  const chiLop = params.get('classId') ? Number(params.get('classId')) : null;
  const openRaw = params.get('open');
  const [draftQ, setDraftQ] = useState(q);
  const [them, setThem] = useState<{ id: number; code: string } | null | 'dong'>('dong');
  const [taoLop, setTaoLop] = useState(false);

  const setParam = useCallback((patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') next.delete(k); else next.set(k, v);
    }
    setParams(next, { replace: true });
  }, [params, setParams]);

  useEffect(() => {
    const t = setTimeout(() => { if (draftQ !== q) setParam({ q: draftQ || null, open: null }); }, 300);
    return () => clearTimeout(t);
  }, [draftQ, q, setParam]);

  const qs = useMemo(() => {
    const s = new URLSearchParams();
    if (q.trim()) s.set('q', q.trim());
    if (phamViUrl) s.set('phamVi', phamViUrl);
    if (branchId) s.set('branchId', String(branchId));
    return `/hoc-vien-lop?${s.toString()}`;
  }, [q, phamViUrl, branchId]);
  const trang = useApi<TrangHocVienLop>('chuyenDen' in doc ? null : qs);
  const branches = useApi<Branch[]>('/ref/branches');
  const data = trang.data;

  const chips = LOC_HOC_VIEN.filter((k) => { const c = LOC_HOC_VIEN_NHAN[k].can; return !c || can(c); });
  const loc: LocHocVien = 'loc' in doc && chips.includes(doc.loc) ? doc.loc : 'tat-ca';
  const dangLoc = loc !== 'tat-ca' || !!q.trim();
  const idsTheoLop = useMemo(() => {
    const m = new Map<number, Set<number>>();
    for (const h of data?.hocVien ?? []) {
      if (!h.loc.includes(loc)) continue;
      if (!m.has(h.classId)) m.set(h.classId, new Set());
      m.get(h.classId)!.add(h.id);
    }
    return m;
  }, [data, loc]);

  if ('chuyenDen' in doc) return <Navigate to={`${doc.chuyenDen}${branchId ? `?branchId=${branchId}` : ''}`} replace />;

  const lopHien = (data?.rows ?? []).filter((c) => (!chiLop || c.id === chiLop) && (!dangLoc || idsTheoLop.has(c.id)));
  const tieuDeCot = ['Học viên', 'Kết quả gần nhất',
    lopHien.some((c) => c.scoringMode === 'ratio') ? (lopHien.some((c) => c.scoringMode !== 'ratio') ? 'Mục tiêu / Khoá' : 'Khoá') : 'Mục tiêu',
    'Case', 'Việc tiếp theo', ''];
  const openIds = lopMoSan({
    thamSoOpen: openRaw === null ? null : openRaw === '-' ? []
      : openRaw.split(',').map(Number).filter((n) => Number.isFinite(n) && n > 0),
    lopHien: lopHien.map((c) => c.id),
    dangLoc,
  });
  const doiMo = (id: number) => {
    const s = new Set(openIds);
    if (s.has(id)) s.delete(id); else s.add(id);
    setParam({ open: s.size ? [...s].join(',') : '-' });
  };
  const lopDangLoc = chiLop ? (data?.rows ?? []).find((c) => c.id === chiLop) : null;
  const pv = data?.phamVi;

  return (
    <div className="page space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-semibold text-slate-100 m-0">Học viên & Lớp</h1>
        <div className="flex-1" />
        {/*
          * "+ Lớp mới"/"+ Học viên" (điểm a rà soát cuối): KHÔNG dùng `can()` phía client — hàm đó chỉ kiểm vai có quyền
          * `student.edit` theo danh sách tĩnh, không có ngữ cảnh branchId/classId, nên GVCN/GVBM luôn thấy nút dù bấm vào
          * chắc chắn ra 403 (`hasAssignment` đòi `ctx.classId`/`ctx.branchId` cụ thể). Dùng đúng cờ máy chủ đã tính theo
          * TỪNG lớp/chi nhánh thay vào đó.
          */}
        {data?.coTheTaoLop && <button type="button" className="btn btn-sm" onClick={() => setTaoLop(true)}>+ Lớp mới</button>}
        {(data?.rows ?? []).some((r) => r.viewer.coTheSuaHocVien) && (
          <button type="button" className="btn btn-sm btn-primary" onClick={() => setThem(null)}>+ Học viên</button>
        )}
        <MenuDong nhan="Thao tác trang" muc={[
          { key: 'luu-tru', nhan: nhanLuuTru(data?.demLuuTru ?? { lop: 0, hv: 0 }), onChon: () => navigate('/hoc-vien/luu-tru') },
        ]} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input className="field w-full sm:w-80" aria-label="Tìm" placeholder="🔍 Tìm tên, mã học viên hoặc mã lớp…"
          value={draftQ} onChange={(e) => setDraftQ(e.target.value)} />
        {pv && pv.coThe.length > 1 && (
          <select className="field w-auto" aria-label="Phạm vi" value={pv.dangDung}
            onChange={(e) => setParam({ phamVi: e.target.value, branchId: null, open: null })}>
            {pv.coThe.map((v) => <option key={v} value={v}>Phạm vi: {PHAM_VI_NHAN[v]}</option>)}
          </select>
        )}
        {pv?.dangDung === 'chi-nhanh' && (branches.data?.length ?? 0) > 1 && (
          <select className="field w-auto" aria-label="Chi nhánh" value={pv.chiNhanh ?? ''}
            onChange={(e) => setParam({ phamVi: 'chi-nhanh', branchId: e.target.value, open: null })}>
            {(branches.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
        <select className="field w-auto" aria-label="Cách xếp" value={sapXep}
          onChange={(e) => setParam({ sx: e.target.value === 'chu-y' ? 'chu-y' : null })}>
          <option value="ten">Xếp: Tên A→Z</option>
          <option value="chu-y">Xếp: Cần chú ý trước</option>
        </select>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Lọc học viên">
        {chips.map((k) => (
          <button key={k} type="button" title={LOC_HOC_VIEN_NHAN[k].goiY} aria-pressed={loc === k}
            onClick={() => setParam({ view: k === 'tat-ca' ? null : k, open: null })}
            className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold cursor-pointer ${
              loc === k
                ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)] border-[color:var(--accent-line)]'
                : 'bg-transparent text-slate-400 border-slate-300/20 hover:bg-white/5'
            }`}>
            {LOC_HOC_VIEN_NHAN[k].nhan}<span className="tabular-nums text-slate-200">{data?.dem[k] ?? 0}</span>
          </button>
        ))}
        {chiLop && (
          <button type="button" className="btn btn-sm shrink-0" title="Bỏ lọc lớp" onClick={() => setParam({ classId: null })}>
            Lớp {lopDangLoc?.code ?? chiLop} ✕
          </button>
        )}
      </div>

      {trang.error && <ErrorState message={trang.error.message} hint={trang.error.hint} onRetry={trang.reload} />}
      {trang.loading && !data && <Skeleton rows={6} />}
      {data && (lopHien.length === 0 ? (
        <Card>
          <Empty
            title={data.scopeEmpty ? 'Bạn chưa được cấp phạm vi nào' : 'Không có lớp hay học viên nào khớp'}
            hint={data.scopeEmpty
              ? 'Tài khoản này chưa có vai trò kèm chi nhánh hoặc phân công lớp nào.'
              : 'Bỏ bớt từ khoá, đổi chip lọc hoặc đổi phạm vi.'} />
        </Card>
      ) : (
        /*
         * Tiêu đề cột MỘT lần, mỗi lớp MỘT bảng riêng (cùng colgroup nên cột thẳng nhau) — PR-UX0 N-2; menu ⋯ vẽ ra ngoài (portal).
         * YC-11.1 (PR-N1): từ 768px bỏ khung cuộn ngang; hàng tiêu đề là khối dính riêng theo <main>, hàng lớp đang mở dính ngay
         * dưới nó (`.hang-lon-dinh`). Mỗi lớp một bảng thì hàng lớp chỉ dính trong bảng của nó: cuộn hết lớp là bị lớp sau đẩy
         * lên, không bao giờ hai hàng lớp chồng nhau (chủ sản phẩm 28/09). Điện thoại: cả khối cuộn ngang, không dính.
         */
        <div className="card overflow-x-auto md:overflow-visible">
          <div className="md:sticky md:top-0 md:z-10" aria-hidden>
            <table className="w-full min-w-[780px] table-fixed text-sm">
              <CotBangLop />
              <thead><tr>{tieuDeCot.map((t, i) => <th key={i} className={`th ${i === 3 ? 'text-right' : ''}`}>{t}</th>)}</tr></thead>
            </table>
          </div>
          {lopHien.map((c) => (
            <table key={c.id} className="w-full min-w-[780px] table-fixed text-sm" aria-label={`Lớp ${c.code}`}>
              <CotBangLop />
              <thead className="sr-only"><tr>{tieuDeCot.map((t, i) => <th key={i}>{t || 'Thao tác'}</th>)}</tr></thead>
              <HopLop lop={c} mo={openIds.includes(c.id)} onDoiMo={() => doiMo(c.id)}
                chiHien={dangLoc ? (idsTheoLop.get(c.id) ?? new Set()) : null} sapXep={sapXep}
                onThemHocVien={() => setThem({ id: c.id, code: c.code })} onDoi={trang.reload} />
            </table>
          ))}
        </div>
      ))}

      {taoLop && (
        <ClassCreatePanel onClose={() => setTaoLop(false)}
          onDone={() => { invalidate('/classes'); invalidate('/hoc-vien-lop'); trang.reload(); }} />
      )}
      {them !== 'dong' && (
        <IntakePanel defaultClass={them} onClose={() => setThem('dong')}
          onDone={() => { invalidate('/classes'); invalidate('/hoc-vien-lop'); invalidate('/students'); trang.reload(); }} />
      )}
    </div>
  );
}

/** Cột chung của khối tiêu đề và mọi bảng lớp — một chỗ khai báo để cột luôn thẳng nhau. */
function CotBangLop() {
  return (
    <colgroup>
      <col className="w-[28%]" /><col className="w-[22%]" /><col className="w-[14%]" />
      <col className="w-[7%]" /><col className="w-[25%]" /><col className="w-12" />
    </colgroup>
  );
}

/**
 * HÀNG LỚN của một lớp (đặc tả §3.6; PR-UX0 N-2): ▸ · mã (mở Hồ sơ lớp) · chương trình · n HV · GVCN · tối đa 2 badge (+n) · ⋯.
 * ⋯ của lớp: Hồ sơ lớp · Nhập điểm Test (Q11, Q6) · + Học viên — chỉ mục người xem làm được.
 */
function HopLop({ lop, mo, onDoiMo, chiHien, sapXep, onThemHocVien, onDoi }: {
  lop: LopTrenTrang; mo: boolean; onDoiMo: () => void; chiHien: Set<number> | null; sapXep: SapXep;
  onThemHocVien: () => void; onDoi: () => void;
}) {
  const navigate = useNavigate();
  const thuong = lop.scoringMode === 'ratio';
  const b = badgeLop({
    needsPlacement: lop.needsPlacement, canXepLop: lop.canXepLop, missingSkills: lop.missingSkills,
    soBaiChoCham: lop.needScores,
    needScoresTitle: lop.needScores > 0 ? needScoresText(lop.workScope, lop.needScores) : null,
    soCaseMo: lop.soCaseMo, phase: lop.phase,
    missingCount: lop.missing.filter((m) => m.key !== 'teachers').length, soChuaLoTrinhTiep: lop.soChuaLoTrinhTiep,
  });
  const denBadge = (x: BadgeLop): string | null =>
    /* PR-UX1: badge "n bài chờ chấm" mở Lịch Test lọc đúng lớp (Lịch Test tự mở "Lớp tôi dạy" cho GV). */
    x.key === 'cham' ? duongLichTest({ classId: lop.id })
      : x.key === 'case' ? `/hoc-vien/lop/${lop.id}?che-do=can-ho-tro`
      : x.key === 'het-khoa' ? (lop.viewer.coTheChuyenTiep ? `/hoc-vien/lop/${lop.id}?viec=chuyen-tiep` : `/hoc-vien/lop/${lop.id}`)
      : null;
  const mucLop: MucMenu[] = [
    { key: 'ho-so', nhan: 'Hồ sơ lớp', onChon: () => navigate(`/hoc-vien/lop/${lop.id}`) },
    ...(lop.viewer.coTheNhapDiem
      ? [{ key: 'nhap-diem', nhan: 'Nhập điểm Test', onChon: () => navigate(thuong ? `/bang-diem-thuong/${lop.id}` : `/nhap-diem/${lop.id}`) }]
      : []),
    ...(lop.viewer.coTheSuaHocVien ? [{ key: 'them', nhan: '+ Học viên', onChon: onThemHocVien }] : []),
  ];

  return (
    <tbody>
      <HangNhom mo={mo} onMo={onDoiMo} nhan={`lớp ${lop.code}`} soCotDau={3} className={mo ? 'hang-lon-dinh' : ''}
        tieuDe={
          <span className="flex min-w-0 items-baseline gap-2">
            <Link to={`/hoc-vien/lop/${lop.id}`} className="shrink-0 font-extrabold text-slate-100 underline decoration-dotted underline-offset-4">
              {lop.code}
            </Link>
            <span className="min-w-0 truncate text-[11px] font-normal text-slate-400"
              title={`${lop.programmeName ?? '—'} · ${lop.studentCount} HV${lop.gvcn ? ` · GVCN ${lop.gvcn.name}` : ''}`}>
              {lop.programmeName ?? '—'} · {lop.studentCount} HV
              {lop.gvcn && <> · <abbr title="Giáo viên chủ nhiệm" className="no-underline">GVCN</abbr> <TenGiaoVien id={lop.gvcn.id} ten={lop.gvcn.name} /></>}
            </span>
          </span>
        }>
        <td className="px-3" colSpan={2}>
          <span className="flex items-center justify-end gap-1.5">
            {b.hien.map((x) => {
              const den = denBadge(x);
              return den
                ? <Nhan key={x.key} tone={toneNhanTuBadge(x.tone)} title={x.title} onClick={() => navigate(den)}>{x.nhan}</Nhan>
                : <Nhan key={x.key} tone={toneNhanTuBadge(x.tone)} title={x.title}>{x.nhan}</Nhan>;
            })}
            {b.an.length > 0 && (
              <span className="text-[11px] font-normal text-slate-500" title={b.an.map((x) => x.nhan).join(' · ')}>+{b.an.length}</span>
            )}
          </span>
        </td>
        <td className="px-2 text-center"><MenuDong muc={mucLop} nhan="Thao tác với lớp" /></td>
      </HangNhom>
      {mo && <BangHocVienLop lop={lop} chiHien={chiHien} sapXep={sapXep} onDoi={onDoi} soCot={6} />}
    </tbody>
  );
}

/**
 * Hàng đợi công việc: cùng dữ liệu lượt MT, chỉ đổi bộ lọc.
 *
 * KHÔNG khoá theo tuần — việc nợ từ tuần trước không biến mất khi đổi tuần ở nơi khác
 * (bảng chấm, Kế hoạch Test). Cột "Nợ từ tuần" chỉ NÓI ra tuần của từng môn còn thiếu.
 */
export function WorkQueue({ view, branchId, q, scope }: {
  view: string; branchId: number | null; q: string; scope: WorkScope | null;
}) {
  const [params] = useSearchParams();
  const classId = params.get('classId');
  const qs = useMemo(() => {
    const s = new URLSearchParams();
    s.set('need', view === 'sos' ? 'sos_open' : view);
    if (branchId) s.set('branchId', String(branchId));
    if (classId) s.set('classId', classId);
    if (q.trim()) s.set('q', q.trim());
    if (scope) s.set('scope', scope);
    return `/attempts?${s.toString()}`;
  }, [view, branchId, classId, q, scope]);
  const { data, loading, error, reload } = useApi<{ rows: any[]; scopeEmpty: boolean }>(qs);
  const navigate = useNavigate();

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading) return <Skeleton rows={6} />;
  if (!data) return null;

  const label = view === 'my_scores' ? 'cần chấm' : 'đang ở mức SOS';
  // Badge đếm BÀI KỸ NĂNG, không đếm LƯỢT — một lượt có thể nợ nhiều môn cùng lúc.
  const count = view === 'my_scores'
    ? data.rows.reduce((n: number, r: any) => n + (r.pendingSkills?.length ?? 0), 0)
    : data.rows.length;
  const unit = view === 'my_scores' ? 'bài' : 'lượt';

  return (
    <Card bodyClass="p-0"
      title={<span>{count} {unit} {label}{classId ? ' của lớp đang chọn' : ''}</span>}
      action={classId && <Link className="btn btn-sm no-underline" to={`/hoc-vien?view=${view}`}>Bỏ lọc lớp</Link>}>
      {data.rows.length === 0 ? (
        <Empty title={`Không còn việc nào ${label}`} hint="Xem tiếp bằng cách đổi cách xem hoặc bỏ bộ lọc." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="th">Học viên</th>
                <th className="th">Lớp</th>
                <Th hint="Lượt đánh giá đang cần bạn xử lý.">Bài</Th>
                <Th hint="Tuần kế hoạch của đợt Test. Chưa có tuần thì cũng chưa có hạn nhập điểm.">Tuần</Th>
                {view === 'my_scores' && (
                  <Th hint="Tuần thi của CHÍNH môn còn thiếu điểm — có thể khác tuần của cả lượt.">Nợ từ tuần</Th>
                )}
                <Th hint="Bài cần chấm theo đúng phạm vi đang xem. Ở phạm vi quản lý, bài không phải việc của bạn có kèm tên giáo viên phụ trách.">
                  Việc cần làm
                </Th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.id} className="row-hover cursor-pointer" onClick={() => navigate(attemptHref(r))}>
                  <td className="td">
                    <div className="text-slate-100">{r.studentName}</div>
                    <div className="text-[11px] text-slate-500">{r.studentCode}</div>
                  </td>
                  <td className="td text-slate-300 whitespace-nowrap">{r.classCode ?? '—'}</td>
                  {/* Lộ trình đã hiện ở cột Target ngay cạnh — nhắc lại chỉ là chữ thừa. */}
                  {/* Lớp Normal không có "MT" — gọi đúng tên bài của nó. */}
                  <td className="td tabular-nums whitespace-nowrap">
                    {r.kind === 'mock' ? `MT${r.attemptNo}` : r.kind === 'final' ? 'Cuối khoá' : 'Giữa khoá'}
                  </td>
                  <td className="td whitespace-nowrap text-slate-300">{r.period?.code ?? '—'}</td>
                  {view === 'my_scores' && (
                    <td className="td whitespace-nowrap text-slate-300">
                      {(r.pendingWeeks?.length ? r.pendingWeeks.join(', ') : r.period?.code) ?? '—'}
                    </td>
                  )}
                  <td className="td text-xs">
                    {view === 'my_scores' && (
                      <div className="flex flex-col items-start gap-0.5">
                        <span style={{ color: 'var(--accent)' }}>Nhập {r.pendingSkills.map(skillShort).join(', ')}</span>
                        {/*
                          NÓI RÕ KHI QUẢN LÝ NHẬP HỘ (mục 3.3) — không đổi quyền, chỉ nói ra.
                          `myPendingSkills` KHÔNG đổi theo phạm vi đang xem, nên so nó với
                          `pendingSkills` (đã lọc theo phạm vi) là biết đúng bài nào không
                          phải việc của chính người này — KHÔNG dựa vào biến `scope` phía
                          giao diện, vì nó có thể là `null` (chưa chọn, máy chủ tự mặc định)
                          trong khi dữ liệu vẫn đã lọc theo đúng phạm vi quản lý.
                        */}
                        {r.pendingSkills.some((sk: string) => !r.myPendingSkills.includes(sk)) && (
                          <span className="text-[10px] text-slate-500">
                            {r.pendingSkills
                              .filter((sk: string) => !r.myPendingSkills.includes(sk))
                              .map((sk: string) => `${skillShort(sk)}: ${r.pendingOwners?.[sk] ?? 'chưa phân công'}`)
                              .join(' · ')} — bạn không phụ trách bài này, nhập sẽ được ghi là sửa hộ
                          </span>
                        )}
                      </div>
                    )}
                    {/*
                      * Nhìn là biết case đã được làm hay chưa: mức SOS · trạng thái, rồi mốc
                      * follow-up gần nhất. Không phải mở chi tiết mới rõ.
                      */}
                    {view === 'sos' && (
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="flex items-center gap-1">
                          <Level tone={sosTone(r.caseLevel)}>SOS {r.caseLevel}</Level>
                          {/* PR-NEN (Q15): nhãn 6 chữ chung; chữ trạng thái case cũ còn ở tooltip. */}
                          <NhanTrangThai t={trangThaiCaseDong(r.caseStatus)} title={caseStatusLabel(r.caseStatus ?? 'open')} />
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {r.caseFollowUp ?? 'Chưa có follow-up'}
                        </span>
                      </div>
                    )}
                    {r.overdueSkills > 0 && <Alert quaHan>Quá hạn {r.overdueSkills}</Alert>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="p-3">
        <SectionNote>
          Danh sách này xét <strong>xuyên tuần</strong>, nên việc còn tồn từ tuần trước không biến mất khi đổi tuần ở nơi khác.
        </SectionNote>
      </div>
    </Card>
  );
}
