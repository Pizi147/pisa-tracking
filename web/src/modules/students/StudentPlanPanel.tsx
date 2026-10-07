import { useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { WeekPicker } from '../../ui/Filters.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { Empty, Field, NutChon, SectionNote, Skeleton, TargetText, Th } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { HopKyNang } from '../test/keHoach/HopKyNang.tsx';
import { HangLichMt, type BangLichMt } from './HangLichMt.tsx';
import { BASELINE_SOURCES, BASELINE_SOURCE_LABEL, GIAI_THICH_KCK, KCK, dsLoi, type LoiTruong } from '@shared/domain/index.ts';

/** Band 0–9, bước 0.5 — cùng luật máy chủ (máy chủ vẫn kiểm lại). */
export const laBand = (s: string) => s.trim() !== '' && Number.isFinite(Number(s)) && Number(s) >= 0 && Number(s) <= 9 && Number(s) * 2 === Math.round(Number(s) * 2);

/**
 * LỘ TRÌNH — mục 2 của menu hồ sơ học viên (mục 5.1), thay cho "Kế hoạch học".
 *
 * Đổi tên vì đây đúng là lộ trình chứ không phải một cái lịch: nó giữ MỌI thứ quyết định
 * đường đi của em trong giai đoạn này, và chúng phải nằm cạnh nhau mới nhìn được ảnh hưởng
 * của nhau.
 *
 *   tuần bắt đầu học   →  lịch MT mặc định của cả khoá tính ra từ đây
 *   kế hoạch thi thật  →  ngày (đếm ngược) hoặc tháng
 *   MỤC TIÊU           →  đổi thì BẮT BUỘC có lý do và ngày hiệu lực
 *   ĐIỂM ĐẦU VÀO       →  em vào học ở mức nào
 *   bảng các đợt MT    →  xếp / dời / huỷ lịch / nhập điểm ngay tại hàng (PR-LM) — không phải vào hồ sơ MT
 *
 * Target và điểm đầu vào trước đây là HAI mục menu riêng, nên muốn sửa Target người dùng
 * phải đoán nó nằm ở "Kế hoạch học" hay ở "Đổi Target". Nay chúng về đúng chỗ.
 *
 * Phần lịch MT vẫn giữ nguyên tinh thần cũ: hệ thống ĐỀ XUẤT rồi để người bấm áp, và khi áp
 * thì KHÔNG đụng vào lượt Quản lý đã chốt tay hay lượt đã làm xong.
 */
export function StudentPlanPanel({ cycleId, studentName, ratio, canEditCycle = true, onDeXuatSua, onClose, onDone }: {
  cycleId: number; studentName: string; ratio: boolean;
  /** PR-DUYET (T44): không có `cycle.edit` → target chỉ đọc, cạnh đó liên kết "Đề xuất sửa" (`onDeXuatSua`). */
  canEditCycle?: boolean; onDeXuatSua?: () => void;
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
  const [startPeriodId, setStartPeriodId] = useState<number | null>(null);
  /** T9 · ô thi dự kiến: ngày ISO (đã biết ngày) hoặc tháng `yyyy-mm` (mới biết tháng). */
  const [thiDuKien, setThiDuKien] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);
  const lf = useLoiForm();

  const cy = cycle.data;
  /* Chỉ nạp giá trị hiện tại MỘT LẦN, nếu không thì mỗi lần tải lại sẽ xoá cái người đang gõ. */
  if (cy && !touched) {
    if (startPeriodId === null && cy.start_period_id) setStartPeriodId(cy.start_period_id);
    if (thiDuKien === '' && (cy.exam_date || cy.exam_month)) setThiDuKien(cy.exam_date ?? cy.exam_month);
  }

  const loi = cy ? dsLoi([{ khoa: 'tuan-bat-dau', nhan: 'Tuần bắt đầu học', chon: true }], { 'tuan-bat-dau': startPeriodId }) : [];

  const save = async () => {
    lf.bam();
    if (loi.length > 0 || busy) return;
    setBusy(true);
    try {
      await api.patch(`/cycles/${cycleId}`, {
        startPeriodId: startPeriodId ?? null,
        ...(ratio ? {} : { examDate: thiDuKien || null }),
      });
      invalidate('/cycles'); invalidate('/students'); invalidate('/classes'); invalidate('/attempts');
      toast.push('ok', 'Đã lưu kế hoạch học');
      cycle.reload(); sugg.reload(); onDone();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

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
      chan={{
        huy: { nhan: 'Đóng', onClick: onClose, disabled: busy },
        conThieu: lf.conThieu(loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={save} disabled={busy}>Lưu</button>,
      }}>
      {cycle.loading ? <div className="pt-3"><Skeleton rows={6} /></div> : (
        <div className="space-y-4 pt-3">
          <Field as="div" label="Tuần bắt đầu học" required loi={lf.loiCua(loi, 'tuan-bat-dau')}
            hint="Tuần này là TUẦN HỌC THỨ 1 của em. Lịch MT mặc định tính ra từ đây.">
            <div {...lf.o(loi, 'tuan-bat-dau')}>
              <WeekPicker periodId={startPeriodId} label={null}
                onPeriod={(id) => { setTouched(true); setStartPeriodId(id); }} />
            </div>
          </Field>

          {/* Q-0310-5: một ô — ngày hoặc tháng; ngày thì máy chủ tự suy tuần để đếm ngược. Lớp thường không thi IELTS nên không có ô này. */}
          {!ratio && (
            <Field label="Dự kiến thi"
              hint="Biết ngày thì gõ dd/mm/yyyy (hệ thống đếm ngược); mới biết tháng thì gõ mm/yyyy.">
              <ONgay kieu="ngay-hoac-thang" value={thiDuKien} goiY="dd/mm/yyyy hoặc mm/yyyy"
                onChange={(v) => { setTouched(true); setThiDuKien(v); }} />
            </Field>
          )}

          {/* ------------------------------------------ MỤC TIÊU và ĐIỂM ĐẦU VÀO (mục 5.1) */}
          {!ratio && <TargetAndBaseline cycleId={cycleId} cy={cy} canEditCycle={canEditCycle} onDeXuatSua={onDeXuatSua}
            onDone={() => { cycle.reload(); onDone(); }} />}

          {ratio ? (
            <SectionNote>
              Đây là lớp thường nên không có lịch MT riêng từng em — cả lớp làm bài Progress Test và Final Test cùng tuần theo chương trình. Xem và sửa hai mốc đó ở trang lớp.
            </SectionNote>
          ) : (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <span className="label">Lịch MT hệ thống đề xuất</span>
                <button className="btn btn-sm btn-primary" disabled={busy || !actionable} onClick={applyPlan}>
                  {actionable ? `Áp lịch cho ${actionable} lượt` : 'Lịch đã đúng'}
                </button>
              </div>

              {!startPeriodId ? (
                <Empty title="Chưa khai tuần bắt đầu học"
                  hint="Khai tuần bắt đầu rồi bấm Lưu, hệ thống sẽ đề xuất lịch MT ngay bên dưới." />
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
                Hệ thống chỉ đề xuất ba lượt đầu — đa số em chỉ thi ba lượt, MT4 và MT5 là dự
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

/**
 * MỤC TIÊU VÀ ĐIỂM ĐẦU VÀO — hai ô của lộ trình, trước đây là hai mục menu riêng (mục 5.1).
 *
 * ĐỔI MỤC TIÊU BẮT BUỘC CÓ LÝ DO VÀ NGÀY HIỆU LỰC (mục 5.2), và ở đâu cũng vậy — đây không
 * phải một lời nhắc lịch sự, mà là điều kiện để lịch sử đọc được: vài tháng sau, lý do là
 * thứ duy nhất giải thích vì sao kỳ vọng của MT3 khác MT2.
 *
 * Và nó KHÔNG chấm lại quá khứ: các lượt đã chốt giữ nguyên kỳ vọng tính theo Target lúc
 * đó. Đổi Target từ hôm nay mà viết lại mức SOS của ba tháng trước là sửa lịch sử.
 */
function TargetAndBaseline({ cycleId, cy, canEditCycle, onDeXuatSua, onDone }: {
  cycleId: number; cy: any; canEditCycle: boolean; onDeXuatSua?: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const [openTarget, setOpenTarget] = useState(false);
  const [openBaseline, setOpenBaseline] = useState(false);
  const [newTarget, setNewTarget] = useState('');
  const [kck, setKck] = useState(false);
  const [reason, setReason] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [source, setSource] = useState('entrance');
  const [score, setScore] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const lfT = useLoiForm();
  const lfB = useLoiForm();
  const loiT: LoiTruong[] = [
    ...(!kck && !laBand(newTarget) ? [{ khoa: 'target-moi', nhan: 'Target mới', lyDo: newTarget ? 'Band từ 0 đến 9, bước 0.5 — hoặc chọn KCK' : 'Chưa điền' }] : []),
    ...dsLoi([{ khoa: 'ly-do-target', nhan: 'Lý do', toiThieu: 1 }, { khoa: 'hieu-luc', nhan: 'Có hiệu lực từ ngày', chon: true }], { 'ly-do-target': reason, 'hieu-luc': effectiveFrom }),
  ];
  const loiB: LoiTruong[] = laBand(score) ? [] : [{ khoa: 'diem-dau-vao', nhan: 'Điểm đầu vào', lyDo: score ? 'Band từ 0 đến 9, bước 0.5' : 'Chưa điền' }];

  const saveTarget = async () => {
    lfT.bam();
    if (loiT.length > 0 || busy) return;
    setBusy(true);
    try {
      await api.post(`/cycles/${cycleId}/target-revision`, {
        newTarget: kck ? KCK : newTarget === '' ? null : Number(newTarget),
        reason, effectiveFrom: effectiveFrom || undefined,
      });
      invalidate('/cycles'); invalidate('/students'); invalidate('/attempts');
      toast.push('ok', 'Đã đổi Target');
      setOpenTarget(false); setReason(''); lfT.datLai(); onDone();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  const saveBaseline = async () => {
    lfB.bam();
    if (loiB.length > 0 || busy) return;
    setBusy(true);
    try {
      await api.put(`/cycles/${cycleId}/baseline`, { source, note, score });
      invalidate('/cycles'); invalidate('/students');
      toast.push('ok', 'Đã ghi điểm đầu vào');
      setOpenBaseline(false); lfB.datLai(); onDone();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <div className="rounded-lg border p-3 space-y-3" style={{ borderColor: 'var(--line)' }}>
      {/* ------------------------------------------------------------------ Target */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-slate-200">
          Target:{' '}
          {cy?.khong_cam_ket
            ? <strong><TargetText band={null} kck /></strong>
            : cy?.target_score !== null && cy?.target_score !== undefined
            ? <strong>{cy.target_score}</strong>
            : <span className="text-amber-300">chưa đặt</span>}
        </span>
        {canEditCycle ? (
          <button className="btn btn-sm" onClick={() => setOpenTarget(!openTarget)}>
            {openTarget ? 'Đóng' : 'Đổi Target'}
          </button>
        ) : onDeXuatSua && (
          <button type="button" className="btn btn-sm btn-ghost" onClick={onDeXuatSua} title="Target do Quản lý sửa — gửi đề xuất để Quản lý duyệt">
            Đề xuất sửa
          </button>
        )}
      </div>
      {openTarget && canEditCycle && (
        <div className="space-y-2">
          <Field label="Target mới" required as="div" hint={`KCK: ${GIAI_THICH_KCK}.`} loi={lfT.loiCua(loiT, 'target-moi')}>
            <span className="flex flex-wrap items-center gap-2">
              <input className="field max-w-[8rem]" type="number" inputMode="decimal" step="0.5" min={0} max={9} aria-label="Target mới"
                {...lfT.o(loiT, 'target-moi')} value={newTarget} disabled={kck} onChange={(e) => setNewTarget(e.target.value)} />
              {!cy?.khong_cam_ket && (
                <NutChon nho chon={kck} onClick={() => { setKck(!kck); setNewTarget(''); }}>Không cam kết (KCK)</NutChon>
              )}
            </span>
          </Field>
          <Field label="Lý do" required loi={lfT.loiCua(loiT, 'ly-do-target')}
            hint="Vài tháng sau, đây là thứ duy nhất giải thích vì sao Target đổi.">
            <input className="field" maxLength={2000} {...lfT.o(loiT, 'ly-do-target')} value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Gia đình lùi kế hoạch du học sang năm sau" />
          </Field>
          <Field label="Có hiệu lực từ ngày" required loi={lfT.loiCua(loiT, 'hieu-luc')}
            hint="Ghi vào lịch sử đổi Target. MT đã có điểm giữ kỳ vọng cũ; MT chưa có điểm theo Target mới.">
            <ONgay kieu="ngay" value={effectiveFrom} onChange={setEffectiveFrom}
              id={lfT.oId('hieu-luc')} onBlur={lfT.roi('hieu-luc')} invalid={!!lfT.loiCua(loiT, 'hieu-luc')} />
          </Field>
          {lfT.daBam && loiT.length > 0 && <p className="m-0 text-xs text-slate-500">{loiT.length} ô cần sửa ↑</p>}
          <button className="btn btn-primary btn-sm" disabled={busy}
            onClick={saveTarget}>
            {busy ? 'Đang lưu…' : 'Lưu Target mới'}
          </button>
          <SectionNote>
            Các lượt đã chốt GIỮ NGUYÊN kỳ vọng tính theo Target lúc đó. Đổi Target từ hôm
            nay không chấm lại quá khứ — sửa một Target lịch sử ghi sai là một thao tác hiệu
            chỉnh riêng, có nhật ký và phải đối soát lại các kết luận đã ra. Chọn KCK: MT chưa có điểm bỏ kỳ vọng, không
            sinh SOS; Case đang mở giữ nguyên tới khi xử lý xong.
          </SectionNote>
        </div>
      )}

      {/* --------------------------------------------------------------- điểm đầu vào */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t"
           style={{ borderColor: 'var(--line)' }}>
        <span className="text-sm text-slate-200">
          Điểm đầu vào:{' '}
          {cy?.baseline_score !== null && cy?.baseline_score !== undefined
            ? <strong>{cy.baseline_score}</strong>
            : <span className="text-amber-300">chưa ghi</span>}
        </span>
        <button className="btn btn-sm" onClick={() => setOpenBaseline(!openBaseline)}>
          {openBaseline ? 'Đóng' : 'Ghi điểm đầu vào'}
        </button>
      </div>
      {openBaseline && (
        <div className="space-y-2">
          <Field label="Điểm này lấy từ đâu" required>
            <select className="field" value={source} onChange={(e) => setSource(e.target.value)}>
              {BASELINE_SOURCES.map((x) => <option key={x} value={x}>{BASELINE_SOURCE_LABEL[x]}</option>)}
            </select>
          </Field>
          <Field label="Điểm đầu vào" required loi={lfB.loiCua(loiB, 'diem-dau-vao')}>
            <input className="field max-w-[8rem]" type="number" inputMode="decimal" step="0.5" min={0} max={9}
              {...lfB.o(loiB, 'diem-dau-vao')} value={score} onChange={(e) => setScore(e.target.value)} />
          </Field>
          <Field label="Ghi chú">
            <input className="field" maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Điểm IELTS thi tại BC tháng 3/2026" />
          </Field>
          <button className="btn btn-primary btn-sm" disabled={busy} onClick={saveBaseline}>
            {busy ? 'Đang lưu…' : 'Lưu điểm đầu vào'}
          </button>
          <SectionNote>
            Hệ thống KHÔNG tự lấy MT1 làm điểm đầu vào. “Em vào học ở mức nào” là câu hỏi khác
            hẳn “bài Mock đầu tiên được mấy điểm”.
          </SectionNote>
        </div>
      )}
    </div>
  );
}
