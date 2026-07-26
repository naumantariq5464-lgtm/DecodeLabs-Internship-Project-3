/**
 * BookWise AI - Frontend JavaScript Engine
 * Handles API calls, Autocomplete, Recommendation rendering, Modal views, and Toasts
 */

const API_BASE_URL = 'http://localhost:8000';

// State Management
let currentQueryBook = null;
let currentRecommendations = [];
let autocompleteTimeout = null;

// DOM Elements
const searchInput = document.getElementById('book-search-input');
const recommendBtn = document.getElementById('recommend-btn');
const autocompleteList = document.getElementById('autocomplete-list');
const popularGrid = document.getElementById('popular-books-grid');
const recSection = document.getElementById('recommendations-section');
const recQueryLabel = document.getElementById('recommendation-query-label');
const recGrid = document.getElementById('recommendations-grid');
const spotlightCard = document.getElementById('searched-book-spotlight');
const clearRecBtn = document.getElementById('clear-rec-btn');
const navRecLink = document.getElementById('nav-rec-link');

const apiStatusBadge = document.getElementById('api-status-badge');
const apiStatusText = document.getElementById('api-status-text');

const modal = document.getElementById('book-modal');
const modalBody = document.getElementById('modal-body');
const closeModalBtn = document.getElementById('close-modal-btn');
const toastContainer = document.getElementById('toast-container');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    checkApiStatus();
    loadPopularBooks();
    setupEventListeners();
});

