import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { addDaysStr, fmtBand } from '../../lib/format.ts';
import { useToast } from '../../ui/Toast.tsx';
import { ConfirmDialog } from '../../ui/Drawer.tsx';
import { MenuDong, type MucMenu } from '../../ui/MenuDong.tsx';
import { Truong } from '../../ui/KhungPanel.tsx';
import { Skeleton, Status } from '../../ui/ui.tsx';
import { HopKyNang } from '../test/keHoach/HopKyNang.tsx';
import { DaiODiemLon, type KyNangLon, type LichKn } from '../fasttrack/ODiemLon.tsx';
import { useSaveScore } from '../fasttrack/ScoreEntry.tsx';
import { LY_DO_TOI_THIEU, duongDotTest, kiemTruong, ngay, tuanLich, type KyNangKH, type OKyNang } from '@shared/domain/index.ts';

/** Một hàng của bảng lịch MT — khớp `HangLichMt` của `server/src/keHoach/keHoachTest.ts` (`GET /cycles/:id/suggested-mocks`). */
export type HangMt = {
  attemptNo: number; studyWeek: number | null; periodId: number | null; weekStart: string | null; code: string | null;
  existingAttemptId: number | null; existingPeriodId: number | null; existingSource: 'auto' | 'manual' | null; locked: boolean;
  luot: {
    attemptId: number; trangThai: 'chua-xep' | 'da-xep' | 'co-diem' | 'lich-su' | 'huy'; lichSu: boolean; kyVong: number | null;
    kyNang: Array<{ skill: KyNangKH; periodId: number | null; weekStart: string | null; coDiem: boolean; daThi: boolean; batBuoc: boolean }>;
    kn: Partial<Record<KyNangKH, OKyNang>>;
  } | null;
};
export type BangLichMt = { hang: HangMt[]; soKeTiep: number; classId: number | null; studentId: number; coTheXep: boolean };

/** Tuần thật của lượt: một tuần, hoặc "W2 OCT – W3 OCT" khi R/L/W và Speaking tách tuần. */
function tuanThat(l: NonNullable<HangMt['luot']>, homNay: string): string | null {
  const tuan = l.kyNang.filter((k) => k.batBuoc && k.weekStart).map((k) => k.weekStart!.slice(0, 10)).sort();
  if (!tuan.length) return null;
  const dau = tuanLich(tuan[0], homNay); const cuoi = tuanLich(tuan[tuan.length - 1], homNay);
  return dau === cuoi ? dau : `${dau} – ${cuoi}`;
}

/**
 * MỘT HÀNG LỊCH MT ở panel Lộ trình (PR-LM mục 2, 3): nút chính theo trạng thái lượt + menu ⋯ — xếp / dời lịch (hộp `HopKyNang`
 * như Kế hoạch Test, có xác nhận huỷ lịch lượt bị vượt), Huỷ lịch (bỏ tuần, giữ lượt — Q-0310-1), nhập điểm ngay dưới hàng
 * (`DaiODiemLon`, như hồ sơ MT). Không phải vào hồ sơ MT cho các việc lịch thường ngày.
 */
