import { useEffect, useMemo, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Modal } from '../../ui/Drawer.tsx';
import { Field } from '../../ui/ui.tsx';
import { BangChung } from '../../ui/BangChung.tsx';
import {
  VIOLATION_CATEGORIES, VIOLATION_CATEGORY_LABEL, VIOLATION_DESCRIPTION_MIN, VIOLATION_OTHER_DESCRIPTION_MIN,
  VIOLATION_SKILLS, VIOLATION_SKILL_LABEL, cauCanhBaoTrung, type ViolationCategory,
} from '@shared/domain/index.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';

/**
 * PANEL `GHI VI PHẠM` (bố cục mockup 09c khối trái, kế hoạch PR-YT2 Task 4) — GVBM/GVCN/QL ghi một sự việc.
 *
 * Cũng dùng để SỬA vi phạm (V09): truyền `violation` thì form nạp sẵn bốn trường sửa được và gọi PATCH thay vì POST.
 * Không hỏi mức độ, không hỏi hạn, không hỏi ai xử lý, không hỏi biện pháp (V08) — ghi vi phạm không sinh gì khác.
 *
 * K2-6f (Q4) LƯU TRƯỚC, BẰNG CHỨNG SAU — như `QuickReport.tsx` cho Case: ghi mới xong panel KHÔNG đóng, chuyển sang
 * bước "✓ Đã ghi" + khối Bằng chứng; `Hoàn tác` xoá thẳng vi phạm vừa tạo (chưa nằm trong phương án nào, xoá được).
 */
