import { useState } from 'react';
import { SectionNote } from '../../ui/ui.tsx';

/**
 * GHI CHI TIẾT THEO THÀNH PHẦN CỦA KỸ NĂNG (mục 9.3) — luôn TUỲ CHỌN, và chỉ hiện đúng bộ
 * của kỹ năng case đang nói tới: Section 1–4 cho Listening, bốn tiêu chí band cho Speaking.
 *
 * L/R ghi ĐẠT/TỔNG chứ không ghi band: "Section 3: 5.0" sẽ bị đọc thành band 5 ở Section 3,
 * một con số không tồn tại trong IELTS.
 *
 * Tách khỏi `CasePanel.tsx` (PR-Form Task 7) để `QuickReport.tsx` dùng lại được cho "Điểm chi
 * tiết theo kỹ năng" của nhập bù (S5) — cùng luật, không lặp lại.
 */
export function ComponentsField({ label, components, counts, value, onChange, buttonLabel }: {
  label: string; components: readonly string[]; counts: boolean;
  value: Record<string, { score: string; total: string }>;
  onChange: (v: Record<string, { score: string; total: string }>) => void;
  /** Chữ nút mở khối. Mặc định "+ Ghi chi tiết {label} (không bắt buộc)" — nhập bù (S5) truyền chữ riêng. */
  buttonLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const set = (key: string, part: 'score' | 'total', v: string) => {
    const cur = value[key] ?? { score: '', total: '' };
    onChange({ ...value, [key]: { ...cur, [part]: v } });
  };

  if (!open) {
    return (
      <button type="button" className="btn btn-sm btn-ghost" onClick={() => setOpen(true)}>
        {buttonLabel ?? `+ Ghi chi tiết ${label} (không bắt buộc)`}
      </button>
    );
  }
  return (
    <div className="surface-2 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="label m-0">Chi tiết {label}</span>
        <button type="button" className="btn btn-sm btn-ghost"
          onClick={() => { setOpen(false); onChange({}); }}>
          Bỏ phần này
        </button>
      </div>
      <div className="space-y-1.5">
        {components.map((c) => (
          <div key={c} className="flex flex-wrap items-center gap-2">
            <span className="w-full shrink-0 text-xs text-slate-300 sm:w-52">{c}</span>
            <input className="field max-w-[6rem]" type="number" inputMode="decimal"
              step={counts ? 1 : 0.5} min={0} max={counts ? undefined : 9}
              placeholder={counts ? 'đạt' : 'band'}
              value={value[c]?.score ?? ''} onChange={(e) => set(c, 'score', e.target.value)} />
            {counts && (
              <>
                <span className="text-slate-500">/</span>
                <input className="field max-w-[6rem]" type="number" min={1} placeholder="tổng"
                  value={value[c]?.total ?? ''} onChange={(e) => set(c, 'total', e.target.value)} />
              </>
            )}
          </div>
        ))}
      </div>
      <SectionNote>
        Chỉ điền phần bạn thật sự đánh giá — để trống phần không xem tới. Đây là quan sát của
        bạn, không ghi đè điểm Test chính thức và không đổi mức SOS.
      </SectionNote>
    </div>
  );
}

/** Đổi các ô chi tiết đã nhập thành danh sách gửi lên máy chủ; ô để trống thì bỏ qua. */
export function componentsPayload(
  category: string | null,
  v: Record<string, { score: string; total: string }>,
  counts: boolean,
) {
  if (!category) return undefined;
  const out = Object.entries(v)
    .filter(([, m]) => m.score !== '' && m.score !== undefined)
    .map(([component, m]) => ({
      skill: category, component,
      score: Number(m.score),
      total: counts && m.total !== '' ? Number(m.total) : null,
    }));
  return out.length ? out : undefined;
}
