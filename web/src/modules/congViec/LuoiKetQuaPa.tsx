import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { skillShort } from '../../lib/format.ts';
import { KhungPanel, useNhap } from '../../ui/KhungPanel.tsx';
import { ChipHan } from '../../ui/Nhan.tsx';
import { dauViec } from '../../ui/KhuonViec.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { NganCase } from '../students/NganCaseLuoi.tsx';
import type { WorkItem } from '../worklist/WorkList.tsx';
import {
  CHU_TOI_THIEU_CASE, FOLLOWUP_OUTCOMES, GOI_Y_KET_QUA_PA, INTERVENTION_KIND_LABEL, KY_HIEU_TIEN_TRIEN, TRAN_CHU, caseTopicLabel, duongHoSoHocVien,
  kyGhiKetQua, nguoiCuaPa, outcomeLabelFor, quyCheLuoiKetQua, thanKetQuaTuan,
} from '@shared/domain/index.ts';
import { dich, dichDu, t } from '@shared/i18n/index.ts';

type Em = NonNullable<WorkItem['con']>[number];
type NhapMayChu = { outcome: string; note: string; luc: string; boi: string };
/** Một PA của lưới (`GET /interventions/luoi-ket-qua`, máy chủ `cases/luoiKetQua.ts`). */
type PaLuoi = {
  id: number; caseId: number; kind: string; description: string | null; topic: string | null;
  performer: string | null; performerUserId: number | null; cycleNo: number; dangChay: boolean;
  nhap: NhapMayChu | null; mt: { attemptNo: number; band: number; expectation: number | null } | null; hanKe: string | null;
};
type GiaTri = { outcome: string; note: string };
/** `xungDot`: phiên khác vừa lưu nháp khác (409 `nhapMoi`) — bản mới đã nhận làm bản gốc; dòng chọn "Lưu bản của tôi" (đè có chủ ý) hoặc "Dùng bản mới". */
type Loi = { chu: string; thuLai: boolean; kieu: 'chot' | 'nhap'; xungDot?: boolean };
type Tt = 'chua' | 'thieu' | 'san' | 'nhap' | 'dang' | 'loi' | 'da' | 'phuc';

const TRONG: GiaTri = { outcome: '', note: '' };
const lucNhap = (luc: string) => { const d = new Date(luc); const h = (x: number) => String(x).padStart(2, '0'); return `${h(d.getHours())}:${h(d.getMinutes())}`; };
/** 409 của máy chủ (`luuNhapKetQua` / `updateResult`): kỳ đã chốt ở phiên khác → không Thử lại; nháp mới hơn → chọn bản ở panel đầy đủ. */
const xungDotCua = (e: any): { moi: NhapMayChu | null } | null => (e?.status === 409 && e.details && 'nhapMoi' in e.details ? { moi: e.details.nhapMoi ?? null } : null);
const loiCua = (e: any, kieu: Loi['kieu']): Loi => {
  if (e?.status === 409 && e.details?.daChot) return { chu: dich(e.message ?? ''), thuLai: false, kieu };
  const xd = xungDotCua(e);
  if (xd) {
    return { chu: xd.moi ? t('Có bản nháp mới hơn · {gio} · {ten}: “{chu}”', { gio: lucNhap(xd.moi.luc), ten: xd.moi.boi, chu: xd.moi.note }) : t('Nháp vừa bị xoá ở phiên khác'), thuLai: true, kieu, xungDot: true };
  }
  return { chu: e?.message ? dich(e.message) : t('Không lưu được'), thuLai: true, kieu };
};

/**
 * GD-20c LUOI-KET-QUA-PA (mockup ⑫ C2–C4, E3; [XM-6], [XM-7], [XM-8]) — dòng gộp "Lớp · Ghi kết quả PA" (cùng lớp + cùng kỳ) mở MỘT lưới: mỗi dòng một PA
 * (em · kỹ năng · PA · MT gần nhất │ 5 chip Tiến triển + Nhận xét ≥ 8 ký tự │ trạng thái). Quyết định luôn Giữ nguyên (dòng quy chế nói); dòng cần hơn
 * (Kết quả cuối, Mini Test, PA đếm buổi — `ghiNhanh` của máy chủ) chỉ có "Mở đầy đủ" = panel Case đang có, thay chỗ lưới (lưới vẫn gắn, ẩn → chữ còn),
 * "‹ Lưới …" về đúng chỗ. Lưu TỪNG DÒNG bằng `POST /interventions/:id/result` sẵn có, lần lượt; dòng lỗi báo tại dòng, chữ giữ (nháp trình duyệt theo việc
 * qua `useNhap`), Thử lại từng dòng. "Lưu nháp" = `PUT /interventions/:id/nhap` của dòng đã sửa. Đọc: MỘT câu khi mở (`/interventions/luoi-ket-qua`).
 */
