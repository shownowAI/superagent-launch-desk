import test from 'node:test';
import assert from 'node:assert/strict';
import { initialBoard } from '../src/seed-data.mjs';
import { createBoardStore } from '../src/board-store.mjs';
import { buildReleaseChecklist, ALL_DONE_MESSAGE } from '../src/release-checklist.mjs';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
}

test('清单列出未完成事项的标题、负责人与截止时间，不含已完成项', () => {
  const text = buildReleaseChecklist(initialBoard);
  assert.match(text, /发布清单/);
  for (const task of [...initialBoard.planned, ...initialBoard.building, ...initialBoard.qa]) {
    assert.ok(text.includes(task.title), `缺少未完成事项 ${task.title}`);
    assert.ok(text.includes(task.owner.name), `缺少负责人 ${task.owner.name}`);
    assert.ok(text.includes(task.dueDate), `缺少截止时间 ${task.dueDate}`);
  }
  for (const task of initialBoard.shipped) {
    assert.equal(text.includes(task.title), false, `不应列出已完成项 ${task.title}`);
  }
  assert.equal(text.includes(ALL_DONE_MESSAGE), false);
});

test('全部完成时不列事项，给出可发布提示', () => {
  const board = { planned: [], building: [], qa: [], shipped: structuredClone(initialBoard.shipped) };
  assert.equal(buildReleaseChecklist(board), ALL_DONE_MESSAGE);
});

test('清单跟随拖动并持久化后的看板，刷新后仍按最新状态生成', () => {
  const storage = memoryStorage();
  const store = createBoardStore(storage);
  const board = store.getBoard();
  const task = board.building.find((item) => item.id === 'REL-003');
  store.setBoard({
    ...board,
    building: board.building.filter((item) => item.id !== task.id),
    qa: [...board.qa, task],
  });
  const reopened = createBoardStore(storage);
  const text = buildReleaseChecklist(reopened.getBoard());
  assert.ok(text.includes('演示视频'));
  assert.ok(text.includes('Candy'));
  assert.ok(text.includes('周四'));
  assert.equal(text.includes('GitHub 项目'), false);
});

test('生成清单不改变看板状态', () => {
  const board = structuredClone(initialBoard);
  buildReleaseChecklist(board);
  assert.deepEqual(board, initialBoard);
});
