import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../api/authApi";
import "../styles/signup.css";
import Header from "../components/Header";

export default function Signup() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");

  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [passwordConfirmError, setPasswordConfirmError] = useState("");

  const [globalError, setGlobalError] = useState("");

  const validateEmail = (value: string) => {
    if (!value) return "이메일은 필수입니다.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "올바른 이메일 형식이 아닙니다.";
    return "";
  };

  const validatePassword = (value: string) => {
    if (!value) return "비밀번호는 필수입니다.";
    const pwdRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[~!@#$%^&*?_]).{8,}$/;
    if (!pwdRegex.test(value)) {
      return "비밀번호는 영문, 숫자, 특수문자를 포함하여 8자 이상이어야 합니다.";
    }
    return "";
  };

  const handleSendCode = async () => {
    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }
    setEmailError("");
    try {
      await authApi.sendVerificationEmail(email);
      setIsEmailSent(true);
      alert("인증 코드가 이메일로 발송되었습니다.");
    } catch (e) {
      setEmailError("인증 코드 발송에 실패했습니다. 이미 가입된 이메일인지 확인해주세요.");
    }
  };

  const handleVerifyCode = async () => {
    if (!code) {
      setCodeError("인증 코드를 입력해주세요.");
      return;
    }
    try {
      await authApi.verifyEmailCode({ email, code });
      setIsVerified(true);
      setCodeError("");
      alert("이메일 인증이 완료되었습니다.");
    } catch (e) {
      setCodeError("인증 코드가 올바르지 않습니다.");
    }
  };

  const handleSignup = async () => {
    setGlobalError("");
    let isValid = true;

    // 이름 검증
    if (!username.trim()) {
      setGlobalError("이름을 입력해주세요.");
      isValid = false;
    }

    // 이메일 검증
    const eErr = validateEmail(email);
    if (eErr) {
      setEmailError(eErr);
      isValid = false;
    } else if (!isVerified) {
      setEmailError("이메일 인증을 완료해주세요.");
      isValid = false;
    }

    // 비밀번호 검증
    const pErr = validatePassword(password);
    if (pErr) {
      setPasswordError(pErr);
      isValid = false;
    }

    // 비밀번호 확인 검증
    if (!passwordConfirm) {
      setPasswordConfirmError("비밀번호 확인을 입력해주세요.");
      isValid = false;
    } else if (password !== passwordConfirm) {
      setPasswordConfirmError("비밀번호가 일치하지 않습니다.");
      isValid = false;
    } else {
      setPasswordConfirmError("");
    }

    if (!isValid) return;

    try {
      await authApi.signup({ email, password, username });
      alert("회원가입이 완료되었습니다.");
      navigate("/login");
    } catch {
      setGlobalError("회원가입에 실패했습니다. 입력값을 확인해주세요.");
    }
  };

  return (
    <>
      <Header />
      <div className="signup-page">
        <div className="signup-box">
          <div className="signup-box__top-bar" />
          <div className="signup-box__body">
            <h2 className="signup-title">회원가입</h2>

            <form onSubmit={(e) => { e.preventDefault(); handleSignup(); }}>
              
              {/* 이름 */}
              <div className="input-group">
                <label>이름</label>
                <input
                  type="text"
                  placeholder="이름"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              {/* 이메일 발송 */}
              <div className="input-group">
                <label>이메일</label>
                <div className="input-with-button">
                  <input
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setIsEmailSent(false);
                      setIsVerified(false);
                    }}
                    disabled={isVerified}
                  />
                  <button 
                    type="button" 
                    onClick={handleSendCode}
                    disabled={isVerified}
                  >
                    {isEmailSent ? "재발송" : "인증코드 발송"}
                  </button>
                </div>
                {emailError && <p className="input-error">{emailError}</p>}
                {isVerified && <p className="input-success">이메일 인증이 완료되었습니다.</p>}
              </div>

              {/* 이메일 코드 인증 (이메일이 발송된 후에만 보임) */}
              {isEmailSent && !isVerified && (
                <div className="input-group">
                  <div className="input-with-button">
                    <input
                      type="text"
                      placeholder="인증코드 입력"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                    />
                    <button type="button" onClick={handleVerifyCode}>
                      코드 확인
                    </button>
                  </div>
                  {codeError && <p className="input-error">{codeError}</p>}
                </div>
              )}

              {/* 비밀번호 */}
              <div className="input-group">
                <label>비밀번호</label>
                <input
                  type="password"
                  placeholder="영문, 숫자, 특수문자 포함 8자 이상"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(validatePassword(e.target.value));
                  }}
                  onBlur={() => setPasswordError(validatePassword(password))}
                />
                {passwordError && <p className="input-error">{passwordError}</p>}
              </div>

              {/* 비밀번호 확인 */}
              <div className="input-group">
                <label>비밀번호 확인</label>
                <input
                  type="password"
                  placeholder="비밀번호 다시 입력"
                  value={passwordConfirm}
                  onChange={(e) => {
                    setPasswordConfirm(e.target.value);
                    if (passwordConfirmError) {
                      setPasswordConfirmError(
                        e.target.value === password ? "" : "비밀번호가 일치하지 않습니다."
                      );
                    }
                  }}
                  onBlur={() => {
                    if (password !== passwordConfirm) {
                      setPasswordConfirmError("비밀번호가 일치하지 않습니다.");
                    }
                  }}
                />
                {passwordConfirmError && <p className="input-error">{passwordConfirmError}</p>}
              </div>

              {/* 전체 에러 */}
              {globalError && <p className="error-text">{globalError}</p>}

              <button className="signup-button" type="submit">
                회원가입
              </button>

              <div className="signup-footer">
                <span>이미 계정이 있으신가요?</span>
                <Link to="/login">로그인</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
