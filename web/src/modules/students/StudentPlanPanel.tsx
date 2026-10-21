import { useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { Empty, SectionNote, Skeleton, Th } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { HopKyNang } from '../test/keHoach/HopKyNang.tsx';
import { HangLichMt, type BangLichMt } from './HangLichMt.tsx';

/** Band 0–9, bước 0.5 — cùng luật máy chủ (máy chủ vẫn kiểm lại). */
export const laBand = (s: string) => s.trim() !== '' && Number.isFinite(Number(s)) && Number(s) >= 0 && Number(s) <= 9 && Number(s) * 2 === Math.round(Number(s) * 2);

/**
 * LỘ TRÌNH (FT) — ⋯ hồ sơ học viên: bảng các đợt MT — xếp / dời / huỷ lịch / nhập điểm ngay tại hàng (PR-LM), "+ Thêm MT", áp lịch hệ thống đề xuất.
 * OV-11d (HV-15): Tuần bắt đầu · ngày thi dự kiến · Target · Điểm đầu vào CHỈ ở Sửa thông tin (một khái niệm một chỗ sửa) — panel này không còn ô nhập.
 * Lịch MT giữ tinh thần cũ: hệ thống ĐỀ XUẤT rồi để người bấm áp, và khi áp thì KHÔNG đụng lượt Quản lý đã chốt tay hay lượt đã làm xong.
 */
export function StudentPlanPanel({ cycleId, studentName, ratio, onSuaThongTin, onClose, onDone }: {
  cycleId: number; studentName: string; ratio: boolean;
  /** Chưa có Tuần bắt đầu → nút sang Sửa thông tin (nơi duy nhất sửa ô này). */
  onSuaThongTin?: () => void;
  onClose: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const cycle = useApi<any>(`/cycles/${cycleId}`);
  const sugg = useApi<BangLichMt>(ratio ? null : `/cycles/${cycleId}/suggested-mocks`, [cycleId]);
  /** Hàng đang mở dải nhập điểm (một hàng một lúc) · hộp "+ Thêm MT" · có hộp xếp lịch đang mở (Esc chỉ đóng hộp, không đóng panel). */
  const [moDiem, setMoDiem] = useState<number | null>(null);
  const [themMt, setThemMt] = useState<HTMLElement | null>(null);
  const [hopMo, setHopMo] = useState(false);
  const doiLich = () => { sugg.reload(); cycle.reload(); onDone(); };
  const [busy, setBusy] = useState(false);
  const startPeriodId: number | null = cycle.data?.start_period_id ?? null;

  const applyPlan = async () => {
    setBusy(true);
    try {
      const r = await api.post<{ created: number; moved: number; kept: number }>(
        `/cycles/${cycleId}/apply-suggested-mocks`, {},
      );
      invalidate('/attempts'); invalidate('/classes'); invalidate('/students');
      toast.push('ok',
        `Đã lên lịch: thêm ${r.created} lượt, dời ${r.moved} lượt`
        + (r.kept ? `, giữ nguyên ${r.kept} lượt đã chốt tay` : ''));
      sugg.reload(); onDone();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  const { homNay } = useNgayNghiepVu();
  const bang = sugg.data;
  const rows = bang?.hang ?? [];
  /* Có gì để áp không — nếu mọi lượt đều đã đúng hoặc đã khoá thì nút không nên sáng. Hàng ngoài lịch mặc định (MT4+) không áp. */
  const actionable = rows.filter(
    (r) => r.studyWeek !== null && !r.locked && r.existingSource !== 'manual'
      && (!r.existingAttemptId || r.existingPeriodId !== r.periodId),
  ).length;

  return (
    <KhungPanel tieuDe="Lộ trình" hocVien={studentName} rong="rong" onDong={hopMo ? () => { /* Esc đóng hộp xếp lịch trước */ } : onClose}
      chan={{ huy: { nhan: 'Đóng', onClick: onClose, disabled: busy } }}>
      {cycle.loading ? <div className="pt-3"><Skeleton rows={6} /></div> : (
        <div className="space-y-4 pt-3">
          {ratio ? (
            <SectionNote>
              Đây là lớp thường nên không có lịch MT riêng từng em — cả lớp làm bài Progress Test và Final Test cùng tuần theo chương trình. Xem và sửa hai mốc đó ở trang lớp.
            </SectionNote>
          ) : (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <span className="label">Lịch MT hệ thống đề xuất</span>
                {/* OV-11d (HV-22): không áp được thì nói lý do bằng chữ (không nút mờ). */}
                {!bang?.coTheXep ? <span className="text-xs text-slate-400">Quản lý xếp lịch MT</span>
                  : actionable ? <button className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={applyPlan}>Áp lịch cho {actionable} lượt</button>
                  : <span className="text-xs text-slate-400">Lịch đã đúng</span>}
              </div>

              {!startPeriodId ? (
                <Empty title="Chưa có Tuần bắt đầu" hint="Điền Tuần bắt đầu ở Sửa thông tin — lịch MT đề xuất hiện ngay ở đây."
                  action={onSuaThongTin ? <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={onSuaThongTin}>Sửa thông tin</button> : undefined} />
              ) : rows.length === 0 ? (
                <Skeleton rows={3} />
              ) : (
                <div className="surface-2 rounded-lg overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <Th hint="Số thứ tự lượt Mock Test trong lộ trình này, kèm kỳ vọng của lượt. Sang lộ trình mới thì đánh lại từ 1.">Lượt</Th>
                        <Th hint="Tuần thứ mấy kể từ tuần em bắt đầu học. Mốc mặc định của Fast Track là tuần 6 · 12 · 16 · 20 · 24.">Tuần học</Th>
                        <Th hint="Tuần hệ thống tính ra từ tuần bắt đầu học. Chỉ là đề xuất — bấm Áp lịch mới thật sự đổi.">Tuần đề xuất</Th>
                        <Th hint="Lượt đang ở tuần nào, và bấm Áp lịch thì lượt này ra sao. Lượt Quản lý đã chốt tay và lượt đã làm xong thì đứng yên.">Hiện tại</Th>
                        <Th align="right">Thao tác</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <HangLichMt key={r.attemptNo} h={r} bang={bang!} hocVien={studentName} homNay={homNay}
                          moDiem={moDiem === r.attemptNo} onMoDiem={(mo) => setMoDiem(mo ? r.attemptNo : null)}
                          onHienDien={setHopMo} onDoi={doiLich} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {bang?.coTheXep && bang.classId !== null && startPeriodId && (
                <div className="mt-2">
                  <button type="button" className="btn btn-sm min-h-[40px] sm:min-h-0" onClick={(e) => setThemMt(e.currentTarget)}>
                    + Thêm MT{bang.soKeTiep}
                  </button>
                </div>
              )}
              {themMt && bang && bang.classId !== null && (
                <HopKyNang anchor={themMt} tieuDe={`${studentName} · MT${bang.soKeTiep}`} loai="ft" classId={bang.classId} studentId={bang.studentId}
                  dot={{ loai: 'ft', attemptNo: bang.soKeTiep }} attemptId={null} kn={{}} kyNangDau={null}
                  onClose={() => setThemMt(null)} onSaved={doiLich} onHienDien={setHopMo} />
              )}

              <SectionNote>
                Hệ thống chỉ đề xuất ba lượt đầu — đa số em chỉ làm ba lượt, MT4 và MT5 là dự
                phòng, thêm bằng "+ Thêm MT" (tuần cách ≥ 2 tuần = MT cũ). Lượt nào Quản lý đã chốt
                tay hoặc em đã làm xong thì đứng yên, kể cả khi đổi lại tuần bắt đầu học.
              </SectionNote>
            </div>
          )}
        </div>
      )}
    </KhungPanel>
  );
}
