/** @jsx h */
import { h } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';
import { KanbanContext } from '../context';
import { Item } from '../types';
import { c } from '../helpers';

function formatTotal(ms: number) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h${m.toString().padStart(2, '0')}m`;
}

export function CardFocusTime({ item }: { item: Item }) {
  const { timerManager } = useContext(KanbanContext);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const update = () => setTick((v) => v + 1);
    timerManager.emitter.on('stop', update);
    return () => {
      timerManager.emitter.off('stop', update);
    };
  }, [timerManager]);

  const total = timerManager.getTotal(item.id);

  if (total === 0) return null;

  return (
    <div className={c('item-focus-time')}>
      Focus {formatTotal(total)}
    </div>
  );
} 