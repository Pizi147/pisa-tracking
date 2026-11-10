import { Fragment, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { BoLocDoan, Card, ChonDangNut, ErrorState, Field, Forbidden, Info, NutChon, Skeleton, Th} from '../../ui/ui.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { IconGap } from '../../ui/BieuTuong.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { fmtDate, skillLabel, skillShort } from '../../lib/format.ts';
import { CHIP_VUONG, ChipKy } from '../../ui/Nhan.tsx';
import { ChonKyNang } from './ProfilePage.tsx';
import { useSession } from '../../lib/session.tsx';
import {
  BO_LOC_TAI_KHOAN_TRONG, KY_NANG_TAI_KHOAN, PERMISSION_LABEL, PHAN_LOAI_TAI_KHOAN, ROLES, ROLE_LABEL, coQuyenCapRieng, docBoLocTaiKhoan, dsLoi, duocCapRieng,
  ghiBoLocTaiKhoan, locTaiKhoan, ngay, nhomTaiKhoan, phanLoaiTaiKhoan, roleLabel, type BoLocTaiKhoan, type LoiTruong, type Role,
} from '@shared/domain/index.ts';
import { HangNhom } from '../../ui/HangNhom.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { XoaTaiKhoanPanel } from './XoaTaiKhoanPanel.tsx';
import { OKyNangTaiDong, OVaiTaiDong } from './SuaTaiDong.tsx';
import { SuaVaiChiNhanh, capTuTaiKhoan, khoaVai, loiThieuChiNhanh, payloadVai, type CapVai } from './SuaVaiChiNhanh.tsx';
import { CapQuyenRieng, khoaTapQuyen, quyenThieuPhamVi, type QuyenRieng } from './CapQuyenRieng.tsx';
import { dich, t } from '@shared/i18n/index.ts';

type Branch = { id: number; code: string; name: string };
type RoleGrant = { role: string; roleName: string; branchCode: string | null; branchName: string | null };
type Account = {
  id: number; code: string; fullName: string; email: string | null; phone: string | null;
  title: string | null; status: string; approvalState: string; hasPassword: boolean;
  /** PR-XOA: tài khoản xoá mềm (`status = 'deleted'`). */
  deletedAt: string | null;
  /** OV-11b (QT-4): `approvalState = 'declined'` — lý do + chi nhánh tự khai (hộp Duyệt lại). */
  declineReason: string | null; requestedBranches: string[]; requestedRole: string | null;
  roles: RoleGrant[]; skills: string[]; extraEmails: string[];
  /** OV-14c: được tính là GV Speaking chấm chéo (`laGvSpeaking` máy chủ). */
  chamSpeaking?: boolean;
  extra: { permission: string; name: string; branchCode: string | null }[];
};
type Pending = {
  id: number; code: string; fullName: string; email: string; phone: string | null;
  branches: string[]; note: string | null; createdAt: string; skills: string[];
  /** OV-13e: vai người đăng ký đề nghị — hộp duyệt chọn sẵn, Quản trị đổi được. */
  requestedRole: string | null;
};

/**
 * TÀI KHOẢN — hàng đợi duyệt, danh sách tài khoản, vai trò và quyền cấp riêng (mục 7.1, 7.3).
 *
 * HÀNG ĐỢI ĐỨNG TRƯỚC danh sách: một người đang chờ được vào làm việc là thứ có hạn, còn
 * danh sách tài khoản thì lúc nào mở ra cũng đọc được. Đặt hàng đợi dưới cùng nghĩa là ngày
 * nào cũng phải cuộn qua hai mươi dòng mới biết có ai đang chờ hay không.
 */
export function AccountsAdmin() {
  const toast = useToast();
  const branches = useApi<Branch[]>('/ref/branches');
  const accounts = useApi<{ rows: Account[]; pending: Pending[] }>('/admin/accounts');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  /** PR-XOA: nút lọc trên bảng — mặc định "Đang dùng"; "Đã xoá" là tài khoản xoá mềm (còn dấu vết). */
  const [loc, setLoc] = useState<'dang-dung' | 'da-xoa'>('dang-dung');
  const [xoaId, setXoaId] = useState<number | null>(null);
  const [suaTt, setSuaTt] = useState<Account | null>(null);
  const [duyetLai, setDuyetLai] = useState<Account | null>(null);
  /* PR-BC L3: bộ lọc nhớ trong URL (gửi link là mở đúng bộ lọc). Hook đặt TRƯỚC mọi `return` sớm (Rules of Hooks). */
  const [params, setParams] = useSearchParams();
  const [dongNhom, setDongNhom] = useState<Set<string>>(new Set());
  /* B14 (mockup audit-ui 08/11): < 640 px — chi nhánh, vai trò, kỹ năng, nhóm gom vào nút "Lọc ▾"; bảng thành thẻ. */
  const dienThoai = useDienThoai();
  const [moLoc, setMoLoc] = useState(false);
  const { session } = useSession();

  if (accounts.loading) return <Card title={t('Tài khoản')}><Skeleton rows={5} /></Card>;
  /*
   * KHÔNG CÓ QUYỀN THÌ NÓI THẲNG, đừng để một khối trống.
   *
   * Máy chủ đã chặn đúng (403), nhưng nếu giao diện chỉ im lặng thì người dùng thấy một trang
   * rỗng và không biết là mình thiếu quyền hay phần mềm hỏng — và trên bảng điều khiển của
   * trình duyệt thì nó hiện thành một lỗi đỏ, đúng thứ làm người ta hết tin vào những lỗi khác.
   */
  /* 6c (lỗi 6): chỉ 403 mới là thiếu quyền — lỗi mạng / máy chủ thì nói thật + Thử lại. */
  if (accounts.error && accounts.error.status !== 403) {
    return <Card title={t('Tài khoản')}><ErrorState message={accounts.error.message} hint={accounts.error.hint} status={accounts.error.status} onRetry={accounts.reload} /></Card>;
  }
  if (accounts.error) {
    return (
      <Forbidden
        message={t('Phần này chỉ dành cho Quản trị hệ thống.')}
        hint={t('Tài khoản của bạn không có quyền quản trị phần mềm.')}
      />
    );
  }
  const tatCa = accounts.data?.rows ?? [];
  const dangDung = tatCa.filter((u) => u.status !== 'deleted');
  const daXoa = tatCa.filter((u) => u.status === 'deleted');
  const goc = loc === 'da-xoa' ? daXoa : dangDung;
  const locUrl = docBoLocTaiKhoan(params);
  /* Mã chi nhánh lạ trong URL → Tất cả (select không có lựa chọn đó thì bảng rỗng mà không thấy đang lọc gì). */
  const loc3 = locUrl.chiNhanh === 'tat-ca' || locUrl.chiNhanh === 'toan-he-thong' || !branches.data
    || branches.data.some((b) => b.code === locUrl.chiNhanh) ? locUrl : { ...locUrl, chiNhanh: 'tat-ca' };
  const nhomParam = params.get('nhom');
  const nhomTheo = nhomParam === 'chi-nhanh' || nhomParam === 'vai' ? nhomParam : null;
  const rows = locTaiKhoan(goc, loc3);
  const dangLoc = (Object.keys(BO_LOC_TAI_KHOAN_TRONG) as (keyof BoLocTaiKhoan)[]).some((k) => loc3[k] !== BO_LOC_TAI_KHOAN_TRONG[k]);
  const phanLoai = phanLoaiTaiKhoan(goc);
  /* J10: theo tập gốc, không theo tập đã lọc — cột không nhảy khi gõ tìm. */
  const hienQuyenRieng = coQuyenCapRieng(goc);
  const soCot = hienQuyenRieng ? 6 : 5;
  const datParams = (moi: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(moi)) { if (v) next.set(k, v); else next.delete(k); }
    setParams(next, { replace: true });
  };
  const datLoc = (moi: Partial<BoLocTaiKhoan>) => datParams(ghiBoLocTaiKhoan({ ...loc3, ...moi }));
  const xoaLoc = () => datParams(ghiBoLocTaiKhoan(BO_LOC_TAI_KHOAN_TRONG));
  const nhom = nhomTheo ? nhomTaiKhoan(rows, nhomTheo, new Map((branches.data ?? []).map((b) => [b.code, b.name])), (r) => dich(roleLabel(r)), loc3) : null;
  const hang = (u: Account, key: string | number) => (
    <HangTaiKhoan key={key} u={u} hienQuyenRieng={hienQuyenRieng} tai={taiDong} onSua={() => setEditing(u)} onSuaTt={() => setSuaTt(u)} onXoa={() => setXoaId(u.id)} onKhoiPhuc={() => void khoiPhuc(u)}
      onDuyetLai={() => setDuyetLai(u)} />
  );
  const pending = accounts.data?.pending ?? [];
  const reload = () => { accounts.reload(); invalidate('/demo/accounts'); };
  /* QTV2-TK: sửa vai / kỹ năng tại dòng — dữ liệu chung cho mọi hàng. */
  const taiDong: TaiDong = { branches: branches.data ?? [], toiId: session?.user?.id ?? null, onDaLuu: reload };
  /* RKC-6: Khôi phục tài khoản xoá mềm — một bấm; máy chủ trả câu nhắc (email trùng, đặt lại mật khẩu, phân công lại). Lỡ tay thì Xoá lại. */
  const khoiPhuc = async (u: Account) => {
    try {
      const r = await api.post<{ canhBao: string[] }>(`/admin/accounts/${u.id}/khoi-phuc`);
      reload();
      toast.push('ok', [t('Đã khôi phục tài khoản {ten}', { ten: u.fullName.replace(/ \(đã xoá\)$/, '') }), ...(r?.canhBao ?? []).map((x) => dich(x))].join(' · '));
    } catch (e: any) { toast.push('error', e?.message ?? t('Không lưu được')); }
  };

  const nutTao = (
    <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" aria-label={dienThoai ? t('+ Tạo tài khoản') : undefined} onClick={() => setCreating(true)}>
      {dienThoai ? t('+ Tạo') : t('+ Tạo tài khoản')}</button>
  );
  const doanDangDung = (
    <BoLocDoan ariaLabel={t('Lọc tài khoản')} value={loc} onChange={setLoc}
      muc={[{ key: 'dang-dung', nhan: t('Đang dùng'), so: dangDung.length }, { key: 'da-xoa', nhan: t('Đã xoá'), so: daXoa.length }]} />
  );
  const oTim = (
    <input className="field w-full min-w-0 sm:w-56" type="search" placeholder={t('Tên, mã hoặc email')} aria-label={t('Tìm tài khoản')}
      value={loc3.q} maxLength={100} onChange={(e) => datLoc({ q: e.target.value })} />
  );
  /* B14 / QT6: ô chọn dáng chung của web (`ChonDangNut`, như "Mọi hạn ▾") thay `select` gốc của trình duyệt. */
  const chonCn = (
    <ChonDangNut aria-label={t('Chi nhánh')} value={loc3.chiNhanh} onChange={(e) => datLoc({ chiNhanh: e.target.value })}>
      <option value="tat-ca">{t('Chi nhánh: Tất cả')}</option>
      {(branches.data ?? []).map((b) => <option key={b.id} value={b.code}>{b.name}</option>)}
      <option value="toan-he-thong">{t('Toàn hệ thống')}</option>
    </ChonDangNut>
  );
  const chonVai = (
    <ChonDangNut aria-label={t('Vai trò')} value={loc3.vai} onChange={(e) => datLoc({ vai: e.target.value })}>
      <option value="tat-ca">{t('Vai trò: Tất cả')}</option>
      {ROLES.map((r) => <option key={r} value={r}>{dich(roleLabel(r))}</option>)}
    </ChonDangNut>
  );
  /* OV-11b (QT-9): 375 — nhãn lên trên, nút đoạn đủ một hàng (không cắt "S"). */
  const chonKyNang = (
    <span className="flex min-w-0 max-w-full items-center gap-1.5 max-sm:w-full max-sm:flex-col max-sm:items-start">
      <span className="shrink-0 whitespace-nowrap text-xs text-slate-400">{t('Kỹ năng')}</span>
      <BoLocDoan ariaLabel={t('Lọc kỹ năng')} value={loc3.kyNang} onChange={(k) => datLoc({ kyNang: k })}
        muc={[{ key: 'tat-ca', nhan: t('Tất cả') }, ...KY_NANG_TAI_KHOAN.map((k) => ({ key: k, nhan: k, title: skillLabel(k) }))]} />
    </span>
  );
  const chonNhom = (
    <ChonDangNut aria-label={t('Nhóm theo')} value={nhomTheo ?? ''} onChange={(e) => datParams({ nhom: e.target.value || null })}>
      <option value="">{t('Không nhóm')}</option>
      <option value="chi-nhanh">{t('Nhóm theo chi nhánh')}</option>
      <option value="vai">{t('Nhóm theo vai trò')}</option>
    </ChonDangNut>
  );
  /* Số bộ lọc trong tấm "Lọc" đang khác mặc định — hiện trên nút để thấy đang lọc khi tấm đóng. */
  const soLocTam = [loc3.chiNhanh !== 'tat-ca', loc3.vai !== 'tat-ca', loc3.kyNang !== 'tat-ca', !!nhomTheo].filter(Boolean).length;
  const moDongNhom = (k: string) => setDongNhom((s0) => { const n = new Set(s0); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const theTk = (u: Account, key: string | number) => (
    <TheTaiKhoan key={key} u={u} tai={taiDong} onSua={() => setEditing(u)} onSuaTt={() => setSuaTt(u)} onXoa={() => setXoaId(u.id)} onKhoiPhuc={() => void khoiPhuc(u)}
      onDuyetLai={() => setDuyetLai(u)} />
  );

  return (
    <div className="space-y-4">
      {/* PR-DUYET (K1-52, K5-63): duyệt tài khoản ở đây, ngoài hộp Chờ duyệt — việc của Quản trị. AUDIT-UI QT2: rỗng thì một dòng, không chiếm cả thẻ. */}
      {pending.length === 0 ? (
        <p data-hd="qt-dang-ky" className="m-0 text-sm text-faint">{t('Đăng ký chờ duyệt')} <span className="tabular-nums">0</span></p>
      ) : (
        <Card title={<span data-hd="qt-dang-ky">{t('Đăng ký chờ duyệt')} <span className={`${CHIP_VUONG} ml-1 text-amber-200`} style={{ borderColor: 'var(--line-strong)' }}>{pending.length}</span></span>}
          bodyClass="p-0">
          <ul className="divide-y list-none p-0 m-0" style={{ borderColor: 'var(--line)' }}>
            {pending.map((u) => (
              <PendingRow key={u.id} user={u} branches={branches.data ?? []}
                onDone={(msg) => { reload(); toast.push('ok', msg); }} />
            ))}
          </ul>
        </Card>
      )}

      {dienThoai && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">{doanDangDung}<span className="ml-auto">{nutTao}</span></div>
          <div className="flex items-center gap-2">
            {oTim}
            <button type="button" className="btn min-h-[44px] shrink-0 gap-1.5" aria-expanded={moLoc} aria-controls="qt-tam-loc" onClick={() => setMoLoc(!moLoc)}
              style={soLocTam ? { borderColor: 'var(--accent)', boxShadow: 'inset 0 0 0 1px var(--accent)' } : undefined}>
              {t('Lọc')}{soLocTam ? <span className="tabular-nums text-slate-400">{soLocTam}</span> : null} <IconGap mo={moLoc} />
            </button>
          </div>
          {moLoc && (
            <div id="qt-tam-loc" role="group" aria-label={t('Lọc')} className="card grid gap-3 p-3">
              {chonCn}{chonVai}{chonKyNang}{chonNhom}
            </div>
          )}
        </div>
      )}
      <Card title={dienThoai ? undefined : <>{t('Tài khoản')} <span className={`${CHIP_VUONG} ml-1`} style={{ borderColor: 'var(--line-strong)' }}>{dangLoc ? `${rows.length} / ${goc.length}` : rows.length}</span></>} bodyClass="p-0"
        action={dienThoai ? undefined : <span className="flex flex-wrap items-center gap-1.5">{doanDangDung}{nutTao}</span>}>
        {/* PR-BC L3: hàng lọc ngay dưới tiêu đề Card, trên bảng (≥ 640 px; điện thoại: hàng tìm + "Lọc" ở trên). */}
        {!dienThoai && (
          <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
            {oTim}{chonCn}{chonVai}{chonKyNang}{chonNhom}
          </div>
        )}
        {/* AUDIT-UI C2: chip đếm 0 không lọc được gì → ẩn (đang chọn thì vẫn hiện để bỏ chọn); không còn gì thì bỏ cả hàng. */}
        {(dangLoc || PHAN_LOAI_TAI_KHOAN.some((k) => phanLoai[k])) && <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2" style={{ borderColor: 'var(--line)' }}>
          {/* Điện thoại không có tiêu đề thẻ "Tài khoản n / m" — số khớp hiện ở đây khi đang lọc. */}
          {dienThoai && dangLoc && <span className="text-[13px] tabular-nums text-slate-400">{t('{n} / {m} tài khoản', { n: rows.length, m: goc.length })}</span>}
          {PHAN_LOAI_TAI_KHOAN.filter((k) => phanLoai[k] || loc3.phanLoai === k).map((k) => (
            <NutChon key={k} nho chon={loc3.phanLoai === k} onClick={() => datLoc({ phanLoai: loc3.phanLoai === k ? null : k })}>
              {NHAN_PHAN_LOAI[k]} <span className="tabular-nums text-slate-400">{phanLoai[k]}</span>
            </NutChon>
          ))}
          {dangLoc && <button type="button" className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0 sm:ml-auto" onClick={xoaLoc}>{t('Xoá lọc')}</button>}
        </div>}
        {dienThoai ? (
          rows.length === 0 ? (
            <p className="m-0 flex flex-wrap items-center gap-2 px-4 py-4 text-sm text-slate-400">
              {dangLoc ? <>{t('Không có tài khoản nào khớp.')}<button type="button" className="btn btn-sm min-h-[44px]" onClick={xoaLoc}>{t('Xoá lọc')}</button></>
                : loc === 'da-xoa' ? t('Chưa xoá tài khoản nào.') : t('Chưa có tài khoản.')}
            </p>
          ) : nhom ? nhom.map((g) => (
            <Fragment key={g.key}>
              <button type="button" aria-expanded={!dongNhom.has(g.key)} onClick={() => moDongNhom(g.key)}
                className="flex min-h-[44px] w-full appearance-none items-center gap-2 border-0 border-t bg-[color:var(--surface-2)] px-4 text-left text-sm font-semibold text-slate-100 first:border-t-0"
                style={{ borderColor: 'var(--line)' }}>
                <IconGap mo={!dongNhom.has(g.key)} />{g.nhan} <span className="font-normal tabular-nums text-slate-400">· {t('{n} người', { n: g.rows.length })}</span>
              </button>
              {!dongNhom.has(g.key) && g.rows.map((u) => theTk(u, `${g.key}-${u.id}`))}
            </Fragment>
          )) : rows.map((u) => theTk(u, u.id))
        ) : <div className="table-scroll bang-dinh">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <Th className="sticky-col" hint={t('Tên hiện ở mọi nơi trong hệ thống. Chính người đó sửa được ở Hồ sơ cá nhân.')}>{t('Họ tên')}</Th>
                <Th hint={t('Địa chỉ dùng để đăng nhập. Quản trị đổi được ở ⋯ › Sửa thông tin.')}>{t('Email đăng nhập')}</Th>
                <Th hint={t('Một người mang được nhiều vai ở nhiều chi nhánh. Quyền = vai × chi nhánh của chính lần cấp đó.')}>{t('Vai trò · chi nhánh')}</Th>
                {/* J10: không ai có quyền cấp riêng thì ẩn cả cột (form Sửa vẫn cấp được). */}
                {hienQuyenRieng && <Th hint={t('Quyền cấp thêm cho riêng người này, CỘNG vào quyền của vai chứ không thay thế.')}>{t('Quyền cấp riêng')}</Th>}
                <Th hint={t('Kỹ năng người này phụ trách được — dùng để gợi ý khi phân công, không tự cho quyền nhập điểm.')}>{t('Kỹ năng')}</Th>
                <th className="th" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                dangLoc ? (
                  <tr><td className="td text-sm text-slate-400" colSpan={soCot}>
                    {t('Không có tài khoản nào khớp.')}{' '}
                    <button type="button" className="btn btn-sm ml-1 min-h-[44px] sm:min-h-0" onClick={xoaLoc}>{t('Xoá lọc')}</button>
                  </td></tr>
                ) : (
                  <tr><td className="td text-sm text-slate-500" colSpan={soCot}>{loc === 'da-xoa' ? t('Chưa xoá tài khoản nào.') : t('Chưa có tài khoản.')}</td></tr>
                )
              )}
              {nhom ? nhom.map((g) => (
                <Fragment key={g.key}>
                  <HangNhom mo={!dongNhom.has(g.key)} nhan={g.nhan} soCotDau={soCot}
                    onMo={() => moDongNhom(g.key)}
                    tieuDe={<span className="text-sm font-semibold text-slate-100">{g.nhan} <span className="font-normal tabular-nums text-slate-400">· {t('{n} người', { n: g.rows.length })}</span></span>} />
                  {!dongNhom.has(g.key) && g.rows.map((u) => hang(u, `${g.key}-${u.id}`))}
                </Fragment>
              )) : rows.map((u) => hang(u, u.id))}
            </tbody>
          </table>
        </div>}
      </Card>

      {creating && (
        <AccountDialog branches={branches.data ?? []} onClose={() => setCreating(false)}
          onDone={() => { setCreating(false); reload(); }} />
      )}
      {editing && (
        <AccountDialog account={editing} branches={branches.data ?? []} onClose={() => setEditing(null)}
          onDone={() => { setEditing(null); reload(); }} />
      )}
      {suaTt && (
        <SuaThongTinPanel account={suaTt} onClose={() => setSuaTt(null)} onDone={() => { setSuaTt(null); reload(); }} />
      )}
      {duyetLai && (
        <KhungPanel tieuDe={t('Duyệt lại')} hocVien={duyetLai.fullName} onDong={() => setDuyetLai(null)}>
          <ul className="m-0 list-none p-0 pt-1">
            <PendingRow duyetLai branches={branches.data ?? []}
              user={{ id: duyetLai.id, code: duyetLai.code, fullName: duyetLai.fullName, email: duyetLai.email ?? '', phone: duyetLai.phone,
                branches: duyetLai.requestedBranches, note: duyetLai.declineReason ? t('Không duyệt: {lyDo}', { lyDo: duyetLai.declineReason }) : null, createdAt: '', skills: duyetLai.skills,
                requestedRole: duyetLai.requestedRole }}
              onDone={(msg) => { setDuyetLai(null); reload(); toast.push('ok', msg); }} />
          </ul>
        </KhungPanel>
      )}
      {xoaId !== null && (
        <XoaTaiKhoanPanel userId={xoaId} onClose={() => setXoaId(null)} onDone={() => { setXoaId(null); reload(); }} />
      )}
    </div>
  );
}

