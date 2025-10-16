/**
 * Blog functionality for Ryan Lingo Portfolio
 * Handles dynamic post loading, filtering, and navigation
 */

class BlogManager {
    constructor() {
        this.posts = [];
        this.filteredPosts = [];
        this.currentFilter = 'all';
        this.init();
    }

    async init() {
        try {
            await this.loadPosts();
            this.renderPosts();
            this.setupEventListeners();
        } catch (error) {
            console.error('Error initializing blog:', error);
            this.showError('Unable to load blog posts at this time.');
        }
    }

    async loadPosts() {
        const response = await fetch('./posts.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        this.posts = data.posts;
        this.filteredPosts = [...this.posts];
    }

    renderPosts() {
        const blogGrid = document.getElementById('blog-grid');
        if (!blogGrid) return;

        blogGrid.innerHTML = '';

        if (this.filteredPosts.length === 0) {
            blogGrid.innerHTML = '<p style="color: #999; text-align: center; grid-column: 1 / -1;">No posts found matching your criteria.</p>';
            return;
        }

        this.filteredPosts.forEach(post => {
            const postCard = this.createPostCard(post);
            blogGrid.appendChild(postCard);
        });
    }

    createPostCard(post) {
        const postCard = document.createElement('div');
        postCard.className = 'blog-card';
        
        const formattedDate = new Date(post.date + 'T12:00:00').toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        postCard.innerHTML = `
            <article>
                <div class="blog-card-header">
                    <h2><a href="./posts/${post.id}.html" class="post-title-link">${post.title}</a></h2>
                    <div class="blog-meta">
                        <time datetime="${post.date}" class="blog-date">${formattedDate}</time>
                        <span class="blog-category">${post.category}</span>
                        <span>${post.readTime}</span>
                    </div>
                </div>
                <p class="blog-excerpt">${post.excerpt}</p>
                <div class="blog-tags" role="list" aria-label="Post tags">
                    ${post.tags.map(tag => `<span class="blog-tag" role="listitem">${tag}</span>`).join('')}
                </div>
                <a href="./posts/${post.id}.html" class="read-more-btn" aria-label="Read more about ${post.title}">Read More</a>
            </article>
        `;

        return postCard;
    }

    filterPosts(category) {
        this.currentFilter = category;
        
        if (category === 'all') {
            this.filteredPosts = [...this.posts];
        } else {
            this.filteredPosts = this.posts.filter(post => 
                post.category.toLowerCase() === category.toLowerCase() ||
                post.tags.some(tag => tag.toLowerCase() === category.toLowerCase())
            );
        }
        
        this.renderPosts();
        this.updateFilterButtons();
    }

    updateFilterButtons() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === this.currentFilter) {
                btn.classList.add('active');
            }
        });
    }

    setupEventListeners() {
        // Filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.filterPosts(btn.dataset.filter);
            });
        });

        // Search functionality (if search input exists)
        const searchInput = document.getElementById('blog-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchPosts(e.target.value);
            });
        }
    }

    searchPosts(query) {
        const searchTerm = query.toLowerCase().trim();
        
        if (searchTerm === '') {
            this.filteredPosts = [...this.posts];
        } else {
            this.filteredPosts = this.posts.filter(post => 
                post.title.toLowerCase().includes(searchTerm) ||
                post.excerpt.toLowerCase().includes(searchTerm) ||
                post.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }
        
        this.renderPosts();
    }

    showError(message) {
        const blogGrid = document.getElementById('blog-grid');
        if (blogGrid) {
            blogGrid.innerHTML = `<p style="color: #f44336; text-align: center; grid-column: 1 / -1;">${message}</p>`;
        }
    }

    // Utility method to get all unique categories
    getCategories() {
        const categories = new Set();
        this.posts.forEach(post => {
            categories.add(post.category);
            post.tags.forEach(tag => categories.add(tag));
        });
        return Array.from(categories).sort();
    }

    // Utility method to get posts by category
    getPostsByCategory(category) {
        return this.posts.filter(post => 
            post.category.toLowerCase() === category.toLowerCase() ||
            post.tags.some(tag => tag.toLowerCase() === category.toLowerCase())
        );
    }
}

// Initialize blog manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're on a blog page
    if (document.getElementById('blog-grid')) {
        window.blogManager = new BlogManager();
    }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlogManager;
}