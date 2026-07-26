import os
import pickle
from typing import List, Dict, Any

class RecommenderEngine:
    def __init__(self):
        backend_dir = os.path.dirname(__file__)
        self.popular_path = os.path.join(backend_dir, 'popular.pkl')
        self.books_path = os.path.join(backend_dir, 'books.pkl')
        self.famous_books_path = os.path.join(backend_dir, 'famous_books.pkl')
        self.similarity_path = os.path.join(backend_dir, 'similarity_matrix.pkl')
        
        self.popular_list: List[Dict[str, Any]] = []
        self.books_metadata: Dict[str, Dict[str, Any]] = {}
        self.famous_books: List[str] = []
        self.similarity_matrix: Dict[str, List] = {}
        
        self._load_artifacts()

    def _load_artifacts(self):
        if not (os.path.exists(self.popular_path) and os.path.exists(self.books_path) and 
                os.path.exists(self.famous_books_path) and os.path.exists(self.similarity_path)):
            raise FileNotFoundError("Preprocessed pickle artifacts not found. Run preprocess.py first.")
            
        with open(self.popular_path, 'rb') as f:
            self.popular_list = pickle.load(f)
            
        with open(self.books_path, 'rb') as f:
            self.books_metadata = pickle.load(f)
            
        with open(self.famous_books_path, 'rb') as f:
            self.famous_books = pickle.load(f)
            
        with open(self.similarity_path, 'rb') as f:
            self.similarity_matrix = pickle.load(f)
            
        print("Recommender engine artifacts loaded successfully!")

    def get_popular_books(self, limit=50) -> List[Dict[str, Any]]:
        return self.popular_list[:limit]

    def search_book_titles(self, query: str, limit=10) -> List[str]:
        if not query:
            return []
        
        query_lower = query.strip().lower()
        
        # Priority 1: Famous books matching query
        famous_matches = [t for t in self.famous_books if query_lower in t.lower()]
        
        # Priority 2: Other metadata books matching query
        other_matches = []
        if len(famous_matches) < limit:
            other_matches = [t for t in self.books_metadata.keys() if query_lower in t.lower() and t not in famous_matches]
            
        combined = famous_matches + other_matches
        
        # Sort matches by prefix match priority & length
        combined = sorted(combined, key=lambda x: (not x.lower().startswith(query_lower), len(x)))
        return combined[:limit]

    def _get_book_metadata(self, title: str) -> Dict[str, Any]:
        if title in self.books_metadata:
            meta = self.books_metadata[title]
            return {
                "title": meta.get("title", title),
                "author": meta.get("author", "Unknown Author"),
                "publisher": meta.get("publisher", "Unknown Publisher"),
                "year": meta.get("year", "N/A"),
                "image": meta.get("image", "")
            }
        return {
            "title": title,
            "author": "Unknown Author",
            "publisher": "Unknown Publisher",
            "year": "N/A",
            "image": ""
        }

    def recommend(self, book_name: str, top_n=5) -> Dict[str, Any]:
        if not self.similarity_matrix:
            return {"status": "error", "message": "Recommender matrix not initialized"}

        book_name_str = str(book_name).strip()

        # Match exact title (case-insensitive)
        matched_title = None
        for title in self.famous_books:
            if title.lower() == book_name_str.lower():
                matched_title = title
                break
                
        # Substring match if exact match fails
        if not matched_title:
            for title in self.famous_books:
                if book_name_str.lower() in title.lower():
                    matched_title = title
                    break

        if not matched_title:
            return {
                "status": "not_found",
                "message": f"Book '{book_name}' not found in collaborative filtering matrix. Please select from search autocomplete.",
                "recommendations": []
            }

        # Fetch precomputed similarities (list of (title, score))
        similar_items = self.similarity_matrix.get(matched_title, [])
        
        # Filter out the query book itself
        filtered_items = [item for item in similar_items if item[0].lower() != matched_title.lower()]
        
        # Find max similarity score among recommendations for relative scaling
        max_score = filtered_items[0][1] if filtered_items and filtered_items[0][1] > 0 else 1.0
        
        recommendations = []
        for rec_title, score in filtered_items:
            meta = self._get_book_metadata(rec_title)
            
            # Raw Cosine Similarity (e.g. 0.237)
            meta['raw_score'] = round(float(score), 4)
            
            # Scaled Compatibility Match Percentage (Netflix / Spotify style scaling)
            # Maps highest similarity in candidate list to ~95-98% match
            if max_score > 0:
                relative_ratio = score / max_score
                match_pct = round(70 + (relative_ratio * 28), 1)
            else:
                match_pct = 70.0
                
            meta['similarity_score'] = min(98.5, max(65.0, match_pct))
            recommendations.append(meta)
            
            if len(recommendations) >= top_n:
                break

        return {
            "status": "success",
            "query_book": self._get_book_metadata(matched_title),
            "recommendations": recommendations
        }
