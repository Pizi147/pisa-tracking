/** `npm run nap-so` — SỔ NGHĨA VỤ: nạp sổ một lần sau migrate (spec 2.4) cho database đang trỏ tới (`PISA_DB` / Turso). In số dòng + số câu / dòng đọc. */
import { napSoNghiaVu } from '../migrate/prNghiaVuNap.ts';
import { soCauSql, soDongSql } from '../platform/nguCanhRequest.ts';

const t0 = Date.now(), c0 = soCauSql(), d0 = soDongSql();
const kq = napSoNghiaVu();
console.log(`[nap-so] ${kq.bai} dòng bài · ${kq.viec} dòng việc · ${soCauSql() - c0} câu · ${soDongSql() - d0} dòng trả về · ${Math.round((Date.now() - t0) / 1000)} s`);
