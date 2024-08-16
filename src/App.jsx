import { useEffect, useState } from 'react'
import PdfViewer from './PdfViewercustom'
import * as pdfjs from "pdfjs-dist";

import 'bootstrap-icons/font/bootstrap-icons.css'; // Ensure you import the Bootstrap Icons CSS
const largePdf = "https://api63.ilovepdf.com/v1/download/dhcxq96fb6h94vs37wmzl3433A5fky0tlj91A26k0hl864fscdnf6hxvg28s1c49xs6gbynhyr9n0qsAfyk0r4dfv7d0yflb314pq0141f3snj6j49h0xlqzy8bA4zwrbmtncyj0b279hqttpkntd03yvpmscy8p95v976Ahsvv7lpqzpw81	";
// const largePdf = "https://xtract-s3-local.s3.us-east-1.amazonaws.com/dummy_pdf/output%20-%2020230223.215.2222.31220020M.pdf.pdf";

function App() {
  const [loader, setLoader] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [pdf, setPdf] = useState(null);
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

  useEffect(() => {
		const loadDocument = async () => {
			const loadingTask = pdfjs.getDocument(largePdf);
			const loadedPdf = await loadingTask.promise;
			setPdf(loadedPdf);
			setNumPages(loadedPdf.numPages);
		};

		loadDocument();
	}, []);

  return (
    <>
    <PdfViewer
     loader={loader}
    setLoader={setLoader}
    currentPage={currentPage}
    setCurrentPage={setCurrentPage}
    numPages={numPages}
    setNumPages={setNumPages}
    pdf={pdf}
    setPdf={setPdf}
    />
        
    </>
  )
}

export default App
