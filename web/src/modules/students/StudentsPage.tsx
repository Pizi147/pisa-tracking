import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { invalidate } from '../../lib/api.ts';
import { Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { Nhan, toneNhanTuBadge } from '../../ui/Nhan.tsx';
import { HangNhom } from '../../ui/HangNhom.tsx';
import { CongTacKhung, khungDaNho, type KhungLoc } from '../../ui/CongTacKhung.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import type { Branch } from '../../ui/Filters.tsx';
import { MenuDong, type MucMenu } from '../../ui/MenuDong.tsx';
import { IntakePanel } from './IntakePanel.tsx';
import { ClassCreatePanel } from '../classes/ClassCreatePanel.tsx';
import { TenGiaoVien } from '../classes/TenGiaoVien.tsx';
import { BangHocVienLop } from './BangHocVienLop.tsx';
import {
  LOC_HOC_VIEN, LOC_HOC_VIEN_NHAN, PHAM_VI_NHAN, badgeLop, chipHienLoc, demLoc, docThamSoLoc, duongLichTest, khungCua, laVaiQuanLy, lopMoSan, needScoresText,
  type BadgeLop, type LocHocVien, type PhamVi, type SapXep, type WorkScope,
} from '@shared/domain/index.ts';

/** Một lớp của `GET /hoc-vien-lop` (server/src/classes/hocVienLop.ts → LopHocVienLop). */
export type LopTrenTrang = {
  id: number; code: string; programmeCode: string | null; programmeName: string | null; scoringMode: string | null;
  /** Lộ trình lớp Fast Track (LT1 / LT2 / RF); lớp thường không có (U14, PR-UXD). */
  route: string | null;
  branchId: number; branchName: string; studentCount: number; needScores: number; workScope: WorkScope;
  phase: string; currentWeek: number | null; totalWeeks: number | null; needsPlacement: boolean;
  missing: { key: string; label: string; who: string }[]; missingSkills: string[];
  gvcn: { id: number; name: string } | null; soCaseMo: number; tuanKetThuc: string | null;
  /** B4: yêu cầu chờ Quản lý duyệt (chỉ người duyệt được) và số em có việc đã quá hạn — badge `cho-duyet` / `qua-han`. */
  soChoDuyet: number; soEmQuaHan: number;
  viewer: { coTheSuaHocVien: boolean; coTheBaoCase: boolean; coTheGhiViPham: boolean; coTheNhapDiem: boolean; coTheChuyenTiep: boolean };
  /** PR-LT: số em thật sự cần xếp lớp tiếp (Q9), số em lớp thường chưa có lộ trình tiếp theo (chỉ hai tuần cuối khoá, Q5). */
  canXepLop: number; soChuaLoTrinhTiep: number; nhacLoTrinh: boolean;
};
type TrangHocVienLop = {
  rows: LopTrenTrang[]; scopeEmpty: boolean;
  phamVi: { coThe: PhamVi[]; dangDung: PhamVi; chiNhanh: number | null };
  dem: Record<LocHocVien, number>;
  hocVien: { id: number; classId: number; loc: LocHocVien[]; khung: 'ft' | 'thuong' }[];
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
  const khungUrl = params.get('khung');
  const khungMuon: KhungLoc = khungUrl === 'ft' || khungUrl === 'thuong' || khungUrl === 'tat-ca' ? khungUrl : khungDaNho('hoc-vien-lop') ?? 'tat-ca';
  const openRaw = params.get('open');
  const [draftQ, setDraftQ] = useState(q);
  const [them, setThem] = useState<{ id: number; code: string } | null | 'dong'>('dong');
  const [taoLop, setTaoLop] = useState(false);
  const dienThoai = useDienThoai();

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

  /* Công tắc khung chỉ có nghĩa khi phạm vi có CẢ hai loại lớp; khung đã nhớ mà không còn lớp nào thì về "Tất cả". */
  const soLopTheoKhung = { ft: 0, thuong: 0 };
  for (const c of data?.rows ?? []) soLopTheoKhung[khungCua(c.scoringMode)] += 1;
  const coHaiKhung = soLopTheoKhung.ft > 0 && soLopTheoKhung.thuong > 0;
  const khung: KhungLoc = coHaiKhung ? khungMuon : 'tat-ca';
  const dem = useMemo(() => demLoc(data?.hocVien ?? [], khung), [data, khung]);
  /* "Đang SOS" chỉ Fast Track (T58): chọn khung Lớp thường thì chip không còn nghĩa. */
  const chips = LOC_HOC_VIEN.filter((k) => { const c = LOC_HOC_VIEN_NHAN[k].can; return (!c || can(c)) && !(k === 'sos' && khung === 'thuong')
    && chipHienLoc(k, 'loc' in doc ? doc.loc : null); });
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

  const lopHien = (data?.rows ?? []).filter((c) => (khung === 'tat-ca' || khungCua(c.scoringMode) === khung)
    && (!chiLop || c.id === chiLop) && (!dangLoc || idsTheoLop.has(c.id)));
  /* M3, K2-03: nhóm theo kiểu lớp (Fast Track trước, lớp thường sau) — mỗi nhóm một khối tiêu đề cột riêng: "Target" cho FT, "Khoá" cho lớp thường. */
  const nhomLop = (['ft', 'thuong'] as const)
    .map((k) => ({ k, lop: lopHien.filter((c) => khungCua(c.scoringMode) === k) })).filter((g) => g.lop.length > 0);
  const tieuDeCot = (k: 'ft' | 'thuong') => ['Học viên', 'Kết quả gần nhất', k === 'ft' ? 'Target' : 'Khoá', 'Sắp tới', 'Case', 'Việc tiếp theo', ''];
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

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <CongTacKhung trang="hoc-vien-lop" coTatCa value={khung}
        dem={{ 'tat-ca': data?.rows.length, ft: soLopTheoKhung.ft, thuong: soLopTheoKhung.thuong }}
        onChange={(k) => setParam({ khung: k === 'tat-ca' ? null : k, open: null })} />
      <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Lọc học viên">
        {chips.map((k) => (
          <button key={k} type="button" title={LOC_HOC_VIEN_NHAN[k].goiY} aria-pressed={loc === k}
            onClick={() => setParam({ view: k === 'tat-ca' ? null : k, open: null })}
            className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold cursor-pointer ${
              loc === k
                ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)] border-[color:var(--accent-line)]'
                : 'bg-transparent text-slate-400 border-slate-300/20 hover:bg-white/5'
            }`}>
            {LOC_HOC_VIEN_NHAN[k].nhan}<span className="tabular-nums text-slate-200">{dem[k]}</span>
          </button>
        ))}
        {chiLop && (
          <button type="button" className="btn btn-sm shrink-0" title="Bỏ lọc lớp" onClick={() => setParam({ classId: null })}>
            Lớp {lopDangLoc?.code ?? chiLop} ✕
          </button>
        )}
      </div>
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
         * Mỗi NHÓM khung (Fast Track · Lớp thường) là một <section> có khối tiêu đề cột riêng ("Target" / "Khoá"); trong nhóm mỗi lớp MỘT
         * bảng riêng (cùng colgroup nên cột thẳng nhau) — PR-UX0 N-2; menu ⋯ vẽ ra ngoài (portal).
         * YC-11.1 (PR-N1): từ 768px bỏ khung cuộn ngang; khối tiêu đề là khối dính riêng theo <main>, hàng lớp đang mở dính ngay dưới nó
         * (`.hang-lon-dinh`). Khối tiêu đề dính chỉ trong <section> của nhóm mình (bẫy sticky: `sticky` bị chặn trong phần tử cha) nên hai
         * nhóm không bao giờ chồng tiêu đề lên nhau; mỗi lớp một bảng thì hàng lớp chỉ dính trong bảng của nó (chủ sản phẩm 28/09).
         * Điện thoại: cả khối cuộn ngang, không dính.
         */
        <div className="space-y-3">
          {/* Điện thoại (< 640 px, D2): mỗi lớp một thẻ gập, mỗi em một thẻ con — không bảng, không cuộn ngang. */}
          {dienThoai && nhomLop.map((g) => (
            <section key={g.k} className="space-y-2" aria-label={g.k === 'ft' ? 'Lớp Fast Track' : 'Lớp thường'}>
              {nhomLop.length > 1 && <h2 className="m-0 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{g.k === 'ft' ? 'Fast Track' : 'Lớp thường'}</h2>}
              {g.lop.map((c) => (
                <HopLop key={c.id} the lop={c} mo={openIds.includes(c.id)} onDoiMo={() => doiMo(c.id)}
                  chiHien={dangLoc ? (idsTheoLop.get(c.id) ?? new Set()) : null} sapXep={sapXep}
                  onThemHocVien={() => setThem({ id: c.id, code: c.code })} onDoi={trang.reload} />
              ))}
            </section>
          ))}
          {!dienThoai && nhomLop.map((g) => (
            <section key={g.k} className="card overflow-x-auto md:overflow-visible" aria-label={g.k === 'ft' ? 'Lớp Fast Track' : 'Lớp thường'}>
              <div className="md:sticky md:top-0 md:z-10" aria-hidden>
                <table className="w-full min-w-[860px] table-fixed text-sm">
                  <CotBangLop />
                  <thead><tr>{tieuDeCot(g.k).map((t, i) => <th key={i} className={`th ${i === 4 ? 'text-right' : ''}`}>{t}</th>)}</tr></thead>
                </table>
              </div>
              {g.lop.map((c) => (
                <table key={c.id} className="w-full min-w-[860px] table-fixed text-sm" aria-label={`Lớp ${c.code}`}>
                  <CotBangLop />
                  <thead className="sr-only"><tr>{tieuDeCot(g.k).map((t, i) => <th key={i}>{t || 'Thao tác'}</th>)}</tr></thead>
                  <HopLop lop={c} mo={openIds.includes(c.id)} onDoiMo={() => doiMo(c.id)}
                    chiHien={dangLoc ? (idsTheoLop.get(c.id) ?? new Set()) : null} sapXep={sapXep}
                    onThemHocVien={() => setThem({ id: c.id, code: c.code })} onDoi={trang.reload} />
                </table>
              ))}
            </section>
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
      <col className="w-[21%]" /><col className="w-[25%]" /><col className="w-[12%]" /><col className="w-[12%]" />
      <col className="w-[5%]" /><col className="w-[22%]" /><col className="w-12" />
    </colgroup>
  );
}

/**
 * HÀNG LỚN của một lớp (đặc tả §3.6; PR-UX0 N-2): ▸ · mã (mở Hồ sơ lớp) · chương trình · n HV · GVCN · tối đa 2 badge (+n) · ⋯.
 * ⋯ của lớp: Hồ sơ lớp · Nhập điểm (Q11, Q6) · + Học viên — chỉ mục người xem làm được.
 */
function HopLop({ lop, mo, onDoiMo, chiHien, sapXep, onThemHocVien, onDoi, the = false }: {
  lop: LopTrenTrang; mo: boolean; onDoiMo: () => void; chiHien: Set<number> | null; sapXep: SapXep;
  onThemHocVien: () => void; onDoi: () => void;
  /** Điện thoại: thẻ gập thay cho `<tbody>` (cùng nội dung: mã · chương trình · n HV · GVCN · badge · ⋯). */
  the?: boolean;
}) {
  const navigate = useNavigate();
  const { session } = useSession();
  const thuong = lop.scoringMode === 'ratio';
  /** Dòng phụ hàng lớp: `Fast Track · LT1 · 18 HV` — lớp thường không có lộ trình nên bỏ khúc giữa (mockup 21 mục 5). */
  const chuLop = [lop.programmeName ?? '—', !thuong && lop.route ? lop.route : null, `${lop.studentCount} HV`].filter(Boolean).join(' · ');
  const b = badgeLop({
    vai: laVaiQuanLy(session?.roles) ? 'ql' : 'gv', needsPlacement: lop.needsPlacement, canXepLop: lop.canXepLop, missingSkills: lop.missingSkills,
    soBaiChoCham: lop.needScores,
    needScoresTitle: lop.needScores > 0 ? needScoresText(lop.workScope, lop.needScores) : null,
    phase: lop.phase, soChoDuyet: lop.soChoDuyet, soEmQuaHan: lop.soEmQuaHan,
    missingCount: lop.missing.filter((m) => m.key !== 'teachers').length, soChuaLoTrinhTiep: lop.soChuaLoTrinhTiep,
    chuongTrinh: lop.programmeCode,
  });
  const denBadge = (x: BadgeLop): string | null =>
    /* PR-UX1: badge "n bài chờ chấm" mở Lịch Test lọc đúng lớp (Lịch Test tự mở "Lớp tôi dạy" cho GV). */
    x.key === 'cham' ? duongLichTest({ classId: lop.id })
      : x.key === 'xep-lop' ? (lop.viewer.coTheChuyenTiep ? `/hoc-vien/lop/${lop.id}?viec=chuyen-tiep` : `/hoc-vien/lop/${lop.id}`)
      : x.key === 'cho-duyet' ? `/cong-viec/cho-duyet?lop=${lop.id}`
      : x.key === 'qua-han' ? `/hoc-vien?view=qua-han&classId=${lop.id}`
      : null;
  const mucLop: MucMenu[] = [
    { key: 'ho-so', nhan: 'Hồ sơ lớp', onChon: () => navigate(`/hoc-vien/lop/${lop.id}`) },
    ...(lop.viewer.coTheNhapDiem
      ? [{ key: 'nhap-diem', nhan: 'Nhập điểm', onChon: () => navigate(thuong ? `/bang-diem-thuong/${lop.id}` : `/nhap-diem/${lop.id}`) }]
      : []),
    ...(lop.viewer.coTheSuaHocVien ? [{ key: 'them', nhan: '+ Học viên', onChon: onThemHocVien }] : []),
  ];

  const menuBadgeAn = b.an.length > 0 && (
    /* B4: "+n" bấm được — mỗi mục là một badge còn ẩn, bấm đi đúng đích (không có đích riêng thì mở Hồ sơ lớp, nơi số đó hiện). */
    <MenuDong bieuTuong={`+${b.an.length}`} nhan={`${b.an.length} việc khác của lớp ${lop.code}`}
      muc={b.an.map((x) => ({ key: x.key, nhan: x.nhan, onChon: () => navigate(denBadge(x) ?? `/hoc-vien/lop/${lop.id}`) }))} />
  );
  const cacBadge = b.hien.map((x) => {
    const den = denBadge(x);
    return den
      ? <Nhan key={x.key} tone={toneNhanTuBadge(x.tone)} title={x.title} onClick={() => navigate(den)}>{x.nhan}</Nhan>
      : <Nhan key={x.key} tone={toneNhanTuBadge(x.tone)} title={x.title}>{x.nhan}</Nhan>;
  });

  if (the) {
    return (
      <div className="card overflow-hidden" aria-label={`Lớp ${lop.code}`}>
        <div className="flex items-start gap-2 p-3">
          <button type="button" aria-expanded={mo} onClick={onDoiMo}
            className="flex min-h-[44px] min-w-0 flex-1 cursor-pointer items-start gap-2 border-0 bg-transparent p-0 text-left">
            <svg aria-hidden viewBox="0 0 8 8" width="8" height="8" className={`mt-[7px] shrink-0 text-slate-400 transition-transform ${mo ? 'rotate-90' : ''}`}>
              <path d="M2.5 1 6 4 2.5 7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="min-w-0">
              <span className="block font-extrabold text-slate-100">{lop.code}</span>
              <span className="block text-[11px] text-slate-400">
                {chuLop}{lop.gvcn && <> · GVCN {lop.gvcn.name}</>}
              </span>
            </span>
          </button>
          <MenuDong muc={mucLop} nhan="Thao tác khác" />
        </div>
        {(cacBadge.length > 0 || menuBadgeAn) && <div className="flex flex-wrap items-center gap-1.5 px-3 pb-2">{cacBadge}{menuBadgeAn}</div>}
        {mo && <BangHocVienLop the lop={lop} chiHien={chiHien} sapXep={sapXep} onDoi={onDoi} soCot={1} />}
      </div>
    );
  }

  return (
    <tbody>
      <HangNhom mo={mo} onMo={onDoiMo} nhan={`lớp ${lop.code}`} soCotDau={3} className={mo ? 'hang-lon-dinh' : ''}
        tieuDe={
          <span className="flex min-w-0 items-baseline gap-2">
            <Link to={`/hoc-vien/lop/${lop.id}`} className="shrink-0 font-extrabold text-slate-100 underline decoration-dotted underline-offset-4">
              {lop.code}
            </Link>
            <span className="min-w-0 truncate text-[11px] font-normal text-slate-400"
              title={`${chuLop}${lop.gvcn ? ` · GVCN ${lop.gvcn.name}` : ''}`}>
              {chuLop}
              {lop.gvcn && <> · <abbr title="Giáo viên chủ nhiệm" className="no-underline">GVCN</abbr> <TenGiaoVien id={lop.gvcn.id} ten={lop.gvcn.name} /></>}
            </span>
          </span>
        }>
        <td className="px-3" colSpan={3}>
          <span className="flex items-center justify-end gap-1.5">{cacBadge}{menuBadgeAn}</span>
        </td>
        <td className="px-2 text-center"><MenuDong muc={mucLop} nhan="Thao tác khác" /></td>
      </HangNhom>
      {mo && <BangHocVienLop lop={lop} chiHien={chiHien} sapXep={sapXep} onDoi={onDoi} soCot={7} />}
    </tbody>
  );
}
