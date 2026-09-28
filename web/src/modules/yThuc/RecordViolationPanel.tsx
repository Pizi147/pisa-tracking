import { useEffect, useMemo, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Hang2, Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ChonNgayGan } from '../../ui/ChonNgay.tsx';
import { BangChung } from '../../ui/BangChung.tsx';
import {
  VIOLATION_CATEGORIES, VIOLATION_CATEGORY_LABEL, VIOLATION_DESCRIPTION_MIN, VIOLATION_OTHER_DESCRIPTION_MIN,
  VIOLATION_SKILLS, VIOLATION_SKILL_LABEL, cauCanhBaoTrung, type ViolationCategory, dsLoi,
} from '@shared/domain/index.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';

/**
 * PANEL `GHI NHẬN VI PHẠM` (PR-UX3, N-4, mockup 15 §6) — GVBM/GVCN/QL ghi một sự việc.
 *
 * Cũng dùng để SỬA vi phạm (V09): truyền `violation` thì form nạp sẵn bốn trường sửa được và gọi PATCH thay vì POST; chân trái là
 * `Xoá vi phạm` (viền đỏ). Không hỏi mức độ, hạn, ai xử lý, biện pháp (V08) — ghi vi phạm không sinh gì khác.
 *
 * K2-6f (Q4) LƯU TRƯỚC, BẰNG CHỨNG SAU — như `QuickReport.tsx`: ghi mới xong panel KHÔNG đóng, chuyển sang bước "✓ Đã ghi" + Bằng
 * chứng; `Hoàn tác` xoá thẳng vi phạm vừa tạo (chưa nằm trong phương án nào). Lỗi chỉ hiện SAU khi bấm Lưu (`Còn thiếu: …`).
 */
