export class URLShaper {
  getShape(url: string): string {
    try {
      const urlObj = new URL(url);
      let path = urlObj.pathname;

      path = path.replace(/\/\d+/g, '/:id');
      path = path.replace(/\/[a-z0-9-]{20,}/gi, '/:slug');
      path = path.replace(/\/page\/\d+/g, '/page/:num');
      path = path.replace(/\?.*$/, '');
      
      if (path.endsWith('/') && path.length > 1) {
        path = path.slice(0, -1);
      }

      return `${urlObj.hostname}${path}`;
    } catch {
      return url;
    }
  }

  hasQueryParams(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.search.length > 0;
    } catch {
      return false;
    }
  }

  hasTrackingParams(url: string): boolean {
    const trackingParams = ['utm_', 'gclid', 'fbclid', 'msclkid', '_ga', 'mc_', 'ref'];
    try {
      const urlObj = new URL(url);
      const params = urlObj.searchParams;
      for (const key of params.keys()) {
        if (trackingParams.some(tp => key.startsWith(tp))) {
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  isPagination(url: string): boolean {
    const paginationPatterns = [
      /\/page\/\d+/i,
      /[?&]page=\d+/i,
      /[?&]p=\d+/i,
      /\/p\d+/i,
    ];
    return paginationPatterns.some(pattern => pattern.test(url));
  }

  isFilter(url: string): boolean {
    const filterPatterns = [
      /[?&]filter/i,
      /[?&]sort/i,
      /[?&]category/i,
      /[?&]tag/i,
    ];
    return filterPatterns.some(pattern => pattern.test(url));
  }
}
