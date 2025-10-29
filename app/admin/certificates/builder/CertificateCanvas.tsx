'use client';

import { useRef, useEffect } from 'react';
import { Stage, Layer, Text as KonvaText, Image as KonvaImage, Rect, Transformer } from 'react-konva';
import useImage from 'use-image';
import type Konva from 'konva';

interface CertificateField {
  id: string;
  type: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  textAlign: 'left' | 'center' | 'right';
  width?: number;
  height?: number;
  fontWeight?: 'normal' | 'bold';
  rotation?: number;
}

export interface CertificateCanvasProps {
  backgroundImage: string;
  backgroundWidth: number;
  backgroundHeight: number;
  fields: CertificateField[];
  selectedFieldId: string | null;
  onSelectField: (id: string | null) => void;
  onUpdateField: (id: string, updates: Partial<CertificateField>) => void;
  getFieldDisplayText: (field: CertificateField) => string;
  zoom: number;
}

export default function CertificateCanvas({
  backgroundImage,
  backgroundWidth,
  backgroundHeight,
  fields,
  selectedFieldId,
  onSelectField,
  onUpdateField,
  getFieldDisplayText,
  zoom
}: CertificateCanvasProps) {
  const [bgImage] = useImage(backgroundImage, 'anonymous');
  const transformerRef = useRef<Konva.Transformer>(null);
  const selectedTextRef = useRef<Konva.Text>(null);
  const selectedRectRef = useRef<Konva.Rect>(null);

  // Update transformer when selection changes
  useEffect(() => {
    if (transformerRef.current) {
      const selectedNode = selectedTextRef.current || selectedRectRef.current;
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    }
  }, [selectedFieldId]);

  const handleSelect = (id: string) => {
    onSelectField(id);
  };

  const handleDeselect = () => {
    onSelectField(null);
  };

  const handleDragEnd = (id: string, e: Konva.KonvaEventObject<MouseEvent>) => {
    onUpdateField(id, {
      x: e.target.x(),
      y: e.target.y()
    });
  };

  const handleTransformEnd = (id: string, e: Konva.KonvaEventObject<MouseEvent>) => {
    const node = e.target as Konva.Text | Konva.Rect;
    const scaleY = node.scaleY();

    // Reset scale
    node.scaleX(1);
    node.scaleY(1);

    onUpdateField(id, {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      fontSize: Math.round((node as Konva.Text).fontSize() * scaleY) // For text
    });
  };

  // Calculate display dimensions to fit screen
  const maxCanvasWidth = 1200;
  const scale = Math.min(maxCanvasWidth / backgroundWidth, zoom);
  const displayWidth = backgroundWidth * scale;
  const displayHeight = backgroundHeight * scale;

  return (
    <div className="inline-block">
      <Stage
        width={displayWidth}
        height={displayHeight}
        scaleX={scale}
        scaleY={scale}
        onClick={(e: Konva.KonvaEventObject<MouseEvent>) => {
          // Deselect when clicking on empty area
          if (e.target === e.target.getStage()) {
            handleDeselect();
          }
        }}
      >
        <Layer>
          {/* Background Image */}
          {bgImage && (
            <KonvaImage
              image={bgImage}
              x={0}
              y={0}
              width={backgroundWidth}
              height={backgroundHeight}
            />
          )}

          {/* Fields */}
          {fields.map((field) => {
            const isSelected = field.id === selectedFieldId;

            if (field.type === 'QR_CODE') {
              return (
                <Rect
                  key={field.id}
                  ref={isSelected ? selectedRectRef : undefined}
                  x={field.x}
                  y={field.y}
                  width={field.width || 150}
                  height={field.height || 150}
                  fill="rgba(0,0,0,0.1)"
                  stroke="#666"
                  strokeWidth={2}
                  dash={[10, 5]}
                  draggable
                  onClick={() => handleSelect(field.id)}
                  onDragEnd={(e: Konva.KonvaEventObject<MouseEvent>) => handleDragEnd(field.id, e)}
                  onTransformEnd={(e: Konva.KonvaEventObject<MouseEvent>) => handleTransformEnd(field.id, e)}
                  rotation={field.rotation || 0}
                />
              );
            }

            const displayText = getFieldDisplayText(field);
            
            return (
              <KonvaText
                key={field.id}
                ref={isSelected ? selectedTextRef : undefined}
                x={field.x}
                y={field.y}
                text={displayText}
                fontSize={field.fontSize}
                fontFamily={field.fontFamily}
                fill={field.color}
                align={field.textAlign}
                fontStyle={field.fontWeight === 'bold' ? 'bold' : 'normal'}
                draggable
                onClick={() => handleSelect(field.id)}
                onDragEnd={(e: Konva.KonvaEventObject<MouseEvent>) => handleDragEnd(field.id, e)}
                onTransformEnd={(e: Konva.KonvaEventObject<MouseEvent>) => handleTransformEnd(field.id, e)}
                rotation={field.rotation || 0}
                // Offset for text alignment
                offsetX={field.textAlign === 'center' ? displayText.length * field.fontSize * 0.3 : 
                         field.textAlign === 'right' ? displayText.length * field.fontSize * 0.6 : 0}
              />
            );
          })}

          {/* Transformer for selected field */}
          {selectedFieldId && (
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                // Limit resize
                if (newBox.width < 5 || newBox.height < 5) {
                  return oldBox;
                }
                return newBox;
              }}
              enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
              rotateEnabled={true}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}
