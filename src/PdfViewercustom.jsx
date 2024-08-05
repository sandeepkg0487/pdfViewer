import { useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import "pdfjs-dist/web/pdf_viewer.css";

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

  const containerRef = useRef(null);
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
  const renderPage = (page, pageNum, heightOfPage, widthOfPage) => {
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
        pageContainer.style.margin = "10px 0";
        pageContainer.style.display = "flex";
        pageContainer.style.height = `${heightOfPage}px`;
        pageContainer.style.width = `${widthOfPage}px`;
        pageContainer.style.justifyContent = "center";

        canvas.style.display = "block";

        pageContainer.appendChild(canvas);

        const grandParent = document.createElement("div");
        grandParent.style.height = `${heightOfPage}px`;
        grandParent.style.width = `${widthOfPage}px`;
        grandParent.style.display = `flex`;
        grandParent.style.justifyContent = "center";
        grandParent.style.alignItems = "center";
        grandParent.style.backgroundColor = "#140fac52";
        grandParent.style.marginBottom = "5px";

        grandParent.setAttribute("data-page-number", pageNum);

        grandParent.appendChild(pageContainer);

        if (containerRef.current && !pageRefs.current[pageNum - 1]) {
          pageRefs.current[pageNum - 1] = grandParent;
          containerRef.current.appendChild(grandParent);
          setCurrentLoadPage((prev) => ({
            start: 0,
            end: pageNum,
          }));
        }

        resolve({ success: true, pageNumber: pageNum, element: grandParent });
      } catch (error) {
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
      console.log(containerRef.current.firstChild);
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
      for (let pageNum = 1; pageNum <= 31; pageNum++) {
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

        if (parseInt(element) == parseInt(DomActivePage[30])) {
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
  }, DomActivePage);

  const checkWheterRemovePage = (currentPage) => {
    const index = DomActivePage.findIndex((element) => element === currentPage);
    console.log("indexindex", index);
    if (index === -1) {
      return null;
    }
    let nexToLoad = 0;
    let whereToRremove = null;
    if (currentPage >= 16) {
      if (index > parseInt(DomActivePage.length / 2)) {
        // remove from first and -unshift
        // add last element -push
        console.log("scroll in to down >>>>");
        nexToLoad = currentPage + 15;
        whereToRremove = "START";
      }
    }
    if (index < 14) {
      //pop
      // add to first
      nexToLoad = currentPage - 14;
      whereToRremove = "END";
      console.log("<<<pop add to first");
    }
    if (nexToLoad) {
      // setupIntersectionObserver();
      renderSinglePages(nexToLoad, whereToRremove);
    }
  };

  const setupIntersectionObserver = () => {
    const observer = new IntersectionObserver(
      (entries) => {
        let maxIntersectionRatio = 0;
        let visiblePageNumber = currentPage;

        entries.forEach((entry) => {
          const pageNumber = parseInt(
            entry.target.getAttribute("data-page-number"),
            10
          );
          const visibleArea =
            entry.intersectionRect.width * entry.intersectionRect.height;

          if (visibleArea > maxIntersectionRatio) {
            maxIntersectionRatio = visibleArea;
            visiblePageNumber = pageNumber;
          }
        });

        if (visiblePageNumber !== currentPage) {
          setCurrentPage(visiblePageNumber);
        }
      },
      { threshold: [0.25, 0.5, 0.75, 1] }
    );

    if (pageRefs.current.length > 0) {
      pageRefs.current.forEach((pageContainer) => {
        if (pageContainer) observer.observe(pageContainer);
      });
    }

    return () => {
      observer.disconnect();
    };
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
  const applyRotation = async(newRotation, newPageDetails, currentPage) => {
    const rotatedivOfParent = Array.from(
      containerRef.current.childNodes
    ).filter((item) => item.getAttribute("data-page-number") == currentPage);
   

    console.log(newPageDetails,"newPageDetails")
    
    rotatedivOfParent[0].firstChild.style.transform = `rotate(${newRotation}deg)`;
    rotatedivOfParent[0].style.width = `${newPageDetails[currentPage].width}px`;
    rotatedivOfParent[0].style.height = `${newPageDetails[currentPage].height}px`;
  };


  

  const rotatePage = (direction) => {
    const currentRotation = pageDetails[currentPage]?.rotation || 0;
    const newRotation = (currentRotation + direction * 90) % 360;

    setPageDetails((prev) => {
      const updatedPageDetails = prev ;
      const currentPageDetails = updatedPageDetails[currentPage] || {};

      updatedPageDetails[currentPage] = {
        width :currentPageDetails.height,
        height:currentPageDetails.width,
        rotation: newRotation,
      };

      return updatedPageDetails;
    });

    applyRotation(newRotation, pageDetails, currentPage);

  };
  console.log( "newRotation",  pageDetails);

  const knowThePossion = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      // console.log("top",rect.top);
      let top = Math.abs(rect.top);
      let pageHeight = 0;
      let heightHistory = [];
      let screenPage = null;
      for (let i = 1; i < numPages; i++) {
        pageHeight += parseFloat(pageDetails[i].height);
        // console.log( top);
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
      // console.log('heightHistory:',heightHistory[0],"current page",screenPage);
    }
  };

  return (
    <div style={{ maxHeight: "100vh" }}>
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
        <button onClick={knowThePossion}> know the possi</button>

        <div style={{ color: "white" }}>
          Page {currentPage} of {numPages}
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;
