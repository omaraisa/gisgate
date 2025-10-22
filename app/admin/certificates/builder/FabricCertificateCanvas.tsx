'use client';

import { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';

interface CertificateField {
  id: string;
  type: 'STUDENT_NAME' | 'COURSE_TITLE' | 'COMPLETION_DATE' | 'DURATION' | 'INSTRUCTOR' | 'CERTIFICATE_ID' | 'QR_CODE';
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  textAlign: 'left' | 'center' | 'right';
  maxWidth?: number;
  width?: number;
  height?: number;
  fontWeight?: 'normal' | 'bold';
  rotation?: number;
}

interface FabricCertificateCanvasProps {
  backgroundImage: string;
  backgroundWidth: number;
  backgroundHeight: number;
  fields: CertificateField[];
  selectedFieldId: string | null;
  onSelectField: (fieldId: string | null) => void;
  onUpdateField: (fieldId: string, updates: Partial<CertificateField>) => void;
  getFieldDisplayText: (field: CertificateField) => string;
  zoom: number;
}

export default function FabricCertificateCanvas({
  backgroundImage,
  backgroundWidth,
  backgroundHeight,
  fields,
  selectedFieldId,
  onSelectField,
  onUpdateField,
  getFieldDisplayText,
  zoom
}: FabricCertificateCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  
  // Fixed certificate dimensions (your template size)
  const CERT_WIDTH = 2000;
  const CERT_HEIGHT = 1414;
  
  // Fixed canvas display size (fits in viewport)
  const CANVAS_DISPLAY_WIDTH = 800;
  const CANVAS_DISPLAY_HEIGHT = 565; // Maintaining 2000:1414 aspect ratio
  
  // Calculate scale factor to display the certificate in the canvas
  const displayScale = CANVAS_DISPLAY_WIDTH / CERT_WIDTH;

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: CANVAS_DISPLAY_WIDTH,
      height: CANVAS_DISPLAY_HEIGHT,
      backgroundColor: '#f0f0f0',
      selection: true,
      preserveObjectStacking: true
    });

    fabricCanvasRef.current = canvas;
    setIsCanvasReady(true);

    // Canvas event handlers
    canvas.on('selection:created', (e: any) => {
      const activeObject = e.selected?.[0];
      if (activeObject && activeObject.data?.fieldId) {
        onSelectField(activeObject.data.fieldId);
      }
    });

    canvas.on('selection:updated', (e: any) => {
      const activeObject = e.selected?.[0];
      if (activeObject && activeObject.data?.fieldId) {
        onSelectField(activeObject.data.fieldId);
      }
    });

    canvas.on('selection:cleared', () => {
      onSelectField(null);
    });

    canvas.on('object:modified', (e: any) => {
      const target = e.target;
      if (target && target.data?.fieldId) {
        // Convert canvas coordinates back to actual image coordinates
        const actualScale = displayScale * zoom;
        const updates: Partial<CertificateField> = {
          x: (target.left || 0) / actualScale,
          y: (target.top || 0) / actualScale,
          rotation: target.angle || 0
        };

        if (target.type === 'textbox' || target.type === 'text') {
          const textObj = target as fabric.Text;
          updates.fontSize = (textObj.fontSize || 16) / actualScale;
        }

        if (target.data?.fieldType === 'QR_CODE') {
          updates.width = (target.width || 150) * (target.scaleX || 1) / actualScale;
          updates.height = (target.height || 150) * (target.scaleY || 1) / actualScale;
          
          // Also update the QR text position
          const qrText = canvas.getObjects().find((obj: any) => obj.data?.parentId === target.data.fieldId);
          if (qrText) {
            const qrWidth = (target.width || 150) * (target.scaleX || 1);
            const qrHeight = (target.height || 150) * (target.scaleY || 1);
            qrText.set({
              left: (target.left || 0) + qrWidth / 2,
              top: (target.top || 0) + qrHeight / 2,
              angle: target.angle || 0
            });
            qrText.setCoords();
          }
        }

        onUpdateField(target.data.fieldId, updates);
        canvas.renderAll();
      }
    });

    return () => {
      canvas.dispose();
    };
  }, []);

  // Update canvas zoom
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    // Canvas size stays fixed, only zoom changes the scale of objects
    canvas.setZoom(zoom);
    canvas.renderAll();
  }, [zoom]);

  // Load background image
  useEffect(() => {
    if (!fabricCanvasRef.current || !backgroundImage || !isCanvasReady) return;

    const canvas = fabricCanvasRef.current;

    fabric.Image.fromURL(backgroundImage, (img: any) => {
      // Scale the image to fit the fixed canvas size
      const imageScale = displayScale * zoom;
      
      img.set({
        left: 0,
        top: 0,
        scaleX: imageScale,
        scaleY: imageScale,
        selectable: false,
        evented: false,
        excludeFromExport: false
      });

      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
    });
  }, [backgroundImage, zoom, isCanvasReady, displayScale]);

  // Update fields on canvas
  useEffect(() => {
    if (!fabricCanvasRef.current || !isCanvasReady) return;

    const canvas = fabricCanvasRef.current;
    
    // Remove existing field objects (but keep background)
    const objects = canvas.getObjects().filter((obj: any) => obj.data?.fieldId || obj.data?.parentId);
    objects.forEach((obj: any) => canvas.remove(obj));

    // Calculate the actual scale for positioning fields
    const actualScale = displayScale * zoom;

    // Add field objects
    fields.forEach((field, index) => {
      
      if (field.type === 'QR_CODE') {
        const qrWidth = (field.width || 150) * actualScale;
        const qrHeight = (field.height || 150) * actualScale;
        
        // Create QR placeholder as rectangle
        const qrRect = new fabric.Rect({
          left: field.x * actualScale,
          top: field.y * actualScale,
          width: qrWidth,
          height: qrHeight,
          fill: 'rgba(0, 0, 0, 0.1)',
          stroke: '#000',
          strokeWidth: 2,
          angle: field.rotation || 0,
          data: { fieldId: field.id, fieldType: 'QR_CODE' }
        });

        // Add QR text label centered in the rectangle
        const qrText = new fabric.Text('[QR]', {
          left: field.x * actualScale + qrWidth / 2,
          top: field.y * actualScale + qrHeight / 2,
          fontSize: Math.min(qrWidth, qrHeight) * 0.15,
          fontFamily: 'Arial',
          fill: '#666',
          textAlign: 'center',
          originX: 'center',
          originY: 'center',
          selectable: false,
          evented: false,
          data: { fieldId: field.id, fieldType: 'QR_TEXT', parentId: field.id }
        });

        canvas.add(qrRect);
        canvas.add(qrText);
      } else {
        // Create text field with validation
        const textLeft = field.x * actualScale;
        const textTop = field.y * actualScale;
        const textSize = field.fontSize * actualScale;
        
        // Calculate width - use maxWidth if available, otherwise auto-fit or default
        const textWidth = field.maxWidth 
          ? field.maxWidth * actualScale 
          : Math.max(400 * actualScale, 200); // Default minimum width
        
        const text = new fabric.Textbox(getFieldDisplayText(field), {
          left: textLeft,
          top: textTop,
          fontSize: Math.max(textSize, 10), // Ensure minimum readable size
          fontFamily: field.fontFamily,
          fill: field.color,
          textAlign: field.textAlign,
          fontWeight: field.fontWeight || 'normal',
          angle: field.rotation || 0,
          width: textWidth,
          data: { fieldId: field.id, fieldType: field.type }
        });

        canvas.add(text);
        
      }
    });

    // Select the currently selected field
    if (selectedFieldId) {
      const targetObject = canvas.getObjects().find((obj: any) => obj.data?.fieldId === selectedFieldId);
      if (targetObject) {
        canvas.setActiveObject(targetObject);
      }
    }

    canvas.renderAll();
  }, [fields, selectedFieldId, zoom, isCanvasReady, getFieldDisplayText, displayScale]);

  // Export canvas as image for PDF generation
  const exportCanvasImage = () => {
    if (!fabricCanvasRef.current) return null;
    
    const canvas = fabricCanvasRef.current;
    
    // Create a temporary canvas with fixed certificate dimensions
    const tempCanvas = new fabric.Canvas(document.createElement('canvas'), {
      width: CERT_WIDTH,
      height: CERT_HEIGHT
    });
    
    // Load background at full resolution
    if (backgroundImage) {
      fabric.Image.fromURL(backgroundImage, (img: any) => {
        // Scale image to fit certificate dimensions
        const imgScale = Math.min(CERT_WIDTH / img.width, CERT_HEIGHT / img.height);
        
        img.set({
          left: 0,
          top: 0,
          scaleX: imgScale,
          scaleY: imgScale,
          selectable: false,
          evented: false
        });
        
        tempCanvas.setBackgroundImage(img, () => {
          // Add fields at actual coordinates
          fields.forEach(field => {
            if (field.type === 'QR_CODE') {
              const qrWidth = field.width || 150;
              const qrHeight = field.height || 150;
              
              const qrRect = new fabric.Rect({
                left: field.x,
                top: field.y,
                width: qrWidth,
                height: qrHeight,
                fill: 'rgba(0, 0, 0, 0.1)',
                stroke: '#000',
                strokeWidth: 2,
                angle: field.rotation || 0
              });

              const qrText = new fabric.Text('[QR]', {
                left: field.x + qrWidth / 2,
                top: field.y + qrHeight / 2,
                fontSize: Math.min(qrWidth, qrHeight) * 0.15,
                fontFamily: 'Arial',
                fill: '#666',
                textAlign: 'center',
                originX: 'center',
                originY: 'center',
                angle: field.rotation || 0
              });

              tempCanvas.add(qrRect);
              tempCanvas.add(qrText);
            } else {
              const text = new fabric.Textbox(getFieldDisplayText(field), {
                left: field.x,
                top: field.y,
                fontSize: field.fontSize,
                fontFamily: field.fontFamily,
                fill: field.color,
                textAlign: field.textAlign,
                fontWeight: field.fontWeight || 'normal',
                angle: field.rotation || 0,
                width: field.maxWidth
              });
              tempCanvas.add(text);
            }
          });
          
          tempCanvas.renderAll();
        });
      });
    }
    
    // For now, return the display canvas with proper scaling
    const multiplier = CERT_WIDTH / CANVAS_DISPLAY_WIDTH;
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1.0,
      multiplier: multiplier
    });
    
    return dataURL;
  };

  // Expose export function to parent
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).exportCertificateCanvas = exportCanvasImage;
    }
  }, []);

  return (
    <div className="flex justify-center items-center bg-gray-100 p-4">
      <div className="border border-gray-300 shadow-lg">
        <canvas 
          ref={canvasRef} 
          style={{ 
            width: `${CANVAS_DISPLAY_WIDTH}px`, 
            height: `${CANVAS_DISPLAY_HEIGHT}px`,
            maxWidth: '100%',
            maxHeight: '100%'
          }} 
        />
      </div>
    </div>
  );
}