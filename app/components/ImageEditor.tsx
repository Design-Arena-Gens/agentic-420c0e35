'use client';

import { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import {
  Pencil,
  Eraser,
  Download,
  Trash2,
  ArrowLeft,
  Sparkles,
  Upload,
  Undo,
  Redo,
  Move,
} from 'lucide-react';

interface ImageEditorProps {
  initialImage: string | null;
  onBack: () => void;
}

export default function ImageEditor({ initialImage, onBack }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [brushColor, setBrushColor] = useState('#ff0000');
  const [brushSize, setBrushSize] = useState(5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [tool, setTool] = useState<'pencil' | 'eraser' | 'move'>('pencil');
  const historyRef = useRef<string[]>([]);
  const historyStepRef = useRef(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
    });

    fabricCanvasRef.current = canvas;

    if (initialImage) {
      fabric.Image.fromURL(initialImage, (img) => {
        const scale = Math.min(
          canvas.width! / img.width!,
          canvas.height! / img.height!,
          1
        );
        img.scale(scale);
        img.set({
          left: (canvas.width! - img.width! * scale) / 2,
          top: (canvas.height! - img.height! * scale) / 2,
          selectable: false,
        });
        canvas.add(img);
        canvas.sendToBack(img);
        canvas.renderAll();
        saveHistory();
      });
    } else {
      saveHistory();
    }

    canvas.on('path:created', () => {
      saveHistory();
    });

    return () => {
      canvas.dispose();
    };
  }, [initialImage]);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = isDrawingMode && tool === 'pencil';

    if (tool === 'pencil') {
      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.width = brushSize;
    } else if (tool === 'eraser') {
      canvas.freeDrawingBrush.color = '#ffffff';
      canvas.freeDrawingBrush.width = brushSize * 2;
    }
  }, [isDrawingMode, brushColor, brushSize, tool]);

  const saveHistory = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const json = JSON.stringify(canvas.toJSON());
    historyRef.current = historyRef.current.slice(0, historyStepRef.current + 1);
    historyRef.current.push(json);
    historyStepRef.current++;

    if (historyRef.current.length > 50) {
      historyRef.current.shift();
      historyStepRef.current--;
    }
  };

  const undo = () => {
    if (historyStepRef.current > 0) {
      historyStepRef.current--;
      const canvas = fabricCanvasRef.current;
      if (canvas) {
        canvas.loadFromJSON(historyRef.current[historyStepRef.current], () => {
          canvas.renderAll();
        });
      }
    }
  };

  const redo = () => {
    if (historyStepRef.current < historyRef.current.length - 1) {
      historyStepRef.current++;
      const canvas = fabricCanvasRef.current;
      if (canvas) {
        canvas.loadFromJSON(historyRef.current[historyStepRef.current], () => {
          canvas.renderAll();
        });
      }
    }
  };

  const handleToolSelect = (selectedTool: 'pencil' | 'eraser' | 'move') => {
    setTool(selectedTool);
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    if (selectedTool === 'move') {
      canvas.isDrawingMode = false;
      setIsDrawingMode(false);
      canvas.selection = true;
      canvas.forEachObject((obj) => {
        if (obj.type === 'path') {
          obj.selectable = true;
        }
      });
    } else {
      canvas.isDrawingMode = true;
      setIsDrawingMode(true);
      canvas.selection = false;
      canvas.forEachObject((obj) => {
        obj.selectable = false;
      });
    }
  };

  const handleClear = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const objects = canvas.getObjects();
    objects.forEach((obj) => {
      if (obj.type === 'path') {
        canvas.remove(obj);
      }
    });
    canvas.renderAll();
    saveHistory();
  };

  const handleDownload = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
    });

    const link = document.createElement('a');
    link.download = `edited-image-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  };

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      fabric.Image.fromURL(event.target?.result as string, (img) => {
        const scale = Math.min(canvas.width! / img.width!, canvas.height! / img.height!, 0.5);
        img.scale(scale);
        img.set({
          left: 100,
          top: 100,
          selectable: true,
        });
        canvas.add(img);
        canvas.renderAll();
        saveHistory();
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAIEdit = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt for AI editing');
      return;
    }

    setIsProcessing(true);

    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvas.width!;
    maskCanvas.height = canvas.height!;
    const maskCtx = maskCanvas.getContext('2d')!;
    maskCtx.fillStyle = '#000000';
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    const paths = canvas.getObjects('path');
    paths.forEach((path) => {
      const pathData = path.toDataURL({
        format: 'png',
      });
      const img = new Image();
      img.src = pathData;
    });

    maskCtx.fillStyle = '#ffffff';
    paths.forEach((path: any) => {
      const pathPoints = path.path;
      maskCtx.beginPath();
      pathPoints.forEach((point: any, index: number) => {
        const x = point[1] + path.left;
        const y = point[2] + path.top;
        if (index === 0) {
          maskCtx.moveTo(x, y);
        } else {
          maskCtx.lineTo(x, y);
        }
      });
      maskCtx.strokeStyle = '#ffffff';
      maskCtx.lineWidth = brushSize * 3;
      maskCtx.stroke();
    });

    const imageDataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
    });
    const maskDataURL = maskCanvas.toDataURL('image/png');

    try {
      const response = await fetch('/api/edit-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageDataURL,
          mask: maskDataURL,
          prompt: prompt,
        }),
      });

      if (!response.ok) {
        throw new Error('AI processing failed');
      }

      const data = await response.json();

      if (data.editedImage) {
        fabric.Image.fromURL(data.editedImage, (img) => {
          canvas.clear();
          canvas.setBackgroundColor('#ffffff', () => {});

          const scale = Math.min(canvas.width! / img.width!, canvas.height! / img.height!);
          img.scale(scale);
          img.set({
            left: (canvas.width! - img.width! * scale) / 2,
            top: (canvas.height! - img.height! * scale) / 2,
            selectable: false,
          });
          canvas.add(img);
          canvas.sendToBack(img);
          canvas.renderAll();
          saveHistory();
        });
      }
    } catch (error) {
      console.error('AI editing error:', error);
      alert('AI editing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            AI Image Editor
          </h1>
          <div className="w-20"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          {/* Canvas Area */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 mb-6 pb-6 border-b border-gray-200">
              <button
                onClick={() => handleToolSelect('pencil')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  tool === 'pencil'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Pencil className="w-4 h-4" />
                Pencil
              </button>

              <button
                onClick={() => handleToolSelect('eraser')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  tool === 'eraser'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Eraser className="w-4 h-4" />
                Eraser
              </button>

              <button
                onClick={() => handleToolSelect('move')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  tool === 'move'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Move className="w-4 h-4" />
                Move
              </button>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={undo}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                  title="Undo"
                >
                  <Undo className="w-4 h-4" />
                </button>
                <button
                  onClick={redo}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                  title="Redo"
                >
                  <Redo className="w-4 h-4" />
                </button>
                <button
                  onClick={handleClear}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                  title="Clear Drawings"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>

            {/* Brush Controls */}
            <div className="flex flex-wrap items-center gap-6 mb-6">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Color:</label>
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  className="w-12 h-10 rounded cursor-pointer border-2 border-gray-300"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Brush Size:</label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-32"
                />
                <span className="text-sm font-medium text-gray-600 w-8">{brushSize}</span>
              </div>

              <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                Add Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAddImage}
                  className="hidden"
                />
              </label>
            </div>

            {/* Canvas */}
            <div className="flex justify-center">
              <canvas ref={canvasRef} />
            </div>
          </div>

          {/* AI Controls Panel */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-800">AI Edit</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you want to change in the marked area..."
                  className="w-full h-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              <button
                onClick={handleAIEdit}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Apply AI Edit
                  </>
                )}
              </button>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Instructions:</h3>
                <ol className="text-sm text-gray-600 space-y-2">
                  <li className="flex gap-2">
                    <span className="font-semibold">1.</span>
                    <span>Use the pencil tool to mark the area you want to edit</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold">2.</span>
                    <span>Enter a description of what you want</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold">3.</span>
                    <span>Click "Apply AI Edit" and let Nano Banana Pro work its magic</span>
                  </li>
                </ol>
              </div>

              <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                <p className="text-xs text-purple-800">
                  <strong>Tip:</strong> Mark the areas you want to change with clear strokes.
                  The AI will understand your intent and transform the marked regions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
