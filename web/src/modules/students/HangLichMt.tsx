import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { addDaysStr, fmtBand } from '../../lib/format.ts';
import { useToast } from '../../ui/Toast.tsx';
import { ConfirmDialog } from '../../ui/Drawer.tsx';
import { MenuDong, type MucMenu } from '../../ui/MenuDong.tsx';
import { Skeleton, Status } from '../../ui/ui.tsx';
import { OMt } from '../../ui/OMt.tsx';
import { HopKyNang } from '../test/keHoach/HopKyNang.tsx';
import { HopKhoiPhucKetQua, HopKhoiPhucMt } from '../test/keHoach/HopKhoiPhucKetQua.tsx';
import { DaiODiemLon, type LichKn } from '../fasttrack/ODiemLon.tsx';
import { nguCanhChiTiet } from '../fasttrack/HopNhapDiem.tsx';
import { useSaveScore } from '../fasttrack/ScoreEntry.tsx';
import { duongDotTest, ngay, tuanLich, type KetQuaHuy, type KyNangKH, type OKyNang } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/** Một hàng của bảng lịch MT — khớp `HangLichMt` của `server/src/keHoach/keHoachTest.ts` (`GET /cycles/:id/suggested-mocks`). */
export type HangMt = {
  attemptNo: number; studyWeek: number | null; periodId: number | null; weekStart: string | null; code: string | null;
  existingAttemptId: number | null; existingPeriodId: number | null; existingSource: 'auto' | 'manual' | null; locked: boolean;
  luot: {
    attemptId: number; trangThai: 'chua-xep' | 'da-xep' | 'co-diem' | 'lich-su' | 'huy'; lichSu: boolean; kyVong: number | null;
    kyNang: Array<{ skill: KyNangKH; periodId: number | null; weekStart: string | null; coDiem: boolean; daThi: boolean; batBuoc: boolean }>;
    kn: Partial<Record<KyNangKH, OKyNang>>;
    /** T2 (PR-MTa): kết quả đã huỷ do dời vượt, còn khôi phục được — `null` khi không có. */
    ketQuaHuy?: KetQuaHuy | null;
  } | null;
  /** PR-OV4a: số MT này chỉ có lượt đã huỷ — hàng "Đã huỷ", Quản lý Khôi phục. */
  huy?: { attemptId: number } | null;
};
export type BangLichMt = { hang: HangMt[]; soKeTiep: number; classId: number | null; studentId: number; coTheXep: boolean; coTheKhoiPhuc?: boolean };

/** Tuần thật của lượt: một tuần, hoặc "W2 OCT – W3 OCT" khi R/L/W và Speaking tách tuần. */
function tuanThat(l: NonNullable<HangMt['luot']>, homNay: string): string | null {
  const tuan = l.kyNang.filter((k) => k.batBuoc && k.weekStart).map((k) => k.weekStart!.slice(0, 10)).sort();
  if (!tuan.length) return null;
  const dau = tuanLich(tuan[0], homNay); const cuoi = tuanLich(tuan[tuan.length - 1], homNay);
  return dau === cuoi ? dau : `${dau} – ${cuoi}`;
}

