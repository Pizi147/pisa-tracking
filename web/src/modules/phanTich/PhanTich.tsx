import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { useChiNhanhMacDinh } from '../../ui/Filters.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { ChonChuongTrinh } from '../worklist/ChonChuongTrinh.tsx';
import { BaoCao } from './BaoCao.tsx';
import { BoChonThoiGian } from './BoChonThoiGian.tsx';
import { HieuQuaPa } from './HieuQuaPa.tsx';
import { KetQuaThi } from './KetQuaThi.tsx';
import { PhanTichGiaoVien } from './PhanTichGiaoVien.tsx';
import { TongHopTestSos } from './TongHopTestSos.tsx';
import { YThucPhoiHop } from './YThucPhoiHop.tsx';
import { KheHangLoc, OChon, type PhamViPhanTich } from './dungChung.tsx';
import { dich as dichGoc, t } from '@shared/i18n/index.ts';
import {
  GOC_NHIN, PERMISSIONS, chuongTrinhTuThamSo, gocNhinTuThamSo, khoangTuUrl, nhanGocNhin, thamSoKhoang, thamSoXoaKhiDoiGoc,
  type ChuongTrinh, type GocNhin, type KhoangNgay,
} from '@shared/domain/index.ts';

/**
 * KHUNG PHÂN TÍCH (OV-15e, plan §7, mockup 3 mục 4 + mockup 6) — sáu tab (tối đa hai tầng: tab · tab con của Kết quả thi):
 * Báo cáo · Test + SOS · Kết quả thi · Hiệu quả PA · Phân tích GV · Ý thức. Dưới tab MỘT hàng lọc chung: Chương trình · Khoảng thời gian (C29, giữ khi
 * đổi tab, URL `kieu`/`tu`/`den`) · Lớp. Ô "Xếp theo" (Q6b) nằm ở đầu bảng của tab có nó. Chi nhánh ở đầu trang (`PhanTichPage`).
 */
