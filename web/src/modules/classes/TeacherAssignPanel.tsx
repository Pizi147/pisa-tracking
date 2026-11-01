import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { ApiError, api, invalidateGop } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { Empty, Skeleton } from '../../ui/ui.tsx';
import {
  chonKhiDoiTach, doiTheoO, gopChonSau409, kiemPhanCong, laCapBanGiao, moRongPhanCong, nenTachFou, nhomGiaoVienBoMon, slotsTuO, tenMon, tenMonNgan, tuanLich,
  type DoiChoPc, type KetQuaLuuPc,
} from '@shared/domain/index.ts';
import { LuoiPhanCong, NutTachFou, loiTaiO, useTachFou } from './ClassCreatePanel.tsx';
import { DongXem, PhanThongTin } from './ThongTinLopPanel.tsx';
import { TenGiaoVien } from './TenGiaoVien.tsx';
import { HopLuuPhanCong, luuThang, type LopLuuPc } from './HopLuuPhanCong.tsx';
import type { HoSoLop } from './DauTrangLop.tsx';
import { t } from '@shared/i18n/index.ts';

/**
 * PHẦN "PHÂN CÔNG" của panel Thông tin lớp (PR-OV3a; trước là panel "Sửa phân công" — PR-LOP, YC-4, mockup 21 mục 4), mỗi ô MỘT người.
 * Xem: GVCN + GV bộ môn gom theo người (đọc từ hồ sơ lớp, không tải thêm). Sửa: tải `/teachers` khi bấm Sửa.
 *
 * Ô theo chương trình (`oPhanCong`), lỗi luật (`kiemPhanCong`) hiện ngay tại ô và khoá Lưu — cùng hàm máy chủ kiểm; chân
 * `n ô cần sửa ↑` của PR-N1 (`useLoiForm`) tính ngay (mọi lỗi ở đây là lỗi luật), bấm → tới ô lỗi đầu.
 * Dữ liệu cũ có nhiều người một ô (trước luật, Q11): hiện cả tên, bắt chọn lại một người, không tự bỏ ai.
 * Gửi lên NGUYÊN bức tranh đang hiển thị (`{ slots }`), không gửi từng thao tác: hai người sửa cùng lúc thì kết quả vẫn là
 * một trong hai bức tranh.
 */

type Teachers = {
  classId: number; classCode: string; branchCode: string; programmeCode: string | null;
  skills: string[];
  core: { userId: number; name: string; from: string }[];
  bySkill: { skill: string; userId: number; name: string; from: string }[];
  candidates: { id: number; name: string; code: string; title: string | null; classCount: number; inThisClass: boolean; skills?: string[] }[];
  past: { name: string; skill: string | null; isCore: boolean; from: string; to: string | null }[];
  /** PR-QU (A): `canAssignSubject` = GVCN lớp này — đổi được ô GV bộ môn, ô GVCN chỉ đọc. Quản lý có cả hai. */
  viewer: { canAssign: boolean; canAssignSubject?: boolean };
  /** SUA-NO-RA: phiên bản phân công lúc đọc — gửi kèm khi lưu, người khác vừa đổi → 409. */
  phienBan?: string;
};

/** Lịch đổi phân công đang chờ: "{môn} {A} → {B} từ {W1 NOV}" (hàng GV đầu hồ sơ lớp + Thông tin lớp › Phân công); lỗi áp chỉ máy chủ gửi cho QL. */
export type ChoDoiLop = DoiChoPc & { tenCu: string | null; tenMoi: string | null };
export function DongChoDoi({ cho, ct, homNay, className = '' }: { cho: ChoDoiLop[]; ct: string | null; homNay: string | null; className?: string }) {
  if (!cho.length) return null;
  return (
    <ul className={`m-0 list-none p-0 text-[13px] ${className}`} aria-label={t('Chờ đổi')}>
      {cho.map((c) => (
        <li key={c.id}>
          <span className="font-semibold" style={{ color: 'rgb(var(--doing-rgb))' }}>
            {c.khoa === 'gvcn' ? t('GVCN') : tenMonNgan(ct, c.khoa)} {c.tenCu ?? t('Chưa có')} → {c.tenMoi ?? t('Chưa có')} {t('từ {tuan}', { tuan: tuanLich(c.hieuLuc, homNay ?? c.hieuLuc) })}
          </span>
          {c.loi && <span className="ml-2 text-late">⚠ {t('chưa đổi được: {loi}', { loi: c.loi })}</span>}
        </li>
      ))}
    </ul>
  );
}

