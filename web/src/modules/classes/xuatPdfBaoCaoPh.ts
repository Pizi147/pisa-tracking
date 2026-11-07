import { api } from '../../lib/api.ts';
import { t } from '@shared/i18n/index.ts';
import type { BaoCaoPdf } from '@shared/domain/index.ts';
import urlThuong from '../../assets/quicksand/Quicksand-Regular.ttf?url';
import urlDam from '../../assets/quicksand/Quicksand-Bold.ttf?url';

/**
 * XUẤT PDF BÁO CÁO PH (BCPH-PDF, chủ SP 07/11) — nạp LƯỜI cả tệp này (TabBaoCaoPh / việc Admin gọi `import()` khi bấm): pdf-lib + fontkit + fflate +
 * phông Quicksand chỉ tải khi xuất, không vào gói trang đầu. Máy chủ trả nội dung từng em (cùng nguồn Excel), trình duyệt dựng PDF.
 * Một em → "{Lớp} - {Tên HV} - {Đợt}.pdf"; cả lớp → MỖI EM MỘT TỆP PDF, gói một .zip tải một lần (chủ SP 07/11). Trả tên tệp đã tải.
 */
export async function taiPdfBaoCaoPh(lopId: number, dot: string, emId: number | null, tienDo?: (i: number, n: number) => void): Promise<string> {
  const [r, lib, fontkit, { dungPdfBaoCao, tenTepPdf, sachTenTep: sach }, r1, r2] = await Promise.all([
    api.get<{ ds: BaoCaoPdf[]; lop: string; nhanDot: string }>(`/classes/${lopId}/bao-cao-ph/xuat?kieu=pdf&dot=${encodeURIComponent(dot)}${emId ? `&em=${emId}` : ''}`),
    import('pdf-lib'), import('@pdf-lib/fontkit'), import('@shared/domain/pdfBaoCaoPh.ts'),
    fetch(urlThuong).then((x) => x.arrayBuffer()), fetch(urlDam).then((x) => x.arrayBuffer()),
  ]);
  if (!r.ds.length) throw new Error(t('Đợt này chưa có học viên nào để xuất'));
  const phong = { r: new Uint8Array(r1), b: new Uint8Array(r2) };
  const tep: Record<string, Uint8Array<ArrayBuffer>> = {};
  /* U04: dựng tuần tự, báo "i/n". Một em lỗi → dừng, nêu tên em, KHÔNG tải zip thiếu (đơn giản nhất; tải lại là đủ). */
  for (const [i, bc] of r.ds.entries()) {
    tienDo?.(i + 1, r.ds.length);
    try { tep[tenTepPdf(bc, r.nhanDot, tep)] = new Uint8Array(await dungPdfBaoCao(lib, fontkit.default, phong, bc)); }
    catch (e: any) { throw new Error(t('Chưa tạo được PDF của {ten}: {loi}', { ten: bc.hocVien, loi: e?.message ?? '' })); }
  }
  const ds = Object.keys(tep);
  if (ds.length === 1) { tai(new Blob([tep[ds[0]]], { type: 'application/pdf' }), ds[0]); return ds[0]; }
  const { zipSync } = await import('fflate');
  const ten = `${sach(`${r.lop} - ${t('Báo cáo PH')} - ${r.nhanDot}`)}.zip`;
  tai(new Blob([new Uint8Array(zipSync(tep, { level: 0 }))], { type: 'application/zip' }), ten);   // PDF đã nén sẵn — zip chỉ gói (level 0)
  return ten;
}

function tai(blob: Blob, ten: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = ten;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
