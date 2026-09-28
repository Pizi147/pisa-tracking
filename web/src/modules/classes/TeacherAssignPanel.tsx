import { useEffect, useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Khoi, KhungPanel } from '../../ui/KhungPanel.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { Empty, Skeleton } from '../../ui/ui.tsx';
import { skillLabel } from '../../lib/format.ts';
import { kiemPhanCong, ngay, oPhanCong } from '@shared/domain/index.ts';
import { LuoiPhanCong, SoOCanSua } from './ClassCreatePanel.tsx';

/**
 * SỬA PHÂN CÔNG GIÁO VIÊN CỦA LỚP (PR-LOP, YC-4, mockup 21 mục 4) — MỘT panel `KhungPanel`, mỗi ô MỘT người.
 *
 * Ô theo chương trình (`oPhanCong`), lỗi luật (`kiemPhanCong`) hiện ngay tại ô và khoá Lưu — cùng hàm máy chủ kiểm.
 * Dữ liệu cũ có nhiều người một ô (trước luật, Q11): hiện cả tên, bắt chọn lại một người, không tự bỏ ai.
 * Gửi lên NGUYÊN bức tranh đang hiển thị (`{ slots }`), không gửi từng thao tác: hai người sửa cùng lúc thì kết quả vẫn là
 * một trong hai bức tranh.
 */

type Teachers = {
  classId: number; classCode: string; branchCode: string; programmeCode: string | null;
  skills: string[];
  core: { userId: number; name: string; from: string }[];
  bySkill: { skill: string; userId: number; name: string; from: string }[];
  candidates: { id: number; name: string; code: string; title: string | null; classCount: number; inThisClass: boolean }[];
  past: { name: string; skill: string | null; isCore: boolean; from: string; to: string | null }[];
  viewer: { canAssign: boolean };
};

export function TeacherAssignPanel({ open, onClose, classId, classCode, onDone }: {
  open: boolean; onClose: () => void; classId: number; classCode: string; onDone: () => void;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const { data, loading, error } = useApi<Teachers>(open ? `/classes/${classId}/teachers` : null, [open]);
  const [chon, setChon] = useState<Record<string, number | ''>>({});
  /** Ô dữ liệu cũ đang có từ 2 người: khoá ô → tên. */
  const [nhieuNguoi, setNhieuNguoi] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState(false);
  const [moDaDay, setMoDaDay] = useState(false);

  // Nạp bức tranh hiện tại một lần khi mở; sửa xong mới gửi lên.
  useEffect(() => {
    if (!data) return;
    const theoO = new Map<string, { userId: number; name: string }[]>();
    for (const [khoa, a] of [...data.core.map((c) => ['gvcn', c] as const), ...data.bySkill.map((c) => [c.skill, c] as const)]) {
      theoO.set(khoa, [...(theoO.get(khoa) ?? []), a]);
    }
    const ds = [...theoO];
    setChon(Object.fromEntries(ds.filter(([, a]) => a.length === 1).map(([k, a]) => [k, a[0].userId])));
    setNhieuNguoi(Object.fromEntries(ds.filter(([, a]) => a.length > 1).map(([k, a]) => [k, a.map((x) => x.name)])));
  }, [data]);

  if (!open) return null;

  const oList = data ? oPhanCong(data.programmeCode, data.skills) : [];
  const slots = oList.flatMap((o) => (chon[o.khoa] ? [{ userId: Number(chon[o.khoa]), skill: o.skill, isCore: o.laGvcn }] : []));
  const loiPc = data ? kiemPhanCong(data.programmeCode, data.skills, slots) : [];
  const loiO = (khoa: string) => (nhieuNguoi[khoa] && !chon[khoa]
    ? `Ô này đang có ${nhieuNguoi[khoa].length} người — chọn lại một người`
    : loiPc.find((l) => l.khoa === khoa)?.lyDo ?? null);
  const oLoi = oList.filter((o) => loiO(o.khoa));

  /* Người đang được phân công mà không còn trong danh sách ứng viên (khoá tài khoản, đổi chi nhánh) vẫn phải hiện tên. */
  const nguoi = [
    ...(data?.candidates ?? []),
    ...[...(data?.core ?? []), ...(data?.bySkill ?? [])]
      .filter((a, i, all) => !data?.candidates.some((c) => c.id === a.userId) && all.findIndex((x) => x.userId === a.userId) === i)
      .map((a) => ({ id: a.userId, name: a.name, classCount: 0 })),
  ];

  const luu = async () => {
    setBusy(true);
    try {
      await api.put(`/classes/${classId}/teachers`, { slots });
      invalidate('/classes'); invalidate('/my-work');
      toast.push('ok', 'Đã lưu phân công');
      onDone(); onClose();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe="Sửa phân công" lop={classCode} onDong={onClose}
      ngCanh={data && !data.viewer.canAssign ? <span className="text-slate-400">Chỉ xem: đổi phân công là việc của Quản lý và Admin chi nhánh.</span> : undefined}
      chan={{
        phu: <SoOCanSua n={oLoi.length} />,
        chinh: data?.viewer.canAssign
          ? (
            <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy || !data || oLoi.length > 0}
              title={oLoi[0] ? `${oLoi[0].nhan}: ${loiO(oLoi[0].khoa)}` : undefined} onClick={luu}>Lưu</button>
          )
          : undefined,
      }}>
      {loading && <div className="pt-3"><Skeleton rows={5} /></div>}
      {error && <div className="pt-3"><Empty title="Không đọc được phân công" hint={error.message} /></div>}
      {data && (
        <>
          <Khoi tieuDe="Phân công"
            luat="Chỉ nhập được điểm môn mình được phân công. Bỏ phân công KHÔNG xoá lịch sử: dòng cũ được đóng lại theo ngày, nên báo cáo cũ đọc lại vẫn thấy đúng ai dạy lúc đó; điểm đã nhập giữ nguyên tên người nhập.">
            <LuoiPhanCong oList={oList} chon={chon} nguoi={nguoi} loi={loiO} chiXem={!data.viewer.canAssign}
              nhanTrong={(k) => nhieuNguoi[k]?.join(' · ')}
              onChon={(khoa, v) => setChon((c) => ({ ...c, [khoa]: v }))} />
            <p className="m-0 text-[11px] text-slate-500">
              {oList.length === 1 ? 'Lớp Pre FOU không chia môn — GVCN dạy luôn.' : 'Mỗi ô một người. Một người nhận nhiều ô được.'}
            </p>
          </Khoi>
          {slots.length === 0 && !Object.keys(nhieuNguoi).length && (
            <p className="mt-3.5"><Nhan tone="soon">Lớp đang không có giáo viên nào</Nhan></p>
          )}
          {data.past.length > 0 && (
            <div className="mt-3.5">
              <button type="button" className="link appearance-none border-0 bg-transparent p-0 text-xs" aria-expanded={moDaDay}
                onClick={() => setMoDaDay((v) => !v)}>
                {moDaDay ? '▾' : '▸'} Đã từng dạy lớp này ({data.past.length})
              </button>
              {moDaDay && (
                <ul className="m-0 mt-1.5 list-none space-y-1 p-0">
                  {data.past.map((h, i) => (
                    <li key={i} className="text-xs text-slate-500">
                      {h.name} · {h.isCore ? 'GVCN' : skillLabel(h.skill ?? '')} · {ngay(h.from, homNay)}{h.to ? ` → ${ngay(h.to, homNay)}` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </KhungPanel>
  );
}
