import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { useChiNhanhMacDinh } from '../../ui/Filters.tsx';
import { ChonChuongTrinh } from '../worklist/ChonChuongTrinh.tsx';
import { HieuQuaPa } from './HieuQuaPa.tsx';
import { PERMISSIONS } from '@shared/domain/index.ts';
import { PhanTichGiaoVien } from './PhanTichGiaoVien.tsx';
import { TongHopTestSos } from './TongHopTestSos.tsx';
import { TongHopVanDeHv } from './TongHopVanDeHv.tsx';
import { YThucPhoiHop } from './YThucPhoiHop.tsx';
import {
  GOC_NHIN, KHOANG, KHOANG_LABEL, KHOANG_MAC_DINH,
  chuongTrinhTuThamSo, gocNhinTuThamSo, khoangTuThamSo, nhanGocNhin, thamSoXoaKhiDoiGoc,
  type ChuongTrinh, type GocNhin,
} from '@shared/domain/index.ts';

/**
 * KHUNG PHÂN TÍCH (§3.3, P7/P11; PR-UX4 — năm góc nhìn) — tab "Phân tích" của Tổng quan (`/phan-tich`). Đầu trang (tiêu đề, ô chi nhánh,
 * hai tab Tổng quan | Phân tích) là của `OverviewPage.tsx` (PR-Pa, chỉ import). Ngay dưới là MỘT hàng: bên trái nhóm nút góc nhìn
 * (Tổng hợp Test + SOS · Tổng hợp vấn đề HV · Hiệu quả PA · Ý thức — PR-Pb2-a bỏ Danh sách Case), bên phải bộ lọc chung
 * (chương trình · khoảng thời gian · lớp) — mọi góc nhìn đọc CÙNG bộ lọc này.
 */