const NHAN_PHAN_LOAI: Record<(typeof PHAN_LOAI_TAI_KHOAN)[number], string> = {
  'chua-vai': t('Chưa có vai trò'), 'chua-email': t('Chưa có email'), 'chua-ky-nang': t('Chưa có kỹ năng'),
};

/** Một hàng của bảng Tài khoản — tách ra để dùng chung cho bảng phẳng và bảng nhóm (PR-BC L3); markup giữ nguyên. */
type TaiDong = { branches: Branch[]; toiId: number | null; onDaLuu: () => void };

/** QTV2-TK: tài khoản đang dùng, đã duyệt → ô vai / kỹ năng sửa tại dòng; còn lại chỉ hiện. */
const suaDuocTaiDong = (u: Account) => u.status !== 'deleted' && u.approvalState === 'approved';
function OVai({ u, tai, children }: { u: Account; tai: TaiDong; children: ReactNode }) {
  if (!suaDuocTaiDong(u)) return <>{children}</>;
  return <OVaiTaiDong u={u} branches={tai.branches} laMinh={u.id === tai.toiId} mat={children} onDaLuu={tai.onDaLuu} />;
}
function OKyNang({ u, tai, children }: { u: Account; tai: TaiDong; children: ReactNode }) {
  if (!suaDuocTaiDong(u)) return <>{children}</>;
  return <OKyNangTaiDong u={u} mat={children} onDaLuu={tai.onDaLuu} />;
}

