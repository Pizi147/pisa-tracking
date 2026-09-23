import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { Card, Empty } from '../../ui/ui.tsx';
import { ChonChuongTrinh } from '../worklist/ChonChuongTrinh.tsx';
import { DanhSachCase } from '../cases/CaseBoardPage.tsx';
import { IssueAnalysis } from '../cases/IssueAnalysis.tsx';
import { YThucAnalysisView } from '../yThuc/YThucAnalysisView.tsx';
import { TongHopTestSos } from './TongHopTestSos.tsx';
import {
  GOC_NHIN, GOC_NHIN_LABEL, KHOANG, KHOANG_LABEL, KHOANG_MAC_DINH,
  chuongTrinhTuThamSo, gocNhinTuThamSo, khoangTuThamSo, ngay, tuDauKhoang,
  type ChuongTrinh, type GocNhin,
} from '@shared/domain/index.ts';

/**
 * KHUNG PHÂN TÍCH (§3.3, P7/P11) — tab "Phân tích" của Tổng quan (`/phan-tich`). Đầu trang (tiêu đề, ô chi nhánh, hai
 * tab Tổng quan | Phân tích) là của `OverviewPage.tsx` (PR-Pa, chỉ import). Ngay dưới là MỘT hàng: bên trái nhóm nút
 * góc nhìn, bên phải bộ lọc chung (chương trình · khoảng thời gian · lớp) — mọi góc nhìn đọc CÙNG bộ lọc này, nên
 * đổi chi nhánh hay chương trình ở đây thì cả năm góc nhìn đổi theo, không phải năm ô lọc rời nhau.
 */
export function PhanTich() {
  const { session, branchCount } = useSession();
  const [params, setParams] = useSearchParams();
  const branchId = params.get('cn') ? Number(params.get('cn')) : null;
  const { goc, ct: ctTuLoaiLop, boThamSo } = gocNhinTuThamSo(params);
  const ct = chuongTrinhTuThamSo(params.get('ct'));
  const tg = khoangTuThamSo(params.get('tg'));
  const classId = params.get('lop') ? Number(params.get('lop')) : null;

  /* ĐƯỜNG DẪN CŨ VẪN VÀO ĐÚNG MÀN (Q16) — chỉ dọn `xem`/`loai-lop`; KHÔNG đụng hang-doi/tinh-hinh/ky-nang (bộ lọc của Danh sách Case). */
  useEffect(() => {
    if (!boThamSo.length) return;
    const next = new URLSearchParams(params);
    for (const k of boThamSo) next.delete(k);
    if (ctTuLoaiLop) next.set('ct', ctTuLoaiLop);
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boThamSo.join('|'), ctTuLoaiLop]);

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
    setParams(next, { replace: false });
  };
  const setCt = (v: ChuongTrinh) => {
    const next = new URLSearchParams(params);
    if (v === 'ca-hai') next.delete('ct'); else next.set('ct', v);
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

  /* Ô lớp (Q6) — ẩn ở Ý thức: máy chủ Ý thức chưa nhận tham số lớp (P14, sau deploy). */
  const classesApi = useApi<any[]>(goc === 'y-thuc' ? null : `/ref/classes${branchId ? `?branchId=${branchId}` : ''}`, [branchId, goc]);
  const classes = (classesApi.data ?? []).filter((c) => ct === 'ca-hai' || (c.scoring_mode === 'ratio') === (ct === 'thuong'));
  useEffect(() => {
    if (classId && classesApi.data && !classes.some((c) => c.id === classId)) setClassId('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, classesApi.data, ct]);

  const demoDate = session?.demoDate ?? null;
  const from = demoDate ? tuDauKhoang(demoDate, tg) : null;
  /* VẤN ĐỀ HỌC VIÊN VÀ DANH SÁCH CASE LÀ HIỆN TRẠNG (Q5) — luật 5 của Hợp đồng số liệu: không trộn "hiện trạng" với một khoảng thời gian. */
  const laHienTrang = goc === 'van-de' || goc === 'danh-sach';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="radiogroup" aria-label="Góc nhìn" className="inline-flex rounded-lg border overflow-x-auto max-w-full"
          style={{ borderColor: 'var(--line)' }}>
          {GOC_NHIN.map((k) => (
            <button key={k} type="button" role="radio" aria-checked={goc === k} onClick={() => setGoc(k)}
              className={`px-3 py-1.5 text-sm border-0 cursor-pointer whitespace-nowrap ${
                goc === k
                  ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)] font-semibold'
                  : 'bg-transparent text-slate-400 hover:text-slate-200'
              }`}>
              {GOC_NHIN_LABEL[k]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ChonChuongTrinh value={ct} onChange={setCt} />
          {laHienTrang
            ? (demoDate && <span className="text-xs text-slate-500">Hiện trạng · đến {ngay(demoDate)}</span>)
            : (
              <select className="field w-28 text-xs" value={tg} onChange={(e) => setTg(Number(e.target.value))} aria-label="Khoảng thời gian">
                {KHOANG.map((n) => <option key={n} value={n}>{KHOANG_LABEL[n]}</option>)}
              </select>
            )}
          {goc !== 'y-thuc' && (
            <select className="field w-40 text-xs" value={classId ?? ''} onChange={(e) => setClassId(e.target.value)} aria-label="Lớp">
              <option value="">Mọi lớp</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Vấn đề học viên — Task 7 thay chỗ giữ chỗ này bằng ma trận thật. */}
      {goc === 'tong-hop' && <TongHopTestSos branchId={branchId} ct={ct} tg={tg} classId={classId} />}
      {goc === 'van-de' && <Card bodyClass="p-4"><Empty title="Đang xây dựng — xem tiếp ở PR-Pb Task 7" /></Card>}
      {goc === 'danh-sach' && <DanhSachCase branchId={branchId} ct={ct} classId={classId} />}
      {goc === 'ket-qua' && (
        <Card title="Kết quả hỗ trợ" bodyClass="p-3">
          <IssueAnalysis branchId={branchId} ct={ct} from={from} classId={classId} />
        </Card>
      )}
      {goc === 'y-thuc' && (
        <Card title="Ý thức & Phối hợp" bodyClass="p-3">
          <YThucAnalysisView branchId={branchId} ct={ct} from={from} />
        </Card>
      )}
    </div>
  );
}
