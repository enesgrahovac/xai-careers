import * as cheerio from 'cheerio';

function htmlToText(html: string): string {
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, noscript').remove();

    // Replace headings with proper formatting
    $('h1, h2, h3, h4, h5, h6').each(function () {
        const text = $(this).text().trim();
        if (text) {
            $(this).replaceWith('\n\n' + text + '\n\n');
        }
    });

    // Replace paragraphs and divs with line breaks
    $('p, div').each(function () {
        const text = $(this).text().trim();
        if (text) {
            $(this).replaceWith('\n\n' + text + '\n\n');
        }
    });

    // Replace line breaks
    $('br').replaceWith('\n');

    // Handle list items
    $('li').each(function () {
        const text = $(this).text().trim();
        if (text) {
            $(this).replaceWith('\n• ' + text);
        }
    });

    // Handle lists
    $('ul, ol').each(function () {
        $(this).after('\n');
    });

    // Get the text content
    const text = $.text();

    // Clean up whitespace and formatting
    return text
        .replace(/\s+/g, ' ')           // Replace multiple whitespace with single space
        .replace(/\n\s+/g, '\n')        // Remove spaces after newlines
        .replace(/\s+\n/g, '\n')        // Remove spaces before newlines
        .replace(/\n{3,}/g, '\n\n')     // Replace 3+ newlines with 2
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n')
        .trim();
}

export function extractCoreDescription(html: string): string {
    // Load HTML and remove unwanted elements
    const $ = cheerio.load(html);

    // Strip the generic intro block
    $('div.content-intro').remove();

    // Convert the cleaned HTML to properly formatted plain text
    const text = htmlToText($.html() || '');

    // If an 'About xAI' header exists, move start to the next header (h3/h2)
    const aboutHeader = $('h3,h2').filter((_, el) => $(el).text().toLowerCase().includes('about xai')).first();
    let skipUntilText: string | null = null;
    if (aboutHeader.length) {
        const nextHeader = aboutHeader.nextAll('h3,h2').first();
        if (nextHeader.length) {
            skipUntilText = nextHeader.text();
        }
    }

    const lower = text.toLowerCase();
    const startPhrase = 'about the role';
    const genericIntro = 'about xai';
    const endPhrase = 'annual salary range';

    // -------- Determine start index ---------
    let start = 0;

    const startRoleIdx = lower.indexOf(startPhrase);
    if (startRoleIdx !== -1) {
        start = startRoleIdx;
    } else {
        // If there's an About xAI intro, skip past it to next meaningful header
        const introIdx = lower.indexOf(genericIntro);
        if (introIdx !== -1) {
            if (skipUntilText) {
                const pos = lower.indexOf(skipUntilText.toLowerCase(), introIdx + genericIntro.length);
                if (pos !== -1) {
                    start = pos;
                }
            } else {
                start = introIdx + genericIntro.length;
            }
        }
    }

    // ensure start is within bounds
    if (start < 0 || start >= text.length) start = 0;

    const endIndex = lower.indexOf(endPhrase);
    let end: number;
    if (endIndex === -1) {
        end = text.length;
    } else {
        // include the following non-empty line (usually the salary figure)
        const sliceAfter = text.slice(endIndex);
        const firstNl = sliceAfter.indexOf('\n');
        if (firstNl === -1) {
            end = text.length;
        } else {
            // find next newline after first non-empty line
            const afterFirst = sliceAfter.slice(firstNl + 1);
            const secondNl = afterFirst.indexOf('\n');
            end = endIndex + (secondNl === -1 ? sliceAfter.length : firstNl + 1 + secondNl);
        }
    }

    // But stop earlier if we hit content-conclusion section
    const conclIdx = lower.indexOf('content-conclusion');
    if (conclIdx !== -1 && conclIdx > start && conclIdx < end) {
        end = conclIdx;
    }

    return text.slice(start, end).trim();
} 