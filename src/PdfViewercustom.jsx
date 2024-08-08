import * as pdfjs from "pdfjs-dist";
import "pdfjs-dist/web/pdf_viewer.css";
import { useEffect, useRef, useState } from "react";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const largePdf =
  "https://xtract-s3-local.s3.us-east-1.amazonaws.com/dummy_pdf/output%20-%2020230223.215.2222.31220020M.pdf.pdf";

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
  const pageRefs = useRef([]);

  const pushTosetDomActivePage = (item) => {
    setDomActivePage((prevStack) => [...prevStack, item]);
  };

  const popFromsetDomActivePage = () => {
    setDomActivePage((prevStack) => prevStack.slice(0, -1));
  };

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
      console.log(zoom);
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

      // Translate and rotate the context
      // context.translate(canvas.width / 2, canvas.height / 2);
      // context.rotate((rotation * Math.PI) / 180);
      // context.translate(-canvas.width / 2, -canvas.height / 2);

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      // Wait for the page to render
      await page.render(renderContext).promise;
      const containerElement = document.getElementById(pageNum);
      if (containerElement) {
        containerElement.appendChild(canvas);
      } else {
        console.warn(`Element with id ${pageNum} not found`);
      }
      return { success: true, pageNumber: pageNum, element: containerElement };
    } catch (error) {
      console.error("Error rendering page:", error);
      throw error;
    }
  };

  const renderPage = (page, pageNum) => {
    return new Promise(async (resolve, reject) => {
      console.log("rendering...............", pageNum);
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

        if (containerRef.current && !pageRefs?.current[pageNum - 1]) {
          pageRefs.current[pageNum - 1] = grandParent;
          containerRef.current.appendChild(grandParent);
          setCurrentLoadPage((prev) => ({
            start: 0,
            end: pageNum,
          }));
        }

        resolve({ success: true, pageNumber: pageNum, element: grandParent });
      } catch (error) {
        console.log(error);
        reject(error);
      }
    });
  };

  const appendChildElement = (element, pageNum, wherToAppend) => {
    if (
      containerRef.current &&
      !Array.from(containerRef.current.childNodes).some(
        (element) => element.getAttribute("data-page-number") == pageNum
      )
    ) {
      if (wherToAppend === "START") {
        pageRefs.current[pageNum] = element;
        containerRef.current.insertBefore(
          element,
          containerRef.current.firstChild
        );
      } else if (wherToAppend === "END") {
        pageRefs.current[pageNum] = element;
        containerRef.current.appendChild(element);
      }
    }
  };

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
      containerRef.current.style.height = `${heightOfAllPage}px`;
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

  useEffect(() => {
    containerRef.current.style.top = `${topofTheParant}px`;
  }, [topofTheParant]);

  useEffect(() => {
    console.log("-------------------------");

    checkWheterRemovePage(currentPage);
  }, [currentPage]);
  const renderSinglePages = async (nexToLoad, whereToRremove) => {
    if (!pdf) return;

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

        setTopofTheParant((prev) => prev + pageDetails[element].height);
        if (parseInt(element) == parseInt(DomActivePage[0])) {
          containerRef.current.removeChild(containerRef.current.firstChild);
          // popFromsetDomActivePage()
          // pushTosetDomActivePage(response.pageNumber)
        }
      }
      if (whereToRremove === "END") {
        appendChildElement(response.element, response.pageNumber, "START");

        const element =
          containerRef.current.lastChild.getAttribute("data-page-number");
        setTopofTheParant((prev) => prev - pageDetails[nexToLoad].height);

        if (parseInt(element) == parseInt(DomActivePage[29])) {
          containerRef.current.removeChild(containerRef.current.lastChild);
          setDomActivePage((prev) => {
            const updatedArray = [response.pageNumber, ...prev];
            updatedArray.pop();
            return updatedArray;
          });
        }
      }
    }
  };
  useEffect(() => {
    console.log(DomActivePage, "DomActivePage");
  }, [DomActivePage]);

  const checkWheterRemovePage = (currentPage) => {
    const index = DomActivePage.findIndex((element) => element === currentPage);
    console.log("**************UVAIS*****************", index);
    if (index === -1) {
      return null;
    }
    let nexToLoad = null;
    let whereToRremove = null;
    if (index > 14) {
      if (index > parseInt(DomActivePage.length / 2) - 1) {
        // remove from first and -unshift
        // add last element -push
        console.log("scroll in to down >>>>");
        nexToLoad = currentPage + 15;
        whereToRremove = "START";
      }
    } else if (index < 14) {
      //pop
      // add to first
      nexToLoad = currentPage - 14;
      whereToRremove = "END";
      console.log(nexToLoad, "currentPage", index);
      console.log("<<<pop add to first");
    }
    if (
      nexToLoad &&
      nexToLoad > 0 &&
      !DomActivePage.some((index) => {
        index === nexToLoad;
      })
    ) {
      // setupIntersectionObserver();
      console.log(nexToLoad, " nexToLoad");
      console.log(DomActivePage, DomActivePage);
      renderSinglePages(nexToLoad, whereToRremove);
    }
  };

  const setupIntersectionObserver = () => {
    // const observer = new IntersectionObserver(
    //   (entries) => {
    //     let maxIntersectionRatio = 0;
    //     let visiblePageNumber = currentPage;
    //     entries.forEach((entry) => {
    //       const pageNumber = parseInt(
    //         entry.target.getAttribute("data-page-number"),
    //         10
    //       );
    //       const visibleArea =
    //         entry.intersectionRect.width * entry.intersectionRect.height;
    //       if (visibleArea > maxIntersectionRatio) {
    //         maxIntersectionRatio = visibleArea;
    //         visiblePageNumber = pageNumber;
    //       }
    //     });
    //     if (visiblePageNumber !== currentPage) {
    //       setCurrentPage(visiblePageNumber);
    //     }
    //   },
    //   { threshold: [0.25, 0.5, 0.75, 1] }
    // );
    // if (pageRefs.current.length > 0) {
    //   pageRefs.current.forEach((pageContainer) => {
    //     if (pageContainer) observer.observe(pageContainer);
    //   });
    // }
    // return () => {
    //   observer.disconnect();
    // };
  };

  // function getVerticalOverflow(element) {
  //   const overflow = element.scrollHeight - element.clientHeight;
  //   return overflow > 0 ? overflow : 0;
  // }

  // function getHorizontalOverflow(element) {
  //   const overflow = element.scrollWidth - element.clientWidth;
  //   return overflow > 0 ? overflow : 0;
  // }

  // function checkOverflowByPageNumber(pageNumber) {
  //   const element = document.querySelector(
  //     `[data-page-number="${pageNumber}"]`
  //   );
  //   if (element) {
  //     return getVerticalOverflow(element);
  //   }
  //   return 0;
  // }
  const applyRotation = async (
    newRotation,
    prevWidth,
    prevHeight,
    currentPage
  ) => {
    // const rotatedivOfParent = Array.from(
    //   containerRef.current.childNodes
    // ).filter((item) => item.getAttribute("data-page-number") == currentPage);
    // console.log(prevWidth, prevHeight, "newPageDetails w*h");
    // rotatedivOfParent[0].firstChild.style.transform = `rotate(${newRotation}deg)`;
    // rotatedivOfParent[0].style.width = `${prevHeight }px`;
    // rotatedivOfParent[0].style.height = `${prevWidth }px`;
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
    const canvasParentDiv = document.getElementById(currentPage);
    canvasParentDiv.querySelector("canvas").remove();

    createpageAndAppendToDiv(currentPage, newRotation);
  };

  const knowThePossion = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      console.log("top 1", rect.top);
      let top = Math.abs(rect.top);
      let pageHeight = 0;
      let heightHistory = [];
      let screenPage = null;
      for (let i = 1; i < numPages; i++) {
        pageHeight += parseFloat(pageDetails[i].height);
        console.log("top", top);
        heightHistory.push(pageDetails[i].height);
        if (heightHistory.length > 15) {
          heightHistory.shift();
        }
        if (top < pageHeight) {
          screenPage = {
            page: pageDetails[i],
            pagenumber: i,
          };
          break;
        }
      }
      heightHistory;
      console.log("heightHistory:", heightHistory, "current page", screenPage);

      if (DomActivePage.findIndex(screenPage.pagenumber)) {
      }

      // check the  current page is active on dom active state
      //  calculate the top and which page to load the 1st from top
    }
  };

  const removeFirst30Children = () => {
    if (containerRef && containerRef.current) {
      const container = containerRef.current;
      for (let i = 0; i < 30; i++) {
        if (container.firstChild) {
          container.removeChild(container.firstChild);
        } else {
          break;
        }
      }
    }
  };
  const goToPage = (pageNumber = 125) => {
    if (pageNumber < 1 || pageNumber > pageDetails.length) {
      console.error("Invalid page number");
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
    if(pageNumber>16)
      {
        setTopofTheParant(heightHistory[0]);
      }
    // remove all dom element
    removeFirst30Children();
    pageRefs.current = [];
    const scrollDiv = document.getElementById("scrollDiv");
    scrollDiv.scrollTo({
      top: parseInt(heightHistory[14]),
      behavior: "smooth",
    });
    console.log("pageNumber", pageNumber);
    const LoadPages = async (pageNumber, pdf) => {
      for (
        let pageNum = pageNumber - 15 > 0 ? pageNumber - 15 : 0;
        pageNum <= pageNumber + 15;
        pageNum++
      ) {
        console.log("pageNum", pageNum);
        const page = await pdf.getPage(pageNum);
        renderPage(
          page,
          pageNum,
          page._pageInfo.view[3],
          page._pageInfo.view[2]
        );
      }
    };
    LoadPages(pageNumber, pdf);
  };

  const handleScroll = (e) => {
    if (scrollTrackerRef.current) {
      const rect = scrollTrackerRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const offsetTop = Math.abs(containerRect.top - rect.top);
      let cumulativeHeight = 0;
      for (let i = 1; i <= numPages; i++) {
        cumulativeHeight += pageDetails[i].height;
        if (offsetTop < cumulativeHeight - topofTheParant) {
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
    console.log(zoomTemp);
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
      onScroll={handleScroll}
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
