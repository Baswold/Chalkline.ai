import React from 'react';
import DocEditor from './DocEditor';
import PDFAnnotator from './PDFAnnotator';
import Whiteboard from './Whiteboard';
import type { WorkAreaProps, WorkTab } from '../types';

const WorkArea: React.FC<WorkAreaProps> = ({
  activeTab,
  activeAssignment,
  onTabChange,
  onSubmission,
  submissions
}) => {
  const tabs: Array<{ key: WorkTab; label: string; icon: string }> = [
    { key: 'DOC', label: 'Document', icon: '▤' },
    { key: 'PDF', label: 'PDF', icon: '▦' },
    { key: 'BOARD', label: 'Whiteboard', icon: '▧' }
  ];

  const handleTabClick = (tab: WorkTab) => {
    onTabChange(tab);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'DOC':
        return (
          <DocEditor
            assignment={activeAssignment}
            onSubmission={onSubmission}
            submissions={submissions}
          />
        );
      case 'PDF':
        return (
          <PDFAnnotator
            assignment={activeAssignment}
            annotations={[]}
            onAnnotationAdd={() => {}}
            onAnnotationUpdate={() => {}}
            onAnnotationDelete={() => {}}
          />
        );
      case 'BOARD':
        return (
          <Whiteboard
            assignment={activeAssignment}
            shapes={[]}
            onShapeAdd={() => {}}
            onShapeUpdate={() => {}}
            onShapeDelete={() => {}}
          />
        );
      default:
        return <div>Select a tab to begin working</div>;
    }
  };

  return (
    <div className="work-area">
      <div className="work-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`work-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.key)}
            aria-selected={activeTab === tab.key}
            role="tab"
          >
            <span className="tab-icon" role="img" aria-hidden="true">
              {tab.icon}
            </span>
            {tab.label}
          </button>
        ))}
      </div>
      
      <div className="work-content" role="tabpanel">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default WorkArea;