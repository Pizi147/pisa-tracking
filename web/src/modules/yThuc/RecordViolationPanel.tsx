import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../../lib/api.ts';
import { lamMoiYThuc as lamMoiCache } from './kieu.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Hang2, Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { BangChung } from '../../ui/BangChung.tsx';
import { TepCho, taiTepCho, type TepChoMuc } from '../../ui/TepCho.tsx';
import { NutChon } from '../../ui/ui.tsx';
import {
  VIOLATION_CATEGORIES, VIOLATION_CATEGORY_LABEL, VI_PHAM_TEN_TOI_DA, VI_PHAM_TOI_DA_DONG, LO_GHI_VI_PHAM, TOI_DA_EM_GHI_VI_PHAM,
  monViPham, tenMon, cauCanhBaoTrung, chiaLo, dsLoiGhiViPham, type LoiTruong, type ViolationCategory,
} from '@shared/domain/index.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { dich, t } from '@shared/i18n/index.ts';

/**
 * PANEL `GHI VI PHẠM` (PR-LUI-a1, mockup 06/10) — MỘT bước: nhập, đính bằng chứng, bấm Lưu một lần. Không còn bước "Đã ghi" + Hoàn tác (đã có Sửa / Xoá).
 *
 *   · Mở từ hồ sơ LỚP (`students`): chọn một hoặc nhiều học viên → MỘT vi phạm chung (mô tả riêng từng em: `+ Mô tả riêng`).
 *   · Mở từ hồ sơ học viên: một em, tối đa `VI_PHAM_TOI_DA_DONG` dòng (`+ Thêm vi phạm`), mỗi dòng ngày / môn / nhóm riêng.
 *   · Mỗi vi phạm: `Vi phạm` (ngắn, bắt buộc) + `Mô tả` (không bắt buộc, mở sẵn). Nhóm KHÔNG chọn sẵn (K3-35).
 *   · Bằng chứng chọn ngay trong form (`TepCho`), tải SAU khi vi phạm đã có id — lỗi tải tệp không làm mất vi phạm (panel ở lại chỗ tệp lỗi).
 *   · Lưu gửi lô `LO_GHI_VI_PHAM` em; lỗi giữa chừng giữ phần đã lưu (`Thử lại n học viên` chỉ gửi em còn lại, cùng khoá chống trùng).
 *
 * Cũng dùng để SỬA vi phạm (V09): truyền `violation` → nạp sẵn, PATCH thay vì POST, chân trái `Xoá vi phạm` (viền đỏ), Bằng chứng = `BangChung`.
 */
type Dong = { key: number; ngay: string; mon: string; daChonMon: boolean; nhom: string; ten: string; moTa: string };
type Luu = { daXong: number[]; ids: number[]; loi: Record<number, string>; tien: [number, number] | null };
type NguoiChon = { id: number; name: string; code?: string | null };

const moiDong = (key: number, ngay: string): Dong => ({ key, ngay, mon: '', daChonMon: false, nhom: '', ten: '', moTa: '' });

