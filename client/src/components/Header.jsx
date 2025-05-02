import React, { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import { GiHamburgerMenu } from "react-icons/gi";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "/src/assets/logo.png";

const Header = () => {
  const path = useLocation().pathname;
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(sessionStorage.getItem("isLoggedIn") === "true");
  const [activeSection, setActiveSection] = useState("");

  const controlNavbar = () => {
    const currentScrollY = window.scrollY;
    setIsVisible(currentScrollY < lastScrollY || currentScrollY < 100);
    setLastScrollY(currentScrollY);
  };

  useEffect(() => {
    window.addEventListener("scroll", controlNavbar);

    // Update active section based on scroll position
    const handleScroll = () => {
      const aboutUsSection = document.getElementById("about-us");
      if (aboutUsSection && window.scrollY + window.innerHeight > aboutUsSection.offsetTop) {
        setActiveSection("about-us");
      } else {
        setActiveSection("");
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", controlNavbar);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY]);

  useEffect(() => {
    const updateLoginState = () => {
      const status = sessionStorage.getItem("isLoggedIn") === "true";
      setIsLoggedIn(status);
    };

    window.addEventListener("loginStateChange", updateLoginState);

    return () => {
      window.removeEventListener("loginStateChange", updateLoginState);
    };
  }, []);

  const handleAnalyzerClick = () => {
    if (isLoggedIn) {
      navigate("/analyze");  // Navigate to /analyze if logged in
    } else {
      navigate("/login");    // Navigate to /login if not logged in
    }
  };

  const handleLoginLogout = () => {
    if (isLoggedIn) {
      sessionStorage.removeItem("isLoggedIn");
      window.dispatchEvent(new Event("loginStateChange"));
      setIsLoggedIn(false);
      navigate("/");
    } else {
      navigate("/login");
    }
  };

  const handleScrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { label: "Analyzer", action: handleAnalyzerClick },  // Now uses handleAnalyzerClick correctly
    { href: "/dashboard", label: "Dashboard" },
  ];

  return (
    <header className={`fixed w-full top-0 z-50 bg-white shadow transition-transform duration-300 ${isVisible ? "translate-y-0" : "-translate-y-full"}`}>
  <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
    <Link to="/" className="flex items-center gap-2">
      <img src={logo} alt="Logo" className="w-10 h-10 sm:w-14 sm:h-14 object-contain" />
    </Link>

    <nav className="hidden md:flex items-center gap-6">
      {navLinks.map((item, index) => (
        item.href ? (
          <Link
            key={`link-${index}`}  // Use a unique combination of index and type
            to={item.href}
            className={`text-gray-700 hover:text-purple-600 px-3 py-1 rounded ${
              path === item.href
                ? "font-bold text-purple-600 bg-purple-100"
                : path === "/" && item.label === "Home"
                ? "bg-white"  // Home link gets white background if it’s the current page
                : ""
            }`}
          >
            {item.label}
          </Link>
        ) : (
          <button
            key={`button-${index}`}  // Use a unique combination of index and type
            onClick={item.action}
            className={`text-gray-700 hover:text-purple-600 px-3 py-1 rounded ${
              path === "/analyze" && item.label === "Analyzer"
                ? "font-bold text-purple-600 bg-purple-100" // Add active styles for Analyzer
                : ""
            }`}
          >
            {item.label}
          </button>
        )
      ))}
      <button
        onClick={handleLoginLogout}
        className="bg-purple-600 text-white px-4 py-1.5 rounded hover:bg-purple-700 transition ml-2"
      >
        {isLoggedIn ? "Logout" : "Login / Signup"}
      </button>
    </nav>

    <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="md:hidden">
      {isMobileOpen ? <FiX size={24} /> : <GiHamburgerMenu size={24} />}
    </button>
  </div>

  {isMobileOpen && (
    <div className="fixed top-0 inset-0 z-40 bg-white pt-16 p-6 flex flex-col gap-6 md:hidden">
      {navLinks.map((item, index) => (
        item.href ? (
          <Link
            key={`link-mobile-${index}`}  // Use a unique combination of index and type
            to={item.href}
            onClick={() => setIsMobileOpen(false)}
            className={`text-lg text-center rounded p-3 ${
              path === item.href
                ? "bg-purple-100 text-purple-600 font-semibold"
                : "text-gray-700"
            }`}
          >
            {item.label}
          </Link>
        ) : (
          <button
            key={`button-mobile-${index}`}  // Use a unique combination of index and type
            onClick={item.action}
            className={`text-lg text-center rounded p-3 ${
              path === "/analyze" && item.label === "Analyzer"
                ? "bg-purple-100 text-purple-600 font-semibold"
                : "text-gray-700"
            }`}
          >
            {item.label}
          </button>
        )
      ))}
      <button
        onClick={() => {
          handleLoginLogout();
          setIsMobileOpen(false);
        }}
        className="bg-purple-600 text-white text-center rounded p-3"
      >
        {isLoggedIn ? "Logout" : "Login / Signup"}
      </button>
    </div>
  )}
</header>
 );
};

export default Header;