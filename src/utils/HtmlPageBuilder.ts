/*
 * Copyright (c) 2026 Cloud CZR LLC
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
/**
 * Utility for building HTML pages with consistent structure
 */
export class HtmlPageBuilder {
    /**
     * Wrap a template/content in a complete HTML page
     */
    static build(content: string, title: string = 'Page'): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/semantic-ui@2.4.2/dist/semantic.min.css">
    <style>
        body {
            margin: 0;
            background-color: #f8f9fa;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }
        :host {
            display: block;
            width: 100%;
        }
    </style>
</head>
<body>
    ${content}
</body>
</html>`;
    }

    /**
     * Build error page
     */
    static buildError(errorMessage: string, errorStack?: string): string {
        const stackHtml = errorStack ? `
        <div style="margin-top: 20px;">
            <strong>Stack Trace:</strong>
            <pre style="white-space: pre-wrap; word-wrap: break-word; font-size: 12px; background-color: #f8f9fa; padding: 10px; border-radius: 4px;">${this.escapeHtml(errorStack)}</pre>
        </div>` : '';

        const content = `
    <div class="ui negative message">
        <div class="header">Error Loading Data</div>
        <p>${this.escapeHtml(errorMessage)}</p>
        ${stackHtml}
    </div>`;

        return this.build(content, 'Error');
    }

    /**
     * Escape HTML entities
     */
    private static escapeHtml(text: string | undefined | null): string {
        if (!text) return '';
        const map: { [key: string]: string } = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, (m) => map[m]);
    }
}
