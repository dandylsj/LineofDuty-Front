import { Link } from "react-router-dom";
import "../styles/footer.css";

export default function Footer() {
  return (
    <footer className="app-footer" role="contentinfo">
      <div className="app-footer__top">
        <div className="app-footer__brand">
          <p className="app-footer__brand-name">병무청</p>
          <p className="app-footer__brand-desc">
            본 페이지는 부트캠프 백엔드 프로젝트 결과물입니다.<br />
            실제 병무청 서비스와 무관합니다.
          </p>
        </div>

        <div>
          <p className="app-footer__col-title">주요 서비스</p>
          <ul className="app-footer__col-links">
            <li><Link to="/enlistment">입영 일정 조회</Link></li>
            <li><Link to="/deferments">입영 연기 신청</Link></li>
            <li><Link to="/products">군장용품 구매</Link></li>
            <li><Link to="/notices">공지사항</Link></li>
          </ul>
        </div>

        <div>
          <p className="app-footer__col-title">민원/상담</p>
          <ul className="app-footer__col-links">
            <li><Link to="/qna">QnA 게시판</Link></li>
            <li><Link to="/chat">실시간 상담</Link></li>
            <li><Link to="/mypage">마이페이지</Link></li>
          </ul>
        </div>

        <div>
          <p className="app-footer__col-title">개발 정보</p>
          <ul className="app-footer__col-links">
            <li>
              <a href="https://github.com/Fantasystar94/LineofDuty" target="_blank" rel="noreferrer">
                백엔드 GitHub
              </a>
            </li>
            <li>
              <a href="https://github.com/Fantasystar94/Pentagon-frontend/tree/main/frontend" target="_blank" rel="noreferrer">
                프론트엔드 GitHub
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="app-footer__bottom">
        <div className="app-footer__inner">
          <p className="app-footer__notice">
            © 2025 Pentagon Project. 본 사이트는 교육 목적의 프로젝트입니다.
          </p>
          <div className="app-footer__links">
            <Link to="/notices">공지사항</Link>
            <Link to="/qna">QnA</Link>
            <Link to="/login">로그인</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