/**
 * MỘT HÀNG LỊCH MT ở panel Lộ trình (PR-LM mục 2, 3): nút chính theo trạng thái lượt + menu ⋯ — xếp / dời lịch (hộp `HopKyNang`
 * như Kế hoạch Test, có xác nhận huỷ lịch lượt bị vượt), Xóa (bỏ tuần, giữ lượt — Q-0310-1, OV-15c), nhập điểm ngay dưới hàng
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
  const [khoiPhuc, setKhoiPhuc] = useState(false);
  const [khoiPhucLuot, setKhoiPhucLuot] = useState(false);
  const l = h.luot;
  const coDeXuat = h.studyWeek !== null;
  const that = l ? tuanThat(l, homNay) : null;

  const moHop = (el: HTMLElement) => setHop(el);
  const idHoSo = l?.attemptId ?? h.huy?.attemptId ?? null;
  const moHoSo = idHoSo !== null ? () => navigate(duongDotTest({ id: idHoSo, kind: 'mock' })) : null;
  const muc: MucMenu[] = [];
  let chinh: { nhan: string; lam: (el: HTMLElement) => void } | null = null;
  if (l && bang.coTheXep) {
    if (l.trangThai === 'chua-xep') chinh = { nhan: 'Xếp lịch', lam: moHop };
    else if (l.trangThai === 'da-xep') {
      chinh = { nhan: 'Dời lịch', lam: moHop };
      /* OV-15c (mục 6): "Huỷ lịch" → "Xóa" — cùng tên, cùng câu hỏi với chân hộp lịch ở Kế hoạch Test. */
      muc.push({ key: 'huy-lich', nhan: t('Xóa'), onChon: () => setHuyLich(true), nguyHiem: true },
        { key: 'nhap-diem', nhan: 'Nhập điểm', onChon: () => onMoDiem(true) });
    } else if (l.trangThai === 'co-diem' || l.trangThai === 'lich-su') {
      chinh = { nhan: 'Nhập điểm', lam: () => onMoDiem(!moDiem) };
      muc.push({ key: 'doi-lich', nhan: 'Dời lịch', onChon: () => { const el = document.getElementById(`mt-${l.attemptId}`); if (el) moHop(el); } });
    }
  }
  /* PR-OV4a: lượt đã huỷ — Quản lý / Quản trị Khôi phục ngay ở hàng (Admin, GV: không nút, chỉ Mở hồ sơ MT). */
  if (!l && h.huy && bang.coTheKhoiPhuc) chinh = { nhan: `Khôi phục MT${h.attemptNo}`, lam: () => setKhoiPhucLuot(true) };
  /* T2: lượt bị vượt có kết quả đã huỷ → Quản lý khôi phục được (⋯ chỉ có mục này khi có `ketQuaHuy`). */
  if (l?.ketQuaHuy && bang.coTheKhoiPhuc) muc.push({ key: 'khoi-phuc-ket-qua', nhan: 'Khôi phục kết quả', onChon: () => setKhoiPhuc(true) });
  if (moHoSo) muc.push({ key: 'ho-so', nhan: 'Mở hồ sơ MT', onChon: moHoSo, keTruoc: muc.length > 0 });

  /* PR-MT0: hàng MT0 (số 0) không có tuần đề xuất — hiện tuần thật sớm nhất của nó. */
  const tuanHien = h.weekStart ?? (h.attemptNo === 0 ? Object.values(l?.kn ?? {}).map((o) => o?.tuan ?? null).filter((x): x is string => !!x).sort()[0] ?? null : null);
  return (
    <>
      <tr className="row-hover">
        <td className="td whitespace-nowrap">
          <OMt v={{ so: h.attemptNo, attemptId: l?.attemptId ?? null, kn: l?.kn ?? {}, cu: !!l?.lichSu }} homNay={homNay} huy={!l && !!h.huy} />
          {l?.kyVong != null && <span className="block text-xs tabular-nums text-slate-500">kỳ vọng {fmtBand(l.kyVong)}</span>}
        </td>
        <td className="td text-slate-400 whitespace-nowrap tabular-nums">{h.studyWeek !== null ? `tuần ${h.studyWeek}` : '—'}</td>
        <td className="td whitespace-nowrap">
          {tuanHien ? (
            <>
              <span className="text-slate-200">{tuanLich(tuanHien, homNay)}</span>
              <span className="block text-xs text-slate-500">{ngay(tuanHien, homNay)} – {ngay(addDaysStr(tuanHien, 6), homNay)}</span>
            </>
          ) : <span className="text-xs text-slate-500" title="Ngoài lịch mặc định — Quản lý xếp tay">xếp tay</span>}
        </td>
        <td className="td">
          {/*
            Hai điều trong một ô: lượt đang ở tuần nào THẬT, và bấm Áp lịch thì lượt này ra sao. Lời hứa "hệ thống không ghi đè
            cái Quản lý đã xếp" phải thấy TRƯỚC khi bấm.
          */}
          {!l && h.huy ? <Status kind="idle">Đã huỷ</Status>
            : l?.trangThai === 'chua-xep' ? <Status kind="waiting">Chưa xếp lịch</Status>
            : !l ? <Status kind="waiting">Chưa có, sẽ tạo</Status>
            : !coDeXuat ? <Status kind="done">Quản lý đã xếp</Status>
            : h.locked ? <Status kind="done">Đã làm xong, giữ nguyên</Status>
            : h.existingSource === 'manual' ? <Status kind="done">Quản lý đã chốt, giữ nguyên</Status>
            : h.existingPeriodId !== h.periodId ? <Status kind="waiting">Sẽ dời sang tuần đề xuất</Status>
            : <Status kind="done">Đã đúng</Status>}
          {that && <span className="mt-0.5 block text-xs text-slate-400">Đang ở {that}</span>}
        </td>
        <td className="td whitespace-nowrap">
          <span className="flex items-center justify-end gap-1">
            {chinh ? (
              <button id={l ? `mt-${l.attemptId}` : undefined} type="button" className="btn btn-sm min-h-[44px] sm:min-h-0"
                aria-expanded={chinh.nhan === 'Nhập điểm' ? moDiem : undefined}
                onClick={(e) => chinh!.lam(e.currentTarget)}>{chinh.nhan}</button>
            ) : !l && h.huy ? <span className="text-xs text-slate-500">Chỉ Quản lý khôi phục được</span>
            : !l ? <span className="text-xs text-slate-500">Áp lịch để tạo</span> : null}
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
        <HopKyNang anchor={hop} tieuDe={`${hocVien} · MT${h.attemptNo}`} tenHv={hocVien} loai="ft" classId={bang.classId} studentId={bang.studentId}
          dot={{ loai: 'ft', attemptNo: h.attemptNo }} attemptId={l.attemptId} kn={l.kn} kyNangDau={null} lichSu={l.lichSu}
          onClose={() => setHop(null)} onSaved={onDoi} onHienDien={onHienDien} />
      )}
      {khoiPhucLuot && h.huy && (
        <HopKhoiPhucMt attemptId={h.huy.attemptId} attemptNo={h.attemptNo} onDong={() => setKhoiPhucLuot(false)} onXong={onDoi} />
      )}
      {khoiPhuc && l?.ketQuaHuy && (
        <HopKhoiPhucKetQua attemptId={l.attemptId} nhan={`MT${h.attemptNo}`} ketQua={l.ketQuaHuy} onDong={() => setKhoiPhuc(false)} onXong={onDoi} />
      )}
      {huyLich && l && (
        <HopHuyLich attemptId={l.attemptId} nhan={`MT${h.attemptNo}`} hocVien={hocVien} onDong={() => setHuyLich(false)} onDoi={onDoi} />
      )}
    </>
  );
}

