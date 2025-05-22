import React, { useState, useEffect } from 'react';
import popSound from '../../../../src/audio/b.mp3'; // Import the pop sound
import * as math from 'mathjs';

const Calculator = () => {
    const [input, setInput] = useState('');
    const [result, setResult] = useState('');

    const playPopSound = () => {
        const sound = new Audio(popSound);
        sound.play();
    };

    const handleClick = (value) => {
        playPopSound();
        setInput((prev) => prev + value);
        console.log("Button clicked:", value);
    };

    const handleClear = () => {
        playPopSound();
        setInput('');
        setResult('');
        console.log("Clear button clicked");
    };

    const handleBackspace = () => {
        playPopSound();
        setInput((prev) => prev.slice(0, -1));
        setResult('');
        console.log("Backspace clicked");
    };

    const handleCalculate = () => {
        playPopSound();
        try {
            const sanitizedInput = input.replace(/[^-+*/%().0-9]/g, '');
            const calculation = math.evaluate(sanitizedInput);
            setResult(calculation);
        } catch (error) {
            console.error("Calculation error:", error);
            setResult('Error');
        }
    };

    const handleKeyDown = (e) => {
        const allowedKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '-', '*', '/', '%', '.', '(', ')', '=', 'Enter', 'Backspace'];
        console.log("Key pressed:", e.key);

        if (allowedKeys.includes(e.key)) {
            if (e.key === 'Enter' || e.key === '=') {
                e.preventDefault();
                handleCalculate();
            } else if (e.key === 'Backspace') {
                e.preventDefault();
                handleBackspace();
            } else {
                e.preventDefault();
                setInput((prev) => prev + e.key);
            }
        } else {
            console.warn("Invalid key pressed:", e.key);
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    return (
        <div className="flex flex-col items-center z-50 justify-center w-[400px] h-auto mx-auto border border-gray-200 rounded-lg p-5 pb-20 shadow-md bg-gradient-to-b from-[#E6F4F1] to-[#A7D4C2]">
            <div className="mb-5 w-full text-right text-2xl h-[70px] overflow-hidden">
                <div className="text-[#146F5E] break-words font-mono">{input || '0'}</div>
                <div className="text-gray-900 text-xl font-bold">{result}</div>
            </div>

            <div className="grid grid-cols-4 gap-4">
                <button onClick={() => handleClick('(')} className="p-5 text-lg rounded-md bg-[#A7D4C2] text-[#146F5E] hover:bg-[#35AF87] hover:text-white">(</button>
                <button onClick={() => handleClick(')')} className="p-5 text-lg rounded-md bg-[#A7D4C2] text-[#146F5E] hover:bg-[#35AF87] hover:text-white">)</button>
                <button onClick={handleClear} className="p-5 text-lg rounded-md bg-[#FFC1C1] text-[#9A1C1C] hover:bg-[#FF8686]">C</button>
                <button onClick={handleBackspace} className="p-5 text-lg rounded-md bg-[#FFEBA1] text-[#946C1E] hover:bg-[#FFD966]">⌫</button>

                <button onClick={() => handleClick('7')} className="p-5 text-lg rounded-md bg-[#A7D4C2] text-[#146F5E] hover:bg-[#35AF87] hover:text-white">7</button>
                <button onClick={() => handleClick('8')} className="p-5 text-lg rounded-md bg-[#A7D4C2] text-[#146F5E] hover:bg-[#35AF87] hover:text-white">8</button>
                <button onClick={() => handleClick('9')} className="p-5 text-lg rounded-md bg-[#A7D4C2] text-[#146F5E] hover:bg-[#35AF87] hover:text-white">9</button>
                <button onClick={() => handleClick('/')} className="p-5 text-lg rounded-md bg-[#A7D4C2] text-[#146F5E] hover:bg-[#35AF87] hover:text-white">/</button>

                <button onClick={() => handleClick('4')} className="p-5 text-lg rounded-md bg-[#A7D4C2] text-[#146F5E] hover:bg-[#35AF87] hover:text-white">4</button>
                <button onClick={() => handleClick('5')} className="p-5 text-lg rounded-md bg-[#A7D4C2] text-[#146F5E] hover:bg-[#35AF87] hover:text-white">5</button>
                <button onClick={() => handleClick('6')} className="p-5 text-lg rounded-md bg-[#A7D4C2] text-[#146F5E] hover:bg-[#35AF87] hover:text-white">6</button>
                <button onClick={() => handleClick('*')} className="p-5 text-lg rounded-md bg-[#35AF87] text-white hover:bg-[#146F5E] hover:text-white">*</button>

                <button onClick={() => handleClick('1')} className="p-5 text-lg rounded-md bg-[#A7D4C2] text-[#146F5E] hover:bg-[#35AF87] hover:text-white">1</button>
                <button onClick={() => handleClick('2')} className="p-5 text-lg rounded-md bg-[#A7D4C2] text-[#146F5E] hover:bg-[#35AF87] hover:text-white">2</button>
                <button onClick={() => handleClick('3')} className="p-5 text-lg rounded-md bg-[#A7D4C2] text-[#146F5E] hover:bg-[#35AF87] hover:text-white">3</button>
                <button onClick={() => handleClick('-')} className="p-5 text-lg rounded-md bg-[#35AF87] text-white hover:bg-[#146F5E]">-</button>

                <button onClick={() => handleClick('0')} className="p-5 text-lg rounded-md bg-[#A7D4C2] text-[#146F5E] hover:bg-[#35AF87] hover:text-white">0</button>
                <button onClick={() => handleClick('.')} className="p-5 text-lg rounded-md bg-[#A7D4C2] text-[#146F5E] hover:bg-[#35AF87] hover:text-white">.</button>
                <button onClick={() => handleClick('%')} className="p-5 text-lg rounded-md bg-[#A7D4C2] text-[#146F5E] hover:bg-[#35AF87] hover:text-white">%</button>
                <button onClick={() => handleClick('+')} className="p-5 text-lg rounded-md bg-[#35AF87] text-white hover:bg-[#146F5E] hover:text-white">+</button>

                <button onClick={() => handleClick('Math.sqrt(')} className="col-span-2 p-5 text-lg rounded-md bg-[#A7D4C2] text-[#146F5E] hover:bg-[#35AF87] hover:text-white">√</button>
                <button onClick={handleCalculate} className="col-span-2 p-5 text-lg rounded-md bg-[#35AF87] text-white hover:bg-[#146F5E]">=</button>
            </div>
        </div>
    );
};

export default Calculator;
