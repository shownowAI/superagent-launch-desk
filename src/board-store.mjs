import { initialBoard, columnIds } from './seed-data.mjs';

// 拖动后的看板状态保存在这里，刷新时重新读回。
const STORAGE_KEY = 'launch-desk-board';

function isBoard(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    && columnIds.every((id) => Array.isArray(value[id]));
}

function readBoard(storage) {
  try {
    const raw = storage?.getItem?.(STORAGE_KEY);
    if (raw == null) return null;
    const parsed = JSON.parse(raw);
    if (!isBoard(parsed)) return null;
    // 只取已知的四列，避免把存储里的额外字段带进页面。
    const board = {};
    for (const id of columnIds) board[id] = parsed[id];
    return board;
  } catch {
    // 存储不可用或数据损坏时回到初始清单。
    return null;
  }
}

export function createBoardStore(storage) {
  let board = readBoard(storage) ?? structuredClone(initialBoard);
  return {
    getBoard: () => board,
    setBoard(nextBoard) {
      board = nextBoard;
      try {
        storage?.setItem?.(STORAGE_KEY, JSON.stringify(nextBoard));
      } catch {
        // 浏览器禁用存储或配额已满时，至少保留本次会话内的状态。
      }
    },
  };
}
