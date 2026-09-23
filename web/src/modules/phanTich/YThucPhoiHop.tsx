import { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { Card, Empty, ErrorState, Skeleton, Th } from '../../ui/ui.tsx';
import { HangCon, HangNhom } from '../../ui/HangNhom.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { SoLieuO } from '../../ui/SoLieuO.tsx';
import { DINH_TRAI, MAU_SO_VOI_TRUOC, thamSoLoc, type PhamViPhanTich } from './dungChung.tsx';
import {
  BUOC_TIEP_LABEL, KHOANG_LABEL, MEASURE_KINDS, MEASURE_KIND_LABEL, duongHoSoHocVien, nhanSoVoiTruoc, ngay,
  type DongHvCanChuY, type DongLopViPham, type YThucPhanTichKetQua,
} from '@shared/domain/index.ts';

/**
 * Ý THỨC & PHỐI HỢP (PR-UX4, mockup 16 §5) — còn HAI danh sách: "Học viên cần chú ý" (quyết biện pháp nặng hơn) và "Lớp nhiều vi phạm"
 * (nói chuyện với GVCN). Phối hợp SOS đã ở Việc cần làm của GVCN nên không lặp ở đây. Không có hạn nên không dùng ⚠ (G-4). Mọi số mở đúng
 * danh sách bằng `/phan-tich/y-thuc/o` (G-10). Bảng "phương án xử lý theo loại" chỉ còn trong ⤓ Xuất Excel.
 */
const tenNgan = (s: string) => s.replace('Thư cảnh cáo', 'Thư CC');

export function YThucPhoiHop(props: PhamViPhanTich) {
  const { session } = useSession();
  const demoDate = session?.demoDate ?? null;
  const query = thamSoLoc(props);
  const { data, loading, error, reload } = useApi<YThucPhanTichKetQua>(`/phan-tich/y-thuc?${query}`, [query]);
  const nguon = (dong: string, cot: string) => `/phan-tich/y-thuc/o?${query}&dong=${encodeURIComponent(dong)}&cot=${encodeURIComponent(cot)}`;
  const [mo, setMo] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!data) return;
    setMo(new Set(data.lop.slice(0, 1).map((l) => l.khoa)));    // mở sẵn lớp đứng đầu
  }, [data]);
  const doiMo = (khoa: string) => setMo((cu) => { const n = new Set(cu); if (n.has(khoa)) n.delete(khoa); else n.add(khoa); return n; });

  const classes = useApi<any[]>(`/ref/classes${props.branchId ? `?branchId=${props.branchId}` : ''}`, [props.branchId]);
  const branches = useApi<any[]>('/ref/branches');
  const tenChiNhanh = props.branchId ? branches.data?.find((b) => b.id === props.branchId)?.name ?? null : null;
  const tenLop = props.classId ? classes.data?.find((c) => c.id === props.classId)?.code ?? null : null;

  async function xuatExcel() {
    if (!data || !demoDate) return;
    const XLSX = await import('xlsx');
    const moTa = [tenChiNhanh ?? 'Tất cả chi nhánh', KHOANG_LABEL[props.tg], tenLop, `dữ liệu đến ${ngay(demoDate)}`].filter(Boolean).join(' · ');
    const hv: (string | number)[][] = [
      [`Học viên cần chú ý · ${moTa}`], [],
      ['Học viên', 'Lớp', 'Vi phạm', 'Chưa xử lý', 'PA xử lý gần nhất', 'Ngày', 'Bước tiếp theo'],
      ...data.hvCanChuY.map((x) => [x.ten, x.lop ?? '', x.viPham, x.chuaXuLy, x.bienPhapGanNhat ?? '', x.ngay ? ngay(x.ngay) : '', BUOC_TIEP_LABEL[x.buocTiep]]),
    ];
    const dongLop = (x: DongLopViPham, thut: boolean): (string | number)[] => [
      `${thut ? '  ' : ''}${x.nhan}`, x.viPham, x.chuaXuLy, x.hvCoViPham, x.siSo ?? '', nhanSoVoiTruoc(x.soVoiTruoc).chu, x.gvcn ?? '',
    ];
    const lop: (string | number)[][] = [
      [`Lớp nhiều vi phạm · ${moTa}`], [],
      ['Lớp / nhóm vi phạm', 'Vi phạm', 'Chưa xử lý', 'HV có vi phạm', 'Sĩ số', '± kỳ trước', 'GVCN'],
      ...data.lop.flatMap((x) => [dongLop(x, false), ...(x.con ?? []).map((c) => dongLop(c, true))]),
      ...(data.gom?.hang ?? []).flatMap((x) => [dongLop(x, false), ...(x.con ?? []).map((c) => dongLop(c, true))]),
    ];
    const pa: (string | number)[][] = [
      [`PA xử lý đã thực hiện trong kỳ · ${moTa}`], [],
      ['Loại PA xử lý', 'Đã thực hiện'],
      ...MEASURE_KINDS.map((k) => [MEASURE_KIND_LABEL[k], data.bienPhapTheoLoai[k] ?? 0]),
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(hv), 'HV can chu y');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(lop), 'Lop nhieu vi pham');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(pa), 'PA xu ly theo loai');
    XLSX.writeFile(wb, `y-thuc-${ngay(demoDate).split('/').join('-')}.xlsx`);
  }

  const soVoi = (x: DongLopViPham) => {
    const v = nhanSoVoiTruoc(x.soVoiTruoc);
    return <span className={`font-semibold tabular-nums ${MAU_SO_VOI_TRUOC[v.tone]}`}>{v.chu}</span>;
  };
  const oLop = (x: DongLopViPham, con: boolean) => (
    <>
      <td className="text-right tabular-nums"><SoLieuO giaTri={x.viPham} nguon={nguon(x.khoa, 'vi-pham')} tieuDe={`${x.nhan} · vi phạm`} /></td>
      <td className="text-right tabular-nums"><SoLieuO giaTri={x.chuaXuLy} nguon={nguon(x.khoa, 'chua-xu-ly')} tieuDe={`${x.nhan} · chưa xử lý`} /></td>
      <td className="text-right tabular-nums">
        <SoLieuO giaTri={x.hvCoViPham} nguon={nguon(x.khoa, 'hv-co-vi-pham')} tieuDe={`${x.nhan} · học viên có vi phạm`} />
        {!con && x.siSo !== null && <span className="font-normal text-slate-400">/{x.siSo}</span>}
      </td>
      <td className="text-right">{soVoi(x)}</td>
      <td className="truncate text-xs font-normal text-slate-300">{x.gvcn ?? ''}</td>
    </>
  );
  const tenLopCell = (x: DongLopViPham) => (
    <span className="block min-w-0 truncate">
      {x.classId ? <Link to={`/hoc-vien/lop/${x.classId}`} className="link" title="Mở hồ sơ lớp">{x.nhan}</Link> : x.nhan}
    </span>
  );

  const bang1 = (rows: DongHvCanChuY[]) => (
    <div className="table-scroll">
      <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: 760 }}>
        <colgroup><col style={{ width: '22%' }} /><col style={{ width: 110 }} /><col style={{ width: 70 }} /><col style={{ width: 90 }} /><col style={{ width: '19%' }} /><col style={{ width: 62 }} /><col style={{ width: '19%' }} /></colgroup>
        <thead>
          <tr>
            <Th className="sticky-col">Học viên</Th><Th>Lớp</Th>
            <Th align="right" hint="Trong khoảng đang lọc">Vi phạm</Th><Th align="right" hint="Vi phạm chưa gắn PA xử lý nào">Chưa xử lý</Th>
            <Th hint="PA xử lý đã thực hiện gần nhất">PA xử lý gần nhất</Th><Th align="right">Ngày</Th><Th>Bước tiếp theo</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((x) => (
            <tr key={x.studentId} className="row-hover">
              <td className="td sticky-col"><Link to={duongHoSoHocVien(x.studentId, { tab: 'y-thuc' })} className="link font-semibold">{x.ten}</Link></td>
              <td className="td text-slate-300">{x.lop ?? ''}</td>
              <td className="td text-right tabular-nums"><SoLieuO giaTri={x.viPham} nguon={nguon(`hv:${x.studentId}`, 'vi-pham')} tieuDe={`${x.ten} · vi phạm`} /></td>
              <td className="td text-right tabular-nums"><SoLieuO giaTri={x.chuaXuLy} nguon={nguon(`hv:${x.studentId}`, 'chua-xu-ly')} tieuDe={`${x.ten} · chưa xử lý`} /></td>
              <td className="td">
                {x.bienPhapGanNhat
                  ? <abbr title={x.bienPhapGanNhat} className="text-slate-200 no-underline">{tenNgan(x.bienPhapGanNhat)}</abbr>
                  : <span className="text-faint">—</span>}
              </td>
              <td className="td text-right tabular-nums text-slate-300">{x.ngay ? ngay(x.ngay) : ''}</td>
              <td className="td">
                {x.buocTiep === 'theo-doi' ? <span className="text-slate-400">{BUOC_TIEP_LABEL[x.buocTiep]}</span>
                  : <Nhan tone="soon" title={x.buocTiep === 'da-thu-3' ? 'Đã đủ ba Thư cảnh cáo, lại có vi phạm mới' : 'Đã có Thư cảnh cáo hoặc vi phạm lặp lại, còn vi phạm chưa xử lý'}>{BUOC_TIEP_LABEL[x.buocTiep]}</Nhan>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const khungLuat = (
    <NutLuat label="Cách chọn học viên">
      <p className="m-0">Học viên đang học có từ 3 vi phạm trong khoảng đang lọc, hoặc có vi phạm mới sau Thư cảnh cáo gần nhất (cùng lộ trình).</p>
      <p className="m-0">Bước tiếp theo: đã có Thư CC lần 1–2 mà còn vi phạm → sắp lần kế; chưa có thư, từ 3 vi phạm và còn chưa xử lý → sắp Thư CC lần 1; đã đủ ba thư mà còn vi phạm → "Đã Thư CC lần 3"; còn lại là "Theo dõi".</p>
    </NutLuat>
  );

  return (
    <div className="space-y-4">
      {error ? <Card><ErrorState message={error.message} hint={error.hint} onRetry={reload} /></Card>
        : loading || !data ? <Card><Skeleton rows={6} /></Card>
        : data.scopeEmpty ? <Card><Empty title="Bạn chưa được cấp phạm vi nào" /></Card>
        : (
          <>
            <Card bodyClass="p-0"
              title={<span className="inline-flex flex-wrap items-baseline gap-x-2">Học viên cần chú ý <span className="text-xs font-normal text-slate-500">· vi phạm lặp lại, sắp tới Thư cảnh cáo lần tiếp</span> {khungLuat}</span>}
              action={<button type="button" className="btn btn-sm" disabled={!demoDate} onClick={xuatExcel}>⤓ Xuất Excel</button>}>
              {data.hvCanChuY.length === 0
                ? <div className="p-4"><Empty title={`Không có học viên nào cần chú ý trong ${KHOANG_LABEL[props.tg]}`} /></div>
                : bang1(data.hvCanChuY)}
            </Card>
            <Card bodyClass="p-0" title={<span>Lớp nhiều vi phạm <span className="text-xs font-normal text-slate-500">· xếp theo vi phạm chưa xử lý</span></span>}>
              {data.lop.length === 0 && !data.gom
                ? <div className="p-4"><Empty title={`Chưa có vi phạm nào trong ${KHOANG_LABEL[props.tg]}`} /></div>
                : (
                  <div className="table-scroll">
                    <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: 640 }}>
                      <colgroup><col style={{ width: '27%' }} /><col style={{ width: 80 }} /><col style={{ width: 90 }} /><col style={{ width: 100 }} /><col style={{ width: 100 }} /><col style={{ width: '23%' }} /></colgroup>
                      <thead>
                        <tr>
                          <Th className="sticky-col">Lớp / nhóm vi phạm</Th><Th align="right">Vi phạm</Th><Th align="right">Chưa xử lý</Th>
                          <Th align="right" hint="Học viên có vi phạm / sĩ số lớp">HV có VP</Th>
                          <Th align="right" hint="So với khoảng cùng độ dài liền trước">± kỳ trước</Th><Th>GVCN</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.lop.map((x) => (
                          <Fragment key={x.khoa}>
                            <HangNhom mo={mo.has(x.khoa)} onMo={() => doiMo(x.khoa)} nhan={x.nhan} tieuDe={tenLopCell(x)} className={DINH_TRAI}>{oLop(x, false)}</HangNhom>
                            {mo.has(x.khoa) && x.con?.map((c) => (
                              <HangCon key={c.khoa} className={DINH_TRAI}><td>{c.nhan}</td>{oLop(c, true)}</HangCon>
                            ))}
                          </Fragment>
                        ))}
                        {data.gom && (
                          <Fragment>
                            <HangNhom mo={mo.has('gom')} onMo={() => doiMo('gom')} nhan="lớp khác" soCotDau={6} className={DINH_TRAI}
                              tieuDe={<span className="block truncate text-slate-300">{data.gom.soLop} lớp khác · ≤ 2 vi phạm, đã xử lý hết</span>} />
                            {mo.has('gom') && data.gom.hang.map((x) => (
                              <HangCon key={x.khoa} className={DINH_TRAI}><td>{tenLopCell(x)}</td>{oLop(x, false)}</HangCon>
                            ))}
                          </Fragment>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
            </Card>
          </>
        )}
    </div>
  );
}
