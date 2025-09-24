import { Menu } from 'obsidian';
import { Item } from '../types';
import { TimerManager } from '../../TimerManager';
import { constructDatePicker, constructMenuDueDatePickerOnChange, deleteDueDate, constructEstimateTimeInput, deleteEstimateTime } from './helpers';
import { StateManager } from '../../StateManager';
import { BoardModifiers } from '../../helpers/boardModifiers';
import { Path } from '../../dnd/types';
import { t } from '../../lang/helpers';

export function useTimerMenu(
  item: Item, 
  timerManager: TimerManager, 
  stateManager: StateManager, 
  boardModifiers: BoardModifiers, 
  path: Path
) {
  return (e: MouseEvent) => {
    const menu = new Menu();

    // Helper function to check if estimate time exists
    const hasEstimateTime = () => {
      const hasEstimateTimeInMetadata = !!item.data.metadata.estimatetime;
      const hasEstimateTimeInContent = item.data.titleRaw.includes('estimate:@{');
      return hasEstimateTimeInMetadata || hasEstimateTimeInContent;
    };

    const isRunning = timerManager.state.running;
    const isThisTarget = timerManager.state.targetCardId === item.id;

    // When a timer is running and the user clicks a different card, offer switch/stop and due date options
    if (isRunning && !isThisTarget) {
      menu
        .addItem((mi) =>
          mi
            .setIcon('lucide-arrow-right')
            .setTitle(t('Switch to this card'))
            .onClick(() => timerManager.toggle(timerManager.state.mode, item.id))
        )

      // Add due date options even when timer is running on different card
      const hasDueDateInMetadata = !!item.data.metadata.duedate;
      const hasDueDateInContent = item.data.titleRaw.includes('due:@');
      const hasDueDate = hasDueDateInMetadata || hasDueDateInContent;
      
      menu.addItem((mi) => {
        mi
          .setIcon('lucide-calendar')
          .setTitle(hasDueDate ? t('Change due date') : t('Add due date'))
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
            .setTitle(t('Delete due date'))
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

      // Add estimate time options
      menu.addItem((mi) => {
        const hasEstimate = hasEstimateTime();
        mi
          .setIcon('lucide-clock')
          .setTitle(hasEstimate ? t('Modify estimate time') : t('Add estimate time'))
          .onClick(() => {
            constructEstimateTimeInput({
              stateManager,
              boardModifiers,
              item,
              hasEstimateTime: hasEstimate,
              path,
              coordinates: { x: e.clientX, y: e.clientY },
            })(e.view);
          });
      });

      // Add delete estimate time option if estimate time exists
      if (hasEstimateTime()) {
        menu.addItem((mi) =>
          mi
            .setIcon('lucide-trash-2')
            .setTitle(t('Delete estimate time'))
            .onClick(() => {
              deleteEstimateTime({
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
            .setTitle(t('Stop timer'))
            .onClick(() => timerManager.stop())
        );

      // Add due date options even when timer is running
      const hasDueDateInMetadata = !!item.data.metadata.duedate;
      const hasDueDateInContent = item.data.titleRaw.includes('due:@');
      const hasDueDate = hasDueDateInMetadata || hasDueDateInContent;
      
      menu.addItem((mi) => {
        mi
          .setIcon('lucide-calendar')
          .setTitle(hasDueDate ? t('Change due date') : t('Add due date'))
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
            .setTitle(t('Delete due date'))
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

      // Add estimate time options
      menu.addItem((mi) => {
        const hasEstimate = hasEstimateTime();
        mi
          .setIcon('lucide-clock')
          .setTitle(hasEstimate ? t('Modify estimate time') : t('Add estimate time'))
          .onClick(() => {
            constructEstimateTimeInput({
              stateManager,
              boardModifiers,
              item,
              hasEstimateTime: hasEstimate,
              path,
              coordinates: { x: e.clientX, y: e.clientY },
            })(e.view);
          });
      });

      // Add delete estimate time option if estimate time exists
      if (hasEstimateTime()) {
        menu.addItem((mi) =>
          mi
            .setIcon('lucide-trash-2')
            .setTitle(t('Delete estimate time'))
            .onClick(() => {
              deleteEstimateTime({
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
    // Only show stop options if this specific card is actually being timed
    const isThisCardBeingTimed = timerManager.state.running && timerManager.state.targetCardId === item.id;
    const isPomodoroRunning = isThisCardBeingTimed && timerManager.state.mode === 'pomodoro';
    const isStopwatchRunning = isThisCardBeingTimed && timerManager.state.mode === 'stopwatch';

    menu
      .addItem((mi) =>
        mi
          .setIcon('lucide-timer')
          .setTitle(isPomodoroRunning ? t('Stop pomodoro') : t('Start pomodoro'))
          .onClick(() => timerManager.toggle('pomodoro', item.id))
      )
      .addItem((mi) =>
        mi
          .setIcon('lucide-clock')
          .setTitle(isStopwatchRunning ? t('Stop stopwatch') : t('Start stopwatch'))
          .onClick(() => timerManager.toggle('stopwatch', item.id))
      )
      .addItem((mi) => {
        // Check for due date in both metadata and raw content for more reliable detection
        const hasDueDateInMetadata = !!item.data.metadata.duedate;
        const hasDueDateInContent = item.data.titleRaw.includes('due:@');
        const hasDueDate = hasDueDateInMetadata || hasDueDateInContent;
        
        mi
          .setIcon('lucide-calendar')
          .setTitle(hasDueDate ? t('Change due date') : t('Add due date'))
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
          .setTitle(t('Delete due date'))
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

    // Add estimate time options
    menu.addItem((mi) => {
      const hasEstimate = hasEstimateTime();
      mi
        .setIcon('lucide-clock')
        .setTitle(hasEstimate ? t('Modify estimate time') : t('Add estimate time'))
        .onClick(() => {
          constructEstimateTimeInput({
            stateManager,
            boardModifiers,
            item,
            hasEstimateTime: hasEstimate,
            path,
            coordinates: { x: e.clientX, y: e.clientY },
          })(e.view);
        });
    });

    // Add delete estimate time option if estimate time exists
    if (hasEstimateTime()) {
      menu.addItem((mi) =>
        mi
          .setIcon('lucide-trash-2')
          .setTitle(t('Delete estimate time'))
          .onClick(() => {
            deleteEstimateTime({
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