export function HangLichMt({ h, bang, hocVien, homNay, moDiem, onMoDiem, onHienDien, onDoi }: {
  h: HangMt; bang: BangLichMt; hocVien: string; homNay: string;
  /** Dải nhập điểm của hàng này đang mở (một hàng một lúc — nơi gọi giữ). */
  moDiem: boolean; onMoDiem: (mo: boolean) => void;
  /** Hộp xếp lịch đang mở → panel không đóng theo Esc (Esc chỉ đóng hộp). */
  onHienDien: (mo: boolean) => void;
  onDoi: () => void;
}) {
  const navigate = useNavigate();
  const [hop, setHop] = useState<HTMLElement | null>(null);
  const [huyLich, setHuyLich] = useState(false);
  const l = h.luot;
  const coDeXuat = h.studyWeek !== null;
  const that = l ? tuanThat(l, homNay) : null;

  const moHop = (el: HTMLElement) => setHop(el);
  const moHoSo = l ? () => navigate(duongDotTest({ id: l.attemptId, kind: 'mock' })) : null;
  const muc: MucMenu[] = [];
  let chinh: { nhan: string; lam: (el: HTMLElement) => void } | null = null;
  if (l && bang.coTheXep) {
    if (l.trangThai === 'chua-xep') chinh = { nhan: 'Xếp lịch', lam: moHop };
    else if (l.trangThai === 'da-xep') {
      chinh = { nhan: 'Dời lịch', lam: moHop };
      muc.push({ key: 'huy-lich', nhan: 'Huỷ lịch', onChon: () => setHuyLich(true), nguyHiem: true },
        { key: 'nhap-diem', nhan: 'Nhập điểm', onChon: () => onMoDiem(true) });
    } else if (l.trangThai === 'co-diem' || l.trangThai === 'lich-su') {
      chinh = { nhan: 'Nhập điểm', lam: () => onMoDiem(!moDiem) };
      muc.push({ key: 'doi-lich', nhan: 'Dời lịch', onChon: () => { const el = document.getElementById(`mt-${l.attemptId}`); if (el) moHop(el); } });
    }
  }
  if (moHoSo) muc.push({ key: 'ho-so', nhan: 'Mở hồ sơ MT', onChon: moHoSo, keTruoc: muc.length > 0 });

  return (
    <>
      <tr className="row-hover">
        <td className="td whitespace-nowrap">
          <span className="text-slate-100">MT{h.attemptNo}</span>
          {l?.kyVong != null && <span className="block text-[11px] tabular-nums text-slate-500">kỳ vọng {fmtBand(l.kyVong)}</span>}
        </td>
        <td className="td text-slate-400 whitespace-nowrap tabular-nums">{h.studyWeek !== null ? `tuần ${h.studyWeek}` : '—'}</td>
        <td className="td whitespace-nowrap">
          {h.weekStart ? (
            <>
              <span className="text-slate-200">{tuanLich(h.weekStart, homNay)}</span>
              <span className="block text-[11px] text-slate-500">{ngay(h.weekStart, homNay)} – {ngay(addDaysStr(h.weekStart, 6), homNay)}</span>
            </>
          ) : <span className="text-xs text-slate-500" title="Ngoài lịch mặc định — Quản lý xếp tay">xếp tay</span>}
        </td>
        <td className="td">
          {/*
            Hai điều trong một ô: lượt đang ở tuần nào THẬT, và bấm Áp lịch thì lượt này ra sao. Lời hứa "hệ thống không ghi đè
            cái Quản lý đã xếp" phải thấy TRƯỚC khi bấm.
          */}
          {l?.trangThai === 'chua-xep' ? <Status kind="waiting">Chưa xếp lịch</Status>
            : !l ? <Status kind="waiting">Chưa có, sẽ tạo</Status>
            : !coDeXuat ? <Status kind="done">Quản lý đã xếp</Status>
            : h.locked ? <Status kind="done">Đã làm xong, giữ nguyên</Status>
            : h.existingSource === 'manual' ? <Status kind="done">Quản lý đã chốt, giữ nguyên</Status>
            : h.existingPeriodId !== h.periodId ? <Status kind="waiting">Sẽ dời sang tuần đề xuất</Status>
            : <Status kind="done">Đã đúng</Status>}
          {that && <span className="mt-0.5 block text-[11px] text-slate-400">Đang ở {that}</span>}
        </td>
        <td className="td whitespace-nowrap">
          <span className="flex items-center justify-end gap-1">
            {chinh ? (
              <button id={l ? `mt-${l.attemptId}` : undefined} type="button" className="btn btn-sm min-h-[40px] sm:min-h-0"
                aria-expanded={chinh.nhan === 'Nhập điểm' ? moDiem : undefined}
                onClick={(e) => chinh!.lam(e.currentTarget)}>{chinh.nhan}</button>
            ) : !l ? <span className="text-xs text-slate-500">Áp lịch để tạo</span> : null}
            {muc.length > 0 && <MenuDong nhan={`Thao tác khác · MT${h.attemptNo}`} muc={muc} />}
          </span>
        </td>
      </tr>
      {moDiem && l && (
        <tr>
          <td className="td" colSpan={5}>
            <DaiDiemMt attemptId={l.attemptId} homNay={homNay} onDoi={onDoi} onDong={() => onMoDiem(false)} />
          </td>
        </tr>
      )}
      {hop && l && bang.classId !== null && (
        <HopKyNang anchor={hop} tieuDe={`${hocVien} · MT${h.attemptNo}`} loai="ft" classId={bang.classId} studentId={bang.studentId}
          dot={{ loai: 'ft', attemptNo: h.attemptNo }} attemptId={l.attemptId} kn={l.kn} kyNangDau={null} lichSu={l.lichSu}
          onClose={() => setHop(null)} onSaved={onDoi} onHienDien={onHienDien} />
      )}
      {huyLich && l && (
        <HopHuyLich attemptId={l.attemptId} nhan={`MT${h.attemptNo}`} tuan={that} onDong={() => setHuyLich(false)} onDoi={onDoi} />
      )}
    </>
  );
}

