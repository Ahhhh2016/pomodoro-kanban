import { Menu } from 'obsidian';
import { Item } from '../types';
import { TimerManager } from '../../TimerManager';
import { constructDatePicker, constructMenuDueDatePickerOnChange, deleteDueDate } from './helpers';
import { StateManager } from '../../StateManager';
import { BoardModifiers } from '../../helpers/boardModifiers';
import { Path } from '../../dnd/types';

export function useTimerMenu(
  item: Item, 
  timerManager: TimerManager, 
  stateManager: StateManager, 
  boardModifiers: BoardModifiers, 
  path: Path
) {
  return (e: MouseEvent) => {
    const menu = new Menu();

    const isRunning = timerManager.state.running;
    const isThisTarget = timerManager.state.targetCardId === item.id;

    // When a timer is running and the user clicks a different card, offer switch/stop and due date options
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

      // Add due date options even when timer is running on different card
      const hasDueDateInMetadata = !!item.data.metadata.duedate;
      const hasDueDateInContent = item.data.titleRaw.includes('due:@');
      const hasDueDate = hasDueDateInMetadata || hasDueDateInContent;
      
      menu.addItem((mi) => {
        mi
          .setIcon('lucide-calendar')
          .setTitle(hasDueDate ? '更改截止日期' : '添加截止日期')
          .onClick(() => {
            constructDatePicker(
              e.view,
              stateManager,
              { x: e.clientX, y: e.clientY },
              constructMenuDueDatePickerOnChange({
                stateManager,
                boardModifiers,
                item,
                hasDueDate,
                path,
                coordinates: { x: e.clientX, y: e.clientY },
              }),
              item.data.metadata.duedate?.toDate()
            );
          });
      });

      // Add delete due date option if due date exists
      if (hasDueDate) {
        menu.addItem((mi) =>
          mi
            .setIcon('lucide-trash-2')
            .setTitle('删除截止日期')
            .onClick(() => {
              deleteDueDate({
                stateManager,
                boardModifiers,
                item,
                path,
              });
            })
        );
      }

      menu.showAtMouseEvent(e);
      return;
    }

    // If timer is running on this card, show stop option and due date options
    if (isRunning && isThisTarget) {
      menu
        .addItem((mi) =>
          mi
            .setIcon('lucide-stop-circle')
            .setTitle('停止计时')
            .onClick(() => timerManager.stop())
        );

      // Add due date options even when timer is running
      const hasDueDateInMetadata = !!item.data.metadata.duedate;
      const hasDueDateInContent = item.data.titleRaw.includes('due:@');
      const hasDueDate = hasDueDateInMetadata || hasDueDateInContent;
      
      menu.addItem((mi) => {
        mi
          .setIcon('lucide-calendar')
          .setTitle(hasDueDate ? '更改截止日期' : '添加截止日期')
          .onClick(() => {
            constructDatePicker(
              e.view,
              stateManager,
              { x: e.clientX, y: e.clientY },
              constructMenuDueDatePickerOnChange({
                stateManager,
                boardModifiers,
                item,
                hasDueDate,
                path,
                coordinates: { x: e.clientX, y: e.clientY },
              }),
              item.data.metadata.duedate?.toDate()
            );
          });
      });

      // Add delete due date option if due date exists
      if (hasDueDate) {
        menu.addItem((mi) =>
          mi
            .setIcon('lucide-trash-2')
            .setTitle('删除截止日期')
            .onClick(() => {
              deleteDueDate({
                stateManager,
                boardModifiers,
                item,
                path,
              });
            })
        );
      }

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
      )
      .addItem((mi) => {
        // Check for due date in both metadata and raw content for more reliable detection
        const hasDueDateInMetadata = !!item.data.metadata.duedate;
        const hasDueDateInContent = item.data.titleRaw.includes('due:@');
        const hasDueDate = hasDueDateInMetadata || hasDueDateInContent;
        
        mi
          .setIcon('lucide-calendar')
          .setTitle(hasDueDate ? '更改截止日期' : '添加截止日期')
          .onClick(() => {
            constructDatePicker(
              e.view,
              stateManager,
              { x: e.clientX, y: e.clientY },
              constructMenuDueDatePickerOnChange({
                stateManager,
                boardModifiers,
                item,
                hasDueDate,
                path,
                coordinates: { x: e.clientX, y: e.clientY },
              }),
              item.data.metadata.duedate?.toDate()
            );
          });
      });

    // Add delete due date option if due date exists
    const hasDueDateInMetadata = !!item.data.metadata.duedate;
    const hasDueDateInContent = item.data.titleRaw.includes('due:@');
    const hasDueDate = hasDueDateInMetadata || hasDueDateInContent;
    
    if (hasDueDate) {
      menu.addItem((mi) =>
        mi
          .setIcon('lucide-trash-2')
          .setTitle('删除截止日期')
          .onClick(() => {
            deleteDueDate({
              stateManager,
              boardModifiers,
              item,
              path,
            });
          })
      );
    }

    menu.showAtMouseEvent(e);
  };
} 