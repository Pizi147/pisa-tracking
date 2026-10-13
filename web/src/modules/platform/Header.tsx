import { useEffect, useId, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../../lib/session.tsx';
import { useApi } from '../../lib/useApi.ts';
import { api } from '../../lib/api.ts';
import { Info } from '../../ui/ui.tsx';
import { CongTacGiaoDien } from '../../ui/CongTacGiaoDien.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { roleLabel, skillShort } from '../../lib/format.ts';
import { buocDanhSach, chuanHoaMaLop, duongThongBao, maHocVienNgan, moDuocThongBao, ngayTheoGioVN, noiDenThongBao, nhomThongBao, thoiGianThongBao } from '@shared/domain/index.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { useToast } from '../../ui/Toast.tsx';

type SearchHit = { id: number; studentCode: string; fullName: string; classCode: string | null };

type LopRef = { id: number; code: string; student_count: number };

/** Thanh phải: tìm học viên + lớp (K1-43), thông báo, tài khoản. Không lặp lại điều hướng chính. */
export function Header() {
  const { session, signOut, doiGocNhin } = useSession();
  const toast = useToast();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [openMenu, setOpenMenu] = useState<null | 'account' | 'notif'>(null);
  const [hits, setHits] = useState<SearchHit[]>([]);
  /** Lượt tìm cuối đã trả về (để "Không tìm thấy…" không hiện khi đang chờ). */
  const [daTim, setDaTim] = useState(false);
  /** Danh sách kết quả đang hiện (bấm ra ngoài / Esc thì ẩn, gõ hoặc vào lại ô thì hiện). */
  const [moTim, setMoTim] = useState(false);
  /** Chỉ số dòng đang sáng khi đi bằng mũi tên, đếm chung học viên rồi lớp (−1 = chưa chọn). */
  const [dong, setDong] = useState(-1);
  /** Điện thoại (< 640 px, VN33): ô tìm là nút kính lúp; bấm thì ô mở neo hai mép ngay dưới thanh trên. */
  const dienThoai = useDienThoai();
  const [moTimDt, setMoTimDt] = useState(false);
  const nutTim = useRef<HTMLButtonElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const oTim = useRef<HTMLInputElement>(null);
  const nutThongBao = useRef<HTMLButtonElement>(null);
  const nutTaiKhoan = useRef<HTMLButtonElement>(null);
  const idDs = useId();
  const notifications = useApi<any[]>('/notifications');
  const { homNay, nhan } = useNgayNghiepVu();
  /* Danh sách lớp trong phạm vi: đọc một lần (useApi nhớ sẵn), lọc tại chỗ theo mã chuẩn hoá — gõ "ft101" ra MB FT 101. */
  const lopRef = useApi<LopRef[]>('/ref/classes');
  const timDu = q.trim().length >= 2;
  const khoaLop = chuanHoaMaLop(q);
  const lops = timDu && khoaLop
    ? (lopRef.data ?? []).filter((l) => chuanHoaMaLop(l.code).includes(khoaLop)).slice(0, 4)
    : [];

  useEffect(() => {
    setDaTim(false);                                   // lượt mới: chưa trả về thì không báo "Không tìm thấy", Enter không mở kết quả cũ
    if (!timDu) { setHits([]); setDong(-1); return; }
    const t = setTimeout(() => {
      api.get<{ rows: SearchHit[] }>(`/students?q=${encodeURIComponent(q)}`)
        .then((d) => { setHits((d.rows ?? []).slice(0, 6)); setDaTim(true); setDong(-1); })
        .catch(() => { setHits([]); setDaTim(false); setDong(-1); });
    }, 250);
    return () => clearTimeout(t);
  }, [q, timDu]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) { setMoTim(false); setOpenMenu(null); setMoTimDt(false); }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  /* Một danh sách cho bàn phím: học viên trước, lớp sau. */
  const den = [...hits.map((h) => `/hoc-vien/${h.id}`), ...lops.map((l) => `/hoc-vien/lop/${l.id}`)];
  const coDs = moTim && timDu && den.length > 0;
  const khongThay = moTim && timDu && daTim && den.length === 0;
  const dangMo = coDs || khongThay || openMenu !== null || moTimDt;

  /* Esc đóng menu/danh sách đang mở và trả focus về nút/ô đã mở nó — pha bắt + chặn lan (cùng mẫu MenuDong).
     CHỈ khi focus đang ở trong đầu trang: menu bỏ ngỏ không được giành Esc của panel/hộp thoại mở sau. */
  useEffect(() => {
    if (!dangMo) return undefined;
    const phim = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !boxRef.current?.contains(document.activeElement)) return;
      e.stopPropagation();
      e.preventDefault();
      const ve = openMenu === 'notif' ? nutThongBao.current : openMenu === 'account' ? nutTaiKhoan.current : moTimDt ? nutTim.current : oTim.current;
      setOpenMenu(null); setMoTim(false); setMoTimDt(false); setDong(-1);
      ve?.focus();
    };
    document.addEventListener('keydown', phim, true);
    return () => document.removeEventListener('keydown', phim, true);
  }, [dangMo, openMenu, moTimDt]);

  const moMuc = (i: number) => { navigate(den[i]); setQ(''); setHits([]); setDaTim(false); setMoTim(false); setMoTimDt(false); setDong(-1); };
  /** Thuộc tính chung của một dòng kết quả (học viên hay lớp) — `i` đếm chung cả hai nhóm. */
  const nutMuc = (i: number) => ({
    id: `${idDs}-${i}`,
    type: 'button' as const,
    role: 'option',
    'aria-selected': i === dong,
    tabIndex: -1,
    className: `w-full min-h-[44px] sm:min-h-0 text-left px-3 py-2 text-sm ${i === dong ? 'bg-white/5' : 'hover:bg-white/5'}`,
    onMouseEnter: () => setDong(i),
    onMouseDown: (e: ReactMouseEvent) => e.preventDefault(),
    onClick: () => moMuc(i),
  });

  /*
   * OV-11f (CA1-2, Q9): ở Góc nhìn khác vai gốc, chuông chỉ hiện thông báo vai đang chọn MỞ ĐƯỢC (`moDuocThongBao` theo `nav`); về vai gốc thấy lại.
   * Bấm thông báo không mở được thì không đánh dấu đọc (không mất nhắc việc).
   */
  const gn = session?.gocNhin;
  const gocKhac = !!gn?.dangChon && gn.dangChon !== gn.vaiGoc;
  const moDuoc = (n: any) => moDuocThongBao(n, session?.nav ?? {});
  const dsThongBao = useMemo(() => (notifications.data ?? []).filter((n) => !gocKhac || moDuocThongBao(n, session?.nav ?? {})), [notifications.data, gocKhac, session?.nav]);
  const unread = useMemo(() => dsThongBao.filter((n) => !n.read_at).length, [dsThongBao]);
  /* OV-11f (TQ-15): chỉ lớp đang mở (`/ref/classes` = lớp đang hoạt động trong phạm vi) — lớp đã kết thúc không còn ở menu tài khoản. */
  const lopMo = lopRef.data ? new Set(lopRef.data.map((l) => l.id)) : null;
  const lopDangMo = (a: { classId: number }) => !lopMo || lopMo.has(a.classId);
  const core = (session?.assignments ?? []).filter((a) => a.isCore && lopDangMo(a));
  const skills = (session?.assignments ?? []).filter((a) => a.skill && lopDangMo(a));
  /* Chữ cái đầu của TÊN GỌI (chữ cuối của họ tên: "Nguyễn Khánh Vy" → V) cho vòng tròn tài khoản trên điện thoại. */
  const hoTen = session?.user?.fullName ?? '';
  const chuCaiDau = [...(hoTen.trim().split(/\s+/).pop() ?? '')][0]?.toUpperCase() ?? '';
  /** Danh sách kết quả: máy tính thả dưới ô; điện thoại nằm trong khung ô tìm đã neo hai mép. */
  const lopDs = dienThoai ? 'mt-1 w-full' : 'absolute z-40 mt-1 w-[min(18rem,calc(100vw-2rem))] right-0 shadow-2xl';

  const oTimVaKetQua = (
    <>
      <input
        ref={oTim}
        autoFocus={dienThoai}
        className="field"
        placeholder="Tìm học viên, lớp…"
        value={q}
        onChange={(e) => { setQ(e.target.value); setMoTim(true); }}
        onFocus={() => setMoTim(true)}
        onBlur={(e) => { if (!e.currentTarget.parentElement?.contains(e.relatedTarget as Node | null)) setMoTim(false); }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {           // Home/End để nguyên cho con trỏ (như ô chọn người)
            if (!den.length) return;
            e.preventDefault();
            setMoTim(true);
            const k = buocDanhSach(den.length, dong, e.key);
            if (k !== null) setDong(k);
          } else if (e.key === 'Enter' && coDs && daTim) {
            e.preventDefault();
            moMuc(dong >= 0 && dong < den.length ? dong : 0);
          }
        }}
        role="combobox"
        aria-expanded={coDs}
        aria-controls={idDs}
        aria-activedescendant={coDs && dong >= 0 ? `${idDs}-${dong}` : undefined}
        aria-autocomplete="list"
        autoComplete="off"
        aria-label="Tìm học viên, lớp trong phạm vi được cấp quyền"
      />
      {coDs && (
        <ul id={idDs} role="listbox" aria-label="Kết quả tìm học viên, lớp"
          className={`${lopDs} card overflow-hidden list-none p-0 m-0`}>
          {hits.length > 0 && <li role="none" aria-hidden className="px-3 pt-2 pb-1 text-[11px] text-slate-500">Học viên</li>}
          {hits.map((h, i) => (
            <li key={`hv${h.id}`} role="none">
              <button {...nutMuc(i)}>
                <span className="text-slate-100">{h.fullName}</span>
                <span className="text-slate-500 text-xs ml-2">{maHocVienNgan(h.studentCode)}</span>
                {h.classCode && <span className="text-slate-500 text-xs ml-2">{h.classCode}</span>}
              </button>
            </li>
          ))}
          {lops.length > 0 && <li role="none" aria-hidden className="px-3 pt-2 pb-1 text-[11px] text-slate-500">Lớp</li>}
          {lops.map((l, j) => (
            <li key={`lop${l.id}`} role="none">
              <button {...nutMuc(hits.length + j)}>
                <span className="text-slate-100">{l.code}</span>
                <span className="text-slate-500 text-xs ml-2 tabular-nums">· {l.student_count} HV</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {khongThay && (
        <div role="status" className={`${lopDs} card px-3 py-2 text-[13px] text-slate-400`}>
          Không tìm thấy học viên hoặc lớp
        </div>
      )}
    </>
  );

  return (
    <div className="flex items-center gap-2 max-sm:gap-0.5 min-w-0" ref={boxRef}>
      {dienThoai ? (
        <>
          <button ref={nutTim} type="button" className="btn btn-sm min-h-[44px] min-w-[44px] justify-center border-0 bg-transparent" aria-label="Tìm học viên, lớp"
            aria-expanded={moTimDt} onClick={() => { setMoTimDt((v) => !v); setOpenMenu(null); }}>
            <svg aria-hidden width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="7" cy="7" r="4.5" /><path d="m10.5 10.5 3 3" /></svg>
          </button>
          {moTimDt && <div className="card absolute inset-x-2 top-full z-40 mt-1 p-2 shadow-2xl">{oTimVaKetQua}</div>}
        </>
      ) : (
        <div className="relative w-52 lg:w-64 shrink">{oTimVaKetQua}</div>
      )}

      <div className="sm:relative">
        <button ref={nutThongBao} className="btn btn-sm relative max-sm:min-h-[44px] max-sm:min-w-[44px] max-sm:justify-center max-sm:border-0 max-sm:bg-transparent"
          onClick={() => { if (openMenu !== 'notif') notifications.reload(); setOpenMenu(openMenu === 'notif' ? null : 'notif'); setMoTimDt(false); }}
          aria-label={`Thông báo${unread ? `, ${unread} chưa đọc` : ''}`} aria-expanded={openMenu === 'notif'}>
          <span className="hidden sm:inline">Thông báo</span>
          {/* Chuông nét mảnh 20 px thay emoji (luật "dấu nhỏ gọn", 23C). Số chưa đọc đè góc trên phải trên điện thoại. */}
          <svg className="sm:hidden" aria-hidden width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 11V7a4 4 0 0 1 8 0v4l1.5 1.5h-11L4 11ZM6.5 14a1.5 1.5 0 0 0 3 0" strokeLinejoin="round" /></svg>
          {unread > 0 && <span className="ml-1 rounded bg-doing-bg text-doing px-1.5 text-[11.5px] tabular-nums max-sm:absolute max-sm:right-px max-sm:top-[3px] max-sm:ml-0 max-sm:min-w-[18px] max-sm:rounded-[9px] max-sm:text-center max-sm:leading-[18px]">{unread}</span>}
        </button>
        {openMenu === 'notif' && (
          /*
           * PR-VAI-a (mockup 23 màn D, T76, UX-D6): hai nhóm Cần làm / Để biết, giờ, dòng "bấm tới đâu", Đọc hết. Máy tính: thả dưới nút.
           * Điện thoại (< 640 px): neo HAI MÉP ngay dưới ĐÁY `<header>` (CSS: header `relative`, khung bọc nút chỉ `sm:relative`), cao tối đa 70 vh, cuộn trong — có DemoBar hay không đều đúng.
           */
          <div role="dialog" aria-label="Thông báo"
            className="card absolute inset-x-2 top-full z-40 mt-1 max-h-[70vh] overflow-y-auto shadow-2xl sm:inset-x-auto sm:right-0 sm:max-h-[32rem] sm:w-[min(26rem,calc(100vw-2rem))]">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b px-3.5 py-2" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
              <h2 className="m-0 text-sm font-semibold text-slate-100">Thông báo <span className="font-normal text-slate-500">· <span className="tabular-nums">{unread}</span> chưa đọc</span></h2>
              <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={!unread}
                onClick={async () => {
                  /* Góc nhìn khác: chỉ đánh dấu những thông báo đang thấy (vai này mở được) — thông báo của vai gốc giữ chưa đọc. */
                  try {
                    if (gocKhac) await Promise.all(dsThongBao.filter((n) => !n.read_at).map((n) => api.post(`/notifications/${n.id}/read`)));
                    else await api.post('/notifications/doc-het');
                    notifications.reload();
                  }
                  catch (e: any) { toast.push('error', e?.message || 'Chưa đánh dấu đã đọc được — thử lại.'); }
                }}>Đánh dấu đã đọc</button>
            </div>
            {dsThongBao.length === 0 && <div className="p-4 text-sm text-slate-500">Không có thông báo nào.</div>}
            {(['can-lam', 'de-biet'] as const).map((nhom) => {
              const ds = dsThongBao.filter((n) => nhomThongBao(n) === nhom);
              if (!ds.length) return null;
              return (
                <div key={nhom}>
                  <div className="flex items-baseline gap-2 border-b px-3.5 py-1.5 text-[11.5px] font-bold uppercase tracking-wide text-slate-400"
                    style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
                    {nhom === 'can-lam' ? 'Cần làm' : 'Để biết'} <span className="tabular-nums">{ds.length}</span>
                  </div>
                  {ds.map((n) => {
                    const toi = noiDenThongBao(n);
                    return (
                      <button key={n.id} type="button"
                        className="grid w-full grid-cols-[10px_minmax(0,1fr)_auto] items-start gap-x-2.5 gap-y-0.5 border-b px-3.5 py-2.5 text-left hover:bg-white/5"
                        style={{ borderColor: 'var(--line)' }}
                        onClick={async () => {
                          if (!moDuoc(n)) { toast.push('error', 'Mở ở vai gốc (đổi Góc nhìn trong menu tài khoản).'); return; }
                          await api.post(`/notifications/${n.id}/read`);
                          notifications.reload();
                          /* Mỗi loại thông báo về đúng chỗ làm được việc của nó (R8, Q12) — một quy ước duy nhất. */
                          const den = duongThongBao(n);
                          if (den) navigate(den);
                          setOpenMenu(null);
                        }}>
                        <span aria-hidden className={`mt-1.5 h-1.5 w-1.5 rounded-full ${n.read_at ? '' : 'bg-[color:var(--accent)]'}`} />
                        <span className={`text-[13px] leading-snug text-slate-100 ${n.read_at ? 'font-normal' : 'font-semibold'}`}>
                          {!n.read_at && <span className="sr-only">Chưa đọc: </span>}{n.title}
                        </span>
                        <time className="whitespace-nowrap pt-px text-xs tabular-nums text-slate-500" title={nhan(homNay, n.created_at)}>{thoiGianThongBao(n.created_at, homNay)}</time>
                        {n.body && <span className="col-start-2 text-xs text-slate-400">{n.body}</span>}
                        {toi && (
                          <span className="col-start-2 inline-flex items-center gap-1 text-xs text-[color:var(--accent)]">
                            {toi}
                            <svg aria-hidden width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m6 3.5 4.5 4.5L6 12.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Q2 = A: điện thoại (< 640 px) — Sáng/Tối nằm trong menu Tài khoản (bên dưới), không chiếm chỗ trên thanh. */}
      {!dienThoai && <CongTacGiaoDien />}

      <div className="relative">
        <button ref={nutTaiKhoan} className="btn btn-sm max-sm:min-h-[44px] max-sm:min-w-[44px] max-sm:justify-center max-sm:border-0 max-sm:bg-transparent" onClick={() => { setOpenMenu(openMenu === 'account' ? null : 'account'); setMoTimDt(false); }}
          aria-label={`Tài khoản ${hoTen}`} aria-expanded={openMenu === 'account'}>
          <span aria-hidden className="grid h-[30px] w-[30px] place-items-center rounded-full text-[13px] font-bold sm:hidden"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>{chuCaiDau}</span>
          <span className="hidden max-w-[10rem] truncate text-slate-200 sm:inline">{hoTen}</span>
        </button>
        {openMenu === 'account' && (
          <div className="absolute right-0 mt-1 w-[min(20rem,calc(100vw-2rem))] card p-3 z-40 shadow-2xl">
            <div className="text-sm font-medium text-slate-100">{session?.user?.fullName}</div>
            <div className="text-xs text-slate-500 mb-3">{session?.user?.title}</div>

            {/* PR-OV2a (mockup overhaul-3 §2): đổi góc nhìn — chỉ vai tài khoản đang nắm; chọn vai gốc = về làm việc bằng mọi vai. */}
            {session?.gocNhin && (
              <div role="group" aria-label="Góc nhìn" className="mb-3 space-y-1">
                <div className="label">Góc nhìn</div>
                {session.gocNhin.coThe.map((v) => {
                  const g = session.gocNhin!;
                  const dangO = (g.dangChon ?? g.vaiGoc) === v.role;
                  return (
                    <button key={v.role} type="button" aria-pressed={dangO}
                      onClick={() => { setOpenMenu(null); if (!dangO) void doiGocNhin(v.role === g.vaiGoc ? null : v.role).catch((e) => toast.push('error', e instanceof Error ? e.message : 'Không đổi được góc nhìn.')); }}
                      className={`flex w-full min-h-[40px] max-sm:min-h-[44px] items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-left text-sm ${dangO
                        ? 'border-[color:var(--accent-line)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)] font-medium'
                        : 'border-transparent text-slate-200 hover:bg-white/5'}`}>
                      <span className="shrink-0">{v.nhan}</span>
                      <span className="min-w-0 truncate text-xs font-normal text-slate-500" title={v.phamVi}>· {v.phamVi}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="label">Phạm vi được cấp</div>
            <ul className="space-y-1 mb-3 list-none p-0">
              {(session?.grants ?? []).map((g) => (
                <li key={g.id} className="text-xs text-slate-300 flex items-center gap-1">
                  <Info>{roleLabel(g.role)}</Info>
                  <span className="text-slate-500">{g.branchName ?? 'Toàn hệ thống'}</span>
                </li>
              ))}
            </ul>

            {core.length > 0 && (
              <>
                <div className="label">GVCN</div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {core.map((c) => <Info key={c.classId}>GVCN {c.classCode}</Info>)}
                </div>
              </>
            )}
            {skills.length > 0 && (
              <>
                <div className="label">Kỹ năng được phân công</div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {skills.map((c, i) => (
                    <Info key={i}>{c.classCode} · {c.nhanMon ?? skillShort(c.skill!)}</Info>
                  ))}
                </div>
              </>
            )}

            {/*
              LỐI PHỤ. Điều hướng chính chỉ còn hai mục vì đó là hai việc thường ngày;
              những màn dưới đây mở thỉnh thoảng nên không cần chiếm chỗ trên thanh menu.
            */}
            <div className="border-t pt-2 mb-2 space-y-1" style={{ borderColor: 'var(--line)' }}>
              {dienThoai && <CongTacGiaoDien kieu="menu" />}
              {/*
                "Tổng hợp theo tuần" và "Báo cáo tuần" ĐÃ RỜI THANH ĐIỀU HƯỚNG ở vòng 4.

                Bảng theo tuần nay là chế độ xem thứ hai của Thực trạng (mục 10.5), nên để
                thêm một lối vào riêng là hai cửa dẫn vào cùng một chỗ. Báo cáo tuần thì owner
                bỏ tạm (mục 12). Hai địa chỉ cũ vẫn mở được, chỉ không còn nút dẫn tới.
              */}
              {/* Hồ sơ cá nhân (mục 7.2) — ai cũng có, nên đứng trước lối vào quản trị. */}
              <Link to="/ho-so-ca-nhan" className="btn btn-sm w-full justify-center no-underline"
                onClick={() => setOpenMenu(null)}>Hồ sơ cá nhân</Link>
              {/* Hồ sơ giáo viên (PR-GV, G-12) — chỉ người có vai Giáo viên; không thuộc bốn khu vực. */}
              {session?.user && session.roles?.includes('teacher') && (
                <Link to={`/giao-vien/${session.user.id}`} className="btn btn-sm w-full justify-center no-underline"
                  onClick={() => setOpenMenu(null)}>Hồ sơ giáo viên</Link>
              )}
              {session?.nav?.admin && (
                <Link to="/quan-tri" className="btn btn-sm w-full justify-center no-underline"
                  onClick={() => setOpenMenu(null)}>Quản trị hệ thống</Link>
              )}
            </div>
            <button className="btn btn-sm w-full justify-center" onClick={signOut}>Đăng xuất</button>
          </div>
        )}
      </div>
    </div>
  );
}
