import EventEmitter from 'eventemitter3';
import { Notice, Plugin, TFile } from 'obsidian';
import moment from 'moment';
import update from 'immutability-helper';
import { StopReasonModal } from './components/StopReasonModal';

export type TimerMode = 'stopwatch' | 'pomodoro' | 'break';

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
  /** track number of state managers parsed */
  private lastParsedSmCount = 0;

  /** Duration of a pomodoro session, in milliseconds */
  pomodoroDefault = 25 * 60 * 1000; // default 25 min, can be overridden via settings
  /** Duration of current break session (ms) */
  private breakDurationMs: number = 5 * 60 * 1000;
  /** Completed pomodoro count (for long break logic) */
  private pomodoroCount: number = 0;

  private shortBreakMs: number = 5 * 60 * 1000;
  private longBreakMs: number = 15 * 60 * 1000;
  private longBreakInterval: number = 4;

  /** Returns total break duration ms currently active */
  getBreakDuration() {
    return this.breakDurationMs;
  }

  constructor(plugin: Plugin) {
    this.plugin = plugin;
    this.emitter = new EventEmitter();
    this.state = {
      running: false,
      mode: 'stopwatch',
      start: 0,
      elapsed: 0,
    };

    // Apply initial durations from settings
    this.updateSettings();

    // Subscribe to board-specific duration changes
    this.subscribeBoardDurationChanges();

    // Obsidian helper that clears when plugin unloads
    this.intervalId = (plugin.registerInterval as any)(
      window.setInterval(() => this.tick(), 1000)
    );
  }

  /**
   * Play end-of-session sound if enabled in settings.
   * Uses user-provided audio file path if available, otherwise falls back to a simple beep generated via Web Audio API.
   */
  private playEndSound() {
    const settings: any = (this.plugin as any).settings ?? {};
    if (!settings['timer-enable-sounds']) return;

    const path: string | undefined = settings['timer-sound-file']?.trim?.();
    let src: string | null = null;

    if (path) {
      try {
        const file = this.plugin.app.vault.getAbstractFileByPath(path);
        if (file) {
          src = this.plugin.app.vault.getResourcePath(file as TFile);
        }
      } catch (err) {
        console.error('Unable to resolve audio file path', err);
      }
    }

    if (src) {
      try {
        const audio = new Audio(src);
        audio.volume = 1.0;
        audio.play().catch(() => {/* ignore autoplay restrictions */});
        return;
      } catch (err) {
        console.error('Failed to play custom audio', err);
      }
    }

    // Fallback: generate a short beep using Web Audio API
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 1000; // 1kHz beep
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      gain.gain.setValueAtTime(1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1);
      oscillator.stop(ctx.currentTime + 1);
    } catch (err) {
      console.error('Failed to play fallback beep', err);
    }
  }

  /** Attach listeners to each board's settings notifier so local duration changes apply immediately */
  private subscribeBoardDurationChanges() {
    const sms: Map<any, any> = (this.plugin as any).stateManagers;
    if (!sms) return;
    sms.forEach((sm: any) => {
      if (!sm?.settingsNotifiers) return;
      let arr = sm.settingsNotifiers.get('timer-pomodoro');
      if (!arr) {
        arr = [];
        sm.settingsNotifiers.set('timer-pomodoro', arr);
      }
      const listener = () => {
        // If current timer belongs to this board, update duration
        if (this.state.running && this.resolvePomodoroForCard(this.state.targetCardId) !== null) {
          this.applyPomodoroForCard(this.state.targetCardId);
        }
      };
      arr.push(listener);
    });
  }

  /**
   * Re-read duration-related settings and update internal values.
   * Should be called whenever plugin.settings changes.
   */
  updateSettings() {
    // Expect plugin.settings to exist and follow KanbanSettings interface
    const settings: any = (this.plugin as any).settings ?? {};

    const pomodoroMin = Number(settings['timer-pomodoro']);
    if (!isNaN(pomodoroMin) && pomodoroMin > 0) {
      this.pomodoroDefault = pomodoroMin * 60 * 1000;
    } else {
      this.pomodoroDefault = 25 * 60 * 1000;
    }

    // break durations
    const shortMin = Number(settings['timer-short-break']);
    const longMin = Number(settings['timer-long-break']);
    const interval = Number(settings['timer-long-break-interval']) || 4;

    this.shortBreakMs = !isNaN(shortMin) && shortMin > 0 ? shortMin * 60 * 1000 : 5 * 60 * 1000;
    this.longBreakMs = !isNaN(longMin) && longMin > 0 ? longMin * 60 * 1000 : 15 * 60 * 1000;
    this.longBreakInterval = interval;
  }

  /** Get board-local pomodoro minutes for the given card, falling back to global */
  private resolvePomodoroForCard(cardId?: string): number {
    if (!cardId) return null;
    const sms: Map<any, any> = (this.plugin as any).stateManagers;
    if (!sms) return null;
    for (const sm of sms.values()) {
      // quick check if board contains this card id
      const contains = (board: any): boolean => {
        if (!board?.children) return false;
        const stack = [...board.children];
        while (stack.length) {
          const node = stack.pop();
          if (node.id === cardId) return true;
          if (node.children?.length) stack.push(...node.children);
        }
        return false;
      };

      if (contains(sm.state)) {
        const val = sm.getSetting?.('timer-pomodoro');
        if (val !== undefined && val !== null) return Number(val);
      }
    }
    return null;
  }

  private applyPomodoroForCard(cardId?: string) {
    const localMin = this.resolvePomodoroForCard(cardId);
    if (localMin && !isNaN(localMin) && localMin > 0) {
      this.pomodoroDefault = localMin * 60 * 1000;
    } else {
      // fallback to global
      this.updateSettings();
    }
  }

  private tick() {
    if (!this.state.running) return;
    // emit tick each second
    this.emitter.emit('tick');
    if (this.state.mode === 'pomodoro') {
      const spent = Date.now() - this.state.start + this.state.elapsed;
      if (spent >= this.pomodoroDefault) {
        // Auto-complete pomodoro without interruption reason panel
        this.completePomodoro();
      }
    }

    if (this.state.mode === 'break') {
      const spent = Date.now() - this.state.start + this.state.elapsed;
      if (spent >= this.breakDurationMs) {
        this.stop(false);
        new Notice('Break over!');
        this.playEndSound();
      }
    }
  }

  private completePomodoro() {
    // finish current pomodoro session
    this.stop(false);
    this.playEndSound();
    this.pomodoroCount += 1;

    // determine break length
    const isLong = this.pomodoroCount % this.longBreakInterval === 0;
    this.breakDurationMs = isLong ? this.longBreakMs : this.shortBreakMs;

    // start break
    this.start('break', this.state.targetCardId);
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
    
    // Apply board-local duration if available
    this.applyPomodoroForCard(cardId);

    this.state.mode = mode;
    this.state.targetCardId = cardId;
    this.state.running = true;
    this.state.start = Date.now();
    this.currentSessionStart = this.state.start;
    this.emitter.emit('start');
    this.emitter.emit('change');
  }

  /**
   * Stop the current timer.
   * @param askReason When true, shows StopReasonModal to collect interruption reason. When false, directly finalizes the session.
   */
  stop(askReason: boolean = true) {
    if (!this.state.running) return;
 
    // Temporarily stop the timer
    this.stopTimer();
    
    const finalizeSession = () => {
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
      this.appendSessionToMarkdown(
        this.state.targetCardId,
        this.currentSessionStart,
        end,
        duration
      );
      this.emitter.emit('log');

      this.reset(this.state.mode, this.state.targetCardId);
      this.emitter.emit('change');
    };

    if (!askReason) {
      // Directly finalize without modal
      finalizeSession();
      return;
    }

    // Show stop reason modal for interruptions
    const stateManager = this.getStateManagerForCard(this.state.targetCardId);
    new StopReasonModal(
      this.plugin,
      (reason: string) => {
        // User selected reason, finalize
        this.emitter.emit('stop');
        new Notice(`Timer stopped: ${reason}`);
        finalizeSession();
      },
      () => {
        // Resume timer if modal closed without selecting a reason
        this.resumeTimer();
      },
      stateManager
    ).open();
  }

  toggle(mode: TimerMode, cardId?: string) {
    // 如果有计时器在运行
    if (this.state.running) {
      // 正在运行时，如果点击的是同一个卡片 => 停止计时
      if (!cardId || cardId === this.state.targetCardId) {
        this.stop();
        return;
      }

      // 切换到新的卡片：记录之前卡片的日志，然后继续
      const now = Date.now();
      const duration = now - this.currentSessionStart;
      // 记录前一段 session
      this.logs.push({
        cardId: this.state.targetCardId,
        cardTitle: this.getCardTitle(this.state.targetCardId),
        mode: this.state.mode,
        start: this.currentSessionStart,
        end: now,
        duration,
      });
      this.appendSessionToMarkdown(this.state.targetCardId, this.currentSessionStart, now, duration);
      this.emitter.emit('log');

      // 切换目标卡片并重置当前 session 起点
      this.state.targetCardId = cardId;

      // Keep current session timing and target duration unchanged when switching cards
      // Do NOT adjust pomodoro/break durations on switch; only apply on start()
      this.currentSessionStart = now;
      this.emitter.emit('change');
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

  /** Returns remaining ms for pomodoro or break; 0 for stopwatch */
  getRemaining() {
    if (this.state.mode === 'pomodoro') {
      const remaining = this.pomodoroDefault - this.getElapsed();
      return remaining > 0 ? remaining : 0;
    }
    if (this.state.mode === 'break') {
      const remaining = this.breakDurationMs - this.getElapsed();
      return remaining > 0 ? remaining : 0;
    }
    return 0;
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
    const sms: Map<any, any> = (this.plugin as any).stateManagers;
    if (!sms) return;
    if (!this.markdownParsed || sms.size !== this.lastParsedSmCount) {
      this.parseLogsFromMarkdown();
      this.markdownParsed = true;
      this.lastParsedSmCount = sms.size;
    }
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

  /** Get the stateManager for a given card */
  private getStateManagerForCard(cardId?: string): any | undefined {
    if (!cardId) return undefined;
    if (!(this.plugin as any).stateManagers) return undefined;
    const sms: Map<any, any> = (this.plugin as any).stateManagers;
    for (const sm of sms.values()) {
      const board = sm.state;
      if (!board?.children) continue;
      for (const lane of board.children) {
        const item = this.findItemInLane(lane, cardId);
        if (item) return sm;
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