import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import { enlistmentApi } from '../api/enlistmentApi';
import { dashboardApi } from '../api/dashboardApi';
import { adminNoticeApi } from '../api/adminNoticeApi';
import { adminProductApi } from '../api/adminProductApi';
import { bannerApi } from '../api/bannerApi';
import type { BannerResponse, BannerRequest } from '../api/bannerApi';
import '../styles/adminDashboard.css';

interface EnlistmentApplication {
  applicationId: number;
  userId: number;
  status: string;
  createdAt: string;
  userName: string;
  enlistmentDate: string;
  // ... 기타 필요한 필드
}

interface DefermentApplication {
  defermentsId: number;
  userId: number;
  decisionStatus: string;
  reason : String,
  status : String,
  username : String,
  changedDate : String,
  createdAt: string;
  // ... 기타 필요한 필드
}

const AdminDashboard: React.FC = () => {
    // 공지사항 상태
  const [notices, setNotices] = useState<any[]>([]);
  const [noticeLoading, setNoticeLoading] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [editNoticeId, setEditNoticeId] = useState<number|null>(null);

  const [enlistments, setEnlistments] = useState<EnlistmentApplication[]>([]);
  const [deferments, setDeferments] = useState<DefermentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardSummary, setDashboardSummary] = useState<any>(null);
  const [dashboardRequested, setDashboardRequested] = useState<any>(null);
  const [dashboardDeferments, setDashboardDeferments] = useState<any>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
  });
  const [productLoading, setProductLoading] = useState(false);
  const [productImage, setProductImage] = useState<File | null>(null);

  // 배너 관련 상태
  const [banners, setBanners] = useState<BannerResponse[]>([]);
  const [bannerLoading, setBannerLoading] = useState(false);
  const [editBannerId, setEditBannerId] = useState<number | null>(null);
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [bannerForm, setBannerForm] = useState<BannerRequest>({
    badge: '',
    title: '',
    subtitle: '',
    ctaText: '',
    ctaPath: '',
    accentColor: '#003087',
    orderIndex: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchLists();
    fetchDashboard();
    fetchBanners();
  }, []);


  const fetchLists = async () => {
    setLoading(true);
    try {
      const enlistRes = await enlistmentApi.getApplicationList();
      const deferRes = await enlistmentApi.getDefermentList();
      setEnlistments(enlistRes.data.data || []);
      setDeferments(deferRes.data.data.content || []);
    } catch (e) {
      // 에러 처리
    }
    setLoading(false);
  };

    // 공지 목록 불러오기
  const fetchNotices = async () => {
    setNoticeLoading(true);
    try {
      const res = await fetch('/api/notices?page=0&size=20');
      const data = await res.json();
      setNotices(Array.isArray(data.data) ? data.data : data.data?.content || []);
    } catch (e) {}
    setNoticeLoading(false);
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  // 공지 등록/수정
  const handleNoticeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editNoticeId) {
        await adminNoticeApi.updateNotice(editNoticeId, { title: noticeTitle, content: noticeContent });
      } else {
        await adminNoticeApi.createNotice({ title: noticeTitle, content: noticeContent });
      }
      setNoticeTitle('');
      setNoticeContent('');
      setEditNoticeId(null);
      fetchNotices();
    } catch (e) {}
  };

  // 공지 삭제
  const handleDeleteNotice = async (id: number) => {
    try {
      await adminNoticeApi.deleteNotice(id);
      fetchNotices();
    } catch (e) {}
  };

  // 공지 수정 모드
  const handleEditNotice = (notice: any) => {
    setEditNoticeId(notice.id);
    setNoticeTitle(notice.title);
    setNoticeContent(notice.content);
  };
  
  const fetchDashboard = async () => {
    try {
      const summaryRes = await dashboardApi.getSummary();
      const requestedRes = await dashboardApi.getRequested();
      const defermentsRes = await dashboardApi.getDeferments();
      setDashboardSummary(summaryRes.data.data);
      setDashboardRequested(requestedRes.data.data);
      setDashboardDeferments(defermentsRes.data.data);
    } catch (e) {
      // 에러 처리
    }
  };

  // 입영신청 승인
  const handleApproveEnlist = async (id: number) => {
    try {
      await enlistmentApi.approveApplication(id);
      fetchLists();
    } catch (e) { /* 에러 처리 */ }
  };

  // 연기신청 승인/반려
  const handleApproveDefer = async (id: number) => {
    try {
      await enlistmentApi.processDeferment(id, { decisionStatus: 'APPROVED' });
      fetchLists();
    } catch (e) { /* 에러 처리 */ }
  };
  const handleRejectDefer = async (id: number) => {
    try {
      await enlistmentApi.processDeferment(id, { decisionStatus: 'REJECTED' });
      fetchLists();
    } catch (e) { /* 에러 처리 */ }
  };

  // 배너 관련 에러 상태
  const [bannerError, setBannerError] = useState<string | null>(null);

  // 배너 목록 조회
  const fetchBanners = async () => {
    setBannerLoading(true);
    setBannerError(null);
    try {
      const res = await bannerApi.getAllBanners();
      const data = res.data?.data;
      setBanners(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setBannerError(`목록 조회 실패: ${msg}`);
    }
    setBannerLoading(false);
  };

  // 배너 폼 입력 핸들러
  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setBannerForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked
               : name === 'orderIndex' ? Number(value)
               : value,
    }));
  };

  // 배너 등록 / 수정
  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerLoading(true);
    setBannerError(null);
    try {
      if (editBannerId !== null) {
        await bannerApi.updateBanner(editBannerId, bannerForm, bannerImage ?? undefined);
      } else {
        await bannerApi.createBanner(bannerForm, bannerImage ?? undefined);
      }
      setBannerForm({ badge: '', title: '', subtitle: '', ctaText: '', ctaPath: '', accentColor: '#003087', orderIndex: 0, isActive: true });
      setBannerImage(null);
      setEditBannerId(null);
      await fetchBanners();
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: { message?: string } }; message?: string };
      const msg = err.response?.data?.message ?? err.message ?? String(e);
      setBannerError(`저장 실패 (${err.response?.status ?? '네트워크 오류'}): ${msg}`);
    }
    setBannerLoading(false);
  };

  // 배너 수정 모드 진입
  const handleEditBanner = (banner: BannerResponse) => {
    setEditBannerId(banner.id);
    setBannerForm({
      badge: banner.badge,
      title: banner.title,
      subtitle: banner.subtitle,
      ctaText: banner.ctaText,
      ctaPath: banner.ctaPath,
      accentColor: banner.accentColor,
      orderIndex: banner.orderIndex,
      isActive: banner.isActive,
    });
    setBannerImage(null);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  // 배너 삭제
  const handleDeleteBanner = async (id: number) => {
    if (!window.confirm('배너를 삭제할까요?')) return;
    try {
      await bannerApi.deleteBanner(id);
      await fetchBanners();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setBannerError(`삭제 실패: ${msg}`);
    }
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProductForm(prev => ({ ...prev, [name]: value }));
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductLoading(true);
    try {
      const res = await adminProductApi.createProduct({
        name: productForm.name,
        description: productForm.description,
        price: Number(productForm.price),
        stock: Number(productForm.stock),
      });
      const productId = res.data?.data?.id ?? res.data?.data?.productId;
      if (productId && productImage) {
        await adminProductApi.uploadProductImage(productId, productImage);
      }
      setProductForm({ name: "", description: "", price: "", stock: "" });
      setProductImage(null);
    } catch (e) {
      // 에러 처리
    }
    setProductLoading(false);
  };

  return (
    <>
      <Header />
      <div className="admin-dashboard-wrapper">
        <div className="admin-dashboard-left admin-dashboard-section">
          <div className="section-header">
            <h2 className="section-title">대시보드</h2>
            <p className="section-subtitle">현황 요약 및 접수 상태</p>
          </div>
          <div className="dashboard-block">
            <h4 className="block-title">전체 요약</h4>
            {dashboardSummary ? (
              <div className="table-scroll">
                <table className="dashboard-table">
                  <tbody>
                    <tr>
                      <th>총 유저 수</th>
                      <td>{dashboardSummary.totalUsers}</td>
                    </tr>
                    <tr>
                      <th>입영 확정</th>
                      <td>{dashboardSummary.confirmedEnlistments}</td>
                    </tr>
                    <tr>
                      <th>입영 신청</th>
                      <td>{dashboardSummary.requestedEnlistments}</td>
                    </tr>
                    <tr>
                      <th>잔여 입영 슬롯</th>
                      <td>{dashboardSummary.totalRemainingSlots}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : '로딩 중...'}
          </div>
          <div className="dashboard-block">
            <h4 className="block-title">요청 대기</h4>
            {dashboardRequested ? (
              <div className="table-scroll">
                <table className="dashboard-table">
                  <tbody>
                    <tr>
                      <th>입영 신청</th>
                      <td>{dashboardRequested.requestedEnlistments}</td>
                    </tr>
                    <tr>
                      <th>입영 확정</th>
                      <td>{dashboardRequested.confirmedEnlistments}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : '로딩 중...'}
          </div>
          <div className="dashboard-block">
            <h4 className="block-title">연기 요약</h4>
            {dashboardDeferments && Array.isArray(dashboardDeferments) && dashboardDeferments.length > 0 ? (
              <div className="table-scroll">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      {Object.keys(dashboardDeferments[0]).map(key => (
                        <th key={key}>{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardDeferments.map((row: any, idx: number) => (
                      <tr key={idx}>
                        {Object.values(row).map((val, i) => (
                          <td key={i}>{typeof val === 'object' ? JSON.stringify(val) : String(val ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : '데이터 없음'}
          </div>
        </div>
        <div className="admin-dashboard-right admin-dashboard-section">
          <div className="section-header">
            <h3 className="section-title">공지사항 관리</h3>
            <p className="section-subtitle">등록/수정/삭제</p>
          </div>
          <form onSubmit={handleNoticeSubmit} className="notice-form">
            <input
              type="text"
              placeholder="제목"
              value={noticeTitle}
              onChange={e => setNoticeTitle(e.target.value)}
              className="notice-input"
              required
            />
            <textarea
              placeholder="내용"
              value={noticeContent}
              onChange={e => setNoticeContent(e.target.value)}
              className="notice-textarea"
              required
            />
            <div className="notice-actions">
              <button type="submit" className="btn-primary">{editNoticeId ? '수정' : '등록'}</button>
              {editNoticeId && (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => { setEditNoticeId(null); setNoticeTitle(''); setNoticeContent(''); }}
                >
                  취소
                </button>
              )}
            </div>
          </form>
          {noticeLoading ? <div>로딩 중...</div> : (
            <div className="table-scroll">
              <table className="dashboard-table notice-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>제목</th>
                    <th>내용</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {notices.map(notice => (
                    <tr key={notice.id}>
                      <td>{notice.id}</td>
                      <td>{notice.title}</td>
                      <td>{notice.content}</td>
                      <td>
                        <button onClick={() => handleEditNotice(notice)}>수정</button>
                        <button onClick={() => handleDeleteNotice(notice.id)} style={{marginLeft: 4}}>삭제</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <h3>입영 신청 리스트</h3>
          {loading ? <div>로딩 중...</div> : (
            <div className="table-scroll">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>입영일</th>
                    <th>유저ID</th>
                    <th>상태</th>
                    <th>신청일</th>
                    <th>처리</th>
                  </tr>
                </thead>
                <tbody>
                  {enlistments.map(app => (
                    <tr key={app.applicationId}>
                      <td>{app.enlistmentDate}</td>
                      <td>{app.userName}</td>
                      <td>{app.status}</td>
                      <td>{app.createdAt}</td>
                      <td>
                        {app.status !== 'APPROVED' && (
                          <button key={`approve-${app.applicationId}`} onClick={() => handleApproveEnlist(app.applicationId)}>확인 처리</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <h3>연기 신청 리스트</h3>
          {loading ? <div>로딩 중...</div> : (
            <div className="table-scroll">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>연기ID</th>
                    <th>유저ID</th>
                    <th>상태</th>
                    <th>신청일</th>
                    <th>변경요청일</th>
                    <th>처리</th>
                  </tr>
                </thead>
                <tbody>
                  {deferments.map(app => (
                    <tr key={app.defermentsId}>
                      <td>{app.defermentsId}</td>
                      <td>{app.username}</td>
                      <td>{app.reason}</td>
                      <td>{app.createdAt}</td>
                      <td>{app.changedDate}</td>
                      <td>
                        {app.decisionStatus !== 'APPROVED' && (
                          <>
                            <button onClick={() => handleApproveDefer(app.defermentsId)}>승인</button>
                            <button onClick={() => handleRejectDefer(app.defermentsId)} style={{marginLeft:4}}>반려</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="section-header" style={{ marginTop: 32 }}>
            <h3 className="section-title">상품 등록</h3>
            <p className="section-subtitle">신규 상품 추가</p>
          </div>
          <form onSubmit={handleProductSubmit} className="notice-form">
            <input
              type="text"
              name="name"
              placeholder="상품명"
              value={productForm.name}
              onChange={handleProductChange}
              className="notice-input"
              required
            />
            <textarea
              name="description"
              placeholder="상품 설명"
              value={productForm.description}
              onChange={handleProductChange}
              className="notice-textarea"
              required
            />
            <div className="notice-actions">
              <input
                type="number"
                name="price"
                placeholder="가격"
                value={productForm.price}
                onChange={handleProductChange}
                className="notice-input"
                required
              />
              <input
                type="number"
                name="stock"
                placeholder="재고"
                value={productForm.stock}
                onChange={handleProductChange}
                className="notice-input"
                required
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProductImage(e.target.files ? e.target.files[0] : null)}
                className="notice-input"
              />
              <button type="submit" className="btn-primary" disabled={productLoading}>
                {productLoading ? "등록 중..." : "등록"}
              </button>
            </div>
          </form>
          {/* 배너 관리 */}
          <div className="section-header" style={{ marginTop: 40 }}>
            <h3 className="section-title">🖼️ 배너 관리</h3>
            <p className="section-subtitle">홈 화면 배너 등록 / 수정 / 삭제</p>
          </div>

          {/* 배너 에러 메시지 */}
          {bannerError && (
            <div style={{ background: '#fff3f3', border: '1px solid #f5c2c2', color: '#c62828', padding: '10px 14px', borderRadius: 4, marginBottom: 12, fontSize: 13 }}>
              ⚠️ {bannerError}
            </div>
          )}

          {/* 배너 목록 */}
          {bannerLoading ? <div>로딩 중...</div> : (
            <div className="table-scroll">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>순서</th>
                    <th>배지</th>
                    <th>제목</th>
                    <th>버튼경로</th>
                    <th>이미지</th>
                    <th>활성</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {banners.map(banner => (
                    <tr key={banner.id}>
                      <td>{banner.orderIndex}</td>
                      <td>
                        <span style={{ background: banner.accentColor, color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>
                          {banner.badge}
                        </span>
                      </td>
                      <td>{banner.title}</td>
                      <td style={{ fontSize: 12, color: '#666' }}>{banner.ctaPath}</td>
                      <td>
                        {banner.imageUrl
                          ? <img src={banner.imageUrl} alt="배너" style={{ width: 60, height: 30, objectFit: 'cover', borderRadius: 3 }} />
                          : <span style={{ color: '#aaa', fontSize: 11 }}>없음</span>
                        }
                      </td>
                      <td>
                        <span style={{ color: banner.isActive ? '#2e7d32' : '#c62828', fontWeight: 700, fontSize: 12 }}>
                          {banner.isActive ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => handleEditBanner(banner)} style={{ marginRight: 4 }}>수정</button>
                        <button onClick={() => handleDeleteBanner(banner.id)}>삭제</button>
                      </td>
                    </tr>
                  ))}
                  {banners.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: 'center', color: '#aaa' }}>등록된 배너가 없습니다</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 배너 등록/수정 폼 */}
          <form onSubmit={handleBannerSubmit} className="notice-form" style={{ marginTop: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input name="badge" placeholder="배지 텍스트 (예: 2026 입영 안내)" value={bannerForm.badge}
                onChange={handleBannerChange} className="notice-input" required />
              <input name="accentColor" type="color" value={bannerForm.accentColor}
                onChange={handleBannerChange} className="notice-input" title="포인트 컬러" />
              <input name="title" placeholder="제목" value={bannerForm.title}
                onChange={handleBannerChange} className="notice-input" required />
              <input name="ctaText" placeholder="버튼 텍스트 (예: 자세히 보기)" value={bannerForm.ctaText}
                onChange={handleBannerChange} className="notice-input" required />
              <input name="ctaPath" placeholder="버튼 경로 (예: /enlistment)" value={bannerForm.ctaPath}
                onChange={handleBannerChange} className="notice-input" required />
              <input name="orderIndex" type="number" placeholder="표시 순서 (0부터)" value={bannerForm.orderIndex}
                onChange={handleBannerChange} className="notice-input" min={0} />
            </div>
            <textarea name="subtitle" placeholder="부제목 (줄바꿈은 \n 입력)" value={bannerForm.subtitle}
              onChange={handleBannerChange} className="notice-textarea" rows={2} />
            <div className="notice-actions" style={{ alignItems: 'center', gap: 12 }}>
              <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" name="isActive" checked={bannerForm.isActive}
                  onChange={handleBannerChange} />
                활성화
              </label>
              <label style={{ fontSize: 13 }}>
                배너 이미지
                <input type="file" accept="image/*" style={{ marginLeft: 8 }}
                  onChange={e => setBannerImage(e.target.files?.[0] ?? null)} />
              </label>
              <button type="submit" className="btn-primary" disabled={bannerLoading}>
                {bannerLoading ? '처리 중...' : editBannerId !== null ? '수정 완료' : '배너 등록'}
              </button>
              {editBannerId !== null && (
                <button type="button" className="btn-ghost" onClick={() => {
                  setEditBannerId(null);
                  setBannerForm({ badge: '', title: '', subtitle: '', ctaText: '', ctaPath: '', accentColor: '#003087', orderIndex: 0, isActive: true });
                  setBannerImage(null);
                }}>취소</button>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
