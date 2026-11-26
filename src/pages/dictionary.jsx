import React, { useState, useRef } from 'react';
import { playSiGMLFast } from '../utils/sigmlService';

export default function Dictionary() {
  const [searchTerm, setSearchTerm] = useState('');
  const iframeRef = useRef(null);

  const fileList = [
    { label: '0', file: 'master dictionary/0.sigml' },
    { label: '1', file: 'master dictionary/1.sigml' },
    { label: '2', file: 'master dictionary/2.sigml' },
    { label: '3', file: 'master dictionary/3.sigml' },
    { label: '4', file: 'master dictionary/4.sigml' },
    { label: '5', file: 'master dictionary/5.sigml' },
    { label: '6', file: 'master dictionary/6.sigml' },
    { label: '7', file: 'master dictionary/7.sigml' },
    { label: '8', file: 'master dictionary/8.sigml' },
    { label: '9', file: 'master dictionary/9.sigml' },
    { label: '10', file: 'master dictionary/10.sigml' },
    { label: 'A', file: 'master dictionary/A.sigml' },
    { label: 'B', file: 'master dictionary/B.sigml' },
    { label: 'C', file: 'master dictionary/C.sigml' },
    { label: 'D', file: 'master dictionary/D.sigml' },
    { label: 'E', file: 'master dictionary/E.sigml' },
    { label: 'F', file: 'master dictionary/F.sigml' },
    { label: 'G', file: 'master dictionary/G.sigml' },
    { label: 'H', file: 'master dictionary/H.sigml' },
    { label: 'I', file: 'master dictionary/I.sigml' },
    { label: 'J', file: 'master dictionary/J.sigml' },
    { label: 'K', file: 'master dictionary/K.sigml' },
    { label: 'L', file: 'master dictionary/L.sigml' },
    { label: 'M', file: 'master dictionary/M.sigml' },
    { label: 'N', file: 'master dictionary/N.sigml' },
    { label: 'O', file: 'master dictionary/O.sigml' },
    { label: 'P', file: 'master dictionary/P.sigml' },
    { label: 'Q', file: 'master dictionary/Q.sigml' },
    { label: 'R', file: 'master dictionary/R.sigml' },
    { label: 'S', file: 'master dictionary/S.sigml' },
    { label: 'T', file: 'master dictionary/T.sigml' },
    { label: 'U', file: 'master dictionary/U.sigml' },
    { label: 'V', file: 'master dictionary/V.sigml' },
    { label: 'W', file: 'master dictionary/W.sigml' },
    { label: 'X', file: 'master dictionary/X.sigml' },
    { label: 'Y', file: 'master dictionary/Y.sigml' },
    { label: 'Z', file: 'master dictionary/Z.sigml' },
    { label: 'Absent', file: 'master dictionary/absent.sigml' },
    { label: 'Accept', file: 'master dictionary/accept.sigml' },
    { label: 'Active', file: 'master dictionary/active.sigml' },
    { label: 'Agree', file: 'master dictionary/agree.sigml' },
    { label: 'All', file: 'master dictionary/all.sigml' },
    { label: 'Alone', file: 'master dictionary/alone.sigml' },
    { label: 'Ant', file: 'master dictionary/ant.sigml' },
    { label: 'Apple', file: 'master dictionary/apple.sigml' },
    { label: 'Ask', file: 'master dictionary/ask.sigml' },
    { label: 'Banana', file: 'master dictionary/banana.sigml' },
    { label: 'Bear', file: 'master dictionary/bear.sigml' },
    { label: 'Beautiful', file: 'master dictionary/beautiful.sigml' },
    { label: 'Big', file: 'master dictionary/big.sigml' },
    { label: 'Bird', file: 'master dictionary/bird.sigml' },
    { label: 'Cat', file: 'master dictionary/cat.sigml' },
    { label: 'Cold', file: 'master dictionary/cold.sigml' },
    { label: 'Cook', file: 'master dictionary/cook.sigml' },
    { label: 'Cow', file: 'master dictionary/cow.sigml' },
    { label: 'Dark', file: 'master dictionary/dark.sigml' },
    { label: 'Deaf', file: 'master dictionary/deaf.sigml' },
    { label: 'Difficult', file: 'master dictionary/difficult.sigml' },
    { label: 'Dog', file: 'master dictionary/dog.sigml' },
    { label: 'Drink', file: 'master dictionary/drink.sigml' },
    { label: 'Eat', file: 'master dictionary/eat.sigml' },
    { label: 'Elephant', file: 'master dictionary/elephant.sigml' },
    { label: 'Fast', file: 'master dictionary/fast.sigml' },
    { label: 'Fish', file: 'master dictionary/fish.sigml' },
    { label: 'Good', file: 'master dictionary/good.sigml' },
    { label: 'Happy', file: 'master dictionary/happy.sigml' },
    { label: 'Help', file: 'master dictionary/help.sigml' },
    { label: 'Horse', file: 'master dictionary/horse.sigml' },
    { label: 'Hot', file: 'master dictionary/hot.sigml' },
    { label: 'Hungry', file: 'master dictionary/hungry.sigml' },
    { label: 'Lion', file: 'master dictionary/lion.sigml' },
    { label: 'Love', file: 'master dictionary/love.sigml' },
    { label: 'Monkey', file: 'master dictionary/monkey.sigml' },
    { label: 'New', file: 'master dictionary/new.sigml' },
    { label: 'Old', file: 'master dictionary/old.sigml' },
    { label: 'Parrot', file: 'master dictionary/parrot.sigml' },
    { label: 'Play', file: 'master dictionary/play.sigml' },
    { label: 'Potato', file: 'master dictionary/potato.sigml' },
    { label: 'Rabbit', file: 'master dictionary/rabbit.sigml' },
    { label: 'Read', file: 'master dictionary/read.sigml' },
    { label: 'Run', file: 'master dictionary/run.sigml' },
    { label: 'Sad', file: 'master dictionary/sad.sigml' },
    { label: 'Sleep', file: 'master dictionary/sleep.sigml' },
    { label: 'Stop', file: 'master dictionary/stop.sigml' },
    { label: 'Study', file: 'master dictionary/study.sigml' },
    { label: 'Talk', file: 'master dictionary/talk.sigml' },
    { label: 'Tiger', file: 'master dictionary/tiger.sigml' },
    { label: 'Tomato', file: 'master dictionary/tomato.sigml' },
    { label: 'Walk', file: 'master dictionary/walk.sigml' },
    { label: 'Water', file: 'master dictionary/water.sigml' },
    { label: 'Work', file: 'master dictionary/work.sigml' }
  ];

  const [activeSign, setActiveSign] = useState(fileList[0]);

  const filteredSigns = fileList.filter((item) =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className="signverse-split-container"
      style={{
        display: 'flex',
        height: 'calc(100vh - 64px)',
        width: '100%',
        backgroundColor: '#191C1A',
        color: '#E4EAE6',
        fontFamily: "'Inter', system-ui, sans-serif",
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      {/* Left Panel */}
      <div
        className="signverse-panel-left"
        style={{
          width: '380px',
          backgroundColor: '#1F2421',
          borderRight: '1px solid #2D3531',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          boxSizing: 'border-box',
          flexShrink: 0
        }}
      >
        <div style={{ padding: '20px', borderBottom: '1px solid #2D3531', flexShrink: 0 }}>
          <h1 style={{ color: '#E4EAE6', fontSize: '20px', fontWeight: '800', margin: '0 0 6px 0' }}>
            Master Dictionary
          </h1>
          <span
            style={{
              backgroundColor: 'rgba(124,169,146,0.16)',
              color: '#A3CBB7',
              border: '1px solid rgba(124,169,146,0.3)',
              padding: '3px 9px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: '700',
              display: 'inline-block',
              marginBottom: '12px'
            }}
          >
            {fileList.length} Core Signs
          </span>

          <label htmlFor="dictionary-search" className="sr-only">
            Search sign files
          </label>
          <input
            id="dictionary-search"
            type="search"
            placeholder="Search sign files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #3A443F',
              fontSize: '14px',
              boxSizing: 'border-box',
              backgroundColor: '#191C1A',
              color: '#E4EAE6'
            }}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredSigns.length > 0 ? (
            filteredSigns.map((item, index) => {
              const isSelected = activeSign && activeSign.file === item.file;
              return (
                <button
                  type="button"
                  key={index}
                  aria-pressed={isSelected}
                  onClick={() => {
                    setActiveSign(item);
                    if (iframeRef.current) {
                      playSiGMLFast(iframeRef.current, item.file);
                    }
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'rgba(124,169,146,0.18)' : '#242A27',
                    border: isSelected ? '1px solid #7CA992' : '1px solid #3A443F',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ margin: '0 0 2px 0', color: isSelected ? '#A3CBB7' : '#E4EAE6', fontSize: '15px', fontWeight: '700' }}>
                      {item.label}
                    </div>
                    <span style={{ fontSize: '11px', color: '#9CAEA4' }}>master dictionary</span>
                  </div>
                  <span aria-hidden="true" style={{ fontSize: '13px', color: '#7CA992', fontWeight: '700' }}>Play</span>
                </button>
              );
            })
          ) : (
            <div role="status" style={{ textAlign: 'center', padding: '30px', color: '#9CAEA4', fontSize: '14px' }}>
              No files found!
            </div>
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div
        className="signverse-panel-right"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          backgroundColor: '#191C1A',
          overflowY: 'auto',
          padding: '24px',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ maxWidth: '900px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
          <div style={{ backgroundColor: '#242A27', padding: '16px 20px', borderRadius: '14px', border: '1px solid #3A443F', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <span style={{ backgroundColor: 'rgba(124,169,146,0.16)', color: '#A3CBB7', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                3D Sign Avatar
              </span>
              <h2 style={{ color: '#E4EAE6', fontSize: '24px', fontWeight: '800', margin: '6px 0 0 0' }}>
                {activeSign ? activeSign.label : ''}
              </h2>
            </div>
            <div style={{ fontSize: '12px', color: '#B5C5BC', backgroundColor: '#191C1A', padding: '6px 12px', borderRadius: '8px', border: '1px solid #2D3531' }}>
              Asset: <strong style={{ color: '#A3CBB7' }}>{activeSign ? activeSign.file : ''}</strong>
            </div>
          </div>

          <div style={{ width: '100%', flex: 1, minHeight: '420px', backgroundColor: '#141715', borderRadius: '16px', overflow: 'hidden', border: '1px solid #2D3531' }}>
            <iframe
              ref={iframeRef}
              src="/player-applet.html"
              title="Luna 3D Avatar Sign Player"
              onLoad={() => {
                if (activeSign && iframeRef.current) {
                  setTimeout(() => playSiGMLFast(iframeRef.current, activeSign.file), 500);
                }
              }}
              style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
