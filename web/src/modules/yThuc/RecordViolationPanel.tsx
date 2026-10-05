import { useEffect, useMemo, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Hang2, Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ChonNgayGan } from '../../ui/ChonNgay.tsx';
import { BangChung } from '../../ui/BangChung.tsx';
import { OKhac } from '../../ui/OKhac.tsx';
import { NutChon } from '../../ui/ui.tsx';
import {
  VIOLATION_CATEGORIES, VIOLATION_CATEGORY_LABEL, VIOLATION_DESCRIPTION_MIN,
  monViPham, tenMon, cauCanhBaoTrung, type ViolationCategory, dsLoi, kiemGhiRoKhac, tachKhac, KHAC_TOI_THIEU,
} from '@shared/domain/index.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';

/**
 * PANEL `GHI VI PHẠM` (PR-UX3, N-4, mockup 15 §6; PR-YT4 T31 — "Ghi nhận" nay chỉ nghĩa "đã xem") — GVBM/GVCN/QL ghi một sự việc.
 * Nhóm KHÔNG chọn sẵn (K3-35): người ghi phải chọn, tránh mọi vi phạm thành BTVN vì quên đổi.
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
  /** Mã lớp hiện ở đầu ngăn (`Ghi vi phạm · Tên HV · MB FOU 12`). */
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
  const [category, setCategory] = useState<string>('');
  const [skill, setSkill] = useState<string>('');
  /* YT-4: người dùng đã đụng ô Môn chưa — chưa đụng thì môn tự điền không tính là một lựa chọn. */
  const [daChonMon, setDaChonMon] = useState(false);
  const [occurredOn, setOccurredOn] = useState(today);
  const [description, setDescription] = useState('');
  /* Nhóm "Khác" (T13): ô Ghi rõ ngay dưới. Không có cột riêng → máy chủ ghép "{ghi rõ} — {mô tả}" (Q9). Đổi nhóm vẫn giữ chữ đã gõ. */
  const [ghiRo, setGhiRo] = useState('');
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
    setCategory(''); setSkill(''); setOccurredOn(today); setDescription(''); setGhiRo(''); setDaChonMon(false);
    setDaGhi(null); setXemTrung(false); lf.datLai();
  };

  useEffect(() => {
    if (!open) return;
    if (violation) {
      setCategory(violation.category); setSkill(violation.skill ?? ''); setOccurredOn(violation.occurredOn);
      /* Sửa vi phạm "Khác" đã lưu "A — B": A về ô Ghi rõ, B về ô Mô tả — lưu lại gửi B + ghiRoKhac, không thành "A — A — B". */
      const t = violation.category === 'other' ? tachKhac(violation.description) : { ghiRo: '', moTa: violation.description };
      setGhiRo(t.ghiRo); setDescription(t.moTa); setDaChonMon(true);
    } else {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, violation?.id]);

  /* V06 — cảnh báo trùng mềm: cùng học viên, cùng nhóm, cùng ngày. Hỏi lại mỗi khi một trong ba đổi. Q6: KHÔNG chặn Lưu. */
  /* Hỏi cả khi đang sửa: cần `chuongTrinh` cho danh sách môn (K5-47); phần trùng chỉ dùng khi ghi mới. */
  const similarQ = studentId && category
    ? `/violations/similar?studentId=${studentId}&category=${category}${occurredOn ? `&occurredOn=${occurredOn}` : ''}`
    : null;
  const similar = useApi<{ rows: any[]; defaultSkill: string | null; chuongTrinh: string | null }>(similarQ, [studentId, category, occurredOn, editing]);
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
  const ct = similar.data?.chuongTrinh ?? null;
  const mon = monViPham(ct);
  /* Dữ liệu cũ (vd. `pronunciation`, W1 ở lớp thường) vẫn hiện đúng tên khi sửa, dù không còn trong danh sách chọn. */
  const dsMon = displaySkill && !mon.includes(displaySkill) ? [...mon, displaySkill] : mon;

  const minLen = VIOLATION_DESCRIPTION_MIN; /* PR-NEN: luật 30 ký tự của "Khác" đã bỏ (T13); "Khác" cần ô Ghi rõ ≥ 3. */
  const laNhomKhac = category === 'other';
  /*
   * Vi phạm "Khác" CŨ (trước T13: không có Ghi rõ, hoặc mô tả sau " — " ngắn) mà chưa đụng Ghi rõ/Mô tả (chỉ đổi ngày/môn): không bắt
   * luật nào của hai ô này, gửi lại đúng mô tả đang lưu, KHÔNG gửi ghiRoKhac → máy chủ không kiểm, không ghi lịch sử (sửa Task 2).
   */
  const goc = violation?.category === 'other' ? tachKhac(violation.description) : null;
  const chuaDung = !!goc && laNhomKhac && ghiRo === goc.ghiRo && description === goc.moTa;
  /* Ô lỗi (YC-12.5.2): lý do dưới ô khi rời ô; chân "n ô cần sửa ↑" sau khi bấm Lưu. */
  const loi = dsLoi([
    ...(students && !editing ? [{ khoa: 'hoc-vien', nhan: 'Học viên', chon: true }] : []),
    { khoa: 'nhom', nhan: 'Nhóm', chon: true },
    ...(laNhomKhac && !chuaDung ? [{ khoa: 'ghi-ro', nhan: 'Ghi rõ', toiThieu: KHAC_TOI_THIEU }] : []),
    ...(!chuaDung ? [{ khoa: 'mo-ta', nhan: 'Mô tả', toiThieu: minLen }] : []),
  ], { 'hoc-vien': studentId, nhom: category, 'ghi-ro': ghiRo, 'mo-ta': description });
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
        /* Luôn gửi cả nhóm + mô tả (máy chủ bỏ qua ghiRoKhac nếu không kèm hai trường này); ghiRoKhac CHỈ khi nhóm Khác. */
        await api.patch(`/violations/${violation.id}`, {
          category, skill: skill || null, occurredOn: occurredOn || undefined,
          ...(chuaDung ? { description: violation.description } : { description, ...(laNhomKhac ? { ghiRoKhac: ghiRo.trim() } : {}) }),
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
          ...(laNhomKhac ? { ghiRoKhac: ghiRo.trim() } : {}),
        });
        invalidate('/violations'); invalidate('/measures'); invalidate('/classes'); invalidate('/students'); invalidate('/y-thuc');
        /* K2-6f: KHÔNG đóng — chuyển sang bước "Đã ghi" + Bằng chứng. `onDone` chỉ chạy khi đóng thật (props không đổi). */
        setDaGhi({ id: res.violation.id, studentName: studentName ?? 'học viên' });
      }
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  if (!open) return null;

  const tieuDe = editing ? 'Sửa vi phạm' : 'Ghi vi phạm';
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
    /* I6 (PR-SL): một dòng chú thích dấu `*` thay cho "(bắt buộc)" lặp ở từng ô. */
    <KhungPanel tieuDe={tieuDe} hocVien={tenChon} lop={lop} onDong={dong}
      ngCanh={<><span aria-hidden className="text-bad">*</span> = bắt buộc</>}
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
          {/* Pre FOU không chia môn → ẩn ô Môn (K5-47). */}
          {dsMon.length > 0 && (
          <Truong nhan="Môn" phu={!daChonMon && defaultSkill ? 'Tự điền môn bạn dạy lớp này' : undefined}>
            <select className="field w-full" value={displaySkill} onChange={(e) => { setSkill(e.target.value); setDaChonMon(true); }}>
              <option value="">Chưa chọn</option>
              {dsMon.map((s) => <option key={s} value={s}>{tenMon(ct, s)}</option>)}
            </select>
          </Truong>
          )}
        </Hang2>

        {/* Năm nhóm: danh sách hai hàng (≤ 4 nút/hàng), nút cao 44px ở điện thoại. */}
        <Truong nhan="Nhóm" batBuoc as="div" loi={lf.loiCua(loi, 'nhom')}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" {...lf.o(loi, 'nhom')}>
            {VIOLATION_CATEGORIES.map((c) => (
              <NutChon key={c} chon={category === c} className="justify-center" onClick={() => setCategory(c)}>
                {VIOLATION_CATEGORY_LABEL[c as ViolationCategory]}
              </NutChon>
            ))}
          </div>
          <OKhac hien={laNhomKhac} value={ghiRo} onChange={setGhiRo}
            id={lf.oId('ghi-ro')} onBlur={lf.roi('ghi-ro')} loi={lf.hien('ghi-ro') ? kiemGhiRoKhac(ghiRo) : null} khongBaoLoi={chuaDung} />
        </Truong>

        <Truong nhan="Mô tả" batBuoc loi={lf.loiCua(loi, 'mo-ta')} dem={{ co: description.trim().length, can: minLen }}>
          <textarea className="field w-full" {...lf.o(loi, 'mo-ta')} rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Ví dụ: không nộp bài Reading buổi 12/09" />
        </Truong>

        {/* K2-6b (Q6): MỘT dòng vàng, không chặn Lưu — "Xem" mở ngay dưới dòng, không mở panel thứ hai. */}
        {cauTrung && (
          <div className="text-xs text-soon">
            <span>{cauTrung}</span>{' · '}
            {/* I6: "Xem" nằm cùng dòng chữ (không inline-flex cao 44 px đẩy lệch dòng); vùng bấm điện thoại giữ ≥ 44 px bằng đệm âm. */}
            <button type="button" className="link appearance-none border-0 bg-transparent p-0 align-baseline max-sm:-my-3 max-sm:py-3" aria-expanded={xemTrung} onClick={() => setXemTrung((v) => !v)}>Xem</button>
            {xemTrung && (
              <ul className="m-0 mt-1.5 list-none space-y-0.5 p-0 text-[11px] text-slate-400">
                {trungRows.map((r) => <li key={r.id}>{r.description} · {r.reportedByName ?? 'một giáo viên'} · {r.nhanTrangThai}</li>)}
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
