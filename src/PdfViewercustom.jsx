import * as pdfjs from "pdfjs-dist";
import "pdfjs-dist/web/pdf_viewer.css";
import { useCallback } from "react";
import { useEffect, useRef, useState } from "react";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

// const largePdf = "https://api97.ilovepdf.com/v1/download/yv4Avpzwpstkn208tchlnAchqtxxssr10377b0jrbrh6AlxrAcly4zxwf8dps7vbgdc7lpAh8cdxj8jrwl93bnjt3gfnt507rn8hvh41vfp82x6xcnAd1x9smp6cvyx5jrdsbsbf9ksyx8dynhbxt07vw972wnkAmd0tfwrb59q7l3vbA2f1";
const largePdf = "https://xtract-s3-local.s3.us-east-1.amazonaws.com/dummy_pdf/output%20-%2020230223.215.2222.31220020M.pdf.pdf";

const PdfViewer = () => {
	const [numPages, setNumPages] = useState(null);
	const [pdf, setPdf] = useState(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageDetails, setPageDetails] = useState([]);
	const [currentLoadPage, setCurrentLoadPage] = useState({});
	const [DomActivePage, setDomActivePage] = useState([]);
	const [topofTheParant, setTopofTheParant] = useState(0);
	const [zoom, SetZoom] = useState(1);
	const [heightOfAllPage, setHeightOfAllPage] = useState(0);
	const [heightOfAllPageTemp, setHeightOfAllPageTemp] = useState(0);

	useEffect(() => {
		// Initialize all tooltips on this component
		const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
		const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
		  return new bootstrap.Tooltip(tooltipTriggerEl);
		});
	  }, []);
	const containerRef = useRef(null);
	const scrollTrackerRef = useRef(null);

	const [ruler, setRuler] = useState({});

	useEffect(() => {
		const loadDocument = async () => {
			const loadingTask = pdfjs.getDocument(largePdf);
			const loadedPdf = await loadingTask.promise;
			setPdf(loadedPdf);
			setNumPages(loadedPdf.numPages);
		};

		loadDocument();
	}, []);

	const createpageAndAppendToDiv = async (pageNum, createpageAndAppendToDiv = 0) => {
		try {
			const page = await pdf.getPage(parseInt(pageNum));
			const viewport = page.getViewport({
				scale: zoom,
				rotation: createpageAndAppendToDiv,
			});
			const canvas = document.createElement("canvas");
			const rotation = 0;

			if (rotation === 90 || rotation === 270 || rotation === -90 || rotation === -270) {
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
			}
			return { success: true, pageNumber: pageNum, element: canvas };
		} catch (error) {
			console.log("hiiiiiii");
		}
	};

	//creating canvas elemetnt and return canvas
	const renderPage = (page, pageNum) => {
		return new Promise(async (resolve, reject) => {
			try {
				const element = await createpageAndAppendToDiv(pageNum, pageDetails[pageNum]?.rotation || 0);
				const canvas = element.element;
				const pageContainer = document.createElement("div");
				pageContainer.style.position = "relative";
				pageContainer.style.display = "flex";
				pageContainer.style.justifyContent = "center";
				pageContainer.id = pageNum;

				canvas.style.display = "block";

				pageContainer.appendChild(canvas);

				const grandParent = document.createElement("div");
				grandParent.style.display = `flex`;
				grandParent.style.justifyContent = "center";
				grandParent.style.alignItems = "center";
				grandParent.style.backgroundColor = "#140fac52";

				grandParent.setAttribute("data-page-number", pageNum);

				grandParent.appendChild(pageContainer);

				resolve({
					success: true,
					pageNumber: pageNum,
					element: grandParent,
				});
			} catch (error) {
				reject(error);
			}
		});
	};

	// dom append canvas
	const appendChildElement = (element, pageNum, wherToAppend) => {
		if (containerRef.current && !document.getElementById(String(pageNum))) {
			try {
				if (wherToAppend === "START") {
					containerRef.current.insertBefore(element, containerRef.current.firstChild);
				} else if (wherToAppend === "END") {
					if (ruler?.page == pageNum) {
						
						const rulerDiv = createAbsoluteDiv(ruler.position *( zoom/ruler.zoom));
						element.firstChild.appendChild(rulerDiv);
						containerRef.current.appendChild(element);
					} else {
						containerRef.current.appendChild(element);
					}
				}
			} catch (err) {
				console.log("checkpoint error:", err);
			}
		}
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
			for (let pageNum = 1; pageNum <= Math.min(30, numPages); pageNum++) {
				const page = await pdf.getPage(pageNum);

				let response = await renderPage(page, pageNum, page._pageInfo.view[3], page._pageInfo.view[2]);

				if (response?.success === true) {
					validResponses.push(response.pageNumber);
					appendChildElement(response.element, response.pageNumber, "END");
				}
			}
			setDomActivePage(validResponses);
			containerRef.current.style.height = `${heightOfAllPage * zoom}px`;
			setHeightOfAllPage(heightOfAllPage);
			setHeightOfAllPageTemp(heightOfAllPage);
		};

		renderAllPages();
	}, [pdf, numPages]);

	// use Effec for current page change

	useEffect(() => {
		let delayfunction = setTimeout(() => {
			const isPresent = document.getElementById(String(currentPage));
			if (!isPresent) {
				goToPage(currentPage);
			} else {
				checkWheterRemovePage(currentPage);
			}
		}, 500);
		return () => {
			clearTimeout(delayfunction);
		};
	}, [currentPage]);

	// give a page number and  where to append function

	const renderSinglePages = async (nexToLoad, whereToRremove) => {
		if (!pdf) return;
		if (!document.getElementById(String(nexToLoad))) {
			const page = await pdf.getPage(nexToLoad);
			const response = await renderPage(page, nexToLoad, page._pageInfo.view[3], page._pageInfo.view[2]);

			if (response?.success === true) {
				if (whereToRremove === "START") {
					appendChildElement(response.element, response.pageNumber, "END");
					setDomActivePage((prev) => {
						const updatedArray = [...prev];
						updatedArray.shift();
						updatedArray.push(response.pageNumber);
						return updatedArray;
					});
					const element = containerRef.current.firstChild?.getAttribute("data-page-number");

					if (parseInt(element) == parseInt(DomActivePage[0])) {
						const prevTopPosition = containerRef.current.offsetTop;
						const topPosition = parseInt(pageDetails[parseInt(element)].height) * zoom + prevTopPosition;
						containerRef.current.style.height = `${heightOfAllPage * zoom - topPosition}px`;

						if (response.pageNumber < 16) {
							console.log("setting top 0...");
							containerRef.current.style.height = `${heightOfAllPage * zoom}px`;
							containerRef.current.style.top = `${0}px`;
						}
						// else if(pageNumber > numPages-16){
						//   containerRef.current.style.height = `${heightOfAllPage-topPosition}px`;
						//   containerRef.current.style.top = `${topPosition}px`;
						// }
						else {
							containerRef.current.style.height = `${heightOfAllPage * zoom - topPosition}px`;
							containerRef.current.style.top = `${topPosition}px`;
						}
						containerRef.current.removeChild(containerRef.current.firstChild);
					}
				}
				if (whereToRremove === "END") {
					const element = containerRef.current.lastChild?.getAttribute("data-page-number");

					if (parseInt(element) == parseInt(DomActivePage[29])) {
						const prevTopPosition = containerRef.current.offsetTop;
						const topPosition = prevTopPosition - parseInt(pageDetails[parseInt(element)].height * zoom);
						console.log(topPosition, "topPosition");
						document.getElementById("container1").offsetHeight;
						containerRef.current.style.height = `${heightOfAllPage * zoom + topPosition}px`;
						console.log("document.getElementById('container1').offsetHeight", document.getElementById("container1").offsetHeight);

						if (response.pageNumber == 1 || currentPage < 15) {
							console.log("setting top 0...");
							containerRef.current.style.height = `${heightOfAllPage * zoom}px`;
							containerRef.current.style.top = `${0}px`;
						} else {
							containerRef.current.style.height = `${heightOfAllPage * zoom - topPosition}px`;
							containerRef.current.style.top = `${topPosition}px`;
						}
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
		if (index > 14 && currentPage < numPages - 15) {
			if (index > parseInt(DomActivePage.length / 2) - 1) {
				// remove from first and -unshift
				// add last element -push
				nexToLoad = currentPage + 15;

				whereToRremove = "START";
				console.log("nexToLoad", nexToLoad, "index", index);
			}
		} else if (index < 13 && currentPage > 13 && currentPage < numPages - 15) {
			//pop
			// add to first
			nexToLoad = currentPage - 13;
			whereToRremove = "END";
			console.log("nexToLoad", nexToLoad, "index", index);
		}
		if (nexToLoad && nexToLoad > 0 && !document.getElementById(String(nexToLoad))) {
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
		const tempHeight = pageDetails[currentPage].height;
		const tempWidth = pageDetails[currentPage].width;
		const tempcalculation = tempHeight - tempWidth;
		setHeightOfAllPage(heightOfAllPage + tempcalculation);
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

	const goToPage = async (pageNumber = 125) => {
		const LoadPages = async (pageNumber, pdf) => {
			let fillSetActivePage = [];
			let startPage = 0;
			let endPage = 0;

			if (pageNumber < Math.min(16, numPages)) {
				// Load the first 30 pages
				startPage = 1;
				endPage = Math.min(30, numPages);
			} else if (pageNumber > numPages - 16) {
				// Load the last 30 pages
				startPage = Math.max(1, numPages - 30);
				console.log("Load the last 30 pages");
				endPage = numPages;
			} else {
				// Load pages around the current page
				startPage = pageNumber - 14;
				endPage = pageNumber + 15;
			}
			console.log("startPage:", startPage, " endPage:", endPage);
			for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
				if (!document.getElementById(String(pageNum))) {
					const page = await pdf.getPage(pageNum);
					const response = await renderPage(page, pageNum, page._pageInfo.view[3], page._pageInfo.view[2]);
					if (response?.success === true) {
						appendChildElement(response.element, response.pageNumber, "END");
						fillSetActivePage.push(pageNum);
					}
				}
			}
			setDomActivePage(fillSetActivePage);
		};

		try {
			let scrollPosss = 0;
			if (pageNumber < 1 || pageNumber > pageDetails.length) {
				return;
			}

			let pageHeight = 0;
			const heightHistory = [];
			const maxHistoryLength = 30;
			let temp = 0;
			const scrollDiv = document.getElementById("scrollDiv");
			let behavior = "smooth";
			if (performScale) {
				behavior = "auto";
				setPreformScale(false);
			}

			for (let i = 1; i <= pageNumber; i++) {
				const currentPageHeight = parseFloat(pageDetails[i].height * zoom);

				pageHeight += currentPageHeight;

				if (i == pageNumber - 1) {
					scrollPosss = pageHeight;
				}
				if (heightHistory.length >= maxHistoryLength) {
					heightHistory.shift();
				}
				heightHistory.push(pageHeight);
			}

			if (numPages < 31) {
				scrollDiv.scrollTo({
					top: parseInt(scrollPosss),
					behavior,
					// behavior: "smooth",
				});
				return;
			}

			if (pageNumber < 16 || numPages < 31) {
				console.log("setting top 0...");
				containerRef.current.style.height = `${heightOfAllPage * zoom}px`;
				containerRef.current.style.top = `${0}px`;
			} else if (pageNumber > numPages - 16) {
				console.log("pageNumber", pageNumber, "numPages", numPages);
				for (let i = numPages; i >= numPages - 30; i--) {
					temp += parseFloat(pageDetails[i].height * zoom);
				}

				console.log(numPages, "numPages");
				containerRef.current.style.height = `${temp}px`;
				containerRef.current.style.top = `${heightOfAllPage * zoom - temp}px`;
			} else {
				console.log("setting top  some ...");
				containerRef.current.style.height = `${heightOfAllPage * zoom - parseInt(heightHistory[14])}px`;
				containerRef.current.style.top = `${parseInt(heightHistory[14])}px`;
			}

			removeAllChildren();
			// remove all dom element

			const fillSetActivePage = await LoadPages(pageNumber, pdf);

			scrollDiv.scrollTo({
				top: parseInt(scrollPosss),
				behavior,
				// behavior: "smooth",
			});

			if (pageNumber > 16) {
				// setTopofTheParant(heightHistory[0]);
			}
		} catch (err) {
			console.log(err);
		}
	};

	const handleScroll = (e) => {
		if (scrollTrackerRef.current) {
			const rect = scrollTrackerRef.current.getBoundingClientRect();
			const containerRect = containerRef.current.getBoundingClientRect();
			const offsetTop = Math.abs(containerRect.top - rect.top);
			let cumulativeHeight = 0;
			const containerTop = document.getElementById("scrollDiv").offsetTop;
			for (let i = 1; i <= numPages; i++) {
				cumulativeHeight += pageDetails[i].height;
				if (offsetTop < cumulativeHeight - containerTop) {
					setCurrentPage(i);
					break;
				}
			}
		}
	};

	const handleScrollTemp = (e) => {
		e.preventDefault();
		if (scrollTrackerRef.current) {
			const scrollPosition = e.target.scrollTop;
			const offsetTop = Math.abs(scrollPosition + 242 * zoom);
			let cumulativeHeight = 0;
			for (let i = 1; i <= numPages; i++) {
				cumulativeHeight += pageDetails[i].height * zoom;
				if (offsetTop < cumulativeHeight) {
					setCurrentPage(i);
					break;
				}
			}
		}
	};

	const resetAllDomWidth = (zommPercentage) => {
		// Access the div and change the width and height of the div according to the zoom
		try {
			// setHeightOfAllPage(heightOfAllPageTemp*zoom)

			if (containerRef.current) {
				const elements = containerRef.current.childNodes;
				const canvases = containerRef.current.querySelectorAll("canvas");

				canvases.forEach((canvas) => {
					canvas.remove();
				});
				let cumulativeHeight = 0;

				for (let i = 1; i < prevPage; i++) {
					cumulativeHeight += pageDetails[i].height * zoom;
				}
				containerRef.current.style.height = `${heightOfAllPage * zoom - cumulativeHeight}px`;
				containerRef.current.style.top = `${cumulativeHeight}px`;

				elements.forEach(async (element) => {
					const firstChild = element.querySelector("div");

					const pageNum = firstChild?.getAttribute("id");

					await createpageAndAppendToDiv(pageNum, pageDetails[pageNum]?.rotation);
				});
			}
		} catch (error) {
			console.log("error::::", error);
		}
	};
	const [prevPage, setPrevPage] = useState(0);
	const [performScale, setPreformScale] = useState(false);
	useEffect(() => {
		resetAllDomWidth(zoom);
		goToPage(prevPage);
	}, [zoom, prevPage]);

	const handleZoomIn = () => {
		const zoomTemp = zoom + 0.1 > 2 ? zoom : zoom + 0.1;
		setPreformScale(true);
		if (zoom + 0.1 < 2) {
			setPrevPage(currentPage);
			SetZoom(zoomTemp);
		}
	};
	const handleZoomOut = () => {
		const zoomTemp = zoom - 0.1 < 0.2 ? zoom : zoom - 0.1;
		if (zoom + 0.1 > 0.2) {
			// setPrevPage(currentPage);
			setPrevPage(currentPage);
			SetZoom(zoomTemp);
			setPreformScale(true);

			console.log("zoom", zoomTemp);
		}
	};
	function useDebounce(func, delay) {
		const timeoutRef = useRef(null);

		return useCallback(
			(...args) => {
				if (timeoutRef.current) {
					clearTimeout(timeoutRef.current);
				}
				timeoutRef.current = setTimeout(() => {
					func(...args);
				}, delay);
			},
			[func, delay]
		);
	}

	const debouncedHandleZoomOut = useDebounce(handleZoomOut, 500);
	const debouncedHandleZoomIn = useDebounce(handleZoomIn, 500);

	const [inputValue, setInputValue] = useState("");
	useEffect(() => {
		setInputValue(currentPage);
	}, [currentPage]);
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
	function createAbsoluteDiv(bottom = 0) {
		const newDiv = document.createElement("div");

		newDiv.style.position = "absolute";
		newDiv.style.bottom = `${-bottom}px`;
		newDiv.style.backgroundColor = "red";
		newDiv.style.width = "100%";
		newDiv.style.height = "5px";
		newDiv.style.zIndex = "1";
		newDiv.id = "rulerDiv";

		return newDiv;
	}

	const handleDoubleClick = (event) => {
		const parentElement = document.getElementById("scrollDiv");
		const ScrollDivFromDom = document.getElementById("rulerDiv");

		if (ScrollDivFromDom) {
			ScrollDivFromDom.remove();
		}
		if (parentElement) {
			const scrollTopValue = parentElement.scrollTop;
			const clickYViewport = event.clientY;
			let cumulativeHeight = 0;
			let clickedPage = 0;
			for (let i = 1; i <= numPages; i++) {
				cumulativeHeight += pageDetails[i].height * zoom;
				if (cumulativeHeight > scrollTopValue + clickYViewport) {
					clickedPage = i;
					console.log("clicked on the div ", i, scrollTopValue + clickYViewport - cumulativeHeight);
					break;
				}
			}
			const bottom = scrollTopValue + clickYViewport - cumulativeHeight;
			const ruler = createAbsoluteDiv(bottom);
			setRuler({ page: clickedPage, position: bottom, zoom: zoom });
			document.getElementById(String(clickedPage)).appendChild(ruler);
			console.log(`The vertical scroll position is: ${scrollTopValue}px ${clickYViewport}`);
		}
	};

	useEffect(() => {
		const handleKeyDown = (event) => {
			if (event.altKey && event.keyCode === 71) {
				if (ruler?.page) {
					goToPage(ruler?.page);
				} else {
					console.log("Element not found");
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [ruler]);

	return (
		<>
			<div className="px-3" style={{ backgroundColor: "#1ba2a8" }}>
				<div
					className="d-flex gap-3"
					style={{
						// position: "fixed",
						bottom: 0,
						left: 0,
						right: 0,
						// background: "#000",
						padding: "7px",
						textAlign: "center",
						gap: "2px",
						maxHeight: "10vh",
					}}>
					<div className="d-flex gap-1">
						<div>
							<i onClick={() => rotatePage(-1)} class="bi bi-arrow-counterclockwise" style={{ color: "white" }} data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Rotate Left"></i>
						</div>
						<div>
							<i onClick={() => rotatePage(1)} class="bi bi-arrow-clockwise" style={{ color: "white" }} data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Rotate Right"></i>
						</div>
					</div>
					<div className="d-flex gap-1">
						<div>
							<i  onClick={()=>goToPage( 1 )} class="bi bi-caret-up" style={{ color: "white" }} data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="First Page"></i>
						</div>
						<div>
							<i  onClick={()=>goToPage(currentPage-1 >= 0 ? currentPage-1 :1 )}class="bi bi-chevron-up" style={{ color: "white" }} data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Previous Page"></i>
						</div>
					</div>

					<div style={{ color: "white " }} className="d-flex gap-2">
						<input
							type="number"
							value={inputValue}
							onChange={handleChange}
							onKeyDown={handleKeyDown}
							placeholder="Enter a number"
							className="border rounded  no-arrows px-2"
							style={{
								width: "70px",
							}}
						/>
						/ {numPages}
					</div>

					<div className="d-flex gap-1">
						<div>
							<i class="bi bi-chevron-down  " onClick={()=>goToPage( currentPage+1 < numPages ? currentPage+1 : numPages)} style={{ color: "white" ,cursor: "pointer" }} data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Next Page"></i>
						</div>
						<div>
							<i class="bi bi-caret-down" onClick={()=>goToPage(numPages)} style={{ color: "white" }} data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Last Page" ></i>
						</div>
					</div>

					<div>
						<i onClick={() => debouncedHandleZoomIn()} class="bi bi-zoom-in" style={{ color: "white" }} data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Zoom In "></i>
					</div>
					<div>
						<i
							onClick={() => {
								debouncedHandleZoomOut();
							}}
							class="bi bi-zoom-out"
							style={{ color: "white" }} data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Zoom Out"></i>
					</div>
				</div>

				<div
					style={{
						display: "flex",
						justifyContent: "center",
					}}>
					<div
						onScroll={handleScrollTemp}
						onDoubleClick={handleDoubleClick}
						id="scrollDiv"
						style={{
							maxHeight: "93vh",
							// maxWidth: "95vw",
							backgroundColor: "white",
							display: "flex",
							justifyContent: "center",
							overflow: "scroll",
						}}>
						<div
							ref={scrollTrackerRef}
							style={{
								position: "absolute",
								top: 242 * zoom,
								height: "1px",
								width: "100%",
								zIndex: -1,
								backgroundColor: "black",
							}}></div>

						<div
							ref={containerRef}
							id="container1"
							style={{
								width: "100vw",
								overflowY: "scroll",
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								position: "relative",
								height: "100%",
							}}>
							{numPages ? null : <p>Loading document...</p>}
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default PdfViewer;