export function RecordViolationPanel({
  open, onClose, studentId, studentName, lop, onDone, students, onPickStudent, violation, onDelete,
}: {
  open: boolean; onClose: () => void;
  studentId: number; studentName?: string;
  /** Mã lớp hiện ở đầu ngăn (`Ghi nhận vi phạm · Tên HV · MB-FOU 12`). */
  lop?: string | null;
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
  const lf = useLoiForm();
  /* K2-6f (Q4): ghi mới xong không đóng — chuyển sang bước "Đã ghi" + Bằng chứng. */
  const [daGhi, setDaGhi] = useState<{ id: number; studentName: string } | null>(null);
  const [xemTrung, setXemTrung] = useState(false);

  const idempotencyKey = useMemo(
    () => `violation:${studentId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    [studentId, open],
  );

  const reset = () => {
    setCategory('homework'); setSkill(''); setOccurredOn(today); setDescription(''); setDaChonMon(false);
    setDaGhi(null); setXemTrung(false); lf.datLai();
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
  /* Ô lỗi (YC-12.5.2): lý do dưới ô khi rời ô; chân "n ô cần sửa ↑" sau khi bấm Lưu. */
  const loi = dsLoi([
    ...(students && !editing ? [{ khoa: 'hoc-vien', nhan: 'Học viên', chon: true }] : []),
    { khoa: 'mo-ta', nhan: 'Mô tả', toiThieu: minLen },
  ], { 'hoc-vien': studentId, 'mo-ta': description });
  const thieu = loi.map((l) => l.nhan);

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
   * dong() DÙNG CHUNG cho ✕ / Esc / bấm nền / nút `Xong`:
   *   · Đã ghi → panel đóng THẬT, `onDone` chạy lúc này, VÀ toast Hoàn tác chung 5 giây (PR-N1 C1).
   *   · Chưa ghi (đang sửa, hoặc huỷ form ghi mới) → đóng như trước, không có gì để báo lại.
   */
  const dong = () => {
    if (daGhi) {
      const { id, studentName: sn } = daGhi;
      reset(); onClose(); onDone?.();
      /* `key` cố định — ghi hai vi phạm liên tiếp thì toast MỚI thay toast CŨ, không chồng hai toast Hoàn tác cùng lúc. */
      toast.hoanTac(`Đã ghi vi phạm cho ${sn}`, () => hoanTac(id), { key: 'ghi-vi-pham' });
    } else {
      onClose();
    }
  };

  const submit = async () => {
    lf.bam();
    if (thieu.length > 0) return;
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

  if (!open) return null;

  const tieuDe = editing ? 'Sửa vi phạm' : 'Ghi nhận vi phạm';
  const tenChon = (students ?? []).find((st) => st.id === studentId)?.name ?? studentName;

  if (daGhi) {
    return (
      <KhungPanel tieuDe={tieuDe} hocVien={daGhi.studentName} lop={lop} onDong={dong}
        chan={{
          huy: { nhan: 'Hoàn tác', onClick: hoanTacTrongPanel },
          chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={dong}>Xong</button>,
        }}>
        <Khoi tieuDe="Đã ghi">
          <p className="m-0 text-sm text-slate-200">✓ Đã ghi vi phạm cho {daGhi.studentName}</p>
        </Khoi>
        <Khoi tieuDe="Bằng chứng · không bắt buộc">
          <BangChung ownerType="violation" ownerId={daGhi.id} canEdit tieuDe="" />
        </Khoi>
      </KhungPanel>
    );
  }

  return (
    <KhungPanel tieuDe={tieuDe} hocVien={tenChon} lop={lop} onDong={dong}
      chan={{
        /* Sửa: chân trái là `Xoá vi phạm` (viền đỏ). Nơi gọi tự đóng form này và quyết định lúc nào mở lại panel trước đó. */
        xoa: editing && violation && onDelete ? { nhan: 'Xoá vi phạm', onClick: () => onDelete(violation.id) } : undefined,
        conThieu: lf.conThieu(loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={submit}>Lưu</button>,
      }}>
      <Khoi tieuDe="Vi phạm">
        {students && !editing && (
          <Truong nhan="Học viên" batBuoc loi={lf.loiCua(loi, 'hoc-vien')}>
            <select className="field w-full" {...lf.o(loi, 'hoc-vien')} value={studentId || ''} onChange={(e) => onPickStudent?.(Number(e.target.value) || 0)}>
              <option value="">Chọn học viên</option>
              {students.map((st) => <option key={st.id} value={st.id}>{st.name}{st.code ? ` · ${st.code}` : ''}</option>)}
            </select>
          </Truong>
        )}

        <Hang2>
          <Truong nhan="Ngày" batBuoc>
            <ChonNgayGan value={occurredOn} onChange={setOccurredOn} soNgay={21} />
          </Truong>
          <Truong nhan="Môn" phu={!daChonMon && defaultSkill ? 'Tự điền môn bạn dạy lớp này' : undefined}>
            <select className="field w-full" value={displaySkill} onChange={(e) => { setSkill(e.target.value); setDaChonMon(true); }}>
              <option value="">Chưa chọn</option>
              {VIOLATION_SKILLS.map((s) => <option key={s} value={s}>{VIOLATION_SKILL_LABEL[s] ?? s}</option>)}
            </select>
          </Truong>
        </Hang2>

        {/* Năm nhóm: danh sách hai hàng (≤ 4 nút/hàng), nút cao 44px ở điện thoại. */}
        <Truong nhan="Nhóm" batBuoc as="div">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {VIOLATION_CATEGORIES.map((c) => (
              <button key={c} type="button" aria-pressed={category === c}
                className={`btn min-h-[44px] justify-center sm:min-h-0 ${category === c ? 'btn-primary' : ''}`} onClick={() => setCategory(c)}>
                {VIOLATION_CATEGORY_LABEL[c as ViolationCategory]}
              </button>
            ))}
          </div>
        </Truong>

        <Truong nhan="Mô tả" batBuoc loi={lf.loiCua(loi, 'mo-ta')} dem={{ co: description.trim().length, can: minLen }}>
          <textarea className="field w-full" {...lf.o(loi, 'mo-ta')} rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Ví dụ: không nộp bài Reading buổi 12/09" />
        </Truong>

        {/* K2-6b (Q6): MỘT dòng vàng, không chặn Lưu — "Xem" mở ngay dưới dòng, không mở panel thứ hai. */}
        {cauTrung && (
          <div className="text-xs text-soon">
            <span>{cauTrung}</span>{' · '}
            <button type="button" className="link appearance-none border-0 bg-transparent p-0" aria-expanded={xemTrung} onClick={() => setXemTrung((v) => !v)}>Xem</button>
            {xemTrung && (
              <ul className="m-0 mt-1 list-none space-y-0.5 p-0 text-[11px] text-slate-400">
                {trungRows.map((r) => <li key={r.id}>{r.description} · {r.reportedByName ?? 'một giáo viên'} · {r.stateLabel}</li>)}
              </ul>
            )}
          </div>
        )}
      </Khoi>

      {editing && violation && (
        <Khoi tieuDe="Bằng chứng · không bắt buộc">
          <BangChung ownerType="violation" ownerId={violation.id} canEdit tieuDe="" />
        </Khoi>
      )}
    </KhungPanel>
  );
}
