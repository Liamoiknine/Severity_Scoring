import React, { useState, useEffect } from 'react';

const Home = () => {
    const [showScore, setShowScore] = useState(false)
    return (
        <>
            <h1>Severity Score Calculator</h1>
            <p>Input genetic mutations of interest to calculate your severity score rated on a scale from 1-6.</p>

            <div id="sidebar">
                <input type="text" />
                <input type="text" />
                <button type="Submit">Calculate</button>
            </div>
            <div id="main">
                {showScore ? (
                    <h1>6</h1>

                ) : (
                    <h1>Please enter a mut.</h1>
                
                )}
            </div>
    


            <p id="disclaimer">This tool provides a preliminary assessment only. For clinical applications, please consult with a genetic specialist.</p>
        </>

    )
}

export default Home;