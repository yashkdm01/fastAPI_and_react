import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import {
  DndContext,
  useDraggable,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
} from "@dnd-kit/core";
import api, { docService } from "../services/api";
import { NeoButton } from "../components/ui/NeoButton";
import { Upload, PenTool, Image as ImageIcon } from "lucide-react";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export const SignDocument = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [docUrl, setDocUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 160, height: 64 });
  const [sigFile, setSigFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showPad, setShowPad] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  useEffect(() => {
    const loadDoc = async () => {
      try {
        const docs = await docService.getAll();
        const found = docs.find((d) => d.id === parseInt(id));
        if (found && found.download_url) {
          setDocUrl(`${found.download_url}?t=${new Date().getTime()}`);
        } else {
          alert("Document not found.");
          navigate("/dashboard");
        }
      } catch (err) {
        console.error("Load Error", err);
      }
    };
    loadDoc();
  }, [id, navigate]);

  const handleDragEnd = (event) => {
    const { delta } = event;
    setPosition((prev) => ({
      x: prev.x + delta.x,
      y: prev.y + delta.y,
    }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSigFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const dataURLtoFile = (dataurl, filename) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){ u8arr[n] = bstr.charCodeAt(n); }
    return new File([u8arr], filename, {type:mime});
  };

  const handleSave = async () => {
    if (!sigFile) {
      alert("PLEASE PROVIDE A SIGNATURE FIRST!");
      return;
    }
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("document_id", id);
      formData.append("x_position", Math.round(position.x));
      formData.append("y_position", Math.round(position.y));
      formData.append("width", Math.round(size.width));
      formData.append("height", Math.round(size.height));
      formData.append("page_number", 1);
      formData.append("file", sigFile);

      await api.post("/signatures/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("SIGNATURE BURNED SUCCESSFULLY!");
      navigate("/dashboard");
    } catch (err) {
      console.error("Save Error:", err.response?.data);
      alert(`Failed: ${JSON.stringify(err.response?.data?.detail)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-dark-bg text-neo-black dark:text-neo-white flex flex-col items-center py-8 font-sans cursor-default">
      {showPad && (
        <SignaturePad 
          onCancel={() => setShowPad(false)}
          onSave={(dataUrl) => {
            const file = dataURLtoFile(dataUrl, "signature.png");
            setSigFile(file);
            setPreviewUrl(dataUrl);
            setShowPad(false);
          }}
        />
      )}

      <div className="fixed top-4 left-4 z-50 flex flex-col gap-4">
        <div className="bg-white dark:bg-dark-card p-4 border-4 border-black shadow-neo transform -rotate-1">
          <p className="text-[10px] font-black uppercase mb-2 tracking-tighter opacity-50">Method_01: Analog</p>
          <label className="flex items-center gap-2 cursor-pointer font-bold text-neo-blue hover:text-blue-700 transition-colors">
            <ImageIcon size={20} />
            <span className="uppercase text-sm">Upload Image</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
          </label>
        </div>

        <div className="bg-white dark:bg-dark-card p-4 border-4 border-black shadow-neo transform rotate-1">
          <p className="text-[10px] font-black uppercase mb-2 tracking-tighter opacity-50">Method_02: Digital</p>
          <button 
            onClick={() => setShowPad(true)}
            className="flex items-center gap-2 font-bold text-neo-green hover:text-green-700 transition-colors uppercase text-sm"
          >
            <PenTool size={20} /> Draw Signature
          </button>
        </div>
      </div>

      <div className="fixed top-4 right-4 z-50 flex gap-4">
        <NeoButton variant="secondary" onClick={() => navigate("/dashboard")}>CANCEL</NeoButton>
        <NeoButton variant="primary" onClick={handleSave} disabled={isProcessing}>
          {isProcessing ? "BURNING..." : "CONFIRM & BURN"}
        </NeoButton>
      </div>

      <h1 className="text-3xl font-black mb-6 uppercase tracking-[0.2em] italic underline decoration-neo-blue decoration-4 underline-offset-8">
        Place_Signature
      </h1>

      <div className="relative border-[6px] border-black dark:border-white shadow-neo bg-white min-h-[600px] min-w-[600px] overflow-auto mb-20 cursor-crosshair">
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          {previewUrl && (
            <DraggableSignature
              x={position.x}
              y={position.y}
              size={size}
              setSize={setSize}
              previewUrl={previewUrl}
            />
          )}

          {docUrl ? (
            <Document
              file={docUrl}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              onLoadError={(error) => console.error("PDF engine failed:", error)}
              loading={<div className="p-20 font-black text-2xl animate-pulse">INITIATING_STREAM...</div>}
            >
              {numPages && (
                <Page
                  pageNumber={1}
                  width={600}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="border-b-2 border-black"
                />
              )}
            </Document>
          ) : (
            <div className="p-20 font-black text-gray-400 uppercase italic">Awaiting_Data_Packet...</div>
          )}
        </DndContext>
      </div>
    </div>
  );
};

const DraggableSignature = ({ x, y, size, setSize, previewUrl }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: "signature-box" });
  const style = {
    position: "absolute",
    left: x,
    top: y,
    width: `${size.width}px`,
    height: `${size.height}px`,
    zIndex: 50,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group border-4 border-neo-blue bg-white/60 backdrop-blur-sm shadow-neo">
      <div {...listeners} {...attributes} className="w-full h-full cursor-move p-1 flex items-center justify-center">
        <img src={previewUrl} alt="Sig" className="max-h-full max-w-full object-contain pointer-events-none" />
      </div>
      <div 
        className="absolute -bottom-3 -right-3 w-6 h-6 bg-neo-blue cursor-se-resize border-4 border-black z-[60] hover:scale-110 transition-transform"
        onMouseDown={(e) => {
          e.stopPropagation(); 
          const startX = e.clientX;
          const startY = e.clientY;
          const startWidth = size.width;
          const startHeight = size.height;
          const onMouseMove = (moveEvent) => {
            setSize({
              width: Math.max(60, startWidth + (moveEvent.clientX - startX)),
              height: Math.max(40, startHeight + (moveEvent.clientY - startY))
            });
          };
          const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
          };
          document.addEventListener("mousemove", onMouseMove);
          document.addEventListener("mouseup", onMouseUp);
        }}
      />
    </div>
  );
};

const SignaturePad = ({ onSave, onCancel }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };
  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };
  const stopDrawing = () => setIsDrawing(false);
  const handleExport = () => {
    const dataUrl = canvasRef.current.toDataURL("image/png");
    onSave(dataUrl);
  };

  return (
    <div className="fixed inset-0 bg-neo-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white border-[6px] border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full transform -rotate-1">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-black uppercase italic tracking-tighter">Digital_Ink_Capture</h2>
            <div className="flex gap-1">
                <div className="w-3 h-3 bg-neo-red border-2 border-black" />
                <div className="w-3 h-3 bg-neo-yellow border-2 border-black" />
                <div className="w-3 h-3 bg-neo-green border-2 border-black" />
            </div>
        </div>
        <canvas
          ref={canvasRef}
          width={500}
          height={250}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="border-4 border-black w-full cursor-crosshair bg-gray-50 mb-8"
        />
        <div className="flex gap-6">
          <NeoButton variant="secondary" className="flex-1 py-4 text-lg" onClick={onCancel}>ABORT</NeoButton>
          <NeoButton variant="primary" className="flex-1 py-4 text-lg" onClick={handleExport}>INJECT_INK</NeoButton>
        </div>
      </div>
    </div>
  );
};