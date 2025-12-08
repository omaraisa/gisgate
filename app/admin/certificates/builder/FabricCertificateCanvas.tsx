'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import QRCode from 'qrcode';

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
  fields: CertificateField[];
  selectedFieldId: string | null;
  onSelectField: (fieldId: string | null) => void;
  onUpdateField: (fieldId: string, updates: Partial<CertificateField>) => void;
  getFieldDisplayText: (field: CertificateField) => string;
  zoom: number;
  readOnly?: boolean; // When true, locks all elements from being edited or selected
}

export default function FabricCertificateCanvas({
  backgroundImage,
  fields,
  selectedFieldId,
  onSelectField,
  onUpdateField,
  getFieldDisplayText,
  zoom,
  readOnly = false // Default to editable for backward compatibility
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

  // Generate QR code URL for verification
  const generateQRCode = async (certificateId: string): Promise<string> => {
    try {
      // Use APP_URL from environment or fallback to current origin
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const verificationUrl = `${baseUrl}/certificates/verify/${certificateId}`;
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      return '';
    }
  };

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    // Fix Fabric.js textBaseline validation - set globally before creating canvas
    if (fabric.Text && fabric.Text.prototype) {
      (fabric.Text.prototype as any).textBaseline = 'top';
    }

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: CANVAS_DISPLAY_WIDTH,
      height: CANVAS_DISPLAY_HEIGHT,
      backgroundColor: '#f0f0f0',
      selection: !readOnly, // Disable selection in read-only mode
      preserveObjectStacking: true
    });

    fabricCanvasRef.current = canvas;
    setIsCanvasReady(true);

    // Canvas event handlers - only attach if not in read-only mode
    if (!readOnly) {
      canvas.on('selection:created', (e: fabric.IEvent) => {
        const activeObject = e.selected?.[0];
        if (activeObject && activeObject.data?.fieldId) {
          onSelectField(activeObject.data.fieldId);
        }
      });

      canvas.on('selection:updated', (e: fabric.IEvent) => {
        const activeObject = e.selected?.[0];
        if (activeObject && activeObject.data?.fieldId) {
          onSelectField(activeObject.data.fieldId);
        }
      });

      canvas.on('selection:cleared', () => {
        onSelectField(null);
      });

      canvas.on('object:modified', (e: fabric.IEvent) => {
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
            const textObj = target as fabric.Textbox;
            updates.fontSize = (textObj.fontSize || 16) / actualScale;
            // Capture the width when textbox is resized
            if (textObj.width) {
              updates.maxWidth = textObj.width / actualScale;
            }
          }

          if (target.data?.fieldType === 'QR_CODE') {
            updates.width = (target.width || 150) * (target.scaleX || 1) / actualScale;
            updates.height = (target.height || 150) * (target.scaleY || 1) / actualScale;
            
            // Also update the QR text position
            const qrText = canvas.getObjects().find((obj: fabric.Object) => obj.data?.parentId === target.data.fieldId);
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
    }

    return () => {
      canvas.dispose();
    };
  }, [readOnly]); // Re-initialize when readOnly changes

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

    fabric.Image.fromURL(backgroundImage, (img: fabric.Image) => {
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
    
    // Preserve the current active selection
    const activeObject = canvas.getActiveObject();
    const activeFieldId = activeObject?.data?.fieldId;
    
    // Remove existing field objects (but keep background)
    const objects = canvas.getObjects().filter((obj: fabric.Object) => obj.data?.fieldId || obj.data?.parentId);
    objects.forEach((obj: fabric.Object) => canvas.remove(obj));

    // Calculate the actual scale for positioning fields
    const actualScale = displayScale * zoom;

    // Add field objects
    fields.forEach((field) => {
      
      if (field.type === 'QR_CODE') {
        const qrWidth = (field.width || 150) * actualScale;
        const qrHeight = (field.height || 150) * actualScale;
        
        // Get certificate ID from display text or generate a fallback
        const certificateId = getFieldDisplayText({ ...field, type: 'CERTIFICATE_ID' }) || 'CERT-PREVIEW';
        
        // Generate QR code asynchronously
        generateQRCode(certificateId).then((qrDataUrl) => {
          if (qrDataUrl) {
            // Create QR code as image
            fabric.Image.fromURL(qrDataUrl, (qrImg: fabric.Image) => {
              if (qrImg && canvas) {
                qrImg.set({
                  left: field.x * actualScale,
                  top: field.y * actualScale,
                  scaleX: qrWidth / 200, // QR is generated at 200px, scale to desired size
                  scaleY: qrHeight / 200,
                  angle: field.rotation || 0,
                  selectable: !readOnly, // Lock in read-only mode
                  evented: !readOnly, // Disable events in read-only mode
                  hasControls: true,
                  hasBorders: true,
                  lockScalingFlip: true,
                  data: { fieldId: field.id, fieldType: 'QR_CODE' }
                });
                canvas.add(qrImg);
                canvas.renderAll();
              }
            });
          } else {
            // Fallback: Create QR placeholder as rectangle if generation fails
            const qrRect = new fabric.Rect({
              left: field.x * actualScale,
              top: field.y * actualScale,
              width: qrWidth,
              height: qrHeight,
              fill: 'rgba(0, 0, 0, 0.1)',
              stroke: '#000',
              strokeWidth: 2,
              angle: field.rotation || 0,
              selectable: !readOnly, // Lock in read-only mode
              evented: !readOnly, // Disable events in read-only mode
              hasControls: true,
              hasBorders: true,
              lockScalingFlip: true,
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
            canvas.renderAll();
          }
        });
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
          selectable: !readOnly, // Lock in read-only mode
          editable: !readOnly, // Disable text editing in read-only mode
          evented: !readOnly, // Disable events in read-only mode
          data: { fieldId: field.id, fieldType: field.type }
        });

        canvas.add(text);
        
      }
    });

    // Restore the active selection after re-rendering fields
    if (activeFieldId) {
      // Use setTimeout to ensure QR codes have loaded asynchronously first
      setTimeout(() => {
        const targetObject = canvas.getObjects().find((obj: fabric.Object) => obj.data?.fieldId === activeFieldId);
        if (targetObject) {
          canvas.setActiveObject(targetObject);
          canvas.renderAll();
        }
      }, 50);
    } else {
      canvas.renderAll();
    }
  }, [fields, zoom, isCanvasReady, displayScale, readOnly]);

  // Handle selection changes separately to avoid re-rendering all fields
  useEffect(() => {
    if (!fabricCanvasRef.current || !isCanvasReady) return;
    
    const canvas = fabricCanvasRef.current;
    
    if (selectedFieldId) {
      const targetObject = canvas.getObjects().find((obj: fabric.Object) => obj.data?.fieldId === selectedFieldId);
      if (targetObject) {
        canvas.setActiveObject(targetObject);
        canvas.renderAll();
      }
    } else {
      canvas.discardActiveObject();
      canvas.renderAll();
    }
  }, [selectedFieldId, isCanvasReady]);

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
      fabric.Image.fromURL(backgroundImage, (img: fabric.Image) => {
        // Scale image to fit certificate dimensions
        const imgWidth = img.width || CERT_WIDTH;
        const imgHeight = img.height || CERT_HEIGHT;
        const imgScale = Math.min(CERT_WIDTH / imgWidth, CERT_HEIGHT / imgHeight);
        
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
          fields.forEach(async (field) => {
            if (field.type === 'QR_CODE') {
              const qrWidth = field.width || 150;
              const qrHeight = field.height || 150;
              
              // Get certificate ID for QR generation
              const certificateId = getFieldDisplayText({ ...field, type: 'CERTIFICATE_ID' }) || 'CERT-PREVIEW';
              
              try {
                const qrDataUrl = await generateQRCode(certificateId);
                if (qrDataUrl) {
                  fabric.Image.fromURL(qrDataUrl, (qrImg: fabric.Image) => {
                    if (qrImg) {
                      qrImg.set({
                        left: field.x,
                        top: field.y,
                        scaleX: qrWidth / 200,
                        scaleY: qrHeight / 200,
                        angle: field.rotation || 0
                      });
                      tempCanvas.add(qrImg);
                      tempCanvas.renderAll();
                    }
                  });
                } else {
                  throw new Error('QR generation failed');
                }
              } catch {
                // Fallback: Add placeholder rectangle if QR generation fails
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
                tempCanvas.renderAll();
              }
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
      (window as Window & typeof globalThis & { exportCertificateCanvas: () => string | null }).exportCertificateCanvas = exportCanvasImage;
    }
  }, [exportCanvasImage]);

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