import { useEffect, useState, type ReactNode } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { Empty, Skeleton } from '../../ui/ui.tsx';
import { chonKhiDoiTach, kiemPhanCong, nenTachFou, nhomGiaoVienBoMon, slotsTuO, tenMon, tuanLich } from '@shared/domain/index.ts';
import { LuoiPhanCong, NutTachFou, loiTaiO, useTachFou } from './ClassCreatePanel.tsx';
import { DongXem, PhanThongTin } from './ThongTinLopPanel.tsx';
import { TenGiaoVien } from './TenGiaoVien.tsx';
import type { HoSoLop } from './DauTrangLop.tsx';

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
};

export function PhanPhanCong({ lop, suaDuoc, moSua = false, onDone }: {
  lop: HoSoLop; suaDuoc: boolean; moSua?: boolean; onDone: () => void;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const [dangSua, setDangSua] = useState(moSua && suaDuoc);
  const { data, loading, error } = useApi<Teachers>(dangSua ? `/classes/${lop.id}/teachers` : null, [dangSua]);
  const [chon, setChon] = useState<Record<string, number | ''>>({});
  /** Ô dữ liệu cũ đang có từ 2 người: khoá ô → tên. */
  const [nhieuNguoi, setNhieuNguoi] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState(false);
  const [loiLuu, setLoiLuu] = useState<string | null>(null);
  const [moDaDay, setMoDaDay] = useState(false);
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
    const c: Record<string, number | ''> = Object.fromEntries(ds.filter(([, a]) => a.length === 1).map(([k, a]) => [k, a[0].userId]));
    /* Q31-5: FOU mà L, R, G+V cùng người (hoặc trống) → 2 ô; khác người → mở sẵn tách. */
    const tach = nenTachFou(data.programmeCode, data.bySkill);
    fou.setTach(tach);
    setChon(fou.gop && !tach ? chonKhiDoiTach(c, fou.gop, false) : c);
    setNhieuNguoi(Object.fromEntries(ds.filter(([, a]) => a.length > 1).map(([k, a]) => [k, a.map((x) => x.name)])));
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const oList = data ? fou.oList : [];
  const slots = slotsTuO(oList, chon);
  const suaMay = !!data && (data.viewer.canAssign || !!data.viewer.canAssignSubject);
  /* GVCN (không phải Quản lý): ô GVCN tách ra hàng chỉ đọc; lưới chỉ còn ô bộ môn. Lớp Pre FOU chỉ có ô GVCN → chỉ xem. */
  const chiBoMon = !!data && !data.viewer.canAssign && !!data.viewer.canAssignSubject;
  const oSua = chiBoMon ? oList.filter((o) => !o.laGvcn) : oList;
  const loiPc = data ? kiemPhanCong(data.programmeCode, data.skills, slots) : [];
  const loiO = (khoa: string) => (nhieuNguoi[khoa] && !chon[khoa]
    ? `Ô này đang có ${nhieuNguoi[khoa].length} người — chọn lại một người`
    : loiTaiO(loiPc, oList, khoa));
  const oLoi = oList.filter((o) => loiO(o.khoa));

  /* Người đang được phân công mà không còn trong danh sách ứng viên (khoá tài khoản, đổi chi nhánh) vẫn phải hiện tên. */
  const nguoi = [
    ...(data?.candidates ?? []),
    ...[...(data?.core ?? []), ...(data?.bySkill ?? [])]
      .filter((a, i, all) => !data?.candidates.some((c) => c.id === a.userId) && all.findIndex((x) => x.userId === a.userId) === i)
      .map((a) => ({ id: a.userId, name: a.name, classCount: 0 })),
  ];

  const luu = async () => {
    if (!data || oLoi.length) { lf.bam(); setLoiLuu(oLoi[0] ? `${oLoi[0].nhan}: ${loiO(oLoi[0].khoa)}` : null); return; }
    setBusy(true); setLoiLuu(null);
    try {
      await api.put(`/classes/${lop.id}/teachers`, { slots });
      invalidate('/classes'); invalidate('/my-work');
      toast.push('ok', 'Đã lưu phân công');
      setDangSua(false);
      onDone();
    } catch (e: any) { setLoiLuu(e.message); toast.push('error', e.message); } finally { setBusy(false); }
  };
  const gvcn = lop.coreTeachers[0] ?? null;
  const nhom = nhomGiaoVienBoMon(lop.skills.map((x) => x.skill), lop.skillTeachers, lop.programme?.code ?? null);

  return (
    <PhanThongTin tieuDe="Phân công" suaDuoc={suaDuoc} dangSua={dangSua} busy={busy} nhanLuu="Lưu phân công" loi={loiLuu}
      cuonToi={moSua} onSua={() => setDangSua(true)} onHuy={() => { setDangSua(false); setLoiLuu(null); }} onLuu={luu}>
      {!dangSua && (
        <DongXem dong={[
          ['GVCN', gvcn ? <TenGiaoVien id={gvcn.id} ten={gvcn.name} /> : <span className="text-amber-200">Chưa có GVCN</span>],
          ...nhom.map((g): [string, ReactNode] => [g.nhan, g.id !== null ? <TenGiaoVien id={g.id} ten={g.ten} /> : <span className="text-amber-200">{g.ten}</span>]),
        ]} />
      )}
      {dangSua && loading && <Skeleton rows={5} />}
      {dangSua && error && <Empty title="Không đọc được phân công" hint={error.message} />}
      {dangSua && data && (
        <div className="space-y-3">
          {!suaMay && <p className="m-0 text-xs text-slate-400">Chỉ xem: đổi phân công là việc của Quản lý chi nhánh.</p>}
          {chiBoMon && (
            <div className="grid grid-cols-[6rem_1fr] items-center gap-x-2.5" id={lf.oId('gvcn')}>
              <span className="text-xs font-bold text-slate-200">GVCN</span>
              <span className="text-sm text-slate-300">
                {data.core.map((c) => c.name).join(' · ') || 'Chưa có'}
                <span className="block text-xs text-slate-500">Đổi GVCN: nhờ Quản lý chi nhánh.</span>
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
            {oList.length === 1 ? 'Lớp Pre FOU không chia môn — GVCN dạy luôn.' : 'Mỗi ô một người. Một người nhận nhiều ô được.'}
            <NutLuat>Chỉ nhập được điểm môn mình được phân công. Bỏ phân công KHÔNG xoá lịch sử: dòng cũ được đóng lại theo ngày, nên báo cáo cũ đọc lại vẫn thấy đúng ai dạy lúc đó; điểm đã nhập giữ nguyên tên người nhập.</NutLuat>
          </p>
          {slots.length === 0 && !Object.keys(nhieuNguoi).length && <p className="m-0"><Nhan tone="soon">Lớp đang không có giáo viên nào</Nhan></p>}
          {data.past.length > 0 && (
            <div>
              <button type="button" className="link appearance-none border-0 bg-transparent p-0 text-xs" aria-expanded={moDaDay}
                onClick={() => setMoDaDay((v) => !v)}>
                {moDaDay ? '▾' : '▸'} Đã từng dạy lớp này ({data.past.length})
              </button>
              {moDaDay && (
                <ul className="m-0 mt-1.5 list-none space-y-1 p-0">
                  {data.past.map((h, i) => (
                    <li key={i} className="text-xs text-slate-500">
                      {h.name} · {h.isCore ? 'GVCN' : tenMon(data?.programmeCode ?? null, h.skill ?? '')} · {tuanLich(h.from, homNay)}{h.to ? ` → ${tuanLich(h.to, homNay)}` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </PhanThongTin>
  );
}
