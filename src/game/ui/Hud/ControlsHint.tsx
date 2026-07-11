import { useEffect, useState } from 'react';
import './controlsHint.css';

const STORAGE_KEY = 'blockcraft_tutorial_dismissed';

export default function ControlsHint() {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === '1';
  });
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (dismissed) return;
    const t = setTimeout(() => setExpanded(false), 12000);
    return () => clearTimeout(t);
  }, [dismissed]);

  if (dismissed) {
    return (
      <button
        className="controls-toggle"
        onClick={() => setDismissed(false)}
        aria-label="Show controls"
        title="Show controls"
      >
        ?
      </button>
    );
  }

  return (
    <div className={`controls-hint ${expanded ? 'expanded' : 'collapsed'}`} role="region" aria-label="Game controls">
      <div className="controls-header">
        <h3>Controls</h3>
        <div className="controls-actions">
          <button
            className="ctrl-icon"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? 'Collapse controls' : 'Expand controls'}
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? '−' : '+'}
          </button>
          <button
            className="ctrl-icon"
            onClick={() => {
              setDismissed(true);
              if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, '1');
            }}
            aria-label="Dismiss controls hint"
            title="Got it!"
          >
            ×
          </button>
        </div>
      </div>
      {expanded && (
        <div className="controls-grid">
          <div className="ctrl-row">
            <div className="ctrl-keys">
              <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>
            </div>
            <div className="ctrl-label">Move</div>
          </div>
          <div className="ctrl-row">
            <div className="ctrl-keys"><kbd>Space</kbd></div>
            <div className="ctrl-label">Jump</div>
          </div>
          <div className="ctrl-row">
            <div className="ctrl-keys"><kbd>Shift</kbd></div>
            <div className="ctrl-label">Sneak</div>
          </div>
          <div className="ctrl-row">
            <div className="ctrl-keys"><kbd>1</kbd>–<kbd>9</kbd></div>
            <div className="ctrl-label">Hotbar</div>
          </div>
          <div className="ctrl-row">
            <div className="ctrl-keys"><kbd>Scroll</kbd></div>
            <div className="ctrl-label">Cycle slot</div>
          </div>
          <div className="ctrl-row">
            <div className="ctrl-keys"><kbd>Mouse</kbd></div>
            <div className="ctrl-label">Look around</div>
          </div>
          <div className="ctrl-row">
            <div className="ctrl-keys"><kbd>L-Click</kbd></div>
            <div className="ctrl-label">Break block</div>
          </div>
          <div className="ctrl-row">
            <div className="ctrl-keys"><kbd>R-Click</kbd></div>
            <div className="ctrl-label">Place block</div>
          </div>
          <div className="ctrl-row">
            <div className="ctrl-keys"><kbd>E</kbd></div>
            <div className="ctrl-label">Inventory / Crafting</div>
          </div>
          <div className="ctrl-row">
            <div className="ctrl-keys"><kbd>Esc</kbd></div>
            <div className="ctrl-label">Pause / Settings</div>
          </div>
        </div>
      )}
      {!expanded && (
        <button className="controls-mini" onClick={() => setExpanded(true)} aria-label="Show full controls">
          Controls
        </button>
      )}
    </div>
  );
}