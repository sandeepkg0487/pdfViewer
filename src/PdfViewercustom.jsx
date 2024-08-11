import * as pdfjs from "pdfjs-dist";
import "pdfjs-dist/web/pdf_viewer.css";
import { useEffect, useRef, useState } from "react";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// const largePdf =  "https://api50.ilovepdf.com/v1/download/lrz1d90jr8wrq7c1j5w3ncyc8fh65v0mshwn1ldrwkcjz8dg4z3nxdkvtsdsn5nnwlrt5sd64wwndmbhvmsvg4jffzb320jbb2tvgxxmvdfdlxcg2Axg1q7khm5kjv15c7cyzp46s4nmAz3b1vt9lcj9g322rv8fbtpfnfb5x1rzg57wkq9q";
 const largePdf ="https://xtract-s3-local.s3.us-east-1.amazonaws.com/dummy_pdf/output%20-%2020230223.215.2222.31220020M.pdf.pdf";

const PdfViewer = () => {
  const [numPages, setNumPages] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageDetails, setPageDetails] = useState([]);
  const [currentLoadPage, setCurrentLoadPage] = useState({});
  const [DomActivePage, setDomActivePage] = useState([]);
  const [topofTheParant, setTopofTheParant] = useState(0);
  const [zoom, SetZoom] = useState(1);

  const containerRef = useRef(null);
  const scrollTrackerRef = useRef(null);



  useEffect(() => {
    const loadDocument = async () => {
      const loadingTask = pdfjs.getDocument(largePdf);
      const loadedPdf = await loadingTask.promise;
      setPdf(loadedPdf);
      setNumPages(loadedPdf.numPages);
    };

    loadDocument();
  }, []);



  const createpageAndAppendToDiv = async (
    pageNum,
    createpageAndAppendToDiv = 0
  ) => {
    try {
      const page = await pdf.getPage(parseInt(pageNum));
      const viewport = page.getViewport({
        scale: zoom,
        rotation: createpageAndAppendToDiv,
      });
      const canvas = document.createElement("canvas");
      const rotation = 0;

      if (
        rotation === 90 ||
        rotation === 270 ||
        rotation === -90 ||
        rotation === -270
      ) {
        canvas.width = viewport.height;
        canvas.height = viewport.width;
      } else {
        canvas.width = viewport.width;
        canvas.height = viewport.height;
      }

      const context = canvas.getContext("2d");

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      // Wait for the page to render
      await page.render(renderContext).promise;
      const containerElement = document.getElementById(String(pageNum));
      if (containerElement) {
        containerElement.appendChild(canvas);
      } else {
      }
      return { success: true, pageNumber: pageNum, element: containerElement };
    } catch (error) {
      throw error;
    }
  };

  //creating canvas elemetnt and return canvas
  const renderPage = (page, pageNum) => {
    return new Promise(async (resolve, reject) => {
      try {
        const viewport = page.getViewport({ scale: 1 });
        const canvas = document.createElement("canvas");
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        const context = canvas.getContext("2d");

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        // Wait for the page to render
        page.render(renderContext).promise;

        const pageContainer = document.createElement("div");
        pageContainer.style.position = "relative";
        // pageContainer.style.margin = "10px 0";
        pageContainer.style.display = "flex";
        // pageContainer.style.height = `${heightOfPage * zoom}px`;
        // pageContainer.style.width = `${widthOfPage * zoom}px`;
        pageContainer.style.justifyContent = "center";
        pageContainer.id = pageNum;

        canvas.style.display = "block";

        pageContainer.appendChild(canvas);

        const grandParent = document.createElement("div");
        // grandParent.style.height = `${heightOfPage * zoom}px`;
        // grandParent.style.width = `${widthOfPage * zoom}px`;
        grandParent.style.display = `flex`;
        grandParent.style.justifyContent = "center";
        grandParent.style.alignItems = "center";
        grandParent.style.backgroundColor = "#140fac52";
        // grandParent.style.marginBottom = "5px";

        grandParent.setAttribute("data-page-number", pageNum);

        grandParent.appendChild(pageContainer);


        resolve({ success: true, pageNumber: pageNum, element: grandParent });
      } catch (error) {
        reject(error);
      }
    });
  };


  // dom append canvas 
  const appendChildElement = (element, pageNum, wherToAppend) => {
    console.log("checkpoint 2")
    if (containerRef.current && !document.getElementById(String(pageNum))) {
    console.log("checkpoint 2.1")
      try{

        if (wherToAppend === "START") {
          console.log("checkpoint 3" , containerRef.current.firstChild)
          containerRef.current.insertBefore(
            element,
            containerRef.current.firstChild
          );
        } else if (wherToAppend === "END") {
          console.log("checkpoint 4" , containerRef.current.firstChild)
          containerRef.current.appendChild(element);
        }
      }catch(err){
        console.log("checkpoint error:",err)
      }
    console.log("checkpoint 5")

    }
    console.log("checkpoint 6")

  };

  // useEffect for inital load calculate the width and load 30 element 1st
  useEffect(() => {
    const renderAllPages = async () => {
      if (!pdf) return;
      let heightOfAllPage = 0;
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        let pageDetails = {
          width: page._pageInfo.view[2],
          height: page._pageInfo.view[3],
        };
        setPageDetails((prev) => {
          const updatedRotations = [...prev];
          updatedRotations[pageNum] = {
            ...updatedRotations[pageNum],
            ...pageDetails,
          };
          return updatedRotations;
        });
        heightOfAllPage = page._pageInfo.view[3] + heightOfAllPage;
      }
      let validResponses = [];
      for (let pageNum = 1; pageNum <= 30; pageNum++) {
        const page = await pdf.getPage(pageNum);
        heightOfAllPage = page._pageInfo.view[3] + heightOfAllPage;
        let response = await renderPage(
          page,
          pageNum,
          page._pageInfo.view[3],
          page._pageInfo.view[2]
        );

        if (response?.success === true) {
          validResponses.push(response.pageNumber);
          appendChildElement(response.element, response.pageNumber, "END");
        }
      }
      setDomActivePage(validResponses);
      containerRef.current.style.height = `${heightOfAllPage}px`;

      setupIntersectionObserver();
    };

    renderAllPages();
  }, [pdf, numPages]);

 

  
  
