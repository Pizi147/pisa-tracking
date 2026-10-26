/**
 * Danh sách tệp MÀN GV (R1-EN-1, chủ SP 26/10 D11: chỉ màn GV có tiếng Anh) → `scripts/man-gv.json`.
 * Cách lập: route vai GV mở được (`web/src/App.tsx` + cờ `navOf` của vai teacher: Tổng quan, Học viên & Lớp, hồ sơ lớp / HV / Mock Test / Case,
 * Test › Chấm Test + Lịch Test, Công việc › Hỗ trợ học viên + Yêu cầu của tôi, hồ sơ GV, Hướng dẫn) → component trang → mọi tệp
 * `web/src/modules/**` nó import (bắc cầu, cả `import()` động). Bỏ `platform/`, `dev/` và không đi vào trang / tab chỉ QL / QT / Admin (`DUNG`).
 * Chạy lại khi thêm tệp: node scripts/man-gv.mjs   (phép kiểm EN-GV đỏ khi tệp JSON lệch kết quả hàm này)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const M = 'web/src/modules/';
const VAO = ['worklist/OverviewPage', 'fasttrack/MockDetailPage', 'students/StudentsPage', 'classes/ClassOverviewPage', 'students/StudentDetailPage',
  'students/LuuTruPage', 'cases/CaseBoardPage', 'test/TestPage', 'congViec/CongViecPage', 'giaoVien/HoSoGiaoVienPage', 'huongDan/HuongDanPage']
  .map((f) => `${M}${f}.tsx`);
/** Trang / tab vai GV không có (seed `teacher`: không plan.week, meeting, request.approve, analysis; MockTestAdmin = vai Admin). */
const DUNG = new Set(['test/KeHoachTestTab', 'worklist/MgmtTasksPage', 'worklist/MeetingPage', 'duyet/HopChoDuyet', 'phanTich/PhanTichPage',
  'platform/AdminPage', 'worklist/MockTestAdmin'].map((f) => `${M}${f}.tsx`));

export function tepManGv() {
  const da = new Set();
  const di = (rel) => {
    if (da.has(rel) || DUNG.has(rel) || !rel.startsWith(M) || /^web\/src\/modules\/(platform|dev)\//.test(rel)) return;
    da.add(rel);
    const src = fs.readFileSync(path.join(GOC, rel), 'utf8');
    for (const m of src.matchAll(/(?:from|import)\s*\(?\s*['"](\.{1,2}\/[^'"]+)['"]/g)) {
      const dich = path.posix.normalize(path.posix.join(path.posix.dirname(rel), m[1]));
      const tep = [dich, `${dich}.tsx`, `${dich}.ts`].find((f) => /\.tsx?$/.test(f) && fs.existsSync(path.join(GOC, f)));
      if (tep) di(tep);
    }
  };
  VAO.forEach(di);
  return [...da].sort();
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const ds = tepManGv();
  fs.writeFileSync(path.join(GOC, 'scripts/man-gv.json'), JSON.stringify(ds, null, 1) + '\n');
  console.error(`${ds.length} tệp màn GV → scripts/man-gv.json`);
}
