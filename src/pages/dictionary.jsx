import React, { useState, useRef } from 'react';
import { playSiGMLFast } from '../utils/sigmlService';

export default function Dictionary() {
  const [searchTerm, setSearchTerm] = useState('');
  const iframeRef = useRef(null);

  // Safe Master List (Directly from your 'public/master dictionary' folder)
  const fileList = [
    { label: "0", file: "master dictionary/0.sigml" },
    { label: "1", file: "master dictionary/1.sigml" },
    { label: "2", file: "master dictionary/2.sigml" },
    { label: "3", file: "master dictionary/3.sigml" },
    { label: "4", file: "master dictionary/4.sigml" },
    { label: "5", file: "master dictionary/5.sigml" },
    { label: "6", file: "master dictionary/6.sigml" },
    { label: "7", file: "master dictionary/7.sigml" },
    { label: "8", file: "master dictionary/8.sigml" },
    { label: "9", file: "master dictionary/9.sigml" },
    { label: "10", file: "master dictionary/10.sigml" },
    { label: "A", file: "master dictionary/A.sigml" },
    { label: "B", file: "master dictionary/B.sigml" },
    { label: "C", file: "master dictionary/C.sigml" },
    { label: "D", file: "master dictionary/D.sigml" },
    { label: "E", file: "master dictionary/E.sigml" },
    { label: "F", file: "master dictionary/F.sigml" },
    { label: "G", file: "master dictionary/G.sigml" },
    { label: "H", file: "master dictionary/H.sigml" },
    { label: "I", file: "master dictionary/I.sigml" },
    { label: "J", file: "master dictionary/J.sigml" },
    { label: "K", file: "master dictionary/K.sigml" },
    { label: "L", file: "master dictionary/L.sigml" },
    { label: "M", file: "master dictionary/M.sigml" },
    { label: "N", file: "master dictionary/N.sigml" },
    { label: "O", file: "master dictionary/O.sigml" },
    { label: "P", file: "master dictionary/P.sigml" },
    { label: "Q", file: "master dictionary/Q.sigml" },
    { label: "R", file: "master dictionary/R.sigml" },
    { label: "S", file: "master dictionary/S.sigml" },
    { label: "T", file: "master dictionary/T.sigml" },
    { label: "U", file: "master dictionary/U.sigml" },
    { label: "V", file: "master dictionary/V.sigml" },
    { label: "W", file: "master dictionary/W.sigml" },
    { label: "X", file: "master dictionary/X.sigml" },
    { label: "Y", file: "master dictionary/Y.sigml" },
    { label: "Z", file: "master dictionary/Z.sigml" },
    { label: "Absent", file: "master dictionary/absent.sigml" },
    { label: "Accept", file: "master dictionary/accept.sigml" },
    { label: "Active", file: "master dictionary/active.sigml" },
    { label: "Agree", file: "master dictionary/agree.sigml" },
    { label: "All", file: "master dictionary/all.sigml" },
    { label: "Alone", file: "master dictionary/alone.sigml" },
    { label: "Ant", file: "master dictionary/ant.sigml" },
    { label: "Apple", file: "master dictionary/apple.sigml" },
    { label: "Ask", file: "master dictionary/ask.sigml" },
    { label: "Banana", file: "master dictionary/banana.sigml" },
    { label: "Bear", file: "master dictionary/bear.sigml" },
    { label: "Beautiful", file: "master dictionary/beautiful.sigml" },
    { label: "Big", file: "master dictionary/big.sigml" },
    { label: "Bird", file: "master dictionary/bird.sigml" },
    { label: "Cat", file: "master dictionary/cat.sigml" },
    { label: "Cold", file: "master dictionary/cold.sigml" },
    { label: "Cook", file: "master dictionary/cook.sigml" },
    { label: "Cow", file: "master dictionary/cow.sigml" },
    { label: "Dark", file: "master dictionary/dark.sigml" },
    { label: "Deaf", file: "master dictionary/deaf.sigml" },
    { label: "Difficult", file: "master dictionary/difficult.sigml" },
    { label: "Dog", file: "master dictionary/dog.sigml" },
    { label: "Drink", file: "master dictionary/drink.sigml" },
    { label: "Eat", file: "master dictionary/eat.sigml" },
    { label: "Elephant", file: "master dictionary/elephant.sigml" },
    { label: "Fast", file: "master dictionary/fast.sigml" },
    { label: "Fish", file: "master dictionary/fish.sigml" },
    { label: "Good", file: "master dictionary/good.sigml" },
    { label: "Happy", file: "master dictionary/happy.sigml" },
    { label: "Help", file: "master dictionary/help.sigml" },
    { label: "Horse", file: "master dictionary/horse.sigml" },
    { label: "Hot", file: "master dictionary/hot.sigml" },
    { label: "Hungry", file: "master dictionary/hungry.sigml" },
    { label: "Lion", file: "master dictionary/lion.sigml" },
    { label: "Love", file: "master dictionary/love.sigml" },
    { label: "Monkey", file: "master dictionary/monkey.sigml" },
    { label: "New", file: "master dictionary/new.sigml" },
    { label: "Old", file: "master dictionary/old.sigml" },
    { label: "Parrot", file: "master dictionary/parrot.sigml" },
    { label: "Play", file: "master dictionary/play.sigml" },
    { label: "Potato", file: "master dictionary/potato.sigml" },
    { label: "Rabbit", file: "master dictionary/rabbit.sigml" },
    { label: "Read", file: "master dictionary/read.sigml" },
    { label: "Run", file: "master dictionary/run.sigml" },
    { label: "Sad", file: "master dictionary/sad.sigml" },
    { label: "Sleep", file: "master dictionary/sleep.sigml" },
    { label: "Stop", file: "master dictionary/stop.sigml" },
    { label: "Study", file: "master dictionary/study.sigml" },
    { label: "Talk", file: "master dictionary/talk.sigml" },
    { label: "Tiger", file: "master dictionary/tiger.sigml" },
    { label: "Tomato", file: "master dictionary/tomato.sigml" },
    { label: "Walk", file: "master dictionary/walk.sigml" },
    { label: "Water", file: "master dictionary/water.sigml" },
    { label: "Work", file: "master dictionary/work.sigml" }
  ];

  const [activeSign, setActiveSign] = useState(fileList[0]);

  // Search Filter
  const filteredSigns = fileList.filter(item => 
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 45px)', width: '100vw', backgroundColor: '#f4f7f6', fontFamily: 'sans-serif', boxSizing: 'border-box', overflow: 'hidden' }}>
      
      {/* ================= LEFT PANEL: Search & Auto-Scroll List ================= */}
      <div style={{ width: '380px', backgroundColor: 'white', borderRight: '1px solid #ddd', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box', flexShrink: 0 }}>
        
        <div style={{ padding: '20px', borderBottom: '1px solid #eaeaea', backgroundColor: '#fafbfc', flexShrink: 0 }}>
          <h2 style={{ color: '#003366', fontSize: '20px', margin: '0 0 5px 0' }}>📂 Master Dictionary</h2>
          <span style={{ backgroundColor: '#e3f2fd', color: '#1565c0', padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block', marginBottom: '12px' }}>
            Dictionary Index
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
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box', backgroundColor: 'white', color: '#0f172a' }}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                    padding: '12px 15px', 
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    backgroundColor: isSelected ? '#e3f2fd' : '#f8f9fa', 
                    border: isSelected ? '1px solid #1565c0' : '1px solid #eaeaea',
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <div>
                    <div style={{ margin: '0 0 3px 0', color: isSelected ? '#0d47a1' : '#1e293b', fontSize: '15px', fontWeight: '700' }}>{item.label}</div>
                    <span style={{ fontSize: '11px', color: '#475569' }}>master dictionary</span>
                  </div>
                  <span aria-hidden="true" style={{ fontSize: '15px' }}>▶️</span>
                </button>
              );
            })
          ) : (
            <div role="status" style={{ textAlign: 'center', padding: '30px', color: '#475569', fontSize: '14px' }}>
              No files found!
            </div>
          )}
        </div>

      </div>

      {/* ================= RIGHT PANEL: REAL LUNA 3D AVATAR ================= */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f4f7f6', overflowY: 'auto', padding: '25px', boxSizing: 'border-box' }}>
        
        <div style={{ maxWidth: '900px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div style={{ backgroundColor: 'white', padding: '15px 20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>
                Luna 3D Avatar
              </span>
              <h1 style={{ color: '#003366', fontSize: '26px', margin: '5px 0 0 0' }}>{activeSign ? activeSign.label : ''}</h1>
            </div>
            <div style={{ fontSize: '12px', color: '#333', textAlign: 'right', backgroundColor: '#eef2f5', padding: '6px 12px', borderRadius: '6px', border: '1px solid #dcdcdc' }}>
              Path: <strong style={{ color: '#003366' }}>{activeSign ? activeSign.file : ''}</strong>
            </div>
          </div>

          {/* ASLI LUNA IFRAME (Robot Box Hata Diya) */}
          {/* Iframe key lagaya hai taaki word change hone par iframe re-render ho */}
          <div style={{ width: '100%', height: '550px', backgroundColor: '#eef2f5', borderRadius: '14px', boxShadow: '0 6px 20px rgba(0,0,0,0.1)', overflow: 'hidden', border: '1px solid #ccc' }}>
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