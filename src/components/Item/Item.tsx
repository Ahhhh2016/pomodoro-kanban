import classcat from 'classcat';
import {
  JSX,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'preact/compat';
import { Droppable, useNestedEntityPath } from 'src/dnd/components/Droppable';
import { DndManagerContext } from 'src/dnd/components/context';
import { useDragHandle } from 'src/dnd/managers/DragManager';
import { frontmatterKey } from 'src/parsers/common';

import { KanbanContext, SearchContext } from '../context';
import { c } from '../helpers';
import { EditState, EditingState, Item, isEditing } from '../types';
import { constructDatePicker, constructMenuDueDatePickerOnChange } from './helpers';
import { ItemCheckbox } from './ItemCheckbox';
import { ItemContent } from './ItemContent';
import { useItemMenu } from './ItemMenu';
import { ItemMenuButton } from './ItemMenuButton';
import { ItemMetadata } from './MetadataTable';
import { getItemClassModifiers } from './helpers';
import { ItemTimerButton } from './ItemTimerButton';
import { DueDate } from './DueDate';

export interface DraggableItemProps {
  item: Item;
  itemIndex: number;
  isStatic?: boolean;
  shouldMarkItemsComplete?: boolean;
}

export interface ItemInnerProps {
  item: Item;
  isStatic?: boolean;
  shouldMarkItemsComplete?: boolean;
  isMatch?: boolean;
  searchQuery?: string;
}

const ItemInner = memo(function ItemInner({
  item,
  shouldMarkItemsComplete,
  isMatch,
  searchQuery,
  isStatic,
}: ItemInnerProps) {
  const { stateManager, boardModifiers, timerManager } = useContext(KanbanContext);
  const [editState, setEditState] = useState<EditState>(EditingState.cancel);
  const [, forceLocalUpdate] = useState({});

  // Re-render this component when a focus session is logged
  useEffect(() => {
    if (!timerManager) return;
    const refresh = () => forceLocalUpdate({});
    timerManager.emitter.on('log', refresh);
    return () => {
      timerManager.emitter.off('log', refresh);
    };
  }, [timerManager]);

  const dndManager = useContext(DndManagerContext);

  useEffect(() => {
    const handler = () => {
      if (isEditing(editState)) setEditState(EditingState.cancel);
    };

    dndManager.dragManager.emitter.on('dragStart', handler);
    return () => {
      dndManager.dragManager.emitter.off('dragStart', handler);
    };
  }, [dndManager, editState]);

  useEffect(() => {
    if (item.data.forceEditMode) {
      setEditState({ x: 0, y: 0 });
    }
  }, [item.data.forceEditMode]);

  const path = useNestedEntityPath();

  const showItemMenu = useItemMenu({
    boardModifiers,
    item,
    setEditState: setEditState,
    stateManager,
    path,
  });

  const onContextMenu: JSX.MouseEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      if (isEditing(editState)) return;
      if (
        e.targetNode.instanceOf(HTMLAnchorElement) &&
        (e.targetNode.hasClass('internal-link') || e.targetNode.hasClass('external-link'))
      ) {
        return;
      }
      showItemMenu(e);
    },
    [showItemMenu, editState]
  );

  const onDoubleClick: JSX.MouseEventHandler<HTMLDivElement> = useCallback(
    (e) => setEditState({ x: e.clientX, y: e.clientY }),
    [setEditState]
  );

  const ignoreAttr = useMemo(() => {
    if (isEditing(editState)) {
      return {
        'data-ignore-drag': true,
      };
    }

    return {};
  }, [editState]);

  return (
    <div
      // eslint-disable-next-line react/no-unknown-property
      onDblClick={onDoubleClick}
      onContextMenu={onContextMenu}
      className={c('item-content-wrapper')}
      {...ignoreAttr}
    >
      <div className={c('item-title-wrapper')} {...ignoreAttr}>
        <ItemCheckbox
          boardModifiers={boardModifiers}
          item={item}
          path={path}
          shouldMarkItemsComplete={shouldMarkItemsComplete}
          stateManager={stateManager}
        />
        <ItemContent
          item={item}
          searchQuery={isMatch ? searchQuery : undefined}
          setEditState={setEditState}
          editState={editState}
          isStatic={isStatic}
        />
        <ItemTimerButton item={item} editState={editState} setEditState={setEditState} />
        <ItemMenuButton editState={editState} setEditState={setEditState} showMenu={showItemMenu} />
      </div>
      <ItemMetadata searchQuery={isMatch ? searchQuery : undefined} item={item} />

      {/* Focused time line with due date */}
      {(() => {
        const totalMs = timerManager?.getTotalFocused(item.id) ?? 0;
        const hasFocusedTime = totalMs > 0;
        const hasDueDate = item.data.metadata.duedate;
        
        // Debug: Log focused time line information
        console.log('Item.tsx - Focused time line debug:', {
          itemId: item.id,
          totalMs,
          hasFocusedTime,
          hasDueDate,
          duedate: item.data.metadata.duedate,
          duetime: item.data.metadata.duetime,
          duedateStr: item.data.metadata.duedateStr,
          duetimeStr: item.data.metadata.duetimeStr,
          itemMetadata: item.data.metadata
        });
        
        // Show this section if either focused time or due date exists
        if (!hasFocusedTime && !hasDueDate) {
          console.log('Item.tsx - No focused time or due date, returning null');
          return null;
        }
        
        const hours = Math.floor(totalMs / 3600000);
        const minutes = Math.floor((totalMs % 3600000) / 60000);
        const focusedTimeStr = `${hours ? hours + ' h ' : ''}${minutes} min`;
        
        // Due date edit handler
        const onEditDueDate = (e: MouseEvent) => {
          constructDatePicker(
            e.view,
            stateManager,
            { x: e.clientX, y: e.clientY },
            constructMenuDueDatePickerOnChange({
              stateManager,
              boardModifiers,
              item,
              hasDueDate: true,
              path,
            }),
            item.data.metadata.duedate?.toDate()
          );
        };
        
        console.log('Item.tsx - Rendering focused time line:', {
          hasFocusedTime,
          focusedTimeStr,
          hasDueDate,
          willRenderDueDate: hasDueDate
        });

        return (
          <div
            className={c('item-focus-time')}
            style={{ 
              fontSize: '12px', 
              opacity: 0.6, 
              paddingInlineStart: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              {hasFocusedTime && `Focused: ${focusedTimeStr}`}
            </div>
            <div>
              {hasDueDate && (
                <DueDate 
                  item={item} 
                  stateManager={stateManager} 
                  onEditDueDate={onEditDueDate}
                />
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
});

export const DraggableItem = memo(function DraggableItem(props: DraggableItemProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const search = useContext(SearchContext);
  const { timerManager } = useContext(KanbanContext);
  const [, forceUpdate] = useState({});

  const { itemIndex, ...innerProps } = props;

  useEffect(() => {
    if (!timerManager) return;
    const update = () => forceUpdate({});
    timerManager.emitter.on('start', update);
    timerManager.emitter.on('stop', update);
    timerManager.emitter.on('log', update);
    return () => {
      timerManager.emitter.off('start', update);
      timerManager.emitter.off('stop', update);
      timerManager.emitter.off('log', update);
    };
  }, [timerManager]);

  const bindHandle = useDragHandle(measureRef, measureRef);

  const isMatch = search?.query ? innerProps.item.data.titleSearch.includes(search.query) : false;
  const classModifiers: string[] = getItemClassModifiers(innerProps.item);
  
  // Add is-timing class if the item is being timed
  if (timerManager && timerManager.isRunning(undefined, props.item.id)) {
    classModifiers.push('is-timing');
  }

  return (
    <div
      ref={(el) => {
        measureRef.current = el;
        bindHandle(el);
      }}
      className={c('item-wrapper')}
    >
      <div ref={elementRef} className={classcat([c('item'), ...classModifiers])}>
        {props.isStatic ? (
          <ItemInner
            {...innerProps}
            isMatch={isMatch}
            searchQuery={search?.query}
            isStatic={true}
          />
        ) : (
          <Droppable
            elementRef={elementRef}
            measureRef={measureRef}
            id={props.item.id}
            index={itemIndex}
            data={props.item}
          >
            <ItemInner {...innerProps} isMatch={isMatch} searchQuery={search?.query} />
          </Droppable>
        )}
      </div>
    </div>
  );
});

interface ItemsProps {
  isStatic?: boolean;
  items: Item[];
  shouldMarkItemsComplete: boolean;
}

export const Items = memo(function Items({ isStatic, items, shouldMarkItemsComplete }: ItemsProps) {
  const search = useContext(SearchContext);
  const { view } = useContext(KanbanContext);
  const boardView = view.useViewState(frontmatterKey);

  return (
    <>
      {items.map((item, i) => {
        return search?.query && !search.items.has(item) ? null : (
          <DraggableItem
            key={boardView + item.id}
            item={item}
            itemIndex={i}
            shouldMarkItemsComplete={shouldMarkItemsComplete}
            isStatic={isStatic}
          />
        );
      })}
    </>
  );
});
