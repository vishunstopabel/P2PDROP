import { useRef, useState, useCallback } from 'react'
import Logo from './componets/logo'
import { FaFileImport } from "react-icons/fa"
import { useDropzone } from 'react-dropzone'

function App() {
    const [file, setFile] = useState(null)
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isPassword, setIsPassword] = useState(false)
    const onDrop = useCallback((acceptedFiles) => {
        setFile(acceptedFiles[0]) 
    }, [])
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false })
const establishConection=async()=>{
  console.log("hello")
      alert("establishing the connetion")
}
    return (
        <>
            <Logo />

            <div className='h-[50vh] w-full flex justify-center items-center'>
                {isLoading ? (
                    <div className="text-center text-gray-600 text-lg font-medium">
                        Loading...
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2 select-none cursor-default">
                            <h1 className="text-5xl font-bold text-black">
                                Send<span className="text-gray-500">File</span>
                            </h1>
                            <FaFileImport className="text-6xl text-black" />
                        </div>

                        {/* File Upload Section */}
                        {file ? (
                            <div className="w-full flex flex-col items-center gap-4">
                                <div className='w-full max-w-sm p-2 border-2 border-gray-700 rounded-sm bg-gray-100'>
                                    <p className='text-gray-800 text-center truncate'>
                                        {file.name}
                                    </p>
                                </div>

                                {!isPassword ? (
                                   <div className='flex flex-col gap-3 p-7 pl-40 pr-40 bg-white border border-gray-900 rounded-lg shadow-sm'>
                                   <label className="text-sm font-medium text-gray-900">Secret Password</label>
                                   <input
                                       type="password"
                                       placeholder='Enter the secret password for the receiver'
                                       value={password}
                                       onChange={(e) => setPassword(e.target.value)}
                                       className='p-2 border border-gray-900 rounded focus:outline-none focus:ring-2 focus:ring-gray-900 transition '
                                       
                                   />
                                   <div className="flex justify-between gap-2 mt-2">
                                       <button className="px-6 py-1 bg-black text-white rounded-lg hover:bg-gray-800 transition" onClick={establishConection}>
                                           Start Transfer
                                       </button>
                                       <button
                                           onClick={() =>(setFile(null), setPassword(null))}
                                           className="px-4 py-2 bg-white border border-gray-900 text-black rounded-lg hover:bg-gray-100 transition"
                                       >
                                           Cancel
                                       </button>
                                   </div>
                               </div>
                               
                               
                                ) : (
                                    <div className="text-gray-500">
                                        🔗 Fetching link data from backend...
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div
                                {...getRootProps()}
                                className={`flex flex-col items-center gap-2 p-4 pl-9 border-2 border-gray-900 text-gray-900 hover:text-white hover:bg-gray-900 transition bg-white rounded-lg cursor-pointer ${
                                    isDragActive ? 'bg-gray-200' : ''
                                }`}
                            >
                                <input {...getInputProps()} />
                                <span className='font-medium'>
                                    {isDragActive ? 'Drop the file here...' : 'Drop a file to get started'}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    )
}

export default App
