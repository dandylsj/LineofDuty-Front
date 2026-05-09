import Header from "../components/Header";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/userAuth";
import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { userApi } from "../api/userApi";
import type { UserUpdateRequest } from "../api/userApi";
import { enlistmentApi } from "../api/enlistmentApi";
import "../styles/mypage.css";

export default function MyPage() {
  const navigate = useNavigate();
  const { isLoggedIn, userId, isInitialized, logout } = useAuth();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [profileUploading, setProfileUploading] = useState(false);
  const [profileUploadMessage, setProfileUploadMessage] = useState({ type: "", text: "" });
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [enlistLoading, setEnlistLoading] = useState(false);
  const [showDeferModal, setShowDeferModal] = useState(false);
  const [deferForm, setDeferForm] = useState({
    applicationId: null as number | null,
    defermentStatus: "ILLNESS",
    reasonDetail: "",
    scheduleId: null as number | null,
  });
  const [scheduleOptions, setScheduleOptions] = useState<any[]>([]);

  const getProfileImageUrl = (profile: any): string | null => {
    const candidate = profile?.profileImageUrl;
    if (typeof candidate !== "string") return null;
    const trimmed = candidate.trim();
    return trimmed ? trimmed : null;
  };

  const getAvatarFallbackText = (profile: any): string => {
    const name = typeof profile?.username === "string" ? profile.username.trim() : "";
    return name ? name.slice(0, 1) : "U";
  };

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    if (!isLoggedIn || !userId) {
      navigate("/login");
      return;
    }

    setLoading(true);
    userApi
      .getProfile(userId)
      .then((res) => {
        const profile = res.data?.data;
        setUserInfo(profile);
        setFormData((prev) => ({
          ...prev,
          email: profile?.email || "",
        }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isInitialized, isLoggedIn, userId, navigate]);

  useEffect(() => {
    if (!isInitialized || !isLoggedIn || !userId) {
      return;
    }
    fetchMyApplications();
  }, [isInitialized, isLoggedIn, userId]);

  const fetchMyApplications = async () => {
    setEnlistLoading(true);
    try {
      const toNumberOrNull = (value: any): number | null => {
        if (value == null || value === "") return null;
        const n = typeof value === "number" ? value : Number(value);
        return Number.isFinite(n) ? n : null;
      };

      const isSameUser = (appUserId: any) => {
        const a = toNumberOrNull(appUserId);
        const b = toNumberOrNull(userId);
        if (a == null || b == null) return false;
        return a === b;
      };

      const parseTimeMs = (value?: string): number => {
        if (!value) return NaN;
        const direct = Date.parse(value);
        if (!Number.isNaN(direct)) return direct;

        const trimmed = value.trim();
        const normalized = trimmed.replace(" ", "T");
        const microFixed = normalized.replace(/\.(\d{3})\d+$/, ".$1");
        const fixed = Date.parse(microFixed);
        if (!Number.isNaN(fixed)) return fixed;

        const noFraction = normalized.replace(/\.(\d+)$/, "");
        return Date.parse(noFraction);
      };

      const getAppUserId = (app: any) =>
        app?.userId ?? app?.user_id ?? app?.memberId ?? app?.accountId;

      const getAppId = (app: any) =>
        app?.applicationId ?? app?.id ?? app?.application_id ?? null;

      const normalize = (payload: any) => {
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.content)) return payload.content;
        return [];
      };

      const pickLatestOne = (apps: any[]) => {
        if (!apps.length) return null;
        const copy = [...apps];
        copy.sort((a, b) => {
          const at = parseTimeMs(a?.createdAt ?? a?.created_at);
          const bt = parseTimeMs(b?.createdAt ?? b?.created_at);
          if (Number.isNaN(at) || Number.isNaN(bt)) return 0;
          return bt - at;
        });
        return copy[0] ?? null;
      };

      // 1) 목록 조회 (가능하면 userId/정렬/페이징으로 최소화)
      let list: any[] = [];
      if (userId != null) {
        try {
          const res = await enlistmentApi.getApplicationList({
            userId: userId ?? undefined,
            page: 0,
            size: 50,
            sort: "createdAt",
            direction: "desc",
          });
          list = normalize(res.data?.data);
        } catch {
          list = [];
        }
      }

      if (list.length === 0) {
        const res = await enlistmentApi.getApplicationList();
        list = normalize(res.data?.data);
      }

      // 2) 내 applicationId 1개만 선택
      const mine = userId != null ? list.filter((app: any) => isSameUser(getAppUserId(app))) : [];

      // 목록에 userId 필드가 존재하는데 내 것 매칭이 0이면, 타유저 데이터일 가능성이 높으니 비움
      const listHasUserIdField = list.some((app: any) => getAppUserId(app) != null);
      if (userId != null && listHasUserIdField && mine.length === 0) {
        setMyApplications([]);
        return;
      }

      // userId 필드가 아예 없으면(검증 불가) 일단 목록이 내 것이라고 가정하고 최신 1건 선택
      const picked = pickLatestOne(mine.length ? mine : list);
      const applicationId = picked ? getAppId(picked) : null;

      if (!applicationId) {
        setMyApplications([]);
        return;
      }

      // 3) 상세 단건 조회
      const detailRes = await enlistmentApi.getApplication(Number(applicationId));
      const detail = detailRes.data?.data ?? detailRes.data;
      if (!detail) {
        setMyApplications([]);
        return;
      }

      // 상세에도 userId가 있으면 로그인 유저와 일치하는지 검증
      if (userId != null) {
        const detailUserId = getAppUserId(detail);
        if (detailUserId != null && !isSameUser(detailUserId)) {
          setMyApplications([]);
          return;
        }
      }

      setMyApplications([detail]);
    } catch (err) {
      // ignore
    } finally {
      setEnlistLoading(false);
    }
  };

  const fetchScheduleOptions = async () => {
    try {
      const res = await enlistmentApi.getEnlistmentList(0, 50);
      const data = res.data?.data;
      const list = Array.isArray(data) ? data : data?.content || [];
      setScheduleOptions(list);
    } catch (err) {
      // ignore
    }
  };

  const handleCancelApplication = async (applicationId: number) => {
    try {
      await enlistmentApi.cancelApplication(applicationId);
      fetchMyApplications();
    } catch (err) {
      // ignore
    }
  };

  const handleOpenDeferModal = (applicationId: number) => {
    setDeferForm({
      applicationId,
      defermentStatus: "ILLNESS",
      reasonDetail: "",
      scheduleId: null,
    });
    fetchScheduleOptions();
    setShowDeferModal(true);
  };

  const handleSubmitDefer = async () => {
    if (!deferForm.applicationId || !deferForm.scheduleId) {
      return;
    }

    try {
      await enlistmentApi.applyDeferment({
        applicationId: deferForm.applicationId,
        defermentStatus: deferForm.defermentStatus as any,
        reasonDetail: deferForm.reasonDetail,
        scheduleId: deferForm.scheduleId,
      });

      setShowDeferModal(false);
      fetchMyApplications();
    } catch (err) {
      // ignore
    }
  };

  const handleFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setMessage({ type: "", text: "" });
  };

  const handleProfileImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // 같은 파일 재선택을 위해 value 초기화
    e.target.value = "";

    if (!file) return;
    if (!file.type?.startsWith("image/")) {
      setProfileUploadMessage({ type: "error", text: "이미지 파일만 업로드할 수 있습니다." });
      return;
    }
    // 5MB 제한(과도한 업로드 방지)
    if (file.size > 5 * 1024 * 1024) {
      setProfileUploadMessage({ type: "error", text: "이미지 용량은 5MB 이하여야 합니다." });
      return;
    }
    if (!userId) {
      setProfileUploadMessage({ type: "error", text: "로그인 정보를 확인할 수 없습니다." });
      return;
    }

    setProfileUploading(true);
    setProfileUploadMessage({ type: "", text: "" });
    try {
      await userApi.uploadProfileImage(file);
      setProfileUploadMessage({ type: "success", text: "프로필 이미지가 업로드되었습니다." });

      const res = await userApi.getProfile(userId);
      const profile = res.data?.data;
      setUserInfo(profile);
    } catch (err: any) {
      setProfileUploadMessage({
        type: "error",
        text: err?.response?.data?.message || "프로필 이미지 업로드에 실패했습니다.",
      });
    } finally {
      setProfileUploading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!formData.currentPassword) {
      setMessage({ type: "error", text: "현재 비밀번호를 입력해주세요." });
      return;
    }

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: "error", text: "새 비밀번호가 일치하지 않습니다." });
      return;
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      setMessage({ type: "error", text: "새 비밀번호는 최소 6자 이상이어야 합니다." });
      return;
    }

    setUpdateLoading(true);
    const updateData: UserUpdateRequest = {
      currentPassword: formData.currentPassword,
    };

    if (formData.email && formData.email !== userInfo?.email) {
      updateData.email = formData.email;
    }

    if (formData.newPassword) {
      updateData.newPassword = formData.newPassword;
    }

    userApi
      .updateProfile(userId!, updateData)
      .then(() => {
        setMessage({ type: "success", text: "정보가 성공적으로 수정되었습니다." });
        setTimeout(() => {
          setShowEditModal(false);
          if (userId) {
            userApi.getProfile(userId).then((res) => {
              const profile = res.data?.data;
              setUserInfo(profile);
              setFormData({
                email: profile?.email || "",
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
              });
            });
          }
        }, 1500);
      })
      .catch((err) => {
        setMessage({
          type: "error",
          text: err.response?.data?.message || "정보 수정에 실패했습니다.",
        });
      })
      .finally(() => setUpdateLoading(false));
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toNumberOrNull = (value: any): number | null => {
    if (value == null || value === "") return null;
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : null;
  };

  const parseTimeMs = (value?: string): number => {
    if (!value) return NaN;
    const direct = Date.parse(value);
    if (!Number.isNaN(direct)) return direct;

    const trimmed = value.trim();
    const normalized = trimmed.replace(" ", "T");
    const microFixed = normalized.replace(/\.(\d{3})\d+$/, ".$1");
    const fixed = Date.parse(microFixed);
    if (!Number.isNaN(fixed)) return fixed;

    const noFraction = normalized.replace(/\.(\d+)$/, "");
    return Date.parse(noFraction);
  };

  const formatDateOnly = (value?: string) => {
    const ms = parseTimeMs(value);
    if (Number.isNaN(ms)) return "-";
    return new Date(ms).toLocaleDateString("ko-KR");
  };

  const visibleApplications = myApplications.filter((app) => {
    if (!app) return false;
    const id = app.applicationId ?? app.id ?? app.application_id;
    const enlistmentDate = app.enlistmentDate ?? app.enlistment_date;
    const status = app.status ?? app.decisionStatus ?? app.decision_status;
    const createdAt = app.createdAt ?? app.created_at;
    const hasAnyValue = Boolean(enlistmentDate || status || createdAt);
    return toNumberOrNull(id) != null && hasAnyValue;
  });

  if (!isLoggedIn) {
    return null;
  }

  return (
    <>
      <Header />

      <main className="mypage-container">
        <div className="mypage-wrapper">
          {loading ? (
            <div className="mypage-loading">로딩 중...</div>
          ) : userInfo ? (
            <>
              <section className="mypage-card">
                <h1 className="mypage-title">내 정보</h1>

                <div className="mypage-profile-row">
                  {(() => {
                    const profileImageUrl = getProfileImageUrl(userInfo);
                    return (
                      <>
                  <div className="mypage-avatar">
                    {profileImageUrl ? (
                      <img
                        src={profileImageUrl}
                        alt="프로필 이미지"
                        loading="lazy"
                      />
                    ) : (
                      <div className="mypage-avatar-fallback">{getAvatarFallbackText(userInfo)}</div>
                    )}
                  </div>

                  <div className="mypage-profile-actions">
                    {!profileImageUrl && (
                      <>
                        <input
                          id="mypage-profile-file"
                          className="mypage-file-input"
                          type="file"
                          accept="image/*"
                          onChange={handleProfileImageChange}
                          disabled={profileUploading}
                        />
                        <label
                          htmlFor="mypage-profile-file"
                          className={`mypage-upload-btn ${profileUploading ? "disabled" : ""}`}
                          aria-disabled={profileUploading}
                        >
                          {profileUploading ? "업로드 중..." : "프로필 이미지 업로드"}
                        </label>
                        <p className="mypage-subtext">마이페이지에서 업로드하면 홈에도 반영됩니다.</p>
                      </>
                    )}

                    {profileUploadMessage.text && (
                      <div
                        className={`mypage-message ${
                          profileUploadMessage.type === "error" ? "error" : "success"
                        }`}
                        style={{ marginTop: "12px", marginBottom: 0 }}
                      >
                        {profileUploadMessage.text}
                      </div>
                    )}
                  </div>
                      </>
                    );
                  })()}
                </div>

                <div className="mypage-info-list">
                  <div className="mypage-info-row">
                    <label className="mypage-info-label">이름</label>
                    <span className="mypage-info-value">{userInfo.username}</span>
                  </div>

                  <div className="mypage-info-row">
                    <label className="mypage-info-label">이메일</label>
                    <span className="mypage-info-value">{userInfo.email}</span>
                  </div>

                  <div className="mypage-info-row">
                    <label className="mypage-info-label">회원가입 날짜</label>
                    <span className="mypage-info-value">
                      {new Date(userInfo.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>

                  {userInfo.lastLoginAt && (
                    <div className="mypage-info-row">
                      <label className="mypage-info-label">마지막 로그인</label>
                      <span className="mypage-info-value">
                        {new Date(userInfo.lastLoginAt).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mypage-button-group">
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="mypage-primary-btn"
                  >
                    내 정보 수정
                  </button>
                  <button onClick={handleLogout} className="mypage-danger-btn">
                    로그아웃
                  </button>
                </div>
              </section>

              <section className="mypage-card">
                <h2 className="mypage-section-title">내 입영 일정</h2>
                {enlistLoading ? (
                  <div className="mypage-loading">로딩 중...</div>
                ) : visibleApplications.length === 0 ? (
                  <div className="mypage-empty">입영 신청 내역이 없습니다.</div>
                ) : (
                  <div className="mypage-table-wrapper">
                    <table className="mypage-table">
                      <thead>
                        <tr>
                          <th>신청ID</th>
                          <th>입영일</th>
                          <th>상태</th>
                          <th>신청일</th>
                          <th>처리</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleApplications.map((app) => (
                          <tr key={app.applicationId || app.id}>
                            <td>{app.applicationId ?? app.id ?? app.application_id}</td>
                            <td>
                              {formatDateOnly(app.enlistmentDate ?? app.enlistment_date)}
                            </td>
                            <td>{app.status ?? app.decisionStatus ?? app.decision_status ?? "-"}</td>
                            <td>
                              {formatDateOnly(app.createdAt ?? app.created_at)}
                            </td>
                            <td className="mypage-table-actions">
                              <button
                                className="mypage-secondary-btn"
                                onClick={() =>
                                  handleCancelApplication(
                                    Number(app.applicationId ?? app.id ?? app.application_id)
                                  )
                                }
                              >
                                취소
                              </button>
                              <button
                                className="mypage-ghost-btn"
                                onClick={() =>
                                  handleOpenDeferModal(
                                    Number(app.applicationId ?? app.id ?? app.application_id)
                                  )
                                }
                              >
                                연기 신청
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          ) : (
            <div className="mypage-empty">정보를 불러올 수 없습니다.</div>
          )}
        </div>
      </main>

      {showEditModal && (
        <div className="mypage-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="mypage-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mypage-modal-header">
              <h2 className="mypage-modal-title">내 정보 수정</h2>
              <button className="mypage-close-btn" onClick={() => setShowEditModal(false)}>
                ✕
              </button>
            </div>
            <div className="mypage-modal-content">
              <div className="mypage-form-group">
                <label className="mypage-form-label">이메일</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className="mypage-form-input"
                  placeholder="이메일 주소"
                />
              </div>

              <div className="mypage-form-group">
                <label className="mypage-form-label">현재 비밀번호 *</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleFormChange}
                  className="mypage-form-input"
                  placeholder="현재 비밀번호"
                />
              </div>

              <div className="mypage-form-group">
                <label className="mypage-form-label">새 비밀번호</label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleFormChange}
                  className="mypage-form-input"
                  placeholder="새 비밀번호 (변경하지 않으면 공백)"
                />
              </div>

              <div className="mypage-form-group">
                <label className="mypage-form-label">새 비밀번호 확인</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleFormChange}
                  className="mypage-form-input"
                  placeholder="새 비밀번호 확인"
                />
              </div>

              {message.text && (
                <div
                  className={`mypage-message ${message.type === "error" ? "error" : "success"}`}
                >
                  {message.text}
                </div>
              )}

              <div className="mypage-modal-footer">
                <button className="mypage-cancel-btn" onClick={() => setShowEditModal(false)}>
                  취소
                </button>
                <button
                  className="mypage-submit-btn"
                  onClick={handleUpdateProfile}
                  disabled={updateLoading}
                >
                  {updateLoading ? "처리 중..." : "저장"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeferModal && (
        <div className="mypage-modal-overlay" onClick={() => setShowDeferModal(false)}>
          <div className="mypage-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mypage-modal-header">
              <h2 className="mypage-modal-title">연기 신청</h2>
              <button className="mypage-close-btn" onClick={() => setShowDeferModal(false)}>
                ✕
              </button>
            </div>
            <div className="mypage-modal-content">
              <div className="mypage-form-group">
                <label className="mypage-form-label">연기 사유</label>
                <select
                  value={deferForm.defermentStatus}
                  onChange={(e) =>
                    setDeferForm((prev) => ({
                      ...prev,
                      defermentStatus: e.target.value,
                    }))
                  }
                  className="mypage-form-input"
                >
                  <option value="ILLNESS">질병</option>
                  <option value="STUDY">학업</option>
                  <option value="FAMILY">가족</option>
                  <option value="PERSONAL">개인 사정</option>
                  <option value="SIMPLECHANGE">단순 변경</option>
                </select>
              </div>

              <div className="mypage-form-group">
                <label className="mypage-form-label">변경할 입영 일정</label>
                <select
                  value={deferForm.scheduleId ?? ""}
                  onChange={(e) =>
                    setDeferForm((prev) => ({
                      ...prev,
                      scheduleId: Number(e.target.value) || null,
                    }))
                  }
                  className="mypage-form-input"
                >
                  <option value="">입영 일정을 선택하세요</option>
                  {scheduleOptions.map((s) => (
                    <option key={s.scheduleId || s.id} value={s.scheduleId || s.id}>
                      {s.enlistmentDate
                        ? new Date(s.enlistmentDate).toLocaleDateString("ko-KR")
                        : s.date || s.title || `일정 ${s.scheduleId || s.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mypage-form-group">
                <label className="mypage-form-label">상세 사유</label>
                <textarea
                  value={deferForm.reasonDetail}
                  onChange={(e) =>
                    setDeferForm((prev) => ({
                      ...prev,
                      reasonDetail: e.target.value,
                    }))
                  }
                  className="mypage-form-textarea"
                  placeholder="상세 사유를 입력하세요"
                />
              </div>

              <div className="mypage-modal-footer">
                <button className="mypage-cancel-btn" onClick={() => setShowDeferModal(false)}>
                  취소
                </button>
                <button className="mypage-submit-btn" onClick={handleSubmitDefer}>
                  신청
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
