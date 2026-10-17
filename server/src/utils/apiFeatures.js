/**
 * Utility for parsing and sanitizing HTTP query parameters for pagination, sorting, and search specifications.
 * Decoupled from ORM-specific query objects to maintain Clean Architecture.
 */
export class ApiFeatures {
    constructor(query = {}, config = {}) {
        this.query = query;
        this.defaultPage = config.defaultPage || 1;
        this.defaultLimit = config.defaultLimit || 10;
        this.maxLimit = config.maxLimit || 100;
        this.sortableFields = config.sortableFields || ["createdAt"];
        this.defaultSort = config.defaultSort || "latest";
    }

    parsePagination() {
        const rawPage = parseInt(this.query.page, 10);
        const rawLimit = parseInt(this.query.limit, 10);

        const page = !isNaN(rawPage) && rawPage > 0 ? rawPage : this.defaultPage;
        const limit = !isNaN(rawLimit) && rawLimit > 0 
            ? Math.min(rawLimit, this.maxLimit) 
            : this.defaultLimit;

        const skip = (page - 1) * limit;

        return { page, limit, skip };
    }

    parseSearch() {
        if (!this.query.search || typeof this.query.search !== "string") {
            return { search: null, keywords: [] };
        }

        const trimmed = this.query.search.trim();
        if (!trimmed) {
            return { search: null, keywords: [] };
        }

        const keywords = trimmed.split(/\s+/).slice(0, 5); // Limit keywords to max 5 to prevent DB query explosion
        return { search: trimmed, keywords };
    }

    parseSort() {
        const sort = typeof this.query.sort === "string" ? this.query.sort.trim() : this.defaultSort;
        return { sort };
    }

    build() {
        const pagination = this.parsePagination();
        const search = this.parseSearch();
        const sorting = this.parseSort();

        return {
            ...pagination,
            ...search,
            ...sorting,
            filters: { ...this.query }
        };
    }
}