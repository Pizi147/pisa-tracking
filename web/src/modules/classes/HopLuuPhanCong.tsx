import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../lib/api.ts';
import { resolveWeek } from '../../ui/Filters.tsx';
import { useBamNgoai } from '../../ui/useBamNgoai.ts';
import { useGiuFocus } from '../../ui/giuFocus.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { addDaysStr } from '../../lib/format.ts';
import {
  hanBanGiaoGv, mondayOfDate, ngay, tuanLich, xemDen,
  type DoiChoPc, type HieuLucVao, type KetQuaLuuPc, type SlotPhanCong, type XemTruocLuu,
} from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * HỘP NỔI NEO (PC-GV-C): vẽ qua portal, đặt tuyệt đối theo nút neo (mép phải nút, dưới nút) — không bị khung bảng cuộn ngang cắt; lùi vào
 * trong khi tràn mép màn. `tamDuoi`: < 640 px / thẻ 375 → tấm dưới đáy màn có nền che (mockup v9 khu 5 375). Esc / bấm ra ngoài → `onDong`.
 */
export function NoiNeo({ neo, rong, tamDuoi, nhan, giuFocus = true, onDong, children, className = '' }: {
  neo: HTMLElement | null; rong: number; tamDuoi?: boolean; nhan: string; giuFocus?: boolean; onDong: () => void; children: ReactNode; className?: string;
}) {
  const hop = useRef<HTMLDivElement>(null);
  const [vt, setVt] = useState<{ top: number; left: number } | null>(null);
  useLayoutEffect(() => {
    if (tamDuoi || !neo) return;
    const r = neo.getBoundingClientRect();
    const w = Math.min(rong, window.innerWidth - 16);
    const left = Math.max(8, Math.min(r.right - w, window.innerWidth - 8 - w));
    setVt({ top: r.bottom + window.scrollY + 6, left: left + window.scrollX });
  }, [neo, rong, tamDuoi]);
  useGiuFocus(hop, giuFocus);
  const bam = useBamNgoai(true, () => onDong(), hop);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onDong(); neo?.focus(); } };
    /* Pha bắt: một Esc đóng hộp kể cả khi ô chọn người bên trong đang mở danh sách (giữ giá trị cũ). */
    document.addEventListener('keydown', esc, true);
    return () => document.removeEventListener('keydown', esc, true);
  }, [onDong, neo]);
  return createPortal(
    <>
      {tamDuoi && <div className="pc-che bg-black/60" aria-hidden="true" />}
      <div ref={hop} role="dialog" aria-label={nhan} tabIndex={-1} {...bam}
        className={`pc-hop shadow-xl ${tamDuoi ? 'pc-hop-duoi' : ''} ${className}`}
        style={tamDuoi ? undefined : { width: Math.min(rong, window.innerWidth - 16), top: vt?.top ?? -9999, left: vt?.left ?? 0 }}>
        {children}
      </div>
    </>,
    document.body,
  );
}

export type LopLuuPc = { classId: number; code: string; slots: SlotPhanCong[]; phienBan: string };

/** Lưu không cặp A → B (Chưa có → B, A → Chưa có, đổi qua lại cùng người): hôm nay, không hộp. */
export function luuThang(lop: readonly Omit<LopLuuPc, 'code'>[]): Promise<KetQuaLuuPc> {
  return api.post<KetQuaLuuPc>('/phan-cong/luu', { lop: lop.map((l) => ({ classId: l.classId, slots: l.slots, phienBan: l.phienBan })), hieuLuc: { loai: 'hom-nay' } });
}

const KHOA_NHO = 'pc-hieu-luc';
const docNho = (): 'hom-nay' | 'tuan' => { try { return sessionStorage.getItem(KHOA_NHO) === 'tuan' ? 'tuan' : 'hom-nay'; } catch { return 'hom-nay'; } };
const ghiNho = (v: 'hom-nay' | 'tuan') => { try { sessionStorage.setItem(KHOA_NHO, v); } catch { /* chỉ là tiện lợi trong phiên */ } };

/** Ô tuần hiệu lực: các thứ Hai từ tuần sau, mã tuần `W1 NOV` (mockup: một ô chọn gọn trong nhãn radio). */
function OTuan({ value, onChange, homNay, nhan }: { value: string; onChange: (v: string) => void; homNay: string; nhan: string }) {
  const dau = addDaysStr(mondayOfDate(homNay), 7);
  const ds = Array.from({ length: 12 }, (_, i) => addDaysStr(dau, 7 * i));
  if (value && !ds.includes(value)) ds.unshift(value);
  return (
    <select className="pc-o-tuan" aria-label={nhan} value={value} onChange={(e) => onChange(e.target.value)}>
      {ds.map((d) => <option key={d} value={d}>{tuanLich(d, homNay)}</option>)}
    </select>
  );
}

