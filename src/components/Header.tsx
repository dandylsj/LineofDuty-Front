import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/userAuth";
import { useEffect, useState } from "react";
import { userApi } from "../api/userApi";
import { categoryApi } from "../api/categoryApi";
import type { CategoryResponse } from "../api/categoryApi";
import "../styles/header.css";
import logo from "../assets/logo.png";

export default function Header() {
  const { isLoggedIn, isAdmin, logout, userId } = useAuth();
  const navigate = useNavigate();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [username, setUsername] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);

  useEffect(() => {
    if (isLoggedIn && userId) {
      userApi
        .getProfile(userId)
        .then((res) => setUsername(res.data?.data?.username || null))
        .catch(() => {});
    } else {
      setUsername(null);
    }
  }, [isLoggedIn, userId]);

  useEffect(() => {
    categoryApi.getCategories()
      .then(res => setCategories(res.data?.data ?? []))
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSearch = () => {
    const q = searchKeyword.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
    setSearchKeyword('');
  };

  return (
    <>
      <div className="gov-topbar">
        <div className="gov-topbar__links">
          <Link to="/">홈</Link>
          <Link to="/notices">공지사항</Link>
          <Link to="/qna">민원/QnA</Link>
          {isLoggedIn ? (
            <>
              <Link to="/mypage">마이페이지</Link>
              <button onClick={handleLogout}>로그아웃</button>
            </>
          ) : (
            <>
              <Link to="/login">로그인</Link>
              <Link to="/signup">회원가입</Link>
            </>
          )}
          {isLoggedIn && isAdmin && <Link to="/admin">관리자</Link>}
        </div>
        {isLoggedIn && username && (
          <span className="gov-topbar__welcome">👤 {username}님 환영합니다</span>
        )}
      </div>

      <header className="app-header">
        <div className="app-logo">
          <Link to="/">
            <div className="logo"><img src={logo} alt="병무청 로고" /></div>
            병무청
          </Link>
        </div>

        <nav className="app-nav">
          <Link to="/enlistment">입영 일정</Link>
          <Link to="/deferments">연기 신청</Link>

          {/* 군장용품 드롭다운 */}
          <div className="nav-dropdown-wrapper">
            <Link to="/products" className="nav-dropdown-trigger">군장용품</Link>
            <div className="nav-dropdown">
              <Link to="/products">전체</Link>
              {categories.map(cat => (
                <Link key={cat.id} to={`/products?categoryId=${cat.id}`}>{cat.name}</Link>
              ))}
              {categories.length === 0 && (
                <span className="nav-dropdown-empty">카테고리 없음</span>
              )}
            </div>
          </div>

          <Link to="/notices">공지사항</Link>
          <Link to="/qna">QnA</Link>
          {isLoggedIn && <Link to="/cart">장바구니</Link>}
          {isLoggedIn && <Link to="/orders">주문내역</Link>}
          {isLoggedIn && isAdmin && <Link to="/admin">관리자</Link>}
        </nav>

        <div className="app-header-right">
          <div className="app-search">
            <input
              className="app-searchInput"
              placeholder="검색어를 입력하세요"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            />
            <button className="app-searchBtn" onClick={handleSearch}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
          </div>

          <div className="app-auth">
            {isLoggedIn ? (
              <>
                <Link to="/mypage">마이페이지</Link>
                <button onClick={handleLogout} className="app-logoutBtn">로그아웃</button>
              </>
            ) : (
              <Link to="/login" className="header-login-link">로그인</Link>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