function HangTaiKhoan({ u, hienQuyenRieng, tai, onSua, onSuaTt, onXoa, onDuyetLai, onKhoiPhuc }: {
  u: Account; hienQuyenRieng: boolean; tai: TaiDong; onSua: () => void; onSuaTt: () => void; onXoa: () => void; onDuyetLai: () => void;
  /** RKC-6 (PTA 8): tài khoản đã xoá mềm → Khôi phục. */
  onKhoiPhuc?: () => void;
}) {
  const khongDuyet = u.approvalState === 'declined';
  return (
    <tr className={u.status === 'deleted' ? '' : 'row-hover'}>
      <td className="td sticky-col whitespace-nowrap">
        {/* AUDIT-UI C11: tài khoản đã xoá — chữ `text-faint` (không opacity: chữ còn 2,1 : 1 ở chế độ sáng); cột cuối ghi "Đã xoá {ngày}". */}
        <span className={u.status === 'deleted' ? 'text-faint' : 'text-slate-100'}>{u.fullName}</span>
        <span className="block text-[12px] text-slate-500">{u.code}{u.phone ? ` · ${u.phone}` : ''}</span>
      </td>
      <td className="td text-xs text-slate-300">{u.email ?? <span className="text-rose-200">{t('chưa có')}</span>}</td>
      <td className="td">
        <span className="flex flex-wrap gap-1">
          {khongDuyet && <Info pending title={u.declineReason ?? undefined}>{t('Không duyệt')}</Info>}
          <OVai u={u} tai={tai}><ChipVai u={u} khongDuyet={khongDuyet} /></OVai>
        </span>
        {khongDuyet && u.declineReason && <span className="mt-0.5 block text-xs text-slate-400">{u.declineReason}</span>}
      </td>
      {hienQuyenRieng && (
        <td className="td">
          <span className="flex flex-wrap gap-1">
            {u.extra.length === 0 && <span className="text-xs text-slate-500">—</span>}
            {u.extra.map((x, i) => (
              <Info key={i}>{dich(x.name)}{x.branchCode ? ` · ${x.branchCode}` : ` · ${t('toàn hệ thống')}`}</Info>
            ))}
          </span>
        </td>
      )}
      <td className="td text-xs text-slate-400">
        {/* AUDIT-UI QT4: chip ngắn L · R · W1 … (tên đủ ở title) + "Chấm S" cùng hàng — hàng cao đều. */}
        <span className="flex flex-wrap items-center gap-1">
          <OKyNang u={u} tai={tai}>{u.skills.length ? <ChipKyNang skills={u.skills} /> : '—'}</OKyNang>
          {/* OV-14c: ai được tính là GV Speaking chấm chéo (kỹ năng S hoặc dạy S lớp FT, có vai GV) — vì sao một GV thấy / không thấy bài S. */}
          {u.chamSpeaking && <Info title={t('Kỹ năng Speaking hoặc dạy Speaking lớp FT — chấm S Mock mọi lớp FT chi nhánh của vai GV')}>{t('Chấm S')}</Info>}
        </span>
      </td>
      <td className="td whitespace-nowrap"><NutTaiKhoan u={u} onSua={onSua} onSuaTt={onSuaTt} onXoa={onXoa} onDuyetLai={onDuyetLai} onKhoiPhuc={onKhoiPhuc} /></td>
    </tr>
  );
}

