import { useState } from 'react'
import reactLogo from './assets/react.svg'
import PdfViewer1 from './PdfViewer'
import PdfViewer from './PdfViewercustom'
import viteLogo from '/vite.svg'
import 'bootstrap-icons/font/bootstrap-icons.css'; // Ensure you import the Bootstrap Icons CSS

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <PdfViewer/>
        
    </>
  )
}

export default App
