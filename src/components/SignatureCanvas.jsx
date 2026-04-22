import React, { useRef, useState, useEffect } from 'react';
import { Eraser, MousePointer2, CheckCircle2, PenTool } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SignatureCanvas = ({ onCapture, clearTrigger }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const updateCanvasSize = () => {
      const scale = window.devicePixelRatio || 1;
      
      // Use clientWidth/clientHeight (padding box) so borders do not distort the buffer size
      const newWidth = Math.floor(canvas.clientWidth * scale);
      const newHeight = Math.floor(canvas.clientHeight * scale);

      if (canvas.width !== newWidth || canvas.height !== newHeight) {
        // Save existing drawing
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(canvas, 0, 0);

        // Update dimensions
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        ctx.scale(scale, scale);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#1e293b'; 
        ctx.lineWidth = 2.5;

        // Restore drawing to prevent clearing on resize
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.restore();
      }
    };

    const resizeObserver = new ResizeObserver(updateCanvasSize);
    resizeObserver.observe(canvas);
    
    // Trigger initial setup
    updateCanvasSize();

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (clearTrigger) clearCanvas();
  }, [clearTrigger]);

  const startDrawing = (e) => {
    const { offsetX, offsetY } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
    setHasContent(true);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      handleSave();
    }
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX || e.nativeEvent.clientX;
      clientY = e.clientY || e.nativeEvent.clientY;
    }

    const style = window.getComputedStyle(canvas);
    const borderLeft = parseFloat(style.borderLeftWidth) || 0;
    const borderTop = parseFloat(style.borderTopWidth) || 0;

    // Calculate position relative to the drawing buffer (inside the border)
    const x = clientX - rect.left - borderLeft;
    const y = clientY - rect.top - borderTop;

    // Calculate accurate scaling ratio (handles CSS transforms like zoom/scale)
    const scaleX = canvas.width / (canvas.clientWidth * (window.devicePixelRatio || 1));
    const scaleY = canvas.height / (canvas.clientHeight * (window.devicePixelRatio || 1));

    return {
      offsetX: x * scaleX,
      offsetY: y * scaleY
    };
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Reset transform to identity to clear the absolute pixel buffer completely
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Re-apply the scale for future drawing
    const scale = window.devicePixelRatio || 1;
    ctx.scale(scale, scale);
    
    // Reset the path so old strokes don't reappear
    ctx.beginPath();
    
    setHasContent(false);
    onCapture(null);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      onCapture(blob);
    }, 'image/png');
  };

  return (
    <div className="space-y-4 font-outfit">
      <div className="relative group">
        {/* Soft decorative background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-52 bg-white/40 backdrop-blur-xl border-2 border-slate-100 rounded-[2rem] shadow-[inner_0_2px_10px_rgba(0,0,0,0.02)] cursor-crosshair touch-none transition-all group-hover:border-primary-500/30 group-hover:bg-white/60"
        />
        
        <AnimatePresence>
          {!hasContent && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            >
              <div className="p-4 bg-slate-50/50 rounded-full mb-3 border border-slate-100/50 backdrop-blur-sm">
                <PenTool className="w-6 h-6 text-slate-300" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Place your signature here</span>
              <p className="text-[9px] font-bold text-slate-300 mt-2">Use mouse or touch input</p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={clearCanvas}
          className="absolute bottom-6 right-6 p-3 bg-white/90 backdrop-blur-md border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 rounded-2xl text-slate-400 transition-all shadow-xl shadow-slate-200/20 group/btn overflow-hidden"
          title="Clear Signature"
        >
          <Eraser className="w-4 h-4 group-hover/btn:rotate-12 transition-transform relative z-10" />
        </motion.button>
      </div>
      
      <AnimatePresence>
        {hasContent && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 p-3 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-bounce" />
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