/** Chip vai · chi nhánh — chung cho hàng bảng và thẻ 375. */
function ChipVai({ u, khongDuyet }: { u: Account; khongDuyet: boolean }) {
  if (u.roles.length === 0) return khongDuyet ? null : <span className="text-xs text-slate-500">{t('chưa có vai trò')}</span>;
  return <>{u.roles.map((g, i) => <Info key={i}>{dich(roleLabel(g.role) || g.roleName)} · {g.branchName ?? t('Toàn hệ thống')}</Info>)}</>;
}
const ChipKyNang = ({ skills }: { skills: string[] }) => <>{skills.map((s) => <span key={s} title={skillLabel(s)}><ChipKy k={skillShort(s)} /></span>)}</>;

type ThaoTacTk = { u: Account; onSua: () => void; onSuaTt: () => void; onXoa: () => void; onDuyetLai: () => void; onKhoiPhuc?: () => void };

/** Thao tác của một tài khoản — chung cho hàng bảng (≥ 640) và thẻ (375): Sửa / Duyệt lại · ⋯ (Sửa thông tin, Xoá) · đã xoá: Khôi phục. */
function NutTaiKhoan({ u, onSua, onSuaTt, onXoa, onDuyetLai, onKhoiPhuc }: ThaoTacTk) {
  const khongDuyet = u.approvalState === 'declined';
  return (
    <>
      {u.status === 'deleted' ? (
        <span className="inline-flex items-center gap-1.5">
          <span className="text-xs text-slate-500">{t('Đã xoá {ngay}', { ngay: ngay(u.deletedAt) })}</span>
          {onKhoiPhuc && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={onKhoiPhuc}>{t('Khôi phục')}</button>}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5">
          {khongDuyet
            ? <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={onDuyetLai}>{t('Duyệt lại')}</button>
            : <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={onSua}>{t('Sửa')}</button>}
          <MenuDong nhan={t('Thao tác khác')} muc={[
            { key: 'sua-tt', nhan: t('Sửa thông tin'), onChon: onSuaTt },
            { key: 'xoa', nhan: t('Xoá tài khoản'), nguyHiem: true, keTruoc: true, onChon: onXoa },
          ]} />
        </span>
      )}
    </>
  );
}

