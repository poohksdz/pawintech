import { FaFacebookF, FaTwitter, FaInstagram } from "react-icons/fa";
import { Link } from "react-router-dom";

const MiddleShowCase = () => {
  return (
    <div className="relative w-full h-[400px]">
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-slate-800/60 z-10"></div>

      {/* Content */}
      <div className="relative z-20 flex flex-col justify-center items-center h-full text-center text-white p-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">
          Welcome to Our Store
        </h2>
        <p className="text-lg md:text-xl text-white/90 mb-8">
          Find the best products here!
        </p>

        {/* Social Media Icons */}
        <div className="flex gap-6 mb-5">
          <Link
            to="https://www.facebook.com"
            className="text-white hover:text-blue-400 transition-colors"
          >
            <FaFacebookF size={30} />
          </Link>
          <Link
            to="https://www.twitter.com"
            className="text-white hover:text-sky-400 transition-colors"
          >
            <FaTwitter size={30} />
          </Link>
          <Link
            to="https://www.instagram.com"
            className="text-white hover:text-pink-500 transition-colors"
          >
            <FaInstagram size={30} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MiddleShowCase;
