import React, { useState, useRef } from 'react';
import modulesData from '../modulesData.json';

export default function Learn() {
  // Sirf main core categories ko filter kar lete hain jo sikhane ke liye best hain
  const safeData = modulesData || {};
  const allCategories = Object.keys(safeData);
  
  // Jo categories sikhane ke liye main hain unhe pehle priority denge
  const preferredKeys = ['Alphabet', 'Numbers', 'Greetings', 'Relations', 'Family', 'A', '1'];
  const coreCategories = allCategories.filter(cat => 
    preferredKeys.some(key => cat.toLowerCase().includes(key.toLowerCase()))
  );
  const displayCategories = coreCategories.length > 0 ? coreCategories : allCategories;

  const [activeModule, setActiveModule] = useState(displayCategories[0] || '');
  const [activeItem, setActiveItem] = useState(safeData[displayCategories[0]] ? safeData[displayCategories[0]][0] : null);
  const viewMode = '3d';
  const iframeRef = useRef(null);

  const handleItemClick = (item) => {
    setActiveItem(item);
    if (viewMode === '3d' && iframeRef.current) {
      const sigmlFilePath = `${item.file}.sigml`;
      try {
        iframeRef.current.contentWindow.startPlayer(sigmlFilePath);
      } catch (err) {
        console.log("Player error", err);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flex: 1, height: 'calc(100vh - 45px)', overflow: 'hidden', fontFamily: 'sans-serif' }}>
      {/* Left Panel: Core Categories & Grid */}
      <div style={{ width: '45%', padding: '30px', backgroundColor: '#fff', overflowY: 'auto', borderRight: '2px solid #eee' }}>
        <h2 style={{ color: '#003366', marginTop: 0, marginBottom: '20px' }}>Core Learning Modules</h2>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>Step-by-step essential signs for beginners (Alphabets, Numbers, Greetings & Relations).</p>

        {/* Category Tabs/Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '25px' }}>
          {displayCategories.slice(0, 8).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveModule(cat);
                if (safeData[cat] && safeData[cat][0]) {
                  setActiveItem(safeData[cat][0]);
                }
              }}
              style={{
                padding: '8px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold',
                border: activeModule === cat ? 'none' : '1px solid #ccc',
                backgroundColor: activeModule === cat ? '#003366' : '#f8f9fa',
                color: activeModule === cat ? '#fff' : '#333'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <h3>Signs in: {activeModule}</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: (activeModule.toLowerCase().includes('alphabet') || activeModule.toLowerCase().includes('number')) ? 'repeat(4, 1fr)' : '1fr', 
          gap: '10px', marginTop: '15px' 
        }}>
          {safeData[activeModule] && safeData[activeModule].map((item) => (
            <button
              key={item.file}
              onClick={() => handleItemClick(item)}
              style={{
                padding: '10px 15px', fontSize: '14px', borderRadius: '6px', cursor: 'pointer', textAlign: 'left',
                border: activeItem && activeItem.file === item.file ? 'none' : '1px solid #ddd',
                backgroundColor: activeItem && activeItem.file === item.file ? '#689f38' : '#f9f9f9',
                color: activeItem && activeItem.file === item.file ? '#fff' : '#333'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right Panel: Avatar Viewer */}
      <div style={{ width: '55%', display: 'flex', flexDirection: 'column', backgroundColor: '#e5e7eb' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <iframe 
            ref={iframeRef} 
            src="/player-applet.html" 
            title="Avatar Player"
            style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#fff' }}
            onLoad={() => {
              if (activeItem && iframeRef.current) {
                try {
                  iframeRef.current.contentWindow.startPlayer(`${activeItem.file}.sigml`);
                } catch (e) { console.log(e); }
              }
            }}
          />
        </div>
        <div style={{ padding: '12px 20px', backgroundColor: '#c8d4e3', borderTop: '1px solid #bbb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Active Sign: <b>{activeItem ? activeItem.label : 'None'}</b></span>
        </div>
      </div>
    </div>
  );
}