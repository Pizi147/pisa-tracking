/**
 * CHUÔNG V2 (chủ SP 11/11, mockup `thiet-ke/2026-11-11-chuong-v2/chuong-v2.html` — duyệt vòng 2): hộp dưới nút chuông.
 *  · Việc cần làm: việc của tôi gom theo loại (`gomViecChuong`, cùng `demDongViec` như badge / Công việc), từ bản `/my-work` App ĐÃ tải — không gọi thêm.
 *    Bấm một loại → Công việc mở đúng tab của loại đó (GD-9, mockup ⑤ G2). Thẻ Chờ duyệt (`/yeu-cau/dem`, App đã tải) và việc chỉ có ở thông báo (đăng ký tài khoản…) thêm một dòng loại.
 *  · Cập nhật: tin một chiều của `/notifications` — tải khi hộp MỞ (trước: mỗi lần tải trang). Tin trỏ tới việc không hiện (việc ở khối trên).
 *  · Xem tất cả: thay nội dung hộp tại chỗ, nhóm theo ngày, "Đánh dấu đã đọc".
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../lib/session.tsx';
import { useApi } from '../../lib/useApi.ts';
import { api } from '../../lib/api.ts';
import { LoiTaiNho } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { useToast } from '../../ui/Toast.tsx';
import {
  NHAN_NHOM_NGAY, VIEC_TU_TIN, duongThongBao, nhomViecCua, nhomViecTvvCua, gomViecChuong, laTinViec, laViecTuTin, loaiTin, moDuocThongBao, nhomNgayTin, soViecMoi, tachTin,
  thoiGianThongBao, xepLoaiViec, type DemYeuCau, type DongViecChuong, type LoaiViecChuong, type NhomNgayTin, bacNgan } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/** Phần `/my-work` chuông đọc (bản của badge ở App). */
export type ViecChuong = { dong?: DongViecChuong[]; chiNhanh?: { id: number; code: string }[] };
type DongLoai = LoaiViecChuong & { den: string };

