import { Link } from "react-router-dom";
import "../styles/footer.css";

export default function Footer() {
  return (
    <footer className="app-footer" role="contentinfo">
      <div className="app-footer__container">
        <div className="app-footer__top">
          {/* CS Center Section */}
          <div className="app-footer__cs">
            <h3 className="app-footer__cs-title">CS CENTER</h3>
            <p className="app-footer__cs-phone">이세진 010-9447-9646</p>
            <p className="app-footer__cs-time">
              연중무휴<br/>
              현재는 팀장 이세진이 개인서버를 이용해 백앤드와 프론트를 관리하고 있습니다.
            </p>
          </div>

          {/* Links Section */}
          <div className="app-footer__menu">
            <div className="app-footer__col">
              <p className="app-footer__col-title">주요 서비스</p>
              <ul className="app-footer__col-links">
                <li><Link to="/enlistment">입영 일정 조회</Link></li>
                <li><Link to="/deferments">입영 연기 신청</Link></li>
                <li><Link to="/products">군장용품 구매</Link></li>
              </ul>
            </div>
            <div className="app-footer__col">
              <p className="app-footer__col-title">고객지원</p>
              <ul className="app-footer__col-links">
                <li><Link to="/notices">공지사항</Link></li>
                <li><Link to="/qna">QnA 게시판</Link></li>
                <li><Link to="/chat">실시간 상담</Link></li>
              </ul>
            </div>
            <div className="app-footer__col">
              <p className="app-footer__col-title">개발 정보</p>
              <ul className="app-footer__col-links">
                <li>
                  <a href="https://github.com/Fantasystar94/LineofDuty" target="_blank" rel="noreferrer">
                    백엔드 GitHub
                  </a>
                </li>
                <li>
                  <a href="https://github.com/Fantasystar94/Pentagon-frontend" target="_blank" rel="noreferrer">
                    프론트엔드 GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="app-footer__bottom">
          <div className="app-footer__info">
            <p className="app-footer__brand-name">Line of duty</p>
            <p>
              <strong>팀 펜타곤</strong> | 팀장: 이세진 | 부팀장: 원민영 | 팀원: 김진찬, 신호윤, 성종민<br />
              본 페이지는 부트캠프 최종프로젝트 프로젝트 결과물입니다. 실제 사이트와는 무관합니다.
            </p>
            <p className="app-footer__copyright">
              © 2025 Team Pentagon. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
