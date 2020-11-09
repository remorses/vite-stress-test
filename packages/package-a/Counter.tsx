import React from "react";
const { useState } = React

const Counter = () => {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>Counter</p>
      <button
        onClick={() => {
          setCount((c) => c + 1);
        }}
      >
        {count} clicks
      </button>
    </div>
  );
};


export default Counter;