export function RecordViolationPanel({
  open, onClose, studentId, studentName, onDone, students, onPickStudent, violation, onDelete,
}: {
  open: boolean; onClose: () => void;
  studentId: number; studentName?: string;
  onDone?: () => void;
  /** Mở từ trang lớp: chọn học viên ngay ở đầu form (như QuickReport). */
  students?: { id: number; name: string; code?: string | null }[];
  onPickStudent?: (id: number) => void;
  /** Có giá trị = đang SỬA vi phạm này, không phải ghi mới. */
  violation?: {
    id: number; category: string; skill: string | null; occurredOn: string; description: string;
  } | null;
  /** Xoá vi phạm đang SỬA (PR-HV, spec §4.3: xoá nằm trong form sửa) — nơi gọi mở hộp xác nhận một dòng. Chỉ hiện khi đang sửa. */
  onDelete?: (violationId: number) => void;
}) {
  const toast = useToast();
  const { homNay: today } = useNgayNghiepVu();
  const editing = !!violation;
  const [category, setCategory] = useState<string>('homework');
  const [skill, setSkill] = useState<string>('');
  /* YT-4: người dùng đã đụng ô Môn chưa — chưa đụng thì môn tự điền không tính là một lựa chọn. */
  const [daChonMon, setDaChonMon] = useState(false);
  const [occurredOn, setOccurredOn] = useState(today);
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  /* K2-6f (Q4): ghi mới xong không đóng — chuyển sang bước "Đã ghi" + Bằng chứng. */
  const [daGhi, setDaGhi] = useState<{ id: number; studentName: string } | null>(null);
  const [xemTrung, setXemTrung] = useState(false);

  const idempotencyKey = useMemo(
    () => `violation:${studentId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    [studentId, open],
  );

  const reset = () => {
    setCategory('homework'); setSkill(''); setOccurredOn(today); setDescription(''); setDaChonMon(false);
    setDaGhi(null); setXemTrung(false);
  };

  useEffect(() => {
    if (!open) return;
    if (violation) {
      setCategory(violation.category); setSkill(violation.skill ?? ''); setOccurredOn(violation.occurredOn);
      setDescription(violation.description); setDaChonMon(true);
    } else {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, violation?.id]);

  /* V06 — cảnh báo trùng mềm: cùng học viên, cùng nhóm, cùng ngày. Hỏi lại mỗi khi một trong ba đổi. Q6: KHÔNG chặn Lưu. */
  const similarQ = studentId && category && !editing
    ? `/violations/similar?studentId=${studentId}&category=${category}${occurredOn ? `&occurredOn=${occurredOn}` : ''}`
    : null;
  const similar = useApi<{ rows: any[]; defaultSkill: string | null }>(similarQ, [studentId, category, occurredOn, editing]);
  useEffect(() => { setXemTrung(false); }, [category, occurredOn, studentId]);
  const trungRows = !editing ? (similar.data?.rows ?? []) : [];
  const cauTrung = cauCanhBaoTrung(trungRows, today);

  /*
   * YT-4: chưa đụng ô Môn mà máy chủ biết bạn dạy đúng một môn ở lớp này → điền sẵn, để người dùng thấy trước khi lưu.
   * TÍNH TRỰC TIẾP (không qua `useEffect` + `setSkill`): ô chọn hiện `defaultSkill` cho tới khi người dùng thật sự đụng
   * vào nó (`daChonMon`) — tránh việc effect ghi đè `skill` không đúng lúc khi `similar` chạy lại (đổi ngày/nhóm).
   */
  const defaultSkill = editing ? null : (similar.data?.defaultSkill ?? null);
  const displaySkill = daChonMon ? skill : (defaultSkill ?? skill);

  const minLen = category === 'other' ? VIOLATION_OTHER_DESCRIPTION_MIN : VIOLATION_DESCRIPTION_MIN;
  /* K2-3: ràng buộc nói TRƯỚC khi bấm — nút mờ + câu thiếu gì, không báo lỗi đỏ sau khi bấm. */
  const missing = !studentId ? 'Chọn học viên.'
    : description.trim().length < minLen ? `Mô tả cần ít nhất ${minLen} ký tự — nói rõ em đã làm gì, ở buổi nào.`
    : null;

  const hoanTac = async (id: number) => {
    try {
      await api.del(`/violations/${id}`);
      invalidate('/violations'); invalidate('/measures'); invalidate('/classes'); invalidate('/students'); invalidate('/y-thuc');
      toast.push('ok', 'Đã hoàn tác');
    } catch (e: any) { toast.push('error', e.message); }
  };

  /* Bấm `Hoàn tác` NGAY TRONG panel (chân bước "Đã ghi") — không hiện thêm toast 10 giây (đằng nào cũng đã hoàn tác). */
  const hoanTacTrongPanel = async () => {
    if (!daGhi) return;
    const id = daGhi.id;
    reset(); onClose();
    await hoanTac(id);
    onDone?.();
  };

  /*
   * dong() DÙNG CHUNG cho ✕ / Esc / bấm nền / nút `Xong` (như `QuickReport.tsx:145-154`):
   *   · Đã ghi → panel đóng THẬT, `onDone` chạy lúc này, VÀ toast 10 giây có nút `Hoàn tác`.
   *   · Chưa ghi (đang sửa, hoặc huỷ form ghi mới) → đóng như trước, không có gì để báo lại.
   */
  const dong = () => {
    if (daGhi) {
      const { id, studentName: sn } = daGhi;
      reset(); onClose(); onDone?.();
      /* `key` cố định — ghi hai vi phạm liên tiếp thì toast MỚI thay toast CŨ, không chồng hai toast Hoàn tác cùng lúc. */
      toast.push('info', `Đã ghi vi phạm cho ${sn}`, { ms: 10000, hanhDong: { nhan: 'Hoàn tác', onBam: () => hoanTac(id) }, key: 'ghi-vi-pham' });
    } else {
      onClose();
    }
  };

  const submit = async () => {
    if (missing) return;
    setBusy(true);
    try {
      if (editing && violation) {
        await api.patch(`/violations/${violation.id}`, {
          category, skill: skill || null, occurredOn: occurredOn || undefined, description,
        });
        invalidate('/violations'); invalidate('/measures'); invalidate('/classes'); invalidate('/students'); invalidate('/y-thuc');
        toast.push('ok', 'Đã lưu vi phạm');
        onDone?.(); onClose();
      } else {
        const res = await api.post<{ violation: { id: number } }>('/violations', {
          studentId, category,
          /* YT-4: chưa đụng ô Môn thì không gửi trường này — máy chủ tự điền. Đã đụng thì gửi đúng giá trị, kể cả rỗng (chủ ý để trống). */
          ...(daChonMon ? { skill: skill || null } : {}),
          occurredOn: occurredOn || undefined, description, idempotencyKey,
        });
        invalidate('/violations'); invalidate('/measures'); invalidate('/classes'); invalidate('/students'); invalidate('/y-thuc');
        /* K2-6f: KHÔNG đóng — chuyển sang bước "Đã ghi" + Bằng chứng. `onDone` chỉ chạy khi đóng thật (props không đổi). */
        setDaGhi({ id: res.violation.id, studentName: studentName ?? 'học viên' });
      }
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={dong}
      title={editing ? 'Sửa vi phạm' : `Ghi nhận vi phạm${studentName ? ` · ${studentName}` : ''}`}
      footer={
        daGhi ? (
          <>
            <button className="btn btn-ghost mr-auto" onClick={hoanTacTrongPanel}>Hoàn tác</button>
            <button className="btn btn-primary" onClick={dong}>Xong</button>
          </>
        ) : (
          <>
            {editing && violation && onDelete && (
              /* Chỉ gọi onDelete — nơi gọi (usePanelYThuc) tự đóng form này VÀ quyết định lúc nào mở lại panel trước đó (sau khi hộp xác nhận xoá đóng), không phải ở đây. */
              <button className="btn btn-ghost text-rose-200 mr-auto" onClick={() => onDelete(violation.id)}>Xoá vi phạm</button>
            )}
            <button className="btn" onClick={dong}>Huỷ</button>
            <button className="btn btn-primary" disabled={busy || !!missing} title={missing ?? undefined} onClick={submit}>Lưu</button>
          </>
        )
      }>
      {daGhi ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-400 m-0">✓ Đã ghi vi phạm cho {daGhi.studentName}</p>
          <BangChung ownerType="violation" ownerId={daGhi.id} canEdit tieuDe="Bằng chứng" />
        </div>
      ) : (
      <div className="space-y-3">
        {students && !editing && (
          <Field label="Học viên" required>
            <select className="field" value={studentId || ''}
              onChange={(e) => onPickStudent?.(Number(e.target.value) || 0)}>
              <option value="">Chọn học viên…</option>
              {students.map((st) => (
                <option key={st.id} value={st.id}>{st.name}{st.code ? ` · ${st.code}` : ''}</option>
              ))}
            </select>
          </Field>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Field label="Ngày xảy ra" required>
            <input type="date" className="field" value={occurredOn} max={today}
              onChange={(e) => setOccurredOn(e.target.value)} />
          </Field>
          <Field label="Môn">
            <select className="field" value={displaySkill} onChange={(e) => { setSkill(e.target.value); setDaChonMon(true); }}>
              <option value="">— để trống —</option>
              {VIOLATION_SKILLS.map((s) => (
                <option key={s} value={s}>{VIOLATION_SKILL_LABEL[s] ?? s}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Nhóm vi phạm" required>
          <div className="flex gap-1 flex-wrap">
            {VIOLATION_CATEGORIES.map((c) => (
              <button key={c} type="button" className={`btn btn-sm ${category === c ? 'btn-primary' : ''}`}
                onClick={() => setCategory(c)}>
                {VIOLATION_CATEGORY_LABEL[c as ViolationCategory]}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Mô tả" required>
          <textarea className="field" rows={3} value={description} autoFocus
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Không nộp bài Writing Task 2 buổi 21/09" />
        </Field>

        {editing && violation && (
          <Field label="Bằng chứng" as="div">
            <BangChung ownerType="violation" ownerId={violation.id} canEdit tieuDe="" />
          </Field>
        )}

        {/* K2-6b (Q6): một dòng nhỏ, không chặn Lưu — "Xem" mở ngay dưới dòng, không mở panel thứ hai. */}
        {cauTrung && (
          <div className="text-xs text-amber-200/90">
            <span>{cauTrung}</span>{' · '}
            <button type="button" className="text-sky-300 hover:underline" aria-expanded={xemTrung} onClick={() => setXemTrung((v) => !v)}>
              Xem
            </button>
            {xemTrung && (
              <ul className="list-none p-0 m-0 mt-1 space-y-0.5 text-[11px] text-slate-400">
                {trungRows.map((r) => (
                  <li key={r.id}>{r.description} · {r.reportedByName ?? 'một giáo viên'} · {r.stateLabel}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {missing && <p className="text-xs text-amber-200/90 m-0">{missing}</p>}
      </div>
      )}
    </Modal>
  );
}
