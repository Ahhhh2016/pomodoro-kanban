import { Menu } from 'obsidian';
import { Item } from '../types';
import { TimerManager } from '../../TimerManager';

export function useTimerMenu(item: Item, timerManager: TimerManager) {
  return (e: MouseEvent) => {
    const menu = new Menu();

    const isRunning = timerManager.state.running;
    const isThisTarget = timerManager.state.targetCardId === item.id;

    // When a timer is running and the user clicks a different card, offer switch/stop
    if (isRunning && !isThisTarget) {
      menu
        .addItem((mi) =>
          mi
            .setIcon('lucide-arrow-right')
            .setTitle('切换到此卡片')
            .onClick(() => timerManager.toggle(timerManager.state.mode, item.id))
        )
        .addItem((mi) =>
          mi
            .setIcon('lucide-stop-circle')
            .setTitle('停止计时')
            .onClick(() => timerManager.stop())
        );

      menu.showAtMouseEvent(e);
      return;
    }

    // If timer is running on this card, only allow stopping
    if (isRunning && isThisTarget) {
      menu
        .addItem((mi) =>
          mi
            .setIcon('lucide-stop-circle')
            .setTitle('停止计时')
            .onClick(() => timerManager.stop())
        );

      menu.showAtMouseEvent(e);
      return;
    }

    // Default: not running => allow starting pomodoro or stopwatch
    const isPomodoroRunning = timerManager.isRunning('pomodoro', item.id);
    const isStopwatchRunning = timerManager.isRunning('stopwatch', item.id);

    menu
      .addItem((mi) =>
        mi
          .setIcon('lucide-timer')
          .setTitle(isPomodoroRunning ? '停止番茄钟' : '开始番茄钟')
          .onClick(() => timerManager.toggle('pomodoro', item.id))
      )
      .addItem((mi) =>
        mi
          .setIcon('lucide-clock')
          .setTitle(isStopwatchRunning ? '停止秒表' : '开始秒表')
          .onClick(() => timerManager.toggle('stopwatch', item.id))
      );

    menu.showAtMouseEvent(e);
  };
} 