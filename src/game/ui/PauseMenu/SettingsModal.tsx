import { useSettingsStore } from '../../store/settingsStore';
import { useViewport } from '../../../hooks/useViewport';
import './settingsModal.css';

interface Props {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: Props) {
  const settings = useSettingsStore((s) => s.settings);
  const setSettings = useSettingsStore((s) => s.setSettings);
  const viewport = useViewport();

  return (
    <div className="settings-overlay" role="dialog" aria-label="Settings">
      <div className="settings-card">
        <button className="settings-close" onClick={onClose} aria-label="Close settings">×</button>
        <h2>Settings</h2>
        <div className="settings-row">
          <label htmlFor="vol">Sound Volume: {Math.round(settings.soundVolume * 100)}%</label>
          <input
            id="vol"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.soundVolume}
            onChange={(e) => setSettings({ soundVolume: Number(e.target.value) })}
          />
        </div>
        <div className="settings-row">
          <label>Render Distance</label>
          <div className="seg-group">
            {[8, 10, 12].map((d) => (
              <button
                key={d}
                className={`seg ${settings.renderDistance === d ? 'selected' : ''}`}
                onClick={() => setSettings({ renderDistance: d })}
                aria-pressed={settings.renderDistance === d}
              >
                {d} Chunks
              </button>
            ))}
          </div>
        </div>
        <div className="settings-row">
          <label>Graphics</label>
          <div className="seg-group">
            {(['low', 'medium', 'high'] as const).map((g) => (
              <button
                key={g}
                className={`seg ${settings.graphicsQuality === g ? 'selected' : ''}`}
                onClick={() => setSettings({ graphicsQuality: g })}
                aria-pressed={settings.graphicsQuality === g}
              >
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="settings-row">
          <label htmlFor="sens">Mouse Sensitivity</label>
          <input
            id="sens"
            type="range"
            min={0.1}
            max={2}
            step={0.1}
            value={settings.mouseSensitivity}
            onChange={(e) => setSettings({ mouseSensitivity: Number(e.target.value) })}
          />
          <span>{settings.mouseSensitivity.toFixed(1)}</span>
        </div>
        {viewport.isMobile && (
          <div className="settings-row">
            <label>Touch Joystick Position</label>
            <div className="seg-group">
              {(['left-handed', 'right-handed'] as const).map((c) => (
                <button
                  key={c}
                  className={`seg ${settings.controlLayout === c ? 'selected' : ''}`}
                  onClick={() => setSettings({ controlLayout: c })}
                  aria-pressed={settings.controlLayout === c}
                >
                  {c === 'left-handed' ? 'Left-Handed' : 'Right-Handed'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}