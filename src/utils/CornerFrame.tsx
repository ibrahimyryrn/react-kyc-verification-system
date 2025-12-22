//Camera corner frame

const CornerFrame = () => (
  <div className="absolute inset-0 pointer-events-none">
    {[
      {
        pos: "top-0 left-0",
        border: "border-t-4 border-l-4",
        radius: "rounded-tl-3xl",
      },
      {
        pos: "top-0 right-0",
        border: "border-t-4 border-r-4",
        radius: "rounded-tr-3xl",
      },
      {
        pos: "bottom-0 left-0",
        border: "border-b-4 border-l-4",
        radius: "rounded-bl-3xl",
      },
      {
        pos: "bottom-0 right-0",
        border: "border-b-4 border-r-4",
        radius: "rounded-br-3xl",
      },
    ].map((corner, idx) => (
      <div
        key={idx}
        className={`absolute ${corner.pos} w-12 h-12 ${corner.border} border-white ${corner.radius}`}
      />
    ))}
  </div>
);

export default CornerFrame;
