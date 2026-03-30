import { Link } from "react-router-dom";

const Paginate = ({ pages, page, isAdmin = false, keyword = "" }) => {
  return (
    pages > 1 && (
      <nav className="flex justify-center mt-8">
        <ul className="inline-flex items-center -space-x-px">
          {[...Array(pages).keys()].map((x) => {
            const isActive = x + 1 === page;
            const toPath = !isAdmin
              ? keyword
                ? `/search/${keyword}/page/${x + 1}`
                : `/page/${x + 1}`
              : `/admin/productlist/${x + 1}`;

            return (
              <li key={x + 1}>
                <Link
                  to={toPath}
                  className={`px-4 py-2 border text-sm font-medium transition-colors ${
                    isActive
                      ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                      : "bg-white border-slate-300 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  } ${x === 0 ? "rounded-l-lg" : ""} ${x === pages - 1 ? "rounded-r-lg" : ""}`}
                >
                  {x + 1}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    )
  );
};

export default Paginate;