/** Radio Hiệu lực: Ngay hôm nay {dd/mm} · Từ tuần [W? MON ▾] — dùng chung hộp Lưu và Đổi mốc. */
function ChonHieuLuc({ loai, tuan, homNay, onLoai, onTuan }: {
  loai: 'hom-nay' | 'tuan'; tuan: string; homNay: string; onLoai: (v: 'hom-nay' | 'tuan') => void; onTuan: (v: string) => void;
}) {
  return (
    <div className="pc-hieu-luc" role="radiogroup" aria-label={t('Hiệu lực')}>
      <label className={loai === 'hom-nay' ? 'chon' : ''}>
        <input type="radio" checked={loai === 'hom-nay'} onChange={() => onLoai('hom-nay')} />{t('Ngay hôm nay')} <span className="so">{ngay(homNay, homNay)}</span>
      </label>
      <label className={loai === 'tuan' ? 'chon' : ''}>
        <input type="radio" checked={loai === 'tuan'} onChange={() => onLoai('tuan')} />{t('Từ tuần')}
        <OTuan value={tuan} homNay={homNay} nhan={t('Tuần hiệu lực')} onChange={(v) => { onTuan(v); onLoai('tuan'); }} />
      </label>
    </div>
  );
}

const hieuLucGui = async (loai: 'hom-nay' | 'tuan', tuan: string): Promise<HieuLucVao> =>
  (loai === 'hom-nay' ? { loai: 'hom-nay' } : { loai: 'tuan', tuanId: (await resolveWeek(tuan)).id });

/**
 * HỘP LƯU PHÂN CÔNG (PC-GV-C, mockup v9 khu 5; PR-D dùng ở hồ sơ lớp): mở khi có ít nhất một cặp A → B. Gọi `xem-truoc` MỘT lần; hiệu lực
 * (Ngay hôm nay / Từ tuần, nhớ trong phiên) · mỗi cặp một ô tích "Tạo việc bàn giao" (mặc định có) + dòng "Luôn chuyển sang B: n Case · n PA." NGOÀI
 * vùng bấm (việc đang mở luôn chuyển) · tải bàn giao · quyền xem của GV cũ · nút chính nói kết quả. Lỗi lưu (409 / 400 có `classId`) trả về nơi gọi
 * (`onLoi`) — nơi gọi giữ mọi dòng nháp.
 */