const Mui = () => (
  <svg aria-hidden className="chv-mui" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m6 3.5 4.5 4.5L6 12.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
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
  const loai = useMemo<DongLoai[] | null>(() => {
    if (coViec && !viec) return null;   // đang tải lần đầu
    const ra: DongLoai[] = [];
    const nhieuCn = (viec?.chiNhanh?.length ?? 0) > 1;
    const laQl = !!nav?.workOps || !!nav?.workChamDiem;
    /* GD-9 (mockup ⑤ G2, R5.8): bấm một loại → Công việc ĐÚNG TAB của loại đó (cả tab, không lọc riêng loại) — cùng hàm tab của trang Công việc
       (`nhomViecCua` / `nhomViecTvvCua`): Báo cáo PH, Bàn giao → Vận hành; "Báo PH kết quả Test", Xử lý vi phạm, Phối hợp SOS → Ý thức & Phối hợp. */
    const tabCua = !laQl && nav?.hvCuaToi ? nhomViecTvvCua : nhomViecCua;
    for (const l of gomViecChuong(viec?.dong ?? [])) {
      const q = new URLSearchParams({ nhom: tabCua(l.loai) });
      if (laQl) q.set('nguoi', 'toi');
      if (nhieuCn) q.set('cn', 'tat-ca');
      ra.push({ ...l, den: `/cong-viec?${q}` });
    }
    return ra;
  }, [coViec, viec, nav]);
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

  /* "● n mới": tập đã thấy đọc MỘT lần lúc mở; đóng hộp → ghi tập hiện có (lần mở sau những việc này hết "mới"). */
  const [daThay] = useState(() => docDaThay(uid));
  const tatCaKhoa = useRef<string[] | null>(null);
  useEffect(() => { tatCaKhoa.current = loai ? [...loai, ...them].flatMap((l) => l.keys) : null; }, [loai, them]);
  useEffect(() => () => { if (tatCaKhoa.current) ghiDaThay(uid, tatCaKhoa.current); }, [uid]);

  const tong = (loai ?? []).reduce((a, l) => ({ n: a.n + l.n, qua: a.qua + l.quaHan, nay: a.nay + l.homNay }), { n: 0, qua: 0, nay: 0 });
  const maCn = new Map((viec?.chiNhanh ?? []).map((b) => [b.id, b.code]));

  const moTin = async (n: any) => {
    if (!moDuoc(n)) { toast.push('error', t('Mở ở vai gốc (đổi Góc nhìn trong menu tài khoản).')); return; }
    try { await api.post(`/notifications/${n.id}/read`); } catch { /* đọc chưa ghi được: vẫn mở đúng chỗ — lần sau tin còn chấm */ }
    const den = duongThongBao(n);
    if (den) navigate(den);
    onDong();
  };
  const docHet = async () => {
    try {
      /* Góc nhìn khác: chỉ đánh dấu tin đang thấy (vai này mở được) — tin của vai gốc giữ chưa đọc. DON-LUONG A6: một lệnh ≤ 200 id. */
      if (gocKhac) await api.post('/notifications/doc-nhieu', { ids: capNhat.filter((n) => !n.read_at).map((n) => n.id).slice(0, 200) });
      else await api.post('/notifications/doc-het');
      tb.reload();
      nutLai.current?.focus();   // nút vừa bấm thành disabled → focus không rơi ra ngoài hộp
    } catch (e: any) { toast.push('error', e?.message || t('Chưa đánh dấu đã đọc được — thử lại.')); }
  };

  const tin = (n: any, day: boolean) => {
    const { kq, chu } = tachTin({ kind: n.kind, title: dich(n.title) });
    const luc = thoiGianThongBao(n.created_at, homNay);
    const nhanLoai = loaiTin(n.kind);
    const doc = `${n.read_at ? '' : t('Chưa đọc: ')}${nhanLoai}: ${kq ? `${kq.chu} · ` : ''}${chu}`;
    return (
      <li key={n.id}>
        <button type="button" className={`chv-tin${n.read_at ? '' : ' chv-chua'}${day ? ' chv-day' : ''}`} onClick={() => { void moTin(n); }} title={`${chu}${n.body ? ` · ${bacNgan(dich(n.body))}` : ''}`} aria-label={`${doc}, ${luc}`}>
          <span aria-hidden className="chv-c" />
          <span className="chv-m"><span className="chv-l">{nhanLoai}</span><time title={nhan(homNay, n.created_at)}>{luc}</time></span>
          <span className="chv-x">{kq && <><b className={`chv-kq chv-${kq.tone}`}>{kq.chu}</b> · </>}{chu}</span>
          <Mui />
        </button>
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
      <div role="dialog" aria-label={t('Cập nhật')} className="card absolute inset-x-2 top-full z-40 mt-1 max-h-[70dvh] overflow-y-auto shadow-2xl sm:inset-x-auto sm:right-0 sm:max-h-[36rem] sm:w-[min(26rem,calc(100vw-2rem))] chv-hop">
        <div className="chv-x-dau">
          <button type="button" className="chv-lai" onClick={() => doiMan(false)} ref={nutLai} aria-label={t('Về Việc cần làm')}>
            <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10 3.5 5.5 8l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <h2>{t('Cập nhật')}</h2>
          {chuaDoc > 0 && <span className="chv-dem">{t('{n} chưa đọc', { n: chuaDoc })}</span>}
          <button type="button" className="chv-nut-chu" disabled={!chuaDoc} onClick={() => { void docHet(); }}>{t('Đánh dấu đã đọc')}</button>
        </div>
        {tb.error ? <LoiTaiNho chu={t('Không tải được cập nhật.')} onRetry={tb.reload} />
          : !capNhat.length ? <p className="chv-rong">{t('Chưa có thông báo mới')}</p>
          : thuTu.filter((k) => nhom.get(k)?.length).map((k) => (
            <section key={k}>
              <h3 className="chv-x-nhom">{NHAN_NHOM_NGAY[k]}</h3>
              <ul className="chv-ds">{nhom.get(k)!.map((n) => tin(n, true))}</ul>
            </section>
          ))}
      </div>
    );
  }

  return (
    <div role="dialog" aria-label={t('Thông báo')} className="card absolute inset-x-2 top-full z-40 mt-1 max-h-[70dvh] flex flex-col overflow-hidden shadow-2xl sm:inset-x-auto sm:right-0 sm:max-h-[36rem] sm:w-[min(26rem,calc(100vw-2rem))] chv-hop">
      {/* Việc nhiều loại thì danh sách việc cuộn bên trong — khối Cập nhật luôn thấy ở đáy hộp. */}
      {coViec && (
        <div className="flex min-h-0 flex-col">
          <div className="chv-v-dau">
            <h2>{t('Việc cần làm')}</h2>
            <button type="button" className="chv-lk" onClick={() => { navigate('/cong-viec'); onDong(); }}>{t('Công việc')} <Mui /></button>
            {tong.n > 0 && (
              <span className="chv-tom">
                {tong.qua > 0 && <span className="chv-qua"><span className="chv-so-n">{tong.qua}</span> {t('quá hạn')}</span>}
                {tong.nay > 0 && <span className="chv-nay">{t('{n} hôm nay', { n: tong.nay })}</span>}
                <span className="chv-tong">{t('{n} việc', { n: tong.n })}</span>
              </span>
            )}
          </div>
          {loai == null ? <div className="chv-tai" aria-busy="true"><i /><i /><i /></div>
            : !loai.length && !them.length ? <p className="chv-xong">{t('Không còn việc nào')}</p>
            : (
              <div className="min-h-0 overflow-y-auto">
                {loai.length > 0 && <ul className="chv-ds-v">{loai.map(dongViec)}</ul>}
                {them.length > 0 && <ul className="chv-ds-v chv-them">{them.map(dongViec)}</ul>}
              </div>
            )}
        </div>
      )}
      {(tb.error || capNhat.length > 0 || !coViec) && (
        <div className={coViec ? 'chv-cn shrink-0' : 'chv-cn chv-cn-mot'}>
          <div className="chv-cn-dau">
            <h2>{t('Cập nhật')}</h2>
            {chuaDoc > 0 && <span className="chv-dem">{t('{n} chưa đọc', { n: chuaDoc })}</span>}
            {capNhat.length > 0 && <button type="button" className="chv-lk" onClick={() => doiMan(true)} ref={nutTatCa}>{t('Xem tất cả')} <Mui /></button>}
          </div>
          {tb.error ? <LoiTaiNho chu={t('Không tải được cập nhật.')} onRetry={tb.reload} />
            : !capNhat.length ? <p className="chv-rong">{tb.data ? t('Chưa có thông báo mới') : ''}</p>
            : <ul className="chv-ds">{capNhat.slice(0, 3).map((n) => tin(n, false))}</ul>}
        </div>
      )}
    </div>
  );
}
