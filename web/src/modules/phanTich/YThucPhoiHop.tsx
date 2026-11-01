import { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { Card, Empty, ErrorState, Skeleton, Th } from '../../ui/ui.tsx';
import { HangCon, HangNhom } from '../../ui/HangNhom.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { TheDong, useDienThoai } from '../../ui/TheDong.tsx';
import { PhanTrang, usePhanTrang } from '../../ui/PhanTrang.tsx';
import { DINH_TRAI, DaiChiSo, DauThe, MAU_SO_VOI_TRUOC, NutXemToanBo, NutXuat, SoO as OSo, VaoHangLoc, thamSoLoc, type PhamViPhanTich } from './dungChung.tsx';
import { t } from '@shared/i18n/index.ts';
import {
  COT_XUAT_HV_CAN_CHU_Y, KHOA_LOAI_XU_LY, NHOM_EM_LABEL, nhanKhoang, duongHoSoHocVien, nhanLoaiXuLy, nhanSoVoiTruoc, ngay,
  type DongHvCanChuY, type DongLopViPham, type YThucPhanTichKetQua,
} from '@shared/domain/index.ts';

/**
 * Ý THỨC (PR-UX4, mockup 16 §5; PR-YT4 K1-25) — HAI danh sách: "Học viên cần chú ý" (em Quá hạn · Bắt buộc xử lý · Chờ QL duyệt, kèm bậc
 * hiện tại và bậc kế trên thang) và "Lớp nhiều vi phạm" (nói chuyện với GVCN). Phối hợp SOS ở Việc cần làm của GVCN nên không lặp ở đây.
 * Mọi số mở đúng danh sách bằng `/phan-tich/y-thuc/o` (G-10). Bảng "Xử lý theo loại" chỉ có trong ⤓ Xuất Excel (cuối hàng lọc).
 * V8-PT (khung B3): thẻ chỉ số đầu tab — HV cần chú ý đếm từ danh sách HV; Vi phạm · Chưa xử lý · Lớp có vi phạm CỘNG từ bảng Lớp (cùng số).
 * V8-PT-2: số thẻ bấm mở panel (`dong=tong` · `hv-can-chu-y`, chỉ gọi khi mở); 375: hai bảng thành thẻ `TheDong`, không cuộn ngang (mockup luật C1 — tab này không có khung 375).
 */
const nhanNhom = (x: DongHvCanChuY) => <Nhan tone={x.nhom === 'qua_han' ? 'late' : x.nhom === 'bat_buoc' ? 'soon' : 'muted'}>{NHOM_EM_LABEL[x.nhom]}</Nhan>;

export function YThucPhoiHop(props: PhamViPhanTich) {
  const demoDate = useNgayNghiepVu().homNay || null;
  const dienThoai = useDienThoai();
  const query = thamSoLoc(props);
  const { data, loading, error, reload } = useApi<YThucPhanTichKetQua>(`/phan-tich/y-thuc?${query}`, [query]);
  const nhanKy = nhanKhoang(props.khoang).chinh;
  const ptHv = usePhanTrang(data?.hvCanChuY.length ?? 0, query, 'HV');
  const ptLop = usePhanTrang(data?.lop.length ?? 0, query, 'lớp');
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
    const moTa = [tenChiNhanh ?? 'Tất cả chi nhánh', nhanKy, tenLop, `dữ liệu đến ${ngay(demoDate)}`].filter(Boolean).join(' · ');
    const hv: (string | number)[][] = [
      [`Học viên cần chú ý · ${moTa}`], [],
      [...COT_XUAT_HV_CAN_CHU_Y],
      ...data.hvCanChuY.map((x) => [x.ten, x.email ?? '', x.lop ?? '', NHOM_EM_LABEL[x.nhom], x.bac ?? 'Chưa xử lý lần nào', x.bacKe ?? '', x.viPham, x.chuaXuLy,
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
      <td className="text-center tabular-nums"><OSo giaTri={x.viPham} nguon={nguon(x.khoa, 'vi-pham')} tieuDe={`${x.nhan} · vi phạm`} /></td>
      <td className="text-center tabular-nums"><OSo giaTri={x.chuaXuLy} nguon={nguon(x.khoa, 'chua-xu-ly')} tieuDe={`${x.nhan} · chưa xử lý`} /></td>
      <td className="text-center tabular-nums">
        <OSo giaTri={x.hvCoViPham} nguon={nguon(x.khoa, 'hv-co-vi-pham')} tieuDe={`${x.nhan} · học viên có vi phạm`} />
        {!con && x.siSo !== null && <span className="font-normal text-slate-400">/{x.siSo}</span>}
      </td>
      <td className="text-center">{soVoi(x)}</td>
      <td className="truncate text-xs font-normal text-slate-300">{x.gvcn ?? ''}</td>
    </>
  );
  const tenLopCell = (x: DongLopViPham) => (
    <span className="block min-w-0 truncate">
      {x.classId ? <Link to={`/hoc-vien/lop/${x.classId}`} className="ten-ho-so" title="Mở hồ sơ lớp">{x.nhan}</Link> : x.nhan}
    </span>
  );

  /* ---------------- 375: một thẻ mỗi dòng, cùng thứ tự cột với bảng (`TheDong`). */
  const theHv = (x: DongHvCanChuY) => (
    <TheDong key={x.studentId}
      dau={<span className="flex items-center gap-2"><Link to={duongHoSoHocVien(x.studentId, { tab: 'y-thuc' })} className="ten-ho-so min-w-0 truncate">{x.ten}</Link><span className="ml-auto shrink-0">{nhanNhom(x)}</span></span>}
      dong={[
        { nhan: t('Lớp'), noiDung: x.lop ?? '—' },
        { nhan: t('Bậc hiện tại'), noiDung: x.bac ?? <span className="text-faint">Chưa xử lý lần nào</span> },
        { nhan: t('Bậc kế'), noiDung: x.bacKe },
        { nhan: t('Vi phạm'), noiDung: <OSo giaTri={x.viPham} nguon={nguon(`hv:${x.studentId}`, 'vi-pham')} tieuDe={`${x.ten} · vi phạm`} /> },
        { nhan: t('Chưa xử lý'), noiDung: <OSo giaTri={x.chuaXuLy} nguon={nguon(`hv:${x.studentId}`, 'chua-xu-ly')} tieuDe={`${x.ten} · chưa xử lý`} /> },
        { nhan: t('Lần gần nhất'), noiDung: <>{x.bienPhapGanNhat ? `${x.bienPhapGanNhat}${x.ngay ? ` · ${ngay(x.ngay, demoDate)}` : ''}` : !x.lanXuLyMoi && <span className="text-faint">—</span>}
          {x.lanXuLyMoi && <div className="text-muted">{x.lanXuLyMoi.ten} · {x.lanXuLyMoi.nhan}</div>}</> },
      ]} />
  );
  const theLop = (x: DongLopViPham) => {
    const coCon = !!x.con?.length, dangMo = mo.has(x.khoa);
    return (
      <TheDong key={x.khoa} dau={<span className="font-semibold">{tenLopCell(x)}</span>}
        hanhDong={coCon && (
          <button type="button" aria-expanded={dangMo} aria-label={`${x.nhan} — ${t('Mở theo nhóm')}`} onClick={() => doiMo(x.khoa)}
            className="-my-2.5 inline-flex min-h-[44px] cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-[13px] font-medium text-[color:var(--accent)]">
            {t('{n} nhóm', { n: x.con!.length })}<span aria-hidden>{dangMo ? '▴' : '▾'}</span>
          </button>
        )}
        dong={[
          { nhan: t('Vi phạm'), noiDung: <OSo giaTri={x.viPham} nguon={nguon(x.khoa, 'vi-pham')} tieuDe={`${x.nhan} · vi phạm`} /> },
          { nhan: t('Chưa xử lý'), noiDung: <OSo giaTri={x.chuaXuLy} nguon={nguon(x.khoa, 'chua-xu-ly')} tieuDe={`${x.nhan} · chưa xử lý`} /> },
          { nhan: t('HV có vi phạm'), noiDung: <><OSo giaTri={x.hvCoViPham} nguon={nguon(x.khoa, 'hv-co-vi-pham')} tieuDe={`${x.nhan} · học viên có vi phạm`} />{x.siSo !== null && <span className="text-slate-400">/{x.siSo}</span>}</> },
          { nhan: t('± kỳ trước'), noiDung: soVoi(x) },
          ...(x.gvcn ? [{ nhan: 'GVCN', noiDung: x.gvcn }] : []),
          ...(dangMo ? (x.con ?? []).map((c) => ({ nhan: c.nhan, noiDung: <><OSo giaTri={c.viPham} nguon={nguon(c.khoa, 'vi-pham')} tieuDe={`${x.nhan} · ${c.nhan} · vi phạm`} /> <span className="text-faint">· {t('{n} chưa xử lý', { n: c.chuaXuLy })}</span></> })) : []),
        ]} />
    );
  };

  const bang1 = (rows: DongHvCanChuY[]) => (
    <div className="table-scroll bang-dinh">   {/* P3 UI-CHUNG: danh sách HV cần chú ý cả chi nhánh — đầu cột dính */}
      <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: 1100 }}>
        <colgroup><col style={{ width: 200 }} /><col style={{ width: 120 }} /><col style={{ width: 170 }} /><col /><col /><col style={{ width: 100 }} /><col style={{ width: 110 }} /><col /></colgroup>
        <thead>
          <tr>
            <Th className="sticky-col">Học viên</Th><Th>Lớp</Th><Th>Trạng thái</Th>
            <Th hint="Bậc cao nhất đã xử lý trên thang (kể cả cấp bậc vi phạm đã xác nhận từ trước khi dùng web)">Bậc hiện tại</Th>
            <Th hint="Lần xử lý bắt buộc kế tiếp; WL 3 cần QL duyệt">Bậc kế</Th>
            <Th align="center" hint="Trong khoảng đang lọc">Vi phạm</Th><Th align="center" hint="Mới · Cần xử lý · Quá hạn (Đã ghi nhận không tính)">Chưa xử lý</Th>
            <Th hint="Lần xử lý đã xong gần nhất; lần mới hơn còn chờ duyệt hoặc bị từ chối hiện ở dòng dưới, kèm trạng thái">Lần xử lý gần nhất</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((x) => (
            <tr key={x.studentId} className="row-hover [&>td]:h-11">
              <td className="td sticky-col"><Link to={duongHoSoHocVien(x.studentId, { tab: 'y-thuc' })} className="ten-ho-so">{x.ten}</Link></td>
              <td className="td text-slate-300">{x.lop ?? ''}</td>
              <td className="td">{nhanNhom(x)}</td>
              <td className="td text-slate-200">{x.bac ?? <span className="text-faint">Chưa xử lý lần nào</span>}</td>
              <td className="td text-slate-300">{x.bacKe}</td>
              <td className="td text-center tabular-nums"><OSo giaTri={x.viPham} nguon={nguon(`hv:${x.studentId}`, 'vi-pham')} tieuDe={`${x.ten} · vi phạm`} /></td>
              <td className="td text-center tabular-nums"><OSo giaTri={x.chuaXuLy} nguon={nguon(`hv:${x.studentId}`, 'chua-xu-ly')} tieuDe={`${x.ten} · chưa xử lý`} /></td>
              <td className="td whitespace-normal text-slate-300">
                {x.bienPhapGanNhat ? `${x.bienPhapGanNhat}${x.ngay ? ` · ${ngay(x.ngay, demoDate)}` : ''}` : !x.lanXuLyMoi && <span className="text-faint">—</span>}
                {x.lanXuLyMoi && <div className={x.bienPhapGanNhat ? 'text-xs text-muted' : ''}>{x.lanXuLyMoi.ten} · {x.lanXuLyMoi.nhan}</div>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const cachChon = (
    <>
      <p className="m-0">Học viên đang học đang Quá hạn, Bắt buộc xử lý (3 vi phạm trở lên trong tuần này + tuần trước) hoặc có đề xuất Chờ QL duyệt.</p>
      <p className="m-0">Bậc kế theo thang Report 1 › Report 2 › WL 1 › Report 4 + Meeting CX/GĐCN › WL 2 › WL 3 (cần QL). Đề xuất ngoài thang không đổi bậc.</p>
    </>
  );

  /** Thẻ chỉ số: lớp = mọi dòng lớp của bảng (cả nhóm "lớp khác") — tổng cột = số trên thẻ. */
  const chiSo = (d: YThucPhanTichKetQua) => {
    const lop = [...d.lop, ...(d.gom?.hang ?? [])];
    const cong = (k: 'viPham' | 'chuaXuLy' | 'hvCoViPham') => lop.reduce((s, x) => s + x[k], 0);
    const viPham = cong('viPham');
    const hv = cong('hvCoViPham');
    const siSo = lop.length && lop.every((x) => x.siSo !== null) ? lop.reduce((s, x) => s + (x.siSo ?? 0), 0) : null;
    const dem = (n: DongHvCanChuY['nhom']) => d.hvCanChuY.filter((x) => x.nhom === n).length;
    const nhom = [
      dem('qua_han') && t('{n} quá hạn', { n: dem('qua_han') }),
      dem('bat_buoc') && t('{n} bắt buộc xử lý', { n: dem('bat_buoc') }),
      dem('cho_duyet') && t('{n} chờ QL duyệt', { n: dem('cho_duyet') }),
    ].filter(Boolean).join(' · ');
    return (
      <DaiChiSo ds={[
        { ten: t('HV cần chú ý'), ky: t('hôm nay'), gt: <OSo giaTri={d.hvCanChuY.length} nguon={nguon('hv-can-chu-y', 'hv')} tieuDe={t('HV cần chú ý')} vung="chi-so" />, mau: nhom || undefined },
        { ten: t('Vi phạm'), ky: t('trong kỳ'), gt: <OSo giaTri={viPham} nguon={nguon('tong', 'vi-pham')} tieuDe={t('Vi phạm')} vung="chi-so" />, mau: `${nhanSoVoiTruoc(d.soVoiTruoc).chu} ${t('so kỳ trước')}` },
        { ten: t('Chưa xử lý'), gt: <OSo giaTri={cong('chuaXuLy')} nguon={nguon('tong', 'chua-xu-ly')} tieuDe={t('Chưa xử lý')} vung="chi-so" />, mau: viPham ? t('trên {n} vi phạm', { n: viPham }) : undefined },
        { ten: t('Lớp có vi phạm'), gt: <OSo giaTri={lop.length} nguon={nguon('tong', 'lop')} tieuDe={t('Lớp có vi phạm')} vung="chi-so" />, mau: siSo ? `${hv}/${siSo} HV` : hv ? t('{n} HV', { n: hv }) : undefined },
      ]} />
    );
  };

  return (
    <div className="space-y-3">
      <VaoHangLoc o="phai">
        <NutXuat nhan={t('Xuất Excel')} tat={!demoDate || !data} onClick={xuatExcel} />
      </VaoHangLoc>
      {error ? <Card><ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} /></Card>
        : loading || !data ? <Card><Skeleton rows={6} /></Card>
        : data.scopeEmpty ? <Card><Empty title="Bạn chưa được cấp phạm vi nào" /></Card>
        : (
          <>
            {chiSo(data)}
            <Card bodyClass="p-0">
              <DauThe ten={t('Học viên cần chú ý')} dem={t('{n} HV', { n: data.hvCanChuY.length })} cachTinh={cachChon} />
              {data.hvCanChuY.length === 0
                ? <div className="p-4"><Empty title={`Không có học viên nào cần chú ý trong ${nhanKy}`} hint="Thử khoảng thời gian dài hơn." action={<NutXemToanBo />} /></div>
                : <><div ref={ptHv.thanh.dauBang} />{dienThoai ? ptHv.cat(data.hvCanChuY).map(theHv) : bang1(ptHv.cat(data.hvCanChuY))}<div className="px-3"><PhanTrang {...ptHv.thanh} duoi /></div></>}
            </Card>
            <Card bodyClass="p-0">
              <DauThe ten={t('Lớp nhiều vi phạm')} dem={t('{n} lớp', { n: data.lop.length + (data.gom?.soLop ?? 0) })} phu={t('xếp theo vi phạm chưa xử lý')} />
              {data.lop.length === 0 && !data.gom
                ? <div className="p-4"><Empty title={`Chưa có vi phạm nào trong ${nhanKy}`} hint="Số có khi đã ghi vi phạm — thử khoảng thời gian dài hơn." action={<NutXemToanBo />} /></div>
                : (
                  <>
                  <div ref={ptLop.thanh.dauBang} />
                  {dienThoai ? (
                    <>
                      {ptLop.cat(data.lop).map(theLop)}
                      {data.gom && (
                        <>
                          <button type="button" aria-expanded={mo.has('gom')} onClick={() => doiMo('gom')}
                            className="flex min-h-[44px] w-full cursor-pointer items-center gap-2 border-0 border-t border-[color:var(--line)] bg-transparent px-3 py-2 text-left text-[13px] text-[color:var(--text-dim)]">
                            {data.gom.soLop} lớp khác · ≤ 2 vi phạm, đã xử lý hết<span aria-hidden className="ml-auto">{mo.has('gom') ? '▴' : '▾'}</span>
                          </button>
                          {mo.has('gom') && data.gom.hang.map(theLop)}
                        </>
                      )}
                    </>
                  ) : (
                  <div className="table-scroll">
                    <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: 640 }}>
                      <colgroup><col style={{ width: '27%' }} /><col style={{ width: 80 }} /><col style={{ width: 90 }} /><col style={{ width: 100 }} /><col style={{ width: 100 }} /><col style={{ width: '23%' }} /></colgroup>
                      <thead>
                        <tr>
                          <Th className="sticky-col">Lớp / nhóm vi phạm</Th><Th align="center">Vi phạm</Th><Th align="center">Chưa xử lý</Th>
                          <Th align="center" hint="Học viên có vi phạm / sĩ số lớp">HV có vi phạm</Th>
                          <Th align="center" hint="So với khoảng cùng độ dài liền trước">± kỳ trước</Th><Th>GVCN</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {ptLop.cat(data.lop).map((x) => (
                          <Fragment key={x.khoa}>
                            <HangNhom mo={mo.has(x.khoa)} onMo={() => doiMo(x.khoa)} nhan={x.nhan} tieuDe={tenLopCell(x)} className={`${DINH_TRAI} [&>td]:h-11`}>{oLop(x, false)}</HangNhom>
                            {mo.has(x.khoa) && x.con?.map((c) => (
                              <HangCon key={c.khoa} className={`${DINH_TRAI} [&>td]:h-[38px]`}><td>{c.nhan}</td>{oLop(c, true)}</HangCon>
                            ))}
                          </Fragment>
                        ))}
                        {data.gom && (
                          <Fragment>
                            <HangNhom mo={mo.has('gom')} onMo={() => doiMo('gom')} nhan="lớp khác" soCotDau={6} className={`${DINH_TRAI} [&>td]:h-11`}
                              tieuDe={<span className="block truncate text-slate-300">{data.gom.soLop} lớp khác · ≤ 2 vi phạm, đã xử lý hết</span>} />
                            {mo.has('gom') && data.gom.hang.map((x) => (
                              <HangCon key={x.khoa} className={`${DINH_TRAI} [&>td]:h-[38px]`}><td>{tenLopCell(x)}</td>{oLop(x, false)}</HangCon>
                            ))}
                          </Fragment>
                        )}
                      </tbody>
                    </table>
                  </div>
                  )}
                  <div className="px-3"><PhanTrang {...ptLop.thanh} duoi /></div>
                  </>
                )}
            </Card>
          </>
        )}
    </div>
  );
}