export function RecordViolationPanel({
  open, onClose, studentId, studentName, lop, onDone, students, violation, onDelete,
}: {
  open: boolean; onClose: () => void;
  studentId: number; studentName?: string;
  /** Mã lớp hiện ở đầu ngăn (`Ghi vi phạm · Tên HV · MB FOU 12`). */
  lop?: string | null;
  onDone?: () => void;
  /** Mở từ trang lớp: danh sách lớp — chọn một hoặc nhiều học viên ngay trong form. Không truyền = một học viên (`studentId`). */
  students?: NguoiChon[];
  /** Có giá trị = đang SỬA vi phạm này, không phải ghi mới. */
  violation?: {
    id: number; category: string; skill: string | null; occurredOn: string; ten: string; moTa: string;
  } | null;
  /** Xoá vi phạm đang SỬA (PR-HV, spec §4.3: xoá nằm trong form sửa) — nơi gọi mở hộp xác nhận một dòng. Chỉ hiện khi đang sửa. */
  onDelete?: (violationId: number) => void;
}) {
  const toast = useToast();
  const { homNay: today } = useNgayNghiepVu();
  const editing = !!violation;
  const chonNhieu = !!students && !editing;
  const lf = useLoiForm();
  const [hocVien, setHocVien] = useState<number[]>([]);
  const [moTaRieng, setMoTaRieng] = useState<Record<number, string>>({});
  const [dong, setDong] = useState<Dong[]>([moiDong(1, today)]);
  const [tep, setTep] = useState<TepChoMuc[]>([]);
  const [busy, setBusy] = useState(false);
  /** Lưu dở giữa các lô: ô nhập khoá, hiện em chưa lưu + `Thử lại n học viên`. */
  const [luu, setLuu] = useState<Luu | null>(null);
  /** Vi phạm đã lưu xong nhưng tệp lỗi: panel ở lại, chỉ còn khối `Đã ghi` + tệp. */
  const [daGhi, setDaGhi] = useState<{ ids: number[]; cau: string } | null>(null);

  const idempotencyKey = useMemo(() => `violation:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`, [open]);

  const reset = () => {
    setHocVien(studentId ? [studentId] : []); setMoTaRieng({}); setDong([moiDong(1, today)]); setTep([]);
    setLuu(null); setDaGhi(null); lf.datLai();
  };

  useEffect(() => {
    if (!open) return;
    if (violation) {
      setHocVien([studentId]); setMoTaRieng({}); setTep([]); setLuu(null); setDaGhi(null);
      setDong([{ key: 1, ngay: violation.occurredOn, mon: violation.skill ?? '', daChonMon: true, nhom: violation.category, ten: violation.ten, moTa: violation.moTa }]);
    } else {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, violation?.id]);

  /* Môn tự điền (V04) + danh sách môn theo chương trình lớp (K5-47): hỏi theo em ĐẦU TIÊN (cả lớp cùng chương trình). */
  const sid0 = hocVien[0] ?? 0;
  const similar = useApi<{ defaultSkill: string | null; chuongTrinh: string | null }>(
    open && sid0 ? `/violations/similar?studentId=${sid0}&category=${dong[0]?.nhom || 'attendance'}` : null, [sid0, dong[0]?.nhom, open]);
  const defaultSkill = editing ? null : (similar.data?.defaultSkill ?? null);
  const ct = similar.data?.chuongTrinh ?? null;

  const loi: LoiTruong[] = [
    ...dsLoiGhiViPham({ hocVien, dong }),
    ...(tep.some((m) => m.loi && !m.daGui) ? [{ khoa: 'tep', nhan: t('Tệp'), lyDo: t('Bỏ tệp lỗi') }] : []),
  ];

  const tenCua = (id: number) => students?.find((s) => s.id === id)?.name ?? (id === studentId ? studentName : undefined) ?? t('học viên');
  const tenChon = hocVien.length === 1 ? tenCua(hocVien[0]) : hocVien.length > 1 ? t('{length} học viên', { length: hocVien.length }) : undefined;
  const nDong = dong.length;
  const tomTat = hocVien.length === 1
    ? t('Đã ghi {x} cho {tenCua}', { x: nDong > 1 ? t('{nDong} vi phạm', { nDong }) : t('vi phạm'), tenCua: tenCua(hocVien[0]) })
    : t('Đã ghi vi phạm cho {length} học viên', { length: hocVien.length });

  const suaDong = (key: number, v: Partial<Dong>) => setDong((ds) => ds.map((d) => (d.key === key ? { ...d, ...v } : d)));
  const themDong = () => setDong((ds) => [...ds, moiDong(Math.max(...ds.map((d) => d.key)) + 1, ds[ds.length - 1].ngay)]);

  const xongHan = (cau: string) => {
    lamMoiCache(); reset(); onClose(); onDone?.();
    toast.push('ok', cau);
  };

  /** Tải tệp chờ vào các vi phạm vừa tạo; xong hết thì đóng + toast, lỗi thì ở lại chỗ tệp lỗi. */
  const taiTep = async (ids: number[], cau: string, ds: TepChoMuc[]) => {
    const kq = ds.some((m) => !m.xong) ? await taiTepCho(ds, { ownerType: 'violation', ownerIds: ids }) : ds;
    setTep(kq);
    if (kq.every((m) => m.xong)) xongHan(cau);
    else { lamMoiCache(); setLuu(null); setDaGhi({ ids, cau }); }
  };

  const guiLo = async (): Promise<{ daXong: number[]; ids: number[]; loi: Record<number, string> }> => {
    const daXong = [...(luu?.daXong ?? [])]; const ids = [...(luu?.ids ?? [])]; const loiMoi: Record<number, string> = {};
    const lines = dong.map((d) => ({ category: d.nhom, occurredOn: d.ngay || undefined, ten: d.ten.trim(), moTa: d.moTa.trim(),
      /* YT-4: chưa đụng ô Môn thì không gửi trường này — máy chủ tự điền. Đã đụng thì gửi đúng giá trị, kể cả rỗng (chủ ý để trống). */
      ...(d.daChonMon ? { skill: d.mon || null } : {}) }));
    const con = hocVien.filter((s) => !daXong.includes(s));
    if (hocVien.length === 1 && lines.length === 1) {
      const { moTa, ...l } = lines[0];
      const res = await api.post<{ violation: { id: number } }>('/violations', { studentId: con[0], ...l, description: moTa, idempotencyKey });
      return { daXong: [con[0]], ids: [res.violation.id], loi: {} };
    }
    let loiChung: string | null = null;
    for (const lo of chiaLo(con, LO_GHI_VI_PHAM)) {
      setLuu({ daXong, ids, loi: {}, tien: [daXong.length, hocVien.length] });
      try {
        const r = await api.post<{ ok: { studentId: number; ids: number[] }[]; loi: { studentId: number; loi: string }[] }>('/violations/nhieu', {
          studentIds: lo, lines, idempotencyKey,
          moTaRieng: Object.fromEntries(lo.filter((s) => moTaRieng[s]?.trim()).map((s) => [s, moTaRieng[s].trim()])),
        });
        for (const o of r.ok) { daXong.push(o.studentId); ids.push(...o.ids); }
        for (const l of r.loi) loiMoi[l.studentId] = l.loi;
      } catch (e: any) {
        /* Lỗi 4xx khi CHƯA lưu được em nào (nội dung bị từ chối): báo toast, ô vẫn sửa được — không vào "lưu dở" (Thử lại sẽ lặp mãi). */
        if (daXong.length === 0 && e?.status >= 400 && e.status < 500) throw e;
        loiChung = e.message; break;
      }
    }
    for (const s of con) if (!daXong.includes(s) && !loiMoi[s]) loiMoi[s] = loiChung ?? t('Chưa lưu học viên này.');
    return { daXong, ids, loi: loiMoi };
  };

  const submit = async () => {
    lf.bam();
    if (loi.length > 0) return;
    setBusy(true);
    try {
      if (editing && violation) {
        const d = dong[0];
        await api.patch(`/violations/${violation.id}`, { category: d.nhom, skill: d.mon || null, occurredOn: d.ngay || undefined, ten: d.ten.trim(), description: d.moTa.trim() });
        lamMoiCache();
        toast.push('ok', t('Đã lưu vi phạm'));
        onDone?.(); onClose();
        return;
      }
      const kq = await guiLo();
      if (Object.keys(kq.loi).length) { lamMoiCache(); setLuu({ ...kq, tien: null }); return; }
      await taiTep(kq.ids, tomTat, tep);
    } catch (e: any) { toast.push('error', e.message); setLuu(null); } finally { setBusy(false); }
  };

  const thuLaiTep = async () => {
    if (!daGhi) return;
    setBusy(true);
    try { await taiTep(daGhi.ids, daGhi.cau, tep); } finally { setBusy(false); }
  };

  /* ✕ / Esc / nền / `Xong`: đã lưu (dở hoặc tệp lỗi) thì làm mới danh sách; đã ghi mà tệp lỗi thì báo kết quả. */
  const dongPanel = () => {
    if (daGhi) { lamMoiCache(); toast.push('ok', daGhi.cau); onClose(); onDone?.(); return; }
    if (luu?.daXong.length) { lamMoiCache(); onClose(); onDone?.(); return; }
    onClose();
  };

  if (!open) return null;

  const tieuDe = editing ? t('Sửa vi phạm') : t('Ghi vi phạm');

  if (daGhi) {
    return (
      <KhungPanel tieuDe={tieuDe} hocVien={tenChon} lop={lop} onDong={dongPanel}
        chan={{ huy: { nhan: t('Xong'), onClick: dongPanel } }}>
        <Khoi tieuDe={t('Đã ghi')}><p className="m-0 text-sm text-slate-200">✓ {daGhi.cau}</p></Khoi>
        <Khoi tieuDe={t('Bằng chứng')}><TepCho value={tep} onChange={setTep} khoa={busy} onThuLai={() => void thuLaiTep()} /></Khoi>
      </KhungPanel>
    );
  }

  const chuaLuu = luu ? hocVien.filter((s) => !luu.daXong.includes(s)) : [];
  const khoa = busy || !!luu;
  const nhan = busy ? (luu?.tien ? t('Đang lưu {x}/{x2}…', { x: luu.tien[0], x2: luu.tien[1] }) : t('Đang lưu…')) : t('Lưu');

  return (
    /* I6 (PR-SL): một dòng chú thích dấu `*` thay cho "(bắt buộc)" lặp ở từng ô. */
    <KhungPanel tieuDe={tieuDe} hocVien={tenChon} lop={lop} onDong={dongPanel}
      ngCanh={<><span aria-hidden className="text-bad">*</span> {t('= bắt buộc')}</>}
      chan={{
        /* Sửa: chân trái là `Xoá vi phạm` (viền đỏ). Nơi gọi tự đóng form này và quyết định lúc nào mở lại panel trước đó. */
        xoa: editing && violation && onDelete ? { nhan: t('Xoá vi phạm'), onClick: () => onDelete(violation.id) } : undefined,
        daSua: !editing && (dong.some((d) => d.ten || d.moTa || d.nhom) || tep.length > 0),
        huy: luu ? { nhan: t('Đóng'), onClick: dongPanel, disabled: busy } : undefined,
        conThieu: lf.conThieu(loi),
        phu: luu && !luu.tien ? <span className="text-xs text-slate-400">{t('Đã lưu {length} học viên · {length2} học viên chưa lưu', { length: luu.daXong.length, length2: chuaLuu.length })}</span> : undefined,
        chinh: luu && !busy
          ? <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={submit}>{t('Thử lại {length} học viên', { length: chuaLuu.length })}</button>
          : <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={submit}>{nhan}</button>,
      }}>
      {luu && !luu.tien && chuaLuu.length > 0 && (
        <Khoi tieuDe={t('Chưa lưu · {length}', { length: chuaLuu.length })}>
          <ul className="m-0 list-none space-y-1.5 p-0 text-sm">
            {chuaLuu.slice(0, 3).map((s) => (
              <li key={s}><span className="text-slate-200">{tenCua(s)}</span><span className="block text-xs text-late">{luu.loi[s]}</span></li>
            ))}
            {chuaLuu.length > 3 && <li className="text-xs text-slate-400">{t('và {x} học viên khác', { x: chuaLuu.length - 3 })}</li>}
          </ul>
        </Khoi>
      )}

      <fieldset disabled={khoa} className="m-0 min-w-0 space-y-3.5 border-0 p-0">
        {chonNhieu && !luu && (
          <Khoi tieuDe={t('Học viên')}>
            <ChonHocVien ds={students!} chon={hocVien} onChange={setHocVien} loi={lf.loiCua(loi, 'hoc-vien')} lf={lf} loiList={loi}
              rieng={moTaRieng} onRieng={setMoTaRieng} />
          </Khoi>
        )}

        <Khoi tieuDe={t('Vi phạm')}>
          {dong.map((d, k) => (
            <DongViPham key={d.key} d={d} k={k} nhieu={nDong > 1} today={today} ct={ct} defaultSkill={defaultSkill} editing={editing}
              sid={hocVien.length === 1 ? hocVien[0] : 0} loi={loi} lf={lf} onSua={(v) => suaDong(d.key, v)}
              onXoa={() => setDong((ds) => ds.filter((x) => x.key !== d.key))} />
          ))}
          {!editing && hocVien.length <= 1 && nDong < VI_PHAM_TOI_DA_DONG && (
            <button type="button" className="btn btn-sm btn-ghost self-start" onClick={themDong}>{t('+ Thêm vi phạm')}</button>
          )}
        </Khoi>

        {!luu && (editing && violation ? (
          <Khoi tieuDe={t('Bằng chứng · không bắt buộc')}><BangChung ownerType="violation" ownerId={violation.id} canEdit tieuDe="" /></Khoi>
        ) : (
          <Khoi tieuDe={t('Bằng chứng · không bắt buộc')}>
            <div id={lf.oId('tep')} tabIndex={-1}><TepCho value={tep} onChange={setTep} /></div>
          </Khoi>
        ))}
      </fieldset>
    </KhungPanel>
  );
}

/** Một dòng vi phạm: Ngày · Môn · Nhóm · Vi phạm (đếm n/60) · Mô tả (mở sẵn). Nhiều dòng: tiêu đề `Vi phạm n` + `Xoá dòng`. */
function DongViPham({ d, k, nhieu, today, ct, defaultSkill, editing, sid, loi, lf, onSua, onXoa }: {
  d: Dong; k: number; nhieu: boolean; today: string; ct: string | null; defaultSkill: string | null; editing: boolean;
  /** Một học viên (không sửa): hỏi cảnh báo trùng theo nhóm + ngày của DÒNG này. 0 = nhiều học viên, không hỏi. */
  sid: number; loi: readonly LoiTruong[]; lf: ReturnType<typeof useLoiForm>;
  onSua: (v: Partial<Dong>) => void; onXoa: () => void;
}) {
  const [xemTrung, setXemTrung] = useState(false);
  const n = k + 1;
  const trung = useApi<{ rows: any[] }>(!editing && sid && d.nhom ? `/violations/similar?studentId=${sid}&category=${d.nhom}${d.ngay ? `&occurredOn=${d.ngay}` : ''}` : null, [sid, d.nhom, d.ngay, editing]);
  useEffect(() => { setXemTrung(false); }, [d.nhom, d.ngay, sid]);
  const trungRows = !editing && sid ? (trung.data?.rows ?? []) : [];
  const cauTrung = cauCanhBaoTrung(trungRows, today);

  const mon = monViPham(ct);
  const displaySkill = d.daChonMon ? d.mon : (defaultSkill ?? d.mon);
  /* Dữ liệu cũ (vd. `pronunciation`, W1 ở lớp thường) vẫn hiện đúng tên khi sửa, dù không còn trong danh sách chọn. */
  const dsMon = displaySkill && !mon.includes(displaySkill) ? [...mon, displaySkill] : mon;

  return (
    <div className="space-y-3">
      {nhieu && (
        <div className="flex items-center justify-between gap-2">
          <h4 className="m-0 text-xs font-bold text-slate-200">{t('Vi phạm {n}', { n })}</h4>
          <button type="button" className="btn btn-sm btn-ghost" onClick={onXoa}>{t('Xoá dòng')}</button>
        </div>
      )}
      <Hang2>
        <Truong nhan={t('Ngày')} batBuoc>
          <ONgay kieu="ngay" value={d.ngay} onChange={(v) => onSua({ ngay: v })} toiDa={today} />
        </Truong>
        {/* Pre FOU không chia môn → ẩn ô Môn (K5-47). */}
        {dsMon.length > 0 && (
          <Truong nhan={t('Môn')} phu={!d.daChonMon && defaultSkill ? t('Tự điền môn bạn dạy lớp này') : undefined}>
            <select className="field w-full" value={displaySkill} onChange={(e) => onSua({ mon: e.target.value, daChonMon: true })}>
              <option value="">{t('Chưa chọn')}</option>
              {dsMon.map((s) => <option key={s} value={s}>{tenMon(ct, s)}</option>)}
            </select>
          </Truong>
        )}
      </Hang2>

      {/* Năm nhóm: danh sách hai hàng (≤ 4 nút/hàng), nút cao 44px ở điện thoại. */}
      <Truong nhan={t('Nhóm')} batBuoc as="div" loi={lf.loiCua(loi, `nhom-${n}`)}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" {...lf.o(loi, `nhom-${n}`)}>
          {VIOLATION_CATEGORIES.map((c) => (
            <NutChon key={c} chon={d.nhom === c} className="justify-center" onClick={() => onSua({ nhom: c })}>
              {VIOLATION_CATEGORY_LABEL[c as ViolationCategory]}
            </NutChon>
          ))}
        </div>
      </Truong>

      <Truong nhan={t('Vi phạm')} batBuoc loi={lf.loiCua(loi, `ten-${n}`)} dem={{ co: d.ten.trim().length, can: VI_PHAM_TEN_TOI_DA }}>
        <input className="field w-full" {...lf.o(loi, `ten-${n}`)} maxLength={VI_PHAM_TEN_TOI_DA} value={d.ten} onChange={(e) => onSua({ ten: e.target.value })}
          placeholder={t('Ví dụ: Không nộp BTVN Reading')} />
      </Truong>

      <Truong nhan={t('Mô tả')} tuyChon>
        <textarea className="field w-full" rows={2} maxLength={2000} value={d.moTa} onChange={(e) => onSua({ moTa: e.target.value })} placeholder={t('Chi tiết nếu cần')} />
      </Truong>

      {/* K2-6b (Q6): MỘT dòng vàng, không chặn Lưu — "Xem" mở ngay dưới dòng, không mở panel thứ hai. */}
      {cauTrung && (
        <div className="text-xs text-soon">
          <span>{cauTrung}</span>{' · '}
          <button type="button" className="link appearance-none border-0 bg-transparent p-0 align-baseline max-sm:-my-3 max-sm:py-3" aria-expanded={xemTrung} onClick={() => setXemTrung((v) => !v)}>{t('Xem')}</button>
          {xemTrung && (
            <ul className="m-0 mt-1.5 list-none space-y-0.5 p-0 text-xs text-slate-400">
              {trungRows.map((r) => <li key={r.id}>{r.ten} · {r.reportedByName ?? t('một giáo viên')} · {dich(r.nhanTrangThai)}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Chọn một hoặc nhiều học viên của lớp: ô bấm `n học viên ▾` mở danh sách (ô tìm · `Cả lớp · n` · ô chọn từng em). Dưới ô, mỗi em một dòng
 * `Tên · + Mô tả riêng · ✕` — chỉ khi 2…`LO_GHI_VI_PHAM` em (chọn cả lớp thì không liệt kê). ponytail: > 8 em không có Mô tả riêng; bỏ bớt em để chỉnh.
 */
function ChonHocVien({ ds, chon, onChange, loi, lf, loiList, rieng, onRieng }: {
  ds: NguoiChon[]; chon: number[]; onChange: (v: number[]) => void; loi: string | null;
  lf: ReturnType<typeof useLoiForm>; loiList: readonly LoiTruong[];
  rieng: Record<number, string>; onRieng: (v: Record<number, string>) => void;
}) {
  const [mo, setMo] = useState(false);
  const [tim, setTim] = useState('');
  const loc = ds.filter((s) => !tim.trim() || s.name.toLowerCase().includes(tim.trim().toLowerCase()));
  const tatCa = ds.length > 0 && ds.slice(0, TOI_DA_EM_GHI_VI_PHAM).every((s) => chon.includes(s.id));
  const doi = (id: number) => onChange(chon.includes(id) ? chon.filter((x) => x !== id) : chon.length >= TOI_DA_EM_GHI_VI_PHAM ? chon : [...chon, id]);
  const bo = (id: number) => { onChange(chon.filter((x) => x !== id)); const { [id]: _b, ...con } = rieng; onRieng(con); };
  const nhan = chon.length === 0 ? t('Chọn học viên') : chon.length === 1 ? ds.find((s) => s.id === chon[0])?.name ?? t('1 học viên') : t('{length} học viên', { length: chon.length });

  return (
    /* Rời khỏi khối (bấm chỗ khác) thì danh sách tự gấp lại. */
    <div className="space-y-2" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setMo(false); }}>
      <Truong nhan={t('Học viên')} batBuoc as="div" loi={loi}>
        <button type="button" className="field flex w-full items-center justify-between gap-2 text-left" aria-expanded={mo} {...lf.o(loiList, 'hoc-vien')} onClick={() => setMo((v) => !v)}>
          <span className={`min-w-0 truncate ${chon.length ? '' : 'text-slate-500'}`}>{nhan}</span>
          <span aria-hidden className="text-slate-400">▾</span>
        </button>
        {mo && (
          <div className="mt-1.5 rounded-lg border p-2" style={{ borderColor: 'var(--line)' }}>
            <input className="field mb-1.5 w-full" value={tim} onChange={(e) => setTim(e.target.value)} placeholder={t('Gõ tên…')} aria-label={t('Tìm học viên')} />
            <div className="max-h-56 space-y-0.5 overflow-y-auto">
              <ONhieu chon={tatCa} onClick={() => onChange(tatCa ? [] : ds.slice(0, TOI_DA_EM_GHI_VI_PHAM).map((s) => s.id))}>{t('Cả lớp · {length}', { length: ds.length })}</ONhieu>
              {loc.map((s) => <ONhieu key={s.id} chon={chon.includes(s.id)} onClick={() => doi(s.id)}>{s.name}</ONhieu>)}
              {loc.length === 0 && <p className="m-0 px-2 py-1.5 text-xs text-slate-500">{t('Không có học viên nào khớp')}</p>}
            </div>
          </div>
        )}
      </Truong>
      {chon.length > 1 && chon.length <= LO_GHI_VI_PHAM && (
        <ul className="m-0 list-none space-y-1.5 p-0">
          {chon.map((id) => (
            <li key={id} className="rounded-md border px-2.5 py-1.5" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-center gap-2 text-sm">
                <span className="min-w-0 flex-1 truncate text-slate-200">{ds.find((s) => s.id === id)?.name}</span>
                {rieng[id] === undefined && <button type="button" className="link appearance-none border-0 bg-transparent p-0" onClick={() => onRieng({ ...rieng, [id]: '' })}>{t('+ Mô tả riêng')}</button>}
                <button type="button" className="appearance-none border-0 bg-transparent p-0 text-slate-500 hover:text-bad max-sm:grid max-sm:min-h-[44px] max-sm:min-w-[44px] max-sm:place-items-center" aria-label={t('Bỏ {name}', { name: String(ds.find((s) => s.id === id)?.name) })} onClick={() => bo(id)}>✕</button>
              </div>
              {rieng[id] !== undefined && (
                <div className="mt-1.5 space-y-1">
                  <Truong nhan={t('Mô tả riêng')} tuyChon>
                    <textarea className="field w-full" rows={2} maxLength={2000} value={rieng[id]} onChange={(e) => onRieng({ ...rieng, [id]: e.target.value })} />
                  </Truong>
                  <button type="button" className="link appearance-none border-0 bg-transparent p-0 text-xs" onClick={() => { const { [id]: _b, ...con } = rieng; onRieng(con); }}>{t('Bỏ')}</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ONhieu({ chon, onClick, children }: { chon: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={chon} onClick={onClick}
      className="flex min-h-[44px] w-full items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-slate-500/10 sm:min-h-[32px]">
      <span aria-hidden className={`w-3 text-[12px] text-[color:var(--accent-strong)] ${chon ? '' : 'invisible'}`}>✓</span>
      <span className="min-w-0 truncate">{children}</span>
    </button>
  );
}
