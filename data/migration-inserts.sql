-- Migration data inserts

-- Insert users
INSERT OR REPLACE INTO users (id, email, display_name, subscription_status) VALUES ('user_1', 'user1@example.com', 'Usuário 1', 'premium');
INSERT OR REPLACE INTO users (id, email, display_name, subscription_status) VALUES ('user_2', 'user2@example.com', 'Usuário 2', 'free');

-- Insert products
INSERT OR REPLACE INTO products (id, name, price, type, category, active) VALUES ('prod_1', 'Video Premium 1', 29.99, 'video', 'exclusivo', 1);
INSERT OR REPLACE INTO products (id, name, price, type, category, active) VALUES ('prod_2', 'Foto Set 1', 19.99, 'photo', 'fotos', 1);

-- Insert conversations
INSERT OR REPLACE INTO conversations (id, user_id, title, type) VALUES ('conv_1', 'user_1', 'Chat Secreto', 'secret');

-- Insert page views
INSERT OR REPLACE INTO page_views (path, count) VALUES ('/videos', 1250);
INSERT OR REPLACE INTO page_views (path, count) VALUES ('/fotos', 890);
INSERT OR REPLACE INTO page_views (path, count) VALUES ('/chat-secreto', 650);
