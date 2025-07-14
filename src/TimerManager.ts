import EventEmitter from 'eventemitter3';
import { Notice, Plugin } from 'obsidian';
import { StopReasonModal } from './components/StopReasonModal';

export type TimerMode = 'stopwatch' | 'pomodoro';

interface TimerState {
  running: boolean;
  mode: TimerMode;
  start: number;
  elapsed: number;
  targetCardId?: string;
}

export class TimerManager {
  plugin: Plugin;
  emitter: EventEmitter;
  state: TimerState;
  intervalId: number;
  readonly pomodoroDefault = 25 * 60 * 1000; // 25 minutes

  constructor(plugin: Plugin) {
    this.plugin = plugin;
    this.emitter = new EventEmitter();
    this.state = {
      running: false,
      mode: 'stopwatch',
      start: 0,
      elapsed: 0,
    };

    // Obsidian helper that clears when plugin unloads
    this.intervalId = (plugin.registerInterval as any)(
      window.setInterval(() => this.tick(), 1000)
    );
  }

  private tick() {
    if (!this.state.running) return;
    // emit tick each second
    this.emitter.emit('tick');
    if (this.state.mode === 'pomodoro') {
      const spent = Date.now() - this.state.start + this.state.elapsed;
      if (spent >= this.pomodoroDefault) {
        this.stop();
        new Notice('Pomodoro complete!');
      }
    }
  }

  reset(mode: TimerMode, cardId?: string) {
    const wasRunning = this.state.running;
    this.state = {
      running: false,
      mode,
      start: 0,
      elapsed: 0,
      targetCardId: cardId,
    };
   
    this.emitter.emit('change');
  }

  private stopTimer() {
    if (!this.state.running) return;
    this.state.elapsed += Date.now() - this.state.start;
    this.state.running = false;
    this.emitter.emit('change');
  }

  private resumeTimer() {
    if (this.state.running) return;
    this.state.running = true;
    this.state.start = Date.now();
    this.emitter.emit('start');
    this.emitter.emit('change');
  }

  start(mode: TimerMode, cardId?: string) {
    // Don't start if we're in the middle of stopping
    if (this.state.running) {
      return;
    }
    
    this.state.mode = mode;
    this.state.targetCardId = cardId;
    this.state.running = true;
    this.state.start = Date.now();
    this.emitter.emit('start');
    this.emitter.emit('change');
  }

  stop() {
    if (!this.state.running) return;
    
    // Temporarily stop the timer
    this.stopTimer();
    
    // Show stop reason modal
    new StopReasonModal(
      this.plugin.app, 
      (reason: string) => {
        // First emit stop event
        this.emitter.emit('stop');
        new Notice(`Timer stopped: ${reason}`);
        
        // Reset timer state
        this.reset(this.state.mode, this.state.targetCardId);
        this.emitter.emit('change');
      },
      () => {
        // Resume timer if modal is closed without selecting a reason
        this.resumeTimer();
      }
    ).open();
  }

  toggle(mode: TimerMode, cardId?: string) {
    // 如果有计时器在运行
    if (this.state.running) {
      // 无论点击哪个计时器，都先停止当前的计时器
      this.stop();
      return;
    }
    
    // 如果没有计时器在运行，直接启动被点击的计时器
    this.start(mode, cardId);
  }

  isRunning(mode?: TimerMode, cardId?: string) {
    if (!this.state.running) return false;
    if (mode && this.state.mode !== mode) return false;
    if (cardId && this.state.targetCardId !== cardId) return false;
    return this.state.running;
  }

  getElapsed() {
    if (!this.state.running) return this.state.elapsed;
    return Date.now() - this.state.start + this.state.elapsed;
  }

  /** Returns remaining ms for pomodoro, or 0 if stopwatch */
  getRemaining() {
    if (this.state.mode !== 'pomodoro') return 0;
    const remaining = this.pomodoroDefault - this.getElapsed();
    return remaining > 0 ? remaining : 0;
  }
} 