// MRZ Frame for back ID card - narrow rectangular frame for 3-line MRZ section

const MRZFrame = () => {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {/* MRZ Rectangle border - centered, no blur overlay */}
      <div
        // GÜNCELLEME 1: Genişliği mobilde %95, masaüstünde %60 yaptık.
        className="relative border-4 border-white rounded-xl w-[95%]"
        style={{
          // GÜNCELLEME 2: Oranı 3/1'den 4.5/1'e çektik (Posta kutusu deliği gibi ince uzun)
          aspectRatio: "4.5/1",
          boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)", // Opsiyonel: Çerçeve dışını karartmak odaklanmayı artırır
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
