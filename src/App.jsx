import { useEffect, useState } from 'react'
import PdfViewer from './PdfViewercustom'
import * as pdfjs from "pdfjs-dist";

import 'bootstrap-icons/font/bootstrap-icons.css'; // Ensure you import the Bootstrap Icons CSS
const largePdf =  'https://xtract-s3-local.s3.amazonaws.com/media/assets/sftp_files/36/2024-08-23/08-54-02/split_file/20230223.215.2222.31220013M.pdf?AWSAccessKeyId=AKIAZLO3CEUCADU6MMBT&Signature=SHgXN4wSlENOIaxrgC3SRcW62Pc%3D&Expires=1724407445'
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
