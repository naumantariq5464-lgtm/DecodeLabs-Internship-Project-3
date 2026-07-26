import os
import csv
import math
import pickle
from collections import defaultdict

def preprocess_and_train():
    backend_dir = os.path.dirname(__file__)
    dataset_dir = os.path.join(backend_dir, 'dataset')
    
    books_path = os.path.join(dataset_dir, 'Books.csv')
    ratings_path = os.path.join(dataset_dir, 'Ratings.csv')

    print("Step 1: Loading Books dataset...")
    isbn_to_title = {}
    books_metadata = {}
    
    with open(books_path, mode='r', encoding='utf-8', errors='replace') as f:
        reader = csv.reader(f)
        header = next(reader, None)
        # Header: ['ISBN', 'Book-Title', 'Book-Author', 'Year-Of-Publication', 'Publisher', 'Image-URL-S', 'Image-URL-M', 'Image-URL-L']
        for row in reader:
            if len(row) >= 7:
                isbn = row[0].strip()
                title = row[1].strip()
                author = row[2].strip()
                year = row[3].strip()
                publisher = row[4].strip()
                image_m = row[6].strip()

                if title and title not in books_metadata:
                    books_metadata[title] = {
                        "title": title,
                        "author": author,
                        "publisher": publisher,
                        "year": year,
                        "image": image_m
                    }
                isbn_to_title[isbn] = title

    print(f"Loaded {len(books_metadata)} unique books.")

    print("Step 2: Processing Ratings dataset...")
    user_rating_count = defaultdict(int)
    book_all_ratings = defaultdict(list)
    ratings_data = [] # (user_id, book_title, rating)

    with open(ratings_path, mode='r', encoding='utf-8', errors='replace') as f:
        reader = csv.reader(f)
        header = next(reader, None)
        # Header: ['User-ID', 'ISBN', 'Book-Rating']
        for row in reader:
            if len(row) >= 3:
                user_id = row[0].strip()
                isbn = row[1].strip()
                try:
                    rating = float(row[2].strip())
                except ValueError:
                    continue

                if isbn in isbn_to_title:
                    title = isbn_to_title[isbn]
                    user_rating_count[user_id] += 1
                    book_all_ratings[title].append(rating)
                    ratings_data.append((user_id, title, rating))

    print(f"Loaded {len(ratings_data)} valid ratings across {len(user_rating_count)} users.")

    # Calculate Top Popular Books (min 250 ratings)
    print("Step 3: Calculating Popular Books...")
    popular_list = []
    for title, ratings in book_all_ratings.items():
        if len(ratings) >= 250:
            avg_rating = round(sum(ratings) / len(ratings), 2)
            meta = books_metadata.get(title, {
                "title": title, "author": "Unknown", "publisher": "Unknown", "year": "", "image": ""
            })
            popular_list.append({
                "title": title,
                "author": meta['author'],
                "publisher": meta['publisher'],
                "year": meta['year'],
                "image": meta['image'],
                "num_ratings": len(ratings),
                "avg_rating": avg_rating
            })

    popular_list = sorted(popular_list, key=lambda x: x['avg_rating'], reverse=True)[:50]
    print(f"Generated top {len(popular_list)} popular books.")

    # Collaborative Filtering Matrix Construction
    print("Step 4: Filtering Active Users (> 200 ratings) & Famous Books (>= 50 ratings)...")
    active_users = set(u for u, count in user_rating_count.items() if count > 200)
    print(f"Active users count (> 200 ratings): {len(active_users)}")

    # Filter ratings by active users
    active_user_ratings = [r for r in ratings_data if r[0] in active_users]

    # Count book ratings from active users
    famous_book_counts = defaultdict(int)
    for user_id, title, rating in active_user_ratings:
        famous_book_counts[title] += 1

    famous_books = set(title for title, count in famous_book_counts.items() if count >= 50)
    print(f"Famous books count (>= 50 active user ratings): {len(famous_books)}")

    # Construct Book Rating Vectors across Active Users
    famous_book_list = sorted(list(famous_books))
    active_user_list = sorted(list(active_users))
    user_to_idx = {u: i for i, u in enumerate(active_user_list)}

    book_vectors = {title: [0.0] * len(active_user_list) for title in famous_book_list}
    for user_id, title, rating in active_user_ratings:
        if title in famous_books:
            u_idx = user_to_idx[user_id]
            book_vectors[title][u_idx] = rating

    # Precompute Vector Norms
    book_norms = {}
    for title, vec in book_vectors.items():
        sq_sum = sum(v * v for v in vec)
        book_norms[title] = math.sqrt(sq_sum) if sq_sum > 0 else 0.0

    print("Step 5: Computing Cosine Similarity Matrix...")
    similarity_matrix = {}
    N = len(famous_book_list)

    for i in range(N):
        b1 = famous_book_list[i]
        v1 = book_vectors[b1]
        norm1 = book_norms[b1]
        similarity_matrix[b1] = []

        for j in range(N):
            b2 = famous_book_list[j]
            if i == j:
                similarity_matrix[b1].append((b2, 1.0))
                continue
            
            norm2 = book_norms[b2]
            if norm1 == 0 or norm2 == 0:
                similarity_matrix[b1].append((b2, 0.0))
                continue

            v2 = book_vectors[b2]
            dot_product = sum(x * y for x, y in zip(v1, v2) if x > 0 and y > 0)
            sim_score = dot_product / (norm1 * norm2)
            similarity_matrix[b1].append((b2, sim_score))

        # Sort similarities for each book descending
        similarity_matrix[b1] = sorted(similarity_matrix[b1], key=lambda x: x[1], reverse=True)

    print("Step 6: Saving Pickle Artifacts...")
    with open(os.path.join(backend_dir, 'popular.pkl'), 'wb') as f:
        pickle.dump(popular_list, f)

    with open(os.path.join(backend_dir, 'books.pkl'), 'wb') as f:
        pickle.dump(books_metadata, f)

    with open(os.path.join(backend_dir, 'famous_books.pkl'), 'wb') as f:
        pickle.dump(famous_book_list, f)

    with open(os.path.join(backend_dir, 'similarity_matrix.pkl'), 'wb') as f:
        pickle.dump(similarity_matrix, f)

    print("All backend recommendation artifacts built successfully!")

if __name__ == '__main__':
    preprocess_and_train()
