import { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { Card, Empty, ErrorState, NhanTrangThai, Skeleton, Th } from '../../ui/ui.tsx';
import { HangCon, HangNhom } from '../../ui/HangNhom.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { DINH_TRAI, MAU_SO_VOI_TRUOC, SoO as SoLieuO, thamSoLoc, type PhamViPhanTich } from './dungChung.tsx';
import {
  KHOA_LOAI_XU_LY, KHOANG_LABEL, NHOM_EM_LABEL, duongHoSoHocVien, nhanLoaiXuLy, nhanSoVoiTruoc, ngay,
  type DongHvCanChuY, type DongLopViPham, type YThucPhanTichKetQua,
} from '@shared/domain/index.ts';

/**
 * Ý THỨC (PR-UX4, mockup 16 §5; PR-YT4 K1-25) — HAI danh sách: "Học viên cần chú ý" (em Quá hạn · Bắt buộc xử lý · Chờ QL duyệt, kèm bậc
 * hiện tại và bậc kế trên thang) và "Lớp nhiều vi phạm" (nói chuyện với GVCN). Phối hợp SOS ở Việc cần làm của GVCN nên không lặp ở đây.
 * Mọi số mở đúng danh sách bằng `/phan-tich/y-thuc/o` (G-10). Bảng "Xử lý theo loại" chỉ có trong ⤓ Xuất Excel.
 */
const nhanNhom = (x: DongHvCanChuY) => (x.nhom === 'qua_han'
  ? <NhanTrangThai t="qua-han" />
  : <Nhan tone={x.nhom === 'bat_buoc' ? 'soon' : 'wait'}>{NHOM_EM_LABEL[x.nhom]}</Nhan>);

export function YThucPhoiHop(props: PhamViPhanTich) {
  const demoDate = useNgayNghiepVu().homNay || null;
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
      ['Học viên', 'Lớp', 'Trạng thái', 'Bậc hiện tại', 'Bậc kế', 'Vi phạm', 'Chưa xử lý', 'Lần xử lý gần nhất', 'Ngày'],
      ...data.hvCanChuY.map((x) => [x.ten, x.lop ?? '', NHOM_EM_LABEL[x.nhom], x.bac ?? 'Chưa xử lý lần nào', x.bacKe ?? '', x.viPham, x.chuaXuLy,
        `${x.bienPhapGanNhat ?? ''}${x.lanXuLyMoi ? ` (mới hơn: ${x.lanXuLyMoi.ten} · ${x.lanXuLyMoi.nhan})` : ''}`, x.ngay ? ngay(x.ngay, demoDate) : '']),
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
      [`Xử lý đã xong trong kỳ theo loại · ${moTa}`], [],
      ['Loại xử lý', 'Xong'],
      ...KHOA_LOAI_XU_LY.filter((k) => k !== 'loai-cu' || data.bienPhapTheoLoai[k]).map((k) => [nhanLoaiXuLy(k), data.bienPhapTheoLoai[k] ?? 0]),
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(hv), 'HV cần chú ý');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(lop), 'Lớp nhiều vi phạm');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(pa), 'Xử lý theo loại');
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
      <td className="pr-5 text-right">{soVoi(x)}</td>
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
      <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: 860 }}>
        <colgroup><col style={{ width: '20%' }} /><col style={{ width: 100 }} /><col style={{ width: 130 }} /><col style={{ width: 110 }} /><col style={{ width: 150 }} /><col style={{ width: 70 }} /><col style={{ width: 90 }} /><col style={{ width: '16%' }} /></colgroup>
        <thead>
          <tr>
            <Th className="sticky-col">Học viên</Th><Th>Lớp</Th><Th>Trạng thái</Th>
            <Th hint="Bậc cao nhất đã xử lý trên thang (kể cả cấp bậc vi phạm đã xác nhận từ trước khi dùng web)">Bậc hiện tại</Th>
            <Th hint="Lần xử lý bắt buộc kế tiếp; WL 3 cần QL duyệt">Bậc kế</Th>
            <Th align="right" hint="Trong khoảng đang lọc">Vi phạm</Th><Th align="right" hint="Mới · Cần xử lý · Quá hạn (Đã ghi nhận không tính)">Chưa xử lý</Th>
            <Th hint="Lần xử lý đã xong gần nhất; lần mới hơn còn chờ duyệt hoặc bị từ chối hiện ở dòng dưới, kèm trạng thái">Lần xử lý gần nhất</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((x) => (
            <tr key={x.studentId} className="row-hover">
              <td className="td sticky-col"><Link to={duongHoSoHocVien(x.studentId, { tab: 'y-thuc' })} className="link font-semibold">{x.ten}</Link></td>
              <td className="td text-slate-300">{x.lop ?? ''}</td>
              <td className="td">{nhanNhom(x)}</td>
              <td className="td text-slate-200">{x.bac ?? <span className="text-faint">Chưa xử lý lần nào</span>}</td>
              <td className="td text-slate-300">{x.bacKe}</td>
              <td className="td text-right tabular-nums"><SoLieuO giaTri={x.viPham} nguon={nguon(`hv:${x.studentId}`, 'vi-pham')} tieuDe={`${x.ten} · vi phạm`} /></td>
              <td className="td text-right tabular-nums"><SoLieuO giaTri={x.chuaXuLy} nguon={nguon(`hv:${x.studentId}`, 'chua-xu-ly')} tieuDe={`${x.ten} · chưa xử lý`} /></td>
              <td className="td truncate text-slate-300" title={x.bienPhapGanNhat ?? undefined}>
                {x.bienPhapGanNhat ? `${x.bienPhapGanNhat}${x.ngay ? ` · ${ngay(x.ngay, demoDate)}` : ''}` : <span className="text-faint">—</span>}
                {x.lanXuLyMoi && <div className="text-xs text-wait">{x.lanXuLyMoi.ten} · {x.lanXuLyMoi.nhan}</div>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const khungLuat = (
    <NutLuat label="Cách chọn học viên">
      <p className="m-0">Học viên đang học đang Quá hạn, Bắt buộc xử lý (3 vi phạm trở lên trong tuần này + tuần trước) hoặc có đề xuất Chờ QL duyệt.</p>
      <p className="m-0">Bậc kế theo thang Report 1 › Report 2 › WL 1 › Report 4 + Meeting CX/GĐCN › WL 2 › WL 3 (cần QL). Đề xuất ngoài thang không đổi bậc.</p>
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
              title={<span className="inline-flex flex-wrap items-baseline gap-x-2">Học viên cần chú ý <span className="text-xs font-normal text-slate-500">· quá hạn, bắt buộc xử lý hoặc chờ QL duyệt</span> {khungLuat}</span>}
              action={<button type="button" className="btn btn-sm" disabled={!demoDate} onClick={xuatExcel}>⤓ Xuất Excel</button>}>
              {data.hvCanChuY.length === 0
                ? <div className="p-4"><Empty title={`Không có học viên nào cần chú ý trong ${KHOANG_LABEL[props.tg]}`} hint="Thử khoảng thời gian dài hơn." /></div>
                : bang1(data.hvCanChuY)}
            </Card>
            <Card bodyClass="p-0" title={<span>Lớp nhiều vi phạm <span className="text-xs font-normal text-slate-500">· xếp theo vi phạm chưa xử lý</span></span>}>
              {data.lop.length === 0 && !data.gom
                ? <div className="p-4"><Empty title={`Chưa có vi phạm nào trong ${KHOANG_LABEL[props.tg]}`} hint="Số có khi đã ghi vi phạm — thử khoảng thời gian dài hơn." /></div>
                : (
                  <div className="table-scroll">
                    <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: 640 }}>
                      <colgroup><col style={{ width: '27%' }} /><col style={{ width: 80 }} /><col style={{ width: 90 }} /><col style={{ width: 100 }} /><col style={{ width: 100 }} /><col style={{ width: '23%' }} /></colgroup>
                      <thead>
                        <tr>
                          <Th className="sticky-col">Lớp / nhóm vi phạm</Th><Th align="right">Vi phạm</Th><Th align="right">Chưa xử lý</Th>
                          <Th align="right" hint="Học viên có vi phạm / sĩ số lớp">HV có vi phạm</Th>
                          <Th align="right" className="pr-5" hint="So với khoảng cùng độ dài liền trước">± kỳ trước</Th><Th>GVCN</Th>
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
