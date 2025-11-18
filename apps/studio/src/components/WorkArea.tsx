import React from 'react';
import DocEditor from './DocEditor';
import PDFAnnotatorV2 from './PDFAnnotatorV2';
import WhiteboardV2 from './WhiteboardV2';
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
          <PDFAnnotatorV2
            assignment={activeAssignment}
            annotations={[]}
            onAnnotationAdd={(annotation) => console.log('Added annotation:', annotation)}
            onAnnotationUpdate={(id, annotation) => console.log('Updated annotation:', id, annotation)}
            onAnnotationDelete={(id) => console.log('Deleted annotation:', id)}
          />
        );
      case 'BOARD':
        return (
          <WhiteboardV2
            assignment={activeAssignment}
            shapes={[]}
            onShapeAdd={(shape) => console.log('Added shape:', shape)}
            onShapeUpdate={(id, shape) => console.log('Updated shape:', id, shape)}
            onShapeDelete={(id) => console.log('Deleted shape:', id)}
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
            data-tab={tab.key}
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
