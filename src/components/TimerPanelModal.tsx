import { h } from 'preact';
import { App, Modal, Notice } from 'obsidian';
import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { TimerManager } from '../TimerManager';
import moment from 'moment';

function formatTime(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60)
    .toString()
    .padStart(2, '0');
  const s = (totalSec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

interface Props {
  timer: TimerManager;
  boardStateManager: any; // current board's state manager (for filtering card ids)
  onClose: () => void;
}

interface SessionBlockProps {
  session: import('../TimerManager').FocusSession;
}

function SessionBlock({ session }: SessionBlockProps) {
  const startStr = moment(session.start).format('HH:mm');
  const endStr = moment(session.end).format('HH:mm');
  const rawTitle = session.cardTitle ?? session.cardId ?? 'Untitled';
  const firstLine = rawTitle.split('\n')[0];
  const displayTitle = firstLine.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();

  return (
    <div className="kanban-timer-session-block">
      {/* 第一行：标题 */}
      <div>{displayTitle}</div>
      {/* 第二行：日期 + 时间范围 */}
      <em>
        {startStr} – {endStr}
      </em>
    </div>
  );
}

function TimerPanel({ timer, boardStateManager, onClose }: Props) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const update = () => setTick((v) => v + 1);
    timer.emitter.on('tick', update);
    timer.emitter.on('start', update);
    timer.emitter.on('stop', update);
    timer.emitter.on('log', update);
    return () => {
      timer.emitter.off('tick', update);
      timer.emitter.off('start', update);
      timer.emitter.off('stop', update);
      timer.emitter.off('log', update);
    };
  }, [timer]);

  const isPomodoro = timer.state.mode === 'pomodoro';
  const isBreak = timer.state.mode === 'break';
  const isRunning = timer.state.running;
  const timeStr = (isPomodoro || isBreak)
    ? formatTime(timer.getRemaining())
    : formatTime(timer.getElapsed());

  // Collect all card IDs belonging to this board so we can filter logs
  const collectIds = (items: any[]): string[] => {
    if (!items) return [];
    const ids: string[] = [];
    for (const it of items) {
      if (it.id) ids.push(it.id);
      if (it.children?.length) ids.push(...collectIds(it.children));
    }
    return ids;
  };

  const boardCardIds: Set<string> = new Set(
    collectIds(boardStateManager?.state?.children ?? [])
  );

  // Ensure markdown logs are loaded and get today's logs, then filter by board
  const todayLogs = timer
    .getLogsForDate()
    .filter((s) => s.cardId && boardCardIds.has(s.cardId));
  const totalMs = todayLogs.reduce((sum, s) => sum + s.duration, 0);
  const totalMin = Math.floor(totalMs / 60000);
  const pomodoroCount = todayLogs.filter((s) => s.mode === 'pomodoro').length;
  const totalStr = totalMin >= 60 ? `${Math.floor(totalMin / 60)}h ${totalMin % 60}m` : `${totalMin}m`;

  const toggle = () => {
    timer.toggle(timer.state.mode === 'break' ? 'stopwatch' : timer.state.mode, timer.state.targetCardId);
  };

  const switchMode = () => {
    const newMode = isPomodoro ? 'stopwatch' : 'pomodoro';
    if (timer.state.running) {
      timer.stop();
    }
    timer.reset(newMode, timer.state.targetCardId);
  };

  return (
    <div className="kanban-timer-panel">
      <h2 style={{ marginTop: 0 }}>{isPomodoro ? 'Pomodoro' : isBreak ? 'Break' : 'Stopwatch'}</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ fontSize: '2rem', flexGrow: 1 }}>{timeStr}</div>
        <button onClick={toggle}>{isRunning ? 'Stop' : 'Start'}</button>
      </div>

      {/* Logs header */}
      <div style={{ marginTop: '16px', fontWeight: 'bold' }}>
        TODAY&nbsp;&nbsp; {totalStr} &nbsp;&nbsp; {pomodoroCount} Pomodoro{pomodoroCount !== 1 ? 's' : ''}
      </div>

      {/* Session blocks */}
      <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '40vh', overflowY: 'auto' }}>
        {todayLogs.map((s) => (
          <SessionBlock key={s.start} session={s} />
        ))}
      </div>

      <div style={{ marginTop: '8px', fontStyle: 'italic' }}>
        {timer.state.targetCardId ? `Card: ${timer.state.targetCardId}` : 'No card'}
      </div>
      <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
        <button onClick={switchMode}>Switch Mode</button>
        <button
          onClick={() => {
            new Notice('Open settings in sidebar');
            (window as any).app.setting.openTabById('pomodoro-kanban');
            onClose();
          }}
        >
          Settings
        </button>
      </div>
    </div>
  );
}

export class TimerPanelModal extends Modal {
  timer: TimerManager;
  boardStateManager: any;
  constructor(app: App, timer: TimerManager, boardStateManager: any) {
    super(app);
    this.timer = timer;
    this.boardStateManager = boardStateManager;
  }

  onOpen() {
    render(
      <TimerPanel
        timer={this.timer}
        boardStateManager={this.boardStateManager}
        onClose={() => this.close()}
      />,
      this.contentEl
    );
  }

  onClose() {
    render(null, this.contentEl);
  }
} 