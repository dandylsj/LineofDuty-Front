import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import { enlistmentApi } from '../api/enlistmentApi';
import { dashboardApi } from '../api/dashboardApi';
import { adminNoticeApi } from '../api/adminNoticeApi';
import { adminProductApi } from '../api/adminProductApi';
import type { DeliveryType } from '../api/adminProductApi';
import { productApi } from '../api/productApi';
import { categoryApi } from '../api/categoryApi';
import type { CategoryResponse } from '../api/categoryApi';
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
}

interface DefermentApplication {
  defermentsId: number;
  userId: number;
  decisionStatus: string;
  reason: string;
  status: string;
  username: string;
  changedDate: string;
  createdAt: string;
}

interface DetailImageItem {
  id: number;
  imageUrl: string;
  orderIndex: number;
}

const DELIVERY_LABELS: Record<DeliveryType, string> = {
  STANDARD: '일반배송',
  SAME_DAY: '당일배송',
  DAWN: '새벽배송',
};

const defaultProductForm = {
  name: '', description: '', price: '', stock: '',
  categoryId: '', shippingFee: '0', freeShippingThreshold: '',
  deliveryType: 'STANDARD' as DeliveryType, detailContent: '',
};

const AdminDashboard: React.FC = () => {
  // ── 공지사항 ──
  const [notices, setNotices] = useState<any[]>([]);
  const [noticeLoading, setNoticeLoading] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [editNoticeId, setEditNoticeId] = useState<number | null>(null);

  // ── 입영/연기 ──
  const [enlistments, setEnlistments] = useState<EnlistmentApplication[]>([]);
  const [deferments, setDeferments] = useState<DefermentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardSummary, setDashboardSummary] = useState<any>(null);
  const [dashboardRequested, setDashboardRequested] = useState<any>(null);
  const [dashboardDeferments, setDashboardDeferments] = useState<any>(null);

  // ── 카테고리 ──
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', parentId: '' });

  // ── 상품 ──
  const [products, setProducts] = useState<any[]>([]);
  const [productListLoading, setProductListLoading] = useState(false);
  const [editProductId, setEditProductId] = useState<number | null>(null);
  const [productForm, setProductForm] = useState(defaultProductForm);
  const [productLoading, setProductLoading] = useState(false);
  const [productImage, setProductImage] = useState<File | null>(null);
  const [detailImageFiles, setDetailImageFiles] = useState<File[]>([]);
  const [existingDetailImages, setExistingDetailImages] = useState<DetailImageItem[]>([]);

  // ── 배너 ──
  const [banners, setBanners] = useState<BannerResponse[]>([]);
  const [bannerLoading, setBannerLoading] = useState(false);
  const [editBannerId, setEditBannerId] = useState<number | null>(null);
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [bannerForm, setBannerForm] = useState<BannerRequest>({
    badge: '', title: '', subtitle: '', ctaText: '', ctaPath: '',
    accentColor: '#003087', orderIndex: 0, isActive: true,
  });
  const [bannerError, setBannerError] = useState<string | null>(null);

  useEffect(() => {
    fetchLists();
    fetchDashboard();
    fetchBanners();
    fetchCategories();
    fetchProducts();
    fetchNotices();
  }, []);

  // ── fetch 함수들 ──
  const fetchLists = async () => {
    setLoading(true);
    try {
      const enlistRes = await enlistmentApi.getApplicationList();
      const deferRes = await enlistmentApi.getDefermentList();
      setEnlistments(enlistRes.data.data || []);
      setDeferments(deferRes.data.data.content || []);
    } catch { }
    setLoading(false);
  };

  const fetchNotices = async () => {
    setNoticeLoading(true);
    try {
      const res = await fetch('/api/notices?page=0&size=20');
      const data = await res.json();
      setNotices(Array.isArray(data.data) ? data.data : data.data?.content || []);
    } catch { }
    setNoticeLoading(false);
  };

  const fetchDashboard = async () => {
    try {
      const summaryRes = await dashboardApi.getSummary();
      const requestedRes = await dashboardApi.getRequested();
      const defermentsRes = await dashboardApi.getDeferments();
      setDashboardSummary(summaryRes.data.data);
      setDashboardRequested(requestedRes.data.data);
      setDashboardDeferments(defermentsRes.data.data);
    } catch { }
  };

  const fetchCategories = async () => {
    setCategoryLoading(true);
    try {
      const res = await categoryApi.getCategories();
      setCategories(res.data?.data ?? []);
    } catch { }
    setCategoryLoading(false);
  };

  const fetchProducts = async () => {
    setProductListLoading(true);
    try {
      const res = await productApi.getProducts({ page: 0, size: 100 });
      const content = res.data?.data?.content ?? res.data?.data ?? [];
      setProducts(Array.isArray(content) ? content : []);
    } catch { }
    setProductListLoading(false);
  };

  const fetchDetailImages = async (productId: number) => {
    try {
      const res = await adminProductApi.getDetailImages(productId);
      setExistingDetailImages(res.data?.data ?? []);
    } catch { }
  };

  // ── 카테고리 핸들러 ──
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryLoading(true);
    try {
      await categoryApi.createCategory({
        name: categoryForm.name,
        description: categoryForm.description,
        parentId: categoryForm.parentId ? Number(categoryForm.parentId) : null,
      });
      setCategoryForm({ name: '', description: '', parentId: '' });
      await fetchCategories();
    } catch { }
    setCategoryLoading(false);
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('카테고리를 삭제할까요?')) return;
    try {
      await categoryApi.deleteCategory(id);
      await fetchCategories();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message ?? '하위 카테고리가 있으면 삭제할 수 없습니다.');
    }
  };

  // ── 상품 핸들러 ──
  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProductForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditProduct = (product: any) => {
    setEditProductId(product.productId);
    setProductForm({
      name: product.name ?? '',
      description: product.description ?? '',
      price: String(product.price ?? ''),
      stock: String(product.stock ?? ''),
      categoryId: String(product.categoryId ?? ''),
      shippingFee: String(product.shippingFee ?? '0'),
      freeShippingThreshold: String(product.freeShippingThreshold ?? ''),
      deliveryType: (product.deliveryType as DeliveryType) ?? 'STANDARD',
      detailContent: product.detailContent ?? '',
    });
    setProductImage(null);
    setDetailImageFiles([]);
    fetchDetailImages(product.productId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductLoading(true);
    try {
      const payload = {
        name: productForm.name,
        description: productForm.description,
        price: Number(productForm.price),
        stock: Number(productForm.stock),
        categoryId: productForm.categoryId ? Number(productForm.categoryId) : null,
        shippingFee: Number(productForm.shippingFee) || 0,
        freeShippingThreshold: productForm.freeShippingThreshold ? Number(productForm.freeShippingThreshold) : null,
        deliveryType: productForm.deliveryType,
        detailContent: productForm.detailContent || undefined,
      };

      let savedProductId: number;
      if (editProductId !== null) {
        await adminProductApi.updateProduct(editProductId, payload);
        savedProductId = editProductId;
      } else {
        const res = await adminProductApi.createProduct(payload);
        savedProductId = res.data?.data?.productId ?? res.data?.data?.id;
      }

      // 대표 이미지 업로드
      if (productImage && savedProductId) {
        await adminProductApi.uploadProductImage(savedProductId, productImage);
      }

      // 상세 이미지 업로드
      for (const file of detailImageFiles) {
        await adminProductApi.addDetailImage(savedProductId, file);
      }

      setProductForm(defaultProductForm);
      setProductImage(null);
      setDetailImageFiles([]);
      setEditProductId(null);
      setExistingDetailImages([]);
      await fetchProducts();
      alert(editProductId !== null ? '상품이 수정되었습니다.' : '상품이 등록되었습니다.');
    } catch { alert('처리 중 오류가 발생했습니다.'); }
    setProductLoading(false);
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!window.confirm('상품을 삭제할까요?')) return;
    try {
      await adminProductApi.deleteProduct(productId);
      await fetchProducts();
    } catch { }
  };

  const handleDeleteDetailImage = async (imageId: number) => {
    if (!editProductId) return;
    try {
      await adminProductApi.deleteDetailImage(editProductId, imageId);
      await fetchDetailImages(editProductId);
    } catch { }
  };

  const handleDetailImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setDetailImageFiles(prev => [...prev, ...files]);
  };

  // ── 공지 핸들러 ──
  const handleNoticeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editNoticeId) {
        await adminNoticeApi.updateNotice(editNoticeId, { title: noticeTitle, content: noticeContent });
      } else {
        await adminNoticeApi.createNotice({ title: noticeTitle, content: noticeContent });
      }
      setNoticeTitle(''); setNoticeContent(''); setEditNoticeId(null);
      fetchNotices();
    } catch { }
  };

  const handleDeleteNotice = async (id: number) => {
    try { await adminNoticeApi.deleteNotice(id); fetchNotices(); } catch { }
  };

  const handleEditNotice = (notice: any) => {
    setEditNoticeId(notice.id); setNoticeTitle(notice.title); setNoticeContent(notice.content);
  };

  // ── 입영/연기 핸들러 ──
  const handleApproveEnlist = async (id: number) => {
    try { await enlistmentApi.approveApplication(id); fetchLists(); } catch { }
  };
  const handleApproveDefer = async (id: number) => {
    try { await enlistmentApi.processDeferment(id, { decisionStatus: 'APPROVED' }); fetchLists(); } catch { }
  };
  const handleRejectDefer = async (id: number) => {
    try { await enlistmentApi.processDeferment(id, { decisionStatus: 'REJECTED' }); fetchLists(); } catch { }
  };

  // ── 배너 핸들러 ──
  const fetchBanners = async () => {
    setBannerLoading(true);
    try {
      const res = await bannerApi.getAllBanners();
      setBanners(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch { }
    setBannerLoading(false);
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setBannerForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked
        : name === 'orderIndex' ? Number(value) : value,
    }));
  };

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
      setBannerImage(null); setEditBannerId(null);
      await fetchBanners();
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: { message?: string } }; message?: string };
      setBannerError(`저장 실패: ${err.response?.data?.message ?? err.message ?? ''}`);
    }
    setBannerLoading(false);
  };

  const handleEditBanner = (banner: BannerResponse) => {
    setEditBannerId(banner.id);
    setBannerForm({ badge: banner.badge, title: banner.title, subtitle: banner.subtitle, ctaText: banner.ctaText, ctaPath: banner.ctaPath, accentColor: banner.accentColor, orderIndex: banner.orderIndex, isActive: banner.isActive });
    setBannerImage(null);
  };

  const handleDeleteBanner = async (id: number) => {
    if (!window.confirm('배너를 삭제할까요?')) return;
    try { await bannerApi.deleteBanner(id); await fetchBanners(); } catch { }
  };

  // 카테고리 플랫 리스트 (select용)
  const flatCategories: CategoryResponse[] = [];
  const flattenCats = (cats: CategoryResponse[], depth = 0) => {
    cats.forEach(c => {
      flatCategories.push({ ...c, name: depth > 0 ? `${'　'.repeat(depth)}└ ${c.name}` : c.name });
      if (c.children?.length) flattenCats(c.children, depth + 1);
    });
  };
  flattenCats(categories);

  return (
    <>
      <Header />
      <div className="admin-dashboard-wrapper">

        {/* ══ 왼쪽: 대시보드 요약 ══ */}
        <div className="admin-dashboard-left admin-dashboard-section">
          <div className="section-header">
            <h2 className="section-title">대시보드</h2>
            <p className="section-subtitle">현황 요약 및 접수 상태</p>
          </div>
          <div className="dashboard-block">
            <h4 className="block-title">전체 요약</h4>
            {dashboardSummary ? (
              <div className="table-scroll">
                <table className="dashboard-table"><tbody>
                  <tr><th>총 유저 수</th><td>{dashboardSummary.totalUsers}</td></tr>
                  <tr><th>입영 확정</th><td>{dashboardSummary.confirmedEnlistments}</td></tr>
                  <tr><th>입영 신청</th><td>{dashboardSummary.requestedEnlistments}</td></tr>
                  <tr><th>잔여 슬롯</th><td>{dashboardSummary.totalRemainingSlots}</td></tr>
                </tbody></table>
              </div>
            ) : '로딩 중...'}
          </div>
        </div>

        {/* ══ 오른쪽 ══ */}
        <div className="admin-dashboard-right admin-dashboard-section">

          {/* ── 카테고리 관리 ── */}
          <div className="section-header">
            <h3 className="section-title">카테고리 관리</h3>
            <p className="section-subtitle">상품 카테고리 등록 / 삭제</p>
          </div>
          <form onSubmit={handleCategorySubmit} className="notice-form">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input className="notice-input" placeholder="카테고리명 *" value={categoryForm.name}
                onChange={e => setCategoryForm(p => ({ ...p, name: e.target.value }))} required />
              <input className="notice-input" placeholder="설명 *" value={categoryForm.description}
                onChange={e => setCategoryForm(p => ({ ...p, description: e.target.value }))} required />
            </div>
            <select className="notice-input" value={categoryForm.parentId}
              onChange={e => setCategoryForm(p => ({ ...p, parentId: e.target.value }))}
              style={{ marginTop: 8 }}>
              <option value="">최상위 카테고리</option>
              {flatCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="notice-actions">
              <button type="submit" className="btn-primary" disabled={categoryLoading}>
                {categoryLoading ? '등록 중...' : '카테고리 등록'}
              </button>
            </div>
          </form>
          {categoryLoading ? <div>로딩 중...</div> : (
            <div className="table-scroll">
              <table className="dashboard-table">
                <thead><tr><th>ID</th><th>이름</th><th>설명</th><th>상위</th><th>관리</th></tr></thead>
                <tbody>
                  {categories.flatMap(cat => {
                    const rows = [
                      <tr key={cat.id}>
                        <td>{cat.id}</td><td>{cat.name}</td><td>{cat.description}</td>
                        <td>-</td>
                        <td><button onClick={() => handleDeleteCategory(cat.id)}>삭제</button></td>
                      </tr>
                    ];
                    cat.children?.forEach(child => rows.push(
                      <tr key={child.id} style={{ background: '#f9f9f9' }}>
                        <td>{child.id}</td><td style={{ paddingLeft: 20 }}>└ {child.name}</td>
                        <td>{child.description}</td><td>{cat.name}</td>
                        <td><button onClick={() => handleDeleteCategory(child.id)}>삭제</button></td>
                      </tr>
                    ));
                    return rows;
                  })}
                  {categories.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: '#aaa' }}>등록된 카테고리가 없습니다</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* ── 상품 목록 ── */}
          <div className="section-header" style={{ marginTop: 36 }}>
            <h3 className="section-title">상품 목록</h3>
            <p className="section-subtitle">수정 버튼을 누르면 아래 폼에 자동 입력됩니다</p>
          </div>
          {productListLoading ? <div>로딩 중...</div> : (
            <div className="table-scroll">
              <table className="dashboard-table">
                <thead><tr><th>ID</th><th>상품명</th><th>가격</th><th>재고</th><th>카테고리</th><th>배송비</th><th>관리</th></tr></thead>
                <tbody>
                  {products.map((p: any) => (
                    <tr key={p.productId} style={{ background: editProductId === p.productId ? '#f0f4ff' : undefined }}>
                      <td>{p.productId}</td>
                      <td>{p.name}</td>
                      <td>{p.price?.toLocaleString()}원</td>
                      <td>{p.stock}</td>
                      <td>{p.categoryName ?? '-'}</td>
                      <td>{p.shippingFee === 0 ? '무료' : `${p.shippingFee?.toLocaleString()}원`}</td>
                      <td>
                        <button onClick={() => handleEditProduct(p)} style={{ marginRight: 4 }}>수정</button>
                        <button onClick={() => handleDeleteProduct(p.productId)}>삭제</button>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: '#aaa' }}>상품이 없습니다</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* ── 상품 등록/수정 폼 ── */}
          <div className="section-header" style={{ marginTop: 36 }}>
            <h3 className="section-title">{editProductId ? `상품 수정 (ID: ${editProductId})` : '상품 등록'}</h3>
            <p className="section-subtitle">{editProductId ? '내용을 수정하고 저장하세요' : '신규 상품 추가'}</p>
          </div>
          <form onSubmit={handleProductSubmit} className="notice-form">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input className="notice-input" name="name" placeholder="상품명 *"
                value={productForm.name} onChange={handleProductChange} required />
              <select className="notice-input" name="categoryId"
                value={productForm.categoryId} onChange={handleProductChange}>
                <option value="">카테고리 선택</option>
                {flatCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input className="notice-input" name="price" type="number" placeholder="가격 *"
                value={productForm.price} onChange={handleProductChange} required />
              <input className="notice-input" name="stock" type="number" placeholder="재고 *"
                value={productForm.stock} onChange={handleProductChange} required />
              <input className="notice-input" name="shippingFee" type="number" placeholder="배송비 (0=무료)"
                value={productForm.shippingFee} onChange={handleProductChange} />
              <input className="notice-input" name="freeShippingThreshold" type="number" placeholder="무료배송 기준금액"
                value={productForm.freeShippingThreshold} onChange={handleProductChange} />
              <select className="notice-input" name="deliveryType"
                value={productForm.deliveryType} onChange={handleProductChange}>
                {(Object.entries(DELIVERY_LABELS) as [DeliveryType, string][]).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <textarea className="notice-textarea" name="description" placeholder="상품 간단 설명 *"
              value={productForm.description} onChange={handleProductChange} rows={3} required />
            <label style={{ fontSize: 13, color: '#555', marginTop: 8, display: 'block' }}>
              상세 내용 (HTML 입력 가능)
            </label>
            <textarea className="notice-textarea" name="detailContent"
              placeholder="상품 상세 설명을 입력하세요. HTML 태그 사용 가능합니다."
              value={productForm.detailContent} onChange={handleProductChange} rows={8} />

            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 13, color: '#555' }}>대표 이미지</label>
              <input type="file" accept="image/*" className="notice-input" style={{ marginTop: 4 }}
                onChange={e => setProductImage(e.target.files?.[0] ?? null)} />
            </div>
            <div style={{ marginTop: 8 }}>
              <label style={{ fontSize: 13, color: '#555' }}>상세 이미지 추가 (여러 장 선택 가능)</label>
              <input type="file" accept="image/*" multiple className="notice-input" style={{ marginTop: 4 }}
                onChange={handleDetailImageSelect} />
              {detailImageFiles.length > 0 && (
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  선택된 파일: {detailImageFiles.map(f => f.name).join(', ')}
                </div>
              )}
            </div>

            {/* 기존 상세 이미지 (수정 모드) */}
            {editProductId !== null && existingDetailImages.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 8 }}>
                  등록된 상세 이미지
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {existingDetailImages.map(img => (
                    <div key={img.id} style={{ position: 'relative' }}>
                      <img src={img.imageUrl} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd' }} />
                      <button type="button" onClick={() => handleDeleteDetailImage(img.id)}
                        style={{ position: 'absolute', top: -6, right: -6, background: '#c62828', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: 12, lineHeight: 1 }}>
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="notice-actions" style={{ marginTop: 16 }}>
              <button type="submit" className="btn-primary" disabled={productLoading}>
                {productLoading ? '처리 중...' : editProductId ? '수정 완료' : '상품 등록'}
              </button>
              {editProductId !== null && (
                <button type="button" className="btn-ghost" onClick={() => {
                  setEditProductId(null); setProductForm(defaultProductForm);
                  setProductImage(null); setDetailImageFiles([]); setExistingDetailImages([]);
                }}>취소</button>
              )}
            </div>
          </form>

          {/* ── 공지사항 관리 ── */}
          <div className="section-header" style={{ marginTop: 36 }}>
            <h3 className="section-title">공지사항 관리</h3>
            <p className="section-subtitle">등록/수정/삭제</p>
          </div>
          <form onSubmit={handleNoticeSubmit} className="notice-form">
            <input type="text" placeholder="제목" value={noticeTitle} onChange={e => setNoticeTitle(e.target.value)} className="notice-input" required />
            <textarea placeholder="내용" value={noticeContent} onChange={e => setNoticeContent(e.target.value)} className="notice-textarea" required />
            <div className="notice-actions">
              <button type="submit" className="btn-primary">{editNoticeId ? '수정' : '등록'}</button>
              {editNoticeId && <button type="button" className="btn-ghost" onClick={() => { setEditNoticeId(null); setNoticeTitle(''); setNoticeContent(''); }}>취소</button>}
            </div>
          </form>
          {noticeLoading ? <div>로딩 중...</div> : (
            <div className="table-scroll">
              <table className="dashboard-table notice-table">
                <thead><tr><th>ID</th><th>제목</th><th>내용</th><th>관리</th></tr></thead>
                <tbody>
                  {notices.map(notice => (
                    <tr key={notice.id}>
                      <td>{notice.id}</td><td>{notice.title}</td><td>{notice.content}</td>
                      <td>
                        <button onClick={() => handleEditNotice(notice)}>수정</button>
                        <button onClick={() => handleDeleteNotice(notice.id)} style={{ marginLeft: 4 }}>삭제</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── 입영 신청 ── */}
          <h3 style={{ marginTop: 28 }}>입영 신청 리스트</h3>
          {loading ? <div>로딩 중...</div> : (
            <div className="table-scroll">
              <table className="dashboard-table">
                <thead><tr><th>입영일</th><th>유저</th><th>상태</th><th>신청일</th><th>처리</th></tr></thead>
                <tbody>
                  {enlistments.map(app => (
                    <tr key={app.applicationId}>
                      <td>{app.enlistmentDate}</td><td>{app.userName}</td>
                      <td>{app.status}</td><td>{app.createdAt}</td>
                      <td>{app.status !== 'APPROVED' && <button onClick={() => handleApproveEnlist(app.applicationId)}>확인 처리</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── 연기 신청 ── */}
          <h3 style={{ marginTop: 20 }}>연기 신청 리스트</h3>
          {loading ? <div>로딩 중...</div> : (
            <div className="table-scroll">
              <table className="dashboard-table">
                <thead><tr><th>연기ID</th><th>유저</th><th>사유</th><th>신청일</th><th>처리</th></tr></thead>
                <tbody>
                  {deferments.map(app => (
                    <tr key={app.defermentsId}>
                      <td>{app.defermentsId}</td><td>{app.username}</td>
                      <td>{app.reason}</td><td>{app.createdAt}</td>
                      <td>
                        {app.decisionStatus !== 'APPROVED' && <>
                          <button onClick={() => handleApproveDefer(app.defermentsId)}>승인</button>
                          <button onClick={() => handleRejectDefer(app.defermentsId)} style={{ marginLeft: 4 }}>반려</button>
                        </>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── 배너 관리 ── */}
          <div className="section-header" style={{ marginTop: 36 }}>
            <h3 className="section-title">배너 관리</h3>
            <p className="section-subtitle">홈 화면 배너 등록 / 수정 / 삭제</p>
          </div>
          {bannerError && <div style={{ background: '#fff3f3', border: '1px solid #f5c2c2', color: '#c62828', padding: '10px 14px', borderRadius: 4, marginBottom: 12, fontSize: 13 }}>⚠️ {bannerError}</div>}
          {bannerLoading ? <div>로딩 중...</div> : (
            <div className="table-scroll">
              <table className="dashboard-table">
                <thead><tr><th>순서</th><th>배지</th><th>제목</th><th>경로</th><th>이미지</th><th>활성</th><th>관리</th></tr></thead>
                <tbody>
                  {banners.map(banner => (
                    <tr key={banner.id}>
                      <td>{banner.orderIndex}</td>
                      <td><span style={{ background: banner.accentColor, color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>{banner.badge}</span></td>
                      <td>{banner.title}</td>
                      <td style={{ fontSize: 12, color: '#666' }}>{banner.ctaPath}</td>
                      <td>{banner.imageUrl ? <img src={banner.imageUrl} alt="" style={{ width: 60, height: 30, objectFit: 'cover', borderRadius: 3 }} /> : <span style={{ color: '#aaa', fontSize: 11 }}>없음</span>}</td>
                      <td><span style={{ color: banner.isActive ? '#2e7d32' : '#c62828', fontWeight: 700, fontSize: 12 }}>{banner.isActive ? '활성' : '비활성'}</span></td>
                      <td>
                        <button onClick={() => handleEditBanner(banner)} style={{ marginRight: 4 }}>수정</button>
                        <button onClick={() => handleDeleteBanner(banner.id)}>삭제</button>
                      </td>
                    </tr>
                  ))}
                  {banners.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: '#aaa' }}>배너가 없습니다</td></tr>}
                </tbody>
              </table>
            </div>
          )}
          <form onSubmit={handleBannerSubmit} className="notice-form" style={{ marginTop: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input name="badge" placeholder="배지 텍스트" value={bannerForm.badge} onChange={handleBannerChange} className="notice-input" required />
              <input name="accentColor" type="color" value={bannerForm.accentColor} onChange={handleBannerChange} className="notice-input" />
              <input name="title" placeholder="제목" value={bannerForm.title} onChange={handleBannerChange} className="notice-input" required />
              <input name="ctaText" placeholder="버튼 텍스트" value={bannerForm.ctaText} onChange={handleBannerChange} className="notice-input" required />
              <input name="ctaPath" placeholder="버튼 경로" value={bannerForm.ctaPath} onChange={handleBannerChange} className="notice-input" required />
              <input name="orderIndex" type="number" placeholder="순서" value={bannerForm.orderIndex} onChange={handleBannerChange} className="notice-input" min={0} />
            </div>
            <textarea name="subtitle" placeholder="부제목" value={bannerForm.subtitle} onChange={handleBannerChange} className="notice-textarea" rows={2} />
            <div className="notice-actions" style={{ alignItems: 'center', gap: 12 }}>
              <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" name="isActive" checked={bannerForm.isActive} onChange={handleBannerChange} /> 활성화
              </label>
              <label style={{ fontSize: 13 }}>배너 이미지 <input type="file" accept="image/*" style={{ marginLeft: 8 }} onChange={e => setBannerImage(e.target.files?.[0] ?? null)} /></label>
              <button type="submit" className="btn-primary" disabled={bannerLoading}>{bannerLoading ? '처리 중...' : editBannerId !== null ? '수정 완료' : '배너 등록'}</button>
              {editBannerId !== null && <button type="button" className="btn-ghost" onClick={() => { setEditBannerId(null); setBannerForm({ badge: '', title: '', subtitle: '', ctaText: '', ctaPath: '', accentColor: '#003087', orderIndex: 0, isActive: true }); setBannerImage(null); }}>취소</button>}
            </div>
          </form>

        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
