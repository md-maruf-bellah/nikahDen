// Single Page Button Component
export const PageButton = ({ index, table }) => (
  <button
    onClick={() => table.setPageIndex(index)}
    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
      table.getState().pagination.pageIndex === index
        ? "bg-red-500 text-white  "
        : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
    }`}
  >
    {index + 1}
  </button>
);

// Logic for dots (...) if pages are many
export const PaginationWithDots = ({ table }) => {
  const curr = table.getState().pagination.pageIndex;
  const last = table.getPageCount() - 1;

  // Logic to show: 1 ... 4 5 6 ... 20
  return (
    <>
      <PageButton index={0} table={table} />
      {curr > 2 && <span className="text-gray-300 px-1">...</span>}

      {/* Dynamic Range */}
      {[...Array(table.getPageCount())].map((_, i) => {
        if (i > 0 && i < last && i >= curr - 1 && i <= curr + 1) {
          return <PageButton key={i} index={i} table={table} />;
        }
        return null;
      })}

      {curr < last - 2 && <span className="text-gray-300 px-1">...</span>}
      <PageButton index={last} table={table} />
    </>
  );
};
