import React, { useState, useEffect, useRef } from "react";
import * as onnx from "onnxjs";

const CANVAS_SIZE = 280;
const CANVAS_SCALE = 0.5;

const DrawingCanvas = () => {
  const canvasRef = useRef(null);
  const clearButtonRef = useRef(null);
  const [sess, setSess] = useState(null);
  const [ctx, setCtx] = useState(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [hasIntroText, setHasIntroText] = useState(true);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    console.log(ctx, "canvas", canvas);
    const rect = canvas.getBoundingClientRect();

    setCtx(ctx);

    ctx.lineWidth = 12;
    ctx.lineJoin = "round";
    ctx.font = "28px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#212121";
    ctx.strokeStyle = "#212121";
    // ctx.strokeStyle = '#000000'; // Black color
    // ctx.lineWidth = 2;
    // if (ctx && ctx.fillText) {
    // }

    

    const sess = new onnx.InferenceSession();
    const loadingModelPromise = sess.loadModel('./onnx_model.onnx');
    setSess(sess);

    loadingModelPromise.then(() => {
      canvas.addEventListener('mousedown', handleCanvasMouseDown);
      canvas.addEventListener('mousemove', handleCanvasMouseMove);
      document.body.addEventListener('mouseup', handleBodyMouseUp);
      document.body.addEventListener('mouseout', handleBodyMouseOut);
      clearButtonRef.current.addEventListener('mousedown', handleClearCanvas);
      canvas.addEventListener('touchstart', handleTouchStart);
      canvas.addEventListener('touchmove', handleTouchMove);
      canvas.addEventListener('touchend', handleTouchEnd);
      clearButtonRef.current.addEventListener('mousedown', handleClearCanvas);


      // ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.fillText('Draw a number here!', CANVAS_SIZE / 2, CANVAS_SIZE / 2);
    });
    // canvas.addEventListener("mousedown", handleCanvasMouseDown);
    // canvas.addEventListener("mousemove", handleCanvasMouseMove);
    // document.body.addEventListener("mouseup", handleBodyMouseUp);
    // document.body.addEventListener("mouseout", handleBodyMouseOut);
    // clearButtonRef.current.addEventListener("mousedown", handleClearCanvas);

    return () => {
      canvas.removeEventListener("mousedown", handleCanvasMouseDown);
      canvas.removeEventListener("mousemove", handleCanvasMouseMove);
      document.body.removeEventListener("mouseup", handleBodyMouseUp);
      document.body.removeEventListener("mouseout", handleBodyMouseOut);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      clearButtonRef.current.removeEventListener('mousedown', handleClearCanvas);
      // clearButtonRef.current.removeEventListener(
      //   "mousedown",
      //   handleClearCanvas
      // );
    };
  }, [hasIntroText, isDrawing, isMouseDown]);


  const handleTouchStart = (event) => {
    setIsMouseDown(true);

    if (hasIntroText) {
      clearCanvas();
      setHasIntroText(false);
    }
    const rect = event.target.getBoundingClientRect();
    const x = (event.touches[0].clientX - rect.left) / CANVAS_SCALE;
    const y = (event.touches[0].clientY - rect.top) / CANVAS_SCALE;
    // const x = event.touches[0].clientX / CANVAS_SCALE;
    // const y = event.touches[0].clientY / CANVAS_SCALE;
    
    setLastX(x + 0.001);
    setLastY(y + 0.001);
    setIsDrawing(true);
    // handleCanvasMouseMove(event);
  };

  const handleCanvasMouseDown = (event) => {
    setIsMouseDown(true);

    if (hasIntroText) {
      clearCanvas();
      setHasIntroText(false);
    }
    const x = event.offsetX / CANVAS_SCALE;
    const y = event.offsetY / CANVAS_SCALE;
    setLastX(x + 0.001);
    setLastY(y + 0.001);
    setIsDrawing(true);
    handleCanvasMouseMove(event);
  };

  


  const handleTouchMove = (event) => {
    event.preventDefault();
    if (!isDrawing) return;
    const rect = event.target.getBoundingClientRect();
    const x = (event.touches[0].clientX - rect.left) / CANVAS_SCALE;
    const y = (event.touches[0].clientY - rect.top) / CANVAS_SCALE;
    if (isMouseDown) {
      drawLine(lastX, lastY, x, y);
    }
    setLastX(x);
    setLastY(y);
    // ctx.lineTo(x, y);
    // ctx.stroke();
  };

  const handleCanvasMouseMove = (event) => {
    if (!isDrawing) return;
    const x = event.offsetX / CANVAS_SCALE;
    const y = event.offsetY / CANVAS_SCALE;
    if (isMouseDown) {
      drawLine(lastX, lastY, x, y);
    }
    setLastX(x);
    setLastY(y);
    // ctx.lineTo(x, y);
    // ctx.stroke();
  };

  

  const handleTouchEnd = () => {
    setIsDrawing(false);
    setIsMouseDown(false);
  };

  const handleBodyMouseUp = () => {
    setIsDrawing(false);
    setIsMouseDown(false);
  };

  const handleBodyMouseOut = (event) => {
    setIsDrawing(false);

    if (!event.relatedTarget || event.relatedTarget.nodeName === "HTML") {
      setIsMouseDown(false);
    }
  };

  const handleClearCanvas = () => {
    clearCanvas();
  };

  const clearCanvas = () => {
    if (ctx && ctx.clearRect) {
      ctx?.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      for (let i = 0; i < 10; i++) {
        const element = document.getElementById(`prediction-${i}`);
        if (element) {
          element.className = "prediction-col";
          element.children[0].children[0].style.height = "0";
        }
      }
    }
  };

  const drawLine = (fromX, fromY, toX, toY) => {
    console.log(fromX, fromY, toX, toY);
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.closePath();
    ctx.stroke();
    updatePredictions();
  };

  const updatePredictions = async () => {
    if (!sess) return;

    const imgData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    const input = new onnx.Tensor(new Float32Array(imgData.data), 'float32');

    const outputMap = await sess.run([input]);
    const outputTensor = outputMap.values().next().value;
    const predictions = outputTensor.data;
    const maxPrediction = Math.max(...predictions);
    console.log(maxPrediction, "maxPrediction");

    for (let i = 0; i < predictions.length; i++) {
      const element = document.getElementById(`prediction-${i}`);
      if (element) {
        element.children[0].children[0].style.height = `${predictions[i] * 100}%`;
        element.className =
          predictions[i] === maxPrediction ? 'prediction-col top-prediction' : 'prediction-col';
      }
    }
  };

   if (typeof window !== "undefined" && window.location && window.location) {
                const currentUrl = window.location;
                console.log(currentUrl, "jjhhjhhj");
            }

  return (
    <div>
   
      <div className="card elevation">
        <canvas
          ref={canvasRef}
          className="canvas elevation"
          id="canvas"
          width="280"
          height="280"
        ></canvas>

        <div ref={clearButtonRef} className="button" id="clear-button">
          CLEAR
        </div>

        <div className="predictions">
          <div className="prediction-col" id="prediction-0">
            <div className="prediction-bar-container">
              <div className="prediction-bar"></div>
            </div>
            <div className="prediction-number">0</div>
          </div>

          <div className="prediction-col" id="prediction-1">
            <div className="prediction-bar-container">
              <div className="prediction-bar"></div>
            </div>
            <div className="prediction-number">1</div>
          </div>

          <div className="prediction-col" id="prediction-2">
            <div className="prediction-bar-container">
              <div className="prediction-bar"></div>
            </div>
            <div className="prediction-number">2</div>
          </div>

          <div className="prediction-col" id="prediction-3">
            <div className="prediction-bar-container">
              <div className="prediction-bar"></div>
            </div>
            <div className="prediction-number">3</div>
          </div>

          <div className="prediction-col" id="prediction-4">
            <div className="prediction-bar-container">
              <div className="prediction-bar"></div>
            </div>
            <div className="prediction-number">4</div>
          </div>

          <div className="prediction-col" id="prediction-5">
            <div className="prediction-bar-container">
              <div className="prediction-bar"></div>
            </div>
            <div className="prediction-number">5</div>
          </div>

          <div className="prediction-col" id="prediction-6">
            <div className="prediction-bar-container">
              <div className="prediction-bar"></div>
            </div>
            <div className="prediction-number">6</div>
          </div>

          <div className="prediction-col" id="prediction-7">
            <div className="prediction-bar-container">
              <div className="prediction-bar"></div>
            </div>
            <div className="prediction-number">7</div>
          </div>

          <div className="prediction-col" id="prediction-8">
            <div className="prediction-bar-container">
              <div className="prediction-bar"></div>
            </div>
            <div className="prediction-number">8</div>
          </div>

          <div className="prediction-col" id="prediction-9">
            <div className="prediction-bar-container">
              <div className="prediction-bar"></div>
            </div>
            <div className="prediction-number">9</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrawingCanvas;