/** "Xóa" (Q-0310-1 · OV-15c mục 6): bỏ tuần, giữ lượt — đợt về Chưa xếp, lịch sử giữ; máy chủ chặn lượt đã có điểm / đã thi. Câu như hộp lịch. */
function HopHuyLich({ attemptId, nhan, hocVien, onDong, onDoi }: {
  attemptId: number; nhan: string; hocVien: string; onDong: () => void; onDoi: () => void;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [loiMay, setLoiMay] = useState<string | null>(null);
  const lam = async () => {
    if (busy) return;
    setBusy(true); setLoiMay(null);
    try {
      await api.post(`/attempts/${attemptId}/bo-tuan`, { lyDo: t('Xóa lịch') });
      invalidate('/attempts'); invalidate('/cycles'); invalidate('/ke-hoach-test'); invalidate('/students'); invalidate('/classes');
      toast.push('ok', t('Đã xóa lịch {dot} · {ten}', { dot: nhan, ten: hocVien }));
      onDoi(); onDong();
    } catch (e: any) { setLoiMay(e.message); } finally { setBusy(false); }
  };
  return (
    <ConfirmDialog open danger busy={busy} title={t('Xóa lịch {dot} của {ten}?', { dot: nhan, ten: hocVien })} confirmLabel={t('Xóa')} onClose={onDong} onConfirm={() => void lam()}
      body={(
        <div className="space-y-3">
          <p className="m-0">{t('Đợt về Chưa xếp, lịch sử vẫn xem được.')}</p>
          {loiMay && <p className="m-0 text-xs font-semibold text-bad" role="alert">{loiMay}</p>}
        </div>
      )} />
  );
}

/** Dải nhập điểm NGAY DƯỚI HÀNG — cùng dải và cùng đường lưu với hồ sơ MT (`PUT /attempts/:id/scores/:skill`). */
function DaiDiemMt({ attemptId, homNay, onDoi, onDong }: { attemptId: number; homNay: string; onDoi: () => void; onDong: () => void }) {
  const ct = useApi<any>(`/attempts/${attemptId}`, [attemptId]);
  const { save } = useSaveScore(attemptId, () => { ct.reload(); onDoi(); });
  const [mo, setMo] = useState<string | null>(null);
  if (!ct.data) return <Skeleton rows={2} />;
  return (
    <div className="space-y-2">
      <DaiODiemLon cells={ct.data.cells} lich={ct.data.skillSchedule as LichKn[]} result={ct.data.result} lichSu={ct.data.lichSu} homNay={homNay}
        mo={mo} onMo={setMo} save={save} nguCanh={nguCanhChiTiet(ct.data)} />
      <div className="flex justify-end">
        <button type="button" className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0" onClick={onDong}>Đóng dải điểm</button>
      </div>
    </div>
  );
}
