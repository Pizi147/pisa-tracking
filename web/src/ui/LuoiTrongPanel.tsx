import { useEffect, useRef, type ReactNode } from 'react';

/**
 * LƯỚI NHẬP ĐIỂM TRONG PANEL VIỆC (chủ SP 08/11 duyệt #1246: "ô điểm ở panel bị clipped"). Lưới rộng hơn panel vẫn cuộn ngang
 * trong khung riêng (`.luoi-trong-panel .table-scroll`, OV-14b); khung này gắn `data-con-trai` / `data-con-phai` khi còn cột bị che
 * → CSS làm mờ đúng mép đó (chỉ báo "còn nữa, cuộn ngang"), hết che thì không mờ. Không đọc thêm dữ liệu.
 */
export function LuoiTrongPanel({ className, children }: { className: string; children: ReactNode }) {
  const goc = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const r = goc.current;
    if (!r) return undefined;
    const cap = () => r.querySelectorAll<HTMLElement>('.table-scroll').forEach((el) => {
      const du = el.scrollWidth - el.clientWidth;
      el.toggleAttribute('data-con-trai', du > 1 && el.scrollLeft > 1);
      el.toggleAttribute('data-con-phai', du > 1 && el.scrollLeft < du - 1);
    });
    cap();
    const ro = new ResizeObserver(cap);
    ro.observe(r);
    const mo = new MutationObserver(cap);   // lưới vẽ sau khi tải / đổi lượt
    mo.observe(r, { childList: true, subtree: true });
    r.addEventListener('scroll', cap, true);
    return () => { ro.disconnect(); mo.disconnect(); r.removeEventListener('scroll', cap, true); };
  }, []);
  return <div ref={goc} className={className}>{children}</div>;
}
