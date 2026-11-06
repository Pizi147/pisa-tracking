import { Suspense, type ComponentProps } from 'react';
import { lazyTai } from '../../lib/taiLaiManh.ts';
import type { NganCase as NganCaseDay } from './NganCase.tsx';

/**
 * TAI-NHANH-0711b: mảnh panel Case (`NganCase` + CasePanel, Cập nhật tuần, PA… ~37 KB gzip) chỉ tải khi mở một Case — mọi nơi gọi đều mở sau một bấm
 * (hoặc `?case=`). `NAP_SAN` nạp ngầm mảnh `PanelViec` (nhập tĩnh `NganCase`) sau trang đầu nên mở Case vẫn ngay.
 */
const Manh = lazyTai(() => import('./NganCase.tsx').then((m) => ({ default: m.NganCase })));

export function NganCase(p: ComponentProps<typeof NganCaseDay>) {
  return <Suspense fallback={null}><Manh {...p} /></Suspense>;
}