export function PhanTich() {
  const { branchCount, session, can } = useSession();
  /* PR-OV2a: CX, TVV không có phần giáo viên (`nav.phanTichGv`); link cũ `?goc=giao-vien` về góc đầu. */
  /* OV-10a: góc Ý thức cần `discipline.stats` (QL, Quản trị) — TVV, CX, Admin không có thì ẩn, không để ra lỗi 403. */
  const gocCo = GOC_NHIN.filter((k) => (k !== 'giao-vien' || !!session?.nav?.phanTichGv) && (k !== 'y-thuc' || can(PERMISSIONS.DISCIPLINE_STATS)));
  const [params, setParams] = useSearchParams();
  /* PR-NV (T9): cùng mặc định với Tổng quan (tab Phân tích nằm trong Tổng quan). */
  const macDinh = useChiNhanhMacDinh();
  const branchId = params.get('cn') ? Number(params.get('cn')) : macDinh;
  const doc = gocNhinTuThamSo(params);
  const { ct: ctTuLoaiLop, boThamSo, gocMoi } = doc;
  const goc = gocCo.includes(doc.goc) ? doc.goc : gocCo[0];
  const ct = chuongTrinhTuThamSo(params.get('ct'));
  const tg = khoangTuThamSo(params.get('tg'));
  const classId = params.get('lop') ? Number(params.get('lop')) : null;

  /*
   * ĐƯỜNG DẪN CŨ VẪN VÀO ĐÚNG MÀN (Q1) — dọn `xem`/`loai-lop`; đổi tên góc nhìn cũ (`ket-qua` → `hieu-qua-pa`, `chua-ai-nhan` →
   * `van-de`) bằng `replace`. Bộ lọc cũ của Danh sách Case đã được `duongMoi` chuyển hướng trước khi tới đây.
   */
  useEffect(() => {
    if (!boThamSo.length && !gocMoi) return;
    const next = new URLSearchParams(params);
    for (const k of boThamSo) next.delete(k);
    if (ctTuLoaiLop) next.set('ct', ctTuLoaiLop);
    if (gocMoi) next.set('goc', gocMoi);
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boThamSo.join('|'), ctTuLoaiLop, gocMoi]);

  /* 375px: hàng góc nhìn cuộn ngang trong chính nó — cuộn tới nút đang chọn để không bị che. */
  const hangGoc = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const nut = hangGoc.current?.querySelector<HTMLElement>('[aria-checked="true"]');
    const hang = hangGoc.current;
    if (!nut || !hang) return;
    hang.scrollLeft = Math.max(0, nut.offsetLeft - (hang.clientWidth - nut.offsetWidth) / 2);
  }, [goc]);

  const branches = useApi<any[]>('/ref/branches');
  /*
   * QUẢN LÝ MỘT CHI NHÁNH VÀO THẲNG PHẠM VI CỦA MÌNH (mục 10.2, chuyển nguyên từ CaseBoardPage cũ của PR-O/Pa):
   * bắt họ tự chọn đúng chi nhánh mình quản là một cú bấm thừa lặp lại mỗi lần mở màn.
   */
  useEffect(() => {
    if (branchId || branchCount !== 1) return;
    const only = branches.data?.length === 1 ? branches.data[0] : null;
    if (!only) return;
    const next = new URLSearchParams(params);
    next.set('cn', String(only.id));
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branches.data, branchId, branchCount]);

  const setGoc = (k: GocNhin) => {
    const next = new URLSearchParams(params);
    if (k === 'tong-hop') next.delete('goc'); else next.set('goc', k);
    for (const p of thamSoXoaKhiDoiGoc(k, goc)) next.delete(p);   // dọn tham số cũ nếu còn sót
    setParams(next, { replace: false });
  };
  const setCt = (v: ChuongTrinh) => {
    const next = new URLSearchParams(params);
    next.set('ct', v);
    /* Đổi chương trình thì lớp đang chọn có thể không còn hợp lệ — bỏ ngay, đừng để ra danh sách rỗng khó hiểu (mục 4.4). */
    next.delete('lop');
    setParams(next, { replace: false });
  };
  const setTg = (n: number) => {
    const next = new URLSearchParams(params);
    if (n === KHOANG_MAC_DINH) next.delete('tg'); else next.set('tg', String(n));
    setParams(next, { replace: false });
  };
  const setClassId = (id: string) => {
    const next = new URLSearchParams(params);
    if (id) next.set('lop', id); else next.delete('lop');
    setParams(next, { replace: false });
  };

  /* Ô lớp (Q6) — P14 (PR-YT2): máy chủ Ý thức nay đã nhận tham số lớp, nên bật lại ở góc nhìn Ý thức. */
  const classesApi = useApi<any[]>(`/ref/classes${branchId ? `?branchId=${branchId}` : ''}`, [branchId]);
  /* Ý thức gộp hai khung (Q2) → ô Lớp liệt kê mọi lớp; góc nhìn khác chỉ lớp của khung đang chọn. */
  const laYThuc = goc === 'y-thuc';
  const classes = (classesApi.data ?? []).filter((c) => laYThuc || (c.scoring_mode === 'ratio') === (ct === 'thuong'));
  useEffect(() => {
    if (classId && classesApi.data && !classes.some((c) => c.id === classId)) setClassId('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, classesApi.data, ct, laYThuc]);


  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* PR-KHUNG G5: khung vuốt bọc ngoài viền, mép phải mờ dưới 640px (cùng mẫu BoLocDoan). */}
        <div ref={hangGoc} className="relative inline-flex max-w-full overflow-x-auto max-sm:[scrollbar-width:none] max-sm:pr-8 max-sm:[mask-image:linear-gradient(to_right,#000_calc(100%-2rem),transparent)]">
        <div role="radiogroup" aria-label="Góc nhìn" className="inline-flex shrink-0 rounded-lg border"
          style={{ borderColor: 'var(--line)' }}>
          {gocCo.map((k) => (
            <button key={k} type="button" role="radio" aria-checked={goc === k} onClick={() => setGoc(k)}
              className={`px-3 py-1.5 text-sm border-0 cursor-pointer whitespace-nowrap max-sm:min-h-10 ${
                goc === k
                  ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)] font-semibold'
                  : 'bg-transparent text-slate-400 hover:text-slate-200'
              }`}>
              {nhanGocNhin(k, ct)}
            </button>
          ))}
        </div>
        </div>
        {goc !== 'giao-vien' && (<div className="flex flex-wrap items-center gap-2">
          {!laYThuc && <ChonChuongTrinh value={ct} onChange={setCt} />}
          {goc === 'van-de' && <span className="text-xs text-slate-500" title="Case đang mở, cộng Case đã đóng trong khoảng này">Case mở + đóng trong</span>}
          {!(goc === 'hieu-qua-pa' && params.get('tu')) && <select className="field w-28 text-xs" value={tg} onChange={(e) => setTg(Number(e.target.value))} aria-label="Khoảng thời gian">
            {KHOANG.map((n) => <option key={n} value={n}>{KHOANG_LABEL[n]}</option>)}
          </select>}
          <select className="field w-40 text-xs" value={classId ?? ''} onChange={(e) => setClassId(e.target.value)} aria-label="Lớp">
            <option value="">Mọi lớp</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
          </select>
        </div>)}
      </div>

      {goc === 'tong-hop' && <TongHopTestSos branchId={branchId} ct={ct} tg={tg} classId={classId} />}
      {goc === 'van-de' && <TongHopVanDeHv branchId={branchId} ct={ct} tg={tg} classId={classId} />}
      {goc === 'hieu-qua-pa' && <HieuQuaPa branchId={branchId} ct={ct} tg={tg} classId={classId} />}
      {goc === 'y-thuc' && <YThucPhoiHop branchId={branchId} ct={null} tg={tg} classId={classId} />}
      {goc === 'giao-vien' && <PhanTichGiaoVien branchId={branchId} />}
    </div>
  );
}
