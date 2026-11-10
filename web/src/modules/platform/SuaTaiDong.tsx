import { useRef, useState, type ReactNode } from 'react';
import { api } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { HopNeo } from '../../ui/HopNeo.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { ChonKyNang } from './ProfilePage.tsx';
import { SuaVaiChiNhanh, capTuTaiKhoan, khoaVai, loiThieuChiNhanh, payloadVai, type CapVai } from './SuaVaiChiNhanh.tsx';
import { roleLabel } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

type TaiKhoan = { id: number; fullName: string; roles: { role: string; roleName: string; branchCode: string | null; branchName: string | null }[]; skills: string[] };
type Branch = { code: string; name: string };

/**
 * KHUNG CHUNG "SỬA TẠI DÒNG" (QTV2-TK, chủ SP 11/11 "đổi vai của các tài khoản" — tại dòng, không mở panel 720 px): ô bấm được bọc phần đang hiện;
 * ≥ 640 px mở `HopNeo` ngay dưới ô, điện thoại mở `KhungPanel` toàn màn. Bấm ngoài / Esc: chưa đổi → đóng; đã đổi → hỏi một lần ngay trong hộp.
 * Lưu: chờ máy chủ, lỗi thì GIỮ hộp + lựa chọn, báo lỗi trong hộp; xong → toast Hoàn tác (gửi lại giá trị cũ).
 */