// use Effec for current page change 

  useEffect(() => {

    let delayfunction = setTimeout(() => {
      const isPresent = document.getElementById(String(currentPage));
      if (!isPresent) {
        console.log('draging ......')
               goToPage(currentPage);
      } else {
        checkWheterRemovePage(currentPage);
      }
    }, 300);
    return () => {
      clearTimeout(delayfunction);
     
    };
  }, [currentPage]);



  // give a page number and  where to append function
 
  const renderSinglePages = async (nexToLoad, whereToRremove) => {
    if (!pdf) return;
    if (!document.getElementById(String(nexToLoad))) {
      const page = await pdf.getPage(nexToLoad);
      const response = await renderPage(
        page,
        nexToLoad,
        page._pageInfo.view[3],
        page._pageInfo.view[2]
      );

      if (response?.success === true) {
        if (whereToRremove === "START") {
          appendChildElement(response.element, response.pageNumber, "END");
          setDomActivePage((prev) => {
            const updatedArray = [...prev];
            const firstElement = updatedArray.shift();
            updatedArray.push(response.pageNumber);
            return updatedArray;
          });
          const element =
            containerRef.current.firstChild.getAttribute("data-page-number");

          if (parseInt(element) == parseInt(DomActivePage[0])) {
            
            const prevTopPosition = containerRef.current.offsetTop;
            const topPosition =parseInt(pageDetails[parseInt(element)].height) +prevTopPosition

            containerRef.current.style.top = `${topPosition}px`;
           
            containerRef.current.removeChild(containerRef.current.firstChild);
          }
        }
        if (whereToRremove === "END") {
          console.log("checkpoint 1");
          
          const element =
            containerRef.current.lastChild.getAttribute("data-page-number");

            if (parseInt(element) == parseInt(DomActivePage[29])) {
              const prevTopPosition = containerRef.current.offsetTop;
              const topPosition =prevTopPosition - parseInt(pageDetails[parseInt(element)].height) 
              
              containerRef.current.style.top = `${topPosition}px`;
              containerRef.current.removeChild(containerRef.current.lastChild);
              setDomActivePage((prev) => {
                const updatedArray = [response.pageNumber, ...prev];
                updatedArray.pop();
                return updatedArray;
              });
              appendChildElement(response.element, response.pageNumber, "START");
          }
        }
      }
    }
  };



  useEffect(() => {
    console.log(DomActivePage, "DomActivePage");
  }, [DomActivePage]);



  const checkWheterRemovePage = (currentPage) => {

    const index = DomActivePage.findIndex((element) => element === currentPage);
    if (index === -1) {
      return null;
    }
    let nexToLoad = null;
    let whereToRremove = null;
    if (index > 14) {
      if (index > parseInt(DomActivePage.length / 2) - 1) {
        // remove from first and -unshift
        // add last element -push
        nexToLoad = currentPage + 15;

        whereToRremove = "START";
      }
    } else if (index < 13 && currentPage > 13) {
      //pop
      // add to first
      nexToLoad = currentPage - 13;
      whereToRremove = "END";
    }
    if (
      nexToLoad &&
      nexToLoad > 0 &&
      !document.getElementById(String(nexToLoad))
    ) {
      console.log("<<<pop add to first", nexToLoad);
      // setupIntersectionObserver();
      renderSinglePages(nexToLoad, whereToRremove);
    }
  };

 
  const rotatePage = (direction) => {
    const currentRotation = pageDetails[currentPage]?.rotation || 0;
    const prevWidth = pageDetails[currentPage]?.width * zoom;
    const prevHeight = pageDetails[currentPage]?.height * zoom;

    const newRotation = (currentRotation + direction * 90) % 360;
    const pageDetailsTemp = pageDetails;
    pageDetailsTemp[currentPage] = {
      width: pageDetailsTemp[currentPage].height,
      height: pageDetailsTemp[currentPage].width,
      rotation: newRotation,
    };

    setPageDetails(pageDetailsTemp);
    const canvasParentDiv = document.getElementById(String(currentPage));
    canvasParentDiv.querySelector("canvas").remove();

    createpageAndAppendToDiv(currentPage, newRotation);
  };



  const removeAllChildren = () => {
    if (containerRef && containerRef.current) {
      const container = containerRef.current;
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    }
  };


  const goToPage = (pageNumber = 125) => {
    try{

    
    if (pageNumber < 1 || pageNumber > pageDetails.length) {
      return;
    }

    let pageHeight = 0;
    const heightHistory = [];
    const maxHistoryLength = 16;

    for (let i = 1; i <= pageNumber; i++) {
      const currentPageHeight = parseFloat(pageDetails[i].height * zoom);
      pageHeight += currentPageHeight;

      if (heightHistory.length >= maxHistoryLength) {
        heightHistory.shift();
      }
      heightHistory.push(pageHeight);
    }
    if (pageNumber > 16) {
      

      containerRef.current.style.top = `${parseInt(heightHistory[0])}px`;
      // setTopofTheParant(heightHistory[0]);
    }
    // remove all dom element
    removeAllChildren();
    const scrollDiv = document.getElementById("scrollDiv");
    scrollDiv.scrollTo({
      top: parseInt(heightHistory[14]),
      behavior: "smooth",
    });

    const LoadPages = async (pageNumber, pdf) => {
      console.log('0101010011111')
      let fillSetActivePage = [];
      for (
        let pageNum = pageNumber - 14 > 0 ? pageNumber - 14 : 0;
        pageNum <= pageNumber + 15;
        pageNum++
      ) {
        if (!document.getElementById(String(pageNum))) {
          const page = await pdf.getPage(pageNum);
          const response = await renderPage(
            page,
            pageNum,
            page._pageInfo.view[3],
            page._pageInfo.view[2]
          );
          if (response?.success === true) {
            console.log('chsshshshshsh');
            
            fillSetActivePage.push(pageNum);
          appendChildElement(response.element, response.pageNumber, "END");
        }
        }
      }
      console.log('fillSetActivePage',fillSetActivePage)
      setDomActivePage(fillSetActivePage);
    };
    LoadPages(pageNumber, pdf);
  }catch(err){
    console.log(err)
  }

  };

  const handleScroll = (e) => {
    if (scrollTrackerRef.current) {
      const rect = scrollTrackerRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const offsetTop = Math.abs(containerRect.top - rect.top);
      let cumulativeHeight = 0;
      for (let i = 1; i <= numPages; i++) {
        cumulativeHeight += pageDetails[i].height;
        if (offsetTop < cumulativeHeight) {
          setCurrentPage(i);
          break;
        }
      }
    }
  };

  const handleScrollTemp = (e) => {
    if (scrollTrackerRef.current) {
     const scrollPosition = e.target.scrollTop;
      const offsetTop = Math.abs(scrollPosition  + 242);
      let cumulativeHeight = 0;
      for (let i = 1; i <= numPages; i++) {
        cumulativeHeight += pageDetails[i].height;
        if (offsetTop < cumulativeHeight ) {
          setCurrentPage(i);
          break;
        }
      }
    }
  };
  
  const resetAllDomWidth = (zommPercentage) => {
    // Access the div and change the width and height of the div according to the zoom

    if (containerRef.current) {
      const elements = containerRef.current.childNodes;
      const canvases = containerRef.current.querySelectorAll("canvas");

      canvases.forEach((canvas) => {
        canvas.remove();
      });
      elements.forEach(async (element) => {
        const getPageNumber = parseInt(
          element.getAttribute("data-page-number")
        );
        const rotationValues = [90, 270, -90, -270];
        const rotationStatus = rotationValues.some(
          (rotation) => rotation === pageDetails[getPageNumber]?.rotation
        );

        const newWidth = parseInt(
          pageDetails[getPageNumber]?.width * zommPercentage
        );
        const newHeight = parseInt(
          pageDetails[getPageNumber]?.height * zommPercentage
        );

        // element.style.width =`${newWidth}px`;
        // element.style.height = `${newHeight}px`;

        // element.style.border = "2px solid blue";
        const firstChild = element.querySelector("div");

        const pageNum = firstChild.getAttribute("id");

        await createpageAndAppendToDiv(pageNum, pageDetails[pageNum]?.rotation);

        if (firstChild) {
          // firstChild.style.width = `${newWidth}px`;
          // firstChild.style.height = `${newHeight}px`;
        }
      });
    }
  };

  const handleZoomIn = () => {
    const zoomTemp = zoom + 0.1 > 2 ? zoom : zoom + 0.1;

    if (zoom + 0.1 < 2) {
      SetZoom(zoomTemp);
      // reset all the dom element width need to manage
      resetAllDomWidth(zoomTemp);
    }
  };
  const handleZoomOut = () => {
    const zoomTemp = zoom - 0.1 < 0.2 ? zoom : zoom - 0.1;
    if (zoom + 0.1 > 0.2) {
      SetZoom(zoomTemp);
      // reset all the dom element width need to manage
      resetAllDomWidth(zoomTemp);
    }
  };
  const [inputValue, setInputValue] = useState("");
  const handleChange = (event) => {
    setInputValue(event.target.value);
  };
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const newPageNumber = Number(inputValue);
      if (!isNaN(newPageNumber)) {
        goToPage(newPageNumber);
      }
    }
  };

  return (
    <div
      onScroll={handleScrollTemp}
      id="scrollDiv"
      style={{ maxHeight: "100vh", overflow: "scroll" }}
    >
      <div
        ref={scrollTrackerRef}
        style={{
          position: "absolute",
          top: 242,
          height: "1px",
          width: "100%",
          zIndex: -1,
          backgroundColor: "black",
        }}
      ></div>

      <div
        ref={containerRef}
        style={{
          width: "100vw",
          overflowY: "scroll",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          height: "100%",
        }}
      >
        {numPages ? null : <p>Loading document...</p>}
      </div>

      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#000",
          padding: "10px",
          textAlign: "center",
          gap: "2px",
        }}
      >
        <button onClick={() => rotatePage(-1)}>Rotate Left</button>
        <button onClick={() => rotatePage(1)}>Rotate Right</button>
        <button onClick={() => goToPage(100)}> know the possi</button>
        <button onClick={() => handleZoomIn()}>Zoomin</button>
        <input
          type="number"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter a number"
          en
        />

        <button
          onClick={() => {
            handleZoomOut();
          }}
        >
          ZoomOut
        </button>

        <div style={{ color: "white" }}>
          Page {currentPage} of {numPages}
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;
