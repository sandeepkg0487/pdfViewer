import { useEffect, useRef, useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import pdfFile from '/sample.pdf'
// import { pdfjs } from 'react-pdf';

// pdfjs.GlobalWorkerOptions.workerSrc = new URL(
//   'pdfjs-dist/build/pdf.worker.min.mjs',
//   import.meta.url
// ).toString();

// const file =
//   'https://api71.ilovepdf.com/v1/download/p0r89dlgvvxh2g2vyywj815lyd2r8A2744mhwljpz1lgs4rmqf74xy5jz0vrAtwgcqAcgpn771d3d7A0h9qr078m0433mymsvyv97f30838h9lz8blplpj9l1qsd0nnznkg6jqdjd6kA3030Ajj528Any0jj2n3r3wj79c7gwqjy3n1fxdwq';
// const file =
//   'https://api14.ilovepdf.com/v1/download/cz7Alpy1tllzsmd6jds2k4k9dm79A50l1ds0gr54ngs148ts09fr89lyhz0y7k6x09gtcb8sv3jcs9ycdvxjjyzcqdj3l02qwArf7qfjr30gzy9r460djdbkkAdyb6708w7vjt515yg01A17jslx1mkq34w4jfhp5pAkl2k4w63zAbvkcp91';
const file = pdfFile
function PdfViewer1() {
  const [loading, setLoading] = useState(false);
  const [numPages, setNumPages] = useState(0);
  const [pages, setPages] = useState([]);
  const containerRef = useRef(null);
  const [rotation, setRotation] = useState(0);

  const pdfViewer = async (file) => {
    const loadingTask = pdfjsLib.getDocument(file);
    setLoading(true);
    try {
      const pdf = await loadingTask.promise;
      const totalNumPages = pdf.numPages;
      setNumPages(totalNumPages);

      // Create an array of page render promises
      const pagePromises = [];
      for (let pageNum = 1; pageNum <= totalNumPages; pageNum++) {
        pagePromises.push(renderPage(pdf, pageNum));
      }
      // Wait for all pages to be rendered
      await Promise.all(pagePromises);
    } catch (error) {
      console.error('Error loading PDF:', error);
    }
    setLoading(false);
  };

  const renderPage = async (pdf, pageNum) => {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    context.save();
    context.translate(viewport.width / 2, viewport.height / 2);
    context.rotate((rotation * Math.PI) / 180);
    context.translate(-viewport.width / 2, -viewport.height / 2);
    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;
    context.restore();

    containerRef.current.appendChild(canvas);
  };

  const rotatePage = () => {
    setRotation((prevRotation) => (prevRotation + 90) % 360);
  };

  useEffect(() => {
    if (file) {
      pdfViewer(file);
    }
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <>
      <div>
        {loading && <p>Loading...</p>}
        <button onClick={rotatePage} style={{ marginBottom: '10px' }}>
          Rotate
        </button>
        <div
          ref={containerRef}
          style={{
            display: 'flex',
            gap: '2px',
            flexDirection: 'column', // Stack pages vertically
            alignItems: 'center', // Center canvases horizontally
            overflowY: 'auto', // Allow vertical scrolling if needed
            width: '100%', // Ensure container takes full width
          }}
        />
      </div>
    </>
  );
}
export default PdfViewer1;
