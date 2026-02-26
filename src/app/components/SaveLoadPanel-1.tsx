import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Save, FolderOpen, Trash2, X } from 'lucide-react';
import { saveCardDesign, getSavedDesigns, deleteCardDesign, SavedCardDesign } from '../utils/cardThemes';

interface SaveLoadPanelProps {
  builderType: string;
  currentData: any;
  currentTheme: string;
  onLoad: (design: SavedCardDesign) => void;
}

export function SaveLoadPanel({ builderType, currentData, currentTheme, onLoad }: SaveLoadPanelProps) {
  const [showModal, setShowModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [savedDesigns, setSavedDesigns] = useState<SavedCardDesign[]>(
    getSavedDesigns().filter(d => d.builderType === builderType)
  );

  const handleSave = () => {
    if (!saveName.trim()) {
      alert('Please enter a name for your design');
      return;
    }

    const newDesign = saveCardDesign({
      name: saveName,
      builderType,
      data: currentData,
      theme: currentTheme,
    });

    setSavedDesigns(getSavedDesigns().filter(d => d.builderType === builderType));
    setSaveName('');
    alert('Design saved successfully!');
  };

  const handleLoad = (design: SavedCardDesign) => {
    if (confirm(`Load design "${design.name}"?`)) {
      onLoad(design);
      setShowModal(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this design?')) {
      deleteCardDesign(id);
      setSavedDesigns(getSavedDesigns().filter(d => d.builderType === builderType));
    }
  };

  return (
    <>
      <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
        <h4 className="text-sm font-bold text-gray-900 mb-3">💾 Save & Load</h4>
        <div className="flex gap-2 mb-3">
          <Input
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Design name..."
            className="flex-1"
          />
          <Button onClick={handleSave} variant="outline" size="sm">
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
        </div>
        <Button 
          onClick={() => setShowModal(true)} 
          variant="outline" 
          className="w-full"
          disabled={savedDesigns.length === 0}
        >
          <FolderOpen className="w-4 h-4 mr-2" />
          Load Saved Design ({savedDesigns.length})
        </Button>
      </Card>

      {/* Load Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="bg-white p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Load Saved Design</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {savedDesigns.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No saved designs yet</p>
            ) : (
              <div className="space-y-3">
                {savedDesigns.map((design) => (
                  <div 
                    key={design.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{design.name}</div>
                      <div className="text-sm text-gray-500">
                        Saved: {new Date(design.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLoad(design)}
                      >
                        <FolderOpen className="w-4 h-4 mr-1" />
                        Load
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(design.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
