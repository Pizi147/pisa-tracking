import { useMemo, useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { ErrorState, NutChon, Skeleton } from '../../ui/ui.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { chayHangLoat, hoanTacHangLoat } from '../students/hangLoatEm.ts';
import {
  CHU_CHUYEN_LOP, chipSosMt0, chuTuanHoc, ghepMucTieu, tachMucTieu, hanBanGiao, kiemDongLenh, ketQuaGanNhat, laChuyenNgay, LO_CHUYEN_NGAY, maHocVienNgan, ngay, nhanTuanBatDau,
  thuNgay, tomTatLenh, tuanLich, type AssessedSkill, type DongTomTatLenh, type HuongLenh, type KetQuaVao, type MucTieuLenh } from '@shared/domain/index.ts';
import { ClassCreatePanel } from './ClassCreatePanel.tsx';
import { t } from '@shared/i18n/index.ts';

/** Cách Quản lý chọn trên hàng (mockup 20 — I). `doi` = Đổi lộ trình: lớp chuyển đến khác lộ trình, vẫn là `chuyen_lop` (Q3). */
type Kieu = 'bao-luu' | 'dung' | 'chuyen' | 'doi';
type Dong = { kieu: Kieu | ''; toClassId: number | 'new' | ''; tuan: string; mucTieu: string; ngayThi: string; lyDo: string; ngayXemLai: string };
const DONG_TRONG: Dong = { kieu: '', toClassId: '', tuan: '', mucTieu: '', ngayThi: '', lyDo: '', ngayXemLai: '' };
const HUONG_CUA: Record<Kieu, HuongLenh> = { 'bao-luu': 'bao_luu', dung: 'dung_hoc', chuyen: 'chuyen_lop', doi: 'chuyen_lop' };
const NHAN_KIEU: Record<Kieu, string> = { chuyen: 'Chuyển lớp FT', doi: 'Đổi lộ trình', 'bao-luu': 'Tạm dừng học (bảo lưu)', dung: 'Dừng học hẳn' };
const canLop = (k: Kieu | '') => k === 'chuyen' || k === 'doi';

/** Cột lưới 6 cột. Dưới sm mỗi em là một khối xếp dọc (375 px, không cuộn ngang). */
const LUOI = 'lg:grid-cols-[28px_minmax(140px,1.15fr)_minmax(150px,1.1fr)_minmax(330px,2.1fr)_minmax(170px,1.1fr)_minmax(140px,.8fr)]';

/** Chữ hướng của quyết định chuyển lớp (ô "Huỷ quyết định n em": `Chuyển lớp FT 2 · Dừng học hẳn 1`). */
const TEN_HUONG: Record<string, string> = { bao_luu: NHAN_KIEU['bao-luu'], dung_hoc: NHAN_KIEU.dung, chuyen_lop: NHAN_KIEU.chuyen };

/**
 * CHUYỂN LỚP CẢ LỚP FT (PR-CT, §3.1f Q30-1, mockup 20 màn I) — Quản lý RA LỆNH: em nào · lớp chuyển đến · tuần bắt đầu. Web tự chuyển vào Thứ Hai
 * của tuần đó; tới lúc đó Quản lý sửa / huỷ quyết định được. Chỉ lớp FT (gộp / tách lớp, đổi lộ trình); lớp thường dùng cách xem "Lộ trình tiếp theo" ở tab Học viên (OV-3b).
 *
 * Hai bước: 1 Soạn (mỗi em một hàng với đúng ba quyết định — hướng, lớp chuyển đến, tuần) rồi 2 Xác nhận (tóm tắt bằng câu). "Gửi phần đã quyết
 * trước, quyết nốt sau": em chưa chọn KHÔNG có lệnh. Lối vào: hồ sơ lớp FT → ⋮ `Chuyển tiếp lớp…`.
 */
export function TransitionPanel({ classId, open, onClose, onDone }: {
  classId: number; open: boolean; onClose: () => void; onDone: () => void;
}) {
  if (!open) return null;
  return <NoiDung classId={classId} onClose={onClose} onDone={onDone} />;
}

function NoiDung({ classId, onClose, onDone }: { classId: number; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const { data, loading, error, reload } = useApi<any>(`/classes/${classId}/transition`, [classId]);
  const lf = useLoiForm();
  const [buoc, setBuoc] = useState<1 | 2>(1);
  const [busy, setBusy] = useState(false);
  const [tuanChung, setTuanChung] = useState('');
  const [dongs, setDongs] = useState<Record<number, Partial<Dong>>>({});
  const [daSua, setDaSua] = useState<ReadonlySet<number>>(new Set());
  const [chon, setChon] = useState<ReadonlySet<number>>(new Set());
  const [bulk, setBulk] = useState<{ kieu: Kieu | ''; toClassId: number | 'new' | '' }>({ kieu: '', toClassId: '' });
  const [loiMayChu, setLoiMayChu] = useState<Record<number, string>>({});
  const [taoLop, setTaoLop] = useState(false);
  const [huy, setHuy] = useState<{ sid: number; lyDo: string } | null>(null);
  /* PR-LUI-b: huỷ NHIỀU quyết định một lần (đi qua cùng đường làm nhiều học viên: `huy-lenh`; Hoàn tác = `khoi-phuc-lenh`). */
  const [huyNhieu, setHuyNhieu] = useState<{ lyDo: string } | null>(null);
  const [dangHuy, setDangHuy] = useState(false);
  const [tienDo, setTienDo] = useState<[number, number] | null>(null);

  const homNay: string = data?.today ?? '';
  const tuanCh = tuanChung || data?.tuanChon?.[0] || '';
  const students: any[] = data?.students ?? [];
  const routeTu: string | null = data?.from?.route ?? null;

  const kieuTuLenh = (l: any): Kieu | '' => {
    if (!l) return '';
    if (l.huong === 'bao_luu') return 'bao-luu';
    if (l.huong === 'dung_hoc') return 'dung';
    const dich = (data?.candidates ?? []).find((c: any) => c.id === l.lopDichId);
    return dich && dich.route && routeTu && dich.route !== routeTu ? 'doi' : 'chuyen';
  };
  const macDinh = (s: any): Dong => {
    const l = s.lenh;
    if (!l) return DONG_TRONG;
    return {
      /* Tuần đã qua (lệnh chưa chuyển được, PR-S5F-a) → về tuần chung để Quản lý chọn tuần mới. */
      kieu: kieuTuLenh(l), toClassId: l.lopDichId ?? '', tuan: l.tuan === tuanCh || (!!homNay && l.tuan <= homNay) ? '' : l.tuan, mucTieu: l.mucTieu == null ? '' : String(l.mucTieu),
      ngayThi: l.ngayThi ?? '', lyDo: l.lyDo ?? '', ngayXemLai: l.ngayXemLai ?? '',
    };
  };
  const dongCua = (s: any): Dong => ({ ...macDinh(s), ...(dongs[s.id] ?? {}) });
  const sua = (sid: number, p: Partial<Dong>) => {
    if (p.toClassId === 'new') setTaoLop(true);
    setDaSua((x) => (x.has(sid) ? x : new Set(x).add(sid)));
    setDongs((m) => ({ ...m, [sid]: { ...m[sid], ...p } }));
    setLoiMayChu((m) => { if (!(sid in m)) return m; const { [sid]: _, ...con } = m; return con; });
  };

  /** Lớp chuyển đến hợp lệ theo cách chọn — cùng luật máy chủ (`kiemDongChuyenTiep`), máy chủ vẫn kiểm lại. */
  const lopHopLe = (k: Kieu | ''): any[] => (data?.candidates ?? []).filter((c: any) => {
    if (k === 'chuyen') return c.ft;
    if (k === 'doi') return c.ft && (!routeTu || c.route !== routeTu);
    return false;
  });
  const nhanLop = (c: any) => [c.code, c.ft ? c.route : null, `${c.studentCount} em`].filter(Boolean).join(' · ');

  const dichCua = (d: Dong) => (typeof d.toClassId === 'number' ? (data?.candidates ?? []).find((c: any) => c.id === d.toClassId) ?? null : null);
  const mucTieuCua = (d: Dong): MucTieuLenh | null => {   // OV-9: "6.5 KCK" = Target + dấu KCK
    if (!d.mucTieu.trim()) return null;
    const t = tachMucTieu(d.mucTieu.trim());
    return ghepMucTieu(t.target, t.kck);
  };
  /* Lớp FT không có Final Test → không có gợi ý Cuối khoá (`khacGoiY` false); máy chủ vẫn kiểm lại. */
  const kiemTra = (d: Dong): string | null => {
    if (!d.kieu) return null;
    const dich = dichCua(d);
    return kiemDongLenh({
      huong: HUONG_CUA[d.kieu], lopDichId: dich?.id ?? null, lopDichFt: !!dich?.ft, nguonFt: true, tuan: d.tuan || tuanCh, homNay,
      lyDo: d.lyDo || null, khacGoiY: false, mucTieu: mucTieuCua(d), ngayXemLai: d.ngayXemLai || null,
    });
  };

  const rows = students.map((s) => { const d = dongCua(s); return { s, d, loi: kiemTra(d), coLenh: !!s.lenh }; });
  const quyet = rows.filter((r) => r.d.kieu);
  const chua = rows.length - quyet.length;
  const coLoi = quyet.some((r) => r.loi);
  /** Chỉ gửi em MỚI quyết hoặc lệnh cũ đã sửa — lệnh đã có mà không đụng tới thì đứng yên. Lệnh chưa chuyển được gửi lại theo tuần mới (PR-S5F-a). */
  const canGui = quyet.filter((r) => !r.coLenh || daSua.has(r.s.id) || !!r.s.lenh?.loi);
  const hienLoi = (sid: number) => lf.daBam || daSua.has(sid);
  const dsLoi = quyet.filter((r) => r.loi).map((r) => ({ khoa: `dong-${r.s.id}`, nhan: r.s.fullName as string, lyDo: r.loi as string }));
  /** Học viên đang chọn CÓ quyết định chờ — đối tượng của "Huỷ quyết định"; học viên chưa có quyết định thì bỏ qua. */
  const chonCoLenh = students.filter((s) => chon.has(s.id) && s.lenh);
  const boQuaHuy = chon.size - chonCoLenh.length;
  const nhomHuy = (() => {
    const m = new Map<string, number>();
    for (const s of chonCoLenh) { const t = TEN_HUONG[s.lenh.huong as string] ?? 'Chuyển lớp'; m.set(t, (m.get(t) ?? 0) + 1); }
    return [...m.entries()].map(([k, n]) => `${k} ${n}`).join(' · ');
  })();
  const lamMoiSauHuy = () => { for (const k of ['/classes', '/my-work', '/lenh-chuyen', '/yeu-cau', '/hoc-vien-lop']) invalidate(k); reload(); };
  const huyNhieuLenh = async () => {
    if (!huyNhieu) return;
    setDangHuy(true);
    const kq = await chayHangLoat('huy-lenh', chonCoLenh.map((s) => s.id as number), { lyDo: huyNhieu.lyDo.trim() });
    setDangHuy(false);
    lamMoiSauHuy();
    if (kq.failed.length) toast.push('error', `Đã huỷ ${kq.ok.length} quyết định · ${kq.failed.length} chưa huỷ — ${kq.failed[0].message}`);
    if (!kq.ok.length) return;
    setChon(new Set()); setHuyNhieu(null);
    toast.hoanTac(`Đã huỷ quyết định ${kq.ok.length} em`, async () => {
      const r = await hoanTacHangLoat('huy-lenh', kq.ok);
      lamMoiSauHuy();
      toast.push(r.failed.length ? 'error' : 'ok', r.failed.length ? r.failed[0].message : 'Đã khôi phục quyết định');
    }, { key: 'huy-lenh-nhieu' });
  };

  const dong = () => { onClose(); };
  const apChoNhieu = () => {
    if (!bulk.kieu || !chon.size) return;
    for (const sid of chon) sua(sid, { kieu: bulk.kieu, toClassId: canLop(bulk.kieu) ? bulk.toClassId : '' });
    setChon(new Set());
  };
  const ganLopMoi = (v: number | '') => {
    setDongs((m) => Object.fromEntries(Object.entries(m).map(([k, x]) => [k, x.toClassId === 'new' ? { ...x, toClassId: v } : x])));
    setBulk((b) => (b.toClassId === 'new' ? { ...b, toClassId: v } : b));
  };

  const dsTomTat: DongTomTatLenh[] = rows.map((r) => ({
    ten: r.s.fullName as string, huong: r.d.kieu ? HUONG_CUA[r.d.kieu] : null,
    lopDich: dichCua(r.d) ? [dichCua(r.d).code, dichCua(r.d).ft ? dichCua(r.d).route : null].filter(Boolean).join(' · ') : null,
    tuan: r.d.tuan || tuanCh, mucTieu: mucTieuCua(r.d), ngayXemLai: r.d.ngayXemLai || null,
  }));
  const cau = tomTatLenh(dsTomTat, homNay);
  const han = homNay ? hanBanGiao(homNay) : { gvbm: '', gvcn: '' };   // chưa nạp xong thì chưa có ngày
  /* OV-13l: em "Ngay hôm nay" chuyển ngay khi gửi, không hoàn tác — bước Xác nhận nói rõ, nút đổi chữ khi cả lô chuyển ngay. */
  const soNgay = canGui.filter((r) => laChuyenNgay(r.d.tuan || tuanCh, homNay)).length;

  const gui = async () => {
    setBusy(true);
    try {
      /* OV-13l: chuyển ngay chạy trong lời gọi — gửi từng lô ≤ LO_CHUYEN_NGAY em, cộng dồn kết quả. */
      const r = await guiTheoLo(`/classes/${classId}/transition`, tuanCh, soNgay ? LO_CHUYEN_NGAY : canGui.length, setTienDo,
        canGui.map((x) => ({
          studentId: x.s.id, huong: HUONG_CUA[x.d.kieu as Kieu], toClassId: typeof x.d.toClassId === 'number' ? x.d.toClassId : undefined,
          tuan: x.d.tuan || undefined, mucTieu: mucTieuCua(x.d) ?? undefined, ngayThi: x.d.ngayThi || undefined, lyDo: x.d.lyDo || undefined,
          ngayXemLai: x.d.kieu === 'bao-luu' ? x.d.ngayXemLai || undefined : undefined,
        })));
      invalidate('/classes'); invalidate('/students'); invalidate('/hoc-vien-lop'); invalidate('/my-work'); invalidate('/lenh-chuyen'); invalidate('/yeu-cau');
      if (r.failed.length) {
        setLoiMayChu(Object.fromEntries(r.failed.map((f: any) => [f.studentId, f.message])));
        setBuoc(1);
        toast.push('error', `${r.failed.length} em chưa gửi được quyết định — xem lỗi ở từng hàng`);
        if (r.ok.length) reload();
      } else {
        toast.push('ok', r.daChuyen?.length ? t('Đã chuyển {n} em', { n: r.daChuyen.length }) : `Đã gửi quyết định chuyển lớp ${r.ok.length} em`);
        onDone(); dong();
      }
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); setTienDo(null); }
  };

  const huyLenh = async () => {
    if (!huy) return;
    const s = students.find((x) => x.id === huy.sid);
    try {
      await api.post(`/lenh-chuyen/${s.lenh.id}/huy`, { lyDo: huy.lyDo });
      invalidate('/classes'); invalidate('/my-work'); invalidate('/lenh-chuyen');
      setDongs((m) => ({ ...m, [huy.sid]: { ...DONG_TRONG } }));
      setHuy(null); reload();
      toast.push('ok', 'Đã huỷ quyết định');
    } catch (e: any) { toast.push('error', e.message); }
  };

  const nhomChan = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of quyet) {
      const c = dichCua(r.d);
      const t = NHAN_KIEU[r.d.kieu as Kieu];
      const k = c ? `${t} · ${c.code}` : t;
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dongs, data]);

  const tieuDe = data ? `Chuyển tiếp lớp · ${data.from.code} · ${students.length} em` : 'Chuyển tiếp lớp';   // OV-11d (HL-16, CA2-4): cùng tên mục ⋯
  const cotTieuDe = 'hidden gap-3 border-b px-3 py-2 text-[11px] font-extrabold uppercase tracking-[.06em] text-slate-500 lg:grid';

  return (
    <>
      <KhungPanel longTrong rong="toan" onDong={taoLop ? () => {} : dong} tieuDe={tieuDe}
        ngCanh={data ? <span>{buoc === 1 ? '1 Soạn › 2 Xác nhận' : '1 Soạn › 2 Xác nhận · đọc lại rồi gửi'}</span> : undefined}
        chan={buoc === 1 ? {
          daSua: daSua.size > 0 || !!tuanChung, huy: { onClick: dong, disabled: busy },
          dongTren: data ? (
            <div className="space-y-1 px-4 pt-2 text-xs text-slate-400">
              <div className="flex flex-wrap gap-x-4 gap-y-1 tabular-nums">
                {nhomChan.map(([k, n]) => <span key={k}>{k} <b className="text-slate-100">{n}</b></span>)}
                <span>Chưa quyết <b className="text-slate-100">{chua}</b></span>
              </div>
            </div>
          ) : undefined,
          phu: data?.canEdit ? <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={() => setTaoLop(true)}>+ Mở lớp mới</button> : undefined,
          chinh: (
            <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={!data?.canEdit || !canGui.length}
              onClick={() => { if (coLoi) lf.bam(); else setBuoc(2); }}>
              Tiếp tục · {canGui.length} em
            </button>
          ),
          conThieu: lf.conThieu(dsLoi),
        } : {
          huy: { nhan: '‹ Sửa', onClick: () => setBuoc(1), disabled: busy },
          chinh: (
            <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={gui} disabled={busy}>
              {busy ? (tienDo && soNgay ? t('Đang chuyển… {a}/{b} em', { a: tienDo[0], b: tienDo[1] }) : soNgay ? t('Đang chuyển…') : 'Đang gửi…') : soNgay === canGui.length ? t('Chuyển ngay · {n} em', { n: canGui.length }) : `Gửi quyết định chuyển lớp ${canGui.length} em`}
            </button>
          ),
        }}>
        {error && <ErrorState message={error.message} hint={error.hint} onRetry={reload} />}
        {loading && <Skeleton rows={8} />}
        {data && !data.canEdit && <p className="mt-3 text-sm text-slate-400">Chỉ Quản lý chi nhánh của lớp này ra quyết định chuyển lớp. Bạn xem được tình trạng quyết định.</p>}

        {data && buoc === 1 && (
          <div className="space-y-3 pt-3">
            <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
              {/* PR-S5F-a (mockup 20): ô MÃ TUẦN — chọn một trong các Thứ Hai hợp lệ (`W2 OCT`), không ô ngày. */}
              <div>
                <span id="tuan-chung" className="mb-1 block text-[11.5px] font-bold text-slate-200">Tuần bắt đầu chung</span>
                <div role="group" aria-labelledby="tuan-chung" className="flex flex-wrap gap-1.5">
                  <NutHomNay homNay={homNay} chon={tuanCh === homNay} onClick={() => setTuanChung(homNay)} />
                  {(data.tuanChon as string[]).map((t) => <NutChon key={t} chon={tuanCh === t} onClick={() => setTuanChung(t)}>{tuanLich(t, homNay)}</NutChon>)}
                </div>
              </div>
            </div>

            {data.canEdit && (
              <div className="surface-2 flex flex-wrap items-center gap-2 rounded-lg px-3 py-2" role="group" aria-label="Chọn nhiều em">
                <span className="text-xs font-semibold text-slate-200 tabular-nums">{chon.size} em đang chọn</span>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.entries(NHAN_KIEU) as [Kieu, string][]).map(([k, nhan]) => (
                    <NutChon key={k} nho chon={bulk.kieu === k} onClick={() => setBulk({ kieu: k, toClassId: '' })}>{nhan}</NutChon>
                  ))}
                </div>
                {canLop(bulk.kieu) && (
                  <select className="field w-full sm:w-64" aria-label="Lớp chuyển đến cho các em đang chọn" value={bulk.toClassId}
                    onChange={(e) => { if (e.target.value === 'new') setTaoLop(true); setBulk((b) => ({ ...b, toClassId: e.target.value === 'new' ? 'new' : e.target.value ? Number(e.target.value) : '' })); }}>
                    <option value="">Chọn lớp chuyển đến</option>
                    {lopHopLe(bulk.kieu).map((c) => <option key={c.id} value={c.id}>{nhanLop(c)}</option>)}
                    <option value="new">+ Mở lớp mới…</option>
                  </select>
                )}
                <button type="button" className="btn btn-sm" disabled={!bulk.kieu || !chon.size || (canLop(bulk.kieu) && !bulk.toClassId)} onClick={apChoNhieu}>
                  Áp cho {chon.size} em
                </button>
                <button type="button" className="btn btn-sm btn-danger min-h-[44px] sm:min-h-0" disabled={!chonCoLenh.length || dangHuy} onClick={() => setHuyNhieu({ lyDo: '' })}>Huỷ quyết định</button>
              </div>
            )}
            {huyNhieu && (
              <div role="group" aria-label="Huỷ quyết định" className="surface-2 space-y-2 rounded-lg px-3 py-2">
                <p className="m-0 text-sm font-semibold text-slate-100">Huỷ quyết định {chonCoLenh.length} em</p>
                <p className="m-0 text-xs tabular-nums text-slate-400">{nhomHuy}{boQuaHuy > 0 && ` · Bỏ qua ${boQuaHuy} em chưa có quyết định`}</p>
                <input className="field w-full" aria-label="Lý do" placeholder="Lý do" maxLength={2000} value={huyNhieu.lyDo} onChange={(e) => setHuyNhieu({ lyDo: e.target.value })} />
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={dangHuy} onClick={() => setHuyNhieu(null)}>Đóng</button>
                  <button type="button" className="btn btn-sm btn-danger min-h-[44px] sm:min-h-0" disabled={dangHuy || !huyNhieu.lyDo.trim()} onClick={huyNhieuLenh}>
                    {dangHuy ? 'Đang huỷ…' : `Huỷ quyết định ${chonCoLenh.length} em`}
                  </button>
                </div>
              </div>
            )}

            <div className="surface-2 rounded-lg" role="table" aria-label="Học viên của lớp">
              <div role="row" className={`${cotTieuDe} ${LUOI}`}>
                <span role="columnheader"><input type="checkbox" aria-label="Chọn cả lớp" disabled={!data.canEdit}
                  checked={chon.size > 0 && chon.size === students.length}
                  onChange={(e) => setChon(e.target.checked ? new Set(students.map((s) => s.id)) : new Set())} /></span>
                <span role="columnheader">Học viên</span>
                <span role="columnheader">Kết quả gần nhất</span>
                <span role="columnheader">Quản lý quyết định</span>
                <span role="columnheader">Lớp chuyển đến</span>
                <span role="columnheader">Tuần bắt đầu</span>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
                {rows.map(({ s, d, loi }) => (
                  <HangEm key={s.id} s={s} d={d} tuanCh={tuanCh} homNay={homNay}
                    loi={hienLoi(s.id) ? loi : null} loiMayChu={loiMayChu[s.id] ?? null} oId={lf.oId(`dong-${s.id}`)} khoa={!data.canEdit}
                    chon={chon.has(s.id)} onChon={(v) => setChon((x) => { const n = new Set(x); if (v) n.add(s.id); else n.delete(s.id); return n; })}
                    sua={(p) => sua(s.id, p)} lopHopLe={lopHopLe} nhanLop={nhanLop} data={data}
                    huy={huy?.sid === s.id ? huy : null} moHuy={() => setHuy({ sid: s.id, lyDo: '' })} doiLyDoHuy={(v) => setHuy({ sid: s.id, lyDo: v })}
                    dongHuy={() => setHuy(null)} xacNhanHuy={huyLenh} />
                ))}
              </div>
            </div>
          </div>
        )}

        {data && buoc === 2 && (
          <div className="space-y-3 pt-3">
            <div className="surface-2 rounded-lg p-3">
              <p className="m-0 mb-2 text-sm font-bold text-slate-100">Xác nhận quyết định chuyển lớp · {data.from.code}</p>
              <ul className="m-0 list-disc space-y-1.5 pl-5">
                {cau.map((c, i) => <li key={i} className="text-sm text-slate-200">{c}</li>)}
              </ul>
            </div>
            {soNgay > 0 && (
              <p role="note" className="m-0 rounded-lg border px-3 py-2 text-sm font-semibold text-soon" style={KHOI_VANG}>
                ⚠ {t('Chuyển ngay, không hoàn tác')} · <span className="tabular-nums">{soNgay}</span> em
                <span className="mt-1 block font-normal text-slate-200">{t('Bài Test đang dở đi theo em sang lớp mới; bài đã thi xong ở lại {cu}', { cu: data.from.code })}</span>
              </p>
            )}
            <p className="m-0 text-sm text-slate-300">
              Sau khi gửi: {data.gvcn ? `GVCN ${data.gvcn}` : 'GVCN lớp cũ'} có việc <b>Bàn giao {canGui.filter((r) => r.d.kieu !== 'dung').length} em</b> · hạn hết {ngay(han.gvcn, homNay)}.
              {' '}GVBM có việc Bàn giao môn, hạn hết {ngay(han.gvbm, homNay)}. GVCN lớp mới được báo.
            </p>
          </div>
        )}
      </KhungPanel>
      {taoLop && data && (
        <ClassCreatePanel moHoSo={false}
          macDinh={{ ...(data.goiYLopMoi ?? { branchId: data.from.branchId }), previousClassId: data.from.id }}
          onDone={(lop) => { reload(); ganLopMoi(lop.id); setTaoLop(false); }}
          onClose={() => { ganLopMoi(''); setTaoLop(false); }} />
      )}
    </>
  );
}