/**
 * B14 (mockup audit-ui 08/11 khung 375): một tài khoản một thẻ — tên · mã · Sửa · ⋯ / email / vai · chi nhánh, kỹ năng, Chấm S, quyền cấp riêng.
 * Cùng dữ liệu, cùng thao tác với hàng bảng (`NutTaiKhoan`).
 */
function TheTaiKhoan(p: ThaoTacTk & { tai: TaiDong }) {
  const { u, tai } = p;
  const khongDuyet = u.approvalState === 'declined';
  return (
    <div className="grid gap-1.5 border-t px-4 py-3 first:border-t-0" style={{ borderColor: 'var(--line)' }}>
      <div className="flex items-center gap-2">
        <span className="min-w-0">
          <span className={`text-[15px] font-semibold ${u.status === 'deleted' ? 'text-faint' : 'text-slate-100'}`}>{u.fullName}</span>{' '}
          <span className="whitespace-nowrap text-xs tabular-nums text-slate-500">{u.code}{u.phone ? ` · ${u.phone}` : ''}</span>
        </span>
        <span className="ml-auto inline-flex shrink-0 items-center gap-1.5"><NutTaiKhoan {...p} /></span>
      </div>
      <div className="truncate text-[13px] text-slate-400" title={u.email ?? undefined}>{u.email ?? <span className="text-rose-200">{t('chưa có email')}</span>}</div>
      <div className="flex flex-wrap items-center gap-1">
        {khongDuyet && <Info pending title={u.declineReason ?? undefined}>{t('Không duyệt')}</Info>}
        <OVai u={u} tai={tai}><ChipVai u={u} khongDuyet={khongDuyet} /></OVai>
        <OKyNang u={u} tai={tai}>{u.skills.length ? <ChipKyNang skills={u.skills} /> : <span className="text-xs text-slate-500">{t('chưa có kỹ năng')}</span>}</OKyNang>
        {u.chamSpeaking && <Info title={t('Kỹ năng Speaking hoặc dạy Speaking lớp FT — chấm S Mock mọi lớp FT chi nhánh của vai GV')}>{t('Chấm S')}</Info>}
        {u.extra.map((x, i) => <Info key={`q${i}`}>{dich(x.name)}{x.branchCode ? ` · ${x.branchCode}` : ` · ${t('toàn hệ thống')}`}</Info>)}
      </div>
      {khongDuyet && u.declineReason && <span className="text-xs text-slate-400">{u.declineReason}</span>}
    </div>
  );
}

/**
 * Một đăng ký đang chờ. Người duyệt SỬA ĐƯỢC chi nhánh trước khi bấm duyệt (mục 7.1).
 * OV-11b: `duyetLai` = cùng hộp cho tài khoản đã "Không duyệt" (QT-4) — không có nút Không duyệt. CX duyệt được không chọn chi nhánh (= toàn hệ thống).
 */
