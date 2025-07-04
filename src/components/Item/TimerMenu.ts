import { Menu } from 'obsidian';
import { Item } from '../types';
import { TimerManager } from '../../TimerManager';

export function useTimerMenu(item: Item, timerManager: TimerManager) {
  return (e: MouseEvent) => {
    const menu = new Menu();

    const isPomodoroRunning = timerManager.isRunning('pomodoro', item.id);
    const isStopwatchRunning = timerManager.isRunning('stopwatch', item.id);

    menu
      .addItem((mi) =>
        mi
          .setIcon('lucide-timer')
          .setTitle(isPomodoroRunning ? 'Stop pomodoro' : 'Start pomodoro')
          .onClick(() => timerManager.toggle('pomodoro', item.id))
      )
      .addItem((mi) =>
        mi
          .setIcon('lucide-clock')
          .setTitle(isStopwatchRunning ? 'Stop stopwatch' : 'Start stopwatch')
          .onClick(() => timerManager.toggle('stopwatch', item.id))
      );

    menu.showAtMouseEvent(e);
  };
} 