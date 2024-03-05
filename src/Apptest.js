import React, { useState, useRef, useEffect } from 'react';

const DrawingCanvas = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set initial styles
    ctx.strokeStyle = '#000000'; // Black color
    ctx.lineWidth = 2;

    const handleMouseDown = (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      ctx.beginPath();
      ctx.moveTo(x, y);
      setIsDrawing(true);
    };

    const handleMouseMove = (event) => {
      if (!isDrawing) return;

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const handleMouseUp = () => {
      setIsDrawing(false);
    };

    const handleMouseOut = () => {
      setIsDrawing(false);
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseout', handleMouseOut);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseout', handleMouseOut);
    };
  }, [isDrawing]);

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={300}
      style={{ border: '1px solid black' }}
    />
  );
};

export default DrawingCanvas;