// Check API Health
async function checkApiStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/`);
        if (response.ok) {
            apiStatusBadge.querySelector('.status-dot').className = 'status-dot online';
            apiStatusText.textContent = 'AI Engine Online';
        } else {
            throw new Error('API offline');
        }
    } catch (err) {
        apiStatusBadge.querySelector('.status-dot').className = 'status-dot offline';
        apiStatusText.textContent = 'Engine Connecting...';
        console.warn('Backend API connection warning:', err);
    }
}

// Fetch & Render Popular Books
async function loadPopularBooks() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/popular?limit=24`);
        if (!res.ok) throw new Error('Failed to fetch popular books');
        
        const data = await res.json();
        if (data.books && data.books.length > 0) {
            renderPopularBooks(data.books);
        } else {
            popularGrid.innerHTML = '<p class="text-muted">No popular books found.</p>';
        }
    } catch (err) {
        console.error(err);
        popularGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem;">
                <p style="color: var(--text-muted);">Failed to connect to backend server. Make sure FastAPI server is running on port 8000.</p>
                <button onclick="loadPopularBooks()" class="btn btn-secondary btn-sm" style="margin-top: 1rem;">
                    <i class="fa-solid fa-rotate"></i> Retry Connection
                </button>
            </div>
        `;
    }
}

function renderPopularBooks(books) {
    popularGrid.innerHTML = books.map(book => createBookCardHTML(book, false)).join('');
    attachCardClickEvents(popularGrid, books);
}

// Helper: Generate Book Card HTML
function createBookCardHTML(book, isRecommendation = false) {
    const fallbackIcon = `<div class="book-fallback-cover"><i class="fa-solid fa-book-open"></i><span>No Cover</span></div>`;
    const coverHTML = book.image && book.image.trim() !== ''
        ? `<img src="${fixImageUrl(book.image)}" alt="${escapeHtml(book.title)}" class="book-cover" onerror="this.onerror=null; this.parentNode.innerHTML='${escapeHtml(fallbackIcon)}';" />`
        : fallbackIcon;

    const simBadgeHTML = isRecommendation && book.similarity_score
        ? `<div class="badge-similarity"><i class="fa-solid fa-sparkles"></i> ${book.similarity_score.toFixed(0)}% Match</div>`
        : '';

    const ratingBadgeHTML = book.avg_rating
        ? `<div class="badge-rating"><i class="fa-solid fa-star"></i> ${book.avg_rating} <span style="opacity:0.75; font-size:0.7rem;">(${book.num_ratings})</span></div>`
        : '';

    return `
        <div class="book-card" data-title="${escapeHtml(book.title)}">
            <div class="book-cover-wrap">
                ${coverHTML}
                ${simBadgeHTML}
                ${ratingBadgeHTML}
            </div>
            <div class="book-details">
                <h3 class="book-title" title="${escapeHtml(book.title)}">${escapeHtml(book.title)}</h3>
                <p class="book-author"><i class="fa-solid fa-pen-nib"></i> ${escapeHtml(book.author || 'Unknown Author')}</p>
                <div class="book-meta">
                    <span>${escapeHtml(book.publisher || 'Publisher N/A')}</span>
                    <span>${escapeHtml(book.year || '')}</span>
                </div>
            </div>
        </div>
    `;
}

function fixImageUrl(url) {
    if (!url) return '';
    if (url.startsWith('http://')) {
        return url.replace('http://', 'https://');
    }
    return url;
}

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
}

// Event Listeners Setup
function setupEventListeners() {
    // Autocomplete input
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        clearTimeout(autocompleteTimeout);
        
        if (query.length < 2) {
            hideAutocomplete();
            return;
        }

        autocompleteTimeout = setTimeout(() => {
            fetchAutocomplete(query);
        }, 250);
    });

    // Handle Enter Key inside search box
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            hideAutocomplete();
            const query = searchInput.value.trim();
            if (query) triggerRecommendation(query);
        }
    });

    // Recommend Button
    recommendBtn.addEventListener('click', () => {
        hideAutocomplete();
        const query = searchInput.value.trim();
        if (query) {
            triggerRecommendation(query);
        } else {
            showToast('Please enter a book title to search', 'error');
        }
    });

    // Quick Tags
    document.querySelectorAll('.quick-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            const title = tag.getAttribute('data-title');
            searchInput.value = title;
            triggerRecommendation(title);
        });
    });

    // Clear Recommendations Button
    clearRecBtn.addEventListener('click', () => {
        recSection.classList.add('hidden');
        navRecLink.style.display = 'none';
        searchInput.value = '';
    });

    // Close Modal
    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Document click to close autocomplete
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !autocompleteList.contains(e.target)) {
            hideAutocomplete();
        }
    });
}

// Fetch Autocomplete Suggestions
async function fetchAutocomplete(query) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) return;
        
        const data = await res.json();
        if (data.results && data.results.length > 0) {
            renderAutocomplete(data.results);
        } else {
            hideAutocomplete();
        }
    } catch (err) {
        console.error('Autocomplete fetch error:', err);
    }
}

function renderAutocomplete(titles) {
    autocompleteList.innerHTML = titles.map(title => `
        <div class="autocomplete-item" data-title="${escapeHtml(title)}">
            <i class="fa-solid fa-book"></i>
            <span>${escapeHtml(title)}</span>
        </div>
    `).join('');

    autocompleteList.classList.remove('hidden');

    autocompleteList.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('click', () => {
            const selectedTitle = item.getAttribute('data-title');
            searchInput.value = selectedTitle;
            hideAutocomplete();
            triggerRecommendation(selectedTitle);
        });
    });
}

function hideAutocomplete() {
    autocompleteList.classList.add('hidden');
}

// Main Recommendation Logic
async function triggerRecommendation(bookTitle) {
    recommendBtn.disabled = true;
    recommendBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i><span>Analyzing...</span>`;

    try {
        const response = await fetch(`${API_BASE_URL}/recommend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ book_name: bookTitle })
        });

        const data = await response.json();

        if (response.ok && data.status === 'success') {
            displayRecommendations(data);
            showToast(`Found ${data.recommendations.length} recommendations!`);
        } else {
            showToast(data.message || 'Book not found in collaborative model matrix.', 'error');
        }
    } catch (err) {
        console.error('Recommendation API error:', err);
        showToast('Failed to reach backend recommendation server.', 'error');
    } finally {
        recommendBtn.disabled = false;
        recommendBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i><span>Recommend</span>`;
    }
}

function displayRecommendations(data) {
    const { query_book, recommendations } = data;
    currentQueryBook = query_book;
    currentRecommendations = recommendations;

    // Show spotlight card for query book
    const fallbackIcon = `<div class="book-fallback-cover"><i class="fa-solid fa-book-open"></i><span>No Cover</span></div>`;
    const coverHTML = query_book.image && query_book.image.trim() !== ''
        ? `<img src="${fixImageUrl(query_book.image)}" alt="${escapeHtml(query_book.title)}" class="spotlight-cover" />`
        : fallbackIcon;

    spotlightCard.innerHTML = `
        ${coverHTML}
        <div class="spotlight-info">
            <div class="spotlight-tag"><i class="fa-solid fa-magnifying-glass"></i> Selected Query Book</div>
            <h3 class="spotlight-title">${escapeHtml(query_book.title)}</h3>
            <p class="spotlight-author"><i class="fa-solid fa-user-pen"></i> ${escapeHtml(query_book.author)} &bull; ${escapeHtml(query_book.publisher)} (${escapeHtml(query_book.year)})</p>
            <p style="font-size:0.9rem; color:var(--text-muted);">Below are the top 5 books enjoyed by readers with similar taste profiles.</p>
        </div>
    `;
    spotlightCard.classList.remove('hidden');

    // Render recommendation grid
    recQueryLabel.textContent = `Showing 5 AI-matched books similar to "${query_book.title}"`;
    recGrid.innerHTML = recommendations.map(b => createBookCardHTML(b, true)).join('');

    attachCardClickEvents(recGrid, recommendations);

    recSection.classList.remove('hidden');
    navRecLink.style.display = 'flex';

    // Smooth scroll to recommendations section
    recSection.scrollIntoView({ behavior: 'smooth' });
}

// Attach Card Click Events for Modal Quick View
function attachCardClickEvents(container, bookList) {
    container.querySelectorAll('.book-card').forEach(card => {
        card.addEventListener('click', () => {
            const title = card.getAttribute('data-title');
            const bookObj = bookList.find(b => b.title === title);
            if (bookObj) openModal(bookObj);
        });
    });
}

// Modal Dialog Quick View
function openModal(book) {
    const coverHTML = book.image && book.image.trim() !== ''
        ? `<img src="${fixImageUrl(book.image)}" alt="${escapeHtml(book.title)}" style="width: 140px; height: 210px; object-fit: cover; border-radius: var(--radius-md); box-shadow: var(--shadow-card);" />`
        : `<div class="book-fallback-cover" style="width:140px; height:210px;"><i class="fa-solid fa-book-open"></i></div>`;

    const simInfo = book.similarity_score
        ? `<p style="margin-top: 0.5rem; color: var(--secondary); font-weight:600;"><i class="fa-solid fa-sparkles"></i> User Compatibility Match: ${book.similarity_score.toFixed(1)}%</p>`
        : '';

    modalBody.innerHTML = `
        <div style="display: flex; gap: 1.5rem; align-items: flex-start;">
            ${coverHTML}
            <div style="flex: 1;">
                <h2 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--text-main);">${escapeHtml(book.title)}</h2>
                <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 0.5rem;"><i class="fa-solid fa-pen-nib"></i> Author: <strong>${escapeHtml(book.author)}</strong></p>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 0.25rem;"><i class="fa-solid fa-building"></i> Publisher: ${escapeHtml(book.publisher)}</p>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 0.5rem;"><i class="fa-solid fa-calendar"></i> Year: ${escapeHtml(book.year)}</p>
                ${simInfo}
                <div style="margin-top: 1.5rem; display: flex; gap: 0.75rem;">
                    <button id="modal-recommend-btn" class="btn btn-primary btn-sm">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> Recommend Similar To This
                    </button>
                </div>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');

    document.getElementById('modal-recommend-btn').addEventListener('click', () => {
        closeModal();
        searchInput.value = book.title;
        triggerRecommendation(book.title);
    });
}

function closeModal() {
    modal.classList.add('hidden');
}

// Toast Notification Helper
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check';
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHtml(message)}</span>`;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
