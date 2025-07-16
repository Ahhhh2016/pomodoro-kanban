import { App, Modal } from 'obsidian';
import { TimerManager, TimerMode } from '../TimerManager';

interface CardInfo {
  id: string;
  title: string;
}

/**
 * A simple modal that lists all cards on the current board and lets the user pick one to start timing.
 */
export class CardSelectModal extends Modal {
  private timer: TimerManager;
  private boardStateManager: any;
  private mode: TimerMode;

  constructor(app: App, timer: TimerManager, boardStateManager: any, mode: TimerMode) {
    super(app);
    this.timer = timer;
    this.boardStateManager = boardStateManager;
    this.mode = mode;
  }

  /** Recursively collect cards from the board */
  private collectCards(items: any[]): CardInfo[] {
    if (!items) return [];
    const res: CardInfo[] = [];
    for (const it of items) {
      // Item cards have an `id` and `data.titleRaw` (or `data.title`)
      if (it.id && it.data) {
        const rawTitle: string = it.data.titleRaw || it.data.title || 'Untitled';
        const firstLine = rawTitle.split('\n')[0];
        const displayTitle = firstLine.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
        res.push({ id: it.id, title: displayTitle || 'Untitled' });
      }
      if (it.children?.length) res.push(...this.collectCards(it.children));
    }
    return res;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h2', { text: 'Select a card' });

    const cardListWrapper = contentEl.createDiv({ cls: 'kanban-plugin__card-select-list' });
    const cards = this.collectCards(this.boardStateManager?.state?.children ?? []);

    if (cards.length === 0) {
      cardListWrapper.createEl('p', { text: 'No cards available.' });
      return;
    }

    cards.forEach((card) => {
      const btn = cardListWrapper.createEl('button', {
        cls: 'kanban-plugin__card-select-item',
        text: card.title,
      });
      btn.addEventListener('click', () => {
        // Start the timer with selected card
        this.timer.start(this.mode, card.id);
        this.close();
      });
    });
  }

  onClose(): void {
    this.contentEl.empty();
  }
} 