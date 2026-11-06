import { columns } from './seed-data.mjs';

const DONE_COLUMN = 'shipped';
export const ALL_DONE_MESSAGE = '已经全部准备好了，可以发布';

// 生成可复制的发布清单：只列未完成事项（标题、负责人、截止时间）。
// 不写入、不发送任何内容，纯函数，便于页面与测试共用。
export function buildReleaseChecklist(board) {
  const lines = [];
  for (const column of columns) {
    if (column.id === DONE_COLUMN) continue;
    const tasks = Array.isArray(board?.[column.id]) ? board[column.id] : [];
    for (const task of tasks) {
      if (!task || typeof task !== 'object') continue;
      const title = task.title ?? '未命名事项';
      const owner = task.owner?.name ?? '未指定';
      const dueDate = task.dueDate ?? '未设置';
      lines.push(`- ${title}｜负责人：${owner}｜截止：${dueDate}`);
    }
  }
  if (lines.length === 0) return ALL_DONE_MESSAGE;
  return [`发布清单 · 未完成事项（${lines.length} 项）`, ...lines].join('\n');
}