export function PhanTich() {
  const { branchCount, session, can } = useSession();
  const { homNay } = useNgayNghiepVu();
  /* PR-OV2a: CX, TVV không có phần giáo viên (`nav.phanTichGv`); OV-10a: Ý thức cần `discipline.stats`. */
  const gocCo = GOC_NHIN.filter((k) => (k !== 'giao-vien' || !!session?.nav?.phanTichGv) && (k !== 'y-thuc' || can(PERMISSIONS.DISCIPLINE_STATS)));
  const [params, setParams] = useSearchParams();
  const macDinh = useChiNhanhMacDinh();
  const branchId = params.get('cn') ? Number(params.get('cn')) : macDinh;
  const doc = gocNhinTuThamSo(params);
  const { ct: ctTuLoaiLop, boThamSo, gocMoi } = doc;
  const goc = gocCo.includes(doc.goc) ? doc.goc : gocCo[0];
  const ct = chuongTrinhTuThamSo(params.get('ct'));
  const khoang = khoangTuUrl(params, homNay);
  const classId = params.get('lop') ? Number(params.get('lop')) : null;

  /* ĐƯỜNG DẪN CŨ VẪN VÀO ĐÚNG MÀN (Q1): dọn `xem`/`loai-lop`, đổi tên góc cũ; `tg` / `thang` cũ → khoảng chung (`kieu`/`tu`/`den`) — `replace`. */
  const cu = !!params.get('tg') || !!params.get('thang');
  useEffect(() => {
    if (!boThamSo.length && !gocMoi && !cu) return;
    const next = new URLSearchParams(params);
    for (const k of boThamSo) next.delete(k);
    if (ctTuLoaiLop) next.set('ct', ctTuLoaiLop);
    if (gocMoi) next.set('goc', gocMoi);
    if (cu) { for (const k of ['tg', 'thang', 'kieu', 'tu', 'den']) next.delete(k); for (const [k, v] of Object.entries(thamSoKhoang(khoang, homNay))) next.set(k, v); }
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boThamSo.join('|'), ctTuLoaiLop, gocMoi, cu]);

  const branches = useApi<any[]>('/ref/branches');
  /* Quản lý một chi nhánh vào thẳng phạm vi của mình (mục 10.2) — đọc URL MỚI NHẤT (OV-11h PT-12). */
  useEffect(() => {
    if (branchId || branchCount !== 1) return;
    const only = branches.data?.length === 1 ? branches.data[0] : null;
    if (!only) return;
    const next = new URLSearchParams(window.location.search);
    next.set('cn', String(only.id));
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branches.data, branchId, branchCount]);

  const dat = (o: Record<string, string | null>, replace = false) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(o)) if (v === null) next.delete(k); else next.set(k, v);
    setParams(next, { replace });
  };
  const setGoc = (k: GocNhin) => {
    const next = new URLSearchParams(params);
    next.set('goc', k);
    for (const p of thamSoXoaKhiDoiGoc(k, goc)) next.delete(p);   // khoảng thời gian chung giữ nguyên
    setParams(next, { replace: false });
  };
  /* Đổi chương trình thì lớp đang chọn có thể không còn hợp lệ — bỏ ngay (mục 4.4). */
  const setCt = (v: ChuongTrinh) => dat({ ct: v, lop: null });
  const setKhoang = (k: KhoangNgay) => dat({ kieu: null, tu: null, den: null, ...thamSoKhoang(k, homNay) });

  /* Ô Lớp (Q6): lớp của khung đang chọn (Ý thức gộp hai khung) + lớp đã kết thúc có lượt trong khoảng (OV-11h PT-10). */
  const coLop = goc === 'tong-hop' || goc === 'hieu-qua-pa' || goc === 'y-thuc' || goc === 'ket-qua-thi';
  const laYThuc = goc === 'y-thuc';
  const coCt = goc !== 'y-thuc' && goc !== 'ket-qua-thi';   // Kết quả thi chỉ Fast Track (Mock / Thi thật)
  const qLop = new URLSearchParams({ kieu: khoang.kieu, tu: khoang.tu, den: khoang.den, ...(branchId ? { branchId: String(branchId) } : {}) });
  const classesApi = useApi<any[]>(coLop ? `/ref/classes?${qLop}` : null, [qLop.toString(), coLop]);
  const ctLop: ChuongTrinh = goc === 'ket-qua-thi' ? 'ft' : ct;
  const classes = (classesApi.data ?? []).filter((c) => laYThuc || (c.scoring_mode === 'ratio') === (ctLop === 'thuong'));
  useEffect(() => {
    if (classId && classesApi.data && !classes.some((c) => c.id === classId)) dat({ lop: null }, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, classesApi.data, ct, goc]);

  const pv: PhamViPhanTich = { branchId, ct: laYThuc ? null : ctLop, khoang, classId: coLop ? classId : null };
  /* V8-PT: hai khe của hàng lọc — tab đặt ô riêng (giữa) và Xuất / In / ⋯ (cuối phải) qua `VaoHangLoc`. */
  const [dau, setDau] = useState<HTMLSpanElement | null>(null);
  const [giua, setGiua] = useState<HTMLSpanElement | null>(null);
  const [phai, setPhai] = useState<HTMLSpanElement | null>(null);

  return (
    <div className="space-y-3">
      <div data-hd="pt-goc" className="print:hidden">
        <HangTab ariaLabel={t('Phân tích')} value={goc} onChange={setGoc} tabs={gocCo.map((k) => ({ key: k, label: dichGoc(nhanGocNhin(k, ct)) }))} />
      </div>
      {/* V8-PT (P2): MỘT hàng lọc, mọi ô cao 36 chữ 14 — [chương trình | ô đoạn đầu của tab] · [Toàn bộ | Chọn khoảng tuần] · tuần → tuần · Mọi lớp ▾ ·
          ô riêng tab · (phải) Xuất / In / ⋯. 375: ô đoạn và thời gian hết hàng, ô chọn hai cột. */}
      <div className="flex flex-wrap items-center gap-2 print:hidden" data-hd="pt-hang-loc">
        {coCt && <ChonChuongTrinh value={ct} onChange={setCt} />}
        <span ref={setDau} className="contents" />
        <BoChonThoiGian khoang={khoang} onChange={setKhoang} toanBo />
        {coLop && (
          <OChon className="max-sm:w-[calc(50%-4px)]" dangLoc={!!classId} value={classId ?? ''} onChange={(e) => dat({ lop: e.target.value || null })} aria-label={t('Lớp')}>
            <option value="">{t('Mọi lớp')}</option>
            {classes.filter((c) => !c.ket_thuc).map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
            {classes.some((c) => c.ket_thuc) && (
              <optgroup label={t('Đã kết thúc')}>
                {classes.filter((c) => c.ket_thuc).map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
              </optgroup>
            )}
          </OChon>
        )}
        <span ref={setGiua} className="contents" />
        <span ref={setPhai} className="flex items-center gap-2 empty:hidden sm:ml-auto max-sm:w-full max-sm:[&>*]:flex-1">
          {/* "In" (V4, Báo cáo HV): giấy sáng A4 ngang — cuối hàng lọc như mockup. */}
          {goc === 'bao-cao' && <button type="button" className="btn h-9 max-sm:hidden" onClick={() => window.print()}>{t('In')}</button>}
        </span>
      </div>

      <KheHangLoc.Provider value={{ dau, giua, phai }}>
        {goc === 'bao-cao' && <BaoCao {...pv} />}
        {goc === 'tong-hop' && <TongHopTestSos {...pv} ct={ct} />}
        {goc === 'ket-qua-thi' && <KetQuaThi {...pv} />}
        {goc === 'hieu-qua-pa' && <HieuQuaPa {...pv} ct={ct} />}
        {goc === 'y-thuc' && <YThucPhoiHop {...pv} ct={null} />}
        {goc === 'giao-vien' && <PhanTichGiaoVien branchId={branchId} ct={ct} khoang={khoang} />}
      </KheHangLoc.Provider>
    </div>
  );
}
