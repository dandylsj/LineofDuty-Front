import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { authApi } from "../api/authApi";

export default function KakaoCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // 1) 백엔드가 로그인 처리 후 프론트로 리다이렉트하면서 토큰을 전달한 경우
    // - fragment(#...)는 서버로 전송되지 않아 query보다 노출 위험이 적음
    const hash = window.location.hash?.startsWith("#") ? window.location.hash.slice(1) : "";
    const hashParams = new URLSearchParams(hash);
    const hashAccessToken =
      hashParams.get("accessToken") ??
      hashParams.get("access_token") ??
      hashParams.get("token");
    const hashRefreshToken =
      hashParams.get("refreshToken") ??
      hashParams.get("refresh_token");

    const queryParams = new URLSearchParams(window.location.search);
    const queryAccessToken = queryParams.get("accessToken") ?? queryParams.get("access_token");
    const queryRefreshToken = queryParams.get("refreshToken") ?? queryParams.get("refresh_token");
    const deliveredAccessToken = hashAccessToken ?? queryAccessToken;
    const deliveredRefreshToken = hashRefreshToken ?? queryRefreshToken;

    if (deliveredAccessToken) {
      localStorage.setItem("accessToken", deliveredAccessToken);
      if (deliveredRefreshToken) {
        localStorage.setItem("refreshToken", deliveredRefreshToken);
      }

      // URL에서 토큰 제거
      window.history.replaceState(null, "", "/oauth/kakao/callback");
      window.location.href = "/";
      return;
    }

    // 2) 프론트 콜백에서 code를 받아 백엔드로 교환하는 경우
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const storedState = sessionStorage.getItem("kakao_oauth_state");

    if (storedState) {
      sessionStorage.removeItem("kakao_oauth_state");
    }

    if (!code) {
      setError("카카오 로그인에 실패했습니다. (code 없음)");
      return;
    }

    if (storedState && state && storedState !== state) {
      setError("카카오 로그인에 실패했습니다. (state 불일치)");
      return;
    }

    (async () => {
      try {
        const res = await authApi.kakaoLogin(code);

        const accessToken = res.data?.data?.accessToken;
        const refreshToken = res.data?.data?.refreshToken;
        const username = res.data?.data?.username ?? res.data?.data?.userName;
        const userId = res.data?.data?.userId ?? res.data?.data?.userID ?? res.data?.data?.id;

        if (!accessToken) {
          setError("카카오 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.");
          return;
        }

        localStorage.setItem("accessToken", accessToken);
        if (refreshToken) {
          localStorage.setItem("refreshToken", String(refreshToken));
        }
        if (username) {
          localStorage.setItem("username", String(username));
        }
        if (userId != null) {
          localStorage.setItem("userId", String(userId));
        }

        window.location.href = "/";
      } catch (e: any) {
        setError(e?.response?.data?.message || "카카오 로그인에 실패했습니다.");
      }
    })();
  }, [navigate]);

  return (
    <>
      <Header />
      <main style={{ padding: "40px", minHeight: "100vh", background: "#f5f7fb" }}>
        {error ? (
          <div style={{ maxWidth: 520, margin: "0 auto", background: "#fff", padding: 20, borderRadius: 12 }}>
            <h2 style={{ margin: 0, marginBottom: 10 }}>카카오 로그인 오류</h2>
            <p style={{ margin: 0, color: "#b91c1c" }}>{error}</p>
            <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
              <button
                onClick={() => navigate("/login")}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #e5e7ef",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                로그인으로
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "none",
                  background: "#4a6cf7",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                홈으로
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", color: "#4b5565" }}>카카오 로그인 처리 중...</div>
        )}
      </main>
    </>
  );
}
