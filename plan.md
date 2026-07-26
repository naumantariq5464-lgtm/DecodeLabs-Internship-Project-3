# 📚 AI Book Recommendation System

## 📖 Project Overview

The AI Book Recommendation System recommends books based on user ratings using Collaborative Filtering. The system analyzes historical user ratings to recommend books that users with similar interests have enjoyed.

This project is developed as an introductory AI Recommendation System using the Book-Crossing Dataset.

---

# 🎯 Objective

- Build an AI-based Book Recommendation System.
- Recommend books based on user preferences and ratings.
- Learn Collaborative Filtering.
- Understand Recommendation Systems.

---

# 🛠 Tech Stack

## Frontend
- HTML5
- CSS3
- JavaScript

## Backend
- FastAPI
- Python

## Libraries
- Pandas
- NumPy
- Scikit-learn
- SciPy
- Uvicorn

---

# 📂 Project Structure

```
Book-Recommendation-System/

│── backend/
│     │── main.py
│     │── recommender.py
│     │── preprocess.py
│     │── model.py
│     │
│     ├── dataset/
│     │      Books.csv
│     │      Ratings.csv
│     │      Users.csv
│     │
│     └── requirements.txt
│
│── frontend/
│     │── index.html
│     │── style.css
│     │── script.js
│
└── README.md
```

---

# 📊 Dataset

The project uses the Book-Crossing Dataset.

## 1. Books.csv

Contains information about books.

Columns:

- ISBN
- Book-Title
- Book-Author
- Year-Of-Publication
- Publisher
- Image-URL-S
- Image-URL-M
- Image-URL-L

Purpose:

Used to display book information after recommendation.

---

## 2. Ratings.csv

Contains user ratings.

Columns:

- User-ID
- ISBN
- Book-Rating

Purpose:

This is the most important dataset.

The recommendation engine learns which books users like.

---

## 3. Users.csv

Contains user information.

Columns:

- User-ID
- Location
- Age

Purpose:

Currently optional.

Can be used later for personalized recommendations.

---

# 🧠 Recommendation Algorithm

Recommendation Technique:

✅ Collaborative Filtering

Algorithm:

- User-Item Matrix
- Cosine Similarity

Future Upgrade:

- Matrix Factorization
- SVD
- Neural Collaborative Filtering

---

# ⚙ Project Workflow

```
Load Dataset

↓

Clean Missing Values

↓

Merge Books + Ratings

↓

Create User-Book Matrix

↓

Calculate Cosine Similarity

↓

User Searches Book

↓

Find Similar Books

↓

Return Top 5 Recommendations

↓

Display Results
```

---

# 🌐 Frontend

## Home Page

Contains

- Project Title
- Search Book
- Recommend Button

---

## Recommendation Page

Each recommendation card displays:

- Book Cover
- Book Title
- Author
- Publisher
- Publication Year

---

# 👨‍💻 User Flow

```
User Opens Website

↓

Searches Book Name

↓

Clicks Recommend

↓

FastAPI Receives Request

↓

Recommendation Engine

↓

Collaborative Filtering

↓

Top 5 Similar Books

↓

Display Results
```

---

# 🔌 Backend APIs

## GET /

Returns

```
API Running Successfully
```

---

## POST /recommend

Request

```json
{
    "book_name":"Harry Potter"
}
```

Response

```json
[
    {
        "title":"Harry Potter and the Chamber of Secrets",
        "author":"J.K. Rowling",
        "publisher":"Bloomsbury",
        "image":"image_url"
    }
]
```

---

# 📋 Development Plan

## Phase 1 — Dataset Preparation

- Load Books.csv
- Load Ratings.csv
- Load Users.csv
- Remove duplicate books
- Handle missing values

---

## Phase 2 — Data Preprocessing

- Merge Books and Ratings
- Remove inactive users
- Remove unpopular books
- Create User-Book Matrix

---

## Phase 3 — Recommendation Engine

- Calculate Cosine Similarity
- Find nearest books
- Return Top 5 recommendations

---

## Phase 4 — Backend

- Build FastAPI
- Create Recommendation API
- Return JSON response

---

## Phase 5 — Frontend

- Design UI
- Search Bar
- Recommendation Cards
- Loading Animation
- Error Handling

---

# 🎨 Frontend Features

- Responsive Design
- Search Book
- Modern Cards
- Book Cover Images
- Mobile Friendly
- Loading Spinner
- Error Messages

---

# 🚀 Future Improvements

- User Login
- Favorite Books
- Rating Books
- Reading History
- Genre Filters
- Recently Viewed Books
- AI Chatbot
- Personalized Dashboard

---

# 📚 Learning Outcomes

After completing this project you will understand:

- Recommendation Systems
- Collaborative Filtering
- User-Item Matrix
- Cosine Similarity
- Dataset Preprocessing
- FastAPI
- REST APIs
- Frontend + Backend Integration

---

# ✅ Final Output

The user searches for a book.

↓

The system searches similar user preferences using ratings.

↓

The recommendation engine finds similar books.

↓

Top 5 books are returned.

↓

The books are displayed with cover image, title, author, and publisher in a clean user interface.