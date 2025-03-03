import React from 'react';
import { FiSend } from 'react-icons/fi'; // Modern minimal icon

function Logo() {
    return (
        <div className="flex items-center gap-1 text-white p-2 rounded-lg select-none cursor-default">
            <FiSend className="text-3xl " color='black'/>
            <h1 className="text-2xl font-bold text-black">
                P2P<span className="text-gray-500">Drop</span>
            </h1>
        </div>
    );
}

export default Logo;
