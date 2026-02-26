import React from 'react';
import { Input } from './ui/input';

interface ImagePositionControlsProps {
  label: string;
  position: { x: number; y: number; scale: number };
  onChange: (position: { x: number; y: number; scale: number }) => void;
}

export function ImagePositionControls({ label, position, onChange }: ImagePositionControlsProps) {
  return (
    <>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">{label} X Position</label>
        <Input
          type="range"
          min="-50"
          max="50"
          value={position.x}
          onChange={(e) => onChange({ ...position, x: parseInt(e.target.value) })}
        />
        <span className="text-xs text-gray-500">{position.x}%</span>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">{label} Y Position</label>
        <Input
          type="range"
          min="-50"
          max="50"
          value={position.y}
          onChange={(e) => onChange({ ...position, y: parseInt(e.target.value) })}
        />
        <span className="text-xs text-gray-500">{position.y}%</span>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">{label} Scale</label>
        <Input
          type="range"
          min="50"
          max="200"
          value={position.scale}
          onChange={(e) => onChange({ ...position, scale: parseInt(e.target.value) })}
        />
        <span className="text-xs text-gray-500">{position.scale}%</span>
      </div>
    </>
  );
}
