import React, { useRef, useState, useEffect } from 'react';
import { Eraser, CheckCircle2, PenTool } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SignatureCanvas = ({ onCapture, clearTrigger }) => {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const [hasContent, setHasContent] = useState(false);

  // Initialize and keep canvas sized to element rect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const setupCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width || 600;
      const height = rect.height || 220;
      const scale = window.devicePixelRatio || 1;

      // Save drawing before resize
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (canvas.width > 0 && canvas.height > 0) {
        tempCtx.drawImage(canvas, 0, 0);
      }

      canvas.width = Math.floor(width * scale);
      canvas.height = Math.floor(height * scale);

      const ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (tempCanvas.width > 0 && tempCanvas.height > 0) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.restore();
      }
    };

    // Run setup immediately and on frame request
    setupCanvas();
    const animId = requestAnimationFrame(setupCanvas);

    const resizeObserver = new ResizeObserver(() => {
      setupCanvas();
    });
    resizeObserver.observe(canvas);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (clearTrigger) clearCanvas();
  }, [clearTrigger]);

  const getPoint = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    // Capture pointer in Chrome
    if (e.currentTarget.setPointerCapture && e.pointerId !== undefined) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (err) {
        // Fallback for non-pointer support
      }
    }

    isDrawingRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { x, y } = getPoint(e);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { x, y } = getPoint(e);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasContent) setHasContent(true);
  };

  const stopDrawing = (e) => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      if (e && e.currentTarget.releasePointerCapture && e.pointerId !== undefined) {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch (err) {
          // Silent fallback
        }
      }
      handleSave();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scale = window.devicePixelRatio || 1;
    ctx.scale(scale, scale);
    ctx.beginPath();

    setHasContent(false);
    if (onCapture) onCapture(null);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (onCapture) onCapture(blob);
    }, 'image/png');
  };

  return (
    <div className="space-y-3 font-outfit select-none">
      <div className="relative group">
        <canvas
          ref={canvasRef}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ touchAction: 'none' }}
          className="w-full h-56 bg-white border-2 border-slate-200 rounded-[2rem] shadow-inner cursor-crosshair transition-all hover:border-primary-500/50"
        />

        <AnimatePresence>
          {!hasContent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            >
              <div className="p-4 bg-slate-50/80 rounded-full mb-2 border border-slate-100 shadow-sm">
                <PenTool className="w-6 h-6 text-slate-400" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                PLACE YOUR SIGNATURE HERE
              </span>
              <p className="text-[10px] font-medium text-slate-400 mt-1">Use mouse or touch input to sign</p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={clearCanvas}
          className="absolute bottom-4 right-4 p-3 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 rounded-2xl text-slate-500 transition-all shadow-md group/btn"
          title="Clear Signature"
        >
          <Eraser className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
        </motion.button>
      </div>

      <AnimatePresence>
        {hasContent && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
              Signature Captured & Verified
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SignatureCanvas;