export function PhanPhanCong({ lop, suaDuoc, moSua = false, onDone }: {
  lop: HoSoLop; suaDuoc: boolean; moSua?: boolean; onDone: () => void;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const [dangSua, setDangSua] = useState(moSua && suaDuoc);
  const { data, loading, error, reload } = useApi<Teachers>(dangSua ? `/classes/${lop.id}/teachers` : null, [dangSua]);
  /** 409 → tải lại bức tranh mới, gộp với lựa chọn đang sửa (`gopChonSau409`): giữ ô đã sửa, ô chưa sửa theo bản mới. */
  const giuChon = useRef(false);
  /** Bức tranh (theo môn, chưa gộp FOU) lúc mở / lần tải gần nhất — gốc để biết ô nào người dùng đã sửa. */
  const banDau = useRef<Record<string, number | ''>>({});
  const [chon, setChon] = useState<Record<string, number | ''>>({});
  /** Ô dữ liệu cũ đang có từ 2 người: khoá ô → tên. */
  const [nhieuNguoi, setNhieuNguoi] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState(false);
  const [loiLuu, setLoiLuu] = useState<string | null>(null);
  const [moDaDay, setMoDaDay] = useState(false);
  /** Hộp Lưu (hiệu lực + bàn giao) đang mở: bức tranh chốt lúc bấm Lưu; hộp neo cạnh panel Thông tin lớp. */
  const [hop, setHop] = useState<{ slots: LopLuuPc['slots']; neo: HTMLElement | null } | null>(null);
  const goc = useRef<HTMLDivElement>(null);
  const lf = useLoiForm();
  const fou = useTachFou(data?.programmeCode ?? null, data?.skills ?? [], chon, setChon);

  // Nạp bức tranh hiện tại một lần khi mở; sửa xong mới gửi lên.
  useEffect(() => {
    if (!data) return;
    const theoO = new Map<string, { userId: number; name: string }[]>();
    for (const [khoa, a] of [...data.core.map((c) => ['gvcn', c] as const), ...data.bySkill.map((c) => [c.skill, c] as const)]) {
      theoO.set(khoa, [...(theoO.get(khoa) ?? []), a]);
    }
    const ds = [...theoO];
    setNhieuNguoi(Object.fromEntries(ds.filter(([, a]) => a.length > 1).map(([k, a]) => [k, a.map((x) => x.name)])));
    const c: Record<string, number | ''> = Object.fromEntries(ds.filter(([, a]) => a.length === 1).map(([k, a]) => [k, a[0].userId]));
    if (giuChon.current) {
      giuChon.current = false;
      const theoLuoi = (x: Record<string, number | ''>) => (fou.gop && !fou.tach ? chonKhiDoiTach(x, fou.gop, false) : x);
      const g = gopChonSau409(theoLuoi(banDau.current), theoLuoi(c), chon);
      banDau.current = c;
      setChon(g.chon);
      if (g.xung.length) {
        const nhan = g.xung.map((k) => fou.oList.find((o) => o.khoa === k)?.nhan ?? k).join(', ');
        setLoiLuu(t('{nhan}: người khác vừa đổi ô này — kiểm lại rồi lưu.', { nhan }));
      }
      return;
    }
    banDau.current = c;
    /* Q31-5: FOU mà L, R, G+V cùng người (hoặc trống) → 2 ô; khác người → mở sẵn tách. */
    const tach = nenTachFou(data.programmeCode, data.bySkill);
    fou.setTach(tach);
    setChon(fou.gop && !tach ? chonKhiDoiTach(c, fou.gop, false) : c);
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const oList = data ? fou.oList : [];
  const slots = slotsTuO(oList, chon);
  const suaMay = !!data && (data.viewer.canAssign || !!data.viewer.canAssignSubject);
  /* GVCN (không phải Quản lý): ô GVCN tách ra hàng chỉ đọc; lưới chỉ còn ô bộ môn. Lớp Pre FOU chỉ có ô GVCN → chỉ xem. */
  const chiBoMon = !!data && !data.viewer.canAssign && !!data.viewer.canAssignSubject;
  const oSua = chiBoMon ? oList.filter((o) => !o.laGvcn) : oList;
  const loiPc = data ? kiemPhanCong(data.programmeCode, data.skills, slots) : [];
  const loiO = (khoa: string) => (nhieuNguoi[khoa] && !chon[khoa]
    ? t('Ô này đang có {n} người — chọn lại một người', { n: nhieuNguoi[khoa].length })
    : loiTaiO(loiPc, oList, khoa));
  const oLoi = oList.filter((o) => loiO(o.khoa));

  /* Người đang được phân công mà không còn trong danh sách ứng viên (khoá tài khoản, đổi chi nhánh) vẫn phải hiện tên. */
  const nguoi = [
    ...(data?.candidates ?? []),
    ...[...(data?.core ?? []), ...(data?.bySkill ?? [])]
      .filter((a, i, all) => !data?.candidates.some((c) => c.id === a.userId) && all.findIndex((x) => x.userId === a.userId) === i)
      .map((a) => ({ id: a.userId, name: a.name, classCount: 0 })),
  ];

  /** Các ô đổi của bức tranh đang sửa so với bức tranh đang chạy — chip Nháp và quyết định mở hộp. */
  const doiNhap = data ? doiTheoO(data.programmeCode, data.skills,
    [...data.core.map((c) => ({ userId: c.userId, skill: null, isCore: true })), ...data.bySkill.map((c) => ({ userId: c.userId, skill: c.skill, isCore: false }))],
    moRongPhanCong(data.programmeCode, data.skills, slots)) : [];
  const tenNguoi = (id: number | null) => (id === null ? t('Chưa có') : nguoi.find((x) => x.id === id)?.name ?? `#${id}`);
  /** Lưu xong (thẳng hoặc qua hộp): toast + Hoàn tác (`lo`), làm tươi hồ sơ lớp / Công việc / góc Phân công GV. */
  const daLuu = (kq: KetQuaLuuPc, viec = 0, nguoiCu: string | null = null) => {
    const text = viec
      ? (nguoiCu ? t('Đã lưu phân công {lop} · tạo {n} việc bàn giao cho {gv}', { lop: lop.code, n: viec, gv: nguoiCu }) : t('Đã lưu phân công {lop} · tạo {n} việc bàn giao', { lop: lop.code, n: viec }))
      : t('Đã lưu phân công {lop}', { lop: lop.code });
    if (kq.lo !== null) {
      toast.hoanTac(text, () => {
        api.post('/phan-cong/hoan-tac', { lo: kq.lo })
          .then(() => { invalidateGop('/classes', '/my-work', '/hoc-vien-lop/phan-cong'); toast.push('ok', t('Đã hoàn tác')); onDone(); })
          .catch((e: any) => toast.push('error', e?.message ?? t('Không hoàn tác được')));
      });
    } else toast.push('ok', text);
    invalidateGop('/classes', '/my-work', '/hoc-vien-lop/phan-cong');
    setHop(null); setDangSua(false);
    onDone();
  };
  /** Lỗi lưu: giữ nguyên lựa chọn đang sửa; 409 → tải bức tranh mới, gộp lại (`gopChonSau409`). */
  const baoLoiLuu = (e: unknown) => {
    const m = e instanceof Error ? e.message : t('Không lưu được');
    setHop(null); setBusy(false); setLoiLuu(m); toast.push('error', m);
    if (e instanceof ApiError && e.status === 409) { giuChon.current = true; reload(); }
  };
  const luu = async () => {
    if (!data || oLoi.length) { lf.bam(); setLoiLuu(oLoi[0] ? `${oLoi[0].nhan}: ${loiO(oLoi[0].khoa)}` : null); return; }
    setLoiLuu(null);
    const doi = doiNhap;
    /* Có cặp A → B: cùng hộp hiệu lực + bàn giao với góc Phân công GV; không cặp (Chưa có → B, bỏ người): lưu thẳng, hôm nay. */
    if (doi.some(laCapBanGiao)) {
      const dialog = goc.current?.closest<HTMLElement>('[role="dialog"]') ?? goc.current;
      setHop({ slots, neo: dialog });
      return;
    }
    setBusy(true);
    try { daLuu(await luuThang([{ classId: lop.id, slots, phienBan: data.phienBan ?? '' }])); } catch (e) { baoLoiLuu(e); } finally { setBusy(false); }
  };
  const gvcn = lop.coreTeachers[0] ?? null;
  const nhom = nhomGiaoVienBoMon(lop.skills.map((x) => x.skill), lop.skillTeachers, lop.programme?.code ?? null);

  return (
    <div ref={goc}>
    <PhanThongTin tieuDe={t('Phân công')} nhanPhu={dangSua && doiNhap.length > 0 ? <span className="pc-nhan-nhap">{t('Nháp · {n} ô đổi', { n: doiNhap.length })}</span> : undefined} suaDuoc={suaDuoc} dangSua={dangSua} busy={busy} nhanLuu={t('Lưu phân công')} loi={loiLuu}
      cuonToi={moSua} onSua={() => setDangSua(true)} onHuy={() => { setDangSua(false); setLoiLuu(null); giuChon.current = false; }} onLuu={luu}>
      {!dangSua && (
        <>
        <DongXem dong={[
          [t('GVCN'), gvcn ? <TenGiaoVien id={gvcn.id} ten={gvcn.name} /> : <span className="text-amber-200">{t('Chưa có GVCN')}</span>],
          ...nhom.map((g): [string, ReactNode] => [g.nhan, g.id !== null ? <TenGiaoVien id={g.id} ten={g.ten} /> : <span className="text-amber-200">{g.ten}</span>]),
        ]} />
        <DongChoDoi cho={lop.phanCongCho ?? []} ct={lop.programme?.code ?? null} homNay={homNay} className="mt-2" />
        </>
      )}
      {dangSua && loading && <Skeleton rows={5} />}
      {dangSua && error && <Empty title={t('Không đọc được phân công')} hint={error.message} />}
      {dangSua && data && (
        <div className="space-y-3">
          {!suaMay && <p className="m-0 text-xs text-slate-400">{t('Chỉ xem: đổi phân công là việc của Quản lý chi nhánh.')}</p>}
          {chiBoMon && (
            <div className="grid grid-cols-[6rem_1fr] items-center gap-x-2.5" id={lf.oId('gvcn')}>
              <span className="text-xs font-bold text-slate-200">{t('GVCN')}</span>
              <span className="text-sm text-slate-300">
                {data.core.map((c) => c.name).join(' · ') || t('Chưa có')}
                <span className="block text-xs text-slate-500">{t('Đổi GVCN: nhờ Quản lý chi nhánh.')}</span>
                {loiO('gvcn') && <span className="block text-xs text-late">{loiO('gvcn')}</span>}
              </span>
            </div>
          )}
          {oSua.length > 0 && (
            <LuoiPhanCong oList={oSua} chon={chon} nguoi={nguoi} loi={loiO} oId={lf.oId} chiXem={!suaMay} chuongTrinh={data.programmeCode}
              nhanTrong={(k) => nhieuNguoi[k]?.join(' · ')}
              onChon={(khoa, v) => setChon((c) => ({ ...c, [khoa]: v }))} />
          )}
          <NutTachFou fou={fou} chiXem={!suaMay} />
          <p className="m-0 flex items-center gap-1 text-xs text-slate-500">
            {oList.length === 1 ? t('Lớp Pre FOU không chia môn — GVCN dạy luôn.') : t('Mỗi ô một người. Một người nhận nhiều ô được.')}
            <NutLuat>{t('Chỉ nhập được điểm môn mình được phân công. Bỏ phân công KHÔNG xoá lịch sử: dòng cũ được đóng lại theo ngày, nên báo cáo cũ đọc lại vẫn thấy đúng ai dạy lúc đó; điểm đã nhập giữ nguyên tên người nhập.')}</NutLuat>
          </p>
          {slots.length === 0 && !Object.keys(nhieuNguoi).length && <p className="m-0"><Nhan tone="soon">{t('Lớp đang không có giáo viên nào')}</Nhan></p>}
          {data.past.length > 0 && (
            <div>
              <button type="button" className="link appearance-none border-0 bg-transparent p-0 text-xs" aria-expanded={moDaDay}
                onClick={() => setMoDaDay((v) => !v)}>
                {moDaDay ? '▾' : '▸'} {t('Đã từng dạy lớp này ({n})', { n: data.past.length })}
              </button>
              {moDaDay && (
                <ul className="m-0 mt-1.5 list-none space-y-1 p-0">
                  {data.past.map((h, i) => (
                    <li key={i} className="text-xs text-slate-500">
                      {h.name} · {h.isCore ? t('GVCN') : tenMon(data?.programmeCode ?? null, h.skill ?? '')} · {tuanLich(h.from, homNay)}{h.to ? ` → ${tuanLich(h.to, homNay)}` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </PhanThongTin>
    {hop && data && (
      <HopLuuPhanCong lop={[{ classId: lop.id, code: lop.code, slots: hop.slots, phienBan: data.phienBan ?? '' }]} ten={tenNguoi}
        neoEl={hop.neo} neo={window.innerWidth < 1100 ? 'tam-duoi' : 'dong'} canh="trai"
        onQuayLai={() => setHop(null)} onDaLuu={(kq) => daLuu(kq, kq.viec, kq.nguoiCu)} onLoi={baoLoiLuu} />
    )}
    </div>
  );
}
