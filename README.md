# 📚 AI Book Recommendation System

An intelligent, full-stack Book Recommendation Engine built using **Collaborative Filtering**, **Cosine Similarity**, **FastAPI**, and a high-aesthetic **Glassmorphic Web Frontend**.

Powered by the **Book-Crossing Dataset** (over 1 Million ratings across 270,000+ books).

---

## 🌟 Key Features

- **Collaborative Filtering Engine**: Recommends books by calculating user-item rating matrix cosine similarity.
- **FastAPI REST Server**: Fast, asynchronous backend powering recommendation queries, popular books, and search autocomplete.
- **Real-Time Autocomplete Search**: Debounced live title suggestions as you type.
- **Top Trending / Popular Showcase**: Displays community top-rated books upon page load.
- **Interactive Modern UI**: Built with HTML5, CSS3 glassmorphism, responsive grid layout, micro-animations, quick-view modals, and toast notifications.
- **Book Cover Display**: Automatic image cover loading with fallback placeholders.

---

## 📂 Project Architecture

```
Book Recomendations System/
│── backend/
│     │── dataset/
│     │      ├── Books.csv
│     │      ├── Ratings.csv
│     │      └── Users.csv
│     │── main.py            # FastAPI REST endpoints
│     │── preprocess.py      # Data cleaning & matrix construction
│     │── recommender.py     # Similarity lookup & recommendation engine
│     │── requirements.txt   # Python dependencies
│     └── *.pkl              # Serialized model & dataset artifacts
│
│── frontend/
│     │── index.html         # HTML5 User Interface
│     │── style.css          # Modern CSS styling & glassmorphism theme
│     └── script.js          # Dynamic UI interactions & API integration
│
│── plan.md                  # Project blueprint
└── README.md                # Documentation & startup guide
```

---

## 🚀 Quick Start Guide

### Step 1: Clone & Setup Environment

Ensure Python 3.10+ is installed.

```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment (Windows PowerShell)
.venv\Scripts\Activate.ps1

# Install required packages
pip install -r backend/requirements.txt
```

### Step 2: Preprocess Dataset & Generate Model Artifacts

Run the data preprocessing pipeline to build the Collaborative Filtering User-Book matrix and cosine similarity scores:

```bash
python backend/preprocess.py
```

This generates `popular.pkl`, `pt.pkl`, `books.pkl`, and `similarity_scores.pkl` inside the `backend/` folder.

### Step 3: Start the Backend API Server

Start the FastAPI server using Uvicorn:

```bash
python -m uvicorn backend.main:app --reload --port 8000
```

The API will be live at: `http://localhost:8000`
- Interactive API Docs (Swagger UI): `http://localhost:8000/docs`

### Step 4: Launch the Frontend Web App

Simply open `frontend/index.html` in any web browser (or serve via Live Server / standard HTTP server).

---

## 🔌 API Documentation

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API status health check |
| `GET` | `/api/popular` | Returns list of top-rated popular books |
| `GET` | `/api/search?q={query}` | Search book titles for live autocomplete |
| `POST` | `/recommend` | Accepts `{"book_name": "Title"}` & returns top 5 recommendations |

### Example POST Request Payload:

```json
{
  "book_name": "Harry Potter and the Chamber of Secrets"
}
```

### Example Response:

```json
{
  "status": "success",
  "query_book": {
    "title": "Harry Potter and the Chamber of Secrets",
    "author": "J.K. Rowling",
    "publisher": "Scholastic",
    "year": "1999"
  },
  "recommendations": [
    {
      "title": "Harry Potter and the Prisoner of Azkaban",
      "author": "J.K. Rowling",
      "publisher": "Scholastic",
      "year": "1999",
      "similarity_score": 0.8421
    }
  ]
}
```

---

## 🧠 Recommendation Algorithm Details

1. **Filtering Dense Matrix**:
   - Filter users with **> 200 ratings** to isolate active readers.
   - Filter books with **>= 50 ratings** from active readers to remove sparse entries.
2. **User-Item Matrix Creation**:
   - Transform filtered ratings into a Pivot Matrix ($Books \times Users$) filled with user rating values ($0-10$).
3. **Cosine Similarity Computation**:
   - Compute pairwise cosine similarity between book rating vectors:
     $$\text{Similarity}(A, B) = \frac{A \cdot B}{\|A\| \|B\|}$$
4. **Top Nearest Neighbors Retrieval**:
   - Given a query book vector, sort similarity scores in descending order and return top $N$ non-identical matching books.

---

## 🎨 Tech Stack

- **Backend**: Python 3.13, FastAPI, Uvicorn, Pandas, NumPy, Scikit-Learn, SciPy
- **Frontend**: HTML5, CSS3 (Vanilla CSS, Glassmorphism, Google Fonts, FontAwesome), JavaScript (ES6 fetch API, async/await)
