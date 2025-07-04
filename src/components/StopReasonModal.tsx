/** @jsx h */
import { h } from 'preact';
import { Modal } from 'obsidian';

export class StopReasonModal extends Modal {
  onSelect: (reason: string, action: 'pause' | 'stop') => void;
  reasons: string[];
  selectedReason: string;
  constructor(app: any, onSelect: (reason: string, action: 'pause' | 'stop') => void) {
    super(app);
    this.onSelect = onSelect;
    const plugin = (this.app as any).plugins.getPlugin('pomodoro-kanban');
    this.reasons =
      plugin?.settings?.['stop-reasons']?.length
        ? plugin.settings['stop-reasons']
        : ['Finished', 'Interrupted', 'Break', 'Other'];
    this.selectedReason = this.reasons[0];
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h3', { text: 'Why do you stop?' });

    const listEl = contentEl.createDiv({ cls: 'stop-reason-list' });
    this.reasons.forEach((r) => {
      const btn = listEl.createEl('button', { text: r });
      btn.style.display = 'block';
      btn.onclick = () => {
        this.selectedReason = r;
        Array.from(listEl.children).forEach((child) => (child as HTMLElement).removeClass('is-active'));
        btn.addClass('is-active');
      };
    });

    const btnRow = contentEl.createDiv({ cls: 'stop-reason-buttons' });
    const pauseBtn = btnRow.createEl('button', { text: 'Pause' });
    const stopBtn = btnRow.createEl('button', { text: 'Stop' });

    pauseBtn.onclick = () => {
      this.close();
      this.onSelect(this.selectedReason, 'pause');
    };
    stopBtn.onclick = () => {
      this.close();
      this.onSelect(this.selectedReason, 'stop');
    };
  }
} 