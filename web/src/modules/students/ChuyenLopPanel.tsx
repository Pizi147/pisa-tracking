import { useEffect, useMemo, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Hang2, Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { NutChon } from '../../ui/ui.tsx';
import { ChonThang } from '../../ui/ChonNgay.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { OTuan } from '../classes/TransitionPanel.tsx';
import { CHU_CHUYEN_LOP, NHAN_XET_TOI_THIEU, chuTuanHoc, dsLoi, hanBanGiao, ngay, tuanChonDuoc, tuanLich, type LuatTruong } from '@shared/domain/index.ts';

type LopDich = { id: number; code: string; chiNhanhId: number; ma: string | null; ft: boolean; tenChuongTrinh: string | null; tuan: string | null; gvcn: string | null };
type LopDichData = { chiNhanh: { id: number; name: string }[]; lop: LopDich[] };
type CaseMo = { id: number; title: string | null; category: string | null; owner: string | null; seDong: boolean; goiY: { id: number; ten: string } | null };
type LenhCho = { id: number; huong: string; lopDichId: number | null; tuan: string; mucTieu: number | 'KCK' | null; ngayThi: string | null; lyDo: string | null; loi: string | null };
type XemChuyenLopData = {
  hienTai: { lop: { id: number; code: string }; ma: string | null; ft: boolean; chiNhanhId: number; route: string | null; tuanHoc: { tuan: number | null; tong: number | null; dangDung: boolean } | null };
  caseMo: CaseMo[];
  luat: { khoa: 'giu' | 'dong-mo'; dongCase: 'ft' | 'normal' | null; canMucTieu: boolean; endKind: string } | null;
  canLuuY: boolean; doiChiNhanh: boolean; lenh: LenhCho | null; tuanChon: string[]; today: string;
};

/** Thẻ Đề xuất chuyển lớp đang được duyệt: panel mở điền sẵn, nút chính `Duyệt và quyết định` (mockup 20 — thẻ Chờ duyệt → D). */
export type DuyetDeXuat = { id: number; lopDichId: number | null; tuan: string | null; lyDo: string | null };

/**
 * CHUYỂN MỘT EM (PR-CT, §3.1f Q30-1, mockup 20 màn D) — MỘT panel `KhungPanel`, hai chế độ theo vai:
 *   · `cheDo="lenh"` (Quản lý): `Chuyển lớp…` → chọn lớp chuyển đến (mọi chi nhánh), Tuần bắt đầu, Lý do → `Quyết định chuyển lớp`. Web tự chuyển vào Thứ Hai của tuần đó.
 *     Em đã có lệnh: mở ở chế độ sửa (`Lưu quyết định` + `Huỷ quyết định`). Mở từ thẻ Đề xuất chuyển lớp (`duyet`): điền sẵn, nút `Duyệt và quyết định`.
 *   · `cheDo="de-xuat"` (GVCN): `Đề xuất chuyển lớp…` → thẻ Thông tin HV ở Chờ duyệt (5 ngày); Quản lý được sửa lớp và tuần trước khi duyệt.
 * Nằm ở: Hồ sơ học viên › ⋮ · ⋯ cuối dòng học viên trong hồ sơ lớp.
 */
export function ChuyenLopPanel({ open, onClose, studentId, studentName, lop, onDone, cheDo = 'lenh', duyet }: {
  open: boolean; onClose: () => void; studentId: number; studentName?: string; lop?: string | null; onDone?: () => void;
  cheDo?: 'lenh' | 'de-xuat'; duyet?: DuyetDeXuat;
}) {
  if (!open) return null;
  return <NoiDungChuyenLop onClose={onClose} studentId={studentId} studentName={studentName} lop={lop} onDone={onDone} cheDo={cheDo} duyet={duyet} />;
}

function NoiDungChuyenLop({ onClose, studentId, studentName, lop, onDone, cheDo, duyet }: {
  onClose: () => void; studentId: number; studentName?: string; lop?: string | null; onDone?: () => void;
  cheDo: 'lenh' | 'de-xuat'; duyet?: DuyetDeXuat;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const dx = cheDo === 'de-xuat';
  const lopDich = useApi<LopDichData>(`/chuyen-lop/lop-dich?studentId=${studentId}`, [studentId]);
  const [chiNhanhId, setChiNhanhId] = useState<number | null>(null);
  const [toClassId, setToClassId] = useState<number | null>(duyet?.lopDichId ?? null);
  /* GVCN không có quyền xem luật ra lệnh (403) — chỉ Quản lý gọi đường xem trước. */
  const xem = useApi<XemChuyenLopData>(dx ? null : (toClassId ? `/students/${studentId}/chuyen-lop?toClassId=${toClassId}` : `/students/${studentId}/chuyen-lop`), [studentId, toClassId, dx]);
  const [tuan, setTuan] = useState(duyet?.tuan ?? '');
  const [lyDo, setLyDo] = useState(duyet?.lyDo ?? '');
  const [mucTieu, setMucTieu] = useState('');
  const [thangThi, setThangThi] = useState('');
  const [dangHuy, setDangHuy] = useState(false);
  const [lyDoHuy, setLyDoHuy] = useState('');
  const [khac, setKhac] = useState(false);
  const lf = useLoiForm();
  const [busy, setBusy] = useState(false);
  const lenh = xem.data?.lenh ?? null;
  const tuanChon = xem.data?.tuanChon ?? (homNay ? tuanChonDuoc(homNay) : []);
  const luat = xem.data?.luat ?? null;
  const caseMo = xem.data?.caseMo ?? [];

  /* Điền sẵn từ lệnh đang có (chế độ sửa) — một lần khi dữ liệu về. */
  const [daDien, setDaDien] = useState(false);
  useEffect(() => {
    if (daDien || !xem.data) return;
    setDaDien(true);
    const l = xem.data.lenh;
    if (l && !duyet) {
      /* Lệnh đã tới tuần mà chưa chuyển được: điền sẵn tuần hợp lệ gần nhất (PR-S5F-a) — tuần cũ máy chủ không nhận. */
      setToClassId(l.lopDichId); setTuan(l.tuan >= (xem.data.tuanChon[0] ?? '') ? l.tuan : xem.data.tuanChon[0] ?? ''); setLyDo(l.lyDo ?? '');
      setMucTieu(l.mucTieu == null ? '' : String(l.mucTieu)); setThangThi(l.ngayThi ?? '');
    } else if (!duyet?.tuan) setTuan(xem.data.tuanChon[0] ?? '');
    setChiNhanhId(null);
  }, [xem.data, daDien, duyet]);
  useEffect(() => {
    if (chiNhanhId !== null || !lopDich.data) return;
    const dich = lopDich.data.lop.find((l) => l.id === toClassId);
    setChiNhanhId(dich?.chiNhanhId ?? xem.data?.hienTai.chiNhanhId ?? lopDich.data.chiNhanh[0]?.id ?? null);
  }, [lopDich.data, xem.data, toClassId, chiNhanhId]);

  const lopCuaChiNhanh = useMemo(() => (lopDich.data?.lop ?? []).filter((l) => l.chiNhanhId === chiNhanhId), [lopDich.data, chiNhanhId]);
  const dich = (lopDich.data?.lop ?? []).find((l) => l.id === toClassId) ?? null;
  const nhanLop = (l: LopDich) => [l.code, l.tenChuongTrinh, l.tuan ? `tuần học ${l.tuan}` : null, `GVCN ${l.gvcn ?? 'chưa có'}`].filter(Boolean).join(' · ');
  const han = hanBanGiao(xem.data?.today ?? homNay ?? '2000-01-01');

  const LUAT: LuatTruong[] = dx
    ? [{ khoa: 'ly-do', nhan: 'Lý do', toiThieu: NHAN_XET_TOI_THIEU }]
    : [
      { khoa: 'lop', nhan: 'Lớp chuyển đến', chon: true },
      { khoa: 'tuan', nhan: 'Tuần bắt đầu', chon: true },
      { khoa: 'ly-do', nhan: 'Lý do', toiThieu: 3 },
      ...(luat?.canMucTieu ? [{ khoa: 'muc-tieu', nhan: 'Target (hoặc KCK)', chon: true }] : []),
    ];
  const loi = dsLoi(LUAT, { lop: toClassId, tuan, 'ly-do': lyDo, 'muc-tieu': mucTieu });
  const mucTieuGui = mucTieu.trim().toUpperCase() === 'KCK' ? 'KCK' : mucTieu.trim() ? Number(mucTieu) : undefined;
  const xong = (chu: string) => {
    invalidate('/students'); invalidate('/attempts'); invalidate('/overview'); invalidate('/cases'); invalidate('/classes'); invalidate('/hoc-vien-lop');
    invalidate('/my-work'); invalidate('/yeu-cau'); invalidate('/lenh-chuyen');
    toast.push('ok', chu);
    onDone?.(); onClose();
  };
  const loiMay = (e: any) => toast.push('error', e?.message ?? 'Không lưu được — thử lại.');

  const gui = async () => {
    lf.bam();
    if (loi.length > 0) return;
    setBusy(true);
    try {
      if (dx) {
        await api.post(`/students/${studentId}/de-xuat-chuyen-lop`, { toClassId: toClassId ?? undefined, tuan: tuan || undefined, lyDo: lyDo.trim() });
        xong('Đã gửi đề xuất — Quản lý sẽ xem trong Chờ duyệt');
      } else if (duyet) {
        await api.post(`/yeu-cau/${duyet.id}/duyet`, { duLieu: { lopDichId: toClassId, tuan, lyDo: lyDo.trim(), mucTieu: mucTieuGui, ngayThi: thangThi || undefined } });
        xong('Đã duyệt và quyết định chuyển lớp');
      } else if (lenh) {
        await api.patch(`/lenh-chuyen/${lenh.id}`, { toClassId, tuan, lyDo: lyDo.trim(), mucTieu: mucTieuGui ?? null, ngayThi: thangThi || null, huong: dich?.ft && !xem.data?.hienTai.ft ? 'fast_track' : 'chuyen_lop' });
        xong('Đã lưu quyết định chuyển lớp');
      } else {
        await api.post(`/students/${studentId}/transfer`, { toClassId, tuan, lyDo: lyDo.trim(), mucTieu: mucTieuGui, ngayThi: thangThi || undefined });
        xong('Đã lưu quyết định chuyển lớp');
      }
    } catch (e: any) { loiMay(e); } finally { setBusy(false); }
  };
  const huyLenh = async () => {
    if (!lenh || lyDoHuy.trim().length < 3) return;
    setBusy(true);
    try { await api.post(`/lenh-chuyen/${lenh.id}/huy`, { lyDo: lyDoHuy.trim() }); xong('Đã huỷ quyết định chuyển lớp'); } catch (e: any) { loiMay(e); } finally { setBusy(false); }
  };

  const tuanDong = dx ? [] : tuanChon.slice(0, 3);
  const nhanChinh = dx ? 'Gửi đề xuất' : duyet ? 'Duyệt và quyết định' : lenh ? CHU_CHUYEN_LOP.luu : CHU_CHUYEN_LOP.quyetDinh;
  const dangHoc = xem.data?.hienTai;
  const luatDong = !dx && toClassId && luat ? [
    luat.khoa === 'giu' ? `Giữ lộ trình ${dangHoc?.route ?? ''} (cùng lộ trình, không mở lộ trình mới)`.replace('  ', ' ') : 'Đóng lộ trình cũ và mở lộ trình mới theo lớp chuyển đến',
    luat.khoa === 'giu' ? 'MT chưa thi chuyển sang lớp mới' : 'Bài chưa làm ở lại lớp cũ',
    ...(caseMo.length ? [luat.dongCase === 'ft' ? `${caseMo.length} Case đang mở tự đóng “Lên FT”`
      : `${caseMo.length} Case đang mở đi theo em${caseMo.find((c) => c.goiY) ? `, người nhận gợi ý: ${caseMo.find((c) => c.goiY)!.goiY!.ten}` : ''}`] : []),
    ...(xem.data?.doiChiNhanh ? ['Quản lý chi nhánh mới và GVCN lớp mới được báo “Sắp nhận”'] : []),
  ] : [];

  return (
    <KhungPanel tieuDe={dx ? 'Đề xuất chuyển lớp' : 'Chuyển lớp'} hocVien={studentName} lop={lop} onDong={onClose}
      chan={{
        huy: { nhan: 'Đóng', onClick: onClose, disabled: busy },
        ...(!dx && lenh && !duyet ? { xoa: { nhan: CHU_CHUYEN_LOP.huy, onClick: () => setDangHuy((v) => !v) } } : {}),
        conThieu: lf.conThieu(loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={gui} disabled={busy}>{nhanChinh}</button>,
        dongTren: !dx && xem.data?.hienTai ? (
          <p className="m-0 px-4 pt-2 text-xs text-slate-400">GVCN {xem.data.hienTai.lop.code} bàn giao, hạn hết {ngay(han.gvcn, homNay)}.</p>
        ) : undefined,
      }}>
      {lopDich.loading || (!dx && xem.loading && !xem.data) ? <p className="mt-3 text-sm text-slate-500">Đang tải…</p> : (
        <>
          {!dx && dangHoc && (
            <p className="mb-0 mt-3 text-xs text-slate-400">
              Đang học {dangHoc.lop.code}{dangHoc.route ? ` · ${dangHoc.route}` : ''}{dangHoc.tuanHoc ? ` · ${chuTuanHoc(dangHoc.tuanHoc.tuan, dangHoc.tuanHoc.tong, dangHoc.tuanHoc.dangDung)}` : ''}
            </p>
          )}
          {lenh?.loi && !duyet && <p role="alert" className="mb-0 mt-2 text-xs text-late">Chưa chuyển được: {lenh.loi}</p>}
          {!dx && lenh && !duyet && !lenh.loi && <p className="mb-0 mt-2 text-xs text-slate-400">Em đã có quyết định chuyển lớp bắt đầu {tuanLich(lenh.tuan, homNay)} — sửa hoặc huỷ trước tuần đó.</p>}
          {!dx && lenh?.loi && !duyet && <p className="mb-0 mt-1 text-xs text-slate-400">Chọn tuần hoặc lớp chuyển đến mới rồi lưu, hoặc huỷ quyết định.</p>}
          {dangHuy && (
            <Khoi tieuDe={CHU_CHUYEN_LOP.huy}>
              <Truong nhan="Lý do huỷ" batBuoc>
                <input className="field w-full" value={lyDoHuy} onChange={(e) => setLyDoHuy(e.target.value)} />
              </Truong>
              <button type="button" className="btn btn-danger min-h-[44px] sm:min-h-0" disabled={busy || lyDoHuy.trim().length < 3} onClick={huyLenh}>Xác nhận huỷ quyết định</button>
            </Khoi>
          )}

          <Khoi tieuDe={dx ? 'Đề xuất' : 'Lớp chuyển đến'}>
            <Hang2>
              <Truong nhan="Chi nhánh">
                <select className="field w-full" value={chiNhanhId ?? ''} onChange={(e) => { setChiNhanhId(Number(e.target.value)); setToClassId(null); }}>
                  {(lopDich.data?.chiNhanh ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </Truong>
              <Truong nhan="Lớp chuyển đến" batBuoc={!dx} tuyChon={dx} loi={lf.loiCua(loi, 'lop')}>
                <select className="field w-full" {...lf.o(loi, 'lop')} value={toClassId ?? ''} onChange={(e) => setToClassId(Number(e.target.value) || null)}>
                  <option value="">{dx ? 'Chưa chọn' : 'Chọn lớp'}</option>
                  {lopCuaChiNhanh.map((l) => <option key={l.id} value={l.id}>{nhanLop(l)}</option>)}
                </select>
              </Truong>
            </Hang2>
            {!dx && xem.data && chiNhanhId !== null && chiNhanhId !== xem.data.hienTai.chiNhanhId && (
              <p className="m-0 text-xs text-soon">Quản lý chi nhánh và GVCN lớp mới sẽ nhận thông báo “Sắp nhận”.</p>
            )}
            <Truong nhan={dx ? 'Từ tuần' : 'Tuần bắt đầu'} batBuoc={!dx} tuyChon={dx} as="div" loi={lf.loiCua(loi, 'tuan')}>
              {!dx && (
                <div {...lf.o(loi, 'tuan')} tabIndex={-1} className="flex flex-wrap gap-1.5 outline-none">
                  {tuanDong.map((t) => <NutChon key={t} chon={tuan === t && !khac} onClick={() => { setTuan(t); setKhac(false); }}>{tuanLich(t, homNay)}</NutChon>)}
                  <NutChon chon={khac || (!!tuan && !tuanDong.includes(tuan))} onClick={() => setKhac(true)}>Tuần khác…</NutChon>
                </div>
              )}
              {(dx || khac || (!!tuan && !tuanDong.includes(tuan))) && (
                <div className={dx ? '' : 'mt-2 max-w-[11rem]'}>
                  <OTuan tuanChon={tuanChon.length ? tuanChon : []} rong value={tuan} onChange={setTuan} ariaLabel={dx ? 'Từ tuần' : 'Tuần bắt đầu khác'} chuaChon={dx ? 'Chưa chọn' : 'Chọn tuần'} />
                </div>
              )}
            </Truong>
            <Truong nhan="Lý do" batBuoc loi={lf.loiCua(loi, 'ly-do')} dem={dx ? { co: lyDo.trim().length, can: NHAN_XET_TOI_THIEU } : undefined}>
              <textarea className="field w-full" rows={2} {...lf.o(loi, 'ly-do')} value={lyDo} onChange={(e) => setLyDo(e.target.value)}
                placeholder={dx ? 'Ví dụ: Phụ huynh xin chuyển sang lớp khác giờ học' : 'Ví dụ: Lớp đông, chuyển sang lớp cùng tiến độ'} />
            </Truong>
            {luat?.canMucTieu && (
              <Hang2>
                <Truong nhan="Target" batBuoc loi={lf.loiCua(loi, 'muc-tieu')} phu="Số band 0–9 hoặc KCK (không cam kết)">
                  <input className="field w-full tabular-nums" {...lf.o(loi, 'muc-tieu')} value={mucTieu} placeholder="Ví dụ: 6.0" onChange={(e) => setMucTieu(e.target.value)} />
                </Truong>
                <Truong nhan="Dự kiến thi" tuyChon>
                  <ChonThang value={thangThi} onChange={setThangThi} chuaChon="Chưa chọn" />
                </Truong>
              </Hang2>
            )}
          </Khoi>

          {dx ? (
            <p className="mb-0 mt-3 text-xs text-slate-400">
              Gửi thành thẻ trong Chờ duyệt của Quản lý (loại Thông tin HV, hạn 5 ngày). Quản lý duyệt = ra quyết định chuyển lớp; Quản lý được sửa lớp và tuần trước khi duyệt.
            </p>
          ) : luatDong.length > 0 && (
            <Khoi tieuDe="Khi chuyển, web sẽ">
              <ul className="m-0 list-disc space-y-1 pl-5 text-sm text-slate-200">{luatDong.map((c) => <li key={c}>{c}</li>)}</ul>
            </Khoi>
          )}
        </>
      )}
    </KhungPanel>
  );
}
