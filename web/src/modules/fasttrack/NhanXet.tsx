/**
 * NHẬN XÉT (PR-HSM, YC-13.5; OV-4b: cả L/R). ≤ 1000 ký tự; không phải điểm — lưu không hỏi lý do, không đổi "Nhập bởi". Lưu qua đúng
 * đường ghi điểm (`save(k, { nhanXet })` → `PUT /attempts/:id/scores/:skill`). Nhập cùng điểm: hộp nhập điểm.
 * OV-12b → LUAT-NX-MT: ô MT có điểm — nhận xét NÊN có (`nenCo`: thiếu / ngắn vẫn lưu, chỉ nhắc vàng); dưới kỳ vọng → chip nhóm nguyên nhân.
 *
 *   ONhanXet    Nằm ở: Test › một lượt MT (hồ sơ Mock) → khối "Nhận xét" (Listening · Reading · Writing Task 1 · Task 2 · Speaking).
 *   ChonNhom    Hàng chip "Nhóm nguyên nhân" (`issuesForTopic`; W1/W2 bộ Writing) — chọn nhiều, chip đã chọn mang số thứ tự (1 = chính).
 *   NhomTaiCho  Chip tại chỗ của hồ sơ MT: bấm là lưu (bỏ chip cuối cũng lưu — LUAT-NX-MT).
 */
import { useEffect, useRef, useState } from 'react';
import { CAU_THIEU_NHAN_XET, NHAN_XET_MT_TOI_THIEU, NHAN_XET_TOI_DA, issueLabel, issuesForTopic } from '@shared/domain/index.ts';
import { NutChon } from '../../ui/ui.tsx';
import { dich, t } from '@shared/i18n/index.ts';

/** OV-14b: chữ gợi ý ô nhận xét đúng kỹ năng — vấn đề HỌC THUẬT, không ý thức / chuyện ngoài bài (LUAT-NX-MT); hồ sơ Mock, hộp chấm, Case MT. */
export function viDuNhanXet(kyNang: string | null | undefined): string {
  if (kyNang === 'listening') return t('Ví dụ: Nghe phần 3 còn chậm, cần luyện thêm dạng điền bảng');
  if (kyNang === 'reading') return t('Ví dụ: Sai nhiều câu True/False/Not Given, đọc chậm passage 3');
  if (kyNang?.startsWith('writing')) return t('Ví dụ: Task 2 thiếu ví dụ cụ thể, câu phức còn sai ngữ pháp');
  if (kyNang === 'speaking') return t('Ví dụ: Part 2 chưa nói đủ 2 phút, phát âm đuôi -s còn sai');
  return t('Vấn đề học thuật của kỹ năng — không ghi ý thức, chuyện ngoài bài');
}

/** Đếm ký tự chỉ hiện khi đã gần trần (> 800) — không làm rối lúc gõ vài câu. */
function Dem({ n }: { n: number }) {
  if (n <= 800) return null;
  return <span className={`tabular-nums ${n >= NHAN_XET_TOI_DA ? 'text-bad' : 'text-slate-500'}`}>{n}/{NHAN_XET_TOI_DA}</span>;
}

/**
 * Ô nhận xét tại chỗ của hồ sơ Mock: tự cao theo chữ, lưu khi rời ô hoặc Ctrl+Enter, trạng thái lưu nhỏ bên phải nhãn.
 * Lỗi mạng: giữ chữ đã gõ, hiện "Chưa lưu — thử lại" (bấm để gửi lại).
 */
export function ONhanXet({ nhan, phu, giaTri, onLuu, nenCo = false, kyNang = null }: {
  nhan: string; phu?: string | null; giaTri: string | null; onLuu: (v: string | null) => Promise<boolean>;
  /** OV-14b: kỹ năng của ô — chữ gợi ý đúng kỹ năng (`viDuNhanXet`). */
  kyNang?: string | null;
  /** LUAT-NX-MT: ô MT đã có điểm — xoá / dưới 10 ký tự vẫn lưu, chỉ nhắc: viền vàng + tooltip / tên đọc màn, không chữ dưới ô (V15, SUA-CHAM-LAI L7). */
  nenCo?: boolean;
}) {
  const [nhap, setNhap] = useState(giaTri ?? '');
  const [tt, setTt] = useState<'idle' | 'dang' | 'xong' | 'loi'>('idle');
  const o = useRef<HTMLTextAreaElement>(null);
  const sua = useRef(false);
  useEffect(() => { if (!sua.current) setNhap(giaTri ?? ''); }, [giaTri]);
  useEffect(() => {
    const el = o.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [nhap]);
  const luu = async () => {
    if (tt === 'dang') return;
    if (nhap.trim() === (giaTri ?? '').trim()) { sua.current = false; return; }
    setTt('dang');
    const ok = await onLuu(nhap.trim() || null);
    setTt(ok ? 'xong' : 'loi');
    if (ok) sua.current = false;
  };
  const nhacNx = nenCo && nhap.trim().length < NHAN_XET_MT_TOI_THIEU;
  return (
    <label className="block min-w-0">
      <span className="flex items-baseline gap-2 text-xs text-slate-400">
        <span className="shrink-0 whitespace-nowrap font-medium text-slate-300">{nhan}</span>
        {phu && <span className="min-w-0 truncate text-slate-500" title={phu}>{phu}</span>}
        <span className="ml-auto flex items-baseline gap-2">
          <Dem n={nhap.length} />
          {tt === 'dang' && <span className="text-slate-500">{t('Đang lưu…')}</span>}
          {tt === 'xong' && <span className="text-slate-500">{t('Đã lưu')}</span>}
          {tt === 'loi' && (
            <button type="button" className="appearance-none border-0 bg-transparent p-0 text-xs font-semibold text-bad underline"
              onMouseDown={(e) => e.preventDefault()} onClick={() => void luu()}>{t('Chưa lưu — thử lại')}</button>
          )}
        </span>
      </span>
      <textarea ref={o} className="field mt-1 w-full resize-none text-sm leading-relaxed" rows={2} maxLength={NHAN_XET_TOI_DA}
        style={nhacNx ? { borderColor: 'rgb(var(--soon-rgb))' } : undefined}
        title={nhacNx ? CAU_THIEU_NHAN_XET['ghi-nhan-xet'] : undefined} aria-description={nhacNx ? CAU_THIEU_NHAN_XET['ghi-nhan-xet'] : undefined}
        value={nhap} placeholder={viDuNhanXet(kyNang)}
        onChange={(e) => { sua.current = true; setNhap(e.target.value); if (tt !== 'dang') setTt('idle'); }}
        onBlur={() => void luu()}
        onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void luu(); } }} />
    </label>
  );
}

