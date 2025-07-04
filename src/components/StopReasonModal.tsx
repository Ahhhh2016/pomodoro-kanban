/** @jsx h */
import { h } from 'preact';
import { Modal } from 'obsidian';

export class StopReasonModal extends Modal {
  onSelect: (reason: string, action: 'pause' | 'stop') => void;
  constructor(app: any, onSelect: (reason: string, action: 'pause' | 'stop') => void) {
    super(app);
    this.onSelect = onSelect;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h3', { text: 'Why do you stop?' });

    const selectEl = contentEl.createEl('select');
    ['Finished', 'Interrupted', 'Break', 'Other'].forEach((r) => {
      selectEl.createEl('option', { value: r, text: r });
    });

    const btnRow = contentEl.createDiv({ cls: 'stop-reason-buttons' });
    const pauseBtn = btnRow.createEl('button', { text: 'Pause' });
    const stopBtn = btnRow.createEl('button', { text: 'Stop' });

    pauseBtn.onclick = () => {
      this.close();
      this.onSelect(selectEl.value, 'pause');
    };
    stopBtn.onclick = () => {
      this.close();
      this.onSelect(selectEl.value, 'stop');
    };
  }
} 