/** "Huỷ lịch" (Q-0310-1): bỏ tuần, giữ lượt — lý do ≥ 5 ký tự, máy chủ chặn lượt đã có điểm / đã thi. */
function HopHuyLich({ attemptId, nhan, tuan, onDong, onDoi }: {
  attemptId: number; nhan: string; tuan: string | null; onDong: () => void; onDoi: () => void;
}) {
  const toast = useToast();
  const [lyDo, setLyDo] = useState('');
  const [daBam, setDaBam] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loiMay, setLoiMay] = useState<string | null>(null);
  const loi = kiemTruong({ khoa: 'ly-do', nhan: 'Lý do', toiThieu: LY_DO_TOI_THIEU }, lyDo);
  const lam = async () => {
    setDaBam(true);
    if (loi || busy) return;
    setBusy(true); setLoiMay(null);
    try {
      await api.post(`/attempts/${attemptId}/bo-tuan`, { lyDo: lyDo.trim() });
      invalidate('/attempts'); invalidate('/cycles'); invalidate('/ke-hoach-test'); invalidate('/students'); invalidate('/classes');
      toast.push('ok', `Đã huỷ lịch ${nhan} — lượt về Chưa xếp lịch.`);
      onDoi(); onDong();
    } catch (e: any) { setLoiMay(e.message); } finally { setBusy(false); }
  };
  return (
    <ConfirmDialog open danger busy={busy} title={`Huỷ lịch ${nhan}?`} confirmLabel="Huỷ lịch" onClose={onDong} onConfirm={() => void lam()}
      body={(
        <div className="space-y-3">
          <p className="m-0">{nhan}{tuan ? ` (đang ở ${tuan})` : ''} bỏ tuần thi, giữ lượt và số MT — các kỹ năng chưa thi về <b>Chưa xếp lịch</b>. Không đóng Case, không xoá điểm.</p>
          <Truong nhan="Lý do" batBuoc loi={daBam ? loi : null} dem={{ co: lyDo.trim().length, can: LY_DO_TOI_THIEU }}>
            <input className="field" value={lyDo} onChange={(e) => setLyDo(e.target.value)} placeholder="Ví dụ: em xin lùi lịch thi sang tháng sau" />
          </Truong>
          {loiMay && <p className="m-0 text-xs font-semibold text-bad" role="alert">{loiMay}</p>}
        </div>
      )} />
  );
}

/** Dải nhập điểm NGAY DƯỚI HÀNG — cùng dải và cùng đường lưu với hồ sơ MT (`PUT /attempts/:id/scores/:skill`). */
function DaiDiemMt({ attemptId, homNay, onDoi, onDong }: { attemptId: number; homNay: string; onDoi: () => void; onDong: () => void }) {
  const ct = useApi<any>(`/attempts/${attemptId}`, [attemptId]);
  const { save } = useSaveScore(attemptId, () => { ct.reload(); onDoi(); });
  const [mo, setMo] = useState<KyNangLon | null>(null);
  if (!ct.data) return <Skeleton rows={2} />;
  return (
    <div className="space-y-2">
      <DaiODiemLon cells={ct.data.cells} lich={ct.data.skillSchedule as LichKn[]} result={ct.data.result} lichSu={ct.data.lichSu} homNay={homNay}
        mo={mo} onMo={setMo} save={save} />
      <div className="flex justify-end">
        <button type="button" className="btn btn-sm btn-ghost min-h-[40px] sm:min-h-0" onClick={onDong}>Đóng dải điểm</button>
      </div>
    </div>
  );
}