function HangEm({ s, d, tuanCh, homNay, loi, loiMayChu, oId, khoa, chon, onChon, sua, lopHopLe, nhanLop, data, huy, moHuy, doiLyDoHuy, dongHuy, xacNhanHuy }: {
  s: any; d: Dong; tuanCh: string; homNay: string;
  loi: string | null; loiMayChu: string | null; oId: string; khoa: boolean; chon: boolean; onChon: (v: boolean) => void;
  sua: (p: Partial<Dong>) => void; lopHopLe: (k: Kieu | '') => any[]; nhanLop: (c: any) => string; data: any;
  huy: { sid: number; lyDo: string } | null; moHuy: () => void; doiLyDoHuy: (v: string) => void; dongHuy: () => void; xacNhanHuy: () => void;
}) {
  const k = ketQuaGanNhat(s.ketQua as KetQuaVao | null);
  const lenh = s.lenh;
  const loiHang = loi ?? loiMayChu ?? (lenh?.loi ? `Chưa chuyển được: ${String(lenh.loi).replace(/\.$/, '')} — chọn tuần/lớp chuyển đến mới rồi gửi, hoặc huỷ quyết định.` : null);
  const chonKieu = (kieu: Kieu | '') => sua({ kieu, toClassId: kieu === d.kieu ? d.toClassId : '' });
  const nutKieu: Kieu[] = ['chuyen', 'doi'];
  const khac = d.kieu === 'bao-luu' || d.kieu === 'dung';
  const nhan = 'text-xs text-slate-500 lg:hidden';
  const dsLop = lopHopLe(d.kieu);
  const tuanRieng = d.tuan && d.tuan !== tuanCh;
  /* Tuần chung chỉ hiện chữ; ô chọn tuần riêng chỉ mở khi bấm "Đổi" (hoặc em đã có tuần riêng) — bảng gọn, cột thẳng. */
  const [doiTuan, setDoiTuan] = useState(false);

  return (
    <div role="row" className={`grid gap-x-3 gap-y-2 px-3 py-2.5 text-sm ${LUOI} ${chon ? 'bg-ink-800/60' : ''}`}>
      <span role="cell" className="flex items-start pt-1">
        <input type="checkbox" aria-label={`Chọn ${s.fullName}`} checked={chon} disabled={khoa} onChange={(e) => onChon(e.target.checked)} />
      </span>
      <span role="cell" className="min-w-0">
        <span className="block truncate text-slate-100" title={s.fullName}>{s.fullName}</span>
        <span className="block text-[11px] tabular-nums text-slate-500">{maHocVienNgan(s.studentCode)}</span>
        {/* PR-UXF-a (mockup 20 màn I): em FT "LT1 · tuần học 9" — không mẫu số (FT không giới hạn tuần). */}
        {s.tuanHoc && <span className="block text-xs text-slate-500">{[s.route, chuTuanHoc(s.tuanHoc.tuan, s.tuanHoc.tong, s.tuanHoc.dangDung)].filter(Boolean).join(' · ')}</span>}
      </span>
      <span role="cell" className="min-w-0">
        <span className={nhan}>Kết quả gần nhất</span>
        <span className="block" title={k.dong1 ?? undefined}>
          <span className="font-bold tabular-nums text-slate-100">{k.chinh}</span>
          {k.lech && <span className="ml-1.5 text-xs font-semibold tabular-nums text-bad">{k.lech}</span>}
          {k.dong2 && <span className="block text-[12px] leading-4 text-slate-500">{k.dong2}</span>}
        </span>
      </span>
      <span role="cell" className="min-w-0">
        <span className={nhan}>Quản lý quyết định</span>
        <span id={oId} tabIndex={-1} aria-invalid={!!loi} className="flex flex-wrap items-center gap-1 outline-none">
          {nutKieu.map((kk) => <NutChon key={kk} nho chon={d.kieu === kk} disabled={khoa} onClick={() => chonKieu(d.kieu === kk ? '' : kk)}>{NHAN_KIEU[kk]}</NutChon>)}
          <select className={`field !h-8 !w-auto !py-0 text-xs ${khac ? '!border-teal-600' : ''}`} aria-label={`Khác cho ${s.fullName}`} disabled={khoa}
            value={khac ? d.kieu : ''} onChange={(e) => chonKieu((e.target.value || '') as Kieu | '')}>
            <option value="">Khác ▾</option>
            <option value="bao-luu">Tạm dừng học (bảo lưu)</option>
            <option value="dung">Dừng học hẳn</option>
          </select>
        </span>
        {!d.kieu && <span className="mt-1 block text-xs text-slate-500">Chưa chọn</span>}
      </span>
      <span role="cell" className="min-w-0">
        <span className={nhan}>Lớp chuyển đến</span>
        {canLop(d.kieu) ? (
          <select className="field w-full" aria-label={`Lớp chuyển đến của ${s.fullName}`} disabled={khoa} value={d.toClassId}
            onChange={(e) => sua({ toClassId: e.target.value === 'new' ? 'new' : e.target.value ? Number(e.target.value) : '' })}>
            <option value="">Chọn lớp</option>
            {dsLop.map((c) => <option key={c.id} value={c.id}>{nhanLop(c)}</option>)}
            <option value="new">+ Mở lớp mới…</option>
          </select>
        ) : <span className="text-slate-500">{d.kieu ? 'không chuyển lớp' : '—'}</span>}
      </span>
      <span role="cell" className="min-w-0">
        <span className={nhan}>Tuần bắt đầu</span>
        {d.kieu ? (
          <span className="block">
            <span className="tabular-nums text-slate-200">{nhanTuanBatDau(d.tuan || tuanCh, homNay)}</span>
            {!tuanRieng && <span className="text-xs text-slate-500"> (chung)</span>}
            {!khoa && !doiTuan && !tuanRieng && <button type="button" className="link ml-2 border-0 bg-transparent p-0 text-xs" onClick={() => setDoiTuan(true)}>Đổi</button>}
            {!khoa && (doiTuan || tuanRieng) && (
              <span className="mt-1 block max-w-[9.5rem]">
                <OTuan tuanChon={data.tuanChon} value={d.tuan || (laChuyenNgay(tuanCh, homNay) ? '' : tuanCh)} onChange={(v) => sua({ tuan: v === tuanCh ? '' : v })}
                  ariaLabel={`Tuần bắt đầu của ${s.fullName}`} chuaChon={laChuyenNgay(tuanCh, homNay) ? t('Ngay hôm nay') : undefined} />
              </span>
            )}
          </span>
        ) : <span className="text-slate-500">—</span>}
      </span>

      {d.kieu && (
        <div className="flex flex-wrap items-end gap-3 lg:col-start-2 lg:col-end-[-1]">
          <label className="block min-w-[14rem] flex-1">
            <span className="mb-0.5 block text-xs text-slate-500">
              Lý do <span className="text-bad">*</span>
            </span>
            <input className="field w-full" aria-label={`Lý do của ${s.fullName}`} value={d.lyDo} disabled={khoa} onChange={(e) => sua({ lyDo: e.target.value })} />
          </label>
          {d.kieu === 'bao-luu' && (
            <span className="block w-40">
              <span className="mb-0.5 block text-xs text-slate-500">Xem lại</span>
              <OTuan tuanChon={data.tuanChon} rong value={d.ngayXemLai} onChange={(v) => sua({ ngayXemLai: v })} ariaLabel={`Tuần xem lại của ${s.fullName}`} chuaChon="Chọn tuần" />
            </span>
          )}
          {d.kieu === 'doi' && <span className="pb-1 text-xs text-slate-400">LT ↔ RF = mở lộ trình mới, MT đánh lại từ MT1</span>}
        </div>
      )}
      {loiHang && <p role="alert" className="m-0 text-[12px] text-late lg:col-start-2 lg:col-end-[-1]">{loiHang}</p>}
      {lenh && !khoa && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 lg:col-start-2 lg:col-end-[-1]">
          <span>{CHU_CHUYEN_LOP.sapChuyen(tuanLich(lenh.tuan, homNay))}</span>
          {!huy && <button type="button" className="link border-0 bg-transparent p-0 text-xs" onClick={moHuy}>{CHU_CHUYEN_LOP.huy}</button>}
          {huy && (
            <span className="flex flex-wrap items-center gap-1.5">
              <input className="field w-56" placeholder="Lý do huỷ" aria-label={`Lý do huỷ quyết định của ${s.fullName}`} value={huy.lyDo} onChange={(e) => doiLyDoHuy(e.target.value)} />
              <button type="button" className="btn btn-sm btn-danger" disabled={!huy.lyDo.trim()} onClick={xacNhanHuy}>{CHU_CHUYEN_LOP.huy}</button>
              <button type="button" className="btn btn-sm" onClick={dongHuy}>{CHU_CHUYEN_LOP.giu}</button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * OV-13l: gửi quyết định chuyển lớp theo lô `lo` em (chuyển ngay chạy trong lời gọi — lô lớn vượt hạn 10 s), cộng dồn ok / failed / daChuyen.
 * Lô lỗi cả lời gọi → mọi em của lô vào `failed` với chữ lỗi, các lô sau vẫn gửi. `onTienDo([đã gửi, tổng])`.
 */
export async function guiTheoLo(url: string, tuanChung: string | null, lo: number, onTienDo: (x: [number, number]) => void,
  dongs: { studentId: number }[]): Promise<{ ok: number[]; failed: { studentId: number; message: string }[]; daChuyen: number[] }> {
  const kq = { ok: [] as number[], failed: [] as { studentId: number; message: string }[], daChuyen: [] as number[] };
  for (let i = 0; i < dongs.length; i += lo) {
    onTienDo([i, dongs.length]);
    const phan = dongs.slice(i, i + lo);
    try {
      const r = await api.post<any>(url, { tuanChung, dongs: phan });
      kq.ok.push(...r.ok); kq.failed.push(...r.failed); kq.daChuyen.push(...(r.daChuyen ?? []));
    } catch (e: any) { kq.failed.push(...phan.map((d) => ({ studentId: d.studentId, message: e.message as string }))); }
  }
  return kq;
}

/** Khung vàng "chuyển ngay, không hoàn tác" / FT → Thường — cùng màu ở mọi panel chuyển lớp. */
export const KHOI_VANG = { borderColor: 'rgb(var(--soon-line-rgb))', background: 'rgb(var(--soon-bg-rgb))' };

/** OV-13l (mockup bước tiếp mục 4): lựa chọn ĐẦU của ô Tuần bắt đầu — "Ngay hôm nay · T5 15/10" = chuyển ngay khi lưu, không hoàn tác. */
export function NutHomNay({ homNay, chon, onClick, nho }: { homNay: string | null; chon: boolean; onClick: () => void; nho?: boolean }) {
  if (!homNay) return null;
  return <NutChon nho={nho} chon={chon} onClick={onClick}>{t('Ngay hôm nay')} <span className="tabular-nums text-slate-400">{thuNgay(homNay, homNay)}</span></NutChon>;
}

/** Ô tuần chỉ nhận Thứ Hai từ TUẦN SAU trở đi (Q5) — `tuanChon` do máy chủ trả (`tuanChonDuoc`). `rong`: không chặn trên (tuần xem lại của Tạm dừng học (bảo lưu)). */
export function OTuan({ tuanChon, value, onChange, ariaLabel, chuaChon, rong }: {
  tuanChon: string[]; value: string; onChange: (v: string) => void; ariaLabel: string; chuaChon?: string; rong?: boolean;
}) {
  return <ONgay kieu="tuan" moc="dau" value={value} onChange={onChange} toiThieu={tuanChon[0] ?? null} toiDa={rong ? null : tuanChon[tuanChon.length - 1] ?? null}
    ariaLabel={ariaLabel} goiY={chuaChon} />;
}

/**
 * PR-MT0 (mockup ⑥, chủ sản phẩm Q3): MT0 của em ngay dưới Cuối khoá — `MT0` + chip đỏ `W 4.0 SOS` mỗi kỹ năng ≤ Target − 2.0 (chỉ để nhìn);
 * có điểm, không SOS → `MT0 ✓`; chưa điểm → `MT0 · W4 OCT` mờ. Em không có MT0 → không vẽ. Cùng ô, nên 375 không thêm cột.
 */
export function OMt0({ mt0 }: { mt0: { maTuan: string | null; coDiem: boolean; sos: { skill: AssessedSkill; band: number }[] } | null | undefined }) {
  if (!mt0) return null;
  return (
    <span className="mt-1 flex flex-wrap items-center gap-1 text-[12px] font-semibold tabular-nums">
      {mt0.sos.length ? <><span className="text-slate-300">MT0</span>{mt0.sos.map((x) => <Nhan key={x.skill} tone="bad">{chipSosMt0(x)}</Nhan>)}</>
        : mt0.coDiem ? <span className="text-ok">MT0 ✓</span>
        : <span className="text-slate-500">{mt0.maTuan ? `MT0 · ${mt0.maTuan}` : 'MT0'}</span>}
    </span>
  );
}
