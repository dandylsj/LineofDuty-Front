import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/userAuth";
import "../styles/header.css";
import logo from "../assets/logo.png";

export default function Header() {
  const { isLoggedIn, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <div className="gov-topbar">
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
          <Link to="/products">군장용품</Link>
          <Link to="/notices">공지사항</Link>
          <Link to="/qna">QnA</Link>
          {isLoggedIn && <Link to="/cart">장바구니</Link>}
          {isLoggedIn && <Link to="/orders">주문내역</Link>}
          {isLoggedIn && isAdmin && <Link to="/admin">관리자</Link>}
        </nav>

        <div className="app-auth">
          {isLoggedIn ? (
            <>
              <Link to="/mypage">마이페이지</Link>
              <button onClick={handleLogout} className="app-logoutBtn">
                로그아웃
              </button>
            </>
          ) : (
            <Link to="/login" className="header-login-link">로그인</Link>
          )}
        </div>
      </header>
    </>
  );
}
