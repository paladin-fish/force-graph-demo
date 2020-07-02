import React, { useEffect, useRef } from 'react';
import './App.css';
// import Custom3DGraph from './Custom3DGraph'
import Custom2DGraph from './Custom2DGraph'
function App() {
  const graphEle = useRef(null)
  useEffect(() => {
    console.log('graphEle=-', graphEle)
  }, [])
  return (
    <div className="App">
      <div ref={graphEle}></div>
      <div style={{display:'flex', flexDirection: 'row', fontFamily:"Font-Awesome-Solid,Font-Awesome-Regular,Font-Awesome-Brands"}}>
        <div>
          {/* <Custom3DGraph /> */}
        </div>
        <div>
          <Custom2DGraph />
        </div>
      </div>
    </div>
   
  );
}

export default App;
