import EventEmitter from 'eventemitter3';
import { Notice, Plugin } from 'obsidian';

export type TimerMode = 'stopwatch' | 'pomodoro';

interface TimerState {
  running: boolean;
  mode: TimerMode;
  start: number; // epoch ms
  elapsed: number; // ms accumulated when paused
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

  private reset(mode: TimerMode, cardId?: string) {
    this.state = {
      running: false,
      mode,
      start: 0,
      elapsed: 0,
      targetCardId: cardId,
    };
    this.emitter.emit('change');
  }

  start(mode: TimerMode, cardId?: string) {
    if (this.state.running) {
      this.stop();
    }
    this.state.mode = mode;
    this.state.start = Date.now();
    this.state.elapsed = 0;
    this.state.running = true;
    this.state.targetCardId = cardId;
    this.emitter.emit('start');
  }

  stop() {
    if (!this.state.running) return;
    this.state.elapsed += Date.now() - this.state.start;
    this.state.running = false;
    this.emitter.emit('stop');
  }

  toggle(mode: TimerMode, cardId?: string) {
    if (this.state.running && this.state.mode === mode && this.state.targetCardId === cardId) {
      this.stop();
    } else {
      this.start(mode, cardId);
    }
  }

  isRunning(mode?: TimerMode, cardId?: string) {
    if (!this.state.running) return false;
    if (mode && this.state.mode !== mode) return false;
    if (cardId && this.state.targetCardId !== cardId) return false;
    return true;
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