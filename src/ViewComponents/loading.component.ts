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

export class LoadingComponent {
    private message: string;
    private size: 'small' | 'medium' | 'large';
    private showMessage: boolean;

    constructor(message: string = 'Loading...', options: { size?: 'small' | 'medium' | 'large'; showMessage?: boolean } = {}) {
        this.message = message;
        this.size = options.size || 'medium';
        this.showMessage = options.showMessage !== false;
    }

    render(): string {
        const sizeStyles = {
            small: { loaderSize: '20px', fontSize: '14px', marginBottom: '10px' },
            medium: { loaderSize: '40px', fontSize: '16px', marginBottom: '20px' },
            large: { loaderSize: '60px', fontSize: '18px', marginBottom: '25px' }
        };

        const style = sizeStyles[this.size];

        return `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <div class="ui active inline loader" style="margin-bottom: ${style.marginBottom};"></div>
                ${this.showMessage ? `<p style="margin: 0; color: #666; font-size: ${style.fontSize};">${this.message}</p>` : ''}
            </div>
        `;
    }

    static render(message: string = 'Loading...', options: { size?: 'small' | 'medium' | 'large'; showMessage?: boolean } = {}): string {
        const component = new LoadingComponent(message, options);
        return component.render();
    }
}