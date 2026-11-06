import { useRef, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { move } from '@dnd-kit/helpers';
import { DragDropProvider, DragOverlay, type DragStartEvent, type DragOverEvent, type DragEndEvent } from '@dnd-kit/react';
import { isSortable } from '@dnd-kit/react/sortable';
import { columns, columnIds } from '../seed-data.mjs';
import { createBoardStore } from '../board-store.mjs';
import { buildReleaseChecklist } from '../release-checklist.mjs';
import { KanbanColumn } from './kanban-column';
import { TaskCard } from './task-card';
import type { BoardState, ColumnId, Task } from './types';

type TaskDragData = { type: 'task'; task: Task; columnId: ColumnId };
function isColumnId(value: unknown): value is ColumnId {
  return typeof value === 'string' && columnIds.includes(value);
}
function isTaskDragData(value: unknown): value is TaskDragData {
  return typeof value === 'object' && value !== null && 'type' in value && value.type === 'task'
    && 'task' in value && typeof value.task === 'object' && value.task !== null
    && 'columnId' in value && isColumnId(value.columnId);
}

export function Kanban() {
  const [store] = useState(() => createBoardStore(window.localStorage));
  const [board, setBoard] = useState<BoardState>(() => store.getBoard());
  const [showChecklist, setShowChecklist] = useState(false);
  const boardBeforeDrag = useRef(board);

  function updateBoard(next: BoardState) {
    store.setBoard(next);
    setBoard(store.getBoard());
  }
  function handleDragStart(event: DragStartEvent) {
    if (event.operation.source?.type === 'task') boardBeforeDrag.current = board;
  }
  function handleDragOver(event: DragOverEvent) {
    if (event.operation.source?.type === 'task') updateBoard(move(store.getBoard(), event));
  }
  function handleDragEnd(event: DragEndEvent) {
    if (event.canceled && event.operation.source?.type === 'task') updateBoard(boardBeforeDrag.current);
  }

  const total = Object.values(board).flat().length;
  const done = board.shipped.length;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="launch-project-heading">
        <div>
          <div className="project-eyebrow">项目发布 / 2026.11</div>
          <h1>Agent Notes <span>1.0</span></h1>
          <p>从第一张截图，到正式发布。把每件事推进一步。</p>
        </div>
        <div className="launch-progress" aria-label={`已完成 ${done} 项，共 ${total} 项`}>
          <span><strong>{done}</strong> / {total} 已完成</span>
          <div className="launch-progress-track"><div style={{ width: `${done / total * 100}%` }} /></div>
        </div>
      </div>
      <div className="launch-board-toolbar">
        <span className="launch-board-tab">发布看板</span>
        <div className="launch-board-actions">
          <span className="launch-board-hint">拖动卡片，更新进度</span>
          <button type="button" className="launch-checklist-button" onClick={() => setShowChecklist(true)}>
            <ClipboardList size={14} strokeWidth={1.8} />生成发布清单
          </button>
        </div>
      </div>
      {showChecklist && (
        <section className="launch-checklist" aria-label="发布清单">
          <div className="launch-checklist-head">
            <span className="launch-checklist-title">发布清单</span>
            <div className="launch-checklist-actions">
              <span className="launch-checklist-hint">点文字可全选复制</span>
              <button type="button" className="launch-checklist-close" onClick={() => setShowChecklist(false)} aria-label="关闭发布清单">关闭</button>
            </div>
          </div>
          <pre className="launch-checklist-text">{buildReleaseChecklist(board)}</pre>
        </section>
      )}
      <DragDropProvider onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className="launch-board-scroll">
          <div className="launch-board-grid">
            {columns.map((column) => <KanbanColumn key={column.id} column={column} tasks={board[column.id]} />)}
          </div>
        </div>
        <DragOverlay dropAnimation={null}>
          {(source) => {
            if (source.type !== 'task' || !isTaskDragData(source.data)) return null;
            const columnId = isSortable(source) && isColumnId(source.group) ? source.group : source.data.columnId;
            return <TaskCard task={source.data.task} columnId={columnId} isOverlay />;
          }}
        </DragOverlay>
      </DragDropProvider>
    </div>
  );
}
