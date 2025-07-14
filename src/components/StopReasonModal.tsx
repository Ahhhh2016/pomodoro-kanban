import { h, Fragment } from 'preact';
import { Modal } from 'obsidian';
import { render } from 'preact';

interface StopReasonProps {
  onSelect: (reason: string) => void;
  onClose: () => void;
  onCancel: () => void;
}

const reasons = [
  'Boss interrupted',
  'Colleague interrupted',
  'Email',
  'Going home',
  'Lunch',
  'Phone call',
  'Web browsing',
  'Task done'
];

function StopReasonPanel({ onSelect, onClose, onCancel }: StopReasonProps) {
  return (
    <Fragment>
      <div className="kanban-plugin__stop-reason-panel">
        <h2 style={{ marginTop: 0 }}>Why did you stop?</h2>
        <div className="kanban-plugin__stop-reason-list">
          {reasons.map((reason) => (
            <button
              key={reason}
              onClick={() => {
                onSelect(reason);
                onClose();
              }}
              className="kanban-plugin__stop-reason-item"
            >
              {reason}
            </button>
          ))}
          <button
            onClick={() => {
              onSelect('Add new reason...');
              onClose();
            }}
            className="kanban-plugin__stop-reason-item kanban-plugin__stop-reason-add"
          >
            Add new reason...
          </button>
        </div>
      </div>
    </Fragment>
  );
}

export class StopReasonModal extends Modal {
  onSelect: (reason: string) => void;
  onCancel: () => void;
  /** Flag to indicate whether a reason was selected before closing */
  private _reasonSelected: boolean = false;

  constructor(app: any, onSelect: (reason: string) => void, onCancel: () => void) {
    super(app);
    this.onSelect = onSelect;
    this.onCancel = onCancel;
  }

  onOpen() {
    render(
      <StopReasonPanel
        onSelect={(reason: string) => {
          this._reasonSelected = true;
          this.onSelect(reason);
          this.close();
        }}
        onClose={() => this.close()}
        onCancel={this.onCancel}
      />,
      this.contentEl
    );
  }

  onClose() {
    // Only resume timer if user closed modal without selecting a reason.
    if (!this._reasonSelected) {
      this.onCancel();
    }
    render(null, this.contentEl);
  }
} 