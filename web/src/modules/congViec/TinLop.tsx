import { Fragment } from 'react';

const LA_TUAN = /^W\d [A-Z]{3}(, W\d [A-Z]{3})*$/;
const KHONG_NGAT = 'whitespace-nowrap';

/**
 * Thông tin dòng / đầu panel Chấm Speaking: số dính đơn vị ("13 bài", "8 quá hạn"), mỗi mã tuần một cụm — chỉ được xuống dòng sau ", " và " · "
 * (PTA 25/11: không ngắt "13 / bài").
 */
export function TinLop({ phan }: { phan: readonly string[] }) {
  return (
    <>
      {phan.filter(Boolean).map((p, i) => (
        <Fragment key={i}>
          {i > 0 && ' · '}
          {LA_TUAN.test(p)
            ? p.split(', ').map((w, j) => <Fragment key={j}>{j > 0 && ', '}<span className={KHONG_NGAT}>{w}</span></Fragment>)
            : <span className={KHONG_NGAT}>{p}</span>}
        </Fragment>
      ))}
    </>
  );
}