function PendingRow({ user, branches, onDone, duyetLai }: {
  user: Pending; branches: Branch[]; onDone: (msg: string) => void; duyetLai?: boolean;
}) {
  const toast = useToast();
  const [picked, setPicked] = useState<Set<string>>(new Set(user.branches));
  const [role, setRole] = useState(user.requestedRole ?? 'teacher');
  const [busy, setBusy] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState('');

  const act = async (fn: () => Promise<unknown>, msg: string) => {
    setBusy(true);
    try { await fn(); onDone(msg); } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };
  const cnChon = branches.filter((b) => picked.has(b.code)).map((b) => b.name).join(', ') || t('Toàn hệ thống');

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm text-slate-100">{user.fullName}</div>
          <div className="text-xs text-slate-500">
            {user.email}{user.phone ? ` · ${user.phone}` : ''}{user.createdAt ? ` · ${t('đăng ký {ngay}', { ngay: fmtDate(user.createdAt) })}` : ''}
          </div>
          {user.note && <div className="text-xs text-slate-400 mt-1">“{user.note}”</div>}
          {user.skills.length > 0 && (
            <div className="text-xs text-slate-500 mt-1">
              {t('Kỹ năng phụ trách được: {ds}', { ds: user.skills.map(skillLabel).join(', ') })}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="field w-36" aria-label={t('Vai trò')} value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.filter((r) => r !== 'system_admin').map((r) => (
              <option key={r} value={r}>{dich(ROLE_LABEL[r as Role])}</option>
            ))}
          </select>
          <button className="btn btn-sm btn-primary" disabled={busy || (picked.size === 0 && role !== 'cx' && role !== 'head_tutor')}
            onClick={() => act(() => api.post(`/admin/accounts/${user.id}/approve`, { role, branches: [...picked] }),
              t('Đã duyệt {ten} · {vai} · {cn}', { ten: user.fullName, vai: roleLabel(role), cn: cnChon }))}>
            {t('Duyệt')}
          </button>
          {!duyetLai && <button className="btn btn-sm" disabled={busy} onClick={() => setDeclining((v) => !v)}>{t('Không duyệt')}</button>}
        </div>
      </div>

      <div className="mt-2">
        <span className="text-xs text-slate-500 mr-2">{t('Chi nhánh (người đăng ký tự khai, sửa được):')}</span>
        <span className="inline-flex flex-wrap gap-1 align-middle">
          {branches.map((b) => (
            <NutChon key={b.code} nho chon={picked.has(b.code)}
              onClick={() => setPicked((s) => {
                const next = new Set(s);
                if (next.has(b.code)) next.delete(b.code); else next.add(b.code);
                return next;
              })}>
              {b.code}
            </NutChon>
          ))}
        </span>
      </div>

      {declining && (
        <div className="mt-2 flex flex-wrap gap-2 items-end">
          <label className="block flex-1 min-w-[16rem]">
            <span className="label">{t('Lý do không duyệt — người đăng ký sẽ đọc câu này')}</span>
            <input className="field w-full" value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
          <button className="btn btn-sm" disabled={busy || !reason.trim()}
            onClick={() => act(() => api.post(`/admin/accounts/${user.id}/decline`, { reason }), t('Đã từ chối {ten}', { ten: user.fullName }))}>
            {t('Gửi từ chối')}
          </button>
        </div>
      )}
    </li>
  );
}

