/**
 * CHUÔNG V2 (chủ SP 11/11, mockup `thiet-ke/2026-11-11-chuong-v2/chuong-v2.html` — duyệt vòng 2): hộp dưới nút chuông.
 *  · Việc cần làm — GD-19 (mockup ⑪ K1, lời 47 ý 4): MỘT THANH MỖI TAB Công việc (`gomViecTheoTab`: cùng tên, thứ tự, badge với hàng tab), từ bản `/my-work`
 *    App ĐÃ tải — không gọi thêm. Bấm thanh → Công việc đúng tab; "⌄" mở tại chỗ ≤ 3 việc gấp nhất (bấm việc → panel việc mở thẳng), một lúc một thanh.
 *    Thẻ Chờ duyệt (`/yeu-cau/dem`) và việc chỉ có ở thông báo (đăng ký tài khoản…) thêm một dòng dưới vạch.
 *  · Cập nhật: tin một chiều của `/notifications` — tải khi hộp MỞ. GD-19: ✓ từng tin (đã xem), "Đã xem hết" + Hoàn tác 10 giây, tin "Vi phạm mới" chưa xem
 *    cùng lớp (≥ 2) gom một dòng ("⌄" mở từng em). Tin trỏ tới việc không hiện (việc ở khối trên).
 *  · Xem tất cả: thay nội dung hộp tại chỗ, nhóm theo ngày, "Đánh dấu đã đọc".
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../lib/session.tsx';
import { useApi } from '../../lib/useApi.ts';
import { api } from '../../lib/api.ts';
import { LoiTaiNho } from '../../ui/ui.tsx';
import { BadgeTabSo, ChipHan } from '../../ui/Nhan.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { useToast } from '../../ui/Toast.tsx';
import {
  NHAN_NHOM_NGAY, NHAN_LOAI_VIEC, VIEC_TU_TIN, LOAI_HAN_CUA_VIEC, duongThongBao, gomViecTheoTab, gomTinViPham, laTinViec, laTinViPhamMoi, laViecTuTin, loaiTin,
  moDuocThongBao, nhomNgayTin, soViecMoi, tachTin, thoiGianThongBao, xepLoaiViec, type DemYeuCau, type DongViecChuong, type LoaiViecChuong, type NhomNgayTin,
  type TabViecChuong, bacNgan } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/** Phần `/my-work` chuông đọc (bản của badge ở App). */
export type ViecChuong = { dong?: DongViecChuong[]; chiNhanh?: { id: number; code: string }[] };
type DongLoai = LoaiViecChuong & { den: string };
type DongViec = DongViecChuong & { due?: string | null; classCode?: string | null; studentName?: string | null; studentId?: number | null; reason?: string | null; phu?: string | null };
type ThanhTab = TabViecChuong<DongViec> & { den: string };
/** Số dòng mở tại chỗ dưới một thanh (mockup ⑪ K1b). */
const SO_GAP = 3;

