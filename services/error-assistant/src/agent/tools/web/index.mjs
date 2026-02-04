/**
 * Web search tool - performs web searches (simplified, no full browser)
 * Uses DuckDuckGo HTML scraping or API
 */

/**
 * Web search tool - searches the web
 */
export const webSearchTool = {
  name: 'web_search',
  signature: 'web_search <query>',
  docstring: 'searches the web for the given query and returns relevant results',
  arguments: [
    {
      name: 'query',
      type: 'string',
      description: 'the search query',
      required: true,
    },
  ],
  async execute(env, args) {
    const query = args.query;
    
    try {
      // Simple implementation using DuckDuckGo HTML
      // For production, consider using a proper API like SerpAPI or Google Custom Search
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });
      
      if (!response.ok) {
        return `Error performing web search: HTTP ${response.status}`;
      }
      
      const html = await response.text();
      
      // Simple HTML parsing to extract results
      // This is a basic implementation - for production, use a proper HTML parser
      const results = [];
      const linkRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g;
      const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>([^<]*)<\/a>/g;
      
      let match;
      const links = [];
      while ((match = linkRegex.exec(html)) !== null) {
        links.push({ url: match[1], title: match[2] });
      }
      
      const snippets = [];
      while ((match = snippetRegex.exec(html)) !== null) {
        snippets.push(match[1]);
      }
      
      // Combine links and snippets (limit to top 5)
      const topResults = links.slice(0, 5).map((link, i) => {
        return {
          title: link.title,
          url: link.url,
          snippet: snippets[i] || '',
        };
      });
      
      if (topResults.length === 0) {
        return `No results found for "${query}"`;
      }
      
      // Format results
      const formatted = topResults.map((result, i) => {
        return `${i + 1}. ${result.title}\n   ${result.url}\n   ${result.snippet}`;
      }).join('\n\n');
      
      return `Web search results for "${query}":\n\n${formatted}`;
    } catch (err) {
      return `Error performing web search: ${err.message}`;
    }
  },
};