/** Tạo tài khoản mới, hoặc sửa vai trò / quyền riêng / mật khẩu của một tài khoản đã có. */
function AccountDialog({ account, branches, onClose, onDone }: {
  account?: Account; branches: Branch[]; onClose: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const { session } = useSession();
  const editing = !!account;
  /* OV-11b (QT-2): dòng vai Quản trị của chính mình khoá "Gỡ" + ô chọn vai (máy chủ cũng chặn). */
  const qtCuaMinh = !!account && account.id === session?.user?.id && account.roles.some((g) => g.role === 'system_admin');
  const [form, setForm] = useState({
    fullName: account?.fullName ?? '', email: account?.email ?? '', password: '',
    phone: account?.phone ?? '', title: account?.title ?? '',
  });
  const [grants, setGrants] = useState<CapVai[]>(() => (account ? capTuTaiKhoan(account.roles) : [{ role: 'teacher', branches: new Set<string>() }]));
  /*
   * PR-QU QU-7: quyền cấp riêng theo nhóm. Quyền cũ không còn cấp riêng được (ví dụ `admin.config`) thì không đưa vào form — máy chủ từ chối
   * lưu chúng; lưu lần tới sẽ gỡ, và form nói trước điều đó (`quyenBo`). `chonQuyen` giữ cả quyền đã tick mà chưa chọn phạm vi.
   */
  const [extra, setExtra] = useState<QuyenRieng[]>(
    () => (account?.extra ?? []).filter((x) => duocCapRieng(x.permission)).map((x) => ({ permission: x.permission, branchCode: x.branchCode })),
  );
  const [chonQuyen, setChonQuyen] = useState<ReadonlySet<string>>(() => new Set(extra.map((x) => x.permission)));
  const [lyDoQuyen, setLyDoQuyen] = useState('');
  const quyenBo = (account?.extra ?? []).filter((x) => !duocCapRieng(x.permission));
  const quyenDoi = !!account && khoaTapQuyen(extra) !== khoaTapQuyen(account.extra);
  const thieuPhamVi = quyenThieuPhamVi(chonQuyen, extra);
  const macDinhPhamVi = [...new Set((account?.roles ?? []).map((g) => g.branchCode).filter((b): b is string => !!b))];
  const [newPassword, setNewPassword] = useState('');
  /* K1-51, Q9: Quản trị sửa kỹ năng phụ trách được (5 ô L R W1 W2 S) — lưu qua `PUT /admin/accounts/:id/skills` khi đổi. */
  const [kyNang, setKyNang] = useState<Set<string>>(() => new Set(account?.skills ?? []));
  const doiKyNang = (k: string) => setKyNang((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const kyNangDoi = !!account && [...kyNang].sort().join() !== [...account.skills].sort().join();
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<unknown>, msg: string) => {
    setBusy(true);
    try { await fn(); toast.push('ok', msg); onDone(); }
    catch (e: any) {
      /* OV-11b (QT-10a): trùng email (409) → lỗi dưới ô Email như Sửa thông tin. */
      if (e?.status === 409 && !editing) { setTrung(email); lf.bam(); document.getElementById(lf.oId('email'))?.focus(); }
      else toast.push('error', e.message);
    }
    finally { setBusy(false); }
  };

  const payloadRoles = () => payloadVai(grants);
  /* Chân panel: chưa đổi gì thì "Đóng", đã đổi thì "Huỷ thay đổi" — nói rõ bấm vào là bỏ những gì vừa sửa. */
  const [vaiGoc] = useState(() => khoaVai(grants));
  const daDoi = editing
    ? khoaVai(grants) !== vaiGoc || quyenDoi || !!newPassword || kyNangDoi
    : Object.values(form).some((v) => v.trim()) || kyNang.size > 0;

  /* Báo sớm dưới ô — máy chủ vẫn kiểm đủ (`checkEmail`, `checkPassword`, "Cấp ít nhất một vai trò"). */
  const lf = useLoiForm();
  const email = form.email.trim().toLowerCase();
  const [trung, setTrung] = useState<string | null>(null);
  const loi: LoiTruong[] = [
    ...(!editing ? dsLoi([{ khoa: 'ho-ten', nhan: t('Họ và tên'), toiThieu: 1 }], { 'ho-ten': form.fullName }) : []),
    ...(!editing && !email.endsWith('.pisa@gmail.com') ? [{ khoa: 'email', nhan: t('Email đăng nhập'), lyDo: email ? t('Phải có đuôi .pisa@gmail.com') : t('Chưa điền') }]
      : !editing && trung === email ? [{ khoa: 'email', nhan: t('Email đăng nhập'), lyDo: t('Đã có tài khoản dùng email này') }] : []),
    ...(!editing && form.password.length < 6 ? [{ khoa: 'mat-khau', nhan: t('Mật khẩu ban đầu'), lyDo: t('Cần ít nhất {toiThieu} ký tự (đang có {n})', { toiThieu: 6, n: form.password.length }) }] : []),
    ...(!editing && payloadRoles().length === 0 ? [{ khoa: 'vai-tro', nhan: t('Vai trò'), lyDo: t('Cấp ít nhất một vai trò') }] : []),
    /* OV-11b (QT-1): vai (trừ Quản trị, CX) chưa chọn chi nhánh — máy chủ cũng chặn 400. */
    ...loiThieuChiNhanh(grants).map(({ i, lyDo }) => ({ khoa: `vai-${i}`, nhan: t('Vai trò'), lyDo })),
    ...(editing && newPassword && newPassword.length < 6 ? [{ khoa: 'mat-khau-moi', nhan: t('Đặt lại mật khẩu'), lyDo: t('Cần ít nhất {toiThieu} ký tự (đang có {n})', { toiThieu: 6, n: newPassword.length }) }] : []),
    ...(editing && thieuPhamVi.length ? [{ khoa: 'quyen-rieng', nhan: t('Quyền cấp riêng'), lyDo: t('Chưa chọn phạm vi cho: {ds}', { ds: thieuPhamVi.map((k) => dich(PERMISSION_LABEL[k] ?? k)).join(', ') }) }] : []),
    ...(quyenDoi ? dsLoi([{ khoa: 'ly-do-quyen', nhan: t('Lý do đổi quyền'), toiThieu: 1 }], { 'ly-do-quyen': lyDoQuyen.trim() }) : []),
  ];

  const save = () => {
    lf.bam();
    if (loi.length > 0 || busy) return undefined;
    if (editing) {
      return run(async () => {
        /* OV-11b (QT-3): chỉ gửi khi vai đổi — không "đặt lại vai" + dòng nhật ký giả mỗi lần sửa kỹ năng / mật khẩu. */
        if (khoaVai(grants) !== vaiGoc) await api.put(`/admin/accounts/${account!.id}/roles`, { roles: payloadRoles() });
        /* Chỉ gửi khi tập quyền đổi: mỗi lần gửi là một dòng nhật ký kèm lý do. Lỗi thì giữ nguyên lựa chọn trên form để bấm Lưu lại. */
        if (quyenDoi) await api.put(`/admin/accounts/${account!.id}/permissions`, { items: extra, lyDo: lyDoQuyen.trim() });
        if (newPassword) await api.post(`/admin/accounts/${account!.id}/password`, { password: newPassword });
        if (kyNangDoi) await api.put(`/admin/accounts/${account!.id}/skills`, { skills: [...kyNang] });
      }, t('Đã lưu tài khoản'));
    }
    return run(() => api.post('/admin/accounts', {
      ...form, roles: payloadRoles(), skills: [...kyNang],
    }), t('Đã tạo tài khoản'));
  };

  return (
    <KhungPanel tieuDe={editing ? t('Sửa tài khoản') : t('Tạo tài khoản')} hocVien={editing ? account!.fullName : null} rong="rong" onDong={onClose}
      chan={{
        daSua: daDoi, huy: { onClick: onClose, disabled: busy },
        conThieu: lf.conThieu(loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={save} disabled={busy}>{busy ? t('Đang lưu…') : t('Lưu')}</button>,
      }}>
      <div className="space-y-4 pt-3">
        {!editing && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('Họ và tên')} required loi={lf.loiCua(loi, 'ho-ten')}>
                <input className="field w-full" maxLength={100} {...lf.o(loi, 'ho-ten')} value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </Field>
              {/* SUA-TK-GON (M4): câu không đổi quyết định → `title` ô (Chức danh, Mật khẩu ban đầu); đuôi email giữ — là luật ô. */}
              <Field label={t('Chức danh')}>
                <input className="field w-full" maxLength={100} value={form.title} title={t('Chỉ để hiển thị, không ảnh hưởng quyền.')}
                  onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </Field>
              <Field label={t('Email đăng nhập')} required loi={lf.loiCua(loi, 'email')}>
                <input className="field w-full" type="email" {...lf.o(loi, 'email')} value={form.email} placeholder="ten.pisa@gmail.com"
                  onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>
              <Field label={t('Mật khẩu ban đầu')} required loi={lf.loiCua(loi, 'mat-khau')}>
                <input className="field w-full" {...lf.o(loi, 'mat-khau')} value={form.password} title={t('Người dùng đổi lại ở hồ sơ cá nhân.')}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </Field>
              <Field label={t('Số điện thoại')}>
                <input className="field w-full" maxLength={20} value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>
            </div>
          </>
        )}

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="label m-0">{t('Vai trò và chi nhánh')}</span>
            <button className="btn btn-sm" type="button"
              onClick={() => setGrants([...grants, { role: 'teacher', branches: new Set() }])}>
              {t('+ Thêm vai trò')}
            </button>
          </div>
          <div className="space-y-2" {...lf.o(loi, 'vai-tro')}>
            {lf.loiCua(loi, 'vai-tro') && <p className="m-0 text-xs text-late">{lf.loiCua(loi, 'vai-tro')}</p>}
            <SuaVaiChiNhanh value={grants} onChange={setGrants} branches={branches} qtCuaMinh={qtCuaMinh}
              loiHang={(i) => lf.loiCua(loi, `vai-${i}`)} propsHang={(i) => lf.o(loi, `vai-${i}`)} />
          </div>
        </div>

        {/* SUA-TK-GON (M4): "không phải quyền nhập điểm" vào ⓘ cạnh nhãn — không thêm dòng dưới ô. */}
        <div role="group" aria-label={t('Kỹ năng phụ trách được')}>
          <div className="label flex items-center gap-1.5">{t('Kỹ năng phụ trách được')}
            <NutLuat label={t('Kỹ năng phụ trách được')}>{t('Năng lực để gợi ý khi phân công — không phải quyền nhập điểm.')}</NutLuat>
          </div>
          <ChonKyNang value={kyNang} onToggle={doiKyNang} />
        </div>

        {editing && (
          <>
            {/*
              QUYỀN CẤP RIÊNG CHO CÁ NHÂN (mục 7.3) — ví dụ owner đưa ra là cấp cho một Quản lý
              CN Monbay quyền quan sát toàn hệ thống. Sửa vai "Quản lý" là sửa cho TẤT CẢ Quản
              lý, nên phải có đường cấp riêng cho một người.
            */}
            <div>
              {/* SUA-TK-GON (M5, M8, M4): cùng tên cột bảng "Quyền cấp riêng"; 375 đầu khối một hàng; đoạn giải thích dài dưới khối → ⓘ. */}
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="label m-0 flex items-center gap-1.5">{t('Quyền cấp riêng')}
                  <NutLuat label={t('Quyền cấp riêng')}>
                    {t('Quyền ở đây')} <strong>{t('cộng thêm')}</strong> {t('vào quyền của vai trò, không thay thế. Chọn “Toàn hệ thống” là cho phép người này làm việc đó ở mọi chi nhánh, vượt ra ngoài chi nhánh của họ. Quyền Quản trị và quyền tự có theo chủ nhiệm không cấp riêng nên không có trong danh sách.')}
                  </NutLuat>
                </span>
                <span className="text-xs tabular-nums text-slate-500">{chonQuyen.size ? t('{n} quyền', { n: chonQuyen.size }) : t('Chưa cấp riêng quyền nào')}</span>
              </div>
              <div tabIndex={-1} {...lf.o(loi, 'quyen-rieng')}>
                {lf.loiCua(loi, 'quyen-rieng') && <p className="m-0 mb-1 text-xs text-late">{lf.loiCua(loi, 'quyen-rieng')}</p>}
                <CapQuyenRieng value={extra} chon={chonQuyen} branches={branches} macDinh={macDinhPhamVi} vai={grants.map((g) => g.role).filter(Boolean)}
                  onChange={(v, c) => { setExtra(v); setChonQuyen(c); }} />
              </div>
              {quyenBo.length > 0 && (
                <p className="m-0 mt-1.5 text-xs text-slate-400">
                  {t('Không còn cấp riêng được, lưu lần này sẽ gỡ: {ds}.', { ds: quyenBo.map((x) => dich(x.name)).join(', ') })}
                </p>
              )}
              {quyenDoi && (
                <div className="mt-2">
                  <Field label={t('Lý do đổi quyền')} required loi={lf.loiCua(loi, 'ly-do-quyen')}
                    hint={t('{n}/200 ký tự', { n: lyDoQuyen.length })}>
                    <input className="field w-full" maxLength={200} {...lf.o(loi, 'ly-do-quyen')} value={lyDoQuyen}
                      title={t('Ghi vào nhật ký để sau này tra lại vì sao người này có quyền đó.')}
                      placeholder={t('Ví dụ: Phụ trách nhập bù điểm khi giáo viên nghỉ, học kỳ này')}
                      onChange={(e) => setLyDoQuyen(e.target.value)} />
                  </Field>
                </div>
              )}
            </div>

            {/* SUA-TK-GON (M4): "Bỏ trống nếu không đổi" = chữ mờ trong ô; câu giải thích → `title`. */}
            <Field label={t('Đặt lại mật khẩu')} loi={lf.loiCua(loi, 'mat-khau-moi')}>
              <input className="field w-full" {...lf.o(loi, 'mat-khau-moi')} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('Bỏ trống nếu không đổi')} title={t('Hệ thống chưa có luồng quên mật khẩu — đặt lại mật khẩu ở đây.')} />
            </Field>
          </>
        )}
      </div>
    </KhungPanel>
  );
}

