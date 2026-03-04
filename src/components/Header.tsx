

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-10">
      {/* Main Logo - At the top of the page */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 text-center">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-4xl font-bold text-white font-sans">Lofinity</h1>
            <span className="text-[10px] md:text-xs font-medium text-white/60 bg-white/10 px-1.5 py-0.5 rounded">BETA</span>
          </div>
          <p className="text-xs md:text-sm text-white/70 mt-1 font-light">Beats for the Infinite Mind</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
