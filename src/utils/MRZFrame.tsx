// MRZ Frame for back ID card - narrow rectangular frame for 3-line MRZ section

const MRZFrame = () => {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {/* MRZ Rectangle border - centered, no blur overlay */}
      <div
        className="relative border-4 border-white rounded-xl"
        style={{
          width: "85%",
          aspectRatio: "3/1",
        }}
      >
        {/* Corner indicators */}
        {[
          {
            pos: "top-0 left-0",
            border: "border-t-4 border-l-4",
            radius: "rounded-tl-lg",
          },
          {
            pos: "top-0 right-0",
            border: "border-t-4 border-r-4",
            radius: "rounded-tr-lg",
          },
          {
            pos: "bottom-0 left-0",
            border: "border-b-4 border-l-4",
            radius: "rounded-bl-lg",
          },
          {
            pos: "bottom-0 right-0",
            border: "border-b-4 border-r-4",
            radius: "rounded-br-lg",
          },
        ].map((corner, idx) => (
          <div
            key={idx}
            className={`absolute ${corner.pos} w-8 h-8 ${corner.border} border-white ${corner.radius}`}
          />
        ))}
      </div>
    </div>
  );
};

export default MRZFrame;