function SuaTaiDong({ nhan, tieuDe, ten, mat, daDoi, loiTruoc, onMo, onLuu, children }: {
  nhan: string; tieuDe: string; ten: string; mat: ReactNode; daDoi: boolean;
  /** Lỗi chặn trước khi gửi (vd vai thiếu chi nhánh) — có thì nút Lưu không gửi. */
  loiTruoc: boolean;
  onMo: () => void; onLuu: () => Promise<void>; children: ReactNode;
}) {
  const dienThoai = useDienThoai();
  const o = useRef<HTMLButtonElement>(null);
  const [mo, setMo] = useState(false);
  const [hoiBo, setHoiBo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const dong = () => { setMo(false); setHoiBo(false); setLoi(null); };
  const ngoai = () => { if (busy) return; if (daDoi) setHoiBo(true); else dong(); };
  const luu = async () => {
    if (busy || loiTruoc) return;
    if (!daDoi) { dong(); return; }
    setBusy(true); setLoi(null);
    try { await onLuu(); dong(); } catch (e: any) { setLoi(e?.message ?? t('Không lưu được')); } finally { setBusy(false); }
  };
  const chan = (
    <div className="flex flex-wrap items-center gap-2 border-t pt-3" style={{ borderColor: 'var(--line)' }}>
      {hoiBo ? (<>
        <span className="flex-1 text-sm text-slate-300" role="status">{t('Chưa lưu thay đổi')}</span>
        <button type="button" className="btn btn-sm max-sm:min-h-[44px]" onClick={() => setHoiBo(false)}>{t('Ở lại')}</button>
        <button type="button" className="btn btn-sm max-sm:min-h-[44px]" onClick={dong}>{t('Bỏ thay đổi')}</button>
      </>) : (<>
        <span className="flex-1" />
        <button type="button" className="btn btn-sm max-sm:min-h-[44px]" disabled={busy} onClick={ngoai}>{daDoi ? t('Huỷ thay đổi') : t('Đóng')}</button>
        <button type="button" className="btn btn-sm btn-primary max-sm:min-h-[44px]" disabled={busy} onClick={luu}>{busy ? t('Đang lưu…') : t('Lưu')}</button>
      </>)}
    </div>
  );
  const than = (<>
    {children}
    {loi && <p className="m-0 text-sm text-late" role="alert">{loi}</p>}
  </>);
  return (
    <>
      <button ref={o} type="button" aria-haspopup="dialog" aria-expanded={mo} aria-label={`${nhan} · ${ten}`} title={nhan}
        onClick={() => { if (!mo) { onMo(); setMo(true); } }}
        className="group -mx-1.5 inline-flex max-w-full flex-wrap items-center gap-1 rounded-md border border-transparent bg-transparent px-1.5 py-1 text-left hover:border-[color:var(--line-strong)] focus-visible:border-[color:var(--accent)] max-sm:min-h-[44px] max-sm:border-[color:var(--line)] cursor-pointer"
        style={mo ? { borderColor: 'var(--accent)' } : undefined}>
        {mat}
        <span aria-hidden className="text-xs text-slate-500 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 max-sm:opacity-100">✎</span>
      </button>
      {mo && (dienThoai ? (
        <KhungPanel tieuDe={tieuDe} hocVien={ten} onDong={ngoai}>
          <div className="grid gap-3 pt-3">{than}{chan}</div>
        </KhungPanel>
      ) : (
        <HopNeo neo={o} nhan={`${tieuDe} · ${ten}`} rong={560} onNgoai={ngoai}>
          <div className="flex items-baseline gap-2 text-[15px] font-bold text-slate-100">{tieuDe}<span className="text-[13px] font-normal text-slate-400">{ten}</span></div>
          {than}
          {chan}
        </HopNeo>
      ))}
    </>
  );
}

/** Ô "Vai trò · chi nhánh" của một tài khoản — đổi tại dòng (`PUT /admin/accounts/:id/roles`, luật máy chủ cũ: không tự gỡ / gỡ Quản trị cuối). */
export function OVaiTaiDong({ u, branches, laMinh, mat, onDaLuu }: {
  u: TaiKhoan; branches: Branch[]; laMinh: boolean; mat: ReactNode; onDaLuu: () => void;
}) {
  const toast = useToast();
  const [ds, setDs] = useState<CapVai[]>([]);
  const goc = capTuTaiKhoan(u.roles);
  const loi = loiThieuChiNhanh(ds);
  const moTa = (x: CapVai[]) => x.map((g) => `${dich(roleLabel(g.role))}${g.branches.size ? ` · ${[...g.branches].join(', ')}` : ''}`).join('; ') || t('không vai');
  return (
    <SuaTaiDong nhan={t('Đổi vai trò · chi nhánh')} tieuDe={t('Vai trò · chi nhánh')} ten={u.fullName} mat={mat}
      daDoi={khoaVai(ds) !== khoaVai(goc)} loiTruoc={loi.length > 0}
      onMo={() => setDs(capTuTaiKhoan(u.roles))}
      onLuu={async () => {
        await api.put(`/admin/accounts/${u.id}/roles`, { roles: payloadVai(ds) });
        onDaLuu();
        toast.hoanTac(t('Đã đổi vai {ten}: {vai}', { ten: u.fullName, vai: moTa(ds) }), () => {
          api.put(`/admin/accounts/${u.id}/roles`, { roles: payloadVai(goc) })
            .then(() => { onDaLuu(); toast.push('ok', t('Đã hoàn tác vai {ten}', { ten: u.fullName })); })
            .catch((e: any) => toast.push('error', e?.message ?? t('Không hoàn tác được')));
        }, { key: `vai-${u.id}` });
      }}>
      <SuaVaiChiNhanh value={ds} onChange={setDs} branches={branches} qtCuaMinh={laMinh}
        loiHang={(i) => loi.find((x) => x.i === i)?.lyDo} />
      <button type="button" className="btn btn-sm justify-self-start max-sm:min-h-[44px]"
        onClick={() => setDs([...ds, { role: 'teacher', branches: new Set() }])}>{t('+ Thêm vai trò')}</button>
    </SuaTaiDong>
  );
}

/** Ô "Kỹ năng" của một tài khoản — bật / tắt L R W1 W2 S tại dòng (`PUT /admin/accounts/:id/skills`). */
export function OKyNangTaiDong({ u, mat, onDaLuu }: { u: TaiKhoan; mat: ReactNode; onDaLuu: () => void }) {
  const toast = useToast();
  const [chon, setChon] = useState<Set<string>>(new Set());
  const khoa = (x: Iterable<string>) => [...x].sort().join();
  const doi = (k: string) => setChon((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  return (
    <SuaTaiDong nhan={t('Đổi kỹ năng phụ trách')} tieuDe={t('Kỹ năng phụ trách được')} ten={u.fullName} mat={mat}
      daDoi={khoa(chon) !== khoa(u.skills)} loiTruoc={false} onMo={() => setChon(new Set(u.skills))}
      onLuu={async () => {
        const cu = [...u.skills];
        await api.put(`/admin/accounts/${u.id}/skills`, { skills: [...chon] });
        onDaLuu();
        toast.hoanTac(t('Đã đổi kỹ năng {ten}', { ten: u.fullName }), () => {
          api.put(`/admin/accounts/${u.id}/skills`, { skills: cu })
            .then(() => { onDaLuu(); toast.push('ok', t('Đã hoàn tác kỹ năng {ten}', { ten: u.fullName })); })
            .catch((e: any) => toast.push('error', e?.message ?? t('Không hoàn tác được')));
        }, { key: `ky-nang-${u.id}` });
      }}>
      <ChonKyNang value={chon} onToggle={doi} />
    </SuaTaiDong>
  );
}
