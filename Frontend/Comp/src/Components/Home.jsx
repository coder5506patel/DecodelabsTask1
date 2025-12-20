import React, { useState } from 'react';
import copy from 'copy-to-clipboard';
import Editor from '@monaco-editor/react';
import { Code, Clipboard, Check, AlertTriangle, Download, View } from "lucide-react";
import PreviewModal from './PreviewModal';
import { FRAMEWORK_OPTIONS } from '../utils/constants';
import { generateComponentCode } from '../services/aiService';
import { downloadFile } from '../utils/fileUtils';

const Home = () => {
    const [framework, setFramework] = useState(null);
    const [description, setDescription] = useState('');
    const [generatedCode, setGeneratedCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isCopied, setIsCopied] = useState(false);
    const [isDownloaded, setIsDownloaded] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const generateComponent = async () => {
        if (!description || !framework) {
            setError("Please select a framework and provide a description.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedCode('');

        try {
            const code = await generateComponentCode(framework.value, description);
            setGeneratedCode(code);
        } catch (err) {
            setError(err.message || "An unexpected error occurred. Please check your API key and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (copy(generatedCode)) {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2500);
        }
    };

    const handleDownload = () => {
        if (!generatedCode || !framework) return;
        downloadFile(generatedCode, `component.${framework.extension}`);
        setIsDownloaded(true);
        setTimeout(() => setIsDownloaded(false), 2500);
    };

    return (
        <>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-10 px-6 lg:px-16 py-5' style={{ height: 'calc(100vh - 20px)' }}>
                {/* Left Panel: Input Form */}
                <div className="w-full py-6 rounded-xl bg-[var(--color-base-200)] p-5 self-start overflow-y-auto">
                    <h3 className='text-[25px] font-semibold sp-text'>AI Component Generator</h3>
                    <p className='text-gray-400 mt-2 text-[16px]'>Describe your component and let AI code it for you.</p>

                    <label htmlFor="framework-select" className='text-[15px] font-[700] mt-4 block'>
                        Framework
                    </label>
                    <select
                        id="framework-select"
                        value={framework?.value || ""}
                        onChange={(e) => {
                            const selectedOption = FRAMEWORK_OPTIONS.find(opt => opt.value === e.target.value) || null;
                            setFramework(selectedOption);
                        }}
                        className="w-full mt-2 p-3 bg-[var(--color-base-300)] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                    >
                        <option value="" disabled>Select a framework...</option>
                        {FRAMEWORK_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>

                    <label htmlFor="description-textarea" className='text-[15px] font-[700] mt-4 block'>
                        Component Description
                    </label>
                    <textarea
                        id="description-textarea"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={10}
                        className="w-full mt-2 p-3 bg-[var(--color-base-300)] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="E.g., A responsive product card with an image, title, price, and an 'Add to Cart' button."
                    />

                    <button
                        onClick={generateComponent}
                        disabled={isLoading}
                        className="mt-4 w-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white py-3 px-4 rounded-lg hover:from-fuchsia-600 hover:to-cyan-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold"
                    >
                        {isLoading ? 'Generating...' : 'Generate Component'}
                    </button>
                    {error && <p className="text-red-500 mt-3 text-sm">{error}</p>}
                </div>

                {/* Right Panel: Code Display */}
                <div className="w-full py-6 rounded-xl bg-[var(--color-base-200)] p-5 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4 flex-shrink-0">
                        <h3 className='text-[20px] font-semibold sp-text'>Generated Code</h3>
                        {generatedCode && (
                            <div className="flex gap-2">
                                <button onClick={() => setIsPreviewOpen(true)} className="flex items-center gap-2 text-sm bg-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-600 transition-colors">
                                    <View size={16} /> Preview
                                </button>
                                <button onClick={handleCopy} className="flex items-center gap-2 text-sm bg-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-600 transition-colors">
                                    {isCopied ? <><Check size={16} className="text-green-400" /> Copied!</> : <><Clipboard size={16} /> Copy</>}
                                </button>
                                <button onClick={handleDownload} className="flex items-center gap-2 text-sm bg-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-600 transition-colors">
                                    {isDownloaded ? <><Check size={16} className="text-green-400" /> Downloaded!</> : <><Download size={16} /> Download</>}
                                </button>
                            </div>
                        )}
                    </div>
                    <div className='w-full border border-dashed border-gray-700 flex-grow bg-[var(--color-base-300)] rounded-lg overflow-hidden min-h-0'>
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <Code size={100} />
                                <p className="mt-4">AI is thinking...</p>
                            </div>
                        ) : generatedCode ? (
                            <Editor
                                height="100%"
                                theme="vs-dark"
                                language={framework?.extension === 'jsx' ? 'javascript' : (framework?.extension || 'html')}
                                value={generatedCode}
                                options={{ readOnly: true, minimap: { enabled: false } }}
                            />
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center h-full text-red-500 text-center p-4">
                                <AlertTriangle size={80} />
                                <p className="mt-4 font-semibold">Generation Failed</p>
                                <p className="text-sm text-gray-400 mt-1">{error}</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                <Code size={150} />
                                <p className="mt-4">Your code will appear here</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <PreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                code={generatedCode}
                framework={framework}
            />
        </>
    );
};

export default Home;