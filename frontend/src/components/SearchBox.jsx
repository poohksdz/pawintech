import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';

const SearchBox = () => {
  const navigate = useNavigate();
  const { keyword: urlKeyword } = useParams();

  // Initialize keyword state with urlKeyword or empty string (in case it's undefined)
  const [keyword, setKeyword] = useState(urlKeyword || '');

  const submitHandler = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      // Navigate to search route with the keyword
      navigate(`/search/${keyword.trim()}`);
    } else {
      // Navigate to the product page if the search term is empty
      navigate('/product');
    }
  };

  const { language } = useSelector((state) => state.language);

  // Define translation object
  const translations = {
    en: {
      searchProduct: 'Search Products...',
      search: 'Search',
    },
    thai: {
      searchProduct: 'ค้นหาสินค้า...',
      search: 'ค้นหา',
    },
  };

  const t = translations[language] || translations.en;

  return (
    <form onSubmit={submitHandler} className="relative flex items-center w-full max-w-md group">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
        <FaSearch className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
      </div>
      <input
        type="text"
        name="q"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder={t.searchProduct}
        className="w-full pl-10 pr-4 py-2.5 bg-slate-100/50 border border-slate-200 text-slate-800 text-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
      />
      <button
        type="submit"
        className="absolute inset-y-1 right-1 px-4 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      >
        {t.search}
      </button>
    </form>
  );
};

export default SearchBox;