/** Hàng chip nhóm nguyên nhân — `value` theo thứ tự chọn; bỏ chip thì các chip sau lên một bậc (chip 1 = nguyên nhân chính). */
export function ChonNhom({ skill, ct = null, value, onChange, disabled, nhanId, moTa }: {
  skill: string; value: string[]; onChange: (v: string[]) => void; disabled?: boolean; nhanId?: string;
  /** Nhắc cho trình đọc màn (V15: không chữ trên màn). */ moTa?: string;
  /** OV-12c: chương trình lớp thường (FOU "G+V") — bộ nhóm theo chương trình, như Xác nhận Case. */
  ct?: string | null;
}) {
  return (
    <div role="group" aria-labelledby={nhanId} aria-description={moTa} data-chip-nhom className="flex flex-wrap gap-1.5">
      {issuesForTopic(skill, ct).map((i) => {
        const th = value.indexOf(i.code);
        return (
          <NutChon key={i.code} nho chon={th >= 0} dau={th + 1} disabled={disabled}
            title={th === 0 ? t('Nguyên nhân chính') : i.hint && dich(i.hint)}
            onClick={() => onChange(th >= 0 ? value.filter((x) => x !== i.code) : [...value, i.code])}>
            {dich(i.label)}{th >= 0 && <span className="sr-only">{t(', thứ')}{' '}{th + 1}{th === 0 ? t(' (chính)') : ''}</span>}
          </NutChon>
        );
      })}
    </div>
  );
}

/** Chip đọc (người không sửa được): nhóm theo thứ tự, chính trước. */
export function NhomTinh({ value }: { value: string[] }) {
  if (!value.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {value.map((c) => <span key={c} className="rounded-md border px-2 py-0.5 text-xs text-slate-300" style={{ borderColor: 'var(--line-strong)' }}>{issueLabel(c)}</span>)}
    </div>
  );
}

/** Chip tại chỗ của hồ sơ MT: bấm là lưu (lỗi → giữ lựa chọn, "Chưa lưu — thử lại"); bỏ chip cuối cũng lưu, chỉ nhắc (LUAT-NX-MT). */
export function NhomTaiCho({ skill, giaTri, onLuu }: { skill: string; giaTri: string[]; onLuu: (v: string[]) => Promise<boolean> }) {
  const [v, setV] = useState(giaTri);
  const [tt, setTt] = useState<'idle' | 'dang' | 'xong' | 'loi'>('idle');
  const khoa = giaTri.join();
  useEffect(() => { setV(giaTri); }, [khoa]);   // eslint-disable-line react-hooks/exhaustive-deps
  const luu = async (moi: string[]) => {
    setV(moi); setTt('dang');
    setTt((await onLuu(moi)) ? 'xong' : 'loi');
  };
  const id = `nhom-${skill}`;
  const nhac = !v.length && tt !== 'dang' && tt !== 'loi';
  return (
    <div>
      <span className="mb-1.5 flex items-baseline gap-2 text-xs">
        <span id={id} className="font-medium text-slate-300">{t('Nhóm nguyên nhân')}</span>
        <span className="ml-auto">
          {tt === 'dang' && <span className="text-slate-500">{t('Đang lưu…')}</span>}
          {tt === 'xong' && <span className="text-slate-500">{t('Đã lưu')}</span>}
          {tt === 'loi' && (
            <button type="button" className="appearance-none border-0 bg-transparent p-0 text-xs font-semibold text-bad underline" onClick={() => void luu(v)}>
              {t('Chưa lưu — thử lại')}
            </button>
          )}
        </span>
      </span>
      {/* V15: thiếu nhóm → viền vàng quanh hàng chip + tooltip / tên đọc màn, không chữ. */}
      <div className="rounded-md" title={nhac ? CAU_THIEU_NHAN_XET['chon-nhom'] : undefined}
        style={nhac ? { outline: '1px solid rgb(var(--soon-rgb))', outlineOffset: 3 } : undefined}>
        <ChonNhom skill={skill} value={v} onChange={(x) => void luu(x)} disabled={tt === 'dang'} nhanId={id} moTa={nhac ? CAU_THIEU_NHAN_XET['chon-nhom'] : undefined} />
      </div>
    </div>
  );
}
