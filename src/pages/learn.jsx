import React, { useState, useRef } from 'react';
import modulesData from '../modulesData.json';
import { playSiGMLFast } from '../utils/sigmlService';

export default function Learn() {
  const safeData = modulesData || {};
  const allCategories = Object.keys(safeData);
  const preferredKeys = ['Alphabet', 'Numbers', 'Greetings', 'Relations', 'Family', 'A', '1'];
  const coreCategories = allCategories.filter((cat) =>
    preferredKeys.some((key) => cat.toLowerCase().includes(key.toLowerCase()))
  );
  const displayCategories = coreCategories.length > 0 ? coreCategories : allCategories;

  const [activeModule, setActiveModule] = useState(displayCategories[0] || '');
  const [activeItem, setActiveItem] = useState(safeData[displayCategories[0]] ? safeData[displayCategories[0]][0] : null);
  const iframeRef = useRef(null);

  const handleItemClick = (item) => {
    setActiveItem(item);
    if (iframeRef.current) {
      playSiGMLFast(iframeRef.current, item.file);
    }
  };

  return (
    <div
      className="signverse-split-container"
      style={{
        display: 'flex',
        flex: 1,
        height: 'calc(100vh - 64px)',
        overflow: 'hidden',
        fontFamily: "'Inter', system-ui, sans-serif",
        backgroundColor: '#191C1A',
        color: '#E4EAE6'
      }}
    >
      {/* Left Panel */}
      <div
        className="signverse-panel-left"
        style={{
          width: '45%',
          padding: '26px',
          backgroundColor: '#1F2421',
          overflowY: 'auto',
          borderRight: '1px solid #2D3531',
          boxSizing: 'border-box'
        }}
      >
        <h1 style={{ color: '#E4EAE6', marginTop: 0, marginBottom: '8px', fontSize: '23px', fontWeight: '800' }}>
          Core Learning Modules
        </h1>
        <p style={{ color: '#B5C5BC', fontSize: '13.5px', marginBottom: '20px', lineHeight: '1.45' }}>
          Step-by-step essential signs for beginners (Alphabets, Numbers, Greetings &amp; Family).
        </p>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '22px' }}>
          {displayCategories.slice(0, 8).map((cat) => (
            <button
              type="button"
              key={cat}
              aria-pressed={activeModule === cat}
              onClick={() => {
                setActiveModule(cat);
                if (safeData[cat] && safeData[cat][0]) {
                  setActiveItem(safeData[cat][0]);
                }
              }}
              style={{
                padding: '7px 14px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '12.5px',
                fontWeight: '700',
                border: activeModule === cat ? '1px solid #7CA992' : '1px solid #3A443F',
                backgroundColor: activeModule === cat ? '#7CA992' : '#242A27',
                color: activeModule === cat ? '#0D1310' : '#B5C5BC'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#A3CBB7', margin: '0 0 12px' }}>
          Signs in: {activeModule}
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              activeModule.toLowerCase().includes('alphabet') || activeModule.toLowerCase().includes('number')
                ? 'repeat(auto-fill, minmax(90px, 1fr))'
                : 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '10px'
          }}
        >
          {safeData[activeModule] &&
            safeData[activeModule]
              .filter((item) => item && item.type !== 'video' && item.label && item.file)
              .map((item) => {
              const isSelected = activeItem && activeItem.file === item.file;
              return (
                <button
                  type="button"
                  key={item.file}
                  aria-pressed={isSelected}
                  onClick={() => handleItemClick(item)}
                  style={{
                    padding: '10px 14px',
                    fontSize: '14px',
                    fontWeight: '700',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    border: isSelected ? '1px solid #A3CBB7' : '1px solid #3A443F',
                    backgroundColor: isSelected ? '#7CA992' : '#242A27',
                    color: isSelected ? '#0D1310' : '#E4EAE6'
                  }}
                >
                  {item.label}
                </button>
              );
            })}
        </div>
      </div>

      {/* Right Panel */}
      <div
        className="signverse-panel-right"
        style={{ width: '55%', display: 'flex', flexDirection: 'column', backgroundColor: '#191C1A' }}
      >
        <div style={{ flex: 1, position: 'relative' }}>
          <iframe
            ref={iframeRef}
            src="/player-applet.html"
            title="Avatar Player"
            style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#191C1A' }}
            onLoad={() => {
              if (activeItem && iframeRef.current) {
                playSiGMLFast(iframeRef.current, activeItem.file);
              }
            }}
          />
        </div>
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#141715',
            borderTop: '1px solid #2D3531',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#B5C5BC'
          }}
        >
          <span>
            Active Sign: <strong style={{ color: '#A3CBB7' }}>{activeItem ? activeItem.label : 'None'}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
