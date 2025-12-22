import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import FullSearchPanel from "./FullSearchPanel";

export default function GlobalSearchBar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleOpen = () => {
    // Если пользователь не на главной, перенаправим на главную, сохранив текущий путь в state,
    // но согласно ТЗ кнопка и панель одинаковые, поэтому просто открываем панель поверх любой страницы.
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      {/* Нижняя панель с кнопками */}
      <div className="fixed bottom-0 inset-x-0 z-[60] flex justify-center pb-3 pointer-events-none">
        <div className="max-w-3xl w-full px-4 flex gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={open ? handleClose : handleOpen}
            className={`flex-1 h-14 sm:h-16 rounded-full text-sm font-semibold border transition-colors shadow-[0_0_24px_rgba(16,185,129,0.7)] ${
              open
                ? "bg-slate-900 text-white border-emerald-400"
                : "bg-slate-100 text-slate-800 border-emerald-400 hover:bg-slate-200"
            }`}
          >
            {open ? "Hide Search!" : "Go Search!"}
          </button>
          {open && (
            <button
              type="button"
              onClick={() => {
                const panel = document.querySelector('[data-testid="search-btn"]');
                if (panel) {
                  panel.click();
                }
              }}
              className="flex-1 h-14 sm:h-16 rounded-full text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 shadow-md"
            >
              Show Matches
            </button>
          )}
        </div>
      </div>

      {/* Панель фильтров */}
      <FullSearchPanel
        isOpen={open}
        onClose={handleClose}
        onSearch={() => setOpen(false)}
      />
    </>
  );
}
