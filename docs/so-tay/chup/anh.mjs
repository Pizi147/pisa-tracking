// Danh sách mọi ảnh sổ tay (mỗi vai một file anh-*.mjs).
import { ANH_GV } from './anh-gv.mjs';
import { ANH_QL } from './anh-ql.mjs';
import { ANH_TVV, ANH_ADMIN } from './anh-tvv.mjs';

export const ANH = [...ANH_GV, ...ANH_QL, ...ANH_TVV, ...ANH_ADMIN];