export function LuoiKetQuaPa({ it, onDong, onDaLam, onTiep }: { it: WorkItem; onDong: () => void; onDaLam: () => void; onTiep?: (() => void) | null }) {
  const { homNay, ngan } = useNgayNghiepVu();
  const [ds] = useState<Em[]>(() => it.con ?? []);   // danh sách chốt lúc mở — Công việc tải lại không làm nhảy dòng
  const { data, error, reload } = useApi<{ ds: PaLuoi[] }>(`/interventions/luoi-ket-qua?ids=${ds.map((x) => x.paId).join(',')}`);
  const paCua = new Map((data?.ds ?? []).map((x) => [x.id, x]));
  /* Kỳ lúc mở của từng PA — về từ panel đầy đủ, kỳ đổi / PA khép = dòng đó đã ghi ở panel. */
  const kyGoc = useRef(new Map<number, number>());
  useEffect(() => { for (const p of data?.ds ?? []) if (!kyGoc.current.has(p.id)) kyGoc.current.set(p.id, p.cycleNo); }, [data]);
  /* Chữ đang gõ: chỉ ô đã sửa (so với nháp máy chủ); giữ trong kho nháp của việc (`useNhap`) — đóng nhầm / tải lại trang không mất, ✕ hỏi trước. */
  const [sua, setSua] = useNhap<Record<number, GiaTri>>('luoi-kq', {});
  const [nhapMoi, setNhapMoi] = useState<Record<number, NhapMayChu | null>>({});
  const [dang, setDang] = useState<ReadonlySet<number>>(new Set());
  const [loi, setLoi] = useState<Record<number, Loi>>({});
  const [da, setDa] = useState<Map<number, GiaTri | null>>(new Map());
  const [thuTu, setThuTu] = useState<number[]>(() => ds.map((x) => x.paId!));
  const [gui, setGui] = useState<'chot' | 'nhap' | null>(null);
  const dangGui = useRef(false);
  const [day, setDay] = useState<{ em: Em; xem: boolean } | null>(null);
  const doiODay = useRef(false);

  const nhapCua = (id: number) => (id in nhapMoi ? nhapMoi[id] : paCua.get(id)?.nhap ?? null);
  const giaTri = (id: number): GiaTri => sua[id] ?? (nhapCua(id) ? { outcome: nhapCua(id)!.outcome, note: nhapCua(id)!.note } : TRONG);
  const emCua = new Map(ds.map((x) => [x.paId!, x]));
  const phuc = (x: Em) => !x.ghiNhanh || !paCua.has(x.paId!);
  const trangThai = (x: Em): Tt => {
    const id = x.paId!;
    if (da.has(id)) return 'da';
    if (dang.has(id)) return 'dang';
    if (loi[id]) return 'loi';
    if (phuc(x)) return 'phuc';
    const v = giaTri(id);
    const n = v.note.trim().length;
    if (v.outcome && n >= CHU_TOI_THIEU_CASE && n <= TRAN_CHU.ketQuaPa) return 'san';
    if (!v.outcome && !n) return 'chua';
    const nh = nhapCua(id);
    return nh && !sua[id] ? 'nhap' : 'thieu';
  };
  const du = (x: Em) => { const v = giaTri(x.paId!); const n = v.note.trim().length; return !phuc(x) && !!v.outcome && n >= CHU_TOI_THIEU_CASE && n <= TRAN_CHU.ketQuaPa; };
  /* PA máy chủ không trả (ngoài quyền xem) không tính vào "đủ / xong" của lưới — không chặn "Lưu · việc tiếp ›"; báo một dòng (PTA rà #1738). */
  const ngoai = data ? ds.filter((x) => !paCua.has(x.paId!)) : [];
  const dsLam = ngoai.length ? ds.filter((x) => paCua.has(x.paId!)) : ds;
  const conLai = dsLam.filter((x) => !da.has(x.paId!));
  const sanLuu = conLai.filter((x) => du(x) && !dang.has(x.paId!) && (!loi[x.paId!] || (loi[x.paId!].thuLai && !loi[x.paId!].xungDot)));   // xung đột nháp: chỉ nút của dòng (chọn bản), không lưu đè hàng loạt
  const coLoi = conLai.filter((x) => loi[x.paId!]);
  const tatCaDu = conLai.length > 0 && conLai.every((x) => du(x));
  const daSua = Object.keys(sua).length > 0;

  /** Sau mỗi đợt lưu: dòng lỗi lên đầu, đã lưu xuống cuối (gập); dòng khác giữ thứ tự lúc mở — không nhảy khi đang gõ. */
  const xepLai = (loiMoi: Record<number, Loi>, daMoi: Map<number, unknown>) => setThuTu((tt) => [
    ...tt.filter((id) => loiMoi[id] && !daMoi.has(id)), ...tt.filter((id) => !loiMoi[id] && !daMoi.has(id)), ...tt.filter((id) => daMoi.has(id)),
  ]);
  const boSua = (ids: readonly number[]) => setSua((m) => { const n = { ...m }; for (const id of ids) delete n[id]; return n; });
  const lamMoiNgoai = () => { onDaLam(); for (const d of ['/my-work', '/cases', '/students', '/tong-quan', '/followups']) invalidate(d); };

  /** Lưu chốt các dòng `ids` (Giữ nguyên), lần lượt — Netlify cắt lời gọi dài, một lời gọi một PA như panel. */
  const luu = async (ids: readonly number[], diTiep = false) => {
    if (dangGui.current || !ids.length) return;
    dangGui.current = true; setGui('chot');
    const loiMoi = { ...loi };
    const daMoi = new Map(da);
    const ok: number[] = [];
    for (const id of ids) {
      const pa = paCua.get(id)!;
      const v = giaTri(id);
      setDang(new Set([id]));
      try {
        await api.post(`/interventions/${id}/result`, {
          decision: 'keep', outcome: v.outcome, note: v.note.trim(), observedOn: homNay || undefined, ky: pa.cycleNo, nhapCoSo: nhapCua(id)?.luc ?? null,
          ...thanKetQuaTuan({ kind: pa.kind, soBuoi: null }, '1', nguoiCuaPa(pa)),
        });
        delete loiMoi[id];
        daMoi.set(id, { outcome: v.outcome, note: v.note.trim() });
        ok.push(id);
      } catch (e: any) { loiMoi[id] = loiCua(e, 'chot'); nhanBanMoi(id, e); }
    }
    setDang(new Set()); setLoi(loiMoi); setDa(daMoi); boSua(ok); xepLai(loiMoi, daMoi);
    dangGui.current = false; setGui(null);
    if (ok.length) lamMoiNgoai();
    if (diTiep && onTiep && dsLam.every((x) => daMoi.has(x.paId!))) onTiep();
  };
  /** Lưu nháp các dòng đã sửa (không kiểm đủ ô, không chốt; việc / hạn không đổi). */
  const luuNhap = async (ids: readonly number[]) => {
    if (dangGui.current || !ids.length) return;
    dangGui.current = true; setGui('nhap');
    const loiMoi = { ...loi };
    const ok: number[] = [];
    for (const id of ids) {
      const pa = paCua.get(id)!;
      const v = giaTri(id);
      setDang(new Set([id]));
      try {
        const r = await api.put<{ nhap: NhapMayChu | null }>(`/interventions/${id}/nhap`, { outcome: v.outcome, note: v.note, ky: pa.cycleNo, coSo: nhapCua(id)?.luc ?? null });
        setNhapMoi((m) => ({ ...m, [id]: r.nhap }));
        delete loiMoi[id];
        ok.push(id);
      } catch (e: any) { loiMoi[id] = loiCua(e, 'nhap'); nhanBanMoi(id, e); }
    }
    setDang(new Set()); setLoi(loiMoi); boSua(ok); xepLai(loiMoi, da);
    dangGui.current = false; setGui(null);
    if (ok.length) { invalidate('/my-work'); invalidate('/cases'); }
  };
  const thuLai = (id: number) => (loi[id]?.kieu === 'nhap' ? luuNhap([id]) : luu([id]));
  /* Xung đột nháp: bản mới thành bản gốc (lần gửi sau so với nó) — chữ của mình vẫn trong ô. "Dùng bản mới" bỏ chữ của mình, lấy bản mới. */
  function nhanBanMoi(id: number, e: unknown) { const xd = xungDotCua(e); if (xd) setNhapMoi((m) => ({ ...m, [id]: xd.moi })); }
  const dungBanMoi = (id: number) => { boSua([id]); setLoi((l) => { const n = { ...l }; delete n[id]; return n; }); };

  /* Về từ panel đầy đủ: đọc lại lưới (một câu); dòng có kỳ đổi / PA khép = đã ghi ở panel. */
  useEffect(() => {
    if (!data || !doiODay.current) return;
    doiODay.current = false;
    const moi = data.ds.filter((p) => !da.has(p.id) && ((kyGoc.current.get(p.id) ?? p.cycleNo) !== p.cycleNo || !p.dangChay)).map((p) => p.id);
    if (!moi.length) return;
    const daMoi = new Map(da);
    for (const id of moi) daMoi.set(id, null);
    const loiMoi = { ...loi };
    for (const id of moi) delete loiMoi[id];
    setDa(daMoi); setLoi(loiMoi); boSua(moi); xepLai(loiMoi, daMoi);
  }, [data]);   // eslint-disable-line react-hooks/exhaustive-deps
  const veLuoi = () => { setDay(null); if (doiODay.current) reload(); };
  const datO = (id: number, p: Partial<GiaTri>) => {
    setSua((m) => ({ ...m, [id]: { ...giaTri(id), ...p } }));
    if (loi[id]) setLoi((l) => { const n = { ...l }; delete n[id]; return n; });
  };

  const tenLop = it.classCode ?? '';
  const ky = it.due && homNay ? kyGhiKetQua(it.due, homNay) : null;
  const soEm = new Set(ds.map((x) => x.studentId)).size;
  /* Dòng quy chế nói hạn kỳ sau của các dòng LƯU ĐƯỢC ở lưới (Giữ nguyên) — dòng Kết quả cuối / theo buổi đi panel đầy đủ. */
  const hanKe = [...new Set(ds.filter((x) => !phuc(x)).map((x) => paCua.get(x.paId!)?.hanKe ?? null))];

  /* ─── chân BA nút (mockup ⑫ C3, [XM-8]): Đóng · Lưu nháp · nút chính đổi nhãn theo trạng thái; hết dòng → "✓ Đã lưu" + "Việc tiếp ›". */
  const xongHet = dsLam.length > 0 && conLai.length === 0;
  const nutChinh = xongHet
    ? (onTiep ? <button type="button" className="btn btn-primary min-h-[44px] px-4 font-bold sm:min-h-[40px]" onClick={onTiep}>{t('Việc tiếp ›')}</button> : null)
    : sanLuu.length && sanLuu.every((x) => loi[x.paId!])
      ? <button type="button" className="btn btn-primary min-h-[44px] px-4 font-bold sm:min-h-[40px]" disabled={!!gui || !sanLuu.length} onClick={() => void luu(sanLuu.map((x) => x.paId!))}>{t('Thử lại {n} dòng', { n: sanLuu.length })}</button>
      : tatCaDu && onTiep
        ? <button type="button" className="btn btn-primary min-h-[44px] px-4 font-bold sm:min-h-[40px]" disabled={!!gui} aria-busy={gui === 'chot'} onClick={() => void luu(sanLuu.map((x) => x.paId!), true)}>{t('Lưu · việc tiếp ›')}</button>
        : <button type="button" className="btn btn-primary min-h-[44px] px-4 font-bold sm:min-h-[40px]" disabled={!!gui || !sanLuu.length} aria-busy={gui === 'chot'}
            title={sanLuu.length ? undefined : conLai.some((x) => !phuc(x)) ? t('Chưa có dòng đủ: chọn Tiến triển và Nhận xét ≥ {n} ký tự', { n: CHU_TOI_THIEU_CASE }) : t('Các dòng còn lại cần Mở đầy đủ')}
            onClick={() => void luu(sanLuu.map((x) => x.paId!))}>{sanLuu.length ? t('Lưu {n} dòng', { n: sanLuu.length }) : t('Lưu')}</button>;
  const coSoNhap = conLai.filter((x) => !phuc(x) && sua[x.paId!]);
  const nutNhap = !xongHet && data && conLai.some((x) => !phuc(x)) && (
    <button type="button" className="btn min-h-[44px] px-4 sm:min-h-[40px]" disabled={!!gui} onClick={() => void luuNhap(coSoNhap.map((x) => x.paId!))}>{gui === 'nhap' ? t('Đang lưu nháp…') : t('Lưu nháp')}</button>
  );
  const soDa = dsLam.length - conLai.length;
  const trai: ReactNode = gui ? <span className="tt-luu dang" role="status">{gui === 'nhap' ? t('Đang lưu nháp…') : t('Đang lưu {n} dòng…', { n: sanLuu.length || 1 })}</span>
    : xongHet ? <span className="tt-luu da" role="status">✓ {t('Đã lưu')}</span>
    : coLoi.length ? <>{soDa > 0 && <span className="tt-luu da">✓ {t('Đã lưu {n}', { n: soDa })}</span>}<span className="tt-luu loi" role="status">⚠ {t('{n} dòng không lưu được ↑', { n: coLoi.length })}</span></>
    : soDa > 0 ? <><span className="tt-luu da" role="status">✓ {t('Đã lưu {n}', { n: soDa })}</span><span className="tt-luu dang">· {t('{n} dòng chưa xong ↑', { n: conLai.length })}</span></>
    : tatCaDu ? <span className="tt-luu dang">{t('{n} / {m} dòng đủ', { n: conLai.length, m: conLai.length })}</span>
    : daSua ? <span className="tt-luu nhap">● {t('Nháp · chưa lưu kết quả')}</span> : null;

  const dau = { ...dauViec({ han: it.due && !xongHet ? <ChipHan vien loai="cap-nhat-pa" han={it.due} /> : null, ngCanh: null }),
    loai: t('Việc · Case học thuật'), dong2: [ky ? t('Kỳ {ky}', { ky }) : null, t('{n} PA · {m} em', { n: ds.length, m: soEm })] };
  const demTt = (k: Tt[]) => dsLam.filter((x) => k.includes(trangThai(x))).length;

  const luoi = (
    <KhungPanel hd="ket-qua-pa" rong="bang" tieuDe={t('Ghi kết quả PA · {lop}', { lop: tenLop })} dau={dau} onDong={onDong}
      quyChe={data ? quyCheLuoiKetQua(hanKe.length === 1 && hanKe[0] ? ngan(hanKe[0]) : null) : null}
      chan={{ huy: { nhan: t('Đóng'), onClick: onDong, disabled: !!gui, an375: true }, huyPhai: true, trai, phu: nutNhap, chinh: nutChinh ?? undefined, daSua }}>
      {error ? <div className="pt-4"><ErrorState message={t('Không tải được lưới')} hint={error.message} status={error.status} onRetry={reload} /></div>
        : !data ? <div className="pt-4" aria-busy="true"><Skeleton rows={Math.min(ds.length, 5)} /></div>
        : (
          <div className="flex flex-col gap-2.5 pt-3.5">
            <p className="m-0 text-[13px] text-dim">
              <b className="font-bold tabular-nums text-[color:var(--text)]">{demTt(['da'])}</b> {t('đã lưu')} · <b className="font-bold tabular-nums text-[color:var(--text)]">{demTt(['san'])}</b> {t('sẵn lưu')} · <b className="font-bold tabular-nums text-[color:var(--text)]">{dsLam.length - demTt(['da', 'san'])}</b> {t('chưa xong')}
              {ngoai.length > 0 && <span className="text-faint"> · {t('{n} PA ngoài quyền xem', { n: ngoai.length })}</span>}
            </p>
            <div className="overflow-hidden rounded-[10px] border max-sm:-mx-4 max-sm:rounded-none max-sm:border-x-0" style={{ borderColor: 'var(--line)' }}>
              <div className="grid grid-cols-[186px_minmax(0,1fr)_124px] gap-x-3.5 border-b px-3.5 py-2 text-xs font-semibold text-faint max-sm:hidden" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
                <span>{t('Học viên · PA')}</span>
                <span>{t('Tiến triển (2 tuần)')}<span aria-hidden className="text-bad"> *</span> · {t('Nhận xét')}<span aria-hidden className="text-bad"> *</span></span>
                <span>{t('Trạng thái')}</span>
              </div>
              <ul className="m-0 list-none p-0">
                {thuTu.filter((id) => !ngoai.some((x) => x.paId === id)).map((id, i) => {
                  const x = emCua.get(id)!;
                  return (
                    <li key={id} className={i ? 'border-t' : ''} style={{ borderColor: 'var(--line)' }}>
                      <DongLuoi em={x} pa={paCua.get(id) ?? null} tt={trangThai(x)} v={giaTri(id)} daLuu={da.get(id)} loi={loi[id] ?? null} nhap={sua[id] ? null : nhapCua(id)}
                        khoa={!!gui} datO={(p) => datO(id, p)} thuLai={() => void thuLai(id)} dungBanMoi={() => dungBanMoi(id)} moDay={(xem) => setDay({ em: x, xem })} />
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
    </KhungPanel>
  );
  return (
    <>
      <div hidden={day !== null}>{luoi}</div>
      {day && (
        /* "Mở đầy đủ" (mockup C4): panel Case đang có thay chỗ lưới (không lồng) — "‹ Lưới {lớp} · n PA" về đúng lưới; lưu ở panel → "Lưu · về lưới". */
        <div className="lg:max-w-[720px]">{/* panel Case giữ bề rộng như web (720), không giãn theo lưới 1040 */}
        <NganCase caseId={day.em.caseId!} paId={day.em.paId} viec={day.xem ? undefined : 'ghi-ket-qua'} hocVien={day.em.studentName} lop={it.classCode}
          onClose={onDong} onChanged={() => { doiODay.current = true; onDaLam(); }}
          veNguon={{ nhan: t('Lưới {lop} · {n} PA', { lop: tenLop, n: ds.length }), onClick: veLuoi }}
          kyNangTiep={day.xem ? null : { ten: t('Lưới {lop}', { lop: tenLop }), di: veLuoi, chu: t('Lưu · về lưới') }} />
        </div>
      )}
    </>
  );
}

const NUT_MA = 'btn btn-sm min-h-[44px] w-fit justify-self-start border-transparent bg-transparent px-2 text-[13px] font-semibold text-[color:var(--accent)] hover:border-[color:var(--line-strong)] focus-visible:border-[color:var(--line-strong)] sm:-ml-2 sm:min-h-[30px]';
const NUT_VIEN = 'btn btn-sm min-h-[44px] w-fit justify-self-start px-2.5 text-[13px] font-semibold sm:min-h-[30px]';
/* Chữ qua `t` lúc vẽ (đổi ngôn ngữ không tải lại mô-đun). */
const chuTt = (tt: Tt): string => ({
  chua: t('Chưa ghi'), thieu: t('Thiếu nhận xét'), san: t('Sẵn lưu'), nhap: t('Nháp'), dang: t('Đang lưu…'), loi: `⚠ ${t('Không lưu được')}`, da: t('✓ Đã lưu'), phuc: t('Chưa ghi'),
})[tt];
const MAU_TT: Partial<Record<Tt, string>> = { thieu: 'text-soon', nhap: 'text-soon', loi: 'text-bad', da: 'text-ok' };

/** Một dòng lưới = một PA. 1440: [em 200 | chip + Nhận xét | trạng thái 128]; 375: thẻ (em + trạng thái một hàng, chip xuống dòng, ô, nút). */
function DongLuoi({ em, pa, tt, v, daLuu, loi, nhap, khoa, datO, thuLai, dungBanMoi, moDay }: {
  em: Em; pa: PaLuoi | null; tt: Tt; v: GiaTri; daLuu: GiaTri | null | undefined; loi: Loi | null; nhap: NhapMayChu | null; khoa: boolean;
  datO: (p: Partial<GiaTri>) => void; thuLai: () => void; dungBanMoi: () => void; moDay: (xem: boolean) => void;
}) {
  const kn = pa?.topic ? dich(caseTopicLabel(pa.topic)) : null;
  const tenPa = pa ? (dichDu(pa.description) || dich(INTERVENTION_KIND_LABEL[pa.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? pa.kind)) : null;
  const cuoi = /^Kết quả cuối/.test(em.tieuDe);
  const mt = pa?.mt ? <>MT{pa.mt.attemptNo} {pa.topic ? skillShort(pa.topic) : ''} <span className="tabular-nums">{pa.mt.band.toFixed(1)}</span>{pa.mt.expectation != null && <> · {t('kỳ vọng')} <span className="tabular-nums">{pa.mt.expectation.toFixed(1)}</span></>}</> : cuoi ? t('Kỳ cuối') : null;
  const n = v.note.trim().length;
  const dang = tt === 'dang';
  const chu = tt === 'thieu' && !v.outcome ? t('Thiếu tiến triển') : tt === 'thieu' && n > TRAN_CHU.ketQuaPa ? t('Nhận xét quá dài') : chuTt(tt);
  const nhanTt = <span className={`whitespace-nowrap text-[13px] font-semibold ${MAU_TT[tt] ?? 'text-faint'}`} role={tt === 'loi' ? 'alert' : undefined}>{chu}</span>;
  /* Cột Trạng thái (PTA rà ⑫): "Mở đầy đủ" / "Sửa" không viền (viền khi rê / focus); dòng BẮT BUỘC mở đầy đủ giữ nút có viền. */
  const nut = tt === 'da' ? <button type="button" className={NUT_MA} onClick={() => moDay(true)}>{t('Sửa')}</button>
    : tt === 'loi' && loi?.xungDot ? <>
      <button type="button" className={NUT_VIEN} disabled={khoa} onClick={thuLai}>{t('Lưu bản của tôi')}</button>
      <button type="button" className={NUT_MA} disabled={khoa} onClick={dungBanMoi}>{t('Dùng bản mới')}</button>
    </>
    : tt === 'loi' && loi?.thuLai ? <button type="button" className={NUT_VIEN} disabled={khoa} onClick={thuLai}>{t('Thử lại')}</button>
    : tt === 'phuc' || (tt === 'loi' && !loi?.thuLai) ? <button type="button" className={NUT_VIEN} disabled={khoa} onClick={() => moDay(false)}>{t('Mở đầy đủ')}</button>
    : <button type="button" className={NUT_MA} disabled={khoa} onClick={() => moDay(false)}>{t('Mở đầy đủ')}</button>;
  const hoSo = (
    <Link to={duongHoSoHocVien(em.studentId!)} className="text-[15px] font-semibold text-[color:var(--text)] no-underline hover:text-[color:var(--accent)] hover:underline max-sm:-my-2.5 max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center sm:text-sm">{em.studentName}</Link>
  );
  const phu = [kn && <b key="k" className="font-semibold text-dim">{kn}</b>, tenPa].filter(Boolean);

  return (
    <div className={`grid gap-x-3.5 gap-y-2 px-4 py-3 sm:grid-cols-[186px_minmax(0,1fr)_124px] sm:px-3.5 sm:py-2.5 ${tt === 'loi' ? 'bg-bad-bg' : tt === 'da' ? 'max-sm:bg-ok-bg' : ''}`}>
      {/* Em (link hồ sơ) · kỹ năng · PA · MT gần nhất — 375: tên + trạng thái một hàng, phụ một dòng. */}
      <div className="flex min-w-0 items-start justify-between gap-3 sm:block">
        <span className="grid min-w-0 gap-0.5">
          {hoSo}
          <small className="text-xs leading-snug text-faint">{phu.map((x, i) => <span key={i}>{i ? ' · ' : ''}{x}</span>)}<span className="sm:hidden">{mt && <> · {mt}</>}</span></small>
          {mt && <small className="text-xs leading-snug text-faint max-sm:hidden">{mt}</small>}
        </span>
        <span className="shrink-0 sm:hidden">{nhanTt}</span>
      </div>

      {tt === 'da' ? (
        <p className="m-0 min-w-0 self-center text-sm leading-snug text-dim max-sm:hidden">
          {daLuu ? <><b className="mr-2 font-semibold text-[color:var(--text)]">{KY_HIEU_TIEN_TRIEN[daLuu.outcome as keyof typeof KY_HIEU_TIEN_TRIEN]} {dich(outcomeLabelFor(daLuu.outcome))}</b>{daLuu.note}</> : t('Đã ghi ở panel đầy đủ')}
        </p>
      ) : tt === 'phuc' || !pa ? (
        <div className="flex min-w-0 items-center rounded-lg border border-dashed px-3 py-2 text-[13px] text-dim sm:min-h-[72px] max-sm:border-0 max-sm:p-0" style={{ borderColor: 'var(--line-strong)' }}>
          <span>{!pa ? t('Mở đầy đủ để ghi kết quả PA này') : cuoi && pa.kind === 'bo_tro_mien_phi'
            ? <><b className="font-semibold text-[color:var(--text)]">{t('Kết quả cuối')}</b> · {t('cần Mini Test (%) và ngày làm')}</>
            : cuoi ? <><b className="font-semibold text-[color:var(--text)]">{t('Kết quả cuối')}</b> · {t('cần kết luận PA')}</>
            : <><b className="font-semibold text-[color:var(--text)]">{t('Học theo buổi')}</b> · {t('cần số buổi kỳ này và nhận xét từng buổi')}</>}</span>
        </div>
      ) : (
        <div className="grid min-w-0 gap-1.5">
          <div role="group" aria-label={t('Tiến triển · {ten}', { ten: em.studentName })} className="flex flex-wrap gap-[5px]">
            {FOLLOWUP_OUTCOMES.map((o) => (
              <button key={o} type="button" aria-pressed={v.outcome === o} disabled={dang} onClick={() => datO({ outcome: v.outcome === o ? '' : o })}
                className={`btn btn-sm min-h-[44px] whitespace-nowrap gap-1 rounded-full px-[9px] text-[13px] sm:h-[30px] sm:min-h-[30px] ${v.outcome === o ? '!border-[color:var(--accent)] bg-[color:var(--accent-soft)] font-semibold text-[color:var(--text)]' : ''}`}>
                <span aria-hidden>{KY_HIEU_TIEN_TRIEN[o]}</span>{dich(outcomeLabelFor(o))}
              </button>
            ))}
          </div>
          {/* Ô tự giãn theo chữ (mockup ⑫ `.o`): một dòng khi ngắn, xuống dòng khi dài; 375 chữ gợi ý hiện đủ (hai dòng). */}
          <textarea rows={1} className="field min-h-[44px] w-full resize-none text-sm [field-sizing:content] sm:min-h-9 max-sm:placeholder-shown:min-h-[66px]" name={`nhan-xet-${em.paId}`} autoComplete="off" value={v.note} readOnly={dang} placeholder={dich(GOI_Y_KET_QUA_PA)} aria-label={t('Nhận xét · {ten}', { ten: em.studentName })}
            aria-invalid={tt === 'thieu' && n > 0 ? true : undefined} onChange={(e) => datO({ note: e.target.value })} />
          {/* Bộ đếm chỉ khi đang gõ mà chưa đủ / quá dài (mockup C2 "Nhận xét ≥ 8 ký tự · 7/8"). */}
          {n > 0 && (n < CHU_TOI_THIEU_CASE || n > TRAN_CHU.ketQuaPa) && (
            <span className={`flex justify-between gap-3 text-xs font-semibold ${n > TRAN_CHU.ketQuaPa ? 'text-bad' : 'text-soon'}`}>
              <span>{n > TRAN_CHU.ketQuaPa ? t('Tối đa {n} ký tự', { n: TRAN_CHU.ketQuaPa }) : t('Nhận xét ≥ {n} ký tự', { n: CHU_TOI_THIEU_CASE })}</span>
              <span className="tabular-nums text-dim">{n}/{n > TRAN_CHU.ketQuaPa ? TRAN_CHU.ketQuaPa : CHU_TOI_THIEU_CASE}</span>
            </span>
          )}
          {loi && <p role="alert" className="m-0 text-xs font-semibold text-bad">{loi.chu}</p>}
        </div>
      )}

      <div className="flex min-w-0 flex-col items-start gap-1.5 max-sm:flex-row max-sm:items-center max-sm:justify-end">
        <span className="max-sm:hidden">{nhanTt}</span>
        {nhap && tt !== 'da' && <span className="text-xs text-faint max-sm:mr-auto">{t('nháp lưu {gio}', { gio: lucNhap(nhap.luc) })}</span>}
        {nut}
      </div>
    </div>
  );
}