/**
 * Tài khoản › ⋯ › Sửa thông tin (chủ sản phẩm 07/10) — CÙNG các ô của Tạo tài khoản / Hồ sơ cá nhân: họ tên, chức danh, email đăng nhập,
 * điện thoại, email khác. Lưu: `PATCH /admin/accounts/:id` (chỉ Quản trị; máy chủ kiểm lại đủ). Đổi email không đăng xuất người đó.
 */
function SuaThongTinPanel({ account, onClose, onDone }: { account: Account; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [goc] = useState(() => ({
    fullName: account.fullName, title: account.title ?? '', email: account.email ?? '', phone: account.phone ?? '',
    extraEmails: account.extraEmails.join(', '),
  }));
  const [form, setForm] = useState(goc);
  const [busy, setBusy] = useState(false);
  const daDoi = (Object.keys(goc) as (keyof typeof goc)[]).some((k) => form[k] !== goc[k]);
  const lf = useLoiForm();
  const email = form.email.trim().toLowerCase();
  /** Email máy chủ báo trùng (409) — lỗi dưới ô cho tới khi đổi sang email khác. */
  const [trung, setTrung] = useState<string | null>(null);
  const loi: LoiTruong[] = [
    ...dsLoi([{ khoa: 'ho-ten', nhan: t('Họ và tên'), toiThieu: 1 }], { 'ho-ten': form.fullName.trim() }),
    ...(!email.endsWith('.pisa@gmail.com') ? [{ khoa: 'email', nhan: t('Email đăng nhập'), lyDo: email ? t('Phải có đuôi .pisa@gmail.com') : t('Chưa điền') }]
      : trung === email ? [{ khoa: 'email', nhan: t('Email đăng nhập'), lyDo: t('Đã có tài khoản khác dùng') }] : []),
  ];
  const save = async () => {
    lf.bam();
    if (loi.length > 0 || busy) return;
    setBusy(true);
    try {
      await api.patch(`/admin/accounts/${account.id}`, {
        fullName: form.fullName, title: form.title || null, email: form.email, phone: form.phone || null,
        extraEmails: form.extraEmails.split(/[,;\s]+/).map((x) => x.trim()).filter(Boolean),
      });
      toast.push('ok', t('Đã lưu thông tin'));
      onDone();
    } catch (e: any) {
      if (e?.status === 409) { setTrung(email); document.getElementById(lf.oId('email'))?.focus(); }
      else toast.push('error', e.message);
    } finally { setBusy(false); }
  };
  const o = (k: keyof typeof goc) => ({ value: form[k], onChange: (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value }) });

  return (
    <KhungPanel tieuDe={t('Sửa thông tin')} hocVien={account.fullName} onDong={onClose}
      chan={{
        daSua: daDoi, huy: { onClick: onClose, disabled: busy },
        conThieu: lf.conThieu(loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={save} disabled={busy || !daDoi}>{busy ? t('Đang lưu…') : t('Lưu')}</button>,
      }}>
      <div className="grid gap-4 pt-3 sm:grid-cols-2">
        <Field label={t('Họ và tên')} required loi={lf.loiCua(loi, 'ho-ten')}>
          <input className="field w-full" maxLength={100} {...lf.o(loi, 'ho-ten')} {...o('fullName')} />
        </Field>
        <Field label={t('Chức danh')}>
          <input className="field w-full" maxLength={100} {...o('title')} />
        </Field>
        <Field label={t('Email đăng nhập')} required loi={lf.loiCua(loi, 'email')}>
          <input className="field w-full" type="email" {...lf.o(loi, 'email')} {...o('email')} />
        </Field>
        <Field label={t('Số điện thoại')}>
          <input className="field w-full" type="tel" maxLength={20} {...o('phone')} />
        </Field>
        <div className="sm:col-span-2">
          <Field label={t('Email khác')}>
            <input className="field w-full" {...o('extraEmails')} />
          </Field>
        </div>
      </div>
    </KhungPanel>
  );
}
