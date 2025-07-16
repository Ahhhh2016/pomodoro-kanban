import EventEmitter from 'eventemitter3';
import { Notice, Plugin } from 'obsidian';
import moment from 'moment';
import update from 'immutability-helper';
import { StopReasonModal } from './components/StopReasonModal';

export type TimerMode = 'stopwatch' | 'pomodoro';

interface TimerState {
  running: boolean;
  mode: TimerMode;
  start: number;
  elapsed: number;
  targetCardId?: string;
}

export interface FocusSession {
  cardId?: string;
  cardTitle?: string;
  mode: TimerMode;
  start: number;
  end: number;
  duration: number;
}

export class TimerManager {
  plugin: Plugin;
  emitter: EventEmitter;
  state: TimerState;
  intervalId: number;
  /** List of all focus sessions */
  logs: FocusSession[] = [];
  /** Temp variable to track current session start time */
  private currentSessionStart: number = 0;
  /** whether markdown logs have been parsed */
  private markdownParsed = false;
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
    // Prevent starting a timer without a target card
    if (!cardId) {
      new Notice('Please select a card before starting the timer');
      return;
    }

    // Don't start if we're in the middle of stopping
    if (this.state.running) {
      return;
    }
    
    this.state.mode = mode;
    this.state.targetCardId = cardId;
    this.state.running = true;
    this.state.start = Date.now();
    this.currentSessionStart = this.state.start;
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
        const end = Date.now();
        const duration = end - this.currentSessionStart;
        this.logs.push({
          cardId: this.state.targetCardId,
          cardTitle: this.getCardTitle(this.state.targetCardId),
          mode: this.state.mode,
          start: this.currentSessionStart,
          end,
          duration,
        });
        // Persist to markdown
        this.appendSessionToMarkdown(this.state.targetCardId, this.currentSessionStart, end, duration);
        this.emitter.emit('log');

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

  /** Returns total focused milliseconds for a given card */
  getTotalFocused(cardId?: string) {
    this.ensureMarkdownLogs();
    if (!cardId) return 0;
    return this.logs
      .filter((l) => l.cardId === cardId)
      .reduce((sum, l) => sum + l.duration, 0);
  }

  /** Returns focus sessions for the given date (defaults to today) */
  getLogsForDate(date: Date = new Date()) {
    this.ensureMarkdownLogs();
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    return this.logs.filter((l) => l.start >= dayStart && l.start < dayEnd);
  }

  private ensureMarkdownLogs() {
    if (this.markdownParsed) return;
    this.parseLogsFromMarkdown();
    this.markdownParsed = true;
  }

  private parseLogsFromMarkdown() {
    const sms: Map<any, any> = (this.plugin as any).stateManagers;
    if (!sms) return;
    // Match timelog lines with optional list bullet, supporting ++, 🍅, or ⏱ markers, allowing spaces around dash variants (–, —, -)
    const lineRegex = /^(?:[-*]\s+)?(?:\+\+|🍅|⏱)\s+@\{(\d{4}-\d{2}-\d{2})\}\s+@@\{(\d{2}:\d{2})\}\s*[–—-]\s*@@\{(\d{2}:\d{2})\}\s+\((\d+)\s+m/;

    for (const sm of sms.values()) {
      const board = sm.state;
      if (!board?.children) continue;
      for (const lane of board.children) {
        this.extractItemLogsRecursive(sm, lane.children, lineRegex);
      }
    }
  }

  private extractItemLogsRecursive(sm: any, items: any[], lineRegex: RegExp) {
    if (!items) return;
    for (const it of items) {
      const lines = (it.data?.titleRaw as string)?.split(/\n/).slice(1) ?? [];
      for (const ln of lines) {
        const m = ln.trim().match(lineRegex);
        if (m) {
          const [_, dateStr, startStr, endStr, minsStr] = m;
          const start = moment(`${dateStr} ${startStr}`, 'YYYY-MM-DD HH:mm').valueOf();
          const end = moment(`${dateStr} ${endStr}`, 'YYYY-MM-DD HH:mm').valueOf();
          const duration = parseInt(minsStr, 10) * 60000;
          // prevent duplicates
          if (!this.logs.find((l) => l.start === start && l.cardId === it.id)) {
            this.logs.push({
              cardId: it.id,
              cardTitle: it.data?.title,
              mode: ln.includes('🍅') ? 'pomodoro' : 'stopwatch',
              start,
              end,
              duration,
            });
          }
        }
      }
      if (it.children?.length) this.extractItemLogsRecursive(sm, it.children, lineRegex);
    }
  }

  private findItemInLane(lane: any, cardId: string): any {
    if (!lane?.children) return null;
    for (const child of lane.children) {
      if (child?.data?.title && child.id === cardId) return child;
      const found = this.findItemInLane(child, cardId);
      if (found) return found;
    }
    return null;
  }

  private getCardTitle(cardId?: string): string | undefined {
    if (!cardId) return undefined;
    if (!(this.plugin as any).stateManagers) return undefined;
    const sms: Map<any, any> = (this.plugin as any).stateManagers;
    for (const sm of sms.values()) {
      const board = sm.state;
      if (!board?.children) continue;
      for (const lane of board.children) {
        const item = this.findItemInLane(lane, cardId);
        if (item) return item.data?.title;
      }
    }
    return undefined;
  }

  /** Append session bullet under the corresponding card in markdown and update board */
  private appendSessionToMarkdown(cardId: string | undefined, start: number, end: number, duration: number) {
    if (!cardId) return;
    const line = `++ ${moment(start).format('@{YYYY-MM-DD}')} @@{${moment(start).format('HH:mm')}} – @@{${moment(end).format('HH:mm')}} (${Math.round(duration / 60000)} m)`;
    for (const sm of (this.plugin as any).stateManagers?.values?.() ?? []) {
      const board = sm.state;
      const updated = this.appendToBoard(sm, board, cardId, line);
      if (updated) {
        sm.setState(updated);
        break; // card ids are unique across boards
      }
    }
  }

  private appendToBoard(sm: any, board: any, cardId: string, line: string): any | null {
    const updateItems = (items: any[]): any[] => {
      return items.map((it) => {
        if (it.id === cardId) {
          const newContent = it.data.titleRaw + `\n${line}`;
          const newItem = sm.updateItemContent(it, newContent);
          return newItem;
        }
        if (it.children?.length) {
          const newChildren = updateItems(it.children);
          if (newChildren !== it.children) {
            return update(it, { children: { $set: newChildren } });
          }
        }
        return it;
      });
    };

    const traverseLanes = (lanes: any[]): any[] => {
      return lanes.map((lane) => {
        const newChildren = updateItems(lane.children);
        if (newChildren !== lane.children) {
          return update(lane, { children: { $set: newChildren } });
        }
        return lane;
      });
    };

    const newLanes = traverseLanes(board.children);
    if (newLanes === board.children) return null;
    return update(board, { children: { $set: newLanes } });
  }
} 