export function HopLuuPhanCong({ lop, tuanMacDinh, onQuayLai, onDaLuu, onLoi, neo = 'dong', neoEl, ten }: {
  lop: LopLuuPc[];
  /** Thứ Hai của lịch chờ đang đổi (ô Chờ đổi chọn người khác cùng mốc) — mở sẵn "Từ tuần" đó. */
  tuanMacDinh?: string | null;
  onQuayLai: () => void;
  onDaLuu: (kq: KetQuaLuuPc & { viec: number; nguoiCu: string | null }) => void;
  onLoi?: (e: unknown) => void;
  neo?: 'dong' | 'tam-duoi';
  neoEl?: HTMLElement | null;
  /** Tên người theo id (ứng viên + người giữ ô) — nơi gọi đã nạp. */
  ten: (id: number | null) => string;
}) {
  const { homNay } = useNgayNghiepVu();
  const hn = homNay ?? '';
  const [xt, setXt] = useState<XemTruocLuu | null>(null);
  const [loiXt, setLoiXt] = useState<string | null>(null);
  const [loai, setLoai] = useState<'hom-nay' | 'tuan'>(tuanMacDinh ? 'tuan' : docNho);
  const [tuan, setTuan] = useState(tuanMacDinh ?? (hn ? addDaysStr(mondayOfDate(hn), 7) : ''));
  const [boTao, setBoTao] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let huy = false;
    api.post<XemTruocLuu>('/phan-cong/xem-truoc', { lop: lop.map((l) => ({ classId: l.classId, slots: l.slots })) })
      .then((r) => { if (!huy) setXt(r); })
      .catch((e: any) => { if (!huy) setLoiXt(e?.message ?? t('Không đọc được')); });
    return () => { huy = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const khoa = (classId: number, k: string) => `${classId}|${k}`;
  const nhieu = lop.length > 1;
  const cap = (xt?.lop ?? []).flatMap((l) => l.cap.map((c) => ({ ...c, classId: l.classId, soEm: l.soEm })));
  const tao = cap.filter((c) => !boTao.has(khoa(c.classId, c.khoa)));
  /* Một việc = (lớp, người viết): cùng GV cũ cùng lớp nhiều ô → một việc nhiều cột (đặc tả 2b). */
  const viec = new Map<string, { cot: string[]; soEm: number; nguoi: string }>();
  for (const c of tao) {
    const ai = c.nguoiViet.loai === 'ql' ? 'ql' : String(c.nguoiViet.id);
    const k = `${c.classId}|${ai}`;
    const v = viec.get(k) ?? { cot: [], soEm: c.soEm, nguoi: c.nguoiViet.loai === 'ql' ? t('Quản lý chi nhánh') : ten(c.nguoiViet.id) };
    v.cot.push(c.nhan);
    viec.set(k, v);
  }
  const soViec = viec.size;
  const soGopY = [...viec.values()].reduce((n, v) => n + v.cot.length * v.soEm, 0);
  const nguoiCu = [...new Set(cap.map((c) => c.nguoiCu))];
  const nguoiMoi = [...new Set(cap.map((c) => c.nguoiMoi))];
  const motCap = nguoiCu.length === 1 && nguoiMoi.length === 1;
  const tenCu = motCap ? ten(nguoiCu[0]) : t('GV cũ');
  const tenMoi = motCap ? ten(nguoiMoi[0]) : t('GV mới');
  const ngayHl = loai === 'hom-nay' ? hn : tuan;
  const soO = lop.reduce((n, l) => n + (xt?.lop.find((x) => x.classId === l.classId)?.cap.length ?? 0), 0);
  const soHv = (xt?.lop ?? []).reduce((n, l) => n + l.soEm, 0);

  const luu = async () => {
    if (busy) return;
    setBusy(true);
    ghiNho(loai);
    try {
      const hieuLuc = await hieuLucGui(loai, tuan);
      const kq = await api.post<KetQuaLuuPc>('/phan-cong/luu', {
        lop: lop.map((l) => ({
          classId: l.classId, slots: l.slots, phienBan: l.phienBan,
          banGiao: Object.fromEntries(cap.filter((c) => c.classId === l.classId).map((c) => [c.khoa, !boTao.has(khoa(c.classId, c.khoa))])),
        })),
        hieuLuc,
      });
      onDaLuu({ ...kq, viec: soViec, nguoiCu: soViec && motCap ? tenCu : null });
    } catch (e) {
      setBusy(false);
      onLoi?.(e);
    }
  };

  const tieuDe = nhieu ? t('Lưu phân công · {n} lớp', { n: lop.length }) : t('Lưu phân công · {lop}', { lop: lop[0]?.code ?? '' });
  const capHtml = (c: (typeof cap)[number]) => {
    const k = khoa(c.classId, c.khoa);
    const chuyen = [c.soCase ? t('{n} Case', { n: c.soCase }) : '', c.soPa ? t('{n} PA', { n: c.soPa }) : ''].filter(Boolean).join(' · ');
    return (
      <div key={k} className="pc-cap">
        <span className="ky">{c.nhan}</span>
        <span className="doi-ng"><span className="cu">{ten(c.nguoiCu)}{c.nguoiViet.loai !== 'gv-cu' ? ` (${t('đã nghỉ')})` : ''}</span> → <span className="moi">{ten(c.nguoiMoi)}</span></span>
        <label className="tao">
          <input type="checkbox" checked={!boTao.has(k)} aria-label={t('Tạo việc bàn giao {mon} cho {gv}', { mon: c.nhan, gv: ten(c.nguoiCu) })}
            onChange={(e) => setBoTao((s) => { const n = new Set(s); if (e.target.checked) n.delete(k); else n.add(k); return n; })} />
          {t('Tạo việc bàn giao')}
        </label>
        {chuyen && <span className="ct">{t('Luôn chuyển sang {gv}: {ds}.', { gv: ten(c.nguoiMoi), ds: chuyen })}</span>}
        {c.nguoiViet.loai !== 'gv-cu' && (
          <span className="ct">{c.nguoiViet.loai === 'gvcn'
            ? t('{gv} đã nghỉ → việc bàn giao do GVCN {x} viết.', { gv: ten(c.nguoiCu), x: ten(c.nguoiViet.id) })
            : t('{gv} đã nghỉ → việc bàn giao do Quản lý chi nhánh viết.', { gv: ten(c.nguoiCu) })}</span>
        )}
      </div>
    );
  };

  return (
    <NoiNeo neo={neoEl ?? null} rong={nhieu ? 560 : 480} tamDuoi={neo === 'tam-duoi'} nhan={tieuDe} onDong={() => { if (!busy) onQuayLai(); }}>
      <div className="pc-hop-dau">
        <h3>{tieuDe}</h3>
        <span className="ng">{nhieu ? `${t('{n} ô đổi', { n: soO })} · ${lop.map((l) => l.code).join(' · ')}` : `${t('{n} ô đổi', { n: soO })} · ${t('{n} HV', { n: soHv })}`}</span>
      </div>
      <div className="pc-hop-than">
        {!xt && !loiXt && <p className="m-0 text-sm text-slate-400">{t('Đang tải…')}</p>}
        {loiXt && <p className="m-0 text-sm text-late" role="alert">{loiXt}</p>}
        {xt && (
          <>
            <div>
              <span className="nhan-t">{nhieu ? t('Hiệu lực · chung cho {n} lớp', { n: lop.length }) : t('Hiệu lực')}</span>
              <ChonHieuLuc loai={loai} tuan={tuan} homNay={hn} onLoai={setLoai} onTuan={setTuan} />
              <div className="chu-hl">
                {nhieu ? t('Lớp cần mốc khác: bấm Lưu ở cuối dòng lớp đó.')
                  : loai === 'hom-nay' ? t('{b} dạy và nhận Case / PA / việc từ hôm nay.', { b: tenMoi })
                    : t('Tới hết {truoc} {a} dạy như cũ. Từ {tuan} ({ngay}) {b} dạy, nhận Case / PA / việc.', { truoc: tuanLich(addDaysStr(tuan, -7), hn), a: tenCu, tuan: tuanLich(tuan, hn), ngay: ngay(tuan, hn), b: tenMoi })}
              </div>
            </div>
            <div>
              <span className="nhan-t">{t('Đổi người')}</span>
              <div className="pc-ds-cap">
                {nhieu ? xt.lop.filter((l) => l.cap.length).map((l) => {
                  const sv = new Set(l.cap.filter((c) => !boTao.has(khoa(l.classId, c.khoa))).map((c) => (c.nguoiViet.loai === 'ql' ? 'ql' : c.nguoiViet.id))).size;
                  return (
                    <div key={l.classId} className="pc-nhom-cap">
                      <span className="tl">{l.code} <span className="phu">· {t('{n} việc', { n: sv })}</span></span>
                      {cap.filter((c) => c.classId === l.classId).map(capHtml)}
                    </div>
                  );
                }) : cap.map(capHtml)}
              </div>
            </div>
            {soViec > 0 && (
              <div className="pc-ket-bg">
                <span>→ {nguoiCu.length === 1 && soViec === 1
                  ? <><b>{t('1 việc')}</b> {t('cho {gv}', { gv: [...viec.values()][0].nguoi })} · {[...viec.values()][0].cot.join(', ')} × {t('{n} em', { n: [...viec.values()][0].soEm })} = <b>{t('{n} góp ý', { n: soGopY })}</b></>
                  : <b>{t('{n} việc · {k} góp ý', { n: soViec, k: soGopY })}</b>} · <span className="pc-han">{t('hạn {ngay}', { ngay: ngay(hanBanGiaoGv(hn), hn) })}</span></span>
              </div>
            )}
            {cap.length > 0 && (
              <div className="pc-chu-xem">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
                <span>{nhieu ? t('{a} vẫn xem {n} lớp này tới khi xong bàn giao, ít nhất tới {ngay}.', { a: tenCu, n: lop.length, ngay: ngay(xemDen(ngayHl), hn) })
                  : t('{a} vẫn xem lớp này tới khi xong bàn giao, ít nhất tới {ngay}.', { a: tenCu, ngay: ngay(xemDen(ngayHl), hn) })} {t('Điểm đã chấm giữ tên GV cũ.')}</span>
              </div>
            )}
          </>
        )}
      </div>
      <div className="pc-hop-chan">
        <button type="button" className="btn btn-sm" disabled={busy} onClick={onQuayLai}>{t('Quay lại sửa')}</button>
        <button type="button" className="btn btn-sm btn-primary" disabled={busy || !xt} onClick={() => void luu()}>
          {busy ? t('Đang lưu…') : soViec === 0 ? t('Lưu') : nhieu ? t('Lưu {n} lớp · tạo {k} việc', { n: lop.length, k: soViec }) : t('Lưu · tạo {n} việc bàn giao', { n: soViec })}
        </button>
      </div>
    </NoiNeo>
  );
}

/**
 * HỘP CHỜ ĐỔI (mockup v9 khu 5, nút "Chờ đổi" cuối dòng): các cặp đang chờ + mốc · câu hậu quả · Đổi mốc… (Ngay hôm nay / Từ tuần) · Huỷ lịch đổi.
 * Mọi thao tác có Hoàn tác (`dao`) — nơi gọi dựng toast.
 */
export function HopChoDoi({ code, cho, nhanO, ten, neoEl, tamDuoi, onDong, onXong }: {
  code: string; cho: DoiChoPc[]; nhanO: (khoa: string) => string; ten: (id: number | null) => string;
  neoEl: HTMLElement | null; tamDuoi?: boolean; onDong: () => void;
  onXong: (viec: 'doi-moc' | 'huy', kq: { dao: number }) => void;
}) {
  const { homNay } = useNgayNghiepVu();
  const hn = homNay ?? '';
  const [doiMoc, setDoiMoc] = useState(false);
  const [loai, setLoai] = useState<'hom-nay' | 'tuan'>('tuan');
  const [tuan, setTuan] = useState(cho[0]?.hieuLuc ?? '');
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const ids = cho.map((c) => c.id);
  const mon = cho.map((c) => nhanO(c.khoa)).join(', ');
  const chay = async (viec: 'doi-moc' | 'huy') => {
    setBusy(true); setLoi(null);
    try {
      const kq = viec === 'huy' ? await api.post<{ dao: number }>('/phan-cong/cho/huy', { ids })
        : await api.post<{ dao: number }>('/phan-cong/cho/doi-moc', { ids, hieuLuc: await hieuLucGui(loai, tuan) });
      onXong(viec, kq);
    } catch (e: any) { setLoi(e?.message ?? t('Không lưu được')); setBusy(false); }
  };
  const tieuDe = t('Chờ đổi · {lop}', { lop: code });
  return (
    <NoiNeo neo={neoEl} rong={380} tamDuoi={tamDuoi} nhan={tieuDe} onDong={() => { if (!busy) onDong(); }}>
      <div className="pc-hop-dau">
        <h3>{tieuDe}</h3>
        <span className="ng">{t('từ {tuan} ({ngay})', { tuan: tuanLich(cho[0]?.hieuLuc, hn), ngay: ngay(cho[0]?.hieuLuc, hn) })}</span>
      </div>
      <div className="pc-hop-than" style={{ gap: 10 }}>
        <div className="pc-ds-cap">
          {cho.map((c) => (
            <div key={c.id} className="pc-cap">
              <span className="ky">{nhanO(c.khoa)}</span>
              <span className="doi-ng"><span className="cu">{ten(c.nguoiCu)}</span> → <span className="moi">{ten(c.nguoiMoi)}</span></span>
              {c.loi && <span className="ct text-late">⚠ {t('chưa đổi được: {loi}', { loi: c.loi })}</span>}
            </div>
          ))}
        </div>
        {doiMoc && <ChonHieuLuc loai={loai} tuan={tuan} homNay={hn} onLoai={setLoai} onTuan={setTuan} />}
        <div className="pc-chu-xem"><span>{t('Huỷ lịch đổi = huỷ cả việc bàn giao; phần đã viết giữ ở lịch sử lớp, Hoàn tác được.')}</span></div>
        {loi && <p className="m-0 text-sm text-late" role="alert">{loi}</p>}
      </div>
      <div className="pc-hop-chan">
        {doiMoc
          ? <>
              <button type="button" className="btn btn-sm" disabled={busy} onClick={() => setDoiMoc(false)}>{t('Quay lại')}</button>
              <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={() => void chay('doi-moc')}>{busy ? t('Đang lưu…') : t('Lưu mốc mới')}</button>
            </>
          : <>
              <button type="button" className="btn btn-sm" disabled={busy || !ids.length} onClick={() => setDoiMoc(true)}>{t('Đổi mốc…')}</button>
              <button type="button" className="btn btn-sm" disabled={busy || !ids.length} onClick={() => void chay('huy')}>{t('Huỷ lịch đổi ({mon})', { mon })}</button>
            </>}
      </div>
    </NoiNeo>
  );
}
