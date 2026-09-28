import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../../lib/session.tsx';
import { useApi } from '../../lib/useApi.ts';
import { api } from '../../lib/api.ts';
import { Info } from '../../ui/ui.tsx';
import { roleLabel, skillShort } from '../../lib/format.ts';
import { buocDanhSach, duongThongBao } from '@shared/domain/index.ts';

type SearchHit = { id: number; studentCode: string; fullName: string; classCode: string | null };

/** Thanh phải: tìm học viên, thông báo, tài khoản. Không lặp lại điều hướng chính. */
export function Header() {
  const { session, signOut } = useSession();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [openMenu, setOpenMenu] = useState<null | 'account' | 'notif'>(null);
  const [hits, setHits] = useState<SearchHit[]>([]);
  /** Lượt tìm cuối đã trả về (để "Không tìm thấy học viên" không hiện khi đang chờ). */
  const [daTim, setDaTim] = useState(false);
  /** Danh sách kết quả đang hiện (bấm ra ngoài / Esc thì ẩn, gõ hoặc vào lại ô thì hiện). */
  const [moTim, setMoTim] = useState(false);
  /** Chỉ số dòng đang sáng khi đi bằng mũi tên (−1 = chưa chọn). */
  const [dong, setDong] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const oTim = useRef<HTMLInputElement>(null);
  const nutThongBao = useRef<HTMLButtonElement>(null);
  const nutTaiKhoan = useRef<HTMLButtonElement>(null);
  const idDs = useId();
  const notifications = useApi<any[]>('/notifications');

  useEffect(() => {
    setDaTim(false);                                   // lượt mới: chưa trả về thì không báo "Không tìm thấy", Enter không mở kết quả cũ
    if (q.trim().length < 2) { setHits([]); setDong(-1); return; }
    const t = setTimeout(() => {
      api.get<{ rows: SearchHit[] }>(`/students?q=${encodeURIComponent(q)}`)
        .then((d) => { setHits((d.rows ?? []).slice(0, 8)); setDaTim(true); setDong(-1); })
        .catch(() => { setHits([]); setDaTim(false); setDong(-1); });
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) { setMoTim(false); setOpenMenu(null); }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const coDs = moTim && hits.length > 0;
  const khongThay = moTim && q.trim().length >= 2 && daTim && hits.length === 0;
  const dangMo = coDs || khongThay || openMenu !== null;

  /* Esc đóng menu/danh sách đang mở và trả focus về nút/ô đã mở nó — pha bắt + chặn lan (cùng mẫu MenuDong).
     CHỈ khi focus đang ở trong đầu trang: menu bỏ ngỏ không được giành Esc của panel/hộp thoại mở sau. */
  useEffect(() => {
    if (!dangMo) return undefined;
    const phim = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !boxRef.current?.contains(document.activeElement)) return;
      e.stopPropagation();
      e.preventDefault();
      const ve = openMenu === 'notif' ? nutThongBao.current : openMenu === 'account' ? nutTaiKhoan.current : oTim.current;
      setOpenMenu(null); setMoTim(false); setDong(-1);
      ve?.focus();
    };
    document.addEventListener('keydown', phim, true);
    return () => document.removeEventListener('keydown', phim, true);
  }, [dangMo, openMenu]);

  const moHocVien = (h: SearchHit) => { navigate(`/hoc-vien/${h.id}`); setQ(''); setHits([]); setDaTim(false); setMoTim(false); setDong(-1); };

  const unread = useMemo(() => (notifications.data ?? []).filter((n) => !n.read_at).length, [notifications.data]);
  const core = (session?.assignments ?? []).filter((a) => a.isCore);
  const skills = (session?.assignments ?? []).filter((a) => a.skill);

  return (
    <div className="flex items-center gap-2 min-w-0" ref={boxRef}>
      <div className="relative w-28 sm:w-52 lg:w-64 shrink">
        <input
          ref={oTim}
          className="field"
          placeholder="Tìm học viên…"
          value={q}
          onChange={(e) => { setQ(e.target.value); setMoTim(true); }}
          onFocus={() => setMoTim(true)}
          onBlur={(e) => { if (!e.currentTarget.parentElement?.contains(e.relatedTarget as Node | null)) setMoTim(false); }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {           // Home/End để nguyên cho con trỏ (như ô chọn người)
              if (!hits.length) return;
              e.preventDefault();
              setMoTim(true);
              const k = buocDanhSach(hits.length, dong, e.key);
              if (k !== null) setDong(k);
            } else if (e.key === 'Enter' && coDs && daTim) {
              e.preventDefault();
              moHocVien(hits[dong] ?? hits[0]);
            }
          }}
          role="combobox"
          aria-expanded={coDs}
          aria-controls={idDs}
          aria-activedescendant={coDs && dong >= 0 ? `${idDs}-${dong}` : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          aria-label="Tìm học viên trong phạm vi được cấp quyền"
        />
        {coDs && (
          <ul id={idDs} role="listbox" aria-label="Kết quả tìm học viên"
            className="absolute z-40 mt-1 w-[min(18rem,calc(100vw-2rem))] right-0 card overflow-hidden shadow-2xl list-none p-0 m-0">
            {hits.map((h, i) => (
              <li key={h.id} role="none">
                <button
                  id={`${idDs}-${i}`}
                  type="button"
                  role="option"
                  aria-selected={i === dong}
                  tabIndex={-1}
                  className={`w-full min-h-[44px] sm:min-h-0 text-left px-3 py-2 text-sm ${i === dong ? 'bg-white/5' : 'hover:bg-white/5'}`}
                  onMouseEnter={() => setDong(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => moHocVien(h)}
                >
                  <span className="text-slate-100">{h.fullName}</span>
                  <span className="text-slate-500 text-xs ml-2">{h.studentCode}</span>
                  {h.classCode && <span className="text-slate-500 text-xs ml-2">{h.classCode}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
        {khongThay && (
          <div role="status" className="absolute z-40 mt-1 w-[min(18rem,calc(100vw-2rem))] right-0 card shadow-2xl px-3 py-2 text-[13px] text-slate-400">
            Không tìm thấy học viên
          </div>
        )}
      </div>

      <div className="relative">
        <button ref={nutThongBao} className="btn btn-sm" onClick={() => setOpenMenu(openMenu === 'notif' ? null : 'notif')}
          aria-label="Thông báo" aria-expanded={openMenu === 'notif'}>
          <span className="hidden sm:inline">Thông báo</span>
          <span className="sm:hidden" aria-hidden>🔔</span>
          {unread > 0 && <span className="ml-1 rounded bg-sky-300/25 text-sky-200 px-1.5 text-[10px]">{unread}</span>}
        </button>
        {openMenu === 'notif' && (
          <div className="absolute right-0 mt-1 w-[min(24rem,calc(100vw-2rem))] card z-40 shadow-2xl max-h-96 overflow-y-auto">
            {(notifications.data ?? []).length === 0 && <div className="p-4 text-sm text-slate-500">Không có thông báo nào.</div>}
            {(notifications.data ?? []).map((n) => (
              <button
                key={n.id}
                className="block w-full text-left px-3 py-2 border-b hover:bg-white/5"
                style={{ borderColor: 'var(--line)' }}
                onClick={async () => {
                  await api.post(`/notifications/${n.id}/read`);
                  notifications.reload();
                  /* Mỗi loại thông báo về đúng chỗ làm được việc của nó (R8, Q12) — một quy ước duy nhất. */
                  const den = duongThongBao(n);
                  if (den) navigate(den);
                  setOpenMenu(null);
                }}
              >
                <div className="text-sm text-slate-200 flex items-center gap-2">
                  {!n.read_at && <span className="w-1.5 h-1.5 rounded-full bg-sky-300 shrink-0" />}
                  {n.title}
                </div>
                {n.body && <div className="text-xs text-slate-500 mt-0.5">{n.body}</div>}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <button ref={nutTaiKhoan} className="btn btn-sm" onClick={() => setOpenMenu(openMenu === 'account' ? null : 'account')}
          aria-expanded={openMenu === 'account'}>
          <span className="text-slate-200 truncate max-w-[6rem] sm:max-w-[10rem]">{session?.user?.fullName}</span>
        </button>
        {openMenu === 'account' && (
          <div className="absolute right-0 mt-1 w-[min(20rem,calc(100vw-2rem))] card p-3 z-40 shadow-2xl">
            <div className="text-sm font-medium text-slate-100">{session?.user?.fullName}</div>
            <div className="text-xs text-slate-500 mb-3">{session?.user?.title}</div>

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
                <div className="label">Chủ nhiệm</div>
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
                    <Info key={i}>{c.classCode} · {skillShort(c.skill!)}</Info>
                  ))}
                </div>
              </>
            )}

            {/*
              LỐI PHỤ. Điều hướng chính chỉ còn hai mục vì đó là hai việc thường ngày;
              những màn dưới đây mở thỉnh thoảng nên không cần chiếm chỗ trên thanh menu.
            */}
            <div className="border-t pt-2 mb-2 space-y-1" style={{ borderColor: 'var(--line)' }}>
              {/*
                "Tổng hợp theo tuần" và "Báo cáo tuần" ĐÃ RỜI THANH ĐIỀU HƯỚNG ở vòng 4.

                Bảng theo tuần nay là chế độ xem thứ hai của Thực trạng (mục 10.5), nên để
                thêm một lối vào riêng là hai cửa dẫn vào cùng một chỗ. Báo cáo tuần thì owner
                bỏ tạm (mục 12). Hai địa chỉ cũ vẫn mở được, chỉ không còn nút dẫn tới.
              */}
              {/* Hồ sơ cá nhân (mục 7.2) — ai cũng có, nên đứng trước lối vào quản trị. */}
              <Link to="/ho-so-ca-nhan" className="btn btn-sm w-full justify-center no-underline"
                onClick={() => setOpenMenu(null)}>Hồ sơ cá nhân</Link>
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