const Mui = () => (
  <svg aria-hidden className="chv-mui" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m6 3.5 4.5 4.5L6 12.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
/* ⌄ và ✓: SVG 16 nét đối xứng quanh (8, 8), đặt `place-items: center` — tâm nét = tâm nút. */
const MuiXuong = () => (
  <svg aria-hidden className="chv-ic" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3.5 6 8 10.5 12.5 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const DauXem = () => (
  <svg aria-hidden className="chv-ic" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 8.5 3.2 3L13 4.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

/* XM-2: khoá việc đã thấy ở lần mở chuông trước — nhớ trên máy (try/catch: chế độ riêng tư / bị chặn → không có "mới", không lỗi). */
const khoaDaThay = (uid: number | undefined) => `pisa.chuong.da-thay.u${uid ?? ''}`;
function docDaThay(uid: number | undefined): Set<string> | null {
  try { const s = localStorage.getItem(khoaDaThay(uid)); return s ? new Set(JSON.parse(s) as string[]) : null; } catch { return null; }
}
function ghiDaThay(uid: number | undefined, keys: readonly string[]) {
  try { localStorage.setItem(khoaDaThay(uid), JSON.stringify(keys.slice(0, 3000))); } catch { /* không lưu được: lần sau không báo "mới" */ }
}

export function HopChuong({ viec, dem, onDong }: { viec: ViecChuong | null | undefined; dem: DemYeuCau | null | undefined; onDong: () => void }) {
  const { session } = useSession();
  const nav = session?.nav;
  const uid = session?.user?.id;
  const navigate = useNavigate();
  const toast = useToast();
  const { homNay, nhan } = useNgayNghiepVu();
  /* Mỗi lần mở hộp (component gắn lại) tải lại — như trước. */
  const tb = useApi<any[]>('/notifications');
  const [xemTatCa, setXemTatCa] = useState(false);
  /* Đổi màn trong hộp gỡ nút vừa bấm → đưa focus sang nút tương ứng của màn mới (Esc / Tab vẫn trong hộp). Lần gắn đầu không đụng focus. */
  const nutLai = useRef<HTMLButtonElement>(null), nutTatCa = useRef<HTMLButtonElement>(null), daDoiMan = useRef(false);
  useEffect(() => { if (daDoiMan.current) (xemTatCa ? nutLai : nutTatCa).current?.focus(); }, [xemTatCa]);
  const doiMan = (v: boolean) => { daDoiMan.current = true; setXemTatCa(v); };

  /* OV-11f (CA1-2, Q9): Góc nhìn khác vai gốc → chỉ tin vai đang chọn mở được; không đánh dấu đọc tin không mở được. */
  const gn = session?.gocNhin;
  const gocKhac = !!gn?.dangChon && gn.dangChon !== gn.vaiGoc;
  const moDuoc = (n: any) => moDuocThongBao(n, nav ?? {});
  const ds = useMemo(() => (tb.data ?? []).filter((n) => !gocKhac || moDuocThongBao(n, nav ?? {})), [tb.data, gocKhac, nav]);
  const capNhat = useMemo(() => ds.filter((n) => !laTinViec(n)), [ds]);
  const chuaDoc = capNhat.filter((n) => !n.read_at).length;

  const coViec = !!nav?.workSupport;
  const laQl = !!nav?.workOps || !!nav?.workChamDiem;
  const nhieuCn = (viec?.chiNhanh?.length ?? 0) > 1;
  /* Đường Công việc đúng tab (+ việc mở thẳng) — cùng tham số trang Công việc đọc (`nhom`, `viec`, `nguoi`, `cn`). */
  const duongTab = (tab: string, key?: string) => {
    const q = new URLSearchParams({ nhom: tab });
    if (key) q.set('viec', key);
    if (laQl) q.set('nguoi', 'toi');
    if (nhieuCn) q.set('cn', 'tat-ca');
    return `/cong-viec?${q}`;
  };
  const thanh = useMemo<ThanhTab[] | null>(() => {
    if (coViec && !viec) return null;   // đang tải lần đầu
    /* GD-19: cùng hàm tab của trang Công việc (`tabCuaViec`) — TVV theo nhóm TVV; QL tab Vận hành tên "Việc quản lý" như trang. */
    return gomViecTheoTab((viec?.dong ?? []) as DongViec[], { tvv: !laQl && !!nav?.hvCuaToi, viecQuanLy: laQl }).map((g) => ({ ...g, den: duongTab(g.tab) }));
  }, [coViec, viec, nav]);   // eslint-disable-line react-hooks/exhaustive-deps
  const [moThanh, setMoThanh] = useState<string | null>(null);
  /*
   * Ngoài `/my-work` (badge / Công việc không đếm): thẻ Chờ bạn duyệt (`/yeu-cau/dem`) + việc chỉ có ở thông báo (đăng ký tài khoản…). Nhóm riêng dưới vạch,
   * KHÔNG cộng vào đầu khối — "n việc · n quá hạn" giữ đúng số Công việc / ô "Việc của tôi" / chuông (một nguồn, một hàm).
   */
  const them = useMemo<DongLoai[]>(() => {
    const ra: DongLoai[] = [];
    if (nav?.workApprove && dem?.cho) {
      ra.push({ loai: 'duyet', ten: t('Chờ bạn duyệt'), n: dem.cho, quaHan: dem.quaHan ?? 0, homNay: 0, cn: new Map(), keys: [], den: '/cong-viec?nhom=duyet' });
    }
    const tuTin = new Map<string, any[]>();
    for (const n of ds) if (laViecTuTin(n)) tuTin.set(n.kind, [...(tuTin.get(n.kind) ?? []), n]);
    for (const [kind, ns] of tuTin) {
      ra.push({ loai: kind, ten: VIEC_TU_TIN[kind], n: ns.length, quaHan: 0, homNay: 0, cn: new Map(), keys: ns.map((n) => `tb:${n.id}`), den: duongThongBao(ns[0]) ?? '/' });
    }
    return xepLoaiViec(ra);
  }, [dem, ds, nav]);

  /* "● n mới" (chỉ còn ở dòng Chờ duyệt / việc từ tin — thanh theo tab bỏ, mockup ⑪ [XM-3]): tập đã thấy đọc MỘT lần lúc mở; đóng hộp → ghi tập hiện có. */
  const [daThay] = useState(() => docDaThay(uid));
  const tatCaKhoa = useRef<string[] | null>(null);
  useEffect(() => { tatCaKhoa.current = thanh ? them.flatMap((l) => l.keys) : null; }, [thanh, them]);
  useEffect(() => () => { if (tatCaKhoa.current) ghiDaThay(uid, tatCaKhoa.current); }, [uid]);

  const vungCuon = useRef<HTMLDivElement>(null);
  const [conDuoi, setConDuoi] = useState(false);
  const xetCuoi = (el: HTMLDivElement) => setConDuoi(el.scrollHeight - el.scrollTop - el.clientHeight > 2);
  useEffect(() => { if (vungCuon.current) xetCuoi(vungCuon.current); }, [thanh, them, moThanh]);
  const tong = (thanh ?? []).reduce((a, l) => ({ n: a.n + l.n, qua: a.qua + l.quaHan, nay: a.nay + l.homNay }), { n: 0, qua: 0, nay: 0 });
  const maCn = new Map((viec?.chiNhanh ?? []).map((b) => [b.id, b.code]));

  const moTin = async (n: any) => {
    if (!moDuoc(n)) { toast.push('error', t('Mở ở vai gốc (đổi Góc nhìn trong menu tài khoản).')); return; }
    try { await api.post(`/notifications/${n.id}/read`); } catch { /* đọc chưa ghi được: vẫn mở đúng chỗ — lần sau tin còn chấm */ }
    const den = duongThongBao(n);
    if (den) navigate(den);
    onDong();
  };
  /* GD-19: "Đã xem hết" = đánh dấu ĐÚNG các tin đang thấy (≤ 200, một lệnh) → Hoàn tác 10 giây bỏ đọc đúng các tin đó (`/notifications/bo-doc`). */
  const docHet = async () => {
    const ids = capNhat.filter((n) => !n.read_at).map((n) => n.id).slice(0, 200);
    if (!ids.length) return;
    try {
      await api.post('/notifications/doc-nhieu', { ids });
      tb.reload();
      nutLai.current?.focus();   // nút vừa bấm thành disabled → focus không rơi ra ngoài hộp
      toast.hoanTac(t('Đã xem hết {n} tin', { n: ids.length }), () => {
        void api.post('/notifications/bo-doc', { ids }).then(() => tb.reload(), (e: any) => toast.push('error', e?.message || t('Chưa hoàn tác được — thử lại.')));
      }, { key: 'chuong-xem-het' });
    } catch (e: any) { toast.push('error', e?.message || t('Chưa đánh dấu đã đọc được — thử lại.')); }
  };
  /* ✓ một tin / cả nhóm gom: chỉ đánh dấu đã xem, không mở. */
  const daXem = async (ns: any[]) => {
    try {
      await api.post('/notifications/doc-nhieu', { ids: ns.map((n) => n.id) });
      tb.reload();
    } catch (e: any) { toast.push('error', e?.message || t('Chưa đánh dấu đã đọc được — thử lại.')); }
  };
  const [moGom, setMoGom] = useState<string | null>(null);

  /* GD-19 (mockup ⑪ K3): tin vi phạm — loại tin ghi "Vi phạm mới" / "Nhắc nhở" (chữ đỏ cho vi phạm), nội dung bỏ phần đầu đã nói ở loại. */
  const nhanTin = (n: any): { loai: string; viPham: boolean; chu: string; kq: ReturnType<typeof tachTin>['kq'] } => {
    const tit = dich(n.title);
    if (n.kind === 'discipline_de_biet') {
      const m = /^(Vi phạm mới|Nhắc nhở|Không xử lý vi phạm) · (.*)$/.exec(n.title ?? '');
      if (m) return { loai: dich(m[1] === 'Không xử lý vi phạm' ? t('GVCN không xử lý') : m[1]), viPham: m[1] !== 'Nhắc nhở', chu: m[2], kq: null };
    }
    const { kq, chu } = tachTin({ kind: n.kind, title: tit });
    return { loai: loaiTin(n.kind), viPham: false, chu, kq };
  };
  const tin = (n: any, day: boolean, trongGom = false) => {
    const { loai: nhanLoai, viPham, chu, kq } = nhanTin(n);
    const luc = thoiGianThongBao(n.created_at, homNay);
    const lyDo = n.kind === 'discipline_de_biet' && n.body ? dich(n.body) : null;   // "Không xử lý": lý do hiện đủ ở dòng hai (lời 48)
    const doc = `${n.read_at ? '' : t('Chưa đọc: ')}${nhanLoai}${n.lop ? ` · ${n.lop}` : ''}: ${kq ? `${kq.chu} · ` : ''}${chu}${lyDo ? ` · ${lyDo}` : ''}`;
    return (
      <li key={n.id} className="chv-tin-o">
        <button type="button" className={`chv-tin${n.read_at ? '' : ' chv-chua'}${day || lyDo ? ' chv-day' : ''}`} onClick={() => { void moTin(n); }} title={`${chu}${n.body ? ` · ${bacNgan(dich(n.body))}` : ''}`} aria-label={`${doc}, ${luc}`}>
          {!trongGom && <span aria-hidden className="chv-c" />}
          {!trongGom && <span className="chv-m"><span className={`chv-l${viPham ? ' chv-l-vp' : ''}`}>{nhanLoai}</span>{n.lop && <span className="chv-lop">{n.lop}</span>}<time title={nhan(homNay, n.created_at)}>{luc}</time></span>}
          <span className="chv-x">{kq && <><b className={`chv-kq chv-${kq.tone}`}>{kq.chu}</b> · </>}{chu}{lyDo && <span className="chv-ly"> · «{lyDo}»</span>}</span>
        </button>
        {!n.read_at && <button type="button" className="chv-xem" aria-label={t('Đã xem: {x}', { x: chu })} title={t('Đã xem')} onClick={() => { void daXem([n]); }}><DauXem /></button>}
      </li>
    );
  };
  /* Nhóm "n vi phạm mới · lớp": bấm dòng = tab Ý thức của lớp (qua tin đầu); ⌄ = từng em tại chỗ; ✓ = xem cả nhóm. */
  const nhomTin = (lop: string, ns: any[]) => {
    const mo = moGom === lop;
    const luc = thoiGianThongBao(ns[0].created_at, homNay);
    const ten = ns.map((n) => nhanTin(n).chu.split(' · ')[0]).join(' · ');
    return (
      <li key={`gom:${lop}`} className={`chv-tin-o chv-gom${mo ? ' chv-mo' : ''}`}>
        <button type="button" className="chv-tin chv-chua" onClick={() => { void moTin(ns[0]); }} aria-label={t('{n} vi phạm mới · {lop}: {ten}, {luc}', { n: ns.length, lop, ten, luc })}>
          <span aria-hidden className="chv-c" />
          <span className="chv-m"><span className="chv-l chv-l-vp">{t('{n} vi phạm mới', { n: ns.length })}</span><span className="chv-lop">{lop}</span><time>{luc}</time></span>
          <span className="chv-x">{ten}</span>
        </button>
        <button type="button" className="chv-mo-rong" aria-expanded={mo} aria-label={mo ? t('Thu gọn {n} vi phạm mới · {lop}', { n: ns.length, lop }) : t('Mở {n} vi phạm mới · {lop}', { n: ns.length, lop })}
          onClick={() => setMoGom(mo ? null : lop)}><MuiXuong /></button>
        <button type="button" className="chv-xem" aria-label={t('Đã xem cả {n} vi phạm mới · {lop}', { n: ns.length, lop })} title={t('Đã xem')} onClick={() => { void daXem(ns); }}><DauXem /></button>
        {mo && <ul className="chv-gom-mo">{ns.map((n) => tin(n, false, true))}</ul>}
      </li>
    );
  };
  const mucCapNhat = (ds: readonly any[]) => gomTinViPham(ds).map((m) => ('tin' in m ? tin(m.tin, false) : nhomTin(m.lop, m.ds)));

  const thanhTab = (g: ThanhTab) => {
    const mo = moThanh === g.tab;
    const b = { so: g.quaHan + g.homNay, n: g.n, quaHan: g.quaHan, homNay: g.homNay };   // cùng số đầu khối / chuông
    const sr = `${g.ten}: ${t('{n} việc', { n: g.n })}${g.quaHan ? t(', {n} quá hạn', { n: g.quaHan }) : ''}${g.homNay ? `, ${t('{n} hôm nay', { n: g.homNay })}` : ''}`;
    return (
      <li key={g.tab} className={`chv-thanh${mo ? ' chv-mo' : ''}`}>
        <button type="button" className="chv-t-lk" aria-label={sr} onClick={() => { navigate(g.den); onDong(); }}>
          <span className="chv-t-ten">{g.ten} <Mui /></span>
          <span className="chv-so"><b>{g.n}</b> {t('việc')}</span>
          <span className="chv-t-bd"><BadgeTabSo b={b} /></span>
        </button>
        <button type="button" className="chv-mo-rong" aria-expanded={mo} aria-controls={`chv-mo-${g.tab}`}
          aria-label={mo ? t('Thu gọn {x}', { x: g.ten }) : t('Mở {n} việc gấp nhất của {x}', { n: Math.min(SO_GAP, g.gap.length), x: g.ten })}
          onClick={() => setMoThanh(mo ? null : g.tab)}><MuiXuong /></button>
        {mo && (
          <div className="chv-t-mo" id={`chv-mo-${g.tab}`}>
            {g.gap.slice(0, SO_GAP).map((x) => {
              const lop = x.classCode ?? x.studentName ?? '';
              const phu = [x.studentId != null && x.classCode ? x.studentName : null, x.phu ?? x.reason].filter(Boolean).join(' · ');
              return (
                <button key={x.key} type="button" className="chv-vh" onClick={() => { navigate(duongTab(g.tab, x.key)); onDong(); }}>
                  <span className="chv-v1"><b>{lop}</b>{lop ? ' · ' : ''}{dich(NHAN_LOAI_VIEC[x.group] ?? x.group)}</span>
                  {phu && <span className="chv-v2">{dich(phu)}</span>}
                  {x.due && <span className="chv-v-han"><ChipHan loai={LOAI_HAN_CUA_VIEC[x.group] ?? 'viec-van-hanh'} han={x.due} vien /></span>}
                </button>
              );
            })}
            {g.gap.length > SO_GAP && <button type="button" className="chv-con-n" onClick={() => { navigate(g.den); onDong(); }}>{t('+ {n} việc', { n: g.gap.length - SO_GAP })} <Mui /></button>}
          </div>
        )}
      </li>
    );
  };

  const dongViec = (l: DongLoai) => {
    const moi = soViecMoi(l.keys, daThay);
    const cn = maCn.size > 1 && l.cn.size ? [...l.cn].map(([id, n]) => `${maCn.get(id) ?? '?'} ${n}`).join(' · ') : '';
    const dv = l.loai === 'duyet' ? t('yêu cầu') : l.loai === 'dang_ky' ? t('tài khoản') : t('việc');   // đơn vị luôn ghi (V13)
    const sr = `${l.ten}: ${l.n} ${dv}${l.quaHan ? t(', {n} quá hạn', { n: l.quaHan }) : ''}${l.homNay ? `, ${t('{n} hôm nay', { n: l.homNay })}` : ''}${moi ? `, ${t('{n} mới', { n: moi })}` : ''}`;
    return (
      <li key={l.loai}>
        <button type="button" className="chv-viec" aria-label={sr} onClick={() => { navigate(l.den); onDong(); }}>
          <span className="chv-ten"><span className="chv-t">{l.ten}</span>
            {(moi > 0 || cn) && <span className="chv-phu">{moi > 0 && <span className="chv-moi">{t('{n} mới', { n: moi })}</span>}{cn && <span>{cn}</span>}</span>}
          </span>
          <span className="chv-so"><b>{l.n}</b> {dv}</span>
          <span className="chv-tt">
            {l.quaHan > 0 ? <span className="chv-td chv-qua">{t('{n} quá hạn', { n: l.quaHan })}</span>
              : l.homNay > 0 ? <span className="chv-td chv-nay">{t('{n} hôm nay', { n: l.homNay })}</span> : null}
          </span>
          <Mui />
        </button>
      </li>
    );
  };

  if (xemTatCa) {
    const nhom = new Map<NhomNgayTin, any[]>();
    for (const n of capNhat) { const k = nhomNgayTin(n.created_at, homNay); nhom.set(k, [...(nhom.get(k) ?? []), n]); }
    const thuTu: NhomNgayTin[] = ['hom-nay', 'hom-qua', 'tuan-nay', 'truoc'];
    return (
      <div role="dialog" aria-label={t('Cập nhật')} className="card max-sm:fixed max-sm:inset-x-0 max-sm:top-[52px] max-sm:bottom-0 max-sm:pb-[env(safe-area-inset-bottom)] max-sm:rounded-none max-sm:border-0 z-40 overflow-y-auto shadow-2xl sm:absolute sm:top-full sm:right-0 sm:mt-1 sm:max-h-[min(46rem,calc(100dvh-5rem))] sm:w-[min(26rem,calc(100vw-2rem))] chv-hop">
        <div className="chv-x-dau">
          <button type="button" className="chv-lai" onClick={() => doiMan(false)} ref={nutLai} aria-label={t('Về Việc cần làm')}>
            <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10 3.5 5.5 8l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <h2>{t('Cập nhật')}</h2>
          {chuaDoc > 0 && <span className="chv-dem">{t('{n} chưa đọc', { n: chuaDoc })}</span>}
          <button type="button" className="chv-nut-chu" disabled={!chuaDoc} onClick={() => { void docHet(); }}>{t('Đã xem hết')}</button>
        </div>
        {tb.error ? <LoiTaiNho chu={t('Không tải được cập nhật.')} onRetry={tb.reload} />
          : !capNhat.length ? <p className="chv-rong">{t('Chưa có thông báo mới')}</p>
          : thuTu.filter((k) => nhom.get(k)?.length).map((k) => (
            <section key={k}>
              <h3 className="chv-x-nhom">{NHAN_NHOM_NGAY[k]}</h3>
              <ul className="chv-ds">{gomTinViPham(nhom.get(k)!).map((m) => ('tin' in m ? tin(m.tin, true) : nhomTin(m.lop, m.ds)))}</ul>
            </section>
          ))}
      </div>
    );
  }

  return (
    <div role="dialog" aria-label={t('Thông báo')} className="card max-sm:fixed max-sm:inset-x-0 max-sm:top-[52px] max-sm:bottom-0 max-sm:pb-[env(safe-area-inset-bottom)] max-sm:rounded-none max-sm:border-0 z-40 overflow-y-auto shadow-2xl sm:absolute sm:top-full sm:right-0 sm:mt-1 sm:max-h-[min(46rem,calc(100dvh-5rem))] sm:w-[min(26rem,calc(100vw-2rem))] chv-hop">
      <div className="chv-toan-dau sm:hidden"><h2>{t('Thông báo')}</h2><button type="button" className="chv-dong" aria-label={t('Đóng')} onClick={onDong}>✕</button></div>
      {/* Việc nhiều loại thì danh sách việc cuộn bên trong — khối Cập nhật luôn thấy ở đáy hộp. */}
      {coViec && (
        <div className="flex min-h-0 flex-col">
          <div className="chv-v-dau">
            <h2>{t('Việc cần làm')}</h2>
            <button type="button" className="chv-lk" onClick={() => { navigate('/cong-viec'); onDong(); }}>{t('Công việc')} <Mui /></button>
            {tong.n > 0 && (
              <span className="chv-tom">
                {/* GD-19 (mockup ⑪ K1): "n việc · m quá hạn · k hôm nay" (bảng mẫu G). */}
                <span className="chv-tong">{t('{n} việc', { n: tong.n })}</span>
                {tong.qua > 0 && <span className="chv-qua"><span className="chv-so-n">{tong.qua}</span> {t('quá hạn')}</span>}
                {tong.nay > 0 && <span className="chv-nay">{t('{n} hôm nay', { n: tong.nay })}</span>}
              </span>
            )}
          </div>
          {thanh == null ? <div className="chv-tai" aria-busy="true"><i /><i /><i /></div>
            : !thanh.length && !them.length ? <p className="chv-xong">{t('Không còn việc nào')}</p>
            : (
              /* GD-9 (PTA rà ảnh G4 375): còn dòng dưới → lớp mờ cuối vùng cuộn, không để mẩu dòng kế lòi qua đường kẻ; cuộn tới đáy thì tắt. */
              <div ref={vungCuon} onScroll={(e) => xetCuoi(e.currentTarget)} className={`min-h-0 overflow-y-auto${conDuoi ? ' chv-con-duoi' : ''}`}>
                {thanh.length > 0 && <ul className="chv-ds-v">{thanh.map(thanhTab)}</ul>}
                {them.length > 0 && <ul className="chv-ds-v chv-them">{them.map(dongViec)}</ul>}
              </div>
            )}
        </div>
      )}
      {(tb.error || capNhat.length > 0 || !coViec) && (
        <div className={coViec ? 'chv-cn shrink-0' : 'chv-cn chv-cn-mot'}>
          <div className="chv-cn-dau">
            <h2>{t('Cập nhật')}</h2>
            {chuaDoc > 0 && <span className="chv-dem">{t('{n} mới', { n: chuaDoc })}</span>}
            <span className="chv-phai">
              {chuaDoc > 0 && <button type="button" className="chv-nut-chu" onClick={() => { void docHet(); }}>{t('Đã xem hết')}</button>}
              {capNhat.length > 0 && <button type="button" className="chv-lk" onClick={() => doiMan(true)} ref={nutTatCa}>{t('Xem tất cả')} <Mui /></button>}
            </span>
          </div>
          {tb.error ? <LoiTaiNho chu={t('Không tải được cập nhật.')} onRetry={tb.reload} />
            : !capNhat.length ? <p className="chv-rong">{tb.data ? t('Chưa có thông báo mới') : ''}</p>
            : <ul className="chv-ds">{mucCapNhat(capNhat).slice(0, 4)}</ul>}
        </div>
      )}
    </div>
  );
}
