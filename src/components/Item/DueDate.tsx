import { JSX } from 'preact/compat';
import { StateManager } from 'src/StateManager';
import { t } from 'src/lang/helpers';
import { c } from '../helpers';
import { Item } from '../types';

interface DueDateProps {
  item: Item;
  stateManager: StateManager;
  onEditDueDate?: JSX.MouseEventHandler<HTMLSpanElement>;
}

export function DueDate({ item, stateManager, onEditDueDate }: DueDateProps) {
  const dateDisplayFormat = stateManager.useSetting('date-display-format');
  const timeFormat = stateManager.useSetting('time-format');

  // Debug: Log due date information
  console.log('DueDate component - Debug Info:', {
    itemId: item.id,
    hasDuedate: !!item.data.metadata.duedate,
    duedate: item.data.metadata.duedate,
    duetime: item.data.metadata.duetime,
    duedateStr: item.data.metadata.duedateStr,
    duetimeStr: item.data.metadata.duetimeStr,
    dateDisplayFormat,
    timeFormat,
    itemMetadata: item.data.metadata
  });

  if (!item.data.metadata.duedate) {
    console.log('DueDate component - No duedate found, returning null');
    return null;
  }

  const duedate = item.data.metadata.duedate;
  const duetime = item.data.metadata.duetime;
  const dateDisplayStr = duedate.format(dateDisplayFormat);
  const timeDisplayStr = duetime ? duetime.format(timeFormat) : null;

  console.log('DueDate component - Formatted strings:', {
    dateDisplayStr,
    timeDisplayStr,
    finalDisplay: `! Due: ${dateDisplayStr}${timeDisplayStr ? ` ${timeDisplayStr}` : ''}`
  });

  return (
    <span
      onClick={onEditDueDate}
      className={`${c('item-metadata-duedate')} is-button`}
      aria-label="Change due date"
      style={{ 
        color: 'red', 
        fontWeight: 'bold',
        paddingRight: '8px'
      }}
    >
      ! Due: {dateDisplayStr}{timeDisplayStr ? ` ${timeDisplayStr}` : ''}
    </span>
  );
}
