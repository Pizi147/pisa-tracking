import { useEffect, useRef } from 'react';
import { Drawer } from '../../ui/Drawer.tsx';
import { CasePanel } from '../cases/CasePanel.tsx';

/**
 * NGĂN CASE dùng chung cho mọi lối vào hồ sơ học viên (Q9, R7) — bấm khối PA hay tên vấn đề ở tab
 * Hành trình, hay mở từ thông báo (`?case=&pa=`) đều ra ngăn NÀY, không đổi tab đang xem.
 *
 * Có `paId` thì sau khi `CasePanel` tải xong, dò `[data-pa-id="{paId}"]` (thuộc tính PR-Form thêm
 * vào từng dòng phương án trong `timeline`) để cuộn tới và viền sáng 2 giây. Chưa có thuộc tính đó
 * (PR-Form chưa merge) thì ngăn vẫn mở đúng case, chỉ không cuộn — không báo lỗi.
 */
export function NganCase({ caseId, paId, studentName, onClose }: {
  caseId: number; paId?: number | null; studentName: string; onClose: () => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!paId) return;
    const box = boxRef.current;
    if (!box) return;
    const sang = (el: HTMLElement) => {
      el.scrollIntoView({ block: 'center' });
      el.style.outline = '2px solid var(--accent-strong)';
      el.style.outlineOffset = '2px';
      const t = setTimeout(() => { el.style.outline = ''; el.style.outlineOffset = ''; }, 2000);
      return t;
    };
    const tim = () => box.querySelector<HTMLElement>(`[data-pa-id="${paId}"]`);
    const ngay = tim();
    if (ngay) { const t = sang(ngay); return () => clearTimeout(t); }

    let outlineTimer: ReturnType<typeof setTimeout> | null = null;
    const obs = new MutationObserver(() => {
      const el = tim();
      if (el) { obs.disconnect(); outlineTimer = sang(el); }
    });
    obs.observe(box, { childList: true, subtree: true });
    const bo = setTimeout(() => obs.disconnect(), 3000);
    return () => { obs.disconnect(); clearTimeout(bo); if (outlineTimer) clearTimeout(outlineTimer); };
  }, [caseId, paId]);

  return (
    <Drawer open onClose={onClose} title="Vấn đề - Case" subtitle={studentName}>
      <div ref={boxRef}>
        <CasePanel caseId={caseId} compact />
      </div>
    </Drawer>
  );
}
