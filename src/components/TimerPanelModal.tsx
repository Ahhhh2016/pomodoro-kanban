/** @jsx h */
import { h } from 'preact';
import { App, Modal, Notice } from 'obsidian';
import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { TimerManager } from '../TimerManager';

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
  onClose: () => void;
}

function TimerPanel({ timer, onClose }: Props) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const update = () => setTick((v) => v + 1);
    timer.emitter.on('tick', update);
    timer.emitter.on('start', update);
    timer.emitter.on('stop', update);
    return () => {
      timer.emitter.off('tick', update);
      timer.emitter.off('start', update);
      timer.emitter.off('stop', update);
    };
  }, [timer]);

  const isPomodoro = timer.state.mode === 'pomodoro';
  const isRunning = timer.state.running;
  const timeStr = isPomodoro ? formatTime(timer.getRemaining()) : formatTime(timer.getElapsed());

  const toggle = () => {
    timer.toggle(timer.state.mode, timer.state.targetCardId);
  };

  const switchMode = () => {
    const newMode = isPomodoro ? 'stopwatch' : 'pomodoro';
    timer.stop();
    timer.start(newMode, timer.state.targetCardId);
  };

  return (
    <div className="kanban-timer-panel">
      <h2 style={{ marginTop: 0 }}>{isPomodoro ? 'Pomodoro' : 'Stopwatch'}</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ fontSize: '2rem', flexGrow: 1 }}>{timeStr}</div>
        <button onClick={toggle}>{isRunning ? 'Stop' : 'Start'}</button>
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
  constructor(app: App, timer: TimerManager) {
    super(app);
    this.timer = timer;
  }

  onOpen() {
    render(<TimerPanel timer={this.timer} onClose={() => this.close()} />, this.contentEl);
  }

  onClose() {
    render(null, this.contentEl);
  